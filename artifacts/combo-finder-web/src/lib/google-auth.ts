/**
 * Google Sign-In / Registration Helper using Google Identity Services (GIS).
 */

let cachedClientId: string | null = null;

export async function getGoogleClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;

  // 1. Check Vite build-time environment variable
  const viteClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();
  if (viteClientId) {
    cachedClientId = viteClientId;
    return viteClientId;
  }

  // 2. Fetch from backend /api/auth/config
  try {
    const res = await fetch("/api/auth/config");
    if (res.ok) {
      const data = await res.json();
      if (data.googleClientId && typeof data.googleClientId === "string") {
        cachedClientId = data.googleClientId.trim();
        return cachedClientId;
      }
    }
  } catch (e) {
    console.error("Failed to fetch auth config", e);
  }

  return "";
}

/**
 * Ensures Google Identity Services (GIS) client library is loaded.
 */
function waitForGoogleScript(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.oauth2) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        // Try dynamic script insertion if not present
        if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.onload = () => {
            if ((window as any).google?.accounts?.oauth2) resolve();
            else reject(new Error("Google Identity Services script loaded but oauth2 is unavailable."));
          };
          script.onerror = () => reject(new Error("Failed to load Google Identity Services library."));
          document.head.appendChild(script);
        } else {
          reject(new Error("Google Identity Services library did not initialize in time."));
        }
      }
    }, 100);
  });
}

/**
 * Triggers Google Sign-In popup and authenticates with backend.
 */
export async function triggerGoogleAuth(): Promise<{ success: boolean; isNewUser?: boolean; user?: any }> {
  await waitForGoogleScript();
  const clientId = await getGoogleClientId();

  if (!clientId) {
    throw new Error(
      "Google Client ID is missing. Please add GOOGLE_CLIENT_ID in your project environment settings."
    );
  }

  return new Promise((resolve, reject) => {
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || "Google sign-in was cancelled or failed."));
            return;
          }

          try {
            // Fetch Google User Profile info
            const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });

            if (!profileRes.ok) {
              throw new Error("Could not retrieve Google profile details.");
            }

            const profile = await profileRes.json();

            // Send to backend endpoint
            const authRes = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                email: profile.email,
                name: profile.name || profile.email?.split("@")[0] || "User",
                picture: profile.picture,
                googleId: profile.sub,
              }),
            });

            const authData = await authRes.json();
            if (!authRes.ok || !authData.success) {
              throw new Error(authData.error || "Authentication with Google failed on the server.");
            }

            resolve(authData);
          } catch (err: any) {
            reject(err);
          }
        },
      });

      client.requestAccessToken({ prompt: "select_account" });
    } catch (err: any) {
      reject(new Error(err.message || "Failed to initialize Google Sign-In popup."));
    }
  });
}
