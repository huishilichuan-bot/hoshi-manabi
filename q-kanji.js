// ほしまなび 国語：漢字の書き取り（どの学年も最初の単元）
// 学年の漢字を 8 字ずつ「書き順を見てなぞる → 自分で書く」の順に練習し、最後に「まとめ」で別のことばでも書く。
(function (root) {
  const HM = root.HM;
  if (!HM.KANJI) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const KG = {}; // 漢字 → 学年（どの字にふりがなをつけるかに使う）
  const ENT = {};
  for (const g in HM.KANJI) {
    ENT[g] = HM.KANJI[g].split("|").map((e) => {
      const [head, ws] = e.split("=");
      const k = head[0], sc = +head.slice(1);
      KG[k] = +g;
      return { k, sc, words: ws.split(";").map((w) => { const [t, r, i, f] = w.split("/"); return { t, r, i: +i, f: f.split(".").map((x) => x.split(":")) }; }) };
    });
  }
  HM.KANJI_ENT = ENT;
  const GN = (g) => (g <= 6 ? "小" + g : "中" + (g - 6));
  // ことばの表示：書く字は□（なぞりのときはうすく見せる）、上に読み。習っていない字にはふりがな
  function wordHtml(w, g, mode) {
    return '<span class="kjq">' + w.f.map(([ru, rt], j) => {
      if (j === w.i) return "<ruby>" + (mode === "trace" ? '<span class="kj-box tr">' + esc(ru) + "</span>" : '<span class="kj-box"></span>') + "<rt>" + esc(rt) + "</rt></ruby>";
      if (/[\u4e00-\u9fff]/.test(ru) && rt && (KG[ru] || 99) > g) return "<ruby>" + esc(ru) + "<rt>" + esc(rt) + "</rt></ruby>";
      return esc(ru);
    }).join("") + "</span>";
  }
  function mk(e, w, g, mode) {
    const sub = mode === "trace" ? "書き順を見てから、なぞってみよう" : "□に入る漢字を書こう";
    return { t: "kanji", mode, g, a: e.k, kj: e.k, sc: e.sc, q: wordHtml(w, g, mode) + '<span class="kj-sub">' + sub + "（" + e.sc + "画）</span>", ex: "「" + w.t + "（" + w.r + "）」の「" + e.k + "」は " + e.sc + " 画。「✍️ 書き順」でいつでもお手本が見られるよ。" };
  }
  const CH = 8, PER_UNIT = 40;
  for (const g in ENT) {
    const list = ENT[g], units = [];
    // 単元の大きさをそろえる（最後の単元が少なすぎないように）
    const nU = Math.ceil(list.length / PER_UNIT), SZ = Math.ceil(list.length / nU);
    for (let u0 = 0, un = 1; u0 < list.length; u0 += SZ, un++) {
      const part = list.slice(u0, u0 + SZ), steps = [];
      for (let c0 = 0, cn = 1; c0 < part.length; c0 += CH, cn++) {
        const ch = part.slice(c0, c0 + CH), lab = ch.map((e) => e.k).join("");
        steps.push(["なぞる「" + lab + "」", ch.map((e) => mk(e, e.words[0], +g, "trace")), ch.length]);
        const st = ["書く「" + lab + "」", ch.map((e) => mk(e, e.words[0], +g, "write")), ch.length];
        steps.push(st);
      }
      // まとめ：ほかのことばでも書く（同じ字が続かないように）
      const pool = []; part.forEach((e) => e.words.forEach((w, wi) => pool.push([e, w, wi])));
      steps.push(["まとめ（ほかのことばで）", (d) => { const sel = pool.filter((p) => (d < 0.5 ? p[2] === 0 : p[2] > 0) || pool.length < 12); const p = sel[Math.floor(HM.U.rng() * sel.length)] || pool[0]; return mk(p[0], p[1], +g, "write"); }, 10]);
      const n = Math.ceil(list.length / PER_UNIT) > 1 ? "漢字を書こう " + "①②③④⑤⑥⑦⑧⑨⑩"[un - 1] : "漢字を書こう";
      const unit = HM.unit(n, steps); unit.kanji = true;
      unit.steps.forEach((s) => { if (/^書く/.test(s.n)) s.shuffle = true; });
      units.push(unit);
    }
    const subj = (HM.SUBJECTS.ja = HM.SUBJECTS.ja || {});
    subj[g] = units.concat(subj[g] || []);
  }
})(typeof window !== "undefined" ? window : globalThis);
