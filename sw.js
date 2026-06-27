self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));

      const tabs = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window'
      });

      for (const tab of tabs) {
        tab.navigate(tab.url);
      }

      await self.registration.unregister();
    })()
  );
});
