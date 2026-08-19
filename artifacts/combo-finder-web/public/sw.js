const CACHE_NAME = "combofinder-v4";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).pathname.startsWith("/api/")) return;
  // Never cache favicon, logo, or JS/CSS bundles — always fetch fresh
  const url = new URL(e.request.url);
  const path = url.pathname;
  if (
    path.includes("favicon") ||
    path.includes("logo") ||
    path.endsWith(".js") ||
    path.endsWith(".css")
  ) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => { caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone())); return res; })
      .catch(() => caches.match(e.request))
  );
});
