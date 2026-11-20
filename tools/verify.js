/* ほしまなび — 答えの自動検証（独立した式の読みなおし・多項式の数値照合・方程式の代入・選択肢の一意性） */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
require(path.join(ROOT, "q-util.js"));
const FILES = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/q-[a-z0-9-]+\.js/g).filter((f) => f !== "q-util.js");
[...new Set(FILES)].forEach((f) => require(path.join(ROOT, f)));
if (HM.finalize) HM.finalize();
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
  const A = /^(tf|tiles|sort|multi|kanji|match|pair|ord|tap)$/.test(q.t) ? null : parseAns(q.a);
  // まちがいさがし：1つだけ答えがちがい、それが正解になっているか
  if (q.oddOf) { const bad = q.oddOf.filter((x) => x.shown !== x.a); if (bad.length !== 1) return fail("まちがいさがしで、ちがう答えが" + bad.length + "こ"); if (!String(q.a).includes(" ➜ " + bad[0].shown)) return fail("まちがいさがしの正解がずれている");
    for (const x of q.oddOf) if (x.chk != null) { let v; try { v = evalBoth(String(x.chk)); } catch (e) { continue; } const B = parseAns(x.a); if (B && !valEq({ v: v.ex, fl: v.fl, pi: !!x.pi }, B)) return fail("まちがいさがしの元の答えが検算とちがう"); } stats.odd = (stats.odd || 0) + 1; }
  // 答えの大きさでならべかえ：順番と検算
  if (q.ordOf) { for (let k = 1; k < q.ordOf.length; k++) { const p = q.ordOf[k - 1].a, c = q.ordOf[k].a; if (!(/小さい/.test(q.q) ? p < c : p > c)) return fail("ならべかえの順番がちがう"); }
    for (const x of q.ordOf) if (x.chk != null) { let v; try { v = evalBoth(String(x.chk)); } catch (e) { continue; } const B = parseAns(String(x.a)); if (B && !valEq({ v: v.ex, fl: v.fl, pi: false }, B)) return fail("ならべかえの答えが検算とちがう " + x.e); } stats.ordnum = (stats.ordnum || 0) + 1; }
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
  // 並べかえ：項目が重複なし、正解の文字＝正しい順、数の並べかえは値で独立に確かめる
  if (q.t === "ord") {
    if (!Array.isArray(q.items) || q.items.length < 3) return fail("並べかえの項目が足りない");
    if (new Set(q.items).size !== q.items.length) return fail("並べかえの項目が重複");
    if (q.a !== q.items.join(" → ")) return fail("並べかえの答えの文字がちがう");
    if (q.vals) { if (q.vals.length !== q.items.length) return fail("vals の数"); for (let i = 1; i < q.vals.length; i++) { const d = q.vals[i] - q.vals[i - 1]; if (q.dir === "desc" ? !(d < 0) : !(d > 0)) return fail("並べかえの値の順がちがう"); } stats.ord = (stats.ord || 0) + 1; }
    if (q.valExpr) { const v = q.items.map((it, i) => { try { return qf(evalBoth(q.valExpr[i]).ex); } catch (e) { return NaN; } }); for (let i = 1; i < v.length; i++) if (!(q.dir === "desc" ? v[i] < v[i - 1] : v[i] > v[i - 1])) return fail("並べかえの値（式）の順がちがう"); stats.ordx = (stats.ordx || 0) + 1; }
  }
  // 線でつなぐ・カード合わせ：左右とも重複なし、全カードの文字も重複なし、組の検算
  if (q.t === "match" || q.t === "pair") {
    if (!Array.isArray(q.pairs) || q.pairs.length < 3) return fail("組が足りない");
    const L = q.pairs.map((p) => String(p[0])), R = q.pairs.map((p) => String(p[1]));
    if (new Set(L).size !== L.length || new Set(R).size !== R.length) return fail("組の文字が重複");
    if (q.t === "pair" && new Set(L.concat(R)).size !== L.length * 2) return fail("カードの文字が重複");
    if (q.pchk) { for (let i = 0; i < q.pairs.length; i++) { let v; try { v = evalBoth(String(q.pchk[i])); } catch (e) { return fail("組の検算式が読めない"); } const B = parseAns(R[i]); if (!B || !valEq({ v: v.ex, fl: v.fl, pi: false }, B)) return fail("組の検算がちがう " + L[i] + "→" + R[i]); for (let j = 0; j < R.length; j++) if (j !== i) { const C = parseAns(R[j]); if (C && valEq({ v: v.ex, fl: v.fl, pi: false }, C)) return fail("組の答えが2つある " + L[i]); } } stats.pairchk = (stats.pairchk || 0) + 1; }
  }
  // 図をタップ：正解の場所が図にある・場所の名前が重複しない
  if (q.t === "tap") {
    if (!q.svg || !Array.isArray(q.hits) || q.hits.length < 2) return fail("タップ問題の図がない");
    const ids = q.hits.map((h) => h[0]); if (new Set(ids).size !== ids.length) return fail("タップ場所が重複");
    if (new Set(q.hits.map((h) => h[1])).size !== ids.length) return fail("タップ場所の名前が重複");
    for (const id of ids) if (!q.svg.includes('data-hit="' + id + '"')) return fail("図にタップ場所がない " + id);
    const hit = q.hits.find((h) => h[0] === q.ans); if (!hit) return fail("正解の場所がない"); if (hit[1] !== q.a) return fail("正解の名前がちがう");
    stats.tap = (stats.tap || 0) + 1;
  }
  // ---- v1.5 の新しい形式 ----
  if (q.t === "tf") {
    if (q.a !== "〇" && q.a !== "×") return fail("〇×の答えがない");
    if (q.tfOf) {
      const same = String(q.tfOf.cand) === String(q.tfOf.a);
      if (same !== (q.a === "〇")) return fail("〇×の判定が元の答えとちがう");
      if (!same) { const X = parseAns(q.tfOf.a), Y = parseAns(q.tfOf.cand); if (X && Y && valEq(X, Y)) return fail("〇×：まちがいの答えが正解と同じ値"); }
      if (!String(q.q).includes(String(q.tfOf.cand))) return fail("〇×：問題に答えの候補が出ていない");
      if (q.base) check(q.base, where + " (元の問題)");
    }
    stats.tf = (stats.tf || 0) + 1;
  }
  if (q.t === "tiles") {
    if (!Array.isArray(q.pieces) || q.pieces.length < 2) return fail("カードが足りない");
    if (q.pieces.join(q.sep == null ? "" : q.sep) !== q.a) return fail("カードの答えがちがう");
    if ((q.extra || []).some((x) => q.pieces.includes(x))) return fail("まぎらわしいカードが正解の文字と同じ");
    stats.tiles = (stats.tiles || 0) + 1;
  }
  if (q.t === "sort") {
    if (!Array.isArray(q.bins) || q.bins.length < 2) return fail("箱が足りない");
    if (new Set(q.bins).size !== q.bins.length) return fail("箱の名前が重複");
    const names = q.items.map((x) => x[0]); if (new Set(names).size !== names.length) return fail("カードが重複");
    if (q.items.some((x) => !(x[1] >= 0 && x[1] < q.bins.length))) return fail("箱の番号が不正");
    if (q.bins.some((_, bi) => !q.items.some((x) => x[1] === bi))) return fail("空の箱がある");
    if (q.sortSrc) for (const [it, bi] of q.items) if (!(q.sortSrc[q.bins[bi]] || []).includes(it)) return fail("分類表とちがう " + it);
    stats.sort = (stats.sort || 0) + 1;
  }
  if (q.t === "multi") {
    if (!Array.isArray(q.ans) || !q.ans.length) return fail("正解がない");
    if (new Set(q.opts).size !== q.opts.length) return fail("選択肢が重複");
    if (q.ans.some((a) => !q.opts.includes(a))) return fail("正解が選択肢にない");
    if (q.ans.length >= q.opts.length) return fail("まちがいの選択肢がない");
    if (q.a !== q.ans.slice().sort().join("・")) return fail("答えの文字がちがう");
    if (q.multiSrc) { for (const o of q.opts) if (q.ans.includes(o) !== q.multiSrc.yes.includes(o)) return fail("分類表とちがう " + o); }
    stats.multi = (stats.multi || 0) + 1;
  }
  if (q.t === "nl") {
    const want = q.av != null ? q.av : parseFloat(q.a); const k = (want - q.min) / q.step;
    if (!(want >= q.min - 1e-9 && want <= q.max + 1e-9)) return fail("数直線の答えが範囲外");
    if (Math.abs(k - Math.round(k)) > 1e-6) return fail("数直線の答えが目もりの上にない");
    if (q.chk != null) { let v; try { v = evalBoth(String(q.chk)); } catch (e) { return fail("数直線の検算式が読めない"); } if (Math.abs((v.ex ? qf(v.ex) : v.fl) - want) > 1e-9) return fail("数直線の検算がちがう"); }
    stats.nl = (stats.nl || 0) + 1;
  }
  if (q.t === "kanji") { if (!q.kj || [...q.kj].length !== 1 || !(q.sc > 0)) return fail("漢字問題の字・画数がない"); stats.kanji = (stats.kanji || 0) + 1; }
  if (q.t === "ch" && q.figAsk && !q.svg && !/<svg/.test(q.q)) return fail("図の問題なのに図がない");
  if (q.say != null && (!/^[A-Za-z0-9 ,.'?!-]+$/.test(q.say))) return fail("読み上げ文が英語でない");
  if (q.sayIsAnswer && q.say !== q.a) return fail("聞きとりの答えと音声がちがう");
  // 連立方程式：クラメルの公式で独立に解く
  if (q.sys) { const [[a, b, e], [c, d, f]] = q.sys; const D = a * d - b * c; if (D === 0) return fail("連立が解けない"); const x = qd(Q(e * d - b * f), Q(D)), y = qd(Q(a * f - e * c), Q(D)); const want = q.want === "y" ? y : x; if (!A || !qeq(A.v, want)) return fail("連立の解がちがう"); stats.sys = (stats.sys || 0) + 1; }
  // バンク問題：解説に正解が書かれているか（2つ目の根拠との照合）
  if (q.bank && q.o) { const key = String(q.a).replace(/[（(].*?[)）]/g, "").trim(); if (!String(q.ex).includes(key)) W("bank_ex_not_contain_answer", where + " :: " + q.q.slice(0, 40) + " => " + q.a); for (const o of q.o) if (String(q.ex).includes("答えは" + o) || String(q.ex).includes("正解は" + o)) fail("解説がまちがい選択肢を正解としている"); }
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
  if (q.t === "kanji") return;
  if (q.t === "tf" && q.base) return langCheck(q.base, where + " (元の問題)");
  if (q.kj) { const rs = allKJ.filter((w) => w[0] === q.kj).map((w) => w[1]); if (!rs.includes(q.a)) fail("読みが表とちがう"); for (const o of q.o) if (rs.includes(o)) fail("まちがい選択肢も正しい読み"); }
  if (q.kjw) { for (const o of q.o) if (allKJ.some((w) => w[0] === o && w[1] === q.kjw)) fail("まちがい選択肢も同じ読みの漢字: " + o); if (!allKJ.some((w) => w[0] === q.a && w[1] === q.kjw)) fail("書きの正解が表とちがう"); }
  if (q.kjpair) { for (const [k, y] of q.pairs) if (!allKJ.some((w) => w[0] === k && w[1] === y)) fail("カードの読みが表とちがう " + k); for (const [k] of q.pairs) for (const [, y2] of q.pairs) if (allKJ.some((w) => w[0] === k && w[1] === y2) && !q.pairs.some((p) => p[0] === k && p[1] === y2)) fail("別の組み合わせも正しい " + k + y2); }
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
