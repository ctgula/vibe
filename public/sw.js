// Enhanced Service Worker for Apple-level PWA experience
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const CACHE_PREFIX = 'vibe-';

workbox.setConfig({ debug: false });
workbox.core.setCacheNameDetails({
  prefix: CACHE_PREFIX,
  suffix: 'v1',
  precache: 'app-shell',
  runtime: 'runtime'
});

// Skip waiting so the new service worker activates immediately
self.skipWaiting();
workbox.core.clientsClaim();

// Cleanup outdated caches
workbox.precaching.cleanupOutdatedCaches();

// Precache manifest (auto-generated during build)
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// Handle messages from clients (like update notifications)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline actions
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('offline-queue', {
  maxRetentionTime: 24 * 60 // Retry for up to 24 hours
});

// API routes with background sync for offline support
workbox.routing.registerRoute(
  /\/api\/profile\/.*/,
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'PUT'
);

workbox.routing.registerRoute(
  /\/api\/rooms\/.*/,
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

// Start URL (home page) - crucial for PWA
workbox.routing.registerRoute(
  '/',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}start-url`,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// Static assets - use cache first for performance
workbox.routing.registerRoute(
  /\/_next\/static\/.*/i,
  new workbox.strategies.CacheFirst({
    cacheName: `${CACHE_PREFIX}static-assets`,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Next.js data - use stale while revalidate for balance
workbox.routing.registerRoute(
  /\/_next\/data\/.*/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}next-data`,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 10 * 60 // 10 minutes
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// Images - cache first with long expiration
workbox.routing.registerRoute(
  /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
  new workbox.strategies.CacheFirst({
    cacheName: `${CACHE_PREFIX}images`,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Next.js Image Optimization
workbox.routing.registerRoute(
  /\/_next\/image\?url=.*/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}next-images`,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      })
    ]
  })
);

// Fonts - long cache lifetime
workbox.routing.registerRoute(
  /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
  new workbox.strategies.CacheFirst({
    cacheName: `${CACHE_PREFIX}fonts`,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
      })
    ]
  })
);

// JavaScript and CSS
workbox.routing.registerRoute(
  /\.(?:js|css)$/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}static-resources`,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 1 day
      })
    ]
  })
);

// API routes - network first with quick timeout
workbox.routing.registerRoute(
  /\/api\/.*/i,
  new workbox.strategies.NetworkFirst({
    cacheName: `${CACHE_PREFIX}api-responses`,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ],
    networkTimeoutSeconds: 3
  })
);

// Pages we want available offline
const offlineAvailablePages = [
  '/',
  '/rooms',
  '/profile', 
  '/notifications',
  '/discover'
];

// Special handling for offline-available pages
offlineAvailablePages.forEach(route => {
  workbox.routing.registerRoute(
    new RegExp(`^${route}/?$`, 'i'),
    new workbox.strategies.NetworkFirst({
      cacheName: `${CACHE_PREFIX}offline-pages`,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: offlineAvailablePages.length,
          maxAgeSeconds: 24 * 60 * 60 // 1 day
        })
      ]
    })
  );
});

// Offline fallback page
const offlineFallbackPage = '/offline';

// Cache the offline page on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(`${CACHE_PREFIX}offline`).then((cache) => {
      return cache.add(offlineFallbackPage);
    })
  );
});

// Offline fallback for navigation requests
workbox.routing.setCatchHandler(({ event }) => {
  if (event.request.mode === 'navigate') {
    return caches.match(offlineFallbackPage);
  }
  return Response.error();
});

// API to expose cached pages to the offline UI
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/get-cached-pages')) {
    event.respondWith((async () => {
      try {
        const cache = await caches.open(`${CACHE_PREFIX}offline-pages`);
        const keys = await cache.keys();
        const urls = keys.map(request => {
          const url = new URL(request.url);
          return url.pathname;
        });
        
        return new Response(JSON.stringify({ 
          cachedPages: urls.length > 0 ? urls : offlineAvailablePages,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          cachedPages: offlineAvailablePages,
          error: 'Error retrieving cache data'
        }), { 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    })());
  }
});
