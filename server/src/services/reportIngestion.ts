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

    const normalizedDeviceSerial = deviceSerial.trim();

    if (!normalizedDeviceSerial) {
        throw new Error("Device serial is required");
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

    /*
     * Check whether this device already has an active
     * customer-facing report.
     *
     * Device serial comparison is case-insensitive and
     * ignores leading/trailing spaces.
     *
     * The oldest matching row is treated as the permanent
     * customer record so its public_id / QR URL is preserved.
     */
    const existingResult = await pool.query<ExistingReport>(
        `
        SELECT
            id,
            public_id,
            filename,
            blob_path
        FROM reports
        WHERE LOWER(BTRIM(device_serial)) = LOWER(BTRIM($1))
          AND active = true
        ORDER BY created_at ASC
        LIMIT 1
        `,
        [normalizedDeviceSerial]
    );

    const existingReport = existingResult.rows[0];

    /*
     * EXISTING REPORT
     *
     * Example:
     *
     * CG71141582_Rev0.pdf
     *      ↓
     * CG71141582_Rev1.pdf
     *
     * Keep the same public_id and therefore the same
     * permanent customer URL.
     */
    if (existingReport) {
        const publicId = existingReport.public_id;

        const incomingRevision =
            getRevisionNumber(fileName);

        const currentRevision =
            getRevisionNumber(existingReport.filename);

        /*
         * Prevent an older revision from replacing
         * a newer revision.
         *
         * Equal revisions ARE allowed so the same revision
         * can be regenerated if necessary.
         */
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

        /*
         * Upload the new/re-generated PDF.
         *
         * upsert=true also allows regeneration of the
         * exact same revision/filename.
         */
        const { error: uploadError } =
            await supabase.storage
                .from("reports")
                .upload(blobPath, pdfBuffer, {
                    contentType: "application/pdf",
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
                    device_serial = $1,
                    sales_order = $2,
                    status = $3,
                    filename = $4,
                    blob_path = $5
                WHERE id = $6
                `,
                [
                    normalizedDeviceSerial,
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
             * If the new revision used a different storage
             * path but the database update failed, remove the
             * newly uploaded PDF so we don't leave an orphan.
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
         * The database now points to the newest PDF.
         *
         * Remove the previous revision from Supabase Storage.
         *
         * Example:
         *
         * Delete:
         * CG71141582_Rev0.pdf
         *
         * Keep:
         * CG71141582_Rev1.pdf
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
                /*
                 * Don't break the successful revision update
                 * just because cleanup of the old PDF failed.
                 */
                console.warn(
                    "Old PDF cleanup failed:",
                    removeError.message
                );
            }
        }

        return {
            publicId,
            publicUrl: `${publicSiteUrl}/r/${publicId}`,
            message: "Report revision updated successfully",
        };
    }

    /*
     * NEW REPORT
     *
     * No active report exists for this device serial,
     * so create its permanent public ID.
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
                normalizedDeviceSerial,
                salesOrder,
                status,
                fileName,
                blobPath,
            ]
        );
    } catch (databaseError) {
        /*
         * If the database insert fails, remove the PDF
         * that was just uploaded.
         */
        await supabase.storage
            .from("reports")
            .remove([blobPath]);

        throw databaseError;
    }

    return {
        publicId,
        publicUrl: `${publicSiteUrl}/r/${publicId}`,
        message: "Report uploaded successfully",
    };
}