/**
 * Service worker: приложение должно открываться офлайн после первой загрузки.
 *
 * Стратегия — cache-first для своих файлов (они версионируются хешем в имени,
 * так что устаревания нет) и network-first для навигации, с откатом на
 * закешированный index.html, когда сети нет.
 *
 * Прогресс живёт в localStorage и service worker его не трогает.
 */

const CACHE = 'vocab-trainer-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Кладём оболочку. Остальное (js/css с хешем) осядет при первом заходе.
      await cache.addAll(['./', './index.html', './manifest.json']).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put('./index.html', fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match('./index.html')) ||
            (await cache.match('./')) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.status === 200 && fresh.type === 'basic') {
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        return hit || Response.error();
      }
    })(),
  );
});
