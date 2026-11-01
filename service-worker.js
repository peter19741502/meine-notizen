
const CACHE = "meinenotizen-v1";

const ASSETS = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon.svg"
];

// Installation und Zwischenspeicherung
self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE).then(cache => {
            return cache.addAll(ASSETS);
        })
    );

    self.skipWaiting();
});

// Aktivierung und alte Cache-Versionen löschen
self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE)
                    .map(key => caches.delete(key))
            );
        })
    );

    self.clients.claim();
});

// Offline-Unterstützung
self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }

    const url = new URL(event.request.url);

    // Nur Dateien vom eigenen Server behandeln
    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(

        caches.match(event.request).then(cached => {

            if (cached) {
                return cached;
            }

            return fetch(event.request).then(response => {

                if (response.ok) {

                    const copy = response.clone();

                    caches.open(CACHE).then(cache => {
                        cache.put(event.request, copy);
                    });

                }

                return response;

            });

        })

    );

});
