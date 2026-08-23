self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = JSON.parse(event.data.text());
  } catch {
    data = {
      title: 'MaternityCare',
      body: event.data.text(),
      url: '/dashboard',
    };
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    tag: data.tag || 'default',
    data: { url: data.url || '/dashboard' },
    requireInteraction: false,
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'MaternityCare', options),
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          clientList.forEach((client) => {
            client.postMessage({ type: 'PUSH_RECEIVED', payload: data });
          });
        }),
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const url = event.notification.data?.url || '/dashboard';
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
