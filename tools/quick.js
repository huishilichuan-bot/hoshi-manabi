// 簡易チェック：全ステップを何回も生成して、答え・解説の欠けを探す
const files = process.argv.slice(2);
require("../q-util.js"); files.forEach((f) => require("../" + f));
const t0 = Date.now();
for (const [subj, grades] of Object.entries(HM.SUBJECTS)) for (const [g, us] of Object.entries(grades)) {
  let st = 0, qs = 0;
  for (const u of us) for (const s of u.steps) { st++; const s0 = Date.now(); for (let k = 0; k < 40; k++) { const set = HM.makeSet(s, k * 7 + 1); qs += set.length; if (set.length < (Array.isArray(s.src) ? Math.min(s.cnt||6, s.src.length) : s.cnt)) console.log("SHORT", g, u.n, s.n, set.length); for (const q of set) { if (q.a == null || /null|NaN|undefined/.test(q.a) || !q.ex || /undefined|NaN/.test(q.q + q.ex + (q.o || []).join())) console.log("BAD", g, u.n, s.n, q.q.slice(-50), q.a); if (q.t === "ch" && q.o.length < 1) console.log("NOOPT", g, s.n, q.q.slice(-40)); } } if (Date.now() - s0 > 2000) console.log("SLOW", g, s.n); }
  console.log(subj, g, "units", us.length, "steps", st);
}
console.log("ms", Date.now() - t0);
