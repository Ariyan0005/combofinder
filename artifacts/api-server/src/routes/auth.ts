import { Router } from "express";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { promises as dnsPromises } from "node:dns";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, and, gt, lt } from "drizzle-orm";
import nodemailer from "nodemailer";

const router = Router();

// ---------------------------------------------------------------------------
// Disposable / fake email domain blocklist
// ---------------------------------------------------------------------------
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","guerrillamail.net","guerrillamail.org",
  "guerrillamail.biz","guerrillamail.de","guerrillamail.info","sharklasers.com",
  "guerrillamailblock.com","grr.la","spam4.me","yopmail.com","yopmail.fr",
  "cool.fr.nf","jetable.fr.nf","nospam.ze.tc","nomail.xl.cx","mega.zik.dj",
  "speed.1s.fr","courriel.fr.nf","moncourrier.fr.nf","monemail.fr.nf",
  "monmail.fr.nf","tempmail.com","temp-mail.org","throwam.com","throwam.net",
  "dispostable.com","mailnull.com","maildrop.cc","trashmail.at","trashmail.com",
  "trashmail.io","trashmail.me","trashmail.net","trashmail.org","trashmail.xyz",
  "spamgourmet.com","spamgourmet.net","spamgourmet.org","discard.email",
  "cfl.fr","filzmail.com","fakeinbox.com","tempr.email","emailondeck.com",
  "getnada.com","mailtemp.net","burnermail.io","mytemp.email","inboxbear.com",
  "tempinbox.com","getairmail.com","mohmal.com","getairmail.org","harakirimail.com",
  "anonbox.net","owlpic.com","drdrb.net","klzlk.com","0-mail.com",
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

// ---------------------------------------------------------------------------
// MX record check — verify the email domain can actually receive mail.
// Policy:
//   • ENOTFOUND (domain does not exist) → block
//   • ENODATA   (domain has no MX records) → block
//   • Transient errors (timeout, SERVFAIL, network) → fail-open (allow)
//   • Lookup is raced against a 5 s timeout so registration never stalls
// ---------------------------------------------------------------------------
const MX_LOOKUP_TIMEOUT_MS = 5000;
const MX_DEFINITIVE_BLOCK_CODES = new Set(["ENOTFOUND", "ENODATA"]);

async function hasMxRecord(email: string): Promise<boolean> {
  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const records = await Promise.race([
      dnsPromises.resolveMx(domain),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(Object.assign(new Error("DNS_TIMEOUT"), { code: "DNS_TIMEOUT" })), MX_LOOKUP_TIMEOUT_MS);
      }),
    ]);
    clearTimeout(timeoutId);
    return Array.isArray(records) && records.length > 0;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const code: string = err?.code ?? "";
    if (MX_DEFINITIVE_BLOCK_CODES.has(code)) {
      // Domain definitively does not exist or has no mail servers → block
      return false;
    }
    // Transient / unknown errors — fail open so DNS outages never lock users out
    return true;
  }
}

// ---------------------------------------------------------------------------
// Mail transporter — supports multiple common SMTP env var naming patterns
// ---------------------------------------------------------------------------
function getMailTransporter() {
  // Support common naming patterns: SMTP_HOST / MAIL_HOST / EMAIL_HOST
  const smtpHost =
    process.env["SMTP_HOST"] ??
    process.env["MAIL_HOST"] ??
    process.env["EMAIL_HOST"];

  // SMTP_USER / SMTP_USERNAME / MAIL_USER / MAIL_USERNAME
  const smtpUser =
    process.env["SMTP_USER"] ??
    process.env["SMTP_USERNAME"] ??
    process.env["MAIL_USER"] ??
    process.env["MAIL_USERNAME"];

  // SMTP_PASS / SMTP_PASSWORD / MAIL_PASS / MAIL_PASSWORD
  const smtpPass =
    process.env["SMTP_PASS"] ??
    process.env["SMTP_PASSWORD"] ??
    process.env["MAIL_PASS"] ??
    process.env["MAIL_PASSWORD"];

  if (smtpHost && smtpUser && smtpPass) {
    const port = parseInt(
      process.env["SMTP_PORT"] ?? process.env["MAIL_PORT"] ?? "587",
      10,
    );
    const secure =
      process.env["SMTP_SECURE"] === "true" ||
      process.env["MAIL_ENCRYPTION"] === "ssl" ||
      port === 465;
    return nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
    });
  }

  // Brevo fallback
  const brevoKey = process.env["BREVO_SMTP_KEY"];
  if (brevoKey) {
    return nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: {
        user: process.env["BREVO_SMTP_LOGIN"] ?? "b0d210001@smtp-brevo.com",
        pass: brevoKey,
      },
    });
  }

  return null;
}

