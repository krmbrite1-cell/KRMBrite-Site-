// ✅ KRM Brite Service Worker - Images Only Caching
const CACHE_VERSION = 'v10'; // Force update to bust old caches
const STATIC_CACHE = `krm-static-${CACHE_VERSION}`;
const IMAGE_CACHE  = `krm-images-${CACHE_VERSION}`;

// Only cache the bare minimum logo and favicon
const STATIC_ASSETS = [
  './logo.avif',
  './favicon.ico'
];

// ── INSTALL: pre-cache bare essentials ──────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// ── ACTIVATE: clean up old caches ────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== IMAGE_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── MESSAGE: background precaching ───────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PRECACHE_IMAGES') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(IMAGE_CACHE).then(cache => {
        return Promise.all(
          urls.map(url => {
            return cache.match(url).then(existing => {
              if (!existing) {
                // Fetch and cache only if not already in cache
                return fetch(url).then(response => {
                  if (response.ok) cache.put(url, response);
                }).catch(() => {});
              }
            });
          })
        );
      })
    );
  }
});

// ── FETCH: smart routing ──────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Images → Cache-First (fast!) with 7-day limit
  if (isImageRequest(url)) {
    event.respondWith(cacheFirstImage(event.request));
    return;
  }

  // 2. Static app shell & Firebase / external APIs → Network-Only (No Caching for Freshness)
  // We bypass the cache entirely for code files as requested
  event.respondWith(fetch(event.request).catch(() => {
    // Only fall back to cache if network fails (offline support)
    return caches.match(event.request);
  }));
});

// ── STRATEGIES ────────────────────────────────────────────────

// Cache-First for images (fastest perceived load)
async function cacheFirstImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Only cache same-origin or AVIF/WebP product images
      if (request.url.startsWith(self.location.origin)) {
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch (e) {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

// Network-First (for APIs, dynamic data, and now static assets to ensure freshness)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Only cache successful basic requests
      if (request.url.startsWith(self.location.origin) || response.type === 'basic') {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 408, statusText: 'Offline' });
  }
}

// ── HELPERS ───────────────────────────────────────────────────
function isImageRequest(url) {
  return /\.(avif|webp|png|jpg|jpeg|gif|svg|ico)(\?.*)?$/.test(url.pathname);
}

function isStaticAsset(url) {
  return url.origin === self.location.origin &&
    /\.(html|css|js|json)(\?.*)?$/.test(url.pathname);
}
