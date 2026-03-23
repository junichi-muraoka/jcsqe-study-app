const CACHE_NAME = 'jcsqe-v11';
const ASSETS = [
  './', './index.html', './style.css', './app.js',
  './js/storage.js', './js/state.js',
  './questions.js', './questions_extra1.js', './questions_extra2.js', './questions_extra3.js', './questions_extra4.js',
  './explanations_extra.js', './explanations_exp3.js', './explanations.js', './glossary.js', './study-data.js', './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
