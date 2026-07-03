import { Router } from "express";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const router = Router();

// ---------------------------------------------------------------------------
// Brevo SMTP transporter (only created when env vars are present)
// ---------------------------------------------------------------------------
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
    if (!transporter) return; // silently skip if not configured

    const fromName = process.env["MAIL_FROM_NAME"] ?? "ComboFinder";
    const fromEmail = process.env["MAIL_FROM_EMAIL"] ?? "noreply@iunlockd.com";

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: `"${name}" <${email}>`,
      subject: `Welcome to ComboFinder, ${name}!`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
          <h2 style="color:#0080DB;margin-bottom:8px;">Welcome to ComboFinder!</h2>
          <p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;">
            Your account has been created successfully. You can now log in and start searching
            for compatible display combos for any phone model.
          </p>
          <div style="margin:24px 0;">
            <a href="https://finder.iunlockd.com/login"
               style="background:#0080DB;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Go to ComboFinder
            </a>
          </div>
          <p style="color:#6B7280;font-size:13px;margin-top:32px;">
            If you didn't create this account, you can ignore this email.
          </p>
        </div>
      `,
      text: `Welcome to ComboFinder, ${name}!\n\nYour account has been created successfully.\nLogin at: https://finder.iunlockd.com/login`,
    });
  } catch (err) {
    // Non-fatal — registration already succeeded
    console.error("Welcome email failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
router.post("/auth/register", async (req, res) => {
  const { name, email, phone, password } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    const existing = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() ?? null,
      passwordHash,
      accountType: "Free Technician",
      subscriptionPlan: "Free",
      isActive: true,
      isApproved: true,
    }).returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      accountType: usersTable.accountType,
      subscriptionPlan: usersTable.subscriptionPlan,
    });

    (req.session as any).authenticated = true;
    (req.session as any).userId = user.id;
    (req.session as any).userName = user.name;
    (req.session as any).userRole = user.accountType;

    // Send welcome email in background (non-blocking)
    sendWelcomeEmail(user.name, user.email);

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.accountType, plan: user.subscriptionPlan },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/auth/login", async (req, res) => {
  const { username, email, password } = req.body as {
    username?: string;
    email?: string;
    password?: string;
  };

  const identifier = (username ?? email ?? "").trim();
  if (!identifier || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  // Admin credentials check (env vars)
  const adminUsername = process.env["ADMIN_USERNAME"];
  const adminPassword = process.env["ADMIN_PASSWORD"];
  if (adminUsername && adminPassword && identifier === adminUsername && password === adminPassword) {
    (req.session as any).authenticated = true;
    (req.session as any).userName = adminUsername;
    (req.session as any).userRole = "Admin";
    res.json({ success: true, user: { name: adminUsername, role: "Admin", plan: "Pro" } });
    return;
  }

  // DB user check
  try {
    const users = await db.select().from(usersTable)
      .where(eq(usersTable.email, identifier.toLowerCase()))
      .limit(1);

    if (users.length === 0 || !users[0].passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = users[0];
    if (!verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ error: "Account is deactivated" });
      return;
    }

    (req.session as any).authenticated = true;
    (req.session as any).userId = user.id;
    (req.session as any).userName = user.name;
    (req.session as any).userRole = user.accountType;

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.accountType, plan: user.subscriptionPlan },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", (req, res) => {
  if ((req.session as any).authenticated) {
    res.json({
      authenticated: true,
      user: {
        name: (req.session as any).userName ?? "User",
        role: (req.session as any).userRole ?? "Technician",
        plan: (req.session as any).userPlan ?? "Free",
      },
    });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
