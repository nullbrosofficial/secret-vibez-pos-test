const CACHE_NAME = "secret-vibez-pos-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// On install, cache application shell core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// On activation, clean up old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first cache fallback strategy for assets, bypass on REST APIs and Sockets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isApiRequest = url.pathname.startsWith("/api/");
  const isSocketRequest = url.pathname.startsWith("/socket.io/");
  const isGetRequest = event.request.method === "GET";

  // Prevent caching of any transactional backend calls or WebSocket protocols
  if (isApiRequest || isSocketRequest || !isGetRequest) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response and update cache dynamically
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Retrieve from cache if network is down
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return default root index fallback for navigation routes (SPA fallback)
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
      })
  );
});
