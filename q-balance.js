/* ほしまなび — v1.5 問題の量をそろえる（学年が上がるほど多く、v1.4の3倍以上）
   各単元の問題（生成・バンク）をまぜた演習ステップを足す。1つのステップの中で、
   「そのまま」「答えをえらぶ」「〇×」「まちがいさがし」「答えの大きさでならべかえ」を、
   同じ単元の別々のステップから交ぜて出すので、同じ形の問題が数字だけかわって続くことはない。 */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, { pick, shuf } = U;
  // v1.4.1 の1周あたりの問題数（tools/stats-before-v15.json）
  const BASE = {
    math: { 1: 466, 2: 463, 3: 426, 4: 423, 5: 484, 6: 330, 7: 268, 8: 190, 9: 250 },
    life: { 1: 138, 2: 113 },
    sci: { 3: 131, 4: 192, 5: 156, 6: 212, 7: 131, 8: 153, 9: 157 },
    soc: { 3: 100, 4: 105, 5: 130, 6: 153, 7: 138, 8: 108, 9: 135 },
    ja: { 1: 73, 2: 83, 3: 85, 4: 105, 5: 101, 6: 102, 7: 102, 8: 103, 9: 88 },
    en: { 3: 108, 4: 96, 5: 104, 6: 110, 7: 118, 8: 98, 9: 92 },
  };
  const strip = (s) => String(s || "").replace(/<[^>]+>/g, "");
  const OPT_DEP = /次の|つぎの|どれ|どっち|どちら|いちばん|一番|最も|もっとも|正しいもの|まちが|あてはまらない|ではない|でない|ないもの|ないのは|ちがうもの|仲間はずれ|なかまはずれ|ふさわしくない|誤って|あやまって|ア〜|ア～|①|②|下の|上の|右の|左の|図|グラフ|表/;
  const LABEL_ANS = /^(あ|い|う|え|ア|イ|ウ|エ|A|B|C|D|わからない|同じ|おなじ|どちらも|どれも|ない|ある|はい|いいえ|〇|×|正しい|まちがい)$/;
  function stepSize(st) { if (typeof st.src === "function") { if (st._sz == null) { const n = st.cnt || 10, seen = new Set(); try { for (let k = 0; k < n * 3 && seen.size < n; k++) { const q = st.src(0.5, k % n); if (q) seen.add(q.q + "|" + q.a); } } catch (e) {} st._sz = seen.size; } return st._sz; } if (Array.isArray(st.src)) return Math.min(st.cnt || 6, st.src.length); return 0; }
  function sampler(st) {
    if (Array.isArray(st.src)) { const all = st.src.map((x) => (typeof x === "string" ? HM.parseBankLine(x) : x)); return () => Object.assign({}, pick(all)); }
    if (typeof st.src === "function") return (d, i) => { try { return st.src(d, i); } catch (e) { return null; } };
    return null;
  }
  function wrongOf(q) {
    if (q.t === "ch") { if (LABEL_ANS.test(q.a) || !q.o || !q.o.length) return null; return pick(q.o); }
    if (q.t === "num") { const a = String(q.a); if (/^-?\d+$/.test(a)) { const v = +a, c = [v + 1, v - 1, v + 10, v - 10, v + 2].filter((x) => x !== v && (v < 0 || x >= 0)); return String(pick(c)); } if (/^-?\d+\.\d+$/.test(a)) { const k = a.split(".")[1].length, v = Math.round(+a * 10 ** k); return U.dec(pick([v + 1, v - 1, v * 10].filter((x) => x !== v && x >= 0)), k); } }
    return null;
  }
  const shortQ = (q) => { const s = strip(q.q).trim(); return s.length >= 3 && s.length <= 34 && !/<svg/.test(q.q || "") && !q.svg && !q.pass && !q.listen && !OPT_DEP.test(s) && (q.t === "ch" || q.t === "num"); };
  // まちがいさがし：4つの「問題 ➜ 答え」のうち、1つだけ答えがちがう
  function oddGen(srcs) {
    return (d, i) => {
      const got = [], seenQ = new Set();
      for (let k = 0; k < 40 && got.length < 4; k++) { const s = pick(srcs), q = s(d, i); if (!q || !shortQ(q) || seenQ.has(strip(q.q))) continue; const w = wrongOf(q); if (w == null) continue; seenQ.add(strip(q.q)); got.push({ q, w }); }
      if (got.length < 4) return null;
      const bad = Math.floor(U.rng() * 4), unit = (x) => x.q.unit || "";
      const lines = got.map((x, j) => strip(x.q.q).trim().replace(/[。]$/, "") + " ➜ " + (j === bad ? x.w : x.q.a) + unit(x));
      if (new Set(lines).size < 4) return null;
      const B = got[bad];
      return { t: "ch", q: "まちがっているのはどれ？（1つだけ答えがちがいます）", a: lines[bad], o: lines.filter((_, j) => j !== bad), opts: shuf(lines.slice()), oddOf: got.map((x, j) => ({ a: String(x.q.a), shown: j === bad ? String(x.w) : String(x.q.a), chk: x.q.chk, pi: x.q.pi })), ex: "「" + strip(B.q.q).trim() + "」の正しい答えは「" + B.q.a + unit(B) + "」。" + (B.q.ex ? " " + B.q.ex : "") };
    };
  }
  // 答えの大きさでならべかえ（算数・数学の計算問題）
  const PURE = /^[0-9０-９+\-−×÷().\s\/{}^²³]+\s*(=|＝|は\s*？|は\?|\?)?\s*$/;
  function ordGen(srcs) {
    return (d, i) => {
      const got = [], seen = new Set();
      for (let k = 0; k < 50 && got.length < 4; k++) { const q = pick(srcs)(d, i); if (!q || q.t !== "num" || !/^-?\d+(\.\d+)?$/.test(String(q.a))) continue; const e = strip(q.q).trim(); if (!PURE.test(e)) continue; const ex = e.replace(/\s*(=|＝|は\s*？|は\?|\?)\s*$/, "").trim(); if (!ex || seen.has(ex) || got.some((x) => +x.a === +q.a)) continue; seen.add(ex); got.push({ e: ex, a: +q.a, chk: q.chk }); }
      if (got.length < 4) return null;
      const asc = U.rng() < 0.6, s = got.slice().sort((x, y) => (asc ? x.a - y.a : y.a - x.a));
      return Object.assign(HM.F.ord("計算の答えが" + (asc ? "小さい" : "大きい") + "じゅんにならべよう。", s.map((x) => x.e), s.map((x) => x.e + " = " + x.a).join("、") + "。"), { ordOf: s.map((x) => ({ e: x.e, a: x.a, chk: x.chk })), shuffle: true });
    };
  }
  // 数の答えを「えらぶ」に
  function toCh(q) {
    if (!q || q.t !== "num" || q.pass) return null;
    const ws = new Set(); for (let k = 0; k < 14 && ws.size < 3; k++) { const w = wrongOf(q); if (w != null && w !== String(q.a)) ws.add(w); }
    if (ws.size < 3) return null;
    return Object.assign({}, q, { t: "ch", a: q.a + (q.unit || ""), o: [...ws].map((w) => w + (q.unit || "")), unit: undefined });
  }
  function toTF(q) {
    if (!q || q.pass || OPT_DEP.test(strip(q.q))) return null;
    const w = wrongOf(q); if (w == null) return null;
    const ok = U.rng() < 0.5, cand = ok ? q.a : w, unit = q.unit || "";
    return { t: "tf", q: q.q + '<div class="tf-cand">こたえ：<b>' + String(cand).replace(/[&<>"]/g, "") + unit + "</b></div>", a: ok ? "〇" : "×", tfOf: { a: q.a, cand }, base: q, ex: (ok ? "〇 正しい。" : "× 正しい答えは「" + q.a + unit + "」。") + (q.ex || "") };
  }
  // まぜた演習
  function mixGen(srcs, isMath) {
    const odd = oddGen(srcs), ord = isMath ? ordGen(srcs) : null;
    return (d, i) => {
      for (let t = 0; t < 30; t++) {
        const r = U.rng();
        let q;
        if (r < 0.12) q = odd(d, i);
        else if (ord && r < 0.2) q = ord(d, i);
        else { const b = pick(srcs)(d, i); if (!b) continue; const r2 = U.rng(); q = r2 < 0.2 ? toTF(b) || b : isMath && r2 < 0.42 ? toCh(b) || b : b; }
        if (q) return q;
      }
      return null;
    };
  }
  function probe(gen, n) {
    const seen = new Set(), as = new Set(); HM.setRng(HM.mulberry(777));
    for (let k = 0; k < n * 8 && (seen.size < n || as.size < 6); k++) { const q = gen(Math.min(1, k / n), k % 10); if (q) { seen.add(q.q + "|" + q.a); as.add(q.a); } }
    HM.setRng(Math.random); return seen.size >= n && as.size >= 6;
  }
  const NAMES = ["まとめドリル", "ミックス演習", "力だめし", "チャレンジ", "レベルアップ", "スピードチェック", "おさらい", "実力アップ", "総合れんしゅう", "仕上げ"];
  HM.balance = function () {
    const report = {};
    for (const [s, gs] of Object.entries(HM.SUBJECTS)) {
      const grades = Object.keys(gs).map(Number).sort((a, b) => a - b); let prev = 0;
      for (const g of grades) {
        const units = gs[g]; let cur = 0; units.forEach((u) => u.steps.forEach((st) => (cur += stepSize(st))));
        const base = (BASE[s] || {})[g] || 0, target = Math.max(Math.ceil(base * 3), prev + 25, cur);
        prev = target; let need = target - cur; const before = cur;
        const cnt = g <= 2 ? 10 : g <= 6 ? 12 : 15;
        // 単元ごとの「まぜる元」
        const pools = units.map((u) => { const base = u.steps.filter((st) => !st.review && !st.pass && !st.balanced && (st.auto ? st.auto === "ch" : true) && typeof st.src !== "undefined"); return { u, srcs: base.map(sampler).filter(Boolean), n: 0, ok: true }; }).filter((p) => p.srcs.length >= (s === "ja" ? 1 : 2) && !(p.u.kanji && s !== "ja"));
        let guard = 0;
        while (need > 0 && pools.some((p) => p.ok) && guard++ < 2000) {
          for (const p of pools) {
            if (need <= 0) break; if (!p.ok) continue;
            if (p.n >= 18) { p.ok = false; continue; }
            const gen = mixGen(p.srcs, s === "math");
            if (!probe(gen, cnt)) { p.ok = false; continue; }
            p.n++; const st = { n: NAMES[(p.n - 1) % NAMES.length] + (p.n > NAMES.length ? " " + Math.ceil(p.n / NAMES.length) : ""), src: gen, cnt, auto: "mix", balanced: true };
            const ri = p.u.steps.findIndex((x) => x.review); if (ri >= 0) p.u.steps.splice(ri, 0, st); else p.u.steps.push(st);
            need -= cnt; cur += cnt;
          }
        }
        report[s + g] = { base, before, after: cur, target };
        prev = Math.max(prev, cur);
      }
    }
    return report;
  };
})(typeof window !== "undefined" ? window : globalThis);
