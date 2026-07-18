import { Router } from "express";
import { db, userBackupsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const router = Router();

// ── Reuse transporter from auth.ts pattern ────────────────────────────────────
function getMailTransporter() {
  const smtpHost = process.env["SMTP_HOST"] ?? process.env["MAIL_HOST"] ?? process.env["EMAIL_HOST"];
  const smtpUser = process.env["SMTP_USER"] ?? process.env["SMTP_USERNAME"] ?? process.env["MAIL_USER"] ?? process.env["MAIL_USERNAME"];
  const smtpPass = process.env["SMTP_PASS"] ?? process.env["SMTP_PASSWORD"] ?? process.env["MAIL_PASS"] ?? process.env["MAIL_PASSWORD"];

  if (smtpHost && smtpUser && smtpPass) {
    const port = parseInt(process.env["SMTP_PORT"] ?? process.env["MAIL_PORT"] ?? "587", 10);
    const secure = process.env["SMTP_SECURE"] === "true" || process.env["MAIL_ENCRYPTION"] === "ssl" || port === 465;
    return nodemailer.createTransport({ host: smtpHost, port, secure, auth: { user: smtpUser, pass: smtpPass }, tls: { rejectUnauthorized: false } });
  }
  const brevoKey = process.env["BREVO_SMTP_KEY"];
  if (brevoKey) {
    return nodemailer.createTransport({
      host: "smtp-relay.brevo.com", port: 587,
      auth: { user: process.env["BREVO_SMTP_LOGIN"] ?? "b0d210001@smtp-brevo.com", pass: brevoKey },
    });
  }
  return null;
}

const FROM_NAME  = () => process.env["MAIL_FROM_NAME"]  ?? "ComboFinder";
const FROM_EMAIL = () => process.env["MAIL_FROM_EMAIL"] ?? "noreply@iunlockd.com";

// ── POST /api/backup/save ─────────────────────────────────────────────────────
// Client posts full local-data snapshot; we store it and email confirmation.
router.post("/backup/save", async (req: any, res: any) => {
  try {
    const userId: number = req.userId;
    const { data } = req.body ?? {};
    if (!data || typeof data !== "object") return res.status(400).json({ error: "data required" });

    const jsonStr = JSON.stringify(data);

    // Build a human-readable count summary
    const counts: Record<string, number> = {};
    for (const [key, val] of Object.entries(data)) {
      if (Array.isArray(val)) counts[key] = val.length;
    }
    const itemCounts = JSON.stringify(counts);

    // Upsert backup (one row per user)
    await db.insert(userBackupsTable)
      .values({ userId, data: jsonStr, itemCounts, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userBackupsTable.userId,
        set: { data: jsonStr, itemCounts, updatedAt: new Date() },
      });

    // Get user email for confirmation
    const [user] = await db.select({ name: usersTable.name, email: usersTable.email })
      .from(usersTable).where(eq(usersTable.id, userId));

    // Send confirmation email (non-blocking)
    if (user?.email) {
      const transporter = getMailTransporter();
      if (transporter) {
        const backupDate = new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });
        const countLines = Object.entries(counts)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => `<li style="margin:4px 0"><strong>${v}</strong> ${k}</li>`)
          .join("");

        transporter.sendMail({
          from: `"${FROM_NAME()}" <${FROM_EMAIL()}>`,
          to: `"${user.name}" <${user.email}>`,
          subject: "ComboFinder — Backup সফল হয়েছে ✅",
          html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
            <h2 style="color:#0080DB;margin-bottom:8px;">Backup সফল হয়েছে! ✅</h2>
            <p style="color:#374151;font-size:15px;line-height:1.6;">হ্যালো <strong>${user.name}</strong>,</p>
            <p style="color:#374151;font-size:15px;line-height:1.6;">
              আপনার ComboFinder data <strong>${backupDate}</strong>-তে backup হয়েছে।
            </p>
            <div style="background:#F9FAFB;border-radius:12px;padding:16px 20px;margin:20px 0;">
              <p style="margin:0 0 8px;font-weight:600;color:#111827;">Backed up data:</p>
              <ul style="margin:0;padding-left:16px;color:#374151;font-size:14px;">${countLines || "<li>No data</li>"}</ul>
            </div>
            <div style="background:#EFF6FF;border-radius:12px;padding:16px 20px;margin:20px 0;border-left:4px solid #0080DB;">
              <p style="margin:0;font-size:14px;color:#1E40AF;font-weight:600;">📱 নতুন Device-এ Restore করতে:</p>
              <ol style="margin:8px 0 0;padding-left:16px;color:#1E40AF;font-size:13px;line-height:1.8;">
                <li>নতুন device-এ ComboFinder-এ login করুন</li>
                <li>Settings → Data & Backup যান</li>
                <li>"Restore from Backup" button-এ tap করুন</li>
                <li>সব data আপনার device-এ ফিরে আসবে ✅</li>
              </ol>
            </div>
            <p style="color:#6B7280;font-size:12px;margin-top:24px;">
              Backup আপনার account-এ সংরক্ষিত আছে — যতদিন account active থাকবে, restore করা যাবে।
            </p>
          </div>`,
          text: `ComboFinder Backup সফল!\n\nDate: ${backupDate}\n\nRestore করতে: নতুন device-এ login করুন → Settings → Restore from Backup`,
        }).catch(() => {}); // non-blocking
      }
    }

    res.json({ success: true, itemCounts: counts });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Backup save failed" });
  }
});

// ── GET /api/backup/info ──────────────────────────────────────────────────────
// Returns backup metadata (date, counts) without the full data blob
router.get("/backup/info", async (req: any, res: any) => {
  try {
    const userId: number = req.userId;
    const [row] = await db.select({
      itemCounts: userBackupsTable.itemCounts,
      updatedAt:  userBackupsTable.updatedAt,
    }).from(userBackupsTable).where(eq(userBackupsTable.userId, userId));

    if (!row) return res.json({ exists: false });
    res.json({
      exists: true,
      updatedAt: row.updatedAt,
      itemCounts: row.itemCounts ? JSON.parse(row.itemCounts) : {},
    });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

// ── POST /api/backup/restore ──────────────────────────────────────────────────
// Returns the full backup JSON for the authenticated user
router.post("/backup/restore", async (req: any, res: any) => {
  try {
    const userId: number = req.userId;
    const [row] = await db.select({ data: userBackupsTable.data, updatedAt: userBackupsTable.updatedAt })
      .from(userBackupsTable).where(eq(userBackupsTable.userId, userId));

    if (!row) return res.status(404).json({ error: "No backup found for this account" });
    res.json({ success: true, data: JSON.parse(row.data), updatedAt: row.updatedAt });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Restore failed" });
  }
});

export default router;
