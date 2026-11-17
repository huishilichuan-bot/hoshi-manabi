/* ほしまなび — 問題づくりの共通部品（ブラウザとNode検証の両方で使う） */
(function (root) {
  "use strict";
  const HM = (root.HM = root.HM || {});
  let rng = Math.random;
  HM.setRng = (f) => { rng = f; };
  HM.mulberry = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const R = (a, b) => a + Math.floor(rng() * (b - a + 1));
  // 難しさ d(0〜1) に合わせて上限をのばす乱数（最初は小さく、あとほど大きく）
  const L = (lo, hi, d) => R(lo, Math.max(lo, Math.round(lo + (hi - lo) * (0.25 + 0.75 * d))));
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  // 分数（整数で厳密に計算）
  function F(n, d = 1) { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; }
  const Fa = (x, y) => F(x.n * y.d + y.n * x.d, x.d * y.d);
  const Fs = (x, y) => F(x.n * y.d - y.n * x.d, x.d * y.d);
  const Fm = (x, y) => F(x.n * y.n, x.d * y.d);
  const Fd = (x, y) => F(x.n * y.d, x.d * y.n);
  const Fstr = (x) => (x.d === 1 ? String(x.n) : x.n + "/" + x.d);
  // 帯分数の文字（例 1と2/3）
  const Fmix = (x) => { if (x.d === 1 || Math.abs(x.n) < x.d) return Fstr(x); const s = x.n < 0 ? "-" : ""; const n = Math.abs(x.n); return s + Math.floor(n / x.d) + "と" + (n % x.d) + "/" + x.d; };
  // 小数を誤差なく文字にする（整数÷10^k で表す）
  const dec = (intVal, k) => { const neg = intVal < 0; let s = String(Math.abs(intVal)); if (k > 0) { s = s.padStart(k + 1, "0"); s = s.slice(0, -k) + "." + s.slice(-k); s = s.replace(/\.?0+$/, ""); } return (neg ? "-" : "") + s; };
  const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // 数字問題（キーパッドで入力）
  function num(q, a, ex, opt = {}) { return Object.assign({ t: "num", q, a: String(a), ex }, opt); }
  // 選択問題（正解1つ＋まちがい。重複や正解と同じものは自動で除く）
  function ch(q, a, wrongs, ex, opt = {}) {
    a = String(a);
    const seen = new Set([a]), o = [];
    for (const w0 of wrongs) { const w = String(w0); if (!seen.has(w) && o.length < (opt.max || 3)) { seen.add(w); o.push(w); } }
    return Object.assign({ t: "ch", q, a, o, ex }, opt, { max: undefined });
  }
  // 近い数のまちがい選択肢
  const near = (v, list = [1, -1, 2, -2, 10, -10]) => list.map((k) => v + k).filter((x) => x >= 0);
  const svg = (w, h, inner, cls = "") => '<svg class="qsvg ' + cls + '" viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" role="img">' + inner + "</svg>";
  // 時計の絵
  function clock(h, m) {
    let s = '<circle cx="60" cy="60" r="54" fill="#fff" stroke="#334" stroke-width="3"/>';
    for (let i = 0; i < 60; i++) { const a = (i / 60) * 2 * Math.PI, r1 = i % 5 ? 49 : 45; s += '<line x1="' + (60 + Math.sin(a) * r1).toFixed(1) + '" y1="' + (60 - Math.cos(a) * r1).toFixed(1) + '" x2="' + (60 + Math.sin(a) * 52).toFixed(1) + '" y2="' + (60 - Math.cos(a) * 52).toFixed(1) + '" stroke="#334" stroke-width="' + (i % 5 ? 1 : 2) + '"/>'; }
    for (let i = 1; i <= 12; i++) { const a = (i / 12) * 2 * Math.PI; s += '<text x="' + (60 + Math.sin(a) * 37).toFixed(1) + '" y="' + (64 - Math.cos(a) * 37).toFixed(1) + '" font-size="11" text-anchor="middle" fill="#223">' + i + "</text>"; }
    const ha = ((h % 12) + m / 60) / 12 * 2 * Math.PI, ma = (m / 60) * 2 * Math.PI;
    s += '<line x1="60" y1="60" x2="' + (60 + Math.sin(ha) * 26).toFixed(1) + '" y2="' + (60 - Math.cos(ha) * 26).toFixed(1) + '" stroke="#223" stroke-width="5" stroke-linecap="round"/>';
    s += '<line x1="60" y1="60" x2="' + (60 + Math.sin(ma) * 42).toFixed(1) + '" y2="' + (60 - Math.cos(ma) * 42).toFixed(1) + '" stroke="#e0483a" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="60" r="4" fill="#223"/>';
    return svg(120, 120, s);
  }
  // 棒グラフ
  function barChart(labels, vals, step, unit) {
    const max = Math.max(...vals), top = Math.ceil(max / step) * step, H = 120, W = 40 + labels.length * 44;
    let s = "";
    for (let v = 0; v <= top; v += step) { const y = 10 + H - (v / top) * H; s += '<line x1="34" x2="' + (W - 4) + '" y1="' + y + '" y2="' + y + '" stroke="#ccd" stroke-width="1"/><text x="30" y="' + (y + 4) + '" font-size="10" text-anchor="end" fill="#445">' + v + "</text>"; }
    labels.forEach((l, i) => { const h = (vals[i] / top) * H, x = 44 + i * 44; s += '<rect x="' + x + '" y="' + (10 + H - h) + '" width="24" height="' + h + '" fill="#5aa9e6"/><text x="' + (x + 12) + '" y="' + (H + 26) + '" font-size="11" text-anchor="middle" fill="#223">' + l + "</text>"; });
    s += '<text x="4" y="8" font-size="9" fill="#445">(' + unit + ")</text>";
    return svg(W, H + 34, s);
  }
  // 絵文字をならべる
  const row = (arr) => '<div class="qrow">' + arr.map((e) => "<span>" + e + "</span>").join("") + "</div>";
  HM.U = { R, L, pick, shuf, gcd, lcm, F, Fa, Fs, Fm, Fd, Fstr, Fmix, dec, comma, num, ch, near, svg, clock, barChart, row, rng: () => rng() };

  // 教科の登録
  HM.SUBJECTS = HM.SUBJECTS || {};
  HM.addUnits = (subj, grade, units) => { const s = (HM.SUBJECTS[subj] = HM.SUBJECTS[subj] || {}); s[grade] = (s[grade] || []).concat(units); };
  // 単元とステップ。step: [名前, 生成関数 or 問題バンク, 問題数]
  HM.unit = (n, steps) => ({ n, steps: steps.map(([sn, src, cnt]) => ({ n: sn, src, cnt })) });
  // 合格ライン（6割・切り上げ）
  HM.passNeed = (n) => Math.floor((n * 6 + 9) / 10);

  // 問題バンクの1行：「問題|正解|まちがい1|まちがい2|まちがい3|解説」
  function parseBankLine(line) {
    const p = line.split("|");
    if (p.length < 4) throw new Error("bank line too short: " + line);
    const ex = p.pop(), q = p[0], a = p[1], o = p.slice(2);
    return { t: "ch", q, a, o, ex };
  }
  HM.parseBankLine = parseBankLine;
  // 生成ステップに「固定の問題」を混ぜる（考え方の問題で、同じ問題のくり返しをへらす）
  HM.addExtra = function (subj, grade, unitName, stepName, lines) {
    const us = (HM.SUBJECTS[subj] || {})[grade] || [];
    const u = us.find((x) => x.n === unitName); const st = u && u.steps.find((x) => x.n === stepName);
    if (!st) throw new Error("addExtra: not found " + grade + " " + unitName + " / " + stepName);
    const pool = lines.map(parseBankLine), orig = st.src;
    st.extraN = pool.length;
    st.src = (d, i) => { if (rng() < pool.length / (pool.length + 3)) { const q = pool[Math.floor(rng() * pool.length)]; return Object.assign({ bank: 1 }, q, { o: q.o.slice() }); } return orig(d, i); };
  };
  // 問題バンクをまとめて登録：[単元名, [[ステップ名, "1行1問の文字列"], ...]]
  HM.bank = (subj, grade, cnt, units) => HM.addUnits(subj, grade, units.map(([un, steps]) => { const u = HM.unit(un, steps.map(([sn, txt, c]) => [sn, (Array.isArray(txt) ? txt : txt.split("\n")).map((x) => x.trim()).filter(Boolean), c || cnt])); steps.forEach((s, i) => { if (s[3]) u.steps[i].pass = s[3]; }); return u; }));
  // 1ステップ分の問題をつくる（易→難の順）
  HM.makeSet = function (step, seed) {
    const r0 = HM.mulberry(seed == null ? (Math.random() * 1e9) >>> 0 : seed);
    HM.setRng(r0);
    let out = [];
    if (typeof step.src === "function") {
      const n = step.cnt || 10, seen = new Set();
      for (let i = 0; i < n; i++) {
        const d = n > 1 ? i / (n - 1) : 1;
        let q = null;
        for (let t = 0; t < 60; t++) { const c = step.src(d, i); if (!c) continue; if (!seen.has(c.q + "|" + c.a)) { q = c; break; } }
        if (q) { seen.add(q.q + "|" + q.a); out.push(q); }
      }
    } else if (Array.isArray(step.src)) {
      const all = step.src.map((x) => (typeof x === "string" ? parseBankLine(x) : x));
      const n = Math.min(step.cnt || 6, all.length);
      // 順番（易→難）を保ったまま n 問えらぶ
      const idx = HM.U.shuf(all.map((_, i) => i)).slice(0, n).sort((a, b) => a - b);
      out = idx.map((i) => Object.assign({}, all[i]));
    }
    out.forEach((q) => { if (q.t === "ch") q.opts = HM.U.shuf([q.a].concat(q.o)); if (step.pass && !q.pass) q.pass = step.pass; });
    HM.setRng(Math.random);
    return out;
  };
})(typeof window !== "undefined" ? window : globalThis);
