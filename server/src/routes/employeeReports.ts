import { Router } from "express";
import { ingestReport } from "../services/reportIngestion.js";

const router = Router();

router.post("/", async (req, res) => {
    // TEMPORARY:
    // Manual employee uploads are only enabled
    // when explicitly allowed in the environment.
    if (process.env.ENABLE_EMPLOYEE_UPLOAD !== "true") {
        return res.status(403).json({
            message: "Employee uploads are disabled",
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
            message: "Invalid report status",
        });
    }

    if (!fileName.toLowerCase().endsWith(".pdf")) {
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
            "Employee report upload failed:",
            error
        );

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

export default router;