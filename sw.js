// Cache hors ligne. Changer le numéro de version à chaque publication.
const CACHE = 'faisceau-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  // un fichier manquant ne doit pas bloquer l'installation
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(ASSETS.map((u) => cache.add(u).catch(() => {})))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

function store(req, res) {
  if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
    const copy = res.clone();
    caches.open(CACHE).then((cache) => cache.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    // page: réseau d'abord pour recevoir les mises à jour, cache si hors ligne
    event.respondWith(fetch(req).then((res) => store(req, res)).catch(() => caches.match(req).then((c) => c || caches.match('./index.html'))));
    return;
  }
  // reste (icônes, polices): cache d'abord
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => store(req, res))));
});
