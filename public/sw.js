/* eslint-disable no-restricted-globals */
// PillMind push notification service worker

self.addEventListener('push', function (event) {
  if (!event.data) return
  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'PillMind', body: event.data.text() || 'New notification', url: '/' }
  }
  const title = payload.title || 'PillMind'
  const body = payload.body || 'Reminder'
  const url = payload.url || '/home'
  const icon = '/favicon/web-app-manifest-192x192.png'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      data: { url },
      tag: 'pillmind-reminder',
      renotify: true
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/home'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
