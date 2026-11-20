/* ほしまなび — v1.5 理科の図の問題（「この図をなんという？」・回路・磁石・てこ・月・天気記号・前線・地層・反射・ばね・遺伝など）
   図は答えと同じ条件からかく。数の答えには検算式（chk）をつける。 */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, FG = HM.FIG, { R, pick, shuf, num, ch } = U;
  const { fig, T, L, PG, COL, f1 } = FG;
  const { tf, multi } = HM.V15;
  const A = (g, un, steps) => HM.addGen("sci", g, un, steps.map(([n, f, c]) => [n, f, c || 8]));
  const C = (x, y, r, o = {}) => '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="' + (o.fill || "none") + '" stroke="' + (o.color || COL.line) + '" stroke-width="' + (o.w || 2.5) + '"/>';
  const P = (d, o = {}) => '<path d="' + d + '" fill="' + (o.fill || "none") + '" stroke="' + (o.color || COL.line) + '" stroke-width="' + (o.w || 2.5) + '" stroke-linejoin="round" stroke-linecap="round"/>';
  const RC = (x, y, w, h, o = {}) => '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" rx="' + (o.rx || 0) + '" fill="' + (o.fill || "none") + '" stroke="' + (o.color || COL.line) + '" stroke-width="' + (o.w || 2.5) + '"/>';
  const lab = (x, y, t) => C(x, y, 11, { fill: "#fff", color: COL.red, w: 2 }) + T(x, y + 1, t, { size: 13, color: COL.red, bold: true });
  const ask = (q, svg) => q + svg;

  // ===== 小3 =====
  // こん虫の体（頭・むね・はら、あしは むねから6本）
  const insectSvg = (mark) => { let s = '<ellipse cx="60" cy="80" rx="18" ry="16" fill="#ffe8cc" stroke="#2b2d42" stroke-width="2.5"/><ellipse cx="105" cy="80" rx="24" ry="19" fill="#ffd8a8" stroke="#2b2d42" stroke-width="2.5"/><ellipse cx="168" cy="80" rx="40" ry="24" fill="#ffc078" stroke="#2b2d42" stroke-width="2.5"/>';
    s += P("M50 66 Q40 40 28 36") + P("M60 64 Q58 40 50 30"); [92, 105, 118].forEach((x, i) => { s += P("M" + x + " 96 L" + (x - 14 + i * 12) + " 122 L" + (x - 22 + i * 16) + " 140"); s += P("M" + x + " 64 L" + (x - 14 + i * 12) + " 38 L" + (x - 22 + i * 16) + " 22"); });
    for (let i = 0; i < 4; i++) s += L([150 + i * 12, 60], [150 + i * 12, 100], { w: 1, color: "#e8590c" });
    s += C(52, 76, 3, { fill: "#2b2d42", w: 1 });
    const pos = { "頭": [60, 80], "むね": [105, 80], "はら": [168, 80] }; s += lab(pos[mark][0], pos[mark][1] - 34, "あ") + L([pos[mark][0], pos[mark][1] - 23], [pos[mark][0], pos[mark][1] - 6], { color: COL.red, w: 1.5 });
    return fig(220, 150, s); };
  const insectPart = () => { const m = pick(["頭", "むね", "はら"]); return ch(ask("こん虫の体で、「あ」の部分を何という？", insectSvg(m)), m, ["頭", "むね", "はら", "しょっ角"].filter((x) => x !== m).slice(0, 3), "こん虫の体は 頭・むね・はら の3つに分かれ、あしは むね に6本ついている。「あ」は" + m + "。"); };
  const legsWhere = () => pick([ch(ask("この こん虫の あしは、体のどこから出ている？", insectSvg("むね")), "むね", ["頭", "はら", "体ぜんぶ"], "こん虫のあしは6本で、すべて むね から出ている。"), num(ask("こん虫の あしは 何本？", insectSvg("むね")), 6, "こん虫のあしは むね から6本。", { unit: "本", chk: "6" })]);
  const spiderSvg = () => { let s = '<ellipse cx="80" cy="70" rx="22" ry="18" fill="#adb5bd" stroke="#2b2d42" stroke-width="2.5"/><ellipse cx="135" cy="72" rx="34" ry="28" fill="#868e96" stroke="#2b2d42" stroke-width="2.5"/>'; for (let i = 0; i < 4; i++) { s += P("M" + (72 + i * 6) + " 58 L" + (50 + i * 14) + " 24 L" + (40 + i * 16) + " 10"); s += P("M" + (72 + i * 6) + " 82 L" + (50 + i * 14) + " 116 L" + (40 + i * 16) + " 134"); } return fig(200, 140, s); };
  const isInsect = () => { const sp = R(0, 1); return sp ? tf(ask("この生き物（クモ）は こん虫である。", spiderSvg()), false, "クモは体が2つに分かれ、あしが8本なので こん虫ではない。") : tf(ask("この生き物は、体が3つに分かれ あしが6本なので こん虫である。", insectSvg("むね")), true, "頭・むね・はらの3つに分かれ、あしが6本なのが こん虫。"); };
  // 植物のつくり
  const plantSvg = (m) => { let s = '<rect x="0" y="96" width="200" height="54" fill="#e9c46a" opacity=".45"/>' + L([100, 96], [100, 30], { color: "#2b8a3e", w: 4 }) + '<ellipse cx="78" cy="56" rx="22" ry="10" transform="rotate(-25 78 56)" fill="#8ce99a" stroke="#2b8a3e" stroke-width="2"/><ellipse cx="122" cy="44" rx="22" ry="10" transform="rotate(25 122 44)" fill="#8ce99a" stroke="#2b8a3e" stroke-width="2"/>';
    s += P("M100 96 L96 120 L86 138 M100 104 L110 126 L118 140 M97 114 L80 122 M104 116 L124 120", { color: "#a0522d", w: 2 });
    const pos = { "葉": [64, 40], "くき": [116, 76], "根": [132, 132] }; return fig(200, 150, s + lab(pos[m][0], pos[m][1], "あ")); };
  const plantPart = () => { const m = pick(["葉", "くき", "根"]); return ch(ask("植物の体で、「あ」の部分を何という？", plantSvg(m)), m, ["葉", "くき", "根", "花"].filter((x) => x !== m), "植物の体は 根・くき・葉 からできている。「あ」は" + m + "。"); };
  // 太陽とかげ（かげは太陽の反対側）
  const DIR4 = ["北", "東", "南", "西"], DV = { "北": [0, -1], "東": [1, 0], "南": [0, 1], "西": [-1, 0] };
  const shadowQ = () => { const sun = pick(["東", "南", "西"]), sh = DIR4[(DIR4.indexOf(sun) + 2) % 4], v = DV[sun]; let s = '<rect width="200" height="170" fill="#f8f9fa"/>';
    ["北", "東", "南", "西"].forEach((k) => { const d = DV[k]; s += T(100 + d[0] * 86, 85 + d[1] * 72, k, { size: 14, bold: true }); });
    s += C(100 + v[0] * 62, 85 + v[1] * 52, 12, { fill: "#ffd43b", color: "#f59f00" }); s += C(100, 85, 5, { fill: "#495057", w: 1 }); s += T(100, 104, "ぼう", { size: 11 });
    return ch(ask("太陽が " + sun + " にあるとき、ぼうのかげは どの方位にできる？（上が北）", fig(200, 170, s)), sh, DIR4.filter((x) => x !== sh), "かげは太陽の反対側にできる。太陽が" + sun + "なら、かげは" + sh + "。"); };
  // 回路（明かりがつくのは、＋極と−極が1つの輪でつながったとき）
  const circuitSvg = (k) => { // k: ok / gap / same
    let s = '<rect x="30" y="100" width="70" height="30" rx="4" fill="#fff3bf" stroke="#2b2d42" stroke-width="2.5"/><rect x="100" y="108" width="8" height="14" fill="#2b2d42"/>' + T(46, 115, "−", { size: 16, bold: true }) + T(88, 115, "＋", { size: 14, bold: true });
    s += '<circle cx="110" cy="40" r="16" fill="#fff9db" stroke="#2b2d42" stroke-width="2.5"/>' + RC(100, 54, 20, 14, { fill: "#ced4da", w: 2 });
    s += P("M104 68 L104 76 L20 76 L20 115 L30 115", { color: COL.blue });
    if (k === "ok") s += P("M116 68 L116 76 L150 76 L150 115 L108 115", { color: COL.red });
    else if (k === "gap") s += P("M116 68 L116 76 L150 76 L150 98", { color: COL.red }) + P("M150 108 L150 115 L108 115", { color: COL.red });
    else s += P("M116 68 L116 84 L24 84 L24 112", { color: COL.red });
    return fig(180, 140, s); };
  const circuitQ = () => { const k = pick(["ok", "gap", "same", "ok"]); return tf(ask("この つなぎ方で、豆電球の明かりは つく。", circuitSvg(k)), k === "ok", k === "ok" ? "電池の＋極と−極が、豆電球を通って1つの輪のようにつながっているので明かりがつく。" : k === "gap" ? "どう線がとちゅうで切れていて、輪になっていないので明かりはつかない。" : "2本のどう線が どちらも電池の−極につながっていて、＋極につながっていないので明かりはつかない。"); };
  // 磁石
  const magSvg = (a, b) => { const bar = (x, l, r) => RC(x, 40, 60, 30, { fill: "#fff" }) + '<rect x="' + (x + 1) + '" y="41" width="29" height="28" fill="' + (l === "N" ? "#ff8787" : "#74c0fc") + '"/><rect x="' + (x + 30) + '" y="41" width="29" height="28" fill="' + (r === "N" ? "#ff8787" : "#74c0fc") + '"/>' + T(x + 15, 56, l, { size: 15, bold: true }) + T(x + 45, 56, r, { size: 15, bold: true });
    return fig(200, 100, bar(14, a === "N" ? "S" : "N", a) + bar(126, b, b === "N" ? "S" : "N") + T(100, 88, "← ？ →", { size: 12, color: COL.mute })); };
  const magQ = () => { const a = pick(["N", "S"]), b = pick(["N", "S"]), same = a === b; return ch(ask("向かい合った極（" + a + "極と" + b + "極）を近づけると、どうなる？", magSvg(a, b)), same ? "しりぞけ合う" : "引き合う", [same ? "引き合う" : "しりぞけ合う", "何も起こらない", "くっついたあと はなれる"], "ちがう極（NとS）は引き合い、同じ極（NとN、SとS）はしりぞけ合う。"); };
  // てんびん（重いほうが下がる）
  const balSvg = (l, r) => { const tilt = l > r ? 1 : l < r ? -1 : 0, a = tilt * 0.18, cx = 110, cy = 46, dx = Math.cos(a) * 80, dy = Math.sin(a) * 80;
    let s = PG([[cx, cy], [cx - 14, 130], [cx + 14, 130]], { fill: "#dee2e6" }) + L([cx - dx, cy - dy], [cx + dx, cy + dy], { w: 4 });
    const pan = (x, y, g) => L([x, y], [x - 16, y + 34], { w: 1.2 }) + L([x, y], [x + 16, y + 34], { w: 1.2 }) + RC(x - 20, y + 34, 40, 6, { fill: "#adb5bd", w: 1.5 }) + T(x, y + 52, g + "g", { size: 13, bold: true });
    return fig(220, 150, s + pan(cx - dx, cy - dy, l) + pan(cx + dx, cy + dy, r)); };
  const balQ = () => { let l = R(2, 9) * 10, r = R(2, 9) * 10; if (l === r) r += 10; const heavy = l > r ? "左" : "右"; return ch(ask("左の皿に " + l + "g、右の皿に " + r + "g の物をのせて手をはなす。てんびんは どうなる？", balSvg(0, 0).replace(/[0-9]+g/g, "?g")), heavy + "が下がる", [heavy === "左" ? "右が下がる" : "左が下がる", "つり合う", "どちらも上がる"], "重いほうが下がる。" + Math.max(l, r) + "g の" + heavy + "が下がる。"); };
  const balRead = () => { let l = R(2, 9) * 10, r = R(2, 9) * 10; if (l === r) r += 10; return ch(ask("てんびんが この図のように かたむいた。重いのは どちら？", balSvg(l, r).replace(/>[0-9]+g</g, ">？<")), l > r ? "左の物" : "右の物", [l > r ? "右の物" : "左の物", "同じ重さ"], "てんびんは重いほうが下がる。"); };
  A(3, "こん虫の育ち方とつくり", [["こん虫の体（図）", insectPart], ["あしの数と場所（図）", legsWhere], ["こん虫かな？（図）", isInsect]]);
  A(3, "植物の育ち方とつくり", [["植物の体（図）", plantPart, 6]]);
  A(3, "太陽とかげ", [["かげのできる方位（図）", shadowQ]]);
  A(3, "電気とじしゃく", [["明かりはつく？（回路の図）", circuitQ], ["磁石の極（図）", magQ]]);
  A(3, "物の重さ", [["てんびん（図）", () => (R(0, 1) ? balQ() : balRead())]]);

  // ===== 小4 =====
  // 月の形
  const moonSvg = (k) => { const cx = 70, cy = 70, r = 50; let s = '<rect width="140" height="140" rx="12" fill="#1b1f3b"/>';
    if (k === "満月") s += C(cx, cy, r, { fill: "#ffe066", color: "#ffe066", w: 1 });
    else if (k === "半月") s += P("M" + cx + " " + (cy - r) + " A" + r + " " + r + " 0 0 1 " + cx + " " + (cy + r) + " Z", { fill: "#ffe066", color: "#ffe066", w: 1 }) + C(cx, cy, r, { color: "#495057", w: 1 });
    else s += P("M" + cx + " " + (cy - r) + " A" + r + " " + r + " 0 0 1 " + cx + " " + (cy + r) + " A" + r * 0.78 + " " + r + " 0 0 0 " + cx + " " + (cy - r) + " Z", { fill: "#ffe066", color: "#ffe066", w: 1 }) + C(cx, cy, r, { color: "#495057", w: 1 });
    return fig(140, 140, s); };
  const moonQ = () => { const k = pick(["満月", "半月", "三日月"]); return ch(ask("この月の形を何という？", moonSvg(k)), k, ["満月", "半月", "三日月", "新月"].filter((x) => x !== k).slice(0, 3), k === "満月" ? "まるく光って見えるのが満月。" : k === "半月" ? "半分だけ光って見えるのが半月。" : "細く光って見えるのが三日月。"); };
  // 気温のグラフ（晴れの日：昼すぎに最高）
  const tempGraph = () => { const hrs = [9, 10, 11, 12, 13, 14, 15], peak = pick([1, 2, 3, 4, 5]), b = R(12, 20); const vals = hrs.map((h, i) => b + Math.max(0, 8 - Math.abs(i - peak) * 2) + (i > peak ? 1 : 0)); const mx = Math.max(...vals), at = hrs[vals.indexOf(mx)];
    return R(0, 1) ? num(ask("グラフで、気温がいちばん高いのは何時？", FG.lineGraph(hrs.map((h) => h + "時"), vals, 2, "℃", { min: Math.floor((b - 2) / 2) * 2 })), at, "グラフの点がいちばん上にあるのは " + at + "時（" + mx + "℃）。", { unit: "時", chk: String(at) }) : num(ask("グラフで、いちばん高い気温は何℃？", FG.lineGraph(hrs.map((h) => h + "時"), vals, 2, "℃", { min: Math.floor((b - 2) / 2) * 2 })), mx, "いちばん上の点は " + mx + "℃（" + at + "時）。", { unit: "℃", chk: String(mx) }); };
  const thermoQ = () => { const t = R(-5, 35); return num(ask("温度計は何℃をさしている？", FG.thermo(t)), t, "赤い液の先の目もりを、真横から読む。" + t + "℃。", { unit: "℃", chk: String(t) }); };
  // 電池のつなぎ方（直列・へい列）
  const cellSvg = (k) => { const cell = (x, y, rot) => '<g transform="translate(' + x + " " + y + ") rotate(" + rot + ')"><rect x="-28" y="-11" width="56" height="22" rx="3" fill="#fff3bf" stroke="#2b2d42" stroke-width="2"/><rect x="28" y="-5" width="5" height="10" fill="#2b2d42"/></g>';
    let s = '<circle cx="150" cy="30" r="13" fill="#fff9db" stroke="#2b2d42" stroke-width="2.2"/>';
    if (k === "直列") s += cell(55, 110, 0) + cell(130, 110, 0) + P("M163 110 L180 110 L180 30 L163 30", { color: COL.red }) + P("M27 110 L12 110 L12 30 L137 30", { color: COL.blue }) + P("M88 110 L102 110", { color: COL.line });
    else s += cell(85, 92, 0) + cell(85, 130, 0) + P("M118 92 L150 92 L150 130 L118 130 M150 92 L180 92 L180 30 L163 30", { color: COL.red }) + P("M57 92 L30 92 L30 130 L57 130 M30 92 L12 92 L12 30 L137 30", { color: COL.blue });
    return fig(200, 150, s); };
  const cellQ = () => { const k = pick(["直列", "へい列"]); return ch(ask("この かん電池2こ のつなぎ方を何という？", cellSvg(k)), k + "つなぎ", [k === "直列" ? "へい列つなぎ" : "直列つなぎ", "ショート回路", "一本つなぎ"], k === "直列" ? "電池の＋極と別の電池の−極を1列につなぐのが直列つなぎ。電流は1こより大きくなる。" : "＋極どうし・−極どうしをつなぐのがへい列つなぎ。電流は1このときとほぼ同じ。"); };
  A(4, "月と星", [["月の形の名前（図）", moonQ]]);
  A(4, "天気と気温", [["気温のグラフ（図）", tempGraph], ["温度計を読もう（図）", thermoQ]]);
  A(4, "電流のはたらき", [["かん電池のつなぎ方（図）", cellQ]]);

  // ===== 小5 =====
  const cylSvg = (v, max, step) => { const H = 200, top = 20, bot = 180, y = (x) => bot - (x / max) * (bot - top); let s = RC(70, 10, 50, 176, { fill: "#f8f9fa", rx: 4 }) + '<rect x="72" y="' + f1(y(v)) + '" width="46" height="' + f1(bot - y(v) + 4) + '" fill="#a5d8ff"/>' + P("M72 " + f1(y(v) - 3) + " Q95 " + f1(y(v) + 4) + " 118 " + f1(y(v) - 3), { color: "#1c7ed6", w: 2 });
    for (let x = 0; x <= max; x += step) { const big = x % (step * 5) === 0; s += L([120, y(x)], [120 - (big ? 18 : 9), y(x)], { w: big ? 1.5 : 1 }); if (big) s += T(140, y(x), String(x), { size: 11 }); }
    return fig(190, H, s + T(150, 8, "mL", { size: 11 })); };
  const cylQ = () => { const max = pick([50, 100]), step = max === 50 ? 1 : 2, v = R(5, max / step - 3) * step; return num(ask("メスシリンダーの水は何mL？（液面のへこんだ下の面を真横から読む）", cylSvg(v, max, step)), v, "液面のいちばん低いところの目もりを読む。1目もりは" + step + "mL なので " + v + "mL。", { unit: "mL", chk: String(v) }); };
  const pendSvg = (l1, l2) => { const p = (x, l, lab) => L([x, 14], [x + Math.sin(0.3) * l, 14 + Math.cos(0.3) * l], { w: 1.5 }) + C(x + Math.sin(0.3) * l, 14 + Math.cos(0.3) * l, 9, { fill: "#ffa94d" }) + T(x, 150, lab, { size: 13, bold: true }) + T(x + 22, 14 + l / 2, l + "cm", { size: 11, color: COL.blue });
    return fig(220, 160, L([10, 14], [210, 14], { w: 4 }) + p(60, l1, "あ") + p(150, l2, "い")); };
  const pendQ = () => { let a = R(3, 12) * 10, b = R(3, 12) * 10; if (a === b) b += 20; const longer = a > b ? "あ" : "い"; return ch(ask("おもりの重さとふれはばが同じとき、1往復する時間が長いのは どちら？", pendSvg(a, b)), longer, [longer === "あ" ? "い" : "あ", "同じ"], "1往復する時間は ふりこの長さ で決まり、長いほど長くなる。おもりの重さやふれはばでは変わらない。"); };
  const riverSvg = (m) => { let s = '<rect width="220" height="150" fill="#d3f9d8"/>' + P("M0 30 Q150 30 160 90 Q170 150 220 150 L220 100 Q200 110 195 80 Q180 0 0 0 Z", { fill: "#74c0fc", color: "#1c7ed6", w: 1.5 }); s += lab(m === "外側" ? 196 : 150, m === "外側" ? 50 : 95, "あ"); return fig(220, 150, s + P("M40 15 L80 15", { color: "#fff", w: 2 }) + PG([[80, 11], [88, 15], [80, 19]], { fill: "#fff", color: "#fff", w: 1 })); };
  const riverQ = () => { const m = pick(["外側", "内側"]); return ch(ask("川の曲がっているところで、「あ」（" + m + "）の流れや川底のようすは？", riverSvg(m)), m === "外側" ? "流れが速く、深くけずられている" : "流れがゆるやかで、石や砂が積もっている", [m === "外側" ? "流れがゆるやかで、石や砂が積もっている" : "流れが速く、深くけずられている", "水が流れていない", "流れが逆向きになっている"], "曲がっているところの外側は流れが速く、しん食で深くなる。内側は流れがゆるやかで、たい積して川原ができる。"); };
  const flowerSvg = (m) => { let s = ""; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.42; s += '<ellipse cx="' + f1(110 + Math.cos(a) * 52) + '" cy="' + f1(100 + Math.sin(a) * 52) + '" rx="16" ry="34" transform="rotate(' + f1((a * 180) / Math.PI + 90) + " " + f1(110 + Math.cos(a) * 52) + " " + f1(100 + Math.sin(a) * 52) + ')" fill="#ffc9c9" stroke="#e64980" stroke-width="2"/>'; }
    s += P("M84 118 L70 140 L96 128 M136 118 L150 140 L124 128", { fill: "#8ce99a", color: "#2b8a3e", w: 2 });
    [-22, -11, 11, 22].forEach((dx) => { s += L([110 + dx * 0.4, 112], [110 + dx, 60], { color: "#f59f00", w: 2 }) + '<ellipse cx="' + (110 + dx) + '" cy="58" rx="4" ry="6" fill="#ffd43b" stroke="#f59f00"/>'; });
    s += L([110, 112], [110, 52], { color: "#2b8a3e", w: 4 }) + C(110, 48, 5, { fill: "#69db7c", color: "#2b8a3e", w: 2 }) + '<ellipse cx="110" cy="114" rx="9" ry="7" fill="#69db7c" stroke="#2b8a3e" stroke-width="2"/>' + L([110, 120], [110, 150], { color: "#2b8a3e", w: 4 });
    const pos = { "めしべ": [110, 30, 110, 46], "おしべ": [158, 50, 133, 58], "花びら": [190, 92, 160, 96], "がく": [44, 146, 70, 136] }[m]; return fig(220, 160, s + L([pos[0], pos[1]], [pos[2], pos[3]], { color: COL.red, w: 1.5 }) + lab(pos[0], pos[1], "あ")); };
  const flowerQ = () => { const m = pick(["めしべ", "おしべ", "花びら", "がく"]); return ch(ask("花のつくりで、「あ」を何という？", flowerSvg(m)), m, ["めしべ", "おしべ", "花びら", "がく"].filter((x) => x !== m), { "めしべ": "まん中にある1本がめしべ。もとのふくらんだ部分が実になる。", "おしべ": "めしべのまわりにあり、先に花粉の入ったふくろがあるのがおしべ。", "花びら": "めしべ・おしべを囲んでいるのが花びら。", "がく": "花のいちばん外側（下）で、花びらをささえているのが がく。" }[m]); };
  A(5, "物のとけ方", [["メスシリンダーを読もう（図）", cylQ]]);
  A(5, "ふりこの運動", [["ふりこの長さと1往復の時間（図）", pendQ, 6]]);
  A(5, "流れる水のはたらき", [["川の曲がっているところ（図）", riverQ, 6]]);
  A(5, "花から実へ", [["花のつくり（図）", flowerQ]]);

  // ===== 小6 =====
  // てこのつり合い（左のうでのかたむけるはたらき＝右）
  const leverSvg = (lw, ld, rw, rd) => { let s = L([10, 60], [250, 60], { w: 5 }) + PG([[130, 62], [120, 82], [140, 82]], { fill: "#adb5bd" }); for (let i = 1; i <= 6; i++) { s += L([130 - i * 18, 56], [130 - i * 18, 64], { w: 1 }) + L([130 + i * 18, 56], [130 + i * 18, 64], { w: 1 }) + T(130 - i * 18, 50, String(i), { size: 9, color: COL.mute }) + T(130 + i * 18, 50, String(i), { size: 9, color: COL.mute }); }
    const wt = (x, w) => L([x, 62], [x, 92], { w: 1.2 }) + RC(x - 14, 92, 28, 22, { fill: "#ffe8cc", rx: 3, w: 2 }) + T(x, 104, w, { size: 11, bold: true });
    return fig(260, 124, s + wt(130 - ld * 18, lw + "g") + wt(130 + rd * 18, rw)); };
  const leverQ = () => { for (let k = 0; k < 40; k++) { const lw = R(1, 6) * 10, ld = R(1, 6), rd = R(1, 6); if ((lw * ld) % rd) continue; const rw = (lw * ld) / rd; if (rw > 120 || rd === ld) continue; return num(ask("てこがつり合うのは、右のうでの目もり" + rd + "に何gのおもりをつるしたとき？", leverSvg(lw, ld, "？", rd)), rw, "左：" + lw + "×" + ld + "＝" + lw * ld + "。右：□×" + rd + "＝" + lw * ld + " なので □＝" + rw + "g。", { unit: "g", chk: "(" + lw + "*" + ld + ")/" + rd }); } return null; };
  const leverTF = () => { let lw = R(1, 6) * 10, ld = R(1, 6), rw = R(1, 6) * 10, rd = R(1, 6); if (R(0, 1)) { const o = [[10, 1, 10, 1], [20, 3, 30, 2], [30, 2, 20, 3], [10, 6, 20, 3], [20, 6, 40, 3], [40, 3, 20, 6], [30, 4, 40, 3], [60, 2, 40, 3], [10, 4, 40, 1], [50, 2, 20, 5]].filter((v) => v[1] !== v[3] || R(0, 3) === 0); [lw, ld, rw, rd] = pick(o); } const bal = lw * ld === rw * rd; return tf(ask("このてこは、水平につり合う。", leverSvg(lw, ld, rw + "g", rd)), bal, "左 " + lw + "×" + ld + "＝" + lw * ld + "、右 " + rw + "×" + rd + "＝" + rw * rd + "。" + (bal ? "等しいのでつり合う。" : (lw * ld > rw * rd ? "左" : "右") + "にかたむく。")); };
  // 地層（ふつうは下の層ほど古い）
  const LAY = [["れき", "#ced4da", "big"], ["砂", "#ffe8cc", "dot"], ["どろ", "#a68a64", "none"], ["火山灰", "#f1f3f5", "tri"]];
  const layerSvg = (order) => { let s = ""; order.forEach((li, i) => { const y = 14 + i * 32, L0 = LAY[li]; s += '<rect x="20" y="' + y + '" width="180" height="32" fill="' + L0[1] + '" stroke="#495057" stroke-width="1.5"/>'; for (let k = 0; k < 9; k++) { const x = 30 + k * 20, yy = y + 10 + (k % 2) * 10; if (L0[2] === "big") s += C(x, yy, 5, { fill: "#adb5bd", w: 1 }); else if (L0[2] === "dot") s += C(x, yy, 1.5, { fill: "#e8590c", w: 0.5 }); else if (L0[2] === "tri") s += PG([[x, yy - 4], [x + 4, yy + 3], [x - 4, yy + 3]], { fill: "#fff", w: 1 }); } s += T(212, y + 16, L0[0], { size: 12, anchor: "start" }); }); return fig(270, 14 + order.length * 32 + 10, s); };
  const layerQ = () => { const order = shuf([0, 1, 2, 3]); const old = LAY[order[3]][0], neu = LAY[order[0]][0]; return R(0, 1) ? ch(ask("この地層で、いちばん古いと考えられる層は？（地層はひっくり返っていない）", layerSvg(order)), old, LAY.map((x) => x[0]).filter((x) => x !== old), "地層はふつう下から順に積もるので、下の層ほど古い。いちばん下は「" + old + "」。") : ch(ask("この地層で、いちばん新しいと考えられる層は？（地層はひっくり返っていない）", layerSvg(order)), neu, LAY.map((x) => x[0]).filter((x) => x !== neu), "上の層ほど新しい。いちばん上は「" + neu + "」。"); };
  const LTF = [["火山灰の層があると、その層ができたころに近くで火山のふん火があったと考えられる。", true, "火山灰の層は、ふん火でふった灰が積もってできる。"], ["れき・砂・どろのつぶは、どろがいちばん大きい。", false, "つぶの大きさは れき＞砂＞どろ。どろがいちばん小さい。"], ["水のはたらきでできた地層のつぶは、角がとれて丸みをおびている。", true, "流れる水に運ばれるうちに角がけずられて丸くなる。"], ["火山灰のつぶは、丸みをおびたものが多い。", false, "火山灰のつぶは水で運ばれていないので、角ばったものが多い。"], ["地層の中から見つかる、大昔の生き物の体や生活のあとを化石という。", true, "化石から、地層ができた時代や環境がわかる。"], ["地層はふつう、上の層ほど古い。", false, "下から順に積もるので、ふつうは下の層ほど古い。"]];
  const volcanoQ = () => { const x = pick(LTF); return tf(ask(x[0], layerSvg(shuf([0, 1, 2, 3]))), x[1], x[2]); };
  A(6, "てこと電気の利用", [["てこのつり合い（図）", () => leverQ() || leverTF()], ["つり合う？（図）", leverTF]]);
  A(6, "土地のつくり", [["地層の古さ（図）", layerQ], ["地層のつぶと化石（図）", volcanoQ, 6]]);

  // ===== 中1 =====
  const reflSvg = (a) => { const r = (a * Math.PI) / 180, cx = 120, cy = 130, l = 100; let s = '<rect x="20" y="130" width="200" height="10" fill="#dee2e6"/>' + L([20, 130], [220, 130], { w: 3 }) + L([cx, 130], [cx, 20], { dash: "5 4", w: 1.5, color: COL.mute }) + T(cx + 4, 16, "法線", { size: 10, color: COL.mute, anchor: "start" });
    const ix = cx - Math.sin(r) * l, iy = cy - Math.cos(r) * l, ox = cx + Math.sin(r) * l, oy = iy; s += L([ix, iy], [cx, cy], { color: COL.red }) + L([cx, cy], [ox, oy], { color: COL.red }) + PG([[cx - Math.sin(r) * 50, cy - Math.cos(r) * 50], [cx - Math.sin(r) * 50 + 6, cy - Math.cos(r) * 50 - 5], [cx - Math.sin(r) * 50 + 1, cy - Math.cos(r) * 50 + 7]], { fill: COL.red, color: COL.red, w: 1 });
    s += P("M" + f1(cx) + " " + f1(cy - 34) + " A34 34 0 0 0 " + f1(cx - Math.sin(r) * 34) + " " + f1(cy - Math.cos(r) * 34), { color: COL.org, w: 2 }) + T(cx - Math.sin(r / 2) * 48, cy - Math.cos(r / 2) * 48, a + "°", { size: 12, color: COL.org, bold: true }) + T(cx + Math.sin(r / 2) * 48, cy - Math.cos(r / 2) * 48, "x", { size: 13, color: COL.blue, bold: true });
    return fig(240, 150, s); };
  const reflQ = () => { const a = pick([20, 25, 30, 35, 40, 45, 50, 55, 60]); return num(ask("鏡で光が反射した。反射角 x は何度？", reflSvg(a)), a, "反射の法則：入射角＝反射角。入射角が" + a + "°なので x＝" + a + "°。", { unit: "°", chk: String(a) }); };
  const springQ = () => { const k = pick([2, 3, 4, 5]), xs = [0, 10, 20, 30, 40, 50], vals = xs.map((x) => (x * k) / 10); const f = pick([15, 25, 35, 45]), ans = (f * k) / 10; return num(ask("グラフは、ばねにつるしたおもりの重さとばねののびの関係。" + f + "gのおもりでは何cmのびる？", FG.lineGraph(xs.map((x) => x + "g"), vals, k, "cm")), ans, "ばねののびはおもりの重さに比例する（フックの法則）。グラフより10gで" + k + "cm のびるので、" + k + "×" + f / 10 + "＝" + ans + "cm。", { unit: "cm", chk: "(" + f + "*" + k + ")/10" }); };
  const meltSvg = () => FG.lineGraph(["0", "2", "4", "6", "8", "10", "12", "14"], [-20, -10, 0, 0, 0, 40, 80, 100], 20, "℃", { min: -20 }).replace("</svg>", "") + "</svg>";
  const meltQ = () => pick([num(ask("氷を加熱したときの温度変化のグラフ。温度が一定になっている、とけはじめからとけ終わるまでの温度は何℃？（横じくは加熱時間［分］）", meltSvg()), 0, "氷がとけて水になる間（融点）は、加えた熱が状態変化に使われ、温度は0℃で一定になる。", { unit: "℃", chk: "0" }), ch(ask("グラフで温度が0℃のまま変わらない間、氷はどうなっている？", meltSvg()), "とけて水になっている", ["ふっとうしている", "冷えて固まっている", "何も変化していない"], "0℃（融点）で温度が一定の間は、固体（氷）が液体（水）に変化している。")]);
  A(7, "光と音", [["反射の法則（図）", reflQ]]);
  A(7, "力のはたらき", [["ばねののびのグラフ（図）", springQ]]);
  A(7, "水よう液と状態変化", [["状態変化のグラフ（図）", meltQ, 6]]);

  // ===== 中2 =====
  // 天気記号（日本式）
  const WX = { "快晴": "", "晴れ": "|", "くもり": "◎", "雨": "●", "雪": "*" };
  const wxSvg = (k, dir, force) => { let s = ""; const cx = 80, cy = 80, r = 22;
    if (dir != null) { const a = (dir * Math.PI) / 4 - Math.PI / 2, ex = cx + Math.cos(a) * 70, ey = cy + Math.sin(a) * 70; s += L([cx + Math.cos(a) * r, cy + Math.sin(a) * r], [ex, ey], { w: 2.5 }); for (let i = 0; i < force; i++) { const px = ex - Math.cos(a) * i * 9, py = ey - Math.sin(a) * i * 9, b = a + Math.PI / 2 + 0.6; s += L([px, py], [px + Math.cos(b) * 16, py + Math.sin(b) * 16], { w: 2 }); } }
    s += C(cx, cy, r, { fill: k === "雨" ? COL.line : "#fff" });
    if (k === "晴れ") s += L([cx, cy - r], [cx, cy + r], { w: 2.5 }); if (k === "くもり") s += C(cx, cy, r * 0.5); if (k === "雪") for (let i = 0; i < 3; i++) { const a = (i * Math.PI) / 3 + Math.PI / 2; s += L([cx + Math.cos(a) * r, cy + Math.sin(a) * r], [cx - Math.cos(a) * r, cy - Math.sin(a) * r], { w: 2 }); }
    s += T(80, 10, "北", { size: 11, color: COL.mute }); return fig(160, 160, s); };
  const DIR8 = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
  const wxQ = () => { const k = pick(Object.keys(WX)); if (R(0, 1)) return ch(ask("この天気記号が表す天気は？", wxSvg(k)), k, Object.keys(WX).filter((x) => x !== k).slice(0, 3), "日本式天気記号：快晴は○、晴れは○に縦線、くもりは◎、雨は●、雪は○を3本の線で6つに分けた形。");
    const dir = R(0, 7), f = R(1, 5); return R(0, 1) ? ch(ask("この記号の風向は？（上が北。矢ばねのある棒の向きから風がふいてくる）", wxSvg(k, dir, f)), DIR8[dir], shuf(DIR8.filter((x) => x !== DIR8[dir])).slice(0, 3), "棒がのびている方向が、風がふいてくる方向（風向）。この記号は" + DIR8[dir] + "の風。") : num(ask("この記号の風力はいくつ？", wxSvg(k, dir, f)), f, "矢ばねの数が風力を表す。" + f + "本なので風力" + f + "。", { chk: String(f) }); };
  // 前線の記号
  const FR = { "寒冷前線": "cold", "温暖前線": "warm", "停滞前線": "stat", "へいそく前線": "occ" };
  const frontSvg = (k) => { let s = L([10, 60], [230, 60], { w: 3, color: k === "cold" ? COL.blue : k === "warm" ? COL.red : k === "occ" ? "#9c36b5" : "#495057" });
    for (let i = 0; i < 5; i++) { const x = 30 + i * 42; const tri = (c, up) => PG([[x - 9, 60], [x + 9, 60], [x, up ? 46 : 74]], { fill: c, color: c, w: 1 }); const semi = (c, up) => P("M" + (x - 9) + " 60 A9 9 0 0 " + (up ? 1 : 0) + " " + (x + 9) + " 60 Z", { fill: c, color: c, w: 1 });
      if (k === "cold") s += tri(COL.blue, true); else if (k === "warm") s += semi(COL.red, true); else if (k === "occ") s += i % 2 ? semi("#9c36b5", true) : tri("#9c36b5", true); else s += i % 2 ? semi(COL.red, true) : tri(COL.blue, false); }
    return fig(240, 100, s); };
  const frontQ = () => { const k = pick(Object.keys(FR)); return ch(ask("この前線の記号の名前は？", frontSvg(FR[k])), k, Object.keys(FR).filter((x) => x !== k), { "寒冷前線": "三角（▲）が並ぶのが寒冷前線。通過後は気温が下がり、強い雨が短時間ふる。", "温暖前線": "半円が並ぶのが温暖前線。おだやかな雨が長時間ふり、通過後は気温が上がる。", "停滞前線": "三角と半円が反対側につくのが停滞前線（梅雨前線・秋雨前線）。", "へいそく前線": "三角と半円が同じ側に交互につくのが閉そく前線。" }[k]); };
  // 回路（直列・へい列の抵抗）
  const resSvg = (kind, r1, r2, v) => { const res = (x, y, t) => RC(x - 22, y - 9, 44, 18, { fill: "#fff" }) + T(x, y - 18, t, { size: 11, bold: true });
    let s = '<g>' + L([30, 120], [30, 30]) + L([30, 30], [210, 30]) + L([210, 30], [210, 120]) + L([210, 120], [128, 120]) + L([112, 120], [30, 120]) + L([112, 110], [112, 130], { w: 3 }) + L([128, 114], [128, 126], { w: 5 }) + T(120, 144, v + "V", { size: 12, bold: true }) + "</g>";
    if (kind === "直列") s += '<rect x="58" y="21" width="44" height="18" fill="#fff"/>' + res(80, 30, r1 + "Ω") + '<rect x="138" y="21" width="44" height="18" fill="#fff"/>' + res(160, 30, r2 + "Ω");
    else s = '<g>' + L([30, 120], [30, 30]) + L([30, 30], [70, 30]) + L([70, 10], [70, 60]) + L([170, 10], [170, 60]) + L([70, 10], [170, 10]) + L([70, 60], [170, 60]) + L([170, 30], [210, 30]) + L([210, 30], [210, 120]) + L([210, 120], [128, 120]) + L([112, 120], [30, 120]) + L([112, 110], [112, 130], { w: 3 }) + L([128, 114], [128, 126], { w: 5 }) + T(120, 144, v + "V", { size: 12, bold: true }) + "</g>" + '<rect x="98" y="1" width="44" height="18" fill="#fff"/>' + RC(98, 1, 44, 18, { fill: "#fff" }) + T(120, 10, r1 + "Ω", { size: 10, bold: true }) + '<rect x="98" y="51" width="44" height="18" fill="#fff"/>' + RC(98, 51, 44, 18, { fill: "#fff" }) + T(120, 60, r2 + "Ω", { size: 10, bold: true });
    return fig(240, 152, s); };
  const resQ = () => { const kind = pick(["直列", "へい列"]); if (kind === "直列") { const r1 = pick([2, 3, 4, 5, 6, 10]), r2 = pick([2, 4, 5, 6, 10, 14]), I = pick([0.5, 1, 2, 3]), v = (r1 + r2) * I; if (v > 60) return null; return num(ask("直列回路。電源の電圧が" + v + "Vのとき、回路を流れる電流は何A？", resSvg(kind, r1, r2, v)), I, "全体の抵抗は " + r1 + "＋" + r2 + "＝" + (r1 + r2) + "Ω。電流＝電圧÷抵抗＝" + v + "÷" + (r1 + r2) + "＝" + I + "A。", { unit: "A", chk: v + "/(" + r1 + "+" + r2 + ")" }); }
    const r1 = pick([2, 3, 4, 5, 6, 10, 12, 15]), r2 = pick([2, 3, 4, 5, 6, 10, 12, 15]), v = pick([6, 12, 30, 60]); const I = v / r1 + v / r2; if (Math.round(I * 100) !== I * 100) return null; return num(ask("へい列回路。電源の電圧が" + v + "Vのとき、電源から流れ出る電流は何A？", resSvg(kind, r1, r2, v)), +I.toFixed(2), "へい列では各抵抗に" + v + "Vがかかる。" + v + "÷" + r1 + "＋" + v + "÷" + r2 + "＝" + +I.toFixed(2) + "A。", { unit: "A", chk: v + "/" + r1 + "+" + v + "/" + r2 }); };
  A(8, "天気とその変化", [["天気記号と風向・風力（図）", wxQ], ["前線の記号（図）", frontQ]]);
  A(8, "電流と磁界", [["回路の電流（図）", () => resQ() || resQ() || resQ() || frontQ()]]);

  // ===== 中3 =====
  // 月の満ち欠け（北半球。上弦は右半分が光る、下弦は左半分）
  const moon3Svg = (k) => { const cx = 70, cy = 70, r = 50; let s = '<rect width="140" height="140" rx="12" fill="#1b1f3b"/>' + C(cx, cy, r, { color: "#495057", w: 1 });
    if (k === "満月") s += C(cx, cy, r, { fill: "#ffe066", color: "#ffe066", w: 1 }); else if (k === "上弦の月") s += P("M" + cx + " " + (cy - r) + " A" + r + " " + r + " 0 0 1 " + cx + " " + (cy + r) + " Z", { fill: "#ffe066", color: "#ffe066", w: 1 }); else if (k === "下弦の月") s += P("M" + cx + " " + (cy - r) + " A" + r + " " + r + " 0 0 0 " + cx + " " + (cy + r) + " Z", { fill: "#ffe066", color: "#ffe066", w: 1 }); else s += P("M" + cx + " " + (cy - r) + " A" + r + " " + r + " 0 0 1 " + cx + " " + (cy + r) + " A" + r * 0.75 + " " + r + " 0 0 0 " + cx + " " + (cy - r) + " Z", { fill: "#ffe066", color: "#ffe066", w: 1 });
    return fig(140, 140, s); };
  const moon3Q = () => { const k = pick(["満月", "上弦の月", "下弦の月", "三日月"]); return ch(ask("日本（北半球）から見た、この月の名前は？", moon3Svg(k)), k, ["満月", "上弦の月", "下弦の月", "三日月"].filter((x) => x !== k), { "満月": "全体が光っているのが満月。", "上弦の月": "右半分が光る半月が上弦の月。夕方に南の空に見える。", "下弦の月": "左半分が光る半月が下弦の月。明け方に南の空に見える。", "三日月": "右側が細く光るのが三日月。夕方の西の空に見える。" }[k]); };
  // 力の合成（方眼）
  const forceQ = () => { for (let k = 0; k < 30; k++) { const a = [R(-3, 3), R(1, 4)], b = [R(-3, 3), R(1, 4)]; if (a[0] === b[0] && a[1] === b[1]) continue; const s0 = [a[0] + b[0], a[1] + b[1]]; if (Math.abs(s0[0]) > 5 || s0[1] > 7) continue;
    const g = 24, ox = 140, oy = 190; let s = ""; for (let i = -5; i <= 5; i++) s += L([ox + i * g, 10], [ox + i * g, oy], { color: COL.grid, w: 1 }); for (let j = 0; j <= 7; j++) s += L([ox - 5 * g, oy - j * g], [ox + 5 * g, oy - j * g], { color: COL.grid, w: 1 });
    const arrow = (v, c) => { const ex = ox + v[0] * g, ey = oy - v[1] * g, an = Math.atan2(ey - oy, ex - ox); return L([ox, oy], [ex, ey], { color: c, w: 3 }) + PG([[ex, ey], [ex - Math.cos(an - 0.4) * 10, ey - Math.sin(an - 0.4) * 10], [ex - Math.cos(an + 0.4) * 10, ey - Math.sin(an + 0.4) * 10]], { fill: c, color: c, w: 1 }); };
    s += arrow(a, COL.red) + arrow(b, COL.blue) + C(ox, oy, 4, { fill: COL.line, w: 1 });
    const ans = s0[0] + "," + s0[1];
    return ch(ask("赤と青の2力の合力は、点Oから方眼で右へいくつ・上へいくつの矢印？（1目もり＝1N、左は−）", fig(280, 200, s)), "右" + s0[0] + "・上" + s0[1], shuf([[s0[0] + 1, s0[1]], [s0[0], s0[1] - 1], [a[0] - b[0], a[1] - b[1]], [s0[0] - 1, s0[1] + 1]]).filter((x) => x[0] + "," + x[1] !== ans).slice(0, 3).map((x) => "右" + x[0] + "・上" + x[1]), "2力を2辺とする平行四辺形の対角線が合力。横は " + a[0] + "＋" + b[0] + "＝" + s0[0] + "、たては " + a[1] + "＋" + b[1] + "＝" + s0[1] + "。"); } return null; };
  // 遺伝（メンデルの法則）
  const punnett = (p1, p2) => { const g1 = p1.split(""), g2 = p2.split(""); let s = ""; const W = 180; s += RC(60, 30, 120, 120, { fill: "#fff" }) + L([120, 30], [120, 150]) + L([60, 90], [180, 90]); g1.forEach((x, i) => (s += T(90 + i * 60, 18, x, { size: 15, bold: true, color: COL.blue }))); g2.forEach((y, j) => (s += T(40, 60 + j * 60, y, { size: 15, bold: true, color: COL.red })));
    const cells = []; g2.forEach((y) => g1.forEach((x) => { const c = [x, y].sort().join(""); cells.push(c); })); cells.forEach((c, i) => (s += T(90 + (i % 2) * 60, 60 + Math.floor(i / 2) * 60, c, { size: 15, bold: true }))); return { svg: fig(W + 10, 160, s), cells }; };
  const geneQ = () => { const pair = pick([["Aa", "Aa"], ["AA", "aa"], ["Aa", "aa"], ["AA", "Aa"]]); const { svg, cells } = punnett(pair[0], pair[1]); const dom = cells.filter((c) => c.includes("A")).length, rec = 4 - dom;
    const ratio = dom + "：" + rec, opts = ["4：0", "3：1", "1：1", "1：3", "2：1"].filter((x) => x !== ratio && x !== (rec ? "" : "4：0")).slice(0, 3);
    return ch(ask("親の遺伝子の組み合わせが " + pair[0] + " と " + pair[1] + " のとき、子で「顕性（Aをふくむ）の形質：潜性（aa）の形質」の数の比は？", svg), ratio === "4：0" ? "4：0（すべて顕性）" : ratio, opts.map((x) => (x === "4：0" ? "4：0（すべて顕性）" : x)), "表の4マス：" + cells.join("・") + "。Aをふくむもの " + dom + "、aa " + rec + "。"); };
  A(9, "地球と宇宙", [["月の満ち欠け（図）", moon3Q]]);
  A(9, "運動とエネルギー", [["力の合成（方眼の図）", () => forceQ() || forceQ() || moon3Q()]]);
  A(9, "生命の連続性", [["遺伝の表（図）", geneQ, 6]]);
})(typeof window !== "undefined" ? window : globalThis);
