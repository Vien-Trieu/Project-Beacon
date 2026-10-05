import { Router } from "express";
import crypto from "crypto";
import { pool } from "../services/database.js";
import { supabase } from "../services/storage.js";

const router = Router();

router.post("/", async (req, res) => {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey || apiKey !== process.env.INGESTION_API_KEY) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    const {
        deviceSerial,
        salesOrder,
        status,
        fileName,
        fileContentBase64,
    } = req.body;

    if (
        !deviceSerial ||
        !salesOrder ||
        !status ||
        !fileName ||
        !fileContentBase64
    ) {
        return res.status(400).json({
            message: "Missing required fields",
        });
    }

    if (!fileName.toLowerCase().endsWith(".pdf")) {
        return res.status(400).json({
            message: "only PDF files are allowed"
        })
    }

    const publicId = crypto.randomUUID();

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

    const blobPath = `${publicId}/${safeFileName}`;

    try{
        const pdfBuffer = Buffer.from(
            fileContentBase64,
            "base64"
        );

        const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(blobPath,pdfBuffer, {
            contentType: "application/pdf",
            upsert: false,
        });

        if(uploadError) {
            console.error("PDF upload failed:", uploadError);

            return res.status(500).json({
                message: "Failed to upload PDF",
            });
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
                    salesOrder ?? null,
                    status,
                    fileName,
                    blobPath,
                ]
            );
        } catch (databaseError) {
            // Clean up the uploaded file if the DB insert fails.
            await supabase.storage
                .from("reports")
                .remove([blobPath]);

                throw databaseError;
        }

        return res.status(201).json({
            publicId,
            message: "Report uploaded successfully",
        });
    } catch (error) {
        console.error("Internal report ingestion failed:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

export default router;