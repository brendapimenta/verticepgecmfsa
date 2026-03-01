// VÉRTICE – Service Worker for Push Notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { title: 'VÉRTICE', body: event.data?.text() || 'Nova notificação' };
  }

  const options = {
    body: data.body || 'Nova notificação do sistema VÉRTICE',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: data.url || '/' },
    tag: data.tag || 'vertice-notification',
    renotify: true,
    requireInteraction: data.urgente || false,
    vibrate: data.urgente ? [200, 100, 200, 100, 200] : [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'VÉRTICE', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
