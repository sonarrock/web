self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("sonarrock-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/manifest.json",
        "/icons/android-chrome-192x192.png",
        "/icons/android-chrome-512x512.png"
      ]);
    })
  );
});
