import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { and, eq, lt, sql } from "drizzle-orm";

// ── Background cleanup: delete unverified accounts with no valid token ──
// Runs every 5 minutes. A user is cleaned up ONLY when ALL THREE are true:
//   1. isApproved = false  (never verified)
//   2. Has at least one token record  ← proves they went through the new flow
//   3. No token is still valid        ← the window has fully closed
//
// Old users (created before the verification system) never have any token
// records at all, so condition 2 protects them — they are NEVER touched.
async function cleanupUnverifiedAccounts() {
  try {
    const now = new Date();

    // IDs that have at least one token (new-flow users)
    const hasAnyTokenSubquery = db
      .selectDistinct({ userId: passwordResetTokensTable.userId })
      .from(passwordResetTokensTable);

    // IDs that still have an active (non-expired) token
    const hasActiveTokenSubquery = db
      .selectDistinct({ userId: passwordResetTokensTable.userId })
      .from(passwordResetTokensTable)
      .where(gt(passwordResetTokensTable.expiresAt, now));

    const result = await db
      .delete(usersTable)
      .where(
        and(
          eq(usersTable.isApproved, false),
          // Condition 2: went through new flow (has a token record)
          sql`${usersTable.id} IN (${hasAnyTokenSubquery})`,
          // Condition 3: but no token is still valid
          sql`${usersTable.id} NOT IN (${hasActiveTokenSubquery})`
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
