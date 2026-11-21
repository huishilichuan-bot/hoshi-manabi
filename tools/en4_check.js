// v1.6 英語4技能：各ステップを何回も作って、12問・スキル3:3:3:3・形式の内訳をたしかめる
const fs = require("fs"), path = require("path"); const ROOT = path.join(__dirname, "..");
global.window = undefined; require(path.join(ROOT, "q-util.js"));
fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/q-[a-z0-9-]+\.js/g).filter((f, i, a) => f !== "q-util.js" && a.indexOf(f) === i).forEach((f) => require(path.join(ROOT, f)));
HM.finalize();
const SEEDS = +(process.argv[2] || 5); let bad = 0; const per = {};
for (const [g, us] of Object.entries(HM.SUBJECTS.en)) {
  const c = (per[g] = { steps: 0, q: 0, L: 0, S: 0, W: 0, R: 0, types: {}, fmt: {}, short: 0 });
  for (const u of us) u.steps.forEach((st, k) => {
    c.steps++;
    for (let s = 0; s < SEEDS; s++) {
      const set = HM.makeSet(st, 1000 + s * 7 + k);
      const qs = set.qs || set;
      if (qs.length !== 12) { c.short++; if (bad++ < 60 && s === 0) console.log("短い", g, u.n, st.n, qs.length); }
      const sk = { L: 0, S: 0, W: 0, R: 0 }; qs.forEach((q) => { sk[q.skill]++; c.types[q.t] = (c.types[q.t] || 0) + 1; });
      if (s === 0) { c.q += qs.length; ["L", "S", "W", "R"].forEach((x) => (c[x] += sk[x])); }
      if (qs.length === 12 && ["L", "S", "W", "R"].some((x) => sk[x] !== 3)) { if (bad++ < 15) console.log("スキル", g, u.n, st.n, JSON.stringify(sk)); }
    }
  });
}
console.log(JSON.stringify(per, null, 0).replace(/\},"/g, "},\n\""));
console.log(bad ? "問題 " + bad : "OK");
