import dns from "dns";
// Force IPv4 — VPS cannot reach Supabase over IPv6
dns.setDefaultResultOrder("ipv4first");

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Detect Supabase URL by hostname pattern — applies to both SUPABASE_DATABASE_URL and DATABASE_URL
const isSupabase = /supabase\.com|supabase\.co/.test(connectionString);

// family:4 forces IPv4 socket — VPS cannot reach Supabase over IPv6 (ENETUNREACH)
export const pool = new Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  ...(isSupabase ? { family: 4 } : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
