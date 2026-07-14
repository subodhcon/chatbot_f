const CACHE_NAME = "confluxaa-chatbot-cache-v1";
const STATIC_ASSETS = [
  "/login",
  "/logo.png",
  "/manifest.json"
];

// 1. Install service worker and cache core static shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching static shell assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate service worker and clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Intercept fetch requests: Cache-First for static assets, Network-First for HTML/APIs
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass non-GET requests or browser extension/chrome-extension requests
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Check if static asset (images, fonts, scripts, stylesheets)
  const isStaticAsset = 
    requestUrl.pathname.startsWith("/_next/static/") ||
    requestUrl.pathname.endsWith(".js") ||
    requestUrl.pathname.endsWith(".css") ||
    requestUrl.pathname.endsWith(".png") ||
    requestUrl.pathname.endsWith(".ico") ||
    requestUrl.pathname.endsWith(".json");

  if (isStaticAsset) {
    // Cache-First strategy
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
  } else {
    // Network-First strategy (fallback to cache if offline/error)
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache successful page navigations
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network is offline, attempt cached lookup
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If page is not in cache, fallback to main login page shell
            return caches.match("/login");
          });
        })
    );
  }
});
