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
    id: string | number;
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
        throw new Error(
            "PUBLIC_SITE_URL is not configured"
        );
    }

    /*
     * Prefer the device serial parsed from:
     *
     * ABC123_Rev0.pdf
     * ABC123_Rev1.pdf
     *
     * → ABC123
     */
    const fileSerialMatch =
        fileName.match(/^(.*?)_Rev\d+\.pdf$/i);

    const normalizedDeviceSerial =
        fileSerialMatch?.[1]?.trim() ||
        deviceSerial.trim();

    console.log("INGEST DEBUG:", {
        deviceSerial,
        fileName,
        fileSerialMatch:
            fileSerialMatch?.[1] ?? null,
        normalizedDeviceSerial,
    });

    if (!normalizedDeviceSerial) {
        throw new Error(
            "Device serial is required"
        );
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
        throw new Error(
            "PDF file is empty"
        );
    }

    /*
     * Get ALL active reports for this device.
     *
     * The oldest row becomes the permanent/canonical
     * customer record because it owns the original
     * publicId / QR URL.
     *
     * Any additional rows are accidental duplicates
     * that can be cleaned up after a successful update.
     */
    const existingResult =
        await pool.query<ExistingReport>(
            `
            SELECT
                id,
                public_id,
                filename,
                blob_path
            FROM reports
            WHERE LOWER(BTRIM(device_serial))
                = LOWER(BTRIM($1))
              AND active = true
            ORDER BY created_at ASC
            `,
            [normalizedDeviceSerial]
        );

    const existingReports =
        existingResult.rows;

    const existingReport =
        existingReports[0];

    const duplicateReports =
        existingReports.slice(1);

    console.log(
        "EXISTING REPORT DEBUG:",
        existingReport ?? "NONE FOUND"
    );

    console.log(
        "DUPLICATE REPORT COUNT:",
        duplicateReports.length
    );

    /*
     * EXISTING REPORT
     */
    if (existingReport) {
        const publicId =
            existingReport.public_id;

        const incomingRevision =
            getRevisionNumber(fileName);

        /*
         * Look at every existing row, including any
         * accidental duplicate records, and determine
         * the highest revision currently known.
         */
        const existingRevisions =
            existingReports
                .map((report) =>
                    getRevisionNumber(
                        report.filename
                    )
                )
                .filter(
                    (
                        revision
                    ): revision is number =>
                        revision !== null
                );

        const highestExistingRevision =
            existingRevisions.length > 0
                ? Math.max(
                      ...existingRevisions
                  )
                : null;

        /*
         * Never allow an older revision to replace
         * a newer one.
         *
         * Equal revisions are allowed so the same
         * revision can be regenerated.
         */
        if (
            incomingRevision !== null &&
            highestExistingRevision !== null &&
            incomingRevision <
                highestExistingRevision
        ) {
            return {
                publicId,
                publicUrl:
                    `${publicSiteUrl}/r/${publicId}`,
                message:
                    `Older revision ignored. ` +
                    `Latest revision is Rev${highestExistingRevision}.`,
            };
        }

        /*
         * Store the new revision under the ORIGINAL
         * permanent publicId.
         */
        const blobPath =
            `${publicId}/${safeFileName}`;

        const { error: uploadError } =
            await supabase.storage
                .from("reports")
                .upload(
                    blobPath,
                    pdfBuffer,
                    {
                        contentType:
                            "application/pdf",
                        upsert: true,
                    }
                );

        if (uploadError) {
            throw new Error(
                `PDF upload failed: ${uploadError.message}`
            );
        }

        /*
         * Update the original/canonical database row.
         */
        try {
            const updateResult =
                await pool.query(
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

            if (
                updateResult.rowCount !== 1
            ) {
                throw new Error(
                    "Existing report could not be updated"
                );
            }
        } catch (databaseError) {
            /*
             * If DB update fails after uploading a
             * brand-new storage path, remove that
             * newly uploaded object.
             */
            if (
                existingReport.blob_path !==
                blobPath
            ) {
                await supabase.storage
                    .from("reports")
                    .remove([
                        blobPath,
                    ]);
            }

            throw databaseError;
        }

        /*
         * Remove the previous canonical revision.
         *
         * Example:
         *
         * Rev5 arrives
         * → database now points to Rev5
         * → remove Rev4
         */
        if (
            existingReport.blob_path &&
            existingReport.blob_path !==
                blobPath
        ) {
            const { error: removeError } =
                await supabase.storage
                    .from("reports")
                    .remove([
                        existingReport.blob_path,
                    ]);

            if (removeError) {
                console.warn(
                    "Old PDF cleanup failed:",
                    removeError.message
                );
            }
        }

        /*
         * SELF-HEAL ACCIDENTAL DUPLICATES
         *
         * Preserve the oldest/original row.
         *
         * Mark every newer duplicate inactive so
         * customers/employees no longer see them.
         */
        if (
            duplicateReports.length > 0
        ) {
            const duplicateIds =
                duplicateReports.map(
                    (report) =>
                        report.id
                );

            await pool.query(
                `
                UPDATE reports
                SET active = false
                WHERE id =
                    ANY($1::bigint[])
                `,
                [duplicateIds]
            );

            /*
             * Remove the duplicate PDFs from Storage.
             *
             * Never remove the new canonical blobPath.
             */
            const duplicateBlobPaths =
                duplicateReports
                    .map(
                        (report) =>
                            report.blob_path
                    )
                    .filter(
                        (
                            path
                        ): path is string =>
                            Boolean(path) &&
                            path !== blobPath
                    );

            if (
                duplicateBlobPaths.length >
                0
            ) {
                const {
                    error:
                        duplicateCleanupError,
                } =
                    await supabase.storage
                        .from("reports")
                        .remove(
                            duplicateBlobPaths
                        );

                if (
                    duplicateCleanupError
                ) {
                    console.warn(
                        "Duplicate PDF cleanup failed:",
                        duplicateCleanupError.message
                    );
                }
            }

            console.log(
                `Cleaned up ${duplicateReports.length} duplicate report record(s)`
            );
        }

        return {
            publicId,
            publicUrl:
                `${publicSiteUrl}/r/${publicId}`,
            message:
                duplicateReports.length > 0
                    ? `Report revision updated successfully; cleaned up ${duplicateReports.length} duplicate report(s)`
                    : "Report revision updated successfully",
        };
    }

    /*
     * NEW REPORT
     *
     * No active record exists for this device,
     * so create its permanent publicId.
     */
    const publicId =
        crypto.randomUUID();

    const blobPath =
        `${publicId}/${safeFileName}`;

    const { error: uploadError } =
        await supabase.storage
            .from("reports")
            .upload(
                blobPath,
                pdfBuffer,
                {
                    contentType:
                        "application/pdf",
                    upsert: false,
                }
            );

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
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
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
        await supabase.storage
            .from("reports")
            .remove([
                blobPath,
            ]);

        throw databaseError;
    }

    return {
        publicId,
        publicUrl:
            `${publicSiteUrl}/r/${publicId}`,
        message:
            "Report uploaded successfully",
    };
}