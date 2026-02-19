// public/sw.js - v7 - better offline support for Next.js App Router
const CACHE_NAME = 'hissab-app-v7';

// Pre-cache critical static files (shell + manifest + icons)
const STATIC_SHELL = [
  '/',
  '/offline',
  '/dashboard',
  '/invoices',
  '/manifest.json',
  '/favicon.ico',
  '/globals.css',
  '/hissab.png',
  '/heroImage.jpg',
  // Icons
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: cache static shell
self.addEventListener('install', (event) => {
  console.log('[SW v7] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW v7] Caching static shell');
      return cache.addAll(STATIC_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW v7] Activating...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  // 1. Supabase API calls → network-first (no cache needed)
  if (url.origin.includes('supabase.co') || url.pathname.includes('/rest/v1/')) {
    event.respondWith(
      fetch(req).catch(() => new Response('Offline - API unavailable', { status: 503 }))
    );
    return;
  }

  // 2. Next.js static chunks & assets → cache-first + background update
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        }).catch(() => cached); // fallback to cache if fetch fails
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. HTML navigation requests → network-first, fallback to cache or /offline
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Cache successful navigation responses
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => {
          console.log('[SW v7] Navigation failed - falling back to cache/offline');
          return caches.match(req) || caches.match('/offline') || caches.match('/');
        })
    );
    return;
  }

  // 4. Everything else (images, CSS, fonts, etc.) → cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});