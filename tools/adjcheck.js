/* となりの問題で答えが同じになるステップを探す（〇×は3つ続く場合） */
"use strict";
const fs = require("fs"), path = require("path"); const ROOT = path.join(__dirname, "..");
global.window = undefined; require(path.join(ROOT, "q-util.js"));
fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/q-[a-z0-9-]+\.js/g).filter((f, i, a) => f !== "q-util.js" && a.indexOf(f) === i).forEach((f) => require(path.join(ROOT, f)));
if (HM.finalize) HM.finalize();
const SEEDS = +(process.argv[2] || 50); let bad = 0, total = 0; const rows = [];
for (const [s, gs] of Object.entries(HM.SUBJECTS)) for (const [g, us] of Object.entries(gs)) us.forEach((u) => u.steps.forEach((st) => {
  let n = 0, ex = null;
  for (let k = 0; k < SEEDS; k++) { const set = HM.makeSet(st, k * 104729 + 7); total++;
    for (let i = 1; i < set.length; i++) { const A = (q) => String(q.a); const b = set[i].t === "tf" ? i > 1 && A(set[i]) === A(set[i - 1]) && A(set[i]) === A(set[i - 2]) : A(set[i]) === A(set[i - 1]); if (b) { n++; ex = ex || set[i].a; } } }
  if (n) { bad += n; rows.push([s, g, u.n, st.n, n, ex]); }
}));
rows.forEach((r) => console.log(r.join(" | ")));
console.log("adjacent-same", bad, "in", total, "sets");
process.exit(bad ? 1 : 0);
