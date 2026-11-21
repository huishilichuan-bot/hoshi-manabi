// dlg/g5〜g9.txt（手書きの会話）→ q-en4-dlg.js。--check で一致と内容を確認（CI 用）
// 書き方：「# 学年-単元番号」、話し手「名前: 英文」、設問「? 質問 | 答え | まちがい1 / まちがい2 / まちがい3」
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), OUT = path.join(ROOT, "q-en4-dlg.js");
const FEMALE = ["Sara", "Emma", "Yumi", "Mika", "Aya", "Ms. Brown", "Ms. Smith"], MALE = ["Ken", "Tom", "Ben", "Leo", "Lucas"];
const TURNS = { 5: [2, 4], 6: [3, 4], 7: [4, 4], 8: [4, 5], 9: [5, 6] };
const UNITS = { 5: 12, 6: 13, 7: 14, 8: 15, 9: 16 };
const errs = [], data = {};
for (const g of [5, 6, 7, 8, 9]) {
  const txt = fs.readFileSync(path.join(ROOT, "dlg", "g" + g + ".txt"), "utf8");
  data[g] = [];
  let cur = null;
  txt.split("\n").forEach((raw, ln) => {
    const s = raw.trim(), where = "g" + g + ".txt:" + (ln + 1);
    if (!s) return;
    let m;
    if ((m = /^#\s*(\d)-(\d+)$/.exec(s))) { if (+m[1] !== g) errs.push(where + " 学年ちがい"); cur = { u: +m[2], lines: [], qs: [] }; data[g].push(cur); return; }
    if (!cur) { errs.push(where + " 見出しの前に行がある"); return; }
    if (s.startsWith("?")) {
      const p = s.slice(1).split("|").map((x) => x.trim());
      if (p.length !== 3) { errs.push(where + " 設問の形"); return; }
      const o = p[2].split(" / ").map((x) => x.trim()).filter(Boolean);
      cur.qs.push([p[0], p[1], o]);
      return;
    }
    if ((m = /^((?:Ms\. |Mr\. )?[A-Z][a-z]+):\s+(.+)$/.exec(s))) { cur.lines.push([m[1], m[2]]); return; }
    errs.push(where + " 読めない行: " + s);
  });
  const cnt = {};
  data[g].forEach((d, i) => {
    const w = "g" + g + " #" + i + " (" + d.u + ")";
    cnt[d.u] = (cnt[d.u] || 0) + 1;
    const [lo, hi] = TURNS[g];
    if (d.lines.length < lo || d.lines.length > hi) errs.push(w + " 話の数 " + d.lines.length + "（" + lo + "〜" + hi + "）");
    const who = [...new Set(d.lines.map((l) => l[0]))];
    if (who.length !== 2) errs.push(w + " 話し手は2人: " + who);
    d.lines.forEach((l, k) => {
      if (!FEMALE.includes(l[0]) && !MALE.includes(l[0])) errs.push(w + " 話し手の性別が未登録: " + l[0]);
      if (k && l[0] === d.lines[k - 1][0]) errs.push(w + " 同じ人が続けて話している");
      if (/[^\x20-\x7E]/.test(l[1])) errs.push(w + " 英文に英語以外の文字: " + l[1]);
      if (!/^[A-Z0-9"]/.test(l[1]) || !/[.!?"]$/.test(l[1])) errs.push(w + " 大文字で始め記号で終える: " + l[1]);
    });
    if (d.qs.length < 3) errs.push(w + " 設問は3つ以上");
    d.qs.forEach((q) => {
      if (q[2].length !== 3) errs.push(w + " まちがいの選択肢は3つ: " + q[0]);
      if (q[2].includes(q[1]) || new Set(q[2]).size !== q[2].length) errs.push(w + " 選択肢が重なる: " + q[0]);
      if (!/[？?]$/.test(q[0])) errs.push(w + " 質問は？で終える: " + q[0]);
      const nm = /^(.+?)は何と言っていましたか？$/.exec(q[0]);
      if (nm && !d.lines.length) errs.push(w);
    });
  });
  for (let u = 0; u < UNITS[g]; u++) if ((cnt[u] || 0) < 2) errs.push("g" + g + " 単元" + u + " の会話が2つ未満");
}
const out = "// 自動生成（tools/build_dlg.js）— 元は dlg/g5〜g9.txt の手書きの会話。直接編集しない\n(function (G) {\n  const E4 = G.HM.EN4;\n  E4.DLG = " + JSON.stringify(data) + ";\n  E4.VOICE_SEX = " + JSON.stringify(Object.fromEntries(FEMALE.map((n) => [n, "f"]).concat(MALE.map((n) => [n, "m"])))) + ";\n})(typeof window !== \"undefined\" ? window : globalThis);\n";
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
const n = Object.values(data).reduce((a, x) => a + x.length, 0), nq = Object.values(data).reduce((a, x) => a + x.reduce((b, d) => b + d.qs.length, 0), 0);
if (process.argv.includes("--check")) {
  if (fs.readFileSync(OUT, "utf8") !== out) { console.error("q-en4-dlg.js が古い：node tools/build_dlg.js"); process.exit(1); }
  console.log("dlg OK", n, "会話", nq, "問");
} else { fs.writeFileSync(OUT, out); console.log("wrote q-en4-dlg.js", n, "会話", nq, "問"); }
