import { Router } from "express";
import { pool } from "../services/database.js";
import { supabase } from "../services/storage.js";

const router = Router();

router.get("/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;

    const result = await pool.query(
      `
      SELECT
        public_id,
        device_serial,
        sales_order,
        status,
        filename,
        blob_path
      FROM reports
      WHERE public_id = $1
        AND active = true
      LIMIT 1
      `,
      [publicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    const report = result.rows[0];

    return res.json({
      publicId: report.public_id,
      deviceSerial: report.device_serial,
      salesOrder: report.sales_order,
      status: report.status,
      filename: report.filename,

      // Cloud PDF storage
      pdfUrl: `/api/public/reports/${report.public_id}/pdf`,
    });
  } catch (error) {
    console.error("Failed to retrieve report:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:publicId/pdf", async (req, res) => {
  try {
    const { publicId } = req.params;

    const result = await pool.query(
      `
      SELECT blob_path
      FROM reports
      WHERE public_id = $1
      AND active = true
      LIMIT 1
      `,
      [publicId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    const blobPath = result.rows[0].blob_path;

    if (!blobPath) {
      return res.status(404).json({
        message: "PDF not found",
      });
    }

    const { data, error } = await supabase.storage
      .from("reports")
      .createSignedUrl(blobPath, 60); // URL valid for 60 seconds

    if (error) {
      console.error("Supabase storage error:", error);
      return res.status(500).json({
        message: "Could not retrieve PDF",
      });
    }

    return res.redirect(data.signedUrl);
  } catch (error) {
    console.error("Failed to retrieve PDF:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;