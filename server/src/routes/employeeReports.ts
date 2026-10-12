import { Router } from "express";

import { pool } from "../services/database.js";
import { ingestReport } from "../services/reportIngestion.js";

import {
  requireEmployeeAuth,
} from "../middleware/requireEmployeeAuth.js";

const router = Router();

/* =========================================================
   GET EMPLOYEE REPORTS
   =========================================================

   Examples:

   GET /api/employee/reports

   GET /api/employee/reports?q=TEST-001

   GET /api/employee/reports?status=Pass

   GET /api/employee/reports?q=TEST&status=Pass
*/

router.get(
  "/",
  requireEmployeeAuth,
  async (req, res) => {
    try {
      const q =
        typeof req.query.q === "string"
          ? req.query.q.trim()
          : "";

      const status =
        typeof req.query.status === "string"
          ? req.query.status.trim()
          : "";

      if (
        status &&
        status !== "Pass" &&
        status !== "Fail"
      ) {
        return res.status(400).json({
          message: "Invalid report status",
        });
      }

      const values: string[] = [];

      const conditions: string[] = [
        "active = true",
      ];

      /*
       * Search:
       * - Device serial
       * - Sales order
       * - Filename
       * - Public ID
       */
      if (q) {
        values.push(`%${q}%`);

        const searchParameter =
          `$${values.length}`;

        conditions.push(`
          (
            device_serial ILIKE ${searchParameter}
            OR sales_order ILIKE ${searchParameter}
            OR filename ILIKE ${searchParameter}
            OR public_id::text ILIKE ${searchParameter}
          )
        `);
      }

      /*
       * Optional Pass / Fail filter
       */
      if (status) {
        values.push(status);

        const statusParameter =
          `$${values.length}`;

        conditions.push(
          `status = ${statusParameter}`
        );
      }

      const result = await pool.query(
        `
          SELECT
            public_id,
            device_serial,
            sales_order,
            status,
            filename,
            created_at
          FROM reports
          WHERE ${conditions.join(" AND ")}
          ORDER BY created_at DESC
          LIMIT 200
        `,
        values
      );

      const reports = result.rows.map(
        (report) => ({
          publicId: report.public_id,
          deviceSerial:
            report.device_serial,
          salesOrder:
            report.sales_order,
          status:
            report.status,
          filename:
            report.filename,
          createdAt:
            report.created_at,
        })
      );

      return res.json({
        reports,
      });
    } catch (error) {
      console.error(
        "Failed to retrieve employee reports:",
        error
      );

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

/* =========================================================
   MANUAL EMPLOYEE UPLOAD
   ========================================================= */

router.post(
  "/",
  requireEmployeeAuth,
  async (req, res) => {
    // TEMPORARY:
    // Manual employee uploads are only enabled
    // when explicitly allowed in the environment.
    if (
      process.env.ENABLE_EMPLOYEE_UPLOAD !==
      "true"
    ) {
      return res.status(403).json({
        message:
          "Employee uploads are disabled",
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
        message:
          "Missing required fields",
      });
    }

    if (
      status !== "Pass" &&
      status !== "Fail"
    ) {
      return res.status(400).json({
        message:
          "Invalid report status",
      });
    }

    if (
      !fileName
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      return res.status(400).json({
        message:
          "Only PDF files are allowed",
      });
    }

    try {
      const result =
        await ingestReport({
          deviceSerial,
          salesOrder,
          status,
          fileName,
          fileContentBase64,
        });

      return res
        .status(201)
        .json(result);
    } catch (error) {
      console.error(
        "Employee report upload failed:",
        error
      );

      return res.status(500).json({
        message:
          "Internal server error",
      });
    }
  }
);

export default router;