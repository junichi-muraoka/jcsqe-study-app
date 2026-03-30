// 運用者が変える可能性がある設定 JS はプリキャッシュしない（常にネットワーク取得）
const CACHE_NAME = 'jcsqe-v18';
const ASSETS = [
  './', './index.html', './style.css', './app.js',
  './js/storage.js', './js/state.js', './js/sync-firebase-errors.js',
  './js/d1-sync.js', './js/firebase-sync.js',
  './questions.js', './questions_extra1.js', './questions_extra2.js', './questions_extra3.js', './questions_extra4.js',
  './explanations_extra.js', './explanations_exp3.js', './explanations.js', './glossary.js', './study-data.js', './manifest.json'
];

function isOperatorConfigScript(url) {
  const p = url.pathname;
  return /\/firebase-config\.js$/.test(p) || /\/d1-sync-config\.js$/.test(p);
}

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
  const url = new URL(e.request.url);
  if (isOperatorConfigScript(url)) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
