/* Service Worker — Peluches Crochet (P11)
 * Ciclo: install (precache) → activate (limpieza + claim) → fetch (estrategias)
 * El build reemplaza self.__WB_MANIFEST con los assets del build.
 */
const MANIFEST = self.__WB_MANIFEST || [];

const hash = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

// Cada build tiene otro hash → caché nueva → la anterior se borra en activate
const BUILD = hash(JSON.stringify(MANIFEST));
const PRECACHE = `precache-${BUILD}`;
const PAGINAS = `paginas-${BUILD}`; // HTML guardado (apunta a los JS/CSS de este build)
const DATOS = 'datos-v1'; // respuestas GraphQL del catálogo
const RECURSOS = 'recursos-v1'; // imágenes y demás assets vistos en runtime
const ACTUALES = [PRECACHE, PAGINAS, DATOS, RECURSOS];
const MAX_RECURSOS = 200;

const OFFLINE_URL = new URL('offline.html', self.registration.scope).href;
const PRIVADAS = /^\/(admin|checkout|login|registro|mis-pedidos|api)(\/|$)/;
const DEV = /^\/(@|src\/|node_modules\/|__)/; // no interceptar el servidor de Vite

// ───────────────────────── INSTALL: precache del shell ─────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);

      // offline.html es obligatorio: si no se puede guardar, la instalación falla a propósito
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));

      // Resto del shell (JS, CSS, iconos): si alguno falla, no se cancela la instalación
      const urls = new Set();
      for (const e of MANIFEST) {
        urls.add(new URL(typeof e === 'string' ? e : e.url, self.registration.scope).href);
      }
      urls.delete(OFFLINE_URL);
      await Promise.allSettled([...urls].map((u) => cache.add(new Request(u, { cache: 'reload' }))));

      // El HTML es SSR (no existe como archivo): se guarda el inicio, sin que falle la instalación
      try {
        const r = await fetch('/', { cache: 'reload' });
        if (puedeGuardar(r)) await (await caches.open(PAGINAS)).put(claveHtml('/'), r);
      } catch {
        /* sin red durante la instalación: se guardará al visitarlo */
      }

      await self.skipWaiting(); // la versión nueva no espera a que se cierren las pestañas
    })()
  );
});

// ───────────────────────── ACTIVATE: limpiar y tomar control ─────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const nombre of await caches.keys()) {
        if (!ACTUALES.includes(nombre)) await caches.delete(nombre);
      }
      await self.clients.claim(); // controla las pestañas abiertas sin recargarlas
    })()
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data?.type === 'SKIP_WAITING') self.skipWaiting();
  // La página manda las imágenes que muestra (incluidas las lazy) para tenerlas offline
  if (data?.type === 'CACHEAR_URLS') event.waitUntil(cachearUrls(data.urls || []));
});

async function cachearUrls(urls) {
  const cache = await caches.open(RECURSOS);
  const unicas = [...new Set(urls)].filter((u) => /^https?:/.test(u));
  await Promise.allSettled(
    unicas.map(async (u) => {
      if (await cache.match(u)) return;
      const mismoOrigen = new URL(u).origin === self.location.origin;
      const r = await fetch(u, { mode: mismoOrigen ? 'same-origin' : 'no-cors' });
      if (r.ok || r.type === 'opaque') await cache.put(u, r);
    })
  );
  await recortar(cache, MAX_RECURSOS);
}

