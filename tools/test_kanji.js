/* 漢字の書き取り判定のテスト：お手本どおり（少しゆがめても）→ 〇、向き・書き順・画数・でたらめ → × */
"use strict";
const path = require("path"), ROOT = path.join(__dirname, "..");
global.window = global; global.HMK_Q = [];
require(path.join(ROOT, "q-ui.js"));
const K = global.HMK; let pass = 0, fail = 0; const bad = [];
const ok = (c, m) => { if (c) pass++; else { fail++; bad.push(m); } };
let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const allStats = { ok: 0, n: 0 };
for (const g of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  require(path.join(ROOT, "kanji", "g" + g + ".js")); K.flush();
}
const keys = Object.keys(K.data);
ok(keys.length >= 2000, "kanji count " + keys.length);
for (const k of keys) {
  const ref = K.data[k].map((d) => K.pathPts(d, 1.5));
  ok(ref.every((p) => p.length >= 2 && p.every(([x, y]) => x > -5 && x < 115 && y > -5 && y < 115)), "path range " + k);
}
// ゆがめたお手本（なぞり：ずれ±3／書く：大きさ0.75〜1.15倍・位置ずらし・ぶれ±4）
const sample = keys.filter((_, i) => i % 7 === 0);
for (const k of sample) {
  const ref = K.data[k].map((d) => K.pathPts(d, 1.5));
  const jit = (a) => (rnd() * 2 - 1) * a;
  const tr = ref.map((p) => { const dx = jit(2), dy = jit(2); return p.map(([x, y]) => [x + dx + jit(1.5), y + dy + jit(1.5)]); });
  const r1 = K.judge(ref, tr, "trace"); ok(r1.ok, "trace-ok " + k + " " + JSON.stringify(r1.per.filter((x) => !x.ok)));
  const s = 0.75 + rnd() * 0.4, ox = jit(10), oy = jit(10);
  const wr = ref.map((p) => p.map(([x, y]) => [54 + (x - 54) * s + ox + jit(2.5), 54 + (y - 54) * s + oy + jit(2.5)]));
  const r2 = K.judge(ref, wr, "write"); ok(r2.ok, "write-ok " + k + " " + JSON.stringify(r2.per.filter((x) => !x.ok)));
  allStats.n++; if (r1.ok && r2.ok) allStats.ok++;
  // 画数ちがい
  if (ref.length > 1) ok(!K.judge(ref, wr.slice(1), "write").ok, "count " + k);
  // 長い画を逆向きに
  const li = ref.map((p, i) => [p.length, i]).sort((a, b) => b[0] - a[0])[0][1];
  const rev = wr.map((p, i) => (i === li ? p.slice().reverse() : p));
  // 逆にしても形がほぼ同じ画（左右・上下に対称な画）は対象外
  const R0 = ref[li], m = R0.length, sym = R0.reduce((a, p, t) => a + Math.hypot(p[0] - R0[m - 1 - t][0], p[1] - R0[m - 1 - t][1]), 0) / m;
  const r3 = K.judge(ref, rev, "write"); if (sym > 30) ok(!r3.ok, "reverse " + k + " sym" + sym.toFixed(1));
  // 書き順の入れかえ（形のちがう2画）
  if (ref.length >= 3) { const sw = wr.slice(); [sw[0], sw[ref.length - 1]] = [sw[ref.length - 1], sw[0]]; const r4 = K.judge(ref, sw, "write"); ok(!r4.ok, "order " + k); }
  // でたらめな線
  const junk = ref.map(() => { const x = rnd() * 100, y = rnd() * 100, a = rnd() * 6.3; return Array.from({ length: 20 }, (_, t) => [x + Math.cos(a) * t * 2, y + Math.sin(a) * t * 2]); });
  ok(!K.judge(ref, junk, "write").ok, "junk " + k);
}
console.log("sample", allStats, "pass", pass, "fail", fail);
if (bad.length) console.log(bad.slice(0, 15).join("\n"));
process.exit(fail ? 1 : 0);
