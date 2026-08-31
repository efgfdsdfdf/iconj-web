self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // A fetch handler is required by Chrome to trigger the install prompt.
  // We don't cache anything offline right now, just pass the request through.
  return;
});
