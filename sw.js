/* WuWa 픽업 플래너 — 서비스 워커
   앱 셸을 캐시해서 오프라인/설치형(PWA)으로 동작하게 합니다.
   배포 시 CACHE_VERSION을 올리면 이전 캐시가 정리됩니다. */

const CACHE_VERSION = 'wuwa-planner-v13';
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/app-192.v2.png',
  './icons/app-512.v2.png',
  './icons/app-180.v2.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 같은 출처 GET: 네트워크 우선(항상 최신), 실패 시 캐시(오프라인 지원)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(hit => hit || caches.match('./index.html'))
      )
  );
});
