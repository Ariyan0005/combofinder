import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import * as WA from "../lib/whatsapp.js";

const router = Router();

function getUid(req: any, res: any): number | null {
  const uid: number | undefined = req.userId;
  if (!uid) { res.status(403).json({ error: "Unauthorized" }); return null; }
  return uid;
}

async function isPro(userId: number): Promise<boolean> {
  const [u] = await db.select({ plan: usersTable.subscriptionPlan })
    .from(usersTable).where(eq(usersTable.id, userId));
  return (u?.plan ?? "Free") !== "Free";
}

// ── GET /api/whatsapp/status ───────────────────────────────────────────────
router.get("/whatsapp/status", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    res.json(WA.getStatus(userId));
  } catch { res.status(500).json({ error: "Failed" }); }
});

// ── GET /api/whatsapp/qr — start session if needed, return QR data-URL ────
router.get("/whatsapp/qr", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;

    if (!await isPro(userId)) {
      return res.status(403).json({ error: "WhatsApp alerts require a Pro plan." });
    }

    const status = WA.getStatus(userId);
    if (status.isConnected) {
      return res.json({ connected: true, phoneNumber: status.phoneNumber, qr: null });
    }

    // Start session if no QR yet
    if (!status.hasQR) {
      WA.startSession(userId).catch((err) => {
        console.error("[WhatsApp] startSession error:", err?.message ?? err);
      });
      // Poll up to 20 s for QR to be generated (Baileys needs time to
      // establish WebSocket connection + negotiate handshake with WhatsApp)
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 500));
        if (WA.getQR(userId)) break;
      }
    }

    const qr = WA.getQR(userId);
    res.json({
      connected: false,
      qr,
      message: qr ? null : "Generating QR code… please refresh in a moment.",
    });
  } catch { res.status(500).json({ error: "Failed to get QR code" }); }
});

// ── GET /api/whatsapp/debug — internal diagnostics (no auth for easy curl) ─
router.get("/whatsapp/debug", async (req, res) => {
  try {
    const userId = (req as any).userId ?? 0;
    res.json(WA.getDebugInfo(userId));
  } catch (e: any) { res.status(500).json({ error: e?.message }); }
});

// ── DELETE /api/whatsapp/disconnect ───────────────────────────────────────
router.delete("/whatsapp/disconnect", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    await WA.disconnect(userId);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to disconnect" }); }
});

export default router;
