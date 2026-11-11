const shell = new URL("./index.html", self.registration.scope).href;
const root = self.registration.scope;
const assets = new Set(SHELL_FILES.map((file) => new URL(file, root).href));
const cacheName = CACHE_VERSION;
const cachePrefix = "eidomancer-web-preview-";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll([...assets].map((url) => new Request(url, { cache: "reload" })));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(cachePrefix) && key !== cacheName)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const page = new URL(url);
  page.hash = "";
  const navigation = request.mode === "navigate" && (page.href === root || page.href === shell);
  if (!navigation && !assets.has(url.href)) return;
  // Serve one consistent shell version until its tabs close and the next worker activates.
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return (await cache.match(navigation ? shell : request)) || fetch(request);
  })());
});
