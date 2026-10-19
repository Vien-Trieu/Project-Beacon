import crypto from "crypto";
import { pool } from "./database.js";
import { supabase } from "./storage.js";

type ReportStatus = "Pass" | "Fail";

type IngestReportInput = {
    deviceSerial: string;
    salesOrder: string;
    status: ReportStatus;
    fileName: string;
    fileContentBase64: string;
};

type IngestReportResult = {
    publicId: string;
    publicUrl: string;
    message: string;
};

type ExistingReport = {
    id: number;
    public_id: string;
    filename: string;
    blob_path: string;
};

function getRevisionNumber(fileName: string): number | null {
    const match = fileName.match(/_Rev(\d+)\.pdf$/i);

    if (!match) {
        return null;
    }

    return Number.parseInt(match[1], 10);
}

export async function ingestReport({
    deviceSerial,
    salesOrder,
    status,
    fileName,
    fileContentBase64,
}: IngestReportInput): Promise<IngestReportResult> {
    const publicSiteUrl =
        process.env.PUBLIC_SITE_URL?.replace(/\/+$/, "");

    if (!publicSiteUrl) {
        throw new Error("PUBLIC_SITE_URL is not configured");
    }

    const safeFileName = fileName.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
    );

    const pdfBuffer = Buffer.from(
        fileContentBase64,
        "base64"
    );

    if (pdfBuffer.length === 0) {
        throw new Error("PDF file is empty");
    }

    // Check whether this device already has an active public report.
    const existingResult = await pool.query<ExistingReport>(
        `
        SELECT
            id,
            public_id,
            filename,
            blob_path
        FROM reports
        WHERE device_serial = $1
          AND active = true
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [deviceSerial]
    );

    const existingReport = existingResult.rows[0];

    /*
     * EXISTING REPORT
     *
     * Rev1, Rev2, Rev3, etc. update the existing record.
     * Most importantly, public_id remains unchanged,
     * so the customer's QR code / URL never changes.
     */
    if (existingReport) {
        const publicId = existingReport.public_id;

        const incomingRevision =
            getRevisionNumber(fileName);

        const currentRevision =
            getRevisionNumber(existingReport.filename);

        // Protect against an older revision replacing a newer one.
        if (
            incomingRevision !== null &&
            currentRevision !== null &&
            incomingRevision < currentRevision
        ) {
            return {
                publicId,
                publicUrl: `${publicSiteUrl}/r/${publicId}`,
                message:
                    `Older revision ignored. ` +
                    `Current revision is Rev${currentRevision}.`,
            };
        }

        const blobPath =
            `${publicId}/${safeFileName}`;

        const { error: uploadError } =
            await supabase.storage
                .from("reports")
                .upload(blobPath, pdfBuffer, {
                    contentType: "application/pdf",
                    // Allows regeneration of the same revision too.
                    upsert: true,
                });

        if (uploadError) {
            throw new Error(
                `PDF upload failed: ${uploadError.message}`
            );
        }

        try {
            const updateResult = await pool.query(
                `
                UPDATE reports
                SET
                    sales_order = $1,
                    status = $2,
                    filename = $3,
                    blob_path = $4
                WHERE id = $5
                `,
                [
                    salesOrder,
                    status,
                    fileName,
                    blobPath,
                    existingReport.id,
                ]
            );

            if (updateResult.rowCount !== 1) {
                throw new Error(
                    "Existing report could not be updated"
                );
            }
        } catch (databaseError) {
            /*
             * If this was a NEW storage path and the database
             * update failed, clean up the newly uploaded file.
             *
             * Do not remove it when the path is identical,
             * because that would also remove the existing report.
             */
            if (
                existingReport.blob_path !== blobPath
            ) {
                await supabase.storage
                    .from("reports")
                    .remove([blobPath]);
            }

            throw databaseError;
        }

        /*
         * Database now points at the new PDF.
         * The old storage object is no longer needed.
         */
        if (
            existingReport.blob_path &&
            existingReport.blob_path !== blobPath
        ) {
            const { error: removeError } =
                await supabase.storage
                    .from("reports")
                    .remove([
                        existingReport.blob_path,
                    ]);

            if (removeError) {
                // Don't fail the report update just because
                // cleanup of the old PDF failed.
                console.warn(
                    "Old PDF cleanup failed:",
                    removeError.message
                );
            }
        }

        return {
            publicId,
            publicUrl:
                `${publicSiteUrl}/r/${publicId}`,
            message:
                "Report revision updated successfully",
        };
    }

    /*
     * NEW REPORT
     *
     * No active report exists for this device serial,
     * so create a new permanent public ID.
     */
    const publicId = crypto.randomUUID();

    const blobPath =
        `${publicId}/${safeFileName}`;

    const { error: uploadError } =
        await supabase.storage
            .from("reports")
            .upload(blobPath, pdfBuffer, {
                contentType: "application/pdf",
                upsert: false,
            });

    if (uploadError) {
        throw new Error(
            `PDF upload failed: ${uploadError.message}`
        );
    }

    try {
        await pool.query(
            `
            INSERT INTO reports (
                public_id,
                device_serial,
                sales_order,
                status,
                filename,
                blob_path
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [
                publicId,
                deviceSerial,
                salesOrder,
                status,
                fileName,
                blobPath,
            ]
        );
    } catch (databaseError) {
        await supabase.storage
            .from("reports")
            .remove([blobPath]);

        throw databaseError;
    }

    return {
        publicId,
        publicUrl:
            `${publicSiteUrl}/r/${publicId}`,
        message: "Report uploaded successfully",
    };
}