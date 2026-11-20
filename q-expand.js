/* ほしまなび — v1.5 出題形式を自動でふやす（〇×・ことばカード・なかま分け・ぜんぶえらぶ・線でつなぐ・答えをえらぶ）
   各単元の問題（バンク・表・生成）から、別の形式の問題を作るステップを足す。HM.finalize() で1回だけ動く。
   ・〇×：「こたえ」が正しいか判断。選択肢がないと決められない問題（次のうち／どれ／いちばん…）は使わない
   ・ことばカード：2〜7文字の用語を、文字カードをならべて作る（まちがい選択肢の文字をまぜる）
   ・なかま分け／ぜんぶえらぶ：分類表（HM.groups）から
   ・線でつなぐ：対応表（HM.pairs）から */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, { R, pick, shuf } = U;
  const strip = (s) => String(s || "").replace(/<[^>]+>/g, "");
  // 選択肢を見ないと答えが決まらない問題・否定の問題
  const OPT_DEP = /次の|つぎの|どれ|どっち|どちら|いちばん|一番|最も|もっとも|正しいもの|まちが|あてはまらない|ではない|でない|ないもの|ないな|ないのは|ないこと|ないとき|ではないもの|ちがうもの|仲間はずれ|なかまはずれ|ふさわしくない|誤って|あやまって|ア〜|ア～|①|②/;
  const LABEL_ANS = /^(あ|い|う|え|ア|イ|ウ|エ|A|B|C|D|わからない|同じ|おなじ|どちらも|どれも|ない|ある|はい|いいえ|〇|×|正しい|まちがい)$/;
  const isJaTerm = (a) => /^[\u3040-\u30ff\u4e00-\u9fffー々]{2,7}$/.test(a) && !/^[ぁ-ん]{2}$/.test(a);
  const isEnWord = (a) => /^[a-z]{3,9}$/.test(a);
  const isEnSentence = (a) => /^[A-Za-z][A-Za-z ,'?.!]+$/.test(a) && a.split(/\s+/).length >= 3 && a.split(/\s+/).length <= 8;

  // ステップから問題を1つとり出す（バンクはランダムな1行、生成は呼び出し）
  function sampler(st) {
    if (Array.isArray(st.src)) { const all = st.src.map((x) => (typeof x === "string" ? HM.parseBankLine(x) : x)); return () => Object.assign({}, pick(all)); }
    if (typeof st.src === "function") return (d, i) => { try { return st.src(d, i); } catch (e) { return null; } };
    return null;
  }
  // 数の答えの、ありがちなまちがい
  function wrongNum(a) {
    if (/^-?\d+$/.test(a)) { const v = +a; const c = [v + 1, v - 1, v + 10, v - 10, v * 10, v + 2, v - 2].filter((x) => (v < 0 || x >= 0) && x !== v); if (v > 0 && a.length >= 2) { const sw = a.split("").reverse().join(""); if (sw !== a && !/^0/.test(sw)) c.push(+sw); } return c.length ? String(pick(c)) : null; }
    if (/^-?\d+\.\d+$/.test(a)) { const k = a.split(".")[1].length, v = Math.round(+a * 10 ** k); const c = [v + 1, v - 1, v * 10, Math.round(v / 10)].filter((x) => x !== v && (v < 0 || x >= 0)); return c.length ? U.dec(pick(c), k) : null; }
    const m = /^(\d+)\/(\d+)$/.exec(a); if (m && m[1] !== m[2]) return pick([m[2] + "/" + m[1], (+m[1] + 1) + "/" + m[2]]);
    return null;
  }
  // 〇×の問題にする
  function toTF(q) {
    if (!q || q.pass) return null;
    const qs = strip(q.q);
    if (OPT_DEP.test(qs)) return null;
    let cand, wrong;
    if (q.t === "ch") { if (LABEL_ANS.test(q.a) || !q.o || !q.o.length) return null; wrong = pick(q.o); }
    else if (q.t === "num") { wrong = wrongNum(q.a); if (wrong == null) return null; }
    else return null;
    const ok = U.rng() < 0.5; cand = ok ? q.a : wrong;
    const unit = q.unit ? q.unit : "";
    return { t: "tf", q: q.q + '<div class="tf-cand">こたえ：<b>' + esc(cand) + unit + "</b></div>", a: ok ? "〇" : "×", tfOf: { a: q.a, cand }, base: q, ex: (ok ? "〇 正しい。" : "× 正しい答えは「" + q.a + unit + "」。") + (q.ex || ""), src: q.src };
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  // ことばカード
  function toTiles(q) {
    if (!q || q.t !== "ch" || q.pass) return null;
    const qs = strip(q.q); if (OPT_DEP.test(qs)) return null;
    const a = q.a;
    if (isEnSentence(a)) {
      const pieces = a.replace(/[.?!]$/, "").split(/\s+/), end = (a.match(/[.?!]$/) || [""])[0];
      const extra = shuf((q.o || []).flatMap((o) => o.replace(/[.?!]$/, "").split(/\s+/)).filter((w) => !pieces.includes(w))).slice(0, 2);
      if (end) pieces[pieces.length - 1] += end;
      return { t: "tiles", q: q.q + '<span class="kj-sub">カードをならべて英文を作ろう</span>', pieces, extra, sep: " ", a: pieces.join(" "), ex: q.ex };
    }
    if (isEnWord(a)) {
      const pieces = a.split(""), extra = shuf([..."abcdefghijklmnopqrstuvwxyz"].filter((c) => !pieces.includes(c))).slice(0, 2);
      return { t: "tiles", q: q.q + '<span class="kj-sub">文字カードをならべてつづりを作ろう</span>', pieces, extra, a, ex: q.ex };
    }
    if (!isJaTerm(a)) return null;
    const pieces = [...a];
    const pool = [...new Set((q.o || []).join("").split(""))].filter((c) => !pieces.includes(c) && /[\u3040-\u30ff\u4e00-\u9fff]/.test(c));
    const extra = shuf(pool).slice(0, a.length <= 3 ? 2 : 3);
    if (extra.length < 1) return null;
    return { t: "tiles", q: q.q + '<span class="kj-sub">カードをならべて答えを作ろう</span>', pieces, extra, a, ex: q.ex };
  }
  const GEN_TRIES = 40;
  function wrapGen(srcs, conv) {
    return (d, i) => { for (let t = 0; t < GEN_TRIES; t++) { const s = pick(srcs); const q = conv(s(d, i)); if (q) return q; } return null; };
  }
  // ステップが十分に問題を作れるか（ちがう問題の数）をしらべる
  function probe(gen, n, needA) {
    const seen = new Set(), as = new Set(); HM.setRng(HM.mulberry(12345));
    for (let k = 0; k < n * 8 && (seen.size < n || as.size < needA); k++) { const q = gen(Math.min(1, k / n), k % 10); if (q) { seen.add(q.q + "|" + q.a); as.add(q.a); } }
    HM.setRng(Math.random); return seen.size >= n && as.size >= needA;
  }
  // ---- 表から ----
  function groupsOf(st) { const out = []; const walk = (f) => { if (!f) return; if (f.table) out.push(f.table); (f.parts || []).forEach(walk); }; walk(st.src); return out; }
  function sortGen(tables) {
    return () => {
      const T = pick(tables), labs = Object.keys(T.obj).filter((l) => T.obj[l].length >= 2 && l.length <= 12);
      if (labs.length < 2) return null;
      const nb = labs.length >= 3 && U.rng() < 0.4 ? 3 : 2;
      let bins = shuf(labs).slice(0, nb);
      const nots = (T.o && T.o.not) || []; if (bins.some((x) => bins.some((y) => nots.includes(x + ">" + y)))) return null;
      const per = nb === 3 ? 2 : 3, items = [];
      bins.forEach((b, bi) => shuf(T.obj[b]).slice(0, per).forEach((it) => items.push([it, bi])));
      const its = shuf(items);
      return { t: "sort", q: "カードを正しい箱に分けよう。", bins, items: its, sortSrc: T.obj, a: bins.map((b, bi) => b + "：" + its.filter((x) => x[1] === bi).map((x) => x[0]).sort().join("・")).join(" ／ "), ex: bins.map((b, bi) => "「" + b + "」は " + its.filter((x) => x[1] === bi).map((x) => x[0]).join("・")).join("。") + "。" };
    };
  }
  function multiGen(tables) {
    return () => {
      const T = pick(tables), labs = Object.keys(T.obj).filter((l) => T.obj[l].length >= 2);
      if (labs.length < 2) return null;
      const l = pick(labs), nots = (T.o && T.o.not) || [];
      const k = Math.min(T.obj[l].length, pick([1, 2, 2, 3])), yes = shuf(T.obj[l]).slice(0, k);
      const others = shuf(labs.filter((x) => x !== l && !nots.includes(x + ">" + l) && !nots.includes(l + ">" + x)).flatMap((x) => T.obj[x])).slice(0, 5 - k);
      if (others.length < 2) return null;
      return { t: "multi", q: "「" + l + "」にあてはまるものを、ぜんぶえらぼう。", opts: shuf(yes.concat(others)), ans: yes, multiSrc: { yes: T.obj[l] }, a: yes.slice().sort().join("・"), ex: "「" + l + "」にあてはまるのは " + yes.join("・") + "。" + others.map((x) => x).join("・") + " はあてはまらない。" };
    };
  }
  function matchGen(tables) {
    return () => {
      const T = pick(tables); if (T.rows.length < 4) return null;
      const rows = shuf(T.rows).slice(0, 4);
      if (rows.some((r) => r[0].length > 22 || r[1].length > 14)) return null;
      return HM.F.match("左と右で、合うものを線でつなごう。", rows.map((r) => [r[0], r[1]]), rows.map((r) => r[0] + " → " + r[1]).join("。") + "。");
    };
  }
  // ---- 数の問題を「えらぶ」に ----
  function numToCh(q) {
    if (!q || q.t !== "num" || q.pass) return null;
    const ws = new Set(); for (let k = 0; k < 12 && ws.size < 3; k++) { const w = wrongNum(q.a); if (w != null && w !== q.a) ws.add(w); }
    if (ws.size < 3) return null;
    return Object.assign({}, q, { t: "ch", a: q.a + (q.unit || ""), o: [...ws].map((w) => w + (q.unit || "")), unit: undefined });
  }

  HM.expandFormats = function () {
    const added = { tf: 0, tiles: 0, sort: 0, multi: 0, match: 0, ch: 0 };
    for (const [s, gs] of Object.entries(HM.SUBJECTS)) for (const us of Object.values(gs)) for (const u of us) {
      if (u.kanji || u.expanded) continue; u.expanded = true;
      const base = u.steps.filter((st) => !st.review && !st.pass && !st.gen15);
      if (!base.length) continue;
      const srcs = base.map(sampler).filter(Boolean);
      const add = [];
      const tryAdd = (name, gen, cnt, need, kind) => { if (probe(gen, need, kind === "tf" ? 2 : Math.min(need, 6))) { add.push({ n: name, src: gen, cnt, auto: kind }); added[kind]++; } };
      tryAdd("〇×でたしかめ", wrapGen(srcs, toTF), 10, 10, "tf");
      if (s !== "math") tryAdd("ことばカード", wrapGen(srcs, toTiles), 8, 8, "tiles");
      else tryAdd("答えをえらぼう", wrapGen(srcs, numToCh), 8, 10, "ch");
      const groups = base.flatMap(groupsOf).filter((t) => t.kind === "groups"), pairs = base.flatMap(groupsOf).filter((t) => t.kind === "pairs");
      if (groups.length) { tryAdd("なかま分け", sortGen(groups), 6, 6, "sort"); tryAdd("ぜんぶえらぼう", multiGen(groups), 8, 8, "multi"); }
      if (pairs.length) tryAdd("線でつなごう", matchGen(pairs), 5, 5, "match");
      if (!add.length) continue;
      const ri = u.steps.findIndex((st) => st.review);
      if (ri >= 0) u.steps.splice(ri, 0, ...add); else u.steps.push(...add);
    }
    return added;
  };
  HM.finalize = function () {
    if (HM._finalized) return HM._finalized; 
    (HM.finalizers || []).forEach((f) => f());
    HM._finalized = HM.expandFormats();
    if (HM.balance) HM._finalized.balance = HM.balance();
    return HM._finalized;
  };
  if (typeof window !== "undefined") HM.finalize();
})(typeof window !== "undefined" ? window : globalThis);
