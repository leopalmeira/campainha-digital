self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Alguém está tocando a campainha!',
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [500, 250, 500, 250, 500, 250, 500, 250, 500],
      requireInteraction: true, // Fica na tela até o usuário interagir
      data: {
        url: data.url || '/'
      },
      actions: [
        { action: 'open', title: 'Atender' },
        { action: 'close', title: 'Recusar' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Campainha Digital', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Ação 'open' ou clique no corpo da notificação
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      const urlToOpen = event.notification.data.url;
      
      // Se a aba já estiver aberta, foca nela e navega
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não, abre uma nova aba/janela do PWA
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
