// public/sw.js - v11
const CACHE_NAME = 'hissab-app-v11';
const STATIC_CACHE = 'hissab-static-v11';
const DYNAMIC_CACHE = 'hissab-dynamic-v11';

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

// Only cache http/https requests.
// chrome-extension://, data:, blob: etc. will throw on cache.put()
function isCacheable(request) {
  try {
    const url = new URL(request.url || request);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW v10] Installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          STATIC_SHELL.map((url) =>
            cache.add(url).catch((err) =>
              console.warn(`[SW v10] Failed to cache: ${url}`, err)
            )
          )
        )
      )
      .then(() => {
        console.log('[SW v10] Install complete');
        // Warm up these pages so their JS chunks get fetched and cached
        // This ensures /offline and /dashboard chunks are available offline
        fetch('/offline').catch(() => {});
        fetch('/dashboard').catch(() => {});
        return self.skipWaiting();
      })
  );
});

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW v10] Activating...');
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log(`[SW v10] Deleting old cache: ${key}`);
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

  // Ignore non-GET and non-cacheable schemes (chrome-extension://, etc.)
  if (req.method !== 'GET' || !isCacheable(req)) return;

  const url = new URL(req.url);

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

  // ── 2. Next.js HASHED static chunks → cache-first, never expire ───────
  // These files have content hashes in their name — they are immutable.
  // Same filename always means same content, so cache-first forever is safe.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;

        try {
          const networkRes = await fetch(req);
          if (networkRes && networkRes.status === 200 && isCacheable(req)) {
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        } catch {
          console.warn('[SW v10] Static asset not cached and offline:', url.pathname);
          return new Response('/* offline - asset not cached */', {
            status: 503,
            headers: { 'Content-Type': 'text/css' },
          });
        }
      })
    );
    return;
  }

  // ── 2b. Next.js image optimization ────────────────────────────────────
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;

        try {
          const res = await fetch(req);
          if (res && res.status === 200 && isCacheable(req)) {
            cache.put(req, res.clone());
          }
          return res;
        } catch {
          return cached || new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // ── 3. HTML navigation → network-first, fallback to cache → /offline ──
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200 && isCacheable(req)) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(async () => {
          console.log('[SW v10] Offline - serving from cache or /offline page');
          const cached = await caches.match(req);
          if (cached) return cached;

          const offlinePage = await caches.match('/offline');
          if (offlinePage) return offlinePage;

          return caches.match('/');
        })
    );
    return;
  }

  // ── 4. Everything else (images, fonts, icons) → stale-while-revalidate ──
  event.respondWith(
    caches.open(DYNAMIC_CACHE).then(async (cache) => {
      const cached = await cache.match(req);

      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && isCacheable(req)) {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

// ─── Message handler ───────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Pre-cache a list of URLs sent from the app (used by SWCacheWarmer)
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = (event.data.urls || []).filter((url) => isCacheable(url));

    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) =>
        Promise.allSettled(
          urls.map((url) =>
            cache.add(url).catch((err) =>
              console.warn('[SW v10] Failed to pre-cache:', url, err)
            )
          )
        )
      )
    );
  }
});