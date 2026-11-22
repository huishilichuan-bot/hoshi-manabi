/* ほしまなび 英語の声（v1.6.3）：録音した自然な声（audio/*.m4a）で読む
   ・声は Kokoro（Apache-2.0）で作った en-US：女の人 af_heart・男の人 am_michael。音の大きさはそろえてある
   ・ファイル名は「声 | 英文」のハッシュ。一覧（E4.AUDIO）にない文や、読みこめないときは端末の読み上げ（voice.js）で読む
   ・会話は1文ずつ順に再生し、話と話の間に少し間をあける。🐢 ゆっくりは 0.75 倍（声の高さはそのまま） */
(function (root) {
  "use strict";
  function clean(t) {
    return String(t || "").replace(/(^|\s)(?:(?:Mr|Ms|Mrs)\.\s)?[A-Z][a-z]+:\s+/g, "$1").replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
  }
  // cyrb53（53bit のハッシュ）→ 36進
  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  const key = (text, sex) => hash((sex === "m" ? "m" : "f") + "|" + clean(text));
  const api = { clean, hash, key, ok: () => false, has: () => false, speak: () => false, stop: () => {}, url: () => "", prefetch: () => {} };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HMAudio = api;
  if (typeof document === "undefined") return;

  let set = null;
  const manifest = () => { if (set) return set; const m = root.HM && root.HM.EN4 && root.HM.EN4.AUDIO; if (!m) return null; set = new Set(m.split(" ")); return set; };
  
  const disabled = () => !!root.__HM_NO_AUDIO;
  const canAudio = (() => { try { const a = document.createElement("audio"); return !!(a.canPlayType && a.canPlayType('audio/mp4; codecs="mp4a.40.2"')); } catch (e) { return false; } })();
  api.ok = () => !disabled() && canAudio && !!manifest();
  api.has = (text, sex) => { const s = manifest(); return !!(s && s.has(key(text, sex))); };
  api.url = (text, sex) => { const k = key(text, sex); return "./audio/" + k.slice(0, 2) + "/" + k + ".m4a"; };
  // 次に聞きそうな文を先に読みこんでおく（オフラインでも聞けるように、サービスワーカーがためる）
  const pre = new Set();
  api.prefetch = (lines) => {
    if (!api.ok()) return;
    const list = typeof lines === "string" ? [[null, lines, "f"]] : lines || [];
    list.forEach((l) => { if (!api.has(l[1], l[2])) return; const u = api.url(l[1], l[2]); if (pre.has(u)) return; pre.add(u); try { fetch(u).catch(() => pre.delete(u)); } catch (e) {} });
  };
  // ひとつの <audio> を使い回す（iOS：タップの中で一度鳴らせば、そのあとの文も続けて鳴らせる）
  let el = null, token = 0, timer = null;
  const player = () => {
    if (el) return el;
    el = new Audio(); el.preload = "auto"; el.setAttribute("playsinline", ""); el.crossOrigin = "anonymous";
    try { el.preservesPitch = true; el.mozPreservesPitch = true; el.webkitPreservesPitch = true; } catch (e) {}
    return el;
  };
  api.stop = () => { token++; clearTimeout(timer); if (el) { try { el.onended = el.onerror = null; el.pause(); } catch (e) {} } };
  // lines：文字列 または [[話し手, 英文, "f"|"m"], ...]。opt：{ slow, vol, onEnd, onLine }
  api.speak = (lines, opt) => {
    if (!api.ok()) return false;
    opt = opt || {};
    const list = (typeof lines === "string" ? [[null, lines, "f"]] : lines).map((l) => [l[0], l[1], l[2] === "m" ? "m" : "f"]).filter((l) => clean(l[1]));
    if (!list.length || !list.every((l) => api.has(l[1], l[2]))) return false;
    api.stop();
    const my = token, a = player();
    let i = 0;
    const fallback = (from) => {
      // 読みこめなかった：のこりを端末の読み上げで
      if (my !== token) return;
      const rest = list.slice(from);
      if (root.HMVoice && root.HMVoice.speak(rest, { slow: opt.slow, vol: opt.vol, onEnd: opt.onEnd, onLine: opt.onLine ? (k) => opt.onLine(from + k) : null })) return;
      if (opt.onEnd) opt.onEnd();
    };
    const next = () => {
      if (my !== token) return;
      if (i >= list.length) { if (opt.onEnd) opt.onEnd(); return; }
      const k = i++, l = list[k];
      if (opt.onLine) { try { opt.onLine(k); } catch (e) {} }
      a.onended = () => { if (my !== token) return; timer = setTimeout(next, i < list.length ? 380 : 0); };
      a.onerror = () => fallback(k);
      a.src = api.url(l[1], l[2]);
      a.playbackRate = a.defaultPlaybackRate = opt.slow ? 0.75 : 1;
      try { a.volume = Math.max(0, Math.min(1, opt.vol == null ? 0.9 : opt.vol)); } catch (e) {}
      const p = a.play();
      if (p && p.catch) p.catch((e) => { if (e && e.name === "AbortError") return; fallback(k); });
    };
    next();
    return true;
  };
})(typeof window !== "undefined" ? window : globalThis);
