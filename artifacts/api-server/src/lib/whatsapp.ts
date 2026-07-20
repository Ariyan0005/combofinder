/**
 * WhatsApp Alert Service — per-user Baileys sessions
 * Baileys is loaded lazily via dynamic import so that if it is unavailable
 * (e.g. native build scripts were not run), the rest of the server still
 * starts and all non-WhatsApp routes keep working normally.
 */
import fs from "fs";
import path from "path";
import P from "pino";

const SESSIONS_DIR = process.env["WA_SESSIONS_DIR"] ?? "/var/www/combofinder/data/wa-sessions";
const baileysLog = P({ level: "silent" }) as any;

// ── Lazy Baileys loader — returns null if unavailable ─────────────────────
let baileysCache: any = null;

async function loadBaileys(): Promise<any | null> {
  if (baileysCache) return baileysCache;
  try {
    baileysCache = await import("@whiskeysockets/baileys");
    return baileysCache;
  } catch (e) {
    console.warn("[WhatsApp] Baileys unavailable — WhatsApp alerts disabled:", (e as any).message);
    return null;
  }
}

// ── Session store ─────────────────────────────────────────────────────────
interface Session {
  sock: any;
  qr: string | null;
  isConnected: boolean;
  phoneNumber: string | null;
  reconnectTimer?: ReturnType<typeof setTimeout>;
}

const sessions = new Map<number, Session>();

function sessionDir(userId: number): string {
  return path.join(SESSIONS_DIR, String(userId));
}

// ── Start / reconnect a session ───────────────────────────────────────────
// Tracks the last error per user for the debug endpoint
const sessionErrors = new Map<number, string>();

export async function startSession(userId: number): Promise<void> {
  console.log(`[WA] startSession(${userId}) — loading Baileys...`);
  const B = await loadBaileys();
  if (!B) { console.error(`[WA] Baileys failed to load for user ${userId}`); return; }
  console.log(`[WA] Baileys loaded. makeWASocket=${typeof B.makeWASocket}, default=${typeof B.default}`);

  const dir = sessionDir(userId);
  fs.mkdirSync(dir, { recursive: true });

  const existing = sessions.get(userId);
  if (existing?.isConnected) { console.log(`[WA] user ${userId} already connected`); return; }
  if (existing?.reconnectTimer) clearTimeout(existing.reconnectTimer);

  // If a session already exists but isn't connected and has no QR yet,
  // don't start another socket — let the existing one keep trying.
  if (existing?.sock && !existing.isConnected && !existing.qr) {
    console.log(`[WA] user ${userId} session pending (socket exists, no QR yet) — skipping duplicate`);
    return;
  }

  console.log(`[WA] user ${userId} — loading auth state from ${dir}`);
  const { state, saveCreds } = await B.useMultiFileAuthState(dir);

  // fetchLatestBaileysVersion makes an external call to WhatsApp servers —
  // fall back to a known-good version if it fails (e.g. network blocked).
  let version: number[];
  try {
    const versionResult = await B.fetchLatestBaileysVersion();
    version = versionResult.version;
    console.log(`[WA] user ${userId} — WA version: ${version}`);
  } catch (e: any) {
    version = [2, 3000, 1023557039]; // known-good Baileys fallback
    console.warn(`[WA] fetchLatestBaileysVersion failed (${e?.message}) — using fallback ${version}`);
  }

  const makeWASocket = B.makeWASocket ?? B.default;
  if (typeof makeWASocket !== "function") {
    const msg = `makeWASocket is not a function (type=${typeof makeWASocket}). Baileys exports: ${Object.keys(B).join(",")}`;
    console.error(`[WA] ${msg}`);
    sessionErrors.set(userId, msg);
    return;
  }

  console.log(`[WA] user ${userId} — creating socket...`);
  let sock: any;
  try {
    sock = makeWASocket({
      version,
      auth: state,
      logger: baileysLog,
      printQRInTerminal: false,
      browser: ["ComboFinder", "Chrome", "1.0"],
    });
    console.log(`[WA] user ${userId} — socket created OK`);
  } catch (e: any) {
    const msg = `Socket creation failed: ${e?.message}`;
    console.error(`[WA] ${msg}`);
    sessionErrors.set(userId, msg);
    return;
  }

  const session: Session = { sock, qr: null, isConnected: false, phoneNumber: null };
  sessions.set(userId, session);
  sessionErrors.delete(userId);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect, qr } = update;
    console.log(`[WA] user ${userId} connection.update: connection=${connection} hasQR=${!!qr}`);

    if (qr) {
      console.log(`[WA] user ${userId} — QR received, converting to data URL...`);
      try {
        const QRCode = (await import("qrcode")).default;
        session.qr = await QRCode.toDataURL(qr);
        console.log(`[WA] user ${userId} — QR data URL ready (len=${session.qr?.length})`);
      } catch (e: any) {
        console.error(`[WA] user ${userId} — qrcode.toDataURL failed: ${e?.message}`);
        session.qr = null;
      }
    }

    if (connection === "open") {
      session.isConnected = true;
      session.qr = null;
      const jid = sock.user?.id ?? "";
      session.phoneNumber = jid.split(":")[0].split("@")[0];
      console.log(`[WA] user ${userId} — connected! phone=${session.phoneNumber}`);
    }

    if (connection === "close") {
      session.isConnected = false;
      session.phoneNumber = null;
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = B.DisconnectReason?.loggedOut;
      const shouldReconnect = code !== loggedOut;
      console.log(`[WA] user ${userId} — closed. code=${code} loggedOut=${loggedOut} reconnect=${shouldReconnect}`);
      if (shouldReconnect) {
        session.reconnectTimer = setTimeout(() => startSession(userId).catch(() => {}), 5_000);
      } else {
        sessions.delete(userId);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });
}

