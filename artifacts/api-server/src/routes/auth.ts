import { Router } from "express";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const router = Router();

function getMailTransporter() {
  const smtpKey = process.env["BREVO_SMTP_KEY"];
  if (!smtpKey) return null;
  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: process.env["BREVO_SMTP_LOGIN"] ?? "b0d210001@smtp-brevo.com",
      pass: smtpKey,
    },
  });
}

async function sendWelcomeEmail(name: string, email: string) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) return;
    const fromName = process.env["MAIL_FROM_NAME"] ?? "ComboFinder";
    const fromEmail = process.env["MAIL_FROM_EMAIL"] ?? "noreply@iunlockd.com";
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: `"${name}" <${email}>`,
      subject: `Welcome to ComboFinder, ${name}!`,
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;"><h2 style="color:#0080DB;margin-bottom:8px;">Welcome to ComboFinder!</h2><p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p><p style="color:#374151;font-size:15px;line-height:1.6;">Your account has been created successfully.</p><div style="margin:24px 0;"><a href="https://finder.iunlockd.com/login" style="background:#0080DB;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Go to ComboFinder</a></div><p style="color:#6B7280;font-size:13px;margin-top:32px;">If you didn't create this account, you can ignore this email.</p></div>`,
      text: `Welcome to ComboFinder, ${name}!\n\nYour account has been created. Login at: https://finder.iunlockd.com/login`,
    });
  } catch (err) {
    console.error("Welcome email failed:", err);
  }
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const computed = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

router.post("/auth/register", async (req, res) => {
  const { name, email, phone, password } = req.body as { name?: string; email?: string; phone?: string; password?: string };
  if (!name || !email || !password) { res.status(400).json({ error: "Name, email and password are required" }); return; }
  if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters" }); return; }
  try {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
    if (existing.length > 0) { res.status(409).json({ error: "Email already registered" }); return; }
    const passwordHash = hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      name: name.trim(), email: email.toLowerCase().trim(), phone: phone?.trim() ?? null,
      passwordHash, accountType: "Free Technician", subscriptionPlan: "Free", isActive: true, isApproved: true,
    }).returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, accountType: usersTable.accountType, subscriptionPlan: usersTable.subscriptionPlan });
    (req.session as any).authenticated = true;
    (req.session as any).userId = user.id;
    (req.session as any).userName = user.name;
    (req.session as any).userRole = user.accountType;
    sendWelcomeEmail(user.name, user.email);
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.accountType, plan: user.subscriptionPlan } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/auth/login", async (req, res) => {
  const { username, email, password } = req.body as { username?: string; email?: string; password?: string };
  const identifier = (username ?? email ?? "").trim();
  if (!identifier || !password) { res.status(400).json({ error: "Email and password are required" }); return; }
  const adminUsername = process.env["ADMIN_USERNAME"];
  const adminPassword = process.env["ADMIN_PASSWORD"];
  if (adminUsername && adminPassword && identifier === adminUsername && password === adminPassword) {
    (req.session as any).authenticated = true;
    (req.session as any).userName = adminUsername;
    (req.session as any).userRole = "Admin";
    res.json({ success: true, user: { name: adminUsername, role: "Admin", plan: "Pro" } });
    return;
  }
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.email, identifier.toLowerCase())).limit(1);
    if (users.length === 0 || !users[0].passwordHash) { res.status(401).json({ error: "Invalid email or password" }); return; }
    const user = users[0];
    if (!verifyPassword(password, user.passwordHash)) { res.status(401).json({ error: "Invalid email or password" }); return; }
    if (!user.isActive) { res.status(403).json({ error: "Account is deactivated" }); return; }
    (req.session as any).authenticated = true;
    (req.session as any).userId = user.id;
    (req.session as any).userName = user.name;
    (req.session as any).userRole = user.accountType;
    (req.session as any).userCurrency = user.currency ?? "USD";
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.accountType, plan: user.subscriptionPlan, currency: user.currency ?? "USD" } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => { res.json({ success: true }); });
});

router.get("/auth/me", async (req, res) => {
  if ((req.session as any).authenticated) {
    const userId = (req.session as any).userId;
    let currency = "USD";
    let shopName = "";
    let email = "";
    if (userId) {
      try {
        const [u] = await db.select({ currency: usersTable.currency, shopName: usersTable.shopName, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId));
        currency = u?.currency ?? "USD";
        shopName = u?.shopName ?? "";
        email = u?.email ?? "";
      } catch {}
    }
    res.json({
      authenticated: true,
      user: {
        id: userId,
        name: (req.session as any).userName ?? "User",
        email,
        role: (req.session as any).userRole ?? "Technician",
        plan: (req.session as any).userPlan ?? "Free",
        currency,
        shopName,
      },
    });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Update profile (name, phone, shopName)
router.put("/auth/profile", async (req, res) => {
  if (!(req.session as any).authenticated) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req.session as any).userId;
  if (!userId) { res.status(400).json({ error: "No user ID in session" }); return; }
  const { name, phone, shopName } = req.body as { name?: string; phone?: string; shopName?: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name is required" }); return; }
  try {
    const [user] = await db.update(usersTable).set({ name: name.trim(), phone: phone?.trim() ?? null, shopName: shopName?.trim() ?? null, updatedAt: new Date() })
      .where(eq(usersTable.id, userId)).returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, accountType: usersTable.accountType });
    (req.session as any).userName = user.name;
    res.json({ success: true, user });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change password
router.put("/auth/password", async (req, res) => {
  if (!(req.session as any).authenticated) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req.session as any).userId;
  if (!userId) { res.status(400).json({ error: "No user ID in session" }); return; }
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) { res.status(400).json({ error: "Current and new password are required" }); return; }
  if (newPassword.length < 6) { res.status(400).json({ error: "New password must be at least 6 characters" }); return; }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user?.passwordHash || !verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: "Current password is incorrect" }); return;
    }
    const newHash = hashPassword(newPassword);
    await db.update(usersTable).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(usersTable.id, userId));
    res.json({ success: true });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Update settings (currency, shopName)
router.put("/auth/settings", async (req, res) => {
  if (!(req.session as any).authenticated) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req.session as any).userId;
  if (!userId) { res.status(400).json({ error: "No user ID in session" }); return; }
  const { currency, shopName } = req.body as { currency?: string; shopName?: string };
  try {
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (currency) updates.currency = currency;
    if (shopName !== undefined) updates.shopName = shopName;
    await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));
    res.json({ success: true });
  } catch (err) {
    console.error("Settings update error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