// ───────────────────────── FETCH: enrutador de estrategias ─────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // POST a GraphQL (catálogo): network-first con caché propia
  if (request.method === 'POST' && /\/graphql\/?$/.test(url.pathname)) {
    event.respondWith(graphql(request));
    return;
  }
  if (request.method !== 'GET') return;
  if (url.origin === location.origin && DEV.test(url.pathname)) return;

  // Páginas (navegación normal o fetch de ClientRouter): network-first
  const esHtml =
    request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
  if (esHtml && url.origin === location.origin) {
    event.respondWith(
      PRIVADAS.test(url.pathname) ? soloRed(request) : networkFirst(request, PAGINAS, {
        key: claveHtml(request.url),
        fallback: paginaOffline,
      })
    );
    return;
  }

  // Assets (JS, CSS, fuentes, iconos, imágenes locales o remotas): cache-first
  const esAsset =
    ['style', 'script', 'font', 'image', 'manifest'].includes(request.destination) ||
    /\.(?:css|js|png|jpe?g|webp|svg|ico|woff2?|webmanifest)$/.test(url.pathname);
  if (esAsset) {
    event.respondWith(cacheFirst(request));
  }
  // Todo lo demás (p. ej. EventSource/WebSocket) pasa directo a la red
});

// ───────────────────────── Estrategias ─────────────────────────
const puedeGuardar = (r) => r && r.ok && !r.redirected && r.type !== 'opaqueredirect';

const claveHtml = (u) => {
  const x = new URL(u, self.location.origin);
  x.hash = '';
  return x.href;
};

// Red primero; si falla o tarda demasiado, usa lo guardado; si no hay, fallback
async function networkFirst(request, nombreCache, { key = request, timeout = 4000, validar = puedeGuardar, fallback } = {}) {
  const cache = await caches.open(nombreCache);
  const guardado = await cache.match(key);

  const red = fetch(request).then((r) => {
    const copia = r.clone();
    Promise.resolve(validar(r.clone()))
      .then((ok) => ok && cache.put(key, copia))
      .catch(() => {});
    return r;
  });
  red.catch(() => {});

  try {
    if (!guardado) return await red;
    const r = await Promise.race([
      red,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeout)),
    ]);
    return r.status >= 500 ? guardado : r;
  } catch {
    return guardado || (fallback ? fallback() : Response.error());
  }
}

// Caché primero (precache o runtime); si no está, red y se guarda
async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  try {
    const r = await fetch(request);
    if (r.ok || r.type === 'opaque') {
      const cache = await caches.open(RECURSOS);
      await cache.put(request, r.clone());
      recortar(cache, MAX_RECURSOS);
    }
    return r;
  } catch {
    if (request.destination === 'image') return imagenNoDisponible();
    return Response.error();
  }
}

async function soloRed(request) {
  try {
    return await fetch(request);
  } catch {
    return paginaOffline();
  }
}

async function recortar(cache, max) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

// ───────────────────────── GraphQL (POST no se puede cachear directo) ─────────────────────────
async function graphql(request) {
  let texto = '';
  let consulta = '';
  try {
    texto = await request.clone().text();
    consulta = JSON.parse(texto).query || '';
  } catch {
    /* cuerpo no JSON: pasa a la red */
  }
  // Mutaciones y peticiones autenticadas nunca se guardan
  const guardable = /^\s*(query\b|\{)/.test(consulta) && !request.headers.has('Authorization');
  if (!guardable) {
    try {
      return await fetch(request);
    } catch {
      return respuestaGraphQLOffline();
    }
  }
  return networkFirst(request, DATOS, {
    key: new Request(`${self.location.origin}/__gql/${hash(texto)}`),
    validar: async (r) => puedeGuardar(r) && !(await r.json()).errors,
    fallback: respuestaGraphQLOffline,
  });
}

// ───────────────────────── Respuestas de respaldo ─────────────────────────
async function paginaOffline() {
  return (
    (await caches.match(OFFLINE_URL)) ||
    new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  );
}

function respuestaGraphQLOffline() {
  return new Response(
    JSON.stringify({
      data: null,
      errors: [{ message: 'Sin conexión: esta información todavía no está guardada en tu dispositivo.' }],
    }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}

function imagenNoDisponible() {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280">' +
    '<rect width="280" height="280" fill="#f1f5f9"/>' +
    '<text x="140" y="135" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#64748b">Imagen no guardada</text>' +
    '<text x="140" y="160" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#94a3b8">(sin conexión)</text></svg>';
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
}