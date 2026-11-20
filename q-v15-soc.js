/* ほしまなび — v1.5 社会の図の問題（地図記号・八方位・縮尺・等高線・雨温図・緯度経度・時差） */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, FG = HM.FIG, { R, pick, shuf, num, ch } = U;
  const { fig, T, L, PG, COL, f1 } = FG;
  const { tf } = HM.V15;
  const A = (g, un, steps) => HM.addGen("soc", g, un, steps.map(([n, f, c]) => [n, f, c || 8]));
  const C = (x, y, r, o = {}) => '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="' + (o.fill || "none") + '" stroke="' + (o.color || COL.line) + '" stroke-width="' + (o.w || 2.5) + '"/>';
  const P = (d, o = {}) => '<path d="' + d + '" fill="' + (o.fill || "none") + '" stroke="' + (o.color || COL.line) + '" stroke-width="' + (o.w || 2.5) + '" stroke-linejoin="round" stroke-linecap="round"/>';

  // ===== 地図記号（国土地理院の記号の形をもとにかく） =====
  const c = 60;
  const SYM = {
    "小・中学校": () => T(c, c + 2, "文", { size: 54, bold: true }),
    "高等学校": () => C(c, c, 40) + T(c, c + 2, "文", { size: 44, bold: true }),
    "郵便局": () => C(c, c, 40) + L([36, 40], [84, 40], { w: 5 }) + L([36, 56], [84, 56], { w: 5 }) + L([c, 56], [c, 90], { w: 5 }),
    "警察署": () => C(c, c, 40) + L([38, 38], [82, 82], { w: 5 }) + L([82, 38], [38, 82], { w: 5 }),
    "交番": () => L([30, 30], [90, 90], { w: 6 }) + L([90, 30], [30, 90], { w: 6 }),
    "消防署": () => P("M60 98 L60 54 M60 54 L30 22 M60 54 L90 22", { w: 6 }) + L([40, 76], [80, 76], { w: 0 }),
    "寺院": () => T(c, c + 2, "卍", { size: 58, bold: true }),
    "神社": () => P("M18 30 Q60 20 102 30", { w: 7 }) + L([28, 46], [92, 46], { w: 5 }) + L([38, 30], [38, 100], { w: 6 }) + L([82, 30], [82, 100], { w: 6 }),
    "市役所": () => C(c, c, 40) + C(c, c, 24),
    "町・村役場": () => C(c, c, 36),
    "田": () => [[30, 40], [74, 40], [30, 84], [74, 84]].map(([x, y]) => L([x, y - 14], [x, y + 14], { w: 5 }) + L([x + 14, y - 14], [x + 14, y + 14], { w: 5 })).join(""),
    "畑": () => P("M44 28 Q34 40 32 58 M44 28 Q60 34 62 58", { w: 5 }) + P("M84 64 Q74 76 72 94 M84 64 Q100 70 102 94", { w: 5 }),
    "果樹園": () => [[40, 44], [82, 82]].map(([x, y]) => C(x, y + 6, 14, { w: 4 }) + L([x, y - 8], [x, y - 22], { w: 4 })).join(""),
    "茶畑": () => [[40, 44], [82, 82]].map(([x, y]) => C(x, y, 9, { w: 3.5 }) + C(x - 9, y + 16, 9, { w: 3.5 }) + C(x + 9, y + 16, 9, { w: 3.5 })).join(""),
    "工場": () => { let s = C(c, c, 24, { w: 5 }); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; s += L([c + Math.cos(a) * 26, c + Math.sin(a) * 26], [c + Math.cos(a) * 40, c + Math.sin(a) * 40], { w: 9 }); } return s; },
    "温泉": () => T(c, c + 4, "♨", { size: 70 }),
    "図書館": () => P("M60 40 L60 94 M60 40 Q40 30 20 34 L20 88 Q40 84 60 94 Q80 84 100 88 L100 34 Q80 30 60 40", { w: 4.5 }),
    "博物館": () => P("M14 54 L60 22 L106 54 Z", { w: 5 }) + '<rect x="24" y="60" width="72" height="34" fill="none" stroke="#2b2d42" stroke-width="5"/>',
  };
  const symSvg = (k) => fig(120, 120, '<rect width="120" height="120" rx="12" fill="#fff" stroke="#dee2e6" stroke-width="2"/>' + SYM[k]());
  const KEYS = Object.keys(SYM);
  const NEAR = { "小・中学校": ["高等学校"], "高等学校": ["小・中学校"], "警察署": ["交番"], "交番": ["警察署"], "市役所": ["町・村役場"], "町・村役場": ["市役所"], "果樹園": ["茶畑"], "茶畑": ["果樹園"], "田": ["畑"], "畑": ["田"] };
  const symQ = (pool) => () => { const k = pick(pool); return ch("この地図記号は何を表している？" + symSvg(k), k, shuf((NEAR[k] || []).concat(shuf(pool.filter((x) => x !== k)))), "「" + k + "」の地図記号。" + ({ "小・中学校": "「文」の字の形。", "高等学校": "「文」を丸でかこむ。", "郵便局": "〒のマークを丸でかこむ。", "警察署": "交番（×）を丸でかこむ。", "交番": "警棒を2本交差させた形。", "消防署": "昔の火消しの道具「さすまた」の形。", "寺院": "「卍（まんじ）」の形。", "神社": "鳥居の形。", "市役所": "二重丸。", "町・村役場": "丸ひとつ。", "田": "かり取ったあとのいねのかぶの形。", "畑": "植物のふた葉の形。", "果樹園": "りんごなどの実の形。", "茶畑": "茶の実を横に切った形。", "工場": "機械の歯車の形。", "温泉": "湯つぼから湯気が出ている形。", "図書館": "本を開いた形。", "博物館": "建物の形。" }[k] || "")); };
  const pool3 = ["小・中学校", "郵便局", "交番", "消防署", "寺院", "神社", "田", "畑", "果樹園", "工場", "市役所", "温泉"];

  // ===== 八方位 =====
  const D8 = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
  const roseSvg = (i) => { let s = ""; for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4 - Math.PI / 2, big = k % 2 === 0; s += L([90, 90], [90 + Math.cos(a) * (big ? 66 : 48), 90 + Math.sin(a) * (big ? 66 : 48)], { w: big ? 3 : 2, color: k === i ? COL.red : COL.line }); if (k === 0) s += T(90, 12, "北", { size: 13, bold: true }); }
    const a = (i * Math.PI) / 4 - Math.PI / 2; s += C(90 + Math.cos(a) * 72, 90 + Math.sin(a) * 72, 10, { fill: "#fff", color: COL.red, w: 2 }) + T(90 + Math.cos(a) * 72, 91 + Math.sin(a) * 72, "？", { size: 12, color: COL.red, bold: true }); return fig(180, 180, s + C(90, 90, 4, { fill: COL.line, w: 1 })); };
  const roseQ = () => { const i = R(1, 7); return ch("赤い「？」の方位は？（上が北）" + roseSvg(i), D8[i], shuf(D8.filter((x, k) => k !== i && k !== 0)).slice(0, 3), "八方位は北から時計回りに 北・北東・東・南東・南・南西・西・北西。"); };
  const oppQ = () => { const i = R(0, 7); return ch(D8[i] + " の反対の方位は？" + roseSvg(i), D8[(i + 4) % 8], shuf(D8.filter((x, k) => k !== i && k !== (i + 4) % 8)).slice(0, 3), "反対の方位は、方位じしんの円の反対側。" + D8[i] + "⇔" + D8[(i + 4) % 8] + "。"); };

  // ===== 縮尺 =====
  const scaleSvg = (cm, sc) => { let s = '<rect width="260" height="110" rx="10" fill="#f8f9fa"/>' + C(40, 50, 8, { fill: "#ffd43b" }) + T(40, 72, "A", { size: 13, bold: true }) + C(40 + cm * 40, 50, 8, { fill: "#74c0fc" }) + T(40 + cm * 40, 72, "B", { size: 13, bold: true }) + L([48, 50], [32 + cm * 40, 50], { dash: "5 4", w: 2 }); for (let i = 0; i <= cm; i++) s += L([40 + i * 40, 86], [40 + i * 40, 94], { w: 1.5 }) + T(40 + i * 40, 102, i + "cm", { size: 9, color: COL.mute }); s += L([40, 90], [40 + cm * 40, 90], { w: 1.5 }); return fig(260, 110, s + T(250, 14, "縮尺 1：" + sc.toLocaleString("en-US"), { size: 11, anchor: "end" })); };
  const scaleQ = () => { const cm = R(2, 5), sc = pick([25000, 50000, 10000, 20000]), m = (cm * sc) / 100; const useKm = m >= 1000 && m % 100 === 0 && R(0, 1); return useKm ? num("地図上でAからBまで " + cm + "cm。実際のきょりは何km？" + scaleSvg(cm, sc), m / 1000, cm + "cm×" + sc + "＝" + cm * sc + "cm＝" + m + "m＝" + m / 1000 + "km。", { unit: "km", chk: "(" + cm + "*" + sc + ")/100000" }) : num("地図上でAからBまで " + cm + "cm。実際のきょりは何m？" + scaleSvg(cm, sc), m, cm + "cm×" + sc + "＝" + cm * sc + "cm＝" + m + "m。", { unit: "m", chk: "(" + cm + "*" + sc + ")/100" }); };
  // ===== 等高線 =====
  const contourSvg = (steepSide) => { let s = '<rect width="240" height="160" fill="#f4fce3"/>'; for (let i = 0; i < 6; i++) { const rl = steepSide === "west" ? 14 + i * 8 : 24 + i * 16, rr = steepSide === "west" ? 24 + i * 16 : 14 + i * 8; const ry = 10 + i * 10; s += P("M120 " + (80 - ry) + " A" + rr + " " + ry + " 0 0 1 120 " + (80 + ry) + " A" + rl + " " + ry + " 0 0 1 120 " + (80 - ry), { color: "#a0522d", w: i % 5 === 0 ? 2 : 1.2 }); }
    s += '<text x="120" y="83" font-size="11" text-anchor="middle">▲</text>' + T(14, 100, "あ", { size: 14, bold: true, color: COL.red }) + T(226, 100, "い", { size: 14, bold: true, color: COL.red }) + T(14, 80, "西", { size: 11, color: COL.mute }) + T(226, 80, "東", { size: 11, color: COL.mute }); return fig(240, 160, s); };
  const contourQ = () => { const st = pick(["west", "east"]); const ans = st === "west" ? "西側（あ）" : "東側（い）"; return ch("山の等高線。かたむきが急なのは、山頂から見て どちら側？" + contourSvg(st), ans, [st === "west" ? "東側（い）" : "西側（あ）", "どちらも同じ"], "等高線の間かくがせまいところほど、かたむきが急。"); };
  const contourTF = () => { const w = R(0, 1); return tf("等高線の間かくが" + (w ? "広い" : "せまい") + "ところほど、土地のかたむきは急である。" + contourSvg(pick(["west", "east"])), !w, "間かくがせまいほど急で、広いほどゆるやか。"); };
  const contourHeight = () => { const sc = pick([[25000, 10], [50000, 20]]), n = R(2, 8); return num("縮尺" + sc[0].toLocaleString("en-US") + "分の1の地形図で、主曲線（細い等高線）は何mごとに引かれている？", sc[1], "2万5千分の1は10mごと、5万分の1は20mごとに主曲線を引く。", { unit: "m", chk: String(sc[1]) }); };

  // ===== 雨温図（気象庁の平年値 1991〜2020年。気象庁「過去の気象データ検索」の平年値（年・月ごとの値）と照合ずみ 2026-11-20） =====
  const CLIM = {
    "札幌（北海道の気候）": { t: [-3.2, -2.7, 1.1, 7.3, 13, 17, 21.1, 22.3, 18.6, 12.1, 5.2, -0.9], p: [108.4, 91.9, 77.6, 54.6, 55.5, 60.4, 90.7, 126.8, 142.2, 109.9, 113.8, 114.5], hint: "冬の気温が0℃を下回り、つゆがなく夏もすずしい。" },
    "新潟（日本海側の気候）": { t: [2.5, 3.1, 6.2, 11.3, 16.7, 20.9, 24.9, 26.5, 22.5, 16.7, 10.5, 5.3], p: [180.9, 115.8, 112, 97.2, 94.4, 121.1, 222.3, 163.4, 151.9, 157.7, 203.5, 225.9], hint: "冬に北西の季節風で雪が多く、冬の降水量が多い。" },
    "東京（太平洋側の気候）": { t: [5.4, 6.1, 9.4, 14.3, 18.8, 21.9, 25.7, 26.9, 23.3, 18, 12.5, 7.7], p: [59.7, 56.5, 116, 133.7, 139.7, 167.8, 156.2, 154.7, 224.9, 234.8, 96.3, 57.9], hint: "夏から秋に降水量が多く、冬はかんそうする。" },
    "松本（中央高地の気候）": { t: [-0.3, 0.6, 4.6, 10.8, 16.5, 20.2, 24.2, 25.1, 20.4, 13.9, 7.8, 2.5], p: [39.8, 38.5, 78, 81.1, 94.5, 114.9, 131.3, 101.6, 148, 128.3, 56.3, 32.7], hint: "1年を通して降水量が少なく、夏と冬の気温差が大きい。" },
    "高松（瀬戸内の気候）": { t: [5.9, 6.3, 9.4, 14.7, 19.8, 23.3, 27.5, 28.6, 24.7, 19, 13.2, 8.1], p: [39.4, 45.8, 81.4, 74.6, 100.9, 153.1, 159.8, 106, 167.4, 120.1, 55, 46.7], hint: "山地に季節風がさえぎられ、1年を通して降水量が少なく温暖。" },
    "那覇（南西諸島の気候）": { t: [17.3, 17.5, 19.1, 21.5, 24.2, 27.2, 29.1, 29, 27.9, 25.5, 22.5, 19], p: [101.6, 114.5, 142.8, 161, 245.3, 284.4, 188.1, 240, 275.2, 179.2, 119.1, 110], hint: "1年中あたたかく、冬も15℃以上。降水量が多い。" },
  };
  const climSvg = (k) => { const d = CLIM[k], x0 = 44, y0 = 170, w = 18, ht = 150; const Yt = (v) => y0 - ((v + 10) / 40) * ht, Yp = (v) => y0 - (v / 400) * ht; let s = "";
    for (let v = -10; v <= 30; v += 10) s += L([x0, Yt(v)], [x0 + 12 * w + 6, Yt(v)], { color: COL.grid, w: 1 }) + T(x0 - 4, Yt(v), String(v), { size: 9, anchor: "end", color: COL.red }) + T(x0 + 12 * w + 10, Yt(v), String(((v + 10) / 40) * 400), { size: 9, anchor: "start", color: COL.blue });
    d.p.forEach((v, i) => (s += '<rect x="' + f1(x0 + 4 + i * w) + '" y="' + f1(Yp(v)) + '" width="' + (w - 4) + '" height="' + f1(y0 - Yp(v)) + '" fill="#74c0fc"/>' + T(x0 + 3 + i * w + w / 2, y0 + 10, String(i + 1), { size: 9 })));
    s += '<polyline points="' + d.t.map((v, i) => f1(x0 + 3 + i * w + w / 2) + "," + f1(Yt(v))).join(" ") + '" fill="none" stroke="' + COL.red + '" stroke-width="2.5"/>' + d.t.map((v, i) => C(x0 + 3 + i * w + w / 2, Yt(v), 2.5, { fill: COL.red, color: COL.red, w: 1 })).join("");
    s += T(x0 - 4, 10, "℃", { size: 10, color: COL.red, anchor: "end" }) + T(x0 + 12 * w + 10, 10, "mm", { size: 10, color: COL.blue, anchor: "start" }) + T(x0 + 6 * w, y0 + 22, "（月）", { size: 9, color: COL.mute });
    return fig(x0 + 12 * w + 44, y0 + 28, s); };
  const climQ = () => { const k = pick(Object.keys(CLIM)); return ch("この雨温図にあてはまる都市は？（赤い線＝気温、青いぼう＝降水量）" + climSvg(k), k, shuf(Object.keys(CLIM).filter((x) => x !== k)), CLIM[k].hint); };
  const climRead = () => { const k = pick(Object.keys(CLIM)), d = CLIM[k], mx = Math.max(...d.p), m = d.p.indexOf(mx) + 1; return num("この雨温図（" + k.split("（")[0] + "）で、降水量がいちばん多いのは何月？" + climSvg(k), m, "いちばん高い青いぼうは " + m + "月（" + mx + "mm。気象庁の平年値 1991〜2020年）。", { unit: "月", chk: String(m) }); };

  // ===== 緯度・経度 =====
  const globeSvg = (mark) => { let s = C(110, 100, 80, { fill: "#d0ebff" }); [-60, -30, 0, 30, 60].forEach((la) => { const y = 100 - Math.sin((la * Math.PI) / 180) * 80, hw = Math.cos((la * Math.PI) / 180) * 80; s += L([110 - hw, y], [110 + hw, y], { color: la === 0 ? COL.red : "#4dabf7", w: la === 0 ? 3 : 1.5 }); });
    s += '<ellipse cx="110" cy="100" rx="0.1" ry="80" fill="none" stroke="#2f9e44" stroke-width="2.5"/>' + L([110, 20], [110, 180], { color: "#2f9e44", w: 2.5 }) + '<ellipse cx="110" cy="100" rx="45" ry="80" fill="none" stroke="#4dabf7" stroke-width="1.2"/>';
    s += T(110, 12, "北極", { size: 11 }) + T(110, 192, "南極", { size: 11 }); if (mark === "eq") s += T(204, 100, "あ", { size: 14, color: COL.red, bold: true, anchor: "start" }); else s += T(118, 40, "あ", { size: 14, color: "#2f9e44", bold: true, anchor: "start" }); return fig(230, 200, s); };
  const globeQ = () => pick([ch("地球儀の赤い線「あ」（緯度0度の線）を何という？" + globeSvg("eq"), "赤道", ["本初子午線", "日付変更線", "北回帰線"], "緯度0度の線が赤道。赤道より北が北緯、南が南緯。"), ch("緑の線「あ」（経度0度の経線。イギリスのロンドンを通る）を何という？" + globeSvg("pm"), "本初子午線", ["赤道", "日付変更線", "南回帰線"], "経度0度の経線が本初子午線。東側が東経、西側が西経。")]);

  // ===== 時差の図（経度15度で1時間） =====
  const tzQ = () => { const a = pick([0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150]), b = 135; if (a === b) return null; const h = (b - a) / 15, t0 = R(0, 23), t1 = (t0 - h + 24) % 24; let s = L([20, 60], [300, 60], { w: 2 }); for (let lo = 0; lo <= 180; lo += 15) { const x = 20 + (lo / 180) * 280; s += L([x, 54], [x, 66], { w: 1.2 }) + (lo % 45 === 0 ? T(x, 80, lo + "°", { size: 9 }) : ""); } const X = (lo) => 20 + (lo / 180) * 280; s += C(X(b), 60, 7, { fill: COL.red, color: COL.red }) + T(X(b), 40, "東京（東経135度）", { size: 10, color: COL.red }) + C(X(a), 60, 7, { fill: COL.blue, color: COL.blue }) + T(X(a), 24, "A（" + (a === 0 ? "経度0度" : a === 180 ? "経度180度" : "東経" + a + "度") + "）", { size: 10, color: COL.blue });
    return num("東京が " + t0 + "時のとき、Aの地点は何時？（0〜23時で答える）" + fig(320, 90, s), t1, "経度の差は " + Math.abs(b - a) + "度。15度で1時間なので時差は" + Math.abs(h) + "時間。" + (h > 0 ? "Aは東京より西にあるので " + h + "時間おくれて " + t1 + "時。" : "Aは東京より東にあるので " + -h + "時間進んで " + t1 + "時。") + "（日付をまたぐときは24時間でくり上げ・くり下げる）", { unit: "時", chk: t0 - h < 0 ? t0 + "-(" + h + ")+24" : t0 - h >= 24 ? t0 + "-(" + h + ")-24" : t0 + "-(" + h + ")" }); };

  A(3, "わたしたちのまち", [["地図記号（図）", symQ(pool3)], ["八方位（図）", roseQ], ["反対の方位（図）", oppQ, 6]]);
  A(5, "日本の国土", [["雨温図を読もう（図）", climQ], ["雨温図の数字（図）", climRead, 6], ["緯線と経線（図）", globeQ, 4]]);
  A(7, "時差（計算）", [["時差の図（図）", () => tzQ() || tzQ() || tzQ() || globeQ()]]);
  A(7, "世界の姿", [["赤道と本初子午線（図）", globeQ, 4]]);
  A(8, "地域調査と地形図", [["地図記号（図）", symQ(KEYS)], ["縮尺と実際のきょり（図）", scaleQ], ["等高線とかたむき（図）", () => (R(0, 1) ? contourQ() : contourTF())], ["等高線の間かく", contourHeight, 4]]);
  A(8, "日本の地域的特色", [["気候区分と雨温図（図）", climQ]]);
})(typeof window !== "undefined" ? window : globalThis);
