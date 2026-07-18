/**
 * Google Drive backup for Free-plan users.
 * Uses Google Identity Services (GIS) — no server needed, zero DB load.
 * Scope: drive.file (only files this app creates — user's other Drive files are private)
 */

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "") as string;
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const BACKUP_FILENAME = "combofinder-backup.json";

const TOKEN_KEY        = "cf_gdrive_token";
const TOKEN_EXPIRY_KEY = "cf_gdrive_token_expiry";

// ── Token management ──────────────────────────────────────────────────────────

/** Return stored access token if still valid (with 60-second buffer), else null */
export function getStoredToken(): string | null {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY) ?? "0");
  if (!token || Date.now() > expiry - 60_000) return null;
  return token;
}

/** True if a valid Drive token is in localStorage */
export function isGDriveConnected(): boolean {
  return !!getStoredToken();
}

/** Remove Drive token from localStorage (disconnect) */
export function clearGDriveToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Open Google consent popup and request a Drive access token.
 * MUST be called from a user-gesture handler (button click).
 */
export function requestGDriveToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error("Google Client ID not configured (VITE_GOOGLE_CLIENT_ID missing)"));
      return;
    }
    const g = (window as any).google;
    if (!g?.accounts?.oauth2) {
      reject(new Error("Google Identity Services not loaded — try refreshing the page"));
      return;
    }
    const client = g.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error ?? "Google auth failed"));
          return;
        }
        const expiry = Date.now() + (resp.expires_in ?? 3600) * 1000;
        localStorage.setItem(TOKEN_KEY, resp.access_token);
        localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}

// ── Drive API helpers ─────────────────────────────────────────────────────────

/** Find the existing backup file in Drive, returns file ID or null */
async function findBackupFile(token: string): Promise<string | null> {
  const q   = encodeURIComponent(`name='${BACKUP_FILENAME}' and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Drive search failed (${res.status})`);
  const { files } = (await res.json()) as { files: { id: string }[] };
  return files.length ? files[0].id : null;
}

/** Upload / overwrite combofinder-backup.json in the user's Drive */
export async function uploadToDrive(data: object, token: string): Promise<void> {
  const existingId = await findBackupFile(token);

  const content  = JSON.stringify(data, null, 2);
  const blob     = new Blob([content], { type: "application/json" });
  const metadata = JSON.stringify({ name: BACKUP_FILENAME, mimeType: "application/json" });

  const form = new FormData();
  form.append("metadata", new Blob([metadata], { type: "application/json" }));
  form.append("file", blob);

  const url    = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
  const method = existingId ? "PATCH" : "POST";

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Drive upload failed (${res.status})`);
}

/** Download the latest backup JSON from Drive, or null if none exists */
export async function downloadFromDrive(token: string): Promise<object | null> {
  const fileId = await findBackupFile(token);
  if (!fileId) return null;

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Drive download failed (${res.status})`);
  return res.json();
}

// ── Auto-backup (WhatsApp-style) ──────────────────────────────────────────────

/**
 * Silently upload a backup to Drive if:
 *   - A valid token is already stored (user has connected Drive)
 *   - The last backup was more than 24 hours ago
 * Never shows a popup — skips silently if not connected.
 */
export async function silentDriveBackup(
  userId: number,
  exportData: () => object,
): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false; // not connected — skip

  const key  = `cf_last_backup_${userId}`;
  const last = Number(localStorage.getItem(key) ?? "0");
  if (Date.now() - last < 24 * 60 * 60 * 1000) return false; // backed up recently

  try {
    await uploadToDrive(exportData(), token);
    localStorage.setItem(key, String(Date.now()));
    return true;
  } catch {
    // Token likely expired — clear so user sees "reconnect" prompt in Settings
    clearGDriveToken();
    return false;
  }
}