const FROM_NAME = () => process.env["MAIL_FROM_NAME"] ?? "ComboFinder";
const FROM_EMAIL = () => process.env["MAIL_FROM_EMAIL"] ?? "noreply@iunlockd.com";

async function sendWelcomeEmail(name: string, email: string) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) return;
    await transporter.sendMail({
      from: `"${FROM_NAME()}" <${FROM_EMAIL()}>`,
      to: `"${name}" <${email}>`,
      subject: `Welcome to ComboFinder, ${name}!`,
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
        <h2 style="color:#0080DB;margin-bottom:8px;">Welcome to ComboFinder!</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.6;">Your account has been created successfully. ComboFinder is a free tool for mobile technicians.</p>
        <div style="margin:24px 0;">
          <a href="https://finder.iunlockd.com/login" style="background:#0080DB;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Go to ComboFinder</a>
        </div>
        <p style="color:#6B7280;font-size:13px;margin-top:32px;">If you didn't create this account, you can ignore this email.</p>
      </div>`,
      text: `Welcome to ComboFinder, ${name}!\n\nYour account has been created. Login at: https://finder.iunlockd.com/login`,
    });
  } catch (err) {
    console.error("Welcome email failed:", err);
  }
}

async function sendPasswordResetEmail(name: string, email: string, code: string) {
  const transporter = getMailTransporter();
  if (!transporter) throw new Error(
    "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS env vars on your server."
  );
  await transporter.sendMail({
    from: `"${FROM_NAME()}" <${FROM_EMAIL()}>`,
    to: `"${name}" <${email}>`,
    subject: "ComboFinder — Password Reset Code",
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
      <h2 style="color:#0080DB;margin-bottom:8px;">Password Reset</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;">Use the code below to reset your password. It expires in <strong>1 hour</strong>.</p>
      <div style="margin:24px 0;text-align:center;">
        <div style="display:inline-block;background:#F3F4F6;border-radius:12px;padding:18px 40px;">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0080DB;">${code}</span>
        </div>
      </div>
      <p style="color:#6B7280;font-size:13px;">If you didn't request this, ignore this email — your password won't change.</p>
    </div>`,
    text: `ComboFinder Password Reset\n\nYour reset code: ${code}\n\nThis code expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
  });
}


