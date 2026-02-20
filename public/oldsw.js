// public/sw.js - v8
const CACHE_NAME = 'hissab-app-v8';

const STATIC_SHELL = [
  '/',
  '/offline',
  '/dashboard',
  '/invoices',
  '/manifest.json',
  '/favicon.ico',
  '/hissab.png',
  '/heroImage.jpg',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW v8] Installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        // Cache individually so one 404 doesn't kill the whole install
        Promise.allSettled(
          STATIC_SHELL.map((url) =>
            cache.add(url).catch((err) =>
              console.warn(`[SW v8] Failed to cache: ${url}`, err)
            )
          )
        )
      )
      .then(() => {
        console.log('[SW v8] Install complete');
        return self.skipWaiting(); // inside waitUntil ✓
      })
  );
});

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW v8] Activating...');
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log(`[SW v8] Deleting old cache: ${key}`);
              return caches.delete(key);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET requests
  if (req.method !== 'GET') return;

  // ── 1. Supabase / external API → network only, fail gracefully ────────
  if (
    url.origin.includes('supabase.co') ||
    url.pathname.includes('/rest/v1/')
  ) {
    event.respondWith(
      fetch(req).catch(
        () =>
          new Response(JSON.stringify({ error: 'Offline - API unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    );
    return;
  }

  // ── 2. Next.js static chunks → cache-first, update in background ──────
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(req, res.clone()));
            }
            return res;
          })
          .catch(() => cached); // network failed → return stale cache

        return cached || networkFetch;
      })
    );
    return;
  }

  // ── 3. HTML navigation → network-first, fallback to cache → /offline ──
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(async () => {
          console.log('[SW v8] Offline - serving from cache or /offline page');
          return (
            (await caches.match(req)) ??
            (await caches.match('/offline')) ??
            (await caches.match('/'))
          );
        })
    );
    return;
  }

  // ── 4. Everything else (images, fonts, icons) → cache-first ──────────
  event.respondWith(
    caches
      .match(req)
      .then((cached) => cached || fetch(req))
      .catch(() => {
        // If it's an image request and we have nothing, return a transparent pixel
        if (req.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      })
  );
});