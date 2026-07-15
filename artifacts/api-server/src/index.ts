import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { and, eq, lt, sql } from "drizzle-orm";

// ── Background cleanup: delete unverified accounts with no valid token ──
// Runs every 5 minutes. A user is cleaned up when:
//   • isApproved = false  (never verified)
//   • ALL their verification tokens have expired (no active token left)
// The "cascade" on password_reset_tokens means deleting the user also removes tokens.
async function cleanupUnverifiedAccounts() {
  try {
    // Find user IDs that have at least one still-valid token
    const activeTokenSubquery = db
      .select({ userId: passwordResetTokensTable.userId })
      .from(passwordResetTokensTable)
      .where(gt(passwordResetTokensTable.expiresAt, new Date()));

    const result = await db
      .delete(usersTable)
      .where(
        and(
          eq(usersTable.isApproved, false),
          sql`${usersTable.id} NOT IN (${activeTokenSubquery})`
        )
      )
      .returning({ id: usersTable.id });

    if (result.length > 0) {
      logger.info({ count: result.length }, "Cleaned up expired unverified accounts");
    }
  } catch (err) {
    logger.warn({ err }, "Cleanup job error (non-fatal)");
  }
}

// Run immediately on startup, then every 5 minutes
cleanupUnverifiedAccounts();
setInterval(cleanupUnverifiedAccounts, 5 * 60 * 1000);

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
});
