/**
 * Google Drive backup for Free-plan users.
 * Uses Google Identity Services (GIS) — no server needed, zero DB load.
 * Scope: drive.file (only files this app creates — user's other Drive files are private)
 */

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "") as string;
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const BACKUP_FILENAME = "combofinder-backup.json";

const TOKEN_KEY           = "cf_gdrive_token";
const TOKEN_EXPIRY_KEY    = "cf_gdrive_token_expiry";
/** Persists across token expiry — set on first connect, cleared only on explicit disconnect */
const EVER_CONNECTED_KEY  = "cf_gdrive_ever_connected";

// ── Token management ──────────────────────────────────────────────────────────

/** Return stored access token if still valid (with 60-second buffer), else null */
export function getStoredToken(): string | null {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY) ?? "0");
  if (!token || Date.now() > expiry - 60_000) return null;
  return token;
}

/** True if a valid (non-expired) Drive token is in localStorage */
export function isGDriveConnected(): boolean {
  return !!getStoredToken();
}

/**
 * True if the user has ever connected Drive in this browser.
 * Remains true even after token expiry so we can silently refresh.
 */
export function hadGDriveConnected(): boolean {
  return localStorage.getItem(EVER_CONNECTED_KEY) === "1";
}

/** Remove only the access token (e.g. on upload failure). Does NOT clear the
 *  ever-connected flag so silent refresh can be attempted next time. */
export function clearGDriveToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/** Full disconnect — clears token AND the ever-connected flag.
 *  Call this only when the user explicitly clicks "Disconnect". */
export function disconnectGDrive() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(EVER_CONNECTED_KEY);
}

function saveToken(token: string, expiresIn: number) {
  const expiry = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
  localStorage.setItem(EVER_CONNECTED_KEY, "1");
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
        saveToken(resp.access_token, resp.expires_in ?? 3600);
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}

/**
 * Silently request a new token using previously-granted consent (no popup).
 * Returns true if a fresh token was obtained, false if user revoked access
 * or Google can't refresh silently.
 * Safe to call without a user gesture.
 */
export function silentRefreshToken(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!CLIENT_ID) { resolve(false); return; }
    const g = (window as any).google;
    if (!g?.accounts?.oauth2) { resolve(false); return; }
    const client = g.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => {
        if (resp.error || !resp.access_token) {
          // Access was revoked or silent refresh not possible — clear the token
          // but keep EVER_CONNECTED_KEY so the UI can show "reconnect" instead
          // of "connect" (better UX — user knows they had it connected before).
          clearGDriveToken();
          resolve(false);
          return;
        }
        saveToken(resp.access_token, resp.expires_in ?? 3600);
        resolve(true);
      },
    });
    // prompt: "" means "use existing consent, no popup"
    client.requestAccessToken({ prompt: "" });
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

// ── Auto-backup ───────────────────────────────────────────────────────────────

/**
 * Silently upload a backup to Drive if:
 *   - A valid token is already stored OR can be silently refreshed
 *   - The last backup was more than 24 hours ago
 * Never shows a popup — skips silently if not connected.
 */
export async function silentDriveBackup(
  userId: number,
  exportData: () => object,
): Promise<boolean> {
  // Try to get a valid token — refresh silently if expired
  let token = getStoredToken();
  if (!token && hadGDriveConnected()) {
    const refreshed = await silentRefreshToken();
    if (refreshed) token = getStoredToken();
  }
  if (!token) return false; // not connected — skip

  const key  = `cf_last_backup_${userId}`;
  const last = Number(localStorage.getItem(key) ?? "0");
  if (Date.now() - last < 24 * 60 * 60 * 1000) return false; // backed up recently

  try {
    await uploadToDrive(exportData(), token);
    localStorage.setItem(key, String(Date.now()));
    return true;
  } catch {
    // Token likely expired mid-session — clear token but keep ever-connected
    // flag so next session can try silent refresh again.
    clearGDriveToken();
    return false;
  }
}
