/* 教科・学年ごとの 単元数／ステップ数／1周の問題数／ちがう問題の数（40通りの出題で数える） */
"use strict";
const fs = require("fs"), path = require("path"); const ROOT = path.join(__dirname, "..");
require(path.join(ROOT, "q-util.js"));
fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/q-[a-z0-9-]+\.js/g).filter((f) => f !== "q-util.js").forEach((f) => require(path.join(ROOT, f)));
const NAME = { math: "算数・数学", ja: "国語", life: "生活", sci: "理科", soc: "社会", en: "英語" };
const GN = (g) => (g <= 6 ? "小" + g : "中" + (g - 6));
const rows = []; const tot = { units: 0, steps: 0, perPass: 0, uniq: 0 };
for (const [s, grades] of Object.entries(HM.SUBJECTS)) for (const [g, units] of Object.entries(grades)) {
  let steps = 0, perPass = 0; const uq = new Set();
  units.forEach((u) => u.steps.forEach((st) => { steps++; for (let k = 0; k < 40; k++) { const set = HM.makeSet(st, k * 7919 + 13); if (k === 0) perPass += set.length; set.forEach((q) => uq.add(u.n + st.n + q.q + "|" + q.a)); } }));
  rows.push({ subj: NAME[s] || s, grade: GN(+g), units: units.length, steps, perPass, uniq: uq.size });
  tot.units += units.length; tot.steps += steps; tot.perPass += perPass; tot.uniq += uq.size;
}
rows.forEach((r) => console.log([r.subj, r.grade, r.units, r.steps, r.perPass, r.uniq].join("\t")));
console.log(["合計", "", tot.units, tot.steps, tot.perPass, tot.uniq].join("\t"));
fs.writeFileSync(path.join(__dirname, "coverage.json"), JSON.stringify({ rows, tot }, null, 1));
