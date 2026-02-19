// public/sw.js
const CACHE_NAME = "hissab-app-v8"; // bump version when changing

// const APP_SHELL = [
//   "/",
//   "/offline",
//   "/manifest.json",
//   "/favicon.ico",
//   "/globals.css",
//   // Icons
//   "/icons/icon-72x72.png",
//   "/icons/icon-96x96.png",
//   "/icons/icon-128x128.png",
//   "/icons/icon-144x144.png",
//   "/icons/icon-152x152.png",
//   "/icons/icon-192x192.png",
//   "/icons/icon-512x512.png",
// ];

const APP_SHELL = [
  "/",
  "/offline",
  '/dashboard',
  '/invoices',
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install
self.addEventListener("install", (event) => {
  console.log("[SW] Installing v5");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching app shell");
        // Cache individually to see what fails
        return Promise.allSettled(
          APP_SHELL.map((url) =>
            cache.add(url)
              .then(() => console.log(`[SW] ✅ ${url}`))
              .catch((e) => console.error(`[SW] ❌ ${url}:`, e))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating v5");
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET
  if (req.method !== "GET") return;

  // API calls (Supabase) — network first
  if (url.origin.includes("supabase.co") || url.pathname.includes("/rest/v1/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then(c => c || caches.match("/offline")))
    );
    return;
  }

  // Next.js static assets — cache first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // Navigation requests (HTML pages) — NETWORK FIRST, then cache, then offline
  const acceptHeader = req.headers.get("accept") || "";
  if (req.mode === "navigate" || acceptHeader.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Cache successful pages
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          // Network failed - try cache, then offline page
          console.log("[SW] Network failed, trying cache");
          return caches.match(req)
            .then(cached => cached || caches.match("/offline"));
        })
    );
    return;
  }

  // Everything else — cache first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});