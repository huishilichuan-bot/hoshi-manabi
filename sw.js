/* ほしまなび — オフライン用サービスワーカー */
const CACHE = "hoshi-manabi-v1.6.3";
const ASSETS = ["./", "./index.html", "./legal.html", "./privacy.html", "./terms.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/icon-maskable-512.png", "./styles.css", "./app.css", "./consent.js", "./q-util.js", "./q-math-e1.js", "./q-math-e2.js", "./q-math-e3.js", "./q-math-j.js", "./q-math-extra.js", "./q-life.js", "./q-sci.js", "./q-sci-j.js", "./q-soc.js", "./q-soc-j.js", "./q-ja.js", "./q-ja-b.js", "./q-en.js", "./q-en-b.js", "./q-extra.js", "./q-more.js", "./q-tables.js", "./q-formats.js", "./q-figs.js", "./q-gaps.js", "./q-t-sci.js", "./q-t-soc.js", "./q-t-lang.js", "./q-kanji-data.js", "./q-kanji.js", "./q-ui.js", "./q-fig.js", "./q-v15-math.js", "./q-v15-math-j.js", "./q-v15-sci.js", "./q-v15-soc.js", "./q-precalc.js",
  "./memo.js", "./q-balance.js", "./q-expand.js", "./voice.js", "./audio.js", "./q-en4-pool.js", "./q-en4-audio.js", "./q-en4-core.js", "./q-en4-dlg.js", "./q-en4-e.js", "./q-en4-e6.js", "./q-en4-read-e.js", "./q-en4-j1.js", "./q-en4-j2.js", "./q-en4-j3.js", "./q-en4-pass1.js", "./q-en4-pass2.js", "./q-en4-pass3a.js", "./q-en4-pass3b.js", "./q-en4-pass3c.js", "./q-en4-reg.js", "./en4-ui.js", "./chars.js", "./games.js", "./chess.js", "./games-board.js", "./games-action.js", "./games-core.js", "./games-new-board.js", "./games-new-puzzle.js", "./games-new-action.js", "./games-new-cards.js", "./icons.js", "./games-pro.js", "./games-sports.js", "./games-arcade.js", "./games-remaster.js", "./games-kit.js", "./games-race2.js", "./games-run2.js", "./games-shoot2.js", "./games-battle2.js", "./games-action2.js", "./app.js", "./firebase-config.js", "./hm-merge.js", "./auth.js"];
// 英語の声（audio/ の録音ファイル）は名前が中身のハッシュなので変わらない。使ったものだけを別のキャッシュにためて、版が変わっても消さない
const AUDIO_CACHE = "hoshi-manabi-audio-v1";
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Firebase / Google（ログイン・クラウド保存）の通信は、キャッシュせずそのままネットへ
  if (req.method !== "GET" || url.origin !== location.origin || /firebase|googleapis|gstatic|google\.com/.test(url.hostname) || url.pathname.startsWith("/__/")) return;
  // 管理画面はいつも最新を
  if (/\/admin\.html$/.test(url.pathname)) return;
  if (url.pathname.includes("/audio/")) {
    // Range（部分）リクエストもキャッシュの全体から返す（Safari の <audio> は Range で読む）
    e.respondWith(caches.open(AUDIO_CACHE).then((c) => c.match(req.url, { ignoreSearch: true }).then((hit) => {
      if (hit) return rangeOf(req, hit);
      return fetch(url.href, { mode: "same-origin", credentials: "same-origin" }).then((res) => { if (res.ok && res.status === 200) { c.put(req.url, res.clone()); return rangeOf(req, res); } return res; });
    })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return res; }).catch(() => (req.mode === "navigate" ? caches.match("./index.html") : Response.error()))));
});
async function rangeOf(req, res) {
  const r = req.headers.get("range"); if (!r) return res;
  const m = /bytes=(\d*)-(\d*)/.exec(r); if (!m) return res;
  const buf = await res.clone().arrayBuffer(), size = buf.byteLength;
  const start = m[1] ? +m[1] : Math.max(0, size - +m[2]), end = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: "Partial Content", headers: { "Content-Type": res.headers.get("Content-Type") || "audio/mp4", "Content-Range": "bytes " + start + "-" + end + "/" + size, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" } });
}
// 毎日のおしらせをタップしたら、アプリを開く
self.addEventListener("notificationclick", (e) => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => { for (const c of cs) if ("focus" in c) return c.focus(); return self.clients.openWindow("./"); })); });
