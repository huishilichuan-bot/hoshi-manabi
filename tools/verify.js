/* ほしまなび — 答えの自動検証（独立した式の読みなおし・多項式の数値照合・方程式の代入・選択肢の一意性） */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
require(path.join(ROOT, "q-util.js"));
const FILES = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/q-[a-z0-9-]+\.js/g).filter((f) => f !== "q-util.js");
[...new Set(FILES)].forEach((f) => require(path.join(ROOT, f)));
const SEEDS = +process.argv[2] || 200;

// ---- 独立した有理数（BigIntで誤差なし） ----
const bg = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a || 1n; };
const Q = (n, d = 1n) => { n = BigInt(n); d = BigInt(d); if (d === 0n) throw new Error("div0"); if (d < 0n) { n = -n; d = -d; } const g = bg(n, d); return { n: n / g, d: d / g }; };
const qa = (x, y) => Q(x.n * y.d + y.n * x.d, x.d * y.d), qs = (x, y) => Q(x.n * y.d - y.n * x.d, x.d * y.d), qm = (x, y) => Q(x.n * y.n, x.d * y.d), qd = (x, y) => Q(x.n * y.d, x.d * y.n);
const qeq = (x, y) => x.n === y.n && x.d === y.d;
const qf = (x) => Number(x.n) / Number(x.d);
const qstr = (x) => (x.d === 1n ? String(x.n) : x.n + "/" + x.d);
function decQ(s) { const neg = s.startsWith("-"); if (neg) s = s.slice(1); const [i, f = ""] = s.split("."); const v = Q(BigInt(i + f || "0"), 10n ** BigInt(f.length)); return neg ? Q(-v.n, v.d) : v; }
// 式の評価：+ - * / ^ ( ) 数・小数・sqrt()・変数。exact=true なら有理数、falseなら浮動小数
function evalExpr(src, vars = {}, exact = true) {
  const s = src.replace(/\s+/g, ""); let i = 0;
  const peek = () => s[i];
  const num = (v) => (exact ? v : qf(v));
  const add = (a, b) => (exact ? qa(a, b) : a + b), sub = (a, b) => (exact ? qs(a, b) : a - b), mul = (a, b) => (exact ? qm(a, b) : a * b), div = (a, b) => { if (exact) return qd(a, b); return a / b; };
  const pw = (a, b) => { if (exact) { const e = Number(b.n); if (b.d !== 1n) throw new Error("frac pow"); let r = Q(1); for (let k = 0; k < Math.abs(e); k++) r = qm(r, a); return e < 0 ? qd(Q(1), r) : r; } return Math.pow(a, b); };
  function expr() { let v = term(); while (peek() === "+" || peek() === "-") { const o = s[i++]; const t = term(); v = o === "+" ? add(v, t) : sub(v, t); } return v; }
  function term() { let v = unary(); for (;;) { const c = peek(); if (c === "*" || c === "/") { i++; const t = unary(); v = c === "*" ? mul(v, t) : div(v, t); } else if (c && /[0-9a-z(√.]/.test(c) && i > 0) { const t = unary(); v = mul(v, t); } else break; } return v; }
  function unary() { if (peek() === "-") { i++; const v = unary(); return exact ? Q(-v.n, v.d) : -v; } if (peek() === "+") { i++; return unary(); } return power(); }
  function power() { let b = atom(); if (peek() === "^") { i++; const e = unary(); b = pw(b, e); } return b; }
  function atom() {
    const c = peek();
    if (c === "(") { i++; const v = expr(); if (s[i++] !== ")") throw new Error("paren " + src); return v; }
    if (s.startsWith("sqrt(", i)) { i += 5; const v = expr(); i++; const f = exact ? qf(v) : v; if (exact) { const r = Math.round(Math.sqrt(f)); if (r * r === f) return Q(r); throw new Error("SQRT"); } return Math.sqrt(f); }
    if (c === "√") { i++; const v = atom(); return exact ? (() => { const f = qf(v), r = Math.round(Math.sqrt(f)); if (r * r === f) return Q(r); throw new Error("SQRT"); })() : Math.sqrt(v); }
    let m = /^[0-9]+(\.[0-9]+)?/.exec(s.slice(i)); if (m) { i += m[0].length; return num(decQ(m[0])); }
    m = /^[a-z]/.exec(s.slice(i)); if (m) { i++; if (!(m[0] in vars)) throw new Error("var " + m[0] + " in " + src); return exact ? vars[m[0]] : vars[m[0]]; }
    throw new Error("parse '" + src + "' at " + i);
  }
  const v = expr(); if (i < s.length) throw new Error("trailing in " + src); return v;
}
const evalBoth = (src) => { try { return { ex: evalExpr(src, {}, true) }; } catch (e) { if (e.message === "SQRT") return { fl: evalExpr(src, {}, false) }; throw e; } };
// 表示用の式を計算式に（全角記号・{分数}・帯分数・²³）
function norm(t) {
  return t.replace(/<[^>]+>/g, "").replace(/＝\s*？.*$/, "").replace(/[＋]/g, "+").replace(/[−–]/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/\{(\d+)と(\d+)\/(\d+)\}/g, "($1+$2/$3)").replace(/\{(-?\d+)\/(\d+)\}/g, "($1/$2)").replace(/²/g, "^2").replace(/³/g, "^3").replace(/[（]/g, "(").replace(/[）]/g, ")").trim();
}
// 答えの文字を数に（整数・小数・分数・帯分数・負号・π・√・単位つき）
function parseAns(a) {
  let s = String(a).replace(/\s+/g, "").replace(/^[xy]＝/, "").replace(/[−]/g, "-").replace(/(cm²|cm³|cm|m²|km|kg|mL|dL|L|円|人|こ|本|°|g|m|倍|分|秒|時間|通り|試合|ページ|まい|袋|％)$/u, "");
  let pi = false; if (s.endsWith("π")) { pi = true; s = s.slice(0, -1) || "1"; }
  if (/^-?\d+(\.\d+)?$/.test(s)) return { v: decQ(s), pi };
  let m = /^(-?)(\d+)\/(\d+)$/.exec(s); if (m) return { v: Q((m[1] ? -1n : 1n) * BigInt(m[2]), BigInt(m[3])), pi };
  m = /^(-?)(\d+)と(\d+)\/(\d+)$/.exec(s); if (m) { const v = qa(Q(BigInt(m[2])), Q(BigInt(m[3]), BigInt(m[4]))); return { v: m[1] ? Q(-v.n, v.d) : v, pi }; }
  m = /^(-?)(\d*)√(\d+)$/.exec(s); if (m) return { fl: (m[1] ? -1 : 1) * (m[2] ? +m[2] : 1) * Math.sqrt(+m[3]), pi };
  return null;
}
// 多項式の答え（例 3x² − 2x ＋ 1、(x ＋ 2)(x − 3)、y＝2x＋1）を関数に
function polyFn(str) {
  let s = String(str).replace(/^y＝/, "").replace(/\s+/g, "").replace(/[＋]/g, "+").replace(/[−]/g, "-").replace(/²/g, "^2").replace(/³/g, "^3").replace(/円$/, "");
  return (vars) => evalExpr(s, vars, false);
}
// 2次方程式の答え（x＝±3 / x＝−2、5 / x＝(−3 ± √17)/2 / x＝1 ± √2）→ 解の配列
function parseRoots(str) {
  let s = String(str).replace(/\s+/g, "").replace(/^x＝/, "").replace(/[−]/g, "-").replace(/[＋]/g, "+");
  let m;
  if ((m = /^±(\d+)$/.exec(s))) return [+m[1], -m[1]];
  if ((m = /^(-?\d+)、(-?\d+)$/.exec(s))) return [+m[1], +m[2]];
  m = /^\(?(-?\d+)?±(\d*)√(\d+)\)?(?:\/(\d+))?$/.exec(s);
  if (m) { const p = m[1] ? +m[1] : 0, q = m[2] ? +m[2] : 1, r = Math.sqrt(+m[3]), den = m[4] ? +m[4] : 1; return [(p + q * r) / den, (p - q * r) / den]; }
  return null;
}
const sameSet = (a, b) => a && b && a.length === b.length && a.slice().sort((x, y) => x - y).every((v, i) => Math.abs(v - b.slice().sort((x, y) => x - y)[i]) < 1e-9);
const valEq = (A, B) => { if (!A || !B || A.pi !== B.pi) return false; if (A.v && B.v) return qeq(A.v, B.v); const fa = A.v ? qf(A.v) : A.fl, fb = B.v ? qf(B.v) : B.fl; return Math.abs(fa - fb) < 1e-9; };

const stats = {}; const problems = []; const warns = {};
const W = (k, msg) => { warns[k] = warns[k] || []; if (warns[k].length < 8) warns[k].push(msg); warns[k].n = (warns[k].n || 0) + 1; };
function check(q, where) {
  const fail = (m) => problems.push(where + " :: " + m + " :: " + String(q.q).replace(/<[^>]+>/g, " ").slice(0, 90) + " => " + q.a);
  if (!q.ex || String(q.ex).length < 4) fail("解説なし");
  if (q.a == null || /undefined|NaN|null|Infinity/.test(String(q.a) + q.q + q.ex + (q.o || []).join("|"))) return fail("値が不正");
  const A = parseAns(q.a);
  // 1) 問題文の式を読みなおして計算（生成プログラムとは別の計算）
  if (q.qx) { let v; try { v = evalBoth(norm(q.q)); } catch (e) { return fail("式が読めない " + norm(q.q)); } const qv = { v: v.ex, fl: v.fl, pi: false }; if (!valEq(qv, A)) return fail("問題文の式の値と答えがちがう(" + (v.ex ? qstr(v.ex) : v.fl) + ")"); stats.qx = (stats.qx || 0) + 1; }
  // 2) 検算式（chk）を独立に計算して照合
  if (q.chk != null && A) { let v; try { v = evalBoth(String(q.chk)); } catch (e) { return fail("検算式が読めない " + q.chk); } const cv = { v: v.ex, fl: v.fl, pi: !!q.pi }; if (!valEq(cv, A)) return fail("検算式の値(" + (v.ex ? qstr(v.ex) : v.fl) + ")と答えがちがう"); stats.chk = (stats.chk || 0) + 1; }
  if (q.t === "num") { if (!A) return fail("数字の答えが読めない"); if (q.chk == null) W("num_without_chk", where); if (q.frac && !/\//.test(q.a) && q.a.includes(".")) fail("分数問題なのに小数"); }
  if (q.t === "ch") {
    const opts = [q.a].concat(q.o);
    if (opts.length < 2) return fail("選択肢が足りない");
    if (new Set(opts).size !== opts.length) return fail("選択肢が重複");
    if (q.o.includes(q.a)) return fail("まちがい選択肢に正解がある");
    if (opts.some((o) => !String(o).trim())) return fail("空の選択肢");
    // 数として同じ値の選択肢がないか（例 1/2 と 2/4）
    if (A) for (const o of q.o) { const B = parseAns(o); if (B && valEq(A, B)) return fail("正解と同じ値の選択肢: " + o); }
    // 多項式：正解と検算式が同じ式か、まちがいが別の式か（数を入れて確かめる）
    if (q.expr) {
      const pts = [[1.7, -0.6], [-2.3, 3.1], [0.45, 1.9], [3.2, -2.7]];
      const ef = polyFn(q.expr), af = polyFn(q.a.replace(/円$/, ""));
      for (const [x, y] of pts) { const e = ef({ x, y }), a = af({ x, y }); if (Math.abs(e - a) > 1e-7 * Math.max(1, Math.abs(e))) return fail("多項式の答えが検算式とちがう"); }
      for (const o of q.o) { let of; try { of = polyFn(o.replace(/円$/, "")); } catch (e) { continue; } let same = true; try { for (const [x, y] of pts) if (Math.abs(of({ x, y }) - ef({ x, y })) > 1e-7 * Math.max(1, Math.abs(ef({ x, y })))) same = false; } catch (e) { same = false; } if (same) return fail("まちがい選択肢が正解と同じ式: " + o); }
      stats.expr = (stats.expr || 0) + 1;
    }
    // 2次方程式：解を方程式に代入、答えの文字から解を読みなおす、まちがいは別の解
    if (q.eqn) {
      const [a, b, c] = q.eqn; for (const r of q.roots) if (Math.abs(a * r * r + b * r + c) > 1e-7) return fail("解が方程式を満たさない");
      const pr = parseRoots(q.a); if (!sameSet(pr, q.roots)) return fail("答えの文字の解がちがう " + JSON.stringify(pr));
      for (const o of q.o) { const po = parseRoots(o); if (po && sameSet(po, q.roots)) return fail("まちがい選択肢も正しい解: " + o); }
      stats.eqn = (stats.eqn || 0) + 1;
    }
    // 正解の数値と選択肢の√の値が同じでないか
    if (A && A.fl != null) for (const o of q.o) { const B = parseAns(o.replace(/cm$/, "")); if (B && valEq(A, B)) return fail("√の値が同じ選択肢"); }
  }
  // 連立方程式：クラメルの公式で独立に解く
  if (q.sys) { const [[a, b, e], [c, d, f]] = q.sys; const D = a * d - b * c; if (D === 0) return fail("連立が解けない"); const x = qd(Q(e * d - b * f), Q(D)), y = qd(Q(a * f - e * c), Q(D)); const want = q.want === "y" ? y : x; if (!A || !qeq(A.v, want)) return fail("連立の解がちがう"); stats.sys = (stats.sys || 0) + 1; }
  // バンク問題：解説に正解が書かれているか（2つ目の根拠との照合）
  if (q.bank) { const key = String(q.a).replace(/[（(].*?[)）]/g, "").trim(); if (!String(q.ex).includes(key)) W("bank_ex_not_contain_answer", where + " :: " + q.q.slice(0, 40) + " => " + q.a); for (const o of q.o) if (String(q.ex).includes("答えは" + o) || String(q.ex).includes("正解は" + o)) fail("解説がまちがい選択肢を正解としている"); }
}

// ---- 国語・英語の表チェック（表そのものの重複・矛盾） ----
const LANG = { kanji: 0, eng: 0 };
if (HM.JA) {
  for (const g in HM.JA.KJT) { const m = {}; HM.JA.KJT[g].forEach(([k, y]) => { if (!/^[ぁ-ゖー]+$/.test(y)) problems.push("ja 漢字表 " + g + " :: 読みがひらがなでない " + k); if (m[k] && m[k] !== y) problems.push("ja 漢字表 :: 同じ漢字で読みが2つ " + k); m[k] = y; LANG.kanji++; }); }
  const kg = {}; HM.JA.KG.forEach(([w, s]) => { if (kg[w]) problems.push("ja 季語 :: 重複 " + w); kg[w] = s; });
  const bs = {}; HM.JA.BUSHU.forEach(([k, b]) => { if (bs[k]) problems.push("ja 部首 :: 重複 " + k); bs[k] = b; });
}
const allKJ = HM.JA ? [].concat(...Object.values(HM.JA.KJT)) : [];
function langCheck(q, where) {
  const fail = (m) => problems.push(where + " :: " + m + " :: " + q.q);
  if (q.kj) { const rs = allKJ.filter((w) => w[0] === q.kj).map((w) => w[1]); if (!rs.includes(q.a)) fail("読みが表とちがう"); for (const o of q.o) if (rs.includes(o)) fail("まちがい選択肢も正しい読み"); }
  if (q.kjw) { for (const o of q.o) if (allKJ.some((w) => w[0] === o && w[1] === q.kjw)) fail("まちがい選択肢も同じ読みの漢字: " + o); if (!allKJ.some((w) => w[0] === q.a && w[1] === q.kjw)) fail("書きの正解が表とちがう"); }
  if (q.en && typeof q.q === "string") {
    LANG.eng++;
    const m = q.q.match(/^(.*?) \( \) .* every day\.$/);
    if (m) { const s = m[1], third = /^(He|She|Ken|Yumi|My mother|My brother)$/.test(s), plural = /^(I|You|We|They|My parents|Ken and Yumi)$/.test(s); if (!third && !plural) fail("主語が不明"); const v = HM.EN.VB.find((x) => x[0] === q.a || x[1] === q.a); if (!v) fail("動詞が表にない"); else if (third !== (q.a === v[1])) fail("3単現の判定がちがう"); }
    const b = q.q.match(/^(.*?) \( \) (.*)\.$/);
    if (b && ["am", "is", "are", "was", "were"].includes(q.a)) { const s = b[1]; const want = s === "I" ? "am" : /^(You|We|They)$|and|s$/.test(s) && !/^(This book|Ken|My cat)$/.test(s) ? "are" : "is"; const past = /yesterday/.test(b[2]); const w2 = past ? (want === "are" ? "were" : "was") : want; if (q.a !== w2) fail("be動詞の判定がちがう 期待 " + w2); }
    if (/yesterday\.$/.test(q.q) && !/ than | as /.test(q.q) && !["was", "were"].includes(q.a)) { const v = HM.EN.VB.find((x) => x[2] === q.a); if (!v) fail("過去形が表にない"); for (const o of q.o) if (HM.EN.VB.some((x) => x[2] === o && x[0] === v[0])) fail("まちがい選択肢も過去形"); }
  }
}
const cover = {};
let total = 0, uniq = 0;
const uniqSet = new Set();
for (const [subj, grades] of Object.entries(HM.SUBJECTS)) for (const [g, units] of Object.entries(grades)) {
  const c = (cover[subj + ":" + g] = { units: units.length, steps: 0, filled: 0, gen: 0, bank: 0, bankQ: 0 });
  units.forEach((u, ui) => u.steps.forEach((st, si) => {
    c.steps++;
    const where = subj + " " + g + " / " + u.n + " / " + st.n;
    if (typeof st.src === "function") {
      c.gen++; c.filled++;
      for (let k = 0; k < SEEDS; k++) { let set; try { set = HM.makeSet(st, k * 7919 + 13); } catch (e) { problems.push(where + " :: 生成エラー " + e.message); break; } if (set.length < 2) problems.push(where + " :: 問題数がたりない " + set.length + "/" + st.cnt); else if (set.length < st.cnt) W("short_set", where + " " + set.length + "/" + st.cnt); const qs = new Set(); set.forEach((q) => { total++; const key = q.q + "|" + q.a; if (!uniqSet.has(where + key)) { uniqSet.add(where + key); uniq++; } if (qs.has(key)) W("dup_in_set", where); qs.add(key); check(q, where); langCheck(q, where); }); }
    } else if (Array.isArray(st.src) && st.src.length) {
      c.bank++; c.filled++; c.bankQ += st.src.length;
      st.src.forEach((line) => { let q; try { q = typeof line === "string" ? HM.parseBankLine(line) : line; } catch (e) { problems.push(where + " :: バンク行エラー " + e.message); return; } q.bank = 1; total++; uniq++; check(q, where); });
    }
  }));
}
const out = { seeds: SEEDS, generatedChecked: total, uniqueQuestions: uniq, stats, problems: problems.length, cover, warns: Object.fromEntries(Object.entries(warns).map(([k, v]) => [k, { n: v.n, sample: v }])) };
fs.writeFileSync(path.join(__dirname, "verify-report.json"), JSON.stringify(out, null, 1));
{ const grp = {}; problems.forEach((p) => { const [w, m] = p.split(" :: "); const k = w + " :: " + m.replace(/[(:].*/, ""); if (!grp[k]) grp[k] = [0, p]; grp[k][0]++; }); Object.entries(grp).slice(0, 80).forEach(([k, [n, ex]]) => console.log("NG x" + n, ex)); }
console.log(JSON.stringify({ seeds: SEEDS, checked: total, unique: uniq, stats, lang: LANG, problems: problems.length, warns: Object.fromEntries(Object.entries(warns).map(([k, v]) => [k, v.n])) }));
process.exitCode = problems.length ? 1 : 0;
