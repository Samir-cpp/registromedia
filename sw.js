const CACHE = "registromedia-votiva-2-0-0";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.mjs",
  "./analytics.mjs",
  "./learning-ui.mjs",
  "./ocr.mjs",
  "./import-model.mjs",
  "./cloud.mjs",
  "./model.mjs",
  "./vault.mjs",
  "./theme.js",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./manifest.json",
];
self.addEventListener("install", (e) =>
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((k) => k.startsWith("registromedia-") && k !== CACHE)
              .map((k) => caches.delete(k)),
          ),
        ),
      self.clients.claim(),
    ]),
  ),
);
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/cloud-config.json")) return;
  if (/\/vendor\/ocr\/[a-zA-Z0-9._-]+\.(js|wasm|gz|txt)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(e.request);
        if (hit) return hit;
        const r = await fetch(e.request);
        if (r.ok) await c.put(e.request, r.clone());
        return r;
      }),
    );
    return;
  }
  e.respondWith(
    caches
      .open(CACHE)
      .then(async (c) => (await c.match(e.request)) || fetch(e.request)),
  );
});
