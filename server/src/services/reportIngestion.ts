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

    const publicId = crypto.randomUUID();

    const safeFileName = fileName.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
    );

    const blobPath = `${publicId}/${safeFileName}`;

    const pdfBuffer = Buffer.from(
        fileContentBase64,
        "base64"
    );

    if (pdfBuffer.length === 0) {
        throw new Error("PDF file is empty");
    }

    const { error: uploadError } = await supabase.storage
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
        publicUrl: `${publicSiteUrl}/r/${publicId}`,
        message: "Report uploaded successfully",
    };
}