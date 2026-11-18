/* ほしまなび — 表から問題を作る部品。表は読みこみ時に「重複がないか」を検査し、重複があれば読みこみを止める（あいまいな問題を出さないため） */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U;
  const { pick, shuf, ch } = U;
  const rows = (txt) => (Array.isArray(txt) ? txt : txt.split("\n")).map((l) => l.trim()).filter(Boolean).map((l) => l.split("|").map((x) => x.trim()));
  function uniq(name, list, col) { const s = new Set(); list.forEach((r) => { if (s.has(r[col])) throw new Error("表の重複 " + name + ": " + r[col]); s.add(r[col]); }); }
  // 対応表：[A, B, 解説]。fwd(A)→Bを問う、back(B)→Aを問う。A も B も表の中で一意。
  HM.pairs = function (name, txt, o) {
    const R = rows(txt); uniq(name, R, 0); uniq(name, R, 1);
    if (R.length < 4) throw new Error("表が短い " + name);
    const dirs = o.back ? (o.fwd ? [0, 1] : [1]) : [0];
    const fn = (d) => {
      const r = pick(R), dir = pick(dirs);
      const ex = r[2] || (o.ex ? o.ex(r[0], r[1]) : "「" + r[0] + "」は「" + r[1] + "」。");
      if (dir === 0) return ch(o.fwd(r[0], r[1]), r[1], shuf(R.filter((x) => x !== r)).map((x) => x[1]), ex, o.opt);
      return ch(o.back(r[1], r[0]), r[0], shuf(R.filter((x) => x !== r)).map((x) => x[0]), ex, o.opt);
    };
    fn.table = { kind: "pairs", name, rows: R, o };
    return fn;
  };
  // 分類表：{ラベル: [項目...]}。「次のうち〈ラベル〉はどれ？」または「〈項目〉はどれに入る？」
  HM.groups = function (name, obj, o) {
    const labels = Object.keys(obj), all = new Set();
    labels.forEach((l) => { obj[l] = obj[l].split(/[、,]/).map((x) => x.trim()).filter(Boolean); obj[l].forEach((it) => { if (all.has(it)) throw new Error("分類の重複 " + name + ": " + it); all.add(it); }); });
    const fn = (d) => {
      const l = pick(labels.filter((x) => obj[x].length)), it = pick(obj[l]);
      if (o.toLabel && (!o.which || U.rng() < 0.5)) return ch(o.toLabel(it), l, shuf(labels.filter((x) => x !== l)), o.ex(it, l), o.opt);
      const others = shuf(labels.filter((x) => x !== l && !(o.not || []).includes(x + ">" + l))).flatMap((x) => obj[x]);
      return ch(o.which(l), it, shuf(others), o.ex(it, l), o.opt);
    };
    fn.table = { kind: "groups", name, obj, o };
    return fn;
  };
  // いくつかの作り方をまぜる
  HM.mix = (...fs) => { const f = (d, i) => pick(fs)(d, i); f.parts = fs; return f; };
  // 単元を足す（同じ名前の単元があればステップを後ろに足す）
  HM.addGen = function (subj, grade, unitName, steps, at) {
    const list = ((HM.SUBJECTS[subj] = HM.SUBJECTS[subj] || {})[grade] = HM.SUBJECTS[subj][grade] || []);
    const nu = HM.unit(unitName, steps.map(([n, f, c]) => [n, f, c || 10]));
    const u = list.find((x) => x.n === unitName);
    if (u) u.steps.push(...nu.steps); else if (at != null) list.splice(at, 0, nu); else list.push(nu);
  };
  // 問題バンクの単元すべての行をまぜた「まとめ」ステップを作る（7分ぶん＝10問）
  HM.addReviews = function () {
    for (const [s, gs] of Object.entries(HM.SUBJECTS)) {
      if (s === "math") continue;
      for (const us of Object.values(gs)) for (const u of us) {
        if (u.steps.some((st) => st.review)) continue;
        u.steps.forEach((st) => { if (Array.isArray(st.src) && !st.pass) st.cnt = Math.min(10, st.src.length); });
        const lines = [], passes = [];
        u.steps.forEach((st) => { if (Array.isArray(st.src) && !st.pass) lines.push(...st.src); });
        if (lines.length >= 12) u.steps.push({ n: "まとめテスト（ランダム）", src: lines.slice(), cnt: 10, review: true, shuffle: true });
      }
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
