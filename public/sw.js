const CACHE_NAME = "pos-gerobak-v1";

// Aset yang di-cache saat instalasi
const PRECACHE = ["/login", "/manifest.webmanifest"];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
});

// ── Activate — bersihkan cache lama ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Abaikan non-GET
  if (request.method !== "GET") return;

  // Abaikan API routes dan auth — selalu ke network
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/")
  )
    return;

  // Cache-first untuk static assets Next.js (nama file sudah pakai hash)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, res.clone()));
            return res;
          })
      )
    );
    return;
  }

  // Cache-first untuk ikon, manifest, dan aset statis public/
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?|css)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, res.clone()));
            }
            return res;
          })
      )
    );
    return;
  }

  // Network-first untuk halaman (navigasi) — fallback ke cache jika offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }
});
