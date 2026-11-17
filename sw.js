/* ほしまなび — オフライン用サービスワーカー */
const CACHE = "hoshi-manabi-v1.1.0";
const ASSETS = ["./", "./index.html", "./legal.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/icon-maskable-512.png", "./app.css", "./app.js", "./games-arcade.js", "./games-remaster.js", "./games-sports.js", "./games-pro.js", "./icons.js", "./q-t-lang.js", "./q-t-soc.js", "./q-t-sci.js", "./q-tables.js", "./chars.js", "./chess.js", "./games-action.js", "./games-board.js", "./games-core.js", "./games-new-action.js", "./games-new-board.js", "./games-new-cards.js", "./games-new-puzzle.js", "./games.js", "./q-en-b.js", "./q-en.js", "./q-extra.js", "./q-more.js", "./q-ja-b.js", "./q-ja.js", "./q-life.js", "./q-math-e1.js", "./q-math-e2.js", "./q-math-e3.js", "./q-math-extra.js", "./q-math-j.js", "./q-sci-j.js", "./q-sci.js", "./q-soc-j.js", "./q-soc.js", "./q-util.js", "./styles.css", ];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return res; }).catch(() => caches.match("./index.html"))));
});
