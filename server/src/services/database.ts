import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function testDatabaseConnection() {
  const result = await pool.query("SELECT NOW()");

  console.log("Supabase PostgreSQL connected:", result.rows[0]);
}