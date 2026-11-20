// Optional's background helper. It only shows reminders and opens the app when one is tapped.
// It doesn't store anything or cache pages.
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function(event){
  var data = { title: 'Optional', body: 'Quick check-in?', url: './#dash' };
  try { if (event.data) data = Object.assign(data, event.data.json()); } catch (e){ /* keep the default */ }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'optional-checkin', data: { url: data.url }
  }));
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var url = new URL((event.notification.data && event.notification.data.url) || './#dash', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
    for (var i = 0; i < list.length; i++){
      if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]){ list[i].navigate(url); return list[i].focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
