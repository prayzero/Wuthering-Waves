/* WuWa 픽업 플래너 — 서비스 워커
   앱 셸을 캐시해서 오프라인/설치형(PWA)으로 동작하게 합니다.
   배포 시 CACHE_VERSION을 올리면 이전 캐시가 정리됩니다. */

const CACHE_PREFIX = 'wuwa-planner-';
const CACHE_VERSION = 'wuwa-planner-v17';
const IMAGE_CACHE = 'wuwa-planner-images-v1';
const ACTIVE_CACHES = new Set([CACHE_VERSION, IMAGE_CACHE]);
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
      .then(keys => Promise.all(keys
        .filter(k => k.startsWith(CACHE_PREFIX) && !ACTIVE_CACHES.has(k))
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 같은 출처 GET: 네트워크 우선. 외부 캐릭터 이미지는 캐시 우선.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  if (url.origin !== location.origin) {
    if (e.request.destination !== 'image') return;
    e.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const hit = await cache.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok || res.type === 'opaque') {
        await cache.put(e.request, res.clone());
      }
      return res;
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    try {
      const res = await fetch(e.request);
      if (res.ok) {
        await cache.put(e.request, res.clone());
      }
      return res;
    } catch {
      const hit = await cache.match(e.request);
      if (hit) return hit;
      if (e.request.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      return Response.error();
    }
  })());
});
