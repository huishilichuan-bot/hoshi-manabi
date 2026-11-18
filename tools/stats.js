/* 教科・学年ごとの問題の統計：ステップ数／1周の問題数／ちがう問題の数／形式の内わけ／図つきの数／となりの問題で答えが同じ率 */
"use strict";
const fs = require("fs"), path = require("path"); const ROOT = path.join(__dirname, "..");
global.window = undefined;
require(path.join(ROOT, "q-util.js"));
fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/q-[a-z0-9-]+\.js/g).filter((f, i, a) => f !== "q-util.js" && a.indexOf(f) === i).forEach((f) => require(path.join(ROOT, f)));
if (HM.finalize) HM.finalize();
const NAME = { math: "算数", ja: "国語", life: "生活", sci: "理科", soc: "社会", en: "英語" };
const GN = (g) => (g <= 6 ? "小" + g : "中" + (g - 6));
const SEEDS = +(process.argv[2] || 30);
const hasFig = (q) => /<svg|class="qrow|<img|data-fig/.test((q.q || "") + (q.svg || "") + (q.fig || "")) || !!q.svg || !!q.fig || q.t === "tap";
const out = { rows: [], tot: { steps: 0, perPass: 0, uniq: 0, fig: 0, types: {} } };
for (const [s, grades] of Object.entries(HM.SUBJECTS)) for (const [g, units] of Object.entries(grades)) {
  let steps = 0, perPass = 0, figPass = 0, same = 0, pairs = 0; const uq = new Set(), uqFig = new Set(), types = {};
  units.forEach((u) => u.steps.forEach((st) => {
    steps++;
    for (let k = 0; k < SEEDS; k++) {
      const set = HM.makeSet(st, k * 7919 + 13);
      if (k === 0) { perPass += set.length; set.forEach((q) => { types[q.t] = (types[q.t] || 0) + 1; if (hasFig(q)) figPass++; }); }
      set.forEach((q, i) => { const key = u.n + "|" + st.n + "|" + q.t + "|" + q.q + "|" + q.a + "|" + (q.svg || "").length; uq.add(key); if (hasFig(q)) uqFig.add(key); if (i) { pairs++; if (String(set[i - 1].a) === String(q.a)) same++; } });
    }
  }));
  const r = { s, subj: NAME[s] || s, g: +g, grade: GN(+g), units: units.length, steps, perPass, uniq: uq.size, figUniq: uqFig.size, figPass, types, sameRate: +(same / Math.max(1, pairs)).toFixed(3) };
  out.rows.push(r); out.tot.steps += steps; out.tot.perPass += perPass; out.tot.uniq += uq.size; out.tot.fig += uqFig.size;
  for (const [t, n] of Object.entries(types)) out.tot.types[t] = (out.tot.types[t] || 0) + n;
}
const file = process.argv[3] || path.join(__dirname, "stats.json");
fs.writeFileSync(file, JSON.stringify(out, null, 1));
for (const r of out.rows) console.log([r.subj, r.grade, r.units, r.steps, r.perPass, r.uniq, "図" + r.figUniq, "同答" + r.sameRate, Object.entries(r.types).map(([t, n]) => t + n).join(",")].join("\t"));
console.log("合計", JSON.stringify(out.tot));
