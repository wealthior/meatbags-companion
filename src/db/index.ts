import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

/**
 * Database connection using Vercel Postgres + Drizzle ORM.
 * Connection is automatically managed by Vercel's serverless pool.
 */
export const db = drizzle(sql, { schema });

export type Database = typeof db;
