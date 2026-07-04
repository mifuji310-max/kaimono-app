/* おうちの買い物 - Service Worker
   役割：アプリの外枠（HTML/アイコン）をキャッシュしてオフラインでも開けるようにする。
   データの同期・オフライン保存は Firestore 側が担当するので、ここでは扱わない。 */
const CACHE = "kaimono-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Firebase やフォント等の外部通信はそのままネットワークへ（キャッシュしない）
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== "GET") return;

  // アプリの外枠はキャッシュ優先（オフラインでも起動できる）
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
