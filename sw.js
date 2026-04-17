// 運用者が変える可能性がある firebase-config.js はプリキャッシュしない（常にネットワーク取得）
const CACHE_NAME = 'jcsqe-v27';
const ASSETS = [
  './', './index.html', './style.css', './app.js',
  './js/storage.js', './js/state.js', './js/sync-firebase-errors.js',
  './js/firebase-sync.js',
  './questions.js', './questions_extra1.js', './questions_extra2.js', './questions_extra3.js', './questions_extra4.js',
  './explanations_extra.js', './explanations_exp3.js', './explanations.js', './glossary.js', './study-data.js', './manifest.json'
];

function isFirebaseConfigScript(url) {
  return /\/firebase-config\.js$/.test(url.pathname);
}

/** 認証リダイレクト等でクエリ付きナビゲーションがキャッシュ命中すると不整合になるのを防ぐ */
function shouldBypassCacheForNavigation(url) {
  if (url.pathname.includes('/__/')) return true;
  const q = url.search;
  if (!q) return false;
  return /apiKey=|authType=|state=|code=|oauth|oobCode/i.test(q);
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
  if (isFirebaseConfigScript(url)) {
    e.respondWith(fetch(e.request));
    return;
  }
  if (e.request.mode === 'navigate' && shouldBypassCacheForNavigation(url)) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
