/**
 * Service worker читалки.
 *
 * Все тексты и словарь лежат внутри приложения, поэтому после первого захода
 * оно должно полностью работать без интернета — в метро, в самолёте, где угодно.
 *
 * Стратегия: cache-first для файлов сборки (в их именах есть хеш, устаревания
 * нет) и network-first для самой страницы, с откатом на сохранённую копию.
 *
 * Область действия — папка, из которой отдан этот файл. Соседние приложения
 * в том же репозитории воркер не трогает.
 */

const CACHE = 'english-reader-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(['./', './index.html', './manifest.json']).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Чужие адреса (иллюстрации, Anthropic) не кешируем и не перехватываем.
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
          return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
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
