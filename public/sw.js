// public/sw.js
const CACHE_NAME = "hissab-app-v4"; // bump version when changing

const APP_SHELL = [
  "/",
  "/offline",
  "/manifest.json",
  "/favicon.ico",
  "/globals.css",
  // Icons
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install
self.addEventListener("install", (event) => {
  console.log("[SW] Installing v4");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell");
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating v4");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
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
          // Cache successful API responses (optional)
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          // Offline → return cached or fallback
          return caches.match(req) || caches.match("/offline");
        })
    );
    return;
  }

  // Next.js static assets (_next/static/) — cache first
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

  // All other navigation requests (HTML pages) — cache first, fallback to offline
  if (req.headers.get("accept").includes("text/html")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return (
          cached ||
          fetch(req).then((res) => {
            // Cache new pages
            caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
            return res;
          })
        );
      }).catch(() => {
        // Completely offline → serve offline page or root
        return caches.match("/offline") || caches.match("/");
      })
    );
    return;
  }

  // Everything else (images, fonts, etc.) — cache first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});