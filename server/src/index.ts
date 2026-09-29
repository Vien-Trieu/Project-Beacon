import express from "express";
import publicReportsRouter from "./routes/publicReports.js";
import { testDatabaseConnection } from "./services/database.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Project Beacon API is running",
  });
});

app.use("/api/public/reports", publicReportsRouter);

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    await testDatabaseConnection();
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});