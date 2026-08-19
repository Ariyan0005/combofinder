import app from "./app";
import { logger } from "./lib/logger";
import { seedCategories } from "./lib/seed-categories";
import { migrateStaff } from "./lib/migrate-staff";

// NOTE: Background cleanup job removed — was incorrectly deleting users.
// The 10-min OTP expiry is enforced at verify-email time instead.

// ---------------------------------------------------------------------------
// Global error guards — keep the process alive on unexpected async failures.
// Node.js 15+ crashes the process on unhandledRejection by default; override
// so transient DB/session errors don't take the whole server down.
// ---------------------------------------------------------------------------
process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ reason }, "Unhandled promise rejection — ignoring to keep server alive");
});

process.on("uncaughtException", (err: Error) => {
  logger.error({ err }, "Uncaught exception — server will continue");
});

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
  // Ensure default categories (ic, battery, isp) exist in the database
  seedCategories();
  // Ensure staff table exists (auto-migration)
  migrateStaff();
});
