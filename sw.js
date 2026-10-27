const CACHE='registromedia-v3-offline';const FILES=['./','./index.html','./style.css','./app.mjs','./model.mjs','./vault.mjs','./argo.mjs','./icon.svg','./manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('registromedia-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method==='GET'&&url.origin===self.location.origin&&FILES.includes(url.pathname==='/'?'./':'./'+url.pathname.slice(1)))e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
