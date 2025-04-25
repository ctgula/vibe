// Vibe PWA Service Worker (2025 optimized)
const CACHE_NAME = 'vibe-pwa-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  // CSS and JS assets
  '/_next/static/css/app.css', 
  // Add more assets as needed
];

// Enhanced install event for faster mobile loading
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error('Cache opening failed:', err))
  );
  self.skipWaiting();
});

// Optimized activate event for cleanup
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('Removing old cache', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Strategy: Stale-while-revalidate for optimal mobile performance
self.addEventListener('fetch', event => {
  // Skip cross-origin and non-GET requests
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }
  
  // Exclude API calls or other dynamic resources
  if (event.request.url.includes('/api/') || event.request.url.includes('/_next/data/')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return cached response immediately if available
      if (cachedResponse) {
        // Fetch a fresh version in the background to update cache
        const fetchPromise = fetch(event.request)
          .then(response => {
            // Skip caching error responses or non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          })
          .catch(err => {
            console.log('Fetch failed; returning cached response instead.', err);
          });
          
        return cachedResponse;
      }
      
      // If no cache, fetch from network and cache for future
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(error => {
          console.error('Fetch failed:', error);
          // Optionally return a custom offline page
          // return caches.match('/offline.html');
        });
    })
  );
});

// Push notifications (future)
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  self.registration.showNotification(data.title || 'Vibe', {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: data.url || '/',
    vibrate: [100, 50, 100], // Mobile haptic feedback pattern
    actions: data.actions || []
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Focus on existing client if available
  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true})
      .then(windowClients => {
        // If a window client is available, navigate and focus it
        for (let client of windowClients) {
          if (client.url === event.notification.data && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data || '/');
        }
      })
  );
});
