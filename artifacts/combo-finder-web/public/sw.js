const CACHE_NAME = "combofinder-v3";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).pathname.startsWith("/api/")) return;
  // Never cache favicon/logo — always fetch fresh
  const url = new URL(e.request.url);
  if (url.pathname.includes("favicon") || url.pathname.includes("logo")) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(fetch(e.request).then(res => { caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone())); return res; }).catch(() => caches.match(e.request)));
});
