import Constants from "expo-constants";
import { useEffect, useState } from "react";

const RELEASES_REPO = "Ariyan0005/combofinder-releases";
const API_URL = `https://api.github.com/repos/${RELEASES_REPO}/releases/latest`;

export interface UpdateInfo {
  version: string;       // e.g. "1.0.2"
  downloadUrl: string;   // APK direct link or release page
  releaseNotes: string;
}

function parseVersion(tag: string): number[] {
  return tag.replace(/^v/, "").split(".").map(Number);
}

function isNewer(latest: string, current: string): boolean {
  const l = parseVersion(latest);
  const c = parseVersion(current);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lv = l[i] ?? 0;
    const cv = c[i] ?? 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

export function useUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    const currentVersion = Constants.expoConfig?.version ?? "0.0.0";

    fetch(API_URL)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.tag_name) return;

        const latestTag = data.tag_name as string;

        if (!isNewer(latestTag, currentVersion)) return;

        // APK asset থাকলে direct link, না থাকলে release page
        const apkAsset = (data.assets as any[])?.find((a: any) =>
          a.name?.endsWith(".apk")
        );
        const downloadUrl: string = apkAsset
          ? apkAsset.browser_download_url
          : data.html_url;

        setUpdateInfo({
          version: latestTag.replace(/^v/, ""),
          downloadUrl,
          releaseNotes: data.body ?? "",
        });
      })
      .catch(() => {
        // network error — silently ignore
      });
  }, []);

  return { updateInfo, dismiss: () => setUpdateInfo(null) };
}
