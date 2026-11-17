/* ほしまなび — 端末のデータ（ゲスト）とクラウドのデータを合わせる。⭐やなかまは「多い方・両方」をとり、へらさない */
(function (root) {
  "use strict";
  const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
  const max = (a, b) => Math.max(num(a), num(b));
  const obj = (o) => (o && typeof o === "object" && !Array.isArray(o) ? o : {});
  const arr = (a) => (Array.isArray(a) ? a : []);
  function mergeDays(a, b) {
    const out = {};
    for (const k of new Set([...Object.keys(obj(a)), ...Object.keys(obj(b))])) {
      const x = obj(obj(a)[k]), y = obj(obj(b)[k]);
      const steps = Object.assign({}, obj(x.steps), obj(y.steps));
      out[k] = Object.assign({}, x, y, { stars: Math.max(num(x.stars), num(y.stars), Object.keys(steps).length), steps });
    }
    return out;
  }
  function mergeProgress(a, b) {
    const out = {};
    for (const k of new Set([...Object.keys(obj(a)), ...Object.keys(obj(b))])) {
      const x = obj(obj(a)[k]), y = obj(obj(b)[k]);
      out[k] = Object.assign({}, x, y, { best: max(x.best, y.best), plays: max(x.plays, y.plays), n: max(x.n, y.n), t: max(x.t, y.t), passed: !!(x.passed || y.passed), last: num(x.t) >= num(y.t) ? x.last : y.last });
    }
    return out;
  }
  function mergeChars(a, b) {
    const out = {};
    for (const k of new Set([...Object.keys(obj(a)), ...Object.keys(obj(b))])) {
      const x = obj(obj(a)[k]), y = obj(obj(b)[k]);
      out[k] = Object.assign({}, x, y, { n: max(x.n, y.n), shards: max(x.shards, y.shards), star: max(x.star, y.star), t: Math.min(num(x.t) || Infinity, num(y.t) || Infinity) === Infinity ? 0 : Math.min(num(x.t) || Infinity, num(y.t) || Infinity) });
    }
    return out;
  }
  const unionBy = (a, b, key, cap) => { const m = new Map(); for (const it of [...arr(a), ...arr(b)]) { const k = key(it); if (!m.has(k)) m.set(k, it); } let out = [...m.values()]; if (cap && out.length > cap) out = out.slice(out.length - cap); return out; };
  function mergeGames(a, b) {
    const out = {};
    for (const k of new Set([...Object.keys(obj(a)), ...Object.keys(obj(b))])) {
      const x = obj(a)[k], y = obj(b)[k];
      if (x && y && typeof x === "object" && typeof y === "object" && !Array.isArray(x)) { const o = Object.assign({}, x, y); for (const kk of Object.keys(o)) if (typeof x[kk] === "number" || typeof y[kk] === "number") o[kk] = max(x[kk], y[kk]); out[k] = o; }
      else out[k] = y != null ? y : x;
    }
    return out;
  }
  // まだ何もしていない端末（はじめて開いただけ）の記録か
  function isBlank(st) {
    const days = Object.values(obj(st.days));
    return !num(st.totalStars) && !num(st.pullsUsed) && !Object.keys(obj(st.progress)).length && !arr(st.wrongBox).length && !num(st.bestCombo) && days.every((d) => !Object.keys(obj(d.steps)).length) && !(obj(st.settings).nick);
  }
  // 設定は新しい方を使い、空の項目（名前など）はもう一方でうめる
  function fillSettings(newer, older) {
    const o = Object.assign({}, obj(older), obj(newer));
    for (const k of Object.keys(obj(older))) if ((o[k] === "" || o[k] == null) && obj(older)[k] !== "" && obj(older)[k] != null) o[k] = obj(older)[k];
    return o;
  }
  // local = この端末、cloud = クラウド。どちらも state の形
  function mergeStates(local, cloud) {
    const L = obj(local), C = obj(cloud);
    if (!Object.keys(C).length) return JSON.parse(JSON.stringify(L));
    if (!Object.keys(L).length || isBlank(L)) return JSON.parse(JSON.stringify(C));
    const newer = num(C.updatedAt) > num(L.updatedAt) ? C : L;
    const out = Object.assign({}, L, C);
    out.created = Math.min(num(L.created) || Infinity, num(C.created) || Infinity); if (out.created === Infinity) out.created = Date.now();
    out.days = mergeDays(L.days, C.days);
    const daySum = Object.values(out.days).reduce((t, d) => t + num(d.stars), 0);
    out.totalStars = Math.max(num(L.totalStars), num(C.totalStars), daySum);
    // ガチャ：のこり回数は多い方を残す（へらさない）
    const left = Math.max(num(L.pulls) - num(L.pullsUsed), num(C.pulls) - num(C.pullsUsed), 0);
    out.pullsUsed = max(L.pullsUsed, C.pullsUsed);
    out.pulls = Math.max(num(L.pulls), num(C.pulls), out.pullsUsed + left);
    out.progress = mergeProgress(L.progress, C.progress);
    out.chars = mergeChars(L.chars, C.chars);
    out.games = mergeGames(L.games, C.games);
    out.bossWins = Object.assign({}, obj(C.bossWins), obj(L.bossWins));
    out.boxCleared = max(L.boxCleared, C.boxCleared);
    out.bestCombo = max(L.bestCombo, C.bestCombo);
    out.wrongBox = unionBy(L.wrongBox, C.wrongBox, (x) => x && x.k, 150);
    out.reports = unionBy(L.reports, C.reports, (x) => x && x.t + "|" + x.q, 200);
    out.gachaLog = unionBy(L.gachaLog, C.gachaLog, (x) => JSON.stringify(x), 300);
    out.settings = fillSettings(newer.settings, (newer === L ? C : L).settings);
    out.look = Object.assign({}, obj(newer === L ? C : L).look, obj(newer.look));
    out.partner = out.chars[newer.partner] ? newer.partner : out.chars[L.partner] ? L.partner : Object.keys(out.chars)[0];
    out.last = newer.last || L.last || C.last || null;
    out.updatedAt = Math.max(num(L.updatedAt), num(C.updatedAt));
    return out;
  }
  // クラウドに置く大きさを1ドキュメントの上限（1MiB）より十分小さくする（UTF-8 のバイト数で 70万まで）
  function slimForCloud(st, limit) {
    const s = JSON.parse(JSON.stringify(obj(st)));
    limit = limit || 700000;
    const bytes = (t) => (typeof TextEncoder !== "undefined" ? new TextEncoder().encode(t).length : unescape(encodeURIComponent(t)).length);
    let json = JSON.stringify(s);
    while (bytes(json) > limit && arr(s.wrongBox).length) { s.wrongBox.splice(0, Math.max(1, Math.ceil(s.wrongBox.length / 5))); json = JSON.stringify(s); }
    while (bytes(json) > limit && arr(s.gachaLog).length) { s.gachaLog.splice(0, Math.max(1, Math.ceil(s.gachaLog.length / 4))); json = JSON.stringify(s); }
    return json;
  }
  const api = { mergeStates, slimForCloud, isBlank };
  root.HMMerge = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