async function sendVerificationEmail(name: string, email: string, code: string): Promise<boolean> {
  try {
    const transporter = getMailTransporter();
    if (!transporter) return false;
    await transporter.sendMail({
      from: `"${FROM_NAME()}" <${FROM_EMAIL()}>`,
      to: `"${name}" <${email}>`,
      subject: "ComboFinder — Verify Your Email",
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
        <h2 style="color:#0080DB;margin-bottom:8px;">Verify Your Email</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.6;">Use the code below to activate your ComboFinder account. It expires in <strong>24 hours</strong>.</p>
        <div style="margin:24px 0;text-align:center;">
          <div style="display:inline-block;background:#F3F4F6;border-radius:12px;padding:18px 40px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0080DB;">${code}</span>
          </div>
        </div>
        <p style="color:#6B7280;font-size:13px;">If you didn't create this account, you can ignore this email.</p>
      </div>`,
      text: `ComboFinder — Verify Your Email\n\nYour verification code: ${code}\n\nThis code expires in 24 hours.`,
    });
    return true;
  } catch (err) {
    console.error("Verification email failed:", err);
    return false;
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

// ---------------------------------------------------------------------------
// Email availability check (used by register form for real-time feedback)
// ---------------------------------------------------------------------------
router.get("/auth/check-email", async (req, res) => {
  const email = ((req.query["email"] as string) ?? "").toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.json({ available: false }); return;
  }
  try {
    const existing = await db.select({ id: usersTable.id })
      .from(usersTable).where(eq(usersTable.email, email)).limit(1);
    res.json({ available: existing.length === 0 });
  } catch {
    res.json({ available: true }); // fail-open on DB error
  }
});

router.post("/auth/register", async (req, res) => {
  const { name, email, phone, password } = req.body as {
    name?: string; email?: string; phone?: string; password?: string;
  };
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email and password are required" }); return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" }); return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Fake/disposable email check
  if (isDisposableEmail(normalizedEmail)) {
    res.status(400).json({ error: "Please use a real email address. Disposable/temporary emails are not allowed." }); return;
  }

  // MX record check — block domains that cannot receive email (random/made-up domains)
  const mxValid = await hasMxRecord(normalizedEmail);
  if (!mxValid) {
    res.status(400).json({ error: "Please use a real email address. This email domain cannot receive emails." }); return;
  }

  try {
    const existing = await db.select({ id: usersTable.id })
      .from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered. Please login instead." }); return;
    }
    const { shopName, currency: countryCurrency } = req.body as { shopName?: string; currency?: string };
    const passwordHash = hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      name: name.trim(), email: normalizedEmail, phone: phone?.trim() ?? null,
      passwordHash, accountType: "Free Technician", subscriptionPlan: "Free",
      isActive: false, isApproved: false,
      currency: countryCurrency ?? "USD",
      shopName: shopName?.trim() ?? null,
    }).returning({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      accountType: usersTable.accountType, subscriptionPlan: usersTable.subscriptionPlan, currency: usersTable.currency,
    });

    // Generate 6-digit verification OTP (10 min expiry)
    const verifyCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, user.id)).catch(() => {});
    await db.insert(passwordResetTokensTable).values({ userId: user.id, token: verifyCode, expiresAt });

    const emailSent = await sendVerificationEmail(user.name, user.email, verifyCode);
    if (!emailSent) {
      // SMTP not configured — activate immediately as fallback
      await db.update(usersTable).set({ isActive: true, isApproved: true }).where(eq(usersTable.id, user.id));
      (req.session as any).authenticated = true;
      (req.session as any).userId = user.id;
      (req.session as any).userName = user.name;
      (req.session as any).userRole = user.accountType;
      (req.session as any).userCurrency = user.currency ?? "USD";
      res.json({ success: true, requiresVerification: false, user: { id: user.id, name: user.name, email: user.email, role: user.accountType, plan: user.subscriptionPlan, currency: user.currency ?? "USD" } });
      return;
    }
    res.json({ success: true, requiresVerification: true, email: user.email });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/auth/verify-email", async (req, res) => {
  const { email, token } = req.body as { email?: string; token?: string };
  if (!email || !token) {
    res.status(400).json({ error: "Email and verification code are required" }); return;
  }
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    if (users.length === 0) { res.status(400).json({ error: "Invalid verification code" }); return; }
    const user = users[0];

    const now = new Date();
    const tokens = await db.select().from(passwordResetTokensTable).where(
      and(
        eq(passwordResetTokensTable.userId, user.id),
        eq(passwordResetTokensTable.token, token),
        gt(passwordResetTokensTable.expiresAt, now)
      )
    ).limit(1);

    if (tokens.length === 0) {
      // Check if the code exists but is expired (vs completely wrong code)
      const expiredTokens = await db.select().from(passwordResetTokensTable).where(
        and(
          eq(passwordResetTokensTable.userId, user.id),
          eq(passwordResetTokensTable.token, token)
        )
      ).limit(1);
      if (expiredTokens.length > 0 && !user.isApproved) {
        // Token existed but expired — clean up the unverified account
        await db.delete(usersTable).where(eq(usersTable.id, user.id)).catch(() => {});
        res.status(410).json({ error: "Registration expired. The 10-minute window has passed. Please register again.", expired: true }); return;
      }
      res.status(400).json({ error: "Invalid verification code. Please check and try again." }); return;
    }

    await db.update(usersTable)
      .set({ isApproved: true, isActive: true, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id));
    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.id, tokens[0].id)).catch(() => {});

    (req.session as any).authenticated = true;
    (req.session as any).userId = user.id;
    (req.session as any).userName = user.name;
    (req.session as any).userRole = user.accountType;
    (req.session as any).userPlan = user.subscriptionPlan ?? "Free";
    (req.session as any).userCurrency = user.currency ?? "USD";

    sendWelcomeEmail(user.name, user.email);
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.accountType, plan: user.subscriptionPlan ?? "Free", currency: user.currency ?? "USD" } });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

// Resend verification code
router.post("/auth/resend-verification", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    if (users.length === 0 || users[0].isApproved) { res.json({ success: true }); return; }
    const user = users[0];
    const verifyCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, user.id)).catch(() => {});
    await db.insert(passwordResetTokensTable).values({ userId: user.id, token: verifyCode, expiresAt });
    await sendVerificationEmail(user.name, user.email, verifyCode);
    res.json({ success: true });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ error: "Failed to resend code." });
  }
});

router.post("/auth/login", async (req, res) => {
  const { username, email, password } = req.body as { username?: string; email?: string; password?: string };
  const identifier = (username ?? email ?? "").trim();
  if (!identifier || !password) {
    res.status(400).json({ error: "Email and password are required" }); return;
  }
  const adminUsername = process.env["ADMIN_USERNAME"];
  const adminPassword = process.env["ADMIN_PASSWORD"];
  if (adminUsername && adminPassword && identifier === adminUsername && password === adminPassword) {
    (req.session as any).authenticated = true;
    (req.session as any).userName = adminUsername;
    (req.session as any).userRole = "Admin";
    (req.session as any).userPlan = "Pro";
    res.json({ success: true, user: { name: adminUsername, role: "Admin", plan: "Pro" } });
    return;
  }
  try {
    // Support login by email OR by name OR by phone (username)
    // Wrapped in try/catch per-query so a missing column never crashes the login.
    const lowerIdentifier = identifier.toLowerCase();
    let users: typeof usersTable.$inferSelect[] = [];

    // 1. Try email column (may not exist on older VPS schemas)
    if (users.length === 0) {
      try {
        users = await db.select().from(usersTable)
          .where(eq(usersTable.email, lowerIdentifier)).limit(1);
      } catch { /* email column missing — fall through */ }
    }

    // 2. Try phone column
    if (users.length === 0) {
      try {
        users = await db.select().from(usersTable)
          .where(eq(usersTable.phone, identifier)).limit(1);
      } catch { /* phone column missing — fall through */ }
    }

    // 3. Try name (case-insensitive full scan)
    if (users.length === 0) {
      try {
        const all = await db.select().from(usersTable);
        const match = all.find(u => u.name?.toLowerCase() === lowerIdentifier);
        if (match) users = [match];
      } catch { /* ignore */ }
    }

    if (users.length === 0 || !users[0].passwordHash) {
      res.status(401).json({ error: "Invalid email/username or password" }); return;
    }
    const user = users[0];
    if (!verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password" }); return;
    }
    if (!user.isApproved) {
      res.status(403).json({ error: "Please verify your email before logging in.", requiresVerification: true, email: user.email }); return;
    }
    if (!user.isActive) {
      res.status(403).json({ error: "Account is deactivated" }); return;
    }
    (req.session as any).authenticated = true;
    (req.session as any).userId = user.id;
    (req.session as any).userName = user.name;
    (req.session as any).userRole = user.accountType;
    (req.session as any).userPlan = user.subscriptionPlan ?? "Free";
    (req.session as any).userCurrency = user.currency ?? "USD";
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.accountType, plan: user.subscriptionPlan ?? "Free", currency: user.currency ?? "USD", shopName: user.shopName ?? "" } });
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
    // Read plan fresh from DB so admin plan updates are reflected immediately
    // without requiring the user to log out and back in.
    let plan: string = (req.session as any).userPlan ?? "Free";
    if (userId) {
      try {
        const [u] = await db.select({
          currency: usersTable.currency,
          shopName: usersTable.shopName,
          email: usersTable.email,
          subscriptionPlan: usersTable.subscriptionPlan,
        }).from(usersTable).where(eq(usersTable.id, userId));
        currency = u?.currency ?? "USD";
        shopName = u?.shopName ?? "";
        email = u?.email ?? "";
        plan = u?.subscriptionPlan ?? "Free";
      } catch {}
    }
    res.json({
      authenticated: true,
      user: {
        id: userId,
        name: (req.session as any).userName ?? "User",
        email,
        role: (req.session as any).userRole ?? "Technician",
        plan,
        currency,
        shopName,
      },
    });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// ---------------------------------------------------------------------------
// Forgot / Reset Password
// ---------------------------------------------------------------------------

router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }
  const normalizedEmail = email.toLowerCase().trim();
  try {
    // Query by email — gracefully handle missing email column on older VPS schemas
    let users: { id: number; name: string; email: string | null }[] = [];
    try {
      users = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
        .from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    } catch {
      // email column may not exist yet — return silent success (don't crash)
      res.json({ success: true, message: "If this email exists, a reset code has been sent." }); return;
    }

    // Always return success to prevent email enumeration
    if (users.length === 0) {
      res.json({ success: true, message: "If this email exists, a reset code has been sent." }); return;
    }
    const user = users[0];

    // Invalidate old tokens for this user (ignore errors if table is empty)
    await db.delete(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.userId, user.id)).catch(() => {});

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokensTable).values({
      userId: user.id,
      token: code,
      expiresAt,
    });

    await sendPasswordResetEmail(user.name, user.email, code);
    res.json({ success: true, message: "Reset code sent to your email." });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: err?.message ?? "Failed to send reset email. Please check server SMTP configuration." });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body as {
    email?: string; token?: string; newPassword?: string;
  };
  if (!email || !token || !newPassword) {
    res.status(400).json({ error: "Email, reset code and new password are required" }); return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" }); return;
  }
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const users = await db.select({ id: usersTable.id })
      .from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    if (users.length === 0) {
      res.status(400).json({ error: "Invalid or expired reset code" }); return;
    }
    const user = users[0];

    const now = new Date();
    const resetTokens = await db.select()
      .from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.userId, user.id),
          eq(passwordResetTokensTable.token, token),
          gt(passwordResetTokensTable.expiresAt, now)
        )
      ).limit(1);

    if (resetTokens.length === 0 || resetTokens[0].usedAt !== null) {
      res.status(400).json({ error: "Invalid or expired reset code. Please request a new one." }); return;
    }

    const newHash = hashPassword(newPassword);
    await db.update(usersTable)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id));

    // Mark token as used
    await db.update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokensTable.id, resetTokens[0].id));

    res.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password. Please try again." });
  }
});

// ---------------------------------------------------------------------------
// Profile / Settings / Password change
// ---------------------------------------------------------------------------

router.put("/auth/profile", async (req, res) => {
  if (!(req.session as any).authenticated) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req.session as any).userId;
  if (!userId) { res.status(400).json({ error: "No user ID in session" }); return; }
  const { name, phone, shopName } = req.body as { name?: string; phone?: string; shopName?: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name is required" }); return; }
  try {
    const [user] = await db.update(usersTable)
      .set({ name: name.trim(), phone: phone?.trim() ?? null, shopName: shopName?.trim() ?? null, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, accountType: usersTable.accountType });
    (req.session as any).userName = user.name;
    res.json({ success: true, user });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.put("/auth/password", async (req, res) => {
  if (!(req.session as any).authenticated) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req.session as any).userId;
  if (!userId) { res.status(400).json({ error: "No user ID in session" }); return; }
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required" }); return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" }); return;
  }
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
