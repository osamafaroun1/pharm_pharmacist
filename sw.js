// public/sw.js - Pharmacist App (يعمل مع أي React setup)
const CACHE = 'pharmacy-pharmacist-v1.0.0';

console.log('🏥 Pharmacist Service Worker Loaded!');

// 1. INSTALL - ما نحفظ شيء ثابت، بس نفعّل الـSW
self.addEventListener('install', event => {
  console.log('📦 Installing Pharmacist SW...');
  self.skipWaiting(); // فعّل فوراً
  event.waitUntil(self.skipWaiting());
});

// 2. ACTIVATE - نظّف الـcache القديم
self.addEventListener('activate', event => {
  console.log('✅ Activating Pharmacist SW...');
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(
        cacheNames.filter(name => name !== CACHE)
                  .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// 3. FETCH - المنطق الذكي حسب الـAPI routes بس!
self.addEventListener('fetch', event => {
  // تجاهل طلبات خارج الموقع
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  
  const pathname = url.pathname;
  
  // ================================
  // NETWORK ONLY (بيانات حساسة)
  // ================================
  if (
    pathname.startsWith('/api/auth/') ||     // تسجيل الدخول
    pathname.startsWith('/api/orders') ||    // الطلبات
    pathname.startsWith('/api/notifications') // الإشعارات
  ) {
    console.log('🌐 Network Only:', pathname);
    event.respondWith(fetch(event.request));
    return;
  }
  
  // ================================
  // CACHE FIRST (الكتالوج والمستودعات)
  // ================================
  if (
    pathname.startsWith('/api/products') ||    // الكتالوج
    pathname.startsWith('/api/warehouses') ||  // المستودعات
    pathname.startsWith('/api/categories')     // الفئات.
  ) {
    console.log('📦 Cache First:', pathname);
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // ================================
  // كل الـStatic Assets = Cache + Network
  // ================================
  if (
    event.request.destination === 'script' ||    // JS files
    event.request.destination === 'style' ||     // CSS files  
    event.request.destination === 'image' ||     // Images
    event.request.destination === 'font'         // Fonts
  ) {
    console.log('💾 Static Asset:', event.request.destination);
    event.respondWith(cacheStaticAssets(event.request));
    return;
  }
  
  // باقي الطلبات = Network First
  event.respondWith(networkFirst(event.request));
});

// Cache First للـAPI responses
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // في الخلفية حدّث
    fetch(request).catch(() => {});
    return cached;
  }
  
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('غير متاح أوفلاين', { status: 503 });
  }
}

// Cache للـStatic Assets (JS, CSS, Images)
async function cacheStaticAssets(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request);
  }
}

// Network First للباقي
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request);
  }
}

// 4. PUSH NOTIFICATIONS
self.addEventListener('push', event => {
  console.log('🔔 Push received!');
  const data = event.data?.json() || {};
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'متجر الأدوية', {
      body: data.body || 'لديك إشعار جديد 🏥',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      actions: [
        { action: 'orders', title: 'الطلبات' }
      ],
      data: { url: data.url || '/orders' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/orders';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(url)) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
