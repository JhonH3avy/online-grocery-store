import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { logger: process.env.DB_LOG_QUERIES === "true" });

export const getPool = () => pool;
