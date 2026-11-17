/* ほしまなび — v1.2 いろいろな問題形式（並べかえ・線でつなぐ・カード合わせ・図をタップ・図つき問題）。すべてオリジナル */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, { R, pick, shuf, num, ch, svg, gcd } = U;
  const A = HM.addGen;
  const F = (HM.F = HM.F || {});
  F.ord = (q, items, ex, opt = {}) => Object.assign({ t: "ord", q, items: items.map(String), a: items.map(String).join(" → "), ex }, opt);
  F.match = (q, pairs, ex, opt = {}) => Object.assign({ t: "match", q, pairs: pairs.map((p) => [String(p[0]), String(p[1])]), a: pairs.map((p) => p[0] + "－" + p[1]).join("、"), ex }, opt);
  F.pair = (q, pairs, ex, opt = {}) => Object.assign(F.match(q, pairs, ex, opt), { t: "pair" });
  F.tap = (q, fig, hits, ans, ex, opt = {}) => Object.assign({ t: "tap", q, svg: fig, hits, ans, a: hits.find((h) => h[0] === ans)[1], ex }, opt);
  const distinct = (n, gen, key = (x) => x) => { const out = [], seen = new Set(); for (let k = 0; k < 400 && out.length < n; k++) { const v = gen(); const kk = key(v); if (!seen.has(kk)) { seen.add(kk); out.push(v); } } return out; };
  const fig = (w, h, inner) => svg(w, h, inner, "qfig");

  // ================= 算数・数学 =================
  // 小1 数の大小（並べかえ）
  const m1ord = (d) => { const hi = d < 0.5 ? 20 : 100; const ns = distinct(4, () => R(0, hi)); const asc = R(0, 1) === 1; const s = ns.slice().sort((a, b) => (asc ? a - b : b - a)); return F.ord((asc ? "小さい" : "大きい") + "じゅんに ならべよう", s, (asc ? "小さい" : "大きい") + "じゅんに ならべると " + s.join("、") + "。十のくらいが ちがう ときは 十のくらいで、同じ ときは 一のくらいで くらべる。", { vals: s, dir: asc ? "asc" : "desc" }); };
  // 小1 たし算カード合わせ
  const m1pair = (d) => { const ps = distinct(3, () => { const a = R(1, 9), b = R(1, Math.min(9, d < 0.5 ? 10 - a : 9)); return [a, b]; }, (p) => p[0] + p[1]); return F.pair("こたえが おなじに なる カードを 2まいずつ あわせよう", ps.map(([a, b]) => [a + "＋" + b, String(a + b)]), ps.map(([a, b]) => a + "＋" + b + "＝" + (a + b)).join("、") + "。", { pchk: ps.map(([a, b]) => a + "+" + b) }); };
  // 小2 九九（線でつなぐ）
  const m2match = (d) => { const ps = distinct(4, () => [R(2, 9), R(2, 9)], (p) => p[0] * p[1]); return F.match("九九の しきと こたえを 線で つなごう", ps.map(([a, b]) => [a + "×" + b, String(a * b)]), ps.map(([a, b]) => a + "×" + b + "＝" + a * b).join("、") + "。", { pchk: ps.map(([a, b]) => a + "*" + b) }); };
  // 小2 長さの並べかえ
  const lenFmt = (mm) => { const m = Math.floor(mm / 1000), cm = Math.floor((mm % 1000) / 10), r = mm % 10; if (r) return mm >= 10 ? (Math.floor(mm / 10) ? Math.floor(mm / 10) + "cm" : "") + r + "mm" : r + "mm"; if (m && cm) return m + "m" + cm + "cm"; if (m) return m + "m"; return cm + "cm"; };
  const m2ord = (d) => { const vs = distinct(4, () => pick([R(1, 9) * 10 + (d > 0.4 ? R(1, 9) : 0), R(5, 99) * 10, R(100, 199) * 10, 1000 * R(1, 2), 1000 + R(1, 9) * 100, R(1, 9)])); const s = vs.slice().sort((a, b) => a - b); return F.ord("みじかい じゅんに ならべよう", s.map(lenFmt), "1m＝100cm、1cm＝10mm。ぜんぶ mm に そろえると " + s.map((v) => lenFmt(v) + "＝" + v + "mm").join("、") + "。", { vals: s, dir: "asc" }); };
  // 小3 分数の図
  const pie = (n, k, col = "#5aa9e6") => { let s = ""; for (let i = 0; i < n; i++) { const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2; s += '<path d="M60 60 L' + (60 + 50 * Math.cos(a0)).toFixed(2) + " " + (60 + 50 * Math.sin(a0)).toFixed(2) + " A50 50 0 " + (a1 - a0 > Math.PI ? 1 : 0) + " 1 " + (60 + 50 * Math.cos(a1)).toFixed(2) + " " + (60 + 50 * Math.sin(a1)).toFixed(2) + ' Z" fill="' + (i < k ? col : "#fff") + '" stroke="#334" stroke-width="2"/>'; } return fig(120, 120, s); };
  const barFr = (n, k) => { let s = ""; for (let i = 0; i < n; i++) s += '<rect x="' + (10 + (i * 220) / n).toFixed(1) + '" y="10" width="' + (220 / n).toFixed(1) + '" height="40" fill="' + (i < k ? "#ff922b" : "#fff") + '" stroke="#334" stroke-width="2"/>'; return fig(240, 60, s); };
  const m3frac = (d) => { let n, k; do { n = R(3, d < 0.5 ? 6 : 10); k = R(1, n - 1); } while (gcd(n, k) !== 1); const pic = R(0, 1) ? pie(n, k) : barFr(n, k); return num("色をぬったところは、全体の何分の何？（分数で答えよう）" + pic, k + "/" + n, "全体を同じ大きさに " + n + " こに分けた（分母 " + n + "）うちの " + k + " こ分（分子 " + k + "）なので " + k + "/" + n + "。", { chk: k + "/" + n, frac: true }); };
  // 小4 角の大きさ（図）
  const angleFig = (deg) => { const r = 70, a = (deg * Math.PI) / 180; const x2 = 30 + r * Math.cos(a), y2 = 100 - r * Math.sin(a); const arc = '<path d="M' + (30 + 22) + " 100 A22 22 0 " + (deg > 180 ? 1 : 0) + " 0 " + (30 + 22 * Math.cos(a)).toFixed(1) + " " + (100 - 22 * Math.sin(a)).toFixed(1) + '" fill="none" stroke="#e8590c" stroke-width="3"/>'; return fig(180, 110, '<line x1="30" y1="100" x2="170" y2="100" stroke="#223" stroke-width="3"/><line x1="30" y1="100" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#223" stroke-width="3"/>' + arc + (deg === 90 ? '<rect x="30" y="86" width="14" height="14" fill="none" stroke="#e8590c" stroke-width="2"/>' : "")); };
  const m4angle = (d) => { const deg = pick([30, 45, 90, 120, 135, 150, 60, 180]); const wr = [30, 45, 60, 90, 120, 135, 150, 180].filter((x) => Math.abs(x - deg) >= 30); return ch("図の角の大きさは何度？（だいたいの形で考えよう）" + angleFig(deg), deg + "°", shuf(wr).map((x) => x + "°"), "直角は90°、一直線は180°。図の角は " + (deg < 90 ? "直角より小さく" : deg === 90 ? "ちょうど直角で" : deg === 180 ? "一直線で" : "直角より大きく") + " " + deg + "°。"); };
  const m4ord = (d) => { const vs = distinct(4, () => R(1, 99) * 10000 * (R(0, 1) ? 1 : 100) + R(0, 9) * 1000); const s = vs.slice().sort((a, b) => a - b); const fmt = (v) => { const oku = Math.floor(v / 1e8), man = Math.floor((v % 1e8) / 1e4), r = v % 1e4; return (oku ? oku + "億" : "") + (man ? man + "万" : "") + (r ? r : ""); }; return F.ord("小さい順にならべよう", s.map(fmt), "けた数（億・万）を先にくらべる。" + s.map(fmt).join(" ＜ ") + "。", { vals: s, dir: "asc" }); };
  // 小5 小数と分数の大小
  const m5ord = (d) => { const items = distinct(4, () => { if (R(0, 1)) { const den = pick([2, 4, 5, 8, 10]); const nu = R(1, den * 2 - 1); const g = gcd(nu, den); return [nu / g + "/" + den / g, nu / den]; } const v = R(1, 19) / 10 + (R(0, 1) ? R(1, 9) / 100 : 0); return [String(Math.round(v * 100) / 100), Math.round(v * 100) / 100]; }, (x) => x[1]); const s = items.slice().sort((a, b) => a[1] - b[1]); return F.ord("小さい順にならべよう", s.map((x) => x[0]), "分数は小数になおしてくらべる。" + s.map((x) => x[0] + (x[0].includes("/") ? "＝" + x[1] : "")).join(" ＜ ") + "。", { vals: s.map((x) => x[1]), valExpr: s.map((x) => x[0]), dir: "asc" }); };
  const triFig = (b, h, off) => { const sc = Math.min(18, 170 / Math.max(b, 1), 90 / h); const x0 = 20, y0 = 115, bx = b * sc, hy = h * sc, px = x0 + off * bx; return fig(220, 135, '<polygon points="' + x0 + "," + y0 + " " + (x0 + bx).toFixed(1) + "," + y0 + " " + px.toFixed(1) + "," + (y0 - hy).toFixed(1) + '" fill="#d0ebff" stroke="#1c7ed6" stroke-width="3"/><line x1="' + px.toFixed(1) + '" y1="' + (y0 - hy).toFixed(1) + '" x2="' + px.toFixed(1) + '" y2="' + y0 + '" stroke="#e8590c" stroke-width="2" stroke-dasharray="5 4"/><text x="' + (x0 + bx / 2).toFixed(1) + '" y="' + (y0 + 16) + '" font-size="13" text-anchor="middle" fill="#223">' + b + 'cm</text><text x="' + (px + 6).toFixed(1) + '" y="' + (y0 - hy / 2).toFixed(1) + '" font-size="13" fill="#e8590c">' + h + "cm</text>"); };
  const m5tri = (d) => { const b = R(2, 12), h = R(2, 9) * (b % 2 ? 2 : 1); const area = (b * h) / 2; return num("三角形の面積は何cm²？" + triFig(b, h, pick([0.3, 0.5, 0.7])), area, "三角形の面積＝底辺×高さ÷2＝" + b + "×" + h + "÷2＝" + area + "cm²。高さは底辺に垂直な長さ（点線）。", { chk: b + "*" + h + "/2", unit: "cm²" }); };
  // 小6 分数×整数のカード合わせ
  const m6pair = (d) => { const ps = distinct(3, () => { const den = R(2, 9), nu = R(1, den - 1), k = R(2, 6); return [nu, den, k]; }, (p) => (p[0] * p[2]) / p[1]); const res = (nu, den, k) => { const g = gcd(nu * k, den); const a = (nu * k) / g, b = den / g; return b === 1 ? String(a) : a + "/" + b; }; return F.pair("計算の式と答えが同じになるカードを合わせよう", ps.map(([nu, den, k]) => [nu + "/" + den + "×" + k, res(nu, den, k)]), ps.map(([nu, den, k]) => nu + "/" + den + "×" + k + "＝" + res(nu, den, k)).join("、") + "。分数×整数は分子に整数をかけて約分する。", { pchk: ps.map(([nu, den, k]) => nu + "/" + den + "*" + k) }); };
  // 中1 正負の数の並べかえ・座標
  const m7ord = (d) => { const vs = distinct(4, () => (R(0, 3) ? R(-9, 9) : R(-95, 95) / 10)); const asc = R(0, 1) === 1; const s = vs.slice().sort((a, b) => (asc ? a - b : b - a)); const f = (v) => (v > 0 ? "+" + v : String(v)); return F.ord((asc ? "小さい" : "大きい") + "順にならべよう", s.map(f), "負の数は絶対値が大きいほど小さい。数直線で左にあるほど小さい。" + s.map(f).join(asc ? " ＜ " : " ＞ ") + "。", { vals: s, dir: asc ? "asc" : "desc" }); };
  const grid = (inner) => { let s = ""; for (let i = -5; i <= 5; i++) { const x = 110 + i * 18; s += '<line x1="' + x + '" y1="20" x2="' + x + '" y2="200" stroke="' + (i ? "#dee2e6" : "#223") + '" stroke-width="' + (i ? 1 : 2) + '"/><line x1="20" y1="' + (110 - i * 18) + '" x2="200" y2="' + (110 - i * 18) + '" stroke="' + (i ? "#dee2e6" : "#223") + '" stroke-width="' + (i ? 1 : 2) + '"/>'; } s += '<text x="204" y="114" font-size="11">x</text><text x="113" y="16" font-size="11">y</text><text x="100" y="124" font-size="10">O</text>'; return fig(220, 220, s + inner); };
  const m7tap = (d) => { const pts = distinct(4, () => [R(-5, 5), R(-5, 5)], (p) => p.join()).filter(Boolean); const L = ["A", "B", "C", "D"]; const tgt = R(0, 3); const inner = pts.map((p, i) => '<g data-hit="' + L[i] + '"><circle cx="' + (110 + p[0] * 18) + '" cy="' + (110 - p[1] * 18) + '" r="13" fill="rgba(91,76,224,.12)"/><circle cx="' + (110 + p[0] * 18) + '" cy="' + (110 - p[1] * 18) + '" r="5" fill="#5b4ce0"/><text x="' + (110 + p[0] * 18 + 7) + '" y="' + (110 - p[1] * 18 - 7) + '" font-size="12" font-weight="700" fill="#5b4ce0">' + L[i] + "</text></g>").join(""); const [x, y] = pts[tgt]; return F.tap("座標が (" + x + ", " + y + ") の点はどれ？ 図の点をタップしよう", grid(inner), L.map((l) => [l, "点" + l]), L[tgt], "x座標は横（右が＋）、y座標はたて（上が＋）。(" + x + ", " + y + ") は原点から右に " + x + "、上に " + y + " 進んだ点" + L[tgt] + "。"); };
  // 中2 1次関数のグラフ
  const m8graph = (d) => { const a = pick([-3, -2, -1, 1, 2, 3, 0.5, -0.5]), b = R(-3, 3); const f = (x) => a * x + b; const x1 = -5, x2 = 5; const line = '<line x1="' + (110 + x1 * 18) + '" y1="' + (110 - f(x1) * 18) + '" x2="' + (110 + x2 * 18) + '" y2="' + (110 - f(x2) * 18) + '" stroke="#e8590c" stroke-width="3"/>'; const clip = '<clipPath id="cp8"><rect x="20" y="20" width="180" height="180"/></clipPath>'; const fx = (A2, B2) => "y＝" + (A2 === 1 ? "" : A2 === -1 ? "−" : A2 === 0.5 ? "1/2" : A2 === -0.5 ? "−1/2" : String(A2).replace("-", "−")) + "x" + (B2 > 0 ? "＋" + B2 : B2 < 0 ? "−" + -B2 : ""); const right = fx(a, b); const wr = [fx(-a, b), fx(a, -b || b + 1), fx(a === 1 ? 2 : 1, b), fx(a, b + (b < 3 ? 1 : -1))].filter((x) => x !== right); return ch("このグラフの式はどれ？" + grid(clip + '<g clip-path="url(#cp8)">' + line + "</g>"), right, wr, "切片（x＝0 のときの y）は " + b + "。x が1ふえると y は " + a + " ふえる（かたむき " + a + "）。だから " + right + "。"); };
  // 中3 平方根の並べかえ
  const m9ord = (d) => { const items = distinct(4, () => { if (R(0, 2)) { let n; do { n = R(2, 30); } while (Number.isInteger(Math.sqrt(n))); return ["√" + n, Math.sqrt(n)]; } const v = R(1, 5) + (R(0, 1) ? 0.5 : 0); return [String(v), v]; }, (x) => x[1]); const s = items.slice().sort((a, b) => a[1] - b[1]); return F.ord("小さい順にならべよう", s.map((x) => x[0]), "2乗してくらべる。" + s.map((x) => x[0] + "²＝" + Math.round(x[1] * x[1] * 100) / 100).join("、") + "。2乗が小さいほど小さい。", { vals: s.map((x) => x[1]), dir: "asc" }); };
  A("math", 1, "かずとすうじ（10まで）", [["ならべかえ チャレンジ", m1ord, 8]]);
  A("math", 1, "たしざん", [["カードあわせ", m1pair, 6]]);
  A("math", 2, "かけ算", [["九九を線でつなごう", m2match, 6]]);
  A("math", 2, "長さ（cm・mm・m）", [["長さのならべかえ", m2ord, 8]]);
  A("math", 3, "分数", [["図で分数", m3frac, 8]]);
  A("math", 4, "角の大きさ", [["図を見て角度", m4angle, 8]]);
  A("math", 4, "億・兆", [["大きな数のならべかえ", m4ord, 8]]);
  A("math", 5, "分数の大きさ", [["小数と分数のならべかえ", m5ord, 8]]);
  A("math", 5, "面積", [["図で三角形の面積", m5tri, 8]]);
  A("math", 6, "分数×整数・÷整数", [["カード合わせ", m6pair, 6]]);
  A("math", 7, "正負の数", [["数の大小ならべかえ", m7ord, 8]]);
  A("math", 7, "比例と反比例", [["座標の点をタップ", m7tap, 8]]);
  A("math", 8, "1次関数", [["グラフから式を読む", m8graph, 8]]);
  A("math", 9, "平方根", [["平方根のならべかえ", m9ord, 8]]);

  // ================= 国語 =================
  const KANA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん".split("");
  const j1ord = (d) => { const idx = distinct(4, () => R(0, KANA.length - 1)).sort((a, b) => a - b); return F.ord("あいうえお じゅんに ならべよう", idx.map((i) => KANA[i]), "ごじゅうおんの じゅんばんは「あかさたな はまやらわ」。" + idx.map((i) => KANA[i]).join(" → ") + "。", { vals: idx, dir: "asc" }); };
  const kjPair = (g) => (d) => { const T = HM.JA.KJT[g]; const ps = distinct(3, () => pick(T), (x) => x[1]); const okK = new Set(ps.map((p) => p[0])); if (okK.size < 3) return null; return F.pair("漢字と読みが合うカードを合わせよう", ps.map((p) => [p[0], p[1]]), ps.map((p) => p[0] + "（" + p[1] + "）").join("、") + "。", { kjpair: 1 }); };
  A("ja", 1, "ことばのきまり", [["ごじゅうおん ならべかえ", j1ord, 8]]);
  for (let g = 2; g <= 9; g++) A("ja", g, g <= 2 ? "かん字" : "漢字", [["読みのカード合わせ", kjPair(g), 6]]);

  // ================= 英語 =================
  const EMO = { dog: "🐶", cat: "🐱", rabbit: "🐰", bird: "🐦", fish: "🐟", bear: "🐻", lion: "🦁", monkey: "🐵", elephant: "🐘", panda: "🐼", tiger: "🐯", horse: "🐴", cow: "🐮", pig: "🐷", mouse: "🐭", apple: "🍎", banana: "🍌", grapes: "🍇", strawberry: "🍓", peach: "🍑", melon: "🍈", lemon: "🍋", cherry: "🍒", watermelon: "🍉", pineapple: "🍍" };
  F.EMO = EMO;
  const COLHEX = { red: "#e03131", blue: "#1c7ed6", yellow: "#fcc419", green: "#2f9e44", white: "#ffffff", black: "#212529", pink: "#f783ac", purple: "#9c36b5", brown: "#8d5a3b", orange: "#fd7e14" };
  F.COLHEX = COLHEX;
  const e3match = (d) => { const pool = Object.keys(EMO).filter((w) => (d < 0.5 ? HM.EN.VT.animal : HM.EN.VT.fruit).some((x) => x[0] === w)); const ws = shuf(pool).slice(0, 4); return F.match("絵と英語を線でつなごう", ws.map((w) => [EMO[w], w]), ws.map((w) => EMO[w] + "＝" + w).join("、") + "。", { en: 1 }); };
  const e3color = (d) => { const ws = shuf(Object.keys(COLHEX)).slice(0, 4); const tgt = R(0, 3); const s = ws.map((w, i) => '<rect data-hit="' + w + '" x="' + (10 + i * 62) + '" y="10" width="54" height="54" rx="12" fill="' + COLHEX[w] + '" stroke="#adb5bd" stroke-width="2"/>').join(""); return F.tap("「" + ws[tgt] + "」の色をタップしよう", fig(260, 74, s), ws.map((w) => [w, w]), ws[tgt], ws[tgt] + " は「" + HM.EN.VT.color.find((x) => x[0] === ws[tgt])[1] + "」。", { say: ws[tgt] }); };
  const DAYS = HM.EN.VT.day.map((x) => x[0]), MON = HM.EN.VT.month.map((x) => x[0]);
  const e4ord = (d) => { const L2 = d < 0.5 ? DAYS : MON; const st = R(0, L2.length - 4); const s = L2.slice(st, st + 4); return F.ord((L2 === DAYS ? "曜日" : "月") + "の順にならべよう", s, s.map((w) => w + "（" + (L2 === DAYS ? HM.EN.VT.day : HM.EN.VT.month).find((x) => x[0] === w)[1] + "）").join(" → ") + "。", { vals: s.map((w) => L2.indexOf(w)), dir: "asc", en: 1 }); };
  const ePair = (cats) => (d) => { const c = pick(cats), ws = shuf(HM.EN.VT[c]).slice(0, 3); return F.pair("英語と意味が合うカードを合わせよう", ws.map((w) => [w[0], w[1]]), ws.map((w) => w[0] + "＝" + w[1]).join("、") + "。", { en: 1 }); };
  // 英文の並べかえ（語順がひとつに決まる文だけ）
  const SENT = {
    6: ["I like soccer.|わたしはサッカーが好きです。", "I want to be a doctor.|わたしは医者になりたいです。", "I went to the park.|わたしは公園へ行きました。", "My hero is my father.|わたしのヒーローは父です。", "We have a sports day.|わたしたちには運動会があります。", "I can play the piano.|わたしはピアノをひけます。", "What do you want to be?|あなたは何になりたいですか。", "I enjoyed fishing.|わたしはつりを楽しみました。", "Where do you want to go?|あなたはどこへ行きたいですか。", "I ate curry and rice.|わたしはカレーライスを食べました。"],
    7: ["I am a junior high school student.|わたしは中学生です。", "Do you play tennis?|あなたはテニスをしますか。", "She likes music very much.|彼女は音楽がとても好きです。", "He is reading a book now.|彼は今、本を読んでいます。", "I visited Kyoto last summer.|わたしは去年の夏に京都を訪れました。", "What time do you get up?|あなたは何時に起きますか。", "My brother does not eat fish.|わたしの兄は魚を食べません。", "Where is my bag?|わたしのかばんはどこですか。", "Can you swim fast?|あなたは速く泳げますか。", "They were in the gym yesterday.|彼らは昨日体育館にいました。"],
    8: ["I will visit my uncle tomorrow.|わたしは明日おじを訪ねるつもりです。", "This bag is bigger than that one.|このかばんはあのかばんより大きいです。", "I have to clean my room.|わたしは自分の部屋をそうじしなければなりません。", "She is the tallest in her class.|彼女はクラスでいちばん背が高いです。", "I like playing the guitar.|わたしはギターをひくことが好きです。", "He went to the library to study.|彼は勉強するために図書館へ行きました。", "There are two parks in my town.|わたしの町には公園が2つあります。", "I was watching TV at nine.|わたしは9時にテレビを見ていました。", "This song is loved by many people.|この歌は多くの人に愛されています。", "Please show me your notebook.|あなたのノートをわたしに見せてください。"],
    9: ["I have lived here for ten years.|わたしは10年間ここに住んでいます。", "Have you ever been to Okinawa?|あなたは沖縄に行ったことがありますか。", "The girl playing tennis is my sister.|テニスをしている女の子はわたしの姉です。", "This is a picture taken by my father.|これは父がとった写真です。", "I know the boy who lives next door.|わたしはとなりに住む男の子を知っています。", "It is important to save water.|水を節約することは大切です。", "I wish I could fly.|飛べたらいいのになあ。", "He has just finished his homework.|彼はちょうど宿題を終えたところです。", "Do you know where he lives?|あなたは彼がどこに住んでいるか知っていますか。", "My teacher told me to read this book.|先生はわたしにこの本を読むように言いました。"],
  };
  const eSent = (g) => (d) => { const [en, ja] = pick(SENT[g]).split("|"); const m = en.match(/^(.*?)([.?!])$/); const words = m[1].split(" "); if (new Set(words.map((w) => w.toLowerCase())).size !== words.length) return null; return F.ord("「" + ja + "」になるように英語をならべよう（最後に「" + m[2] + "」がつくよ）", words, en + "（" + ja + "）", { en: 1, say: en }); };
  A("en", 3, "いろいろな単語", [["絵と英語をつなごう", e3match, 6], ["色をタップ", e3color, 8]]);
  A("en", 4, "いろいろな単語", [["曜日・月のならべかえ", e4ord, 8]]);
  A("en", 5, "単語（表）", [["カード合わせ", ePair(["place", "job", "subject"]), 6]]);
  A("en", 6, "文の形", [["英文のならべかえ", eSent(6), 8]]);
  A("en", 6, "単語（表）", [["カード合わせ", ePair(["verb", "adj", "place"]), 6]]);
  for (const g of [7, 8, 9]) A("en", g, "文法いろいろ", [["英文のならべかえ", eSent(g), 8]]);
  // ---- 聞きとり（🔊ボタンで読み上げ。読み上げできない端末では英語の文字を表示） ----
  const lMean = (cats) => (d) => { const c = pick(cats), [e, j] = pick(HM.EN.VT[c]); return ch("🎧 聞こえた英語の意味はどれ？", j, shuf(HM.EN.VT[c].filter((w) => w[1] !== j)).map((w) => w[1]), "聞こえたのは「" + e + "」。意味は「" + j + "」。", { say: e, listen: 1 }); };
  const lWord = (cats) => (d) => { const c = pick(cats), [e, j] = pick(HM.EN.VT[c]); return ch("🎧 聞こえた英語はどれ？", e, shuf(HM.EN.VT[c].filter((w) => w[0] !== e)).map((w) => w[0]), "聞こえたのは「" + e + "」（" + j + "）。", { say: e, listen: 1, sayIsAnswer: 1 }); };
  const lNum = (hi) => (d) => { const n = R(1, Math.max(12, Math.round(hi * (0.3 + 0.7 * d)))); return num("🎧 聞こえた数を数字で入れよう", n, "聞こえたのは「" + HM.EN.word(n) + "」で " + n + "。", { chk: String(n), say: HM.EN.word(n), listen: 1 }); };
  A("en", 3, "いろいろな単語", [["聞きとり（単語）", lMean(["animal", "fruit", "color"]), 8]]);
  A("en", 3, "数", [["数の聞きとり", lNum(20), 8]]);
  A("en", 4, "いろいろな単語", [["聞きとり（単語）", lWord(["day", "weather", "shape", "body"]), 8]]);
  A("en", 4, "数", [["数の聞きとり", lNum(100), 8]]);
  A("en", 5, "単語", [["聞きとり（単語）", lMean(["month", "subject", "place"]), 8]]);
  A("en", 6, "単語", [["聞きとり（単語）", lWord(["job", "verb", "adj"]), 8]]);
  A("en", 7, "単語", [["聞きとり（単語）", lMean(["j1", "verb", "adj"]), 8]]);
  A("en", 8, "単語", [["聞きとり（単語）", lMean(["j2"]), 8]]);
  A("en", 9, "単語", [["聞きとり（単語）", lMean(["j3"]), 8]]);
})(typeof window !== "undefined" ? window : globalThis);
