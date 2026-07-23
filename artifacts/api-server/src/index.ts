import app from "./app";
import { logger } from "./lib/logger";
import { bootSessions } from "./lib/whatsapp.js";
import { seedCategories } from "./lib/seed-categories";

// NOTE: Background cleanup job removed — was incorrectly deleting users.
// The 10-min OTP expiry is enforced at verify-email time instead.

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
  // Reconnect any WhatsApp sessions that were active before server restart
  bootSessions();
  // Ensure default categories (ic, battery, isp) exist in the database
  seedCategories();
});
