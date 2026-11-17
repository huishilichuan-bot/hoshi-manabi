/* 学習指導要領（tools/curriculum.json）とアプリの中身をくらべて、足りない内容を tools/coverage.json の audit に書く */
"use strict";
const fs = require("fs"), path = require("path"); const ROOT = path.join(__dirname, "..");
require(path.join(ROOT, "q-util.js"));
fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/q-[a-z0-9-]+\.js/g).filter((f) => f !== "q-util.js").forEach((f) => require(path.join(ROOT, f)));
const CUR = JSON.parse(fs.readFileSync(path.join(__dirname, "curriculum.json"), "utf8"));
const NAME = { math: "算数・数学", ja: "国語", life: "生活", sci: "理科", soc: "社会", en: "英語" };
const GN = (g) => (g <= 6 ? "小" + g : "中" + (g - 6));
const strip = (s) => String(s || "").replace(/<[^>]+>/g, " ");
const audit = {}; let nTopics = 0, nMiss = 0;
for (const [s, grades] of Object.entries(CUR)) { if (s[0] === "_") continue; for (const [g, topics] of Object.entries(grades)) {
  const units = (HM.SUBJECTS[s] || {})[g] || [];
  const names = units.map((u) => u.n + " " + u.steps.map((x) => x.n).join(" ")).join(" ");
  const texts = []; units.forEach((u) => u.steps.forEach((st) => { for (let k = 0; k < 3; k++) HM.makeSet(st, k * 104729 + 7).forEach((q) => texts.push(strip(q.q) + " " + (q.a || "") + " " + (q.ex || "") + " " + (q.items || []).join(" ") + " " + (q.pairs || []).flat().join(" "))); }));
  const res = topics.map(([t, kw]) => { const inName = kw.some((k) => names.includes(k)); const hits = texts.filter((x) => kw.some((k) => x.includes(k))).length; const ok = inName || hits >= 3; nTopics++; if (!ok) nMiss++; return { topic: t, ok, inName, hits }; });
  audit[s + ":" + g] = { subj: NAME[s], grade: GN(+g), units: units.length, topics: res.length, covered: res.filter((r) => r.ok).length, missing: res.filter((r) => !r.ok).map((r) => r.topic) };
} }
const covPath = path.join(__dirname, "coverage.json"); const cov = fs.existsSync(covPath) ? JSON.parse(fs.readFileSync(covPath, "utf8")) : {};
cov.audit = { source: "小学校・中学校学習指導要領（平成29年告示）の内容（tools/curriculum.json）", topics: nTopics, missing: nMiss, bySubjectGrade: audit };
fs.writeFileSync(covPath, JSON.stringify(cov, null, 1));
for (const a of Object.values(audit)) console.log(a.subj + " " + a.grade + "  単元" + a.units + "  内容 " + a.covered + "/" + a.topics + (a.missing.length ? "  不足: " + a.missing.join("、") : ""));
console.log("合計 内容 " + (nTopics - nMiss) + "/" + nTopics + " 不足 " + nMiss);
