self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("sonarrock-cache").then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/styles.css",
        "/icons/icon-192.png",
        "/icons/icon-512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
