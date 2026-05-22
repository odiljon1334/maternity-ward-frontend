// Custom Service Worker — Push Notification Handlers
// next-pwa avtomatik ravishda bu faylni sw.js ga birlashtiradi

// ── Push event: server tomonidan xabar keldi ──────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Yangi xabar', body: event.data.text() };
  }

  const options = {
    body:    payload.body  ?? '',
    icon:    payload.icon  ?? '/icons/icon-192x192.png',
    badge:   payload.badge ?? '/icons/icon-192x192.png',
    tag:     payload.tag   ?? 'default',
    data:    { url: payload.url ?? '/dashboard', ...payload.data },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false,
    actions: [
      { action: 'open',    title: "Ko'rish" },
      { action: 'dismiss', title: 'Yopish'  },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Xabarnoma', options)
  );
});

// ── Notification click: app sahifasini ochish ─────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url ?? '/dashboard';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Agar app allaqachon ochiq bo'lsa — focus
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) client.navigate(targetUrl);
            return;
          }
        }
        // Ochiq bo'lmasa — yangi tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ── Push subscription change ──────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  // Subscription yangilanganda yangi subscription ni backendga yuboramiz
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey: event.newSubscription?.options?.applicationServerKey })
      .then((sub) => {
        // Yangi subscription ni cache ga saqlaymiz — sahifa ochilganda yuboriladi
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: sub.toJSON() })
          );
        });
      })
      .catch(() => null)
  );
});
