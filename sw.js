const CACHE_NAME = 'quote-pwa-v3';

const STATIC_ASSETS = [
  './',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 새 버전 설치
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 이전 캐시 삭제 + 즉시 적용
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// HTML/navigation은 항상 최신 서버 파일을 우선.
// 정적 리소스는 캐시를 사용하되 없으면 네트워크에서 가져옴.
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const isNavigation =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.url.endsWith('/index.html');

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put('./index.html', copy);
          });
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // quotes.json은 캐시에 넣지 않음.
  if (request.url.includes('/quotes.json')) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
