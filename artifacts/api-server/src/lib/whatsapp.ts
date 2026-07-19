/**
 * WhatsApp Alert Service — per-user Baileys sessions
 * Each Pro user connects their own WhatsApp number by scanning a QR code.
 * Sessions are stored on the filesystem at WA_SESSIONS_DIR/{userId}/.
 */
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";
import P from "pino";

const SESSIONS_DIR = process.env["WA_SESSIONS_DIR"] ?? "/tmp/wa-sessions";
const baileysLog = P({ level: "silent" }) as any;

interface Session {
  sock: ReturnType<typeof makeWASocket> | null;
  qr: string | null;           // PNG data-URL for display
  isConnected: boolean;
  phoneNumber: string | null;
  reconnectTimer?: ReturnType<typeof setTimeout>;
}

const sessions = new Map<number, Session>();

function sessionDir(userId: number): string {
  return path.join(SESSIONS_DIR, String(userId));
}

// ── Start / reconnect a session ────────────────────────────────────────────
export async function startSession(userId: number): Promise<void> {
  const dir = sessionDir(userId);
  fs.mkdirSync(dir, { recursive: true });

  const existing = sessions.get(userId);
  if (existing?.isConnected) return;
  if (existing?.reconnectTimer) clearTimeout(existing.reconnectTimer);

  const { state, saveCreds } = await useMultiFileAuthState(dir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: baileysLog,
    printQRInTerminal: false,
    browser: ["ComboFinder", "Chrome", "1.0"],
  });

  const session: Session = { sock, qr: null, isConnected: false, phoneNumber: null };
  sessions.set(userId, session);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const QRCode = (await import("qrcode")).default;
        session.qr = await QRCode.toDataURL(qr);
      } catch {
        session.qr = null;
      }
    }

    if (connection === "open") {
      session.isConnected = true;
      session.qr = null;
      const jid = sock.user?.id ?? "";
      session.phoneNumber = jid.split(":")[0].split("@")[0];
    }

    if (connection === "close") {
      session.isConnected = false;
      session.phoneNumber = null;
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        session.reconnectTimer = setTimeout(() => startSession(userId).catch(() => {}), 5_000);
      } else {
        sessions.delete(userId);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });
}

// ── On server boot, scan session dir and reconnect all saved sessions ────
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

// ── Status helpers ─────────────────────────────────────────────────────────
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

// ── Send a plain-text WhatsApp message ────────────────────────────────────
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

// ── Alert message builders ─────────────────────────────────────────────────
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
