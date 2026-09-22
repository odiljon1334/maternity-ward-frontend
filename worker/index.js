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
    Promise.all([
      self.registration.showNotification(payload.title || 'Xabarnoma', options),
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then(function (clientList) {
          clientList.forEach(function (client) {
            client.postMessage({ type: 'PUSH_RECEIVED', payload: payload });
          });
        }),
    ])
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  var targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';
  var absoluteTarget = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          if ('navigate' in client) {
            return client.navigate(absoluteTarget).then(function(navigatedClient) {
              return (navigatedClient || client).focus();
            });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(absoluteTarget);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', function(event) {
  var applicationServerKey = event.oldSubscription &&
    event.oldSubscription.options &&
    event.oldSubscription.options.applicationServerKey;

  if (!applicationServerKey) return;

  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    }).then(function(sub) {
      return self.clients.matchAll().then(function(clientList) {
        clientList.forEach(function(client) {
          client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: sub.toJSON() });
        });
      });
    }).catch(function() { return null; })
  );
});
