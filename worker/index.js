// Custom Service Worker — Push Notification Handlers
/* eslint-disable */
// @ts-nocheck

self.addEventListener('push', function(event) {
  if (!event.data) return;

  var payload;
  try {
    payload = event.data.json();
  } catch(e) {
    payload = { title: 'Yangi xabar', body: event.data.text() };
  }

  var options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-192x192.png',
    tag: payload.tag || 'default',
    data: { url: payload.url || '/dashboard' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Xabarnoma', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  var targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.focus();
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', function(event) {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
    }).then(function(sub) {
      return self.clients.matchAll().then(function(clientList) {
        clientList.forEach(function(client) {
          client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: sub.toJSON() });
        });
      });
    }).catch(function() { return null; })
  );
});