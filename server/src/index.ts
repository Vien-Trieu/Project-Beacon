import express from "express";
import publicReportsRouter from "./routes/publicReports.js";
import { testDatabaseConnection } from "./services/database.js";
import internalReportsRouter from "./routes/internalReports.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  express.json({
    limit: "25mb",
  })
);

app.use(
  cors({
    origin: process.env.PUBLIC_SITE_URL,
  })
);

app.use("/api/public/reports", publicReportsRouter);

// Internal report ingestion route
app.use("/api/internal/reports", internalReportsRouter);

app.get("/", (_req, res) => {
  res.json({
    message: "Project Beacon API is running",
  });
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    await testDatabaseConnection();
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});