// ── On server boot, scan session dir and reconnect all saved sessions ─────
export function bootSessions(): void {
  if (!fs.existsSync(SESSIONS_DIR)) return;
  try {
    for (const dir of fs.readdirSync(SESSIONS_DIR)) {
      const uid = parseInt(dir, 10);
      if (!isNaN(uid) && fs.existsSync(path.join(SESSIONS_DIR, dir, "creds.json"))) {
        startSession(uid).catch(() => {});
      }
    }
  } catch {}
}

// ── Debug info ────────────────────────────────────────────────────────────
export function getDebugInfo(userId: number) {
  const s = sessions.get(userId);
  return {
    hasSession: !!s,
    isConnected: s?.isConnected ?? false,
    hasQR: !!s?.qr,
    phoneNumber: s?.phoneNumber ?? null,
    lastError: sessionErrors.get(userId) ?? null,
  };
}

// ── Status helpers ────────────────────────────────────────────────────────
export function getStatus(userId: number) {
  const s = sessions.get(userId);
  return {
    isConnected: s?.isConnected ?? false,
    phoneNumber: s?.phoneNumber ?? null,
    hasQR:       !!s?.qr,
  };
}

export function getQR(userId: number): string | null {
  return sessions.get(userId)?.qr ?? null;
}

export async function disconnect(userId: number): Promise<void> {
  const s = sessions.get(userId);
  if (s?.sock) {
    try { await s.sock.logout(); } catch {}
  }
  sessions.delete(userId);
  fs.rmSync(sessionDir(userId), { recursive: true, force: true });
}

// ── Send a plain-text WhatsApp message ───────────────────────────────────
export async function sendMessage(userId: number, phone: string, text: string): Promise<boolean> {
  const s = sessions.get(userId);
  if (!s?.isConnected || !s.sock) return false;
  try {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return false;
    const jid = `${digits}@s.whatsapp.net`;
    await s.sock.sendMessage(jid, { text });
    return true;
  } catch {
    return false;
  }
}

// ── Alert message builders (no Baileys needed) ───────────────────────────
export interface RepairAlertData {
  customerName:  string;
  customerPhone: string;
  phoneBrand:    string;
  phoneModel:    string;
  problem:       string;
  totalCost:     string | null;
  advancePaid:   string | null;
  shopName:      string;
  currency:      string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥",
  AUD: "A$", CAD: "C$", SGD: "S$", HKD: "HK$",
  INR: "₹", BDT: "৳", PKR: "₨", LKR: "Rs",
  AED: "د.إ", SAR: "﷼", QAR: "﷼", KWD: "د.ك",
  OMR: "ر.ع.", BHD: "BD", JOD: "JD",
  MYR: "RM", THB: "฿", IDR: "Rp", PHP: "₱",
  NGN: "₦", KES: "KSh", GHS: "₵", ZAR: "R",
  TRY: "₺", RUB: "₽", UAH: "₴", PLN: "zł",
};

function currSym(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? (code + " ");
}

export function buildAlertMessage(
  type: "created" | "ready" | "cancelled",
  d: RepairAlertData,
): string {
  const s = currSym(d.currency);
  const total     = Math.max(0, parseFloat(d.totalCost   ?? "0") || 0);
  const advance   = Math.max(0, parseFloat(d.advancePaid ?? "0") || 0);
  const remaining = Math.max(0, total - advance);
  const shop      = d.shopName || "your repair shop";

  if (type === "created") {
    let m = `Hi ${d.customerName} 👋\n\n`;
    m += `Your *${d.phoneBrand} ${d.phoneModel}* has been received at *${shop}*.\n\n`;
    m += `📋 Issue: ${d.problem}\n`;
    if (total > 0)   m += `💰 Estimated Total: ${s}${total.toFixed(2)}\n`;
    if (advance > 0) m += `✅ Advance Paid: ${s}${advance.toFixed(2)}\n`;
    m += `\nWe'll notify you when it's ready! 🔧`;
    return m;
  }

  if (type === "ready") {
    let m = `✅ Great news, ${d.customerName}!\n\n`;
    m += `Your *${d.phoneBrand} ${d.phoneModel}* is ready for pickup!\n\n`;
    if (total > 0) {
      m += `💰 Total Cost:    ${s}${total.toFixed(2)}\n`;
      if (advance > 0) {
        m += `✅ Advance Paid: ${s}${advance.toFixed(2)}\n`;
        if (remaining > 0) {
          m += `💳 *Due on pickup: ${s}${remaining.toFixed(2)}*\n`;
        } else {
          m += `✅ Fully paid — no balance due!\n`;
        }
      }
    }
    m += `\nPlease visit us to collect your device.\n— *${shop}*`;
    return m;
  }

  // cancelled
  let m = `❌ Repair Update — ${d.customerName}\n\n`;
  m += `Unfortunately we could not complete the repair on your *${d.phoneBrand} ${d.phoneModel}*.\n\n`;
  m += `Please contact us for more details.\n— *${shop}*`;
  return m;
}
