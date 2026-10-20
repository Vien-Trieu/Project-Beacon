import { Router } from "express";
import { ingestReport } from "../services/reportIngestion.js";

const router = Router();

router.post("/", async (req, res) => {
    const apiKey = req.headers["x-api-key"];

    if (
        !apiKey ||
        apiKey !== process.env.INGESTION_API_KEY
    ) {
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

    if (
        status !== "Pass" &&
        status !== "Fail"
    ) {
        return res.status(400).json({
            message: "Status must be Pass or Fail",
        });
    }

    if (
        typeof fileName !== "string" ||
        !fileName.toLowerCase().endsWith(".pdf")
    ) {
        return res.status(400).json({
            message: "Only PDF files are allowed",
        });
    }

    try {
        const result = await ingestReport({
            deviceSerial,
            salesOrder,
            status,
            fileName,
            fileContentBase64,
        });

        return res.status(201).json(result);
    } catch (error) {
        console.error(
            "Internal report ingestion failed:",
            error
        );

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

export default router;