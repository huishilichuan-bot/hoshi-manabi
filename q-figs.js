/* ほしまなび — v1.2 図をつかった問題（日本地図・世界の大陸・方位・こん虫・花・人の体・月・回路・てこ・温度計）。図はすべてオリジナルのかんたんな絵 */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, F = HM.F, { R, pick, shuf, num, ch, svg } = U;
  const A = HM.addGen;
  const fig = (w, h, inner) => svg(w, h, inner, "qfig");
  const g = (id, inner) => '<g data-hit="' + id + '">' + inner + "</g>";
  const poly = (pts, fill) => '<polygon points="' + pts + '" fill="' + fill + '" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>';

  // ---------- かんたんな日本地図（8地方・おおまかな形） ----------
  const REG = [
    ["hokkaido", "北海道地方", "#74c0fc", "214,30 248,14 292,30 284,58 258,84 232,74 214,58"],
    ["tohoku", "東北地方", "#63e6be", "214,96 238,92 250,112 252,150 242,176 222,180 206,160 204,126"],
    ["kanto", "関東地方", "#ffa8a8", "214,184 242,180 256,198 252,222 232,228 212,214"],
    ["chubu", "中部地方", "#ffd43b", "156,186 182,168 206,162 212,184 210,214 196,232 172,236 158,220"],
    ["kinki", "近畿地方", "#b197fc", "124,214 154,206 162,226 158,258 142,272 128,258 120,236"],
    ["chugoku", "中国地方", "#ffc078", "50,218 86,210 118,212 120,234 92,244 56,240"],
    ["shikoku", "四国地方", "#8ce99a", "78,254 104,250 128,254 124,272 96,280 76,272"],
    ["kyushu", "九州地方", "#ff8787", "18,250 44,246 58,262 56,292 38,314 20,300 12,272"],
  ];
  function japanMap() {
    let s = '<rect x="0" y="0" width="300" height="330" rx="16" fill="#e7f5ff"/>';
    for (const [id, , c, pts] of REG) s += g(id, poly(pts, c) + (id === "kyushu" ? '<rect x="196" y="282" width="90" height="40" rx="8" fill="none" stroke="#a5d8ff" stroke-dasharray="4 3"/><circle cx="214" cy="306" r="5" fill="' + c + '"/><circle cx="232" cy="298" r="4" fill="' + c + '"/><circle cx="248" cy="292" r="3" fill="' + c + '"/>' : ""));
    s += '<text x="241" y="278" font-size="9" fill="#4a6c8a" text-anchor="middle">（沖縄の島々）</text>';
    return fig(300, 330, s);
  }
  F.japanMap = japanMap;
  const PREF = { "北海道地方": "北海道", "東北地方": "青森県 岩手県 宮城県 秋田県 山形県 福島県", "関東地方": "茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県", "中部地方": "新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県", "近畿地方": "三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県", "中国地方": "鳥取県 島根県 岡山県 広島県 山口県", "四国地方": "徳島県 香川県 愛媛県 高知県", "九州地方": "福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県" };
  const hitsJP = REG.map((r) => [r[0], r[1]]);
  const jpRegion = (d) => { const r = pick(REG); return F.tap(r[1] + "はどこ？ 地図をタップしよう", japanMap(), hitsJP, r[0], r[1] + "には " + PREF[r[1]].split(" ").join("・") + " がある。"); };
  const jpPref = (d) => { const r = pick(REG.filter((x) => x[0] !== "hokkaido")); const p = pick(PREF[r[1]].split(" ")); return F.tap(p + "がある地方を、地図でタップしよう", japanMap(), hitsJP, r[0], p + "は" + r[1] + "。" + r[1] + "の都府県：" + PREF[r[1]].split(" ").join("・") + "。", { prefOf: p }); };
  F.PREF = PREF;
  A("soc", 4, "47都道府県（表で練習）", [["地図で地方をタップ", jpRegion, 8], ["県がある地方をタップ", jpPref, 8]]);
  A("soc", 5, "日本の国土", [["地図で地方をタップ", jpRegion, 8]]);
  A("soc", 8, "日本の諸地域", [["県がある地方をタップ", jpPref, 8]]);

  // ---------- 世界の大陸（おおまかな形） ----------
  const CONT = [
    ["eurasia", "ユーラシア大陸", "#ffd43b", "150,30 250,26 300,44 292,86 262,108 236,104 214,118 196,98 172,96 152,80 140,56"],
    ["africa", "アフリカ大陸", "#ffa94d", "142,96 176,100 196,118 190,150 172,184 158,186 150,150 132,124"],
    ["namerica", "北アメリカ大陸", "#69db7c", "20,34 80,24 110,40 100,66 78,86 62,104 50,88 30,64"],
    ["samerica", "南アメリカ大陸", "#38d9a9", "70,112 96,118 104,138 92,170 80,196 72,190 66,150 62,124"],
    ["australia", "オーストラリア大陸", "#f783ac", "250,148 284,144 296,164 282,180 254,178 244,164"],
    ["antarctica", "南極大陸", "#dee2e6", "40,214 120,206 200,208 290,214 280,226 50,226"],
  ];
  function worldMap() { let s = '<rect x="0" y="0" width="320" height="236" rx="14" fill="#d0ebff"/>'; for (const [id, , c, pts] of CONT) s += g(id, poly(pts, c)); return fig(320, 236, s); }
  F.worldMap = worldMap;
  const worldQ = (d) => { const c = pick(CONT); return F.tap(c[1] + "はどれ？ 地図をタップしよう", worldMap(), CONT.map((x) => [x[0], x[1]]), c[0], "六大陸は ユーラシア・アフリカ・北アメリカ・南アメリカ・オーストラリア・南極。" + c[1] + "はこの位置。"); };
  A("soc", 7, "世界の姿", [["地図で大陸をタップ", worldQ, 6]]);

  // ---------- 八方位 ----------
  const DIR = [["n", "北"], ["ne", "北東"], ["e", "東"], ["se", "南東"], ["s", "南"], ["sw", "南西"], ["w", "西"], ["nw", "北西"]];
  function compass() { let s = '<circle cx="110" cy="110" r="96" fill="#fff9db" stroke="#e9c46a" stroke-width="3"/>'; DIR.forEach(([id], i) => { const a = (i * Math.PI) / 4; const x = 110 + Math.sin(a) * 74, y = 110 - Math.cos(a) * 74; s += '<line x1="110" y1="110" x2="' + (110 + Math.sin(a) * 58).toFixed(1) + '" y2="' + (110 - Math.cos(a) * 58).toFixed(1) + '" stroke="#adb5bd" stroke-width="' + (i % 2 ? 2 : 4) + '"/>' + g(id, '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="17" fill="#fff" stroke="#f08c00" stroke-width="3"/>' + (id === "n" ? '<text x="' + x.toFixed(1) + '" y="' + (y + 6).toFixed(1) + '" font-size="16" font-weight="700" text-anchor="middle" fill="#e03131">北</text>' : "")); }); s += '<circle cx="110" cy="110" r="6" fill="#f08c00"/>'; return fig(220, 220, s); }
  const compassQ = (d) => { const t = pick(DIR.slice(1)); return F.tap("「北」をもとにして、" + t[1] + "の〇をタップしよう", compass(), DIR, t[0], "北の反対が南、北を向いて右が東・左が西。" + t[1] + "は " + (t[1].length === 2 ? t[1][0] + "と" + t[1][1] + "のあいだ" : "この向き") + "。"); };
  A("soc", 3, "わたしたちのまち", [["方位をタップ", compassQ, 7]]);

  // ---------- 理科：こん虫の体 ----------
  function insect() {
    let s = g("head", '<circle cx="60" cy="80" r="22" fill="#ffd8a8" stroke="#e8590c" stroke-width="3"/><circle cx="52" cy="74" r="4" fill="#333"/><path d="M50 60 Q40 30 26 24 M62 58 Q66 28 80 20" stroke="#e8590c" stroke-width="3" fill="none"/>');
    s += g("thorax", '<ellipse cx="112" cy="80" rx="28" ry="22" fill="#ffc078" stroke="#e8590c" stroke-width="3"/>' + [96, 112, 128].map((x) => '<path d="M' + x + " 98 L" + (x - 10) + " 132 M" + x + " 62 L" + (x - 10) + ' 28" stroke="#e8590c" stroke-width="3" fill="none"/>').join(""));
    s += g("abdomen", '<ellipse cx="190" cy="80" rx="50" ry="27" fill="#ffa94d" stroke="#e8590c" stroke-width="3"/><path d="M168 56 Q172 80 168 104 M190 54 Q194 80 190 106 M212 57 Q216 80 212 103" stroke="#e8590c" stroke-width="2" fill="none"/>');
    return fig(250, 150, s);
  }
  const INS = [["head", "頭"], ["thorax", "むね"], ["abdomen", "はら"]];
  const insQ = (d) => { const k = R(0, 4); if (k === 3) return F.tap("こん虫のあしがついているのは、どの部分？ タップしよう", insect(), INS, "thorax", "こん虫の体は頭・むね・はらの3つ。あし6本（とはね）は むね についている。"); if (k === 4) return F.tap("目やしょっかくがあるのは、どの部分？", insect(), INS, "head", "頭には目・口・しょっかくがある。"); const t = INS[k]; return F.tap("こん虫の「" + t[1] + "」はどこ？ タップしよう", insect(), INS, t[0], "こん虫の体は 頭・むね・はら の3つの部分に分かれている。"); };
  A("sci", 3, "こん虫の育ち方とつくり", [["体のつくりをタップ", insQ, 5]]);

  // ---------- 理科：花のつくり ----------
  function flower() {
    let s = '<path d="M110 150 L110 196" stroke="#2f9e44" stroke-width="5"/>';
    s += g("sepal", '<path d="M110 150 L84 172 L100 150 Z M110 150 L136 172 L120 150 Z" fill="#69db7c" stroke="#2b8a3e" stroke-width="2"/><path d="M88 150 Q110 168 132 150 Z" fill="#69db7c" stroke="#2b8a3e" stroke-width="2"/>');
    s += g("petal", [-60, -20, 20, 60].map((a) => '<ellipse cx="110" cy="96" rx="20" ry="48" transform="rotate(' + a + ' 110 146)" fill="#ffc9de" stroke="#e64980" stroke-width="2"/>').join(""));
    s += g("stamen", [-26, -14, 14, 26].map((dx) => '<line x1="110" y1="146" x2="' + (110 + dx) + '" y2="104" stroke="#f59f00" stroke-width="3"/><ellipse cx="' + (110 + dx) + '" cy="100" rx="6" ry="5" fill="#ffd43b" stroke="#f08c00" stroke-width="2"/>').join(""));
    s += g("pistil", '<path d="M104 146 Q100 132 106 122 L108 92 L112 92 L114 122 Q120 132 116 146 Z" fill="#a9e34b" stroke="#5c940d" stroke-width="2"/><circle cx="110" cy="90" r="6" fill="#d8f5a2" stroke="#5c940d" stroke-width="2"/>');
    return fig(220, 200, s);
  }
  const FLW = [["pistil", "めしべ"], ["stamen", "おしべ"], ["petal", "花びら"], ["sepal", "がく"]];
  const flwQ = (d) => { const k = R(0, 5); if (k === 4) return F.tap("花粉が入っている「やく」があるのはどれ？", flower(), FLW, "stamen", "花粉は おしべ の先（やく）でつくられる。"); if (k === 5) return F.tap("花粉がついたあと、根もとがふくらんで実になるのはどれ？", flower(), FLW, "pistil", "めしべの先に花粉がつく（受粉）と、めしべのもとが育って実になる。"); const t = FLW[k]; return F.tap("「" + t[1] + "」はどれ？ タップしよう", flower(), FLW, t[0], "花の中心から めしべ → おしべ → 花びら → がく の順にならんでいる。"); };
  A("sci", 5, "花から実へ", [["花のつくりをタップ", flwQ, 6]]);

  // ---------- 理科：人の体 ----------
  function body() {
    let s = '<circle cx="110" cy="40" r="26" fill="#ffe8cc" stroke="#d9480f" stroke-width="2"/><path d="M60 80 Q110 60 160 80 L170 300 Q110 320 50 300 Z" fill="#fff4e6" stroke="#d9480f" stroke-width="2"/>';
    s += g("lung", '<path d="M72 92 Q90 82 102 94 L102 160 Q84 168 70 156 Z M148 92 Q130 82 118 94 L118 160 Q136 168 150 156 Z" fill="#ffc9c9" stroke="#e03131" stroke-width="2"/>');
    s += g("heart", '<path d="M110 150 C96 136 96 118 108 120 C112 120 114 124 116 128 C118 122 122 118 128 120 C138 124 132 140 110 150 Z" fill="#e03131" stroke="#a51111" stroke-width="2"/>');
    s += g("liver", '<path d="M64 168 Q100 160 120 172 Q100 196 66 192 Z" fill="#a0522d" stroke="#6b3410" stroke-width="2"/>');
    s += g("stomach", '<path d="M124 170 Q150 166 152 186 Q150 210 128 206 Q120 196 130 190 Q120 180 124 170 Z" fill="#f783ac" stroke="#c2255c" stroke-width="2"/>');
    s += g("large", '<path d="M70 212 L150 212 L150 290 L70 290 Z M84 224 L84 280 L136 280 L136 224 Z" fill="#ffd8a8" stroke="#e8590c" stroke-width="2" fill-rule="evenodd"/>');
    s += g("small", '<path d="M88 228 Q110 220 132 228 Q110 238 88 244 Q110 252 132 248 Q110 262 88 262 Q110 270 132 274" fill="none" stroke="#f59f00" stroke-width="7" stroke-linecap="round"/>');
    return fig(220, 320, s);
  }
  const BODY = [["lung", "肺"], ["heart", "心臓"], ["liver", "かん臓"], ["stomach", "胃"], ["small", "小腸"], ["large", "大腸"]];
  const BODYEX = { lung: "肺は空気中の酸素を取り入れ、二酸化炭素を出す。", heart: "心臓は血液を全身に送り出すポンプ。", liver: "かん臓は養分をたくわえたり、体に害のあるものを分解したりする。", stomach: "胃は食べ物を消化液でとかす。", small: "小腸は消化された養分を吸収する。", large: "大腸は主に水分を吸収する。" };
  const bodyQ = (d) => { if (R(0, 2) === 0) { const t = pick(BODY); const hint = { lung: "酸素を取り入れる", heart: "血液を全身に送り出す", liver: "養分をたくわえる", stomach: "食べ物を消化液でとかす（ふくろの形）", small: "消化された養分を吸収する（長い管）", large: "水分を吸収する（まわりをかこむ太い管）" }[t[0]]; return F.tap(hint + "はたらきをする部分をタップしよう", body(), BODY, t[0], BODYEX[t[0]]); } const t = pick(BODY); return F.tap("「" + t[1] + "」はどこ？ タップしよう", body(), BODY, t[0], BODYEX[t[0]]); };
  A("sci", 6, "人や動物の体", [["体の中をタップ", bodyQ, 8]]);

  // ---------- 理科：月の形 ----------
  const moon = (k, cx) => { const r = 26, cy = 40; if (k === "full") return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#ffe066" stroke="#f59f00" stroke-width="2"/>'; if (k === "new") return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#343a40" stroke="#868e96" stroke-width="2"/>'; const base = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#343a40" stroke="#868e96" stroke-width="2"/>'; if (k === "half") return base + '<path d="M' + cx + " " + (cy - r) + " A" + r + " " + r + " 0 0 1 " + cx + " " + (cy + r) + ' Z" fill="#ffe066"/>'; return base + '<path d="M' + cx + " " + (cy - r) + " A" + r + " " + r + " 0 0 1 " + cx + " " + (cy + r) + " A" + r * 0.6 + " " + r + " 0 0 0 " + cx + " " + (cy - r) + ' Z" fill="#ffe066"/>'; };
  const MOON = [["new", "新月"], ["crescent", "三日月"], ["half", "上弦の月（半月）"], ["full", "満月"]];
  const moonQ = (d) => { const order = shuf(MOON.slice()); const s = order.map((m, i) => g(m[0], '<rect x="' + (6 + i * 74) + '" y="6" width="68" height="68" rx="12" fill="#1c2541"/>' + moon(m[0], 40 + i * 74))).join(""); const t = pick(MOON); return F.tap("「" + t[1] + "」はどれ？ タップしよう", fig(304, 80, s), MOON, t[0], "月は新月 → 三日月 → 上弦の月（半月） → 満月 の順に、右側から光って見える部分が大きくなる。"); };
  const CYC = ["新月", "三日月", "上弦の月", "満月", "下弦の月"];
  const moonOrd = (d) => { const st = R(0, 4); const items = [0, 1, 2, 3].map((k) => CYC[(st + k) % 5]); return F.ord("「" + items[0] + "」から、月の形が変わる順にならべよう", items, "新月 → 三日月 → 上弦の月 → 満月 → 下弦の月 → 新月…と約1か月でくり返す。", { vals: [0, 1, 2, 3], dir: "asc" }); };
  A("sci", 4, "月と星", [["月の形をタップ・ならべる", (d) => (R(0, 1) ? moonQ(d) : moonOrd(d)), 8]]);

  // ---------- 理科：回路 ----------
  function circuit(kind, x0) {
    // 電池（左・たて）と豆電球（右）。kind: ok（輪になる）/ gap（とちゅうが切れている）/ same（＋極だけにつないでいる）
    const X = (v) => x0 + v;
    let s = '<rect x="' + X(18) + '" y="48" width="20" height="46" rx="4" fill="#ffd43b" stroke="#333" stroke-width="2"/><rect x="' + X(24) + '" y="42" width="8" height="6" fill="#333"/><text x="' + X(28) + '" y="62" font-size="11" text-anchor="middle">+</text><text x="' + X(28) + '" y="88" font-size="13" text-anchor="middle">−</text>';
    s += '<circle cx="' + X(72) + '" cy="48" r="13" fill="#f1f3f5" stroke="#333" stroke-width="2"/><rect x="' + X(64) + '" y="60" width="16" height="12" fill="#adb5bd" stroke="#333" stroke-width="1.5"/>';
    let d = "M" + X(28) + " 42 L" + X(28) + " 30 L" + X(50) + " 30 L" + X(50) + " 80 L" + X(68) + " 80 L" + X(68) + " 72 ";
    if (kind === "ok") d += "M" + X(28) + " 94 L" + X(28) + " 108 L" + X(76) + " 108 L" + X(76) + " 72";
    else if (kind === "gap") d += "M" + X(28) + " 94 L" + X(28) + " 108 L" + X(46) + " 108 M" + X(58) + " 108 L" + X(76) + " 108 L" + X(76) + " 72";
    else d += "M" + X(76) + " 72 L" + X(76) + " 108 L" + X(8) + " 108 L" + X(8) + " 36 L" + X(25) + " 36 L" + X(25) + " 42";
    s += '<path d="' + d + '" fill="none" stroke="#1971c2" stroke-width="3" stroke-linejoin="round"/>';
    return s;
  }
  const circQ = (d) => { const kinds = shuf(["ok", "gap", "same"]); const L = ["A", "B", "C"]; let s = ""; kinds.forEach((k, i) => { s += g(L[i], '<rect x="' + (4 + i * 104) + '" y="4" width="98" height="120" rx="12" fill="#f8f9fa" stroke="#dee2e6"/>' + circuit(k, 14 + i * 104) + '<text x="' + (12 + i * 104) + '" y="20" font-size="13" font-weight="700" fill="#5b4ce0">' + L[i] + "</text>"); }); const ans = L[kinds.indexOf("ok")]; return F.tap("豆電球に明かりがつくのはどれ？ タップしよう", fig(318, 128, s), L.map((x) => [x, x]), ans, "電池の＋極 → 豆電球 → 電池の−極 と、1つの輪のように切れ目なくつながると電気が流れて明かりがつく。とちゅうが切れていたり、＋極だけにつないだりするとつかない。"); };
  A("sci", 3, "電気とじしゃく", [["明かりがつく回路", circQ, 3]]);

  // ---------- 理科：てこのつり合い ----------
  function lever(w1, d1, w2, d2, ask) {
    let s = '<polygon points="160,104 148,128 172,128" fill="#868e96"/><rect x="20" y="98" width="280" height="6" rx="3" fill="#495057"/>';
    for (let i = 1; i <= 6; i++) s += '<line x1="' + (160 - i * 22) + '" y1="98" x2="' + (160 - i * 22) + '" y2="92" stroke="#495057"/><line x1="' + (160 + i * 22) + '" y1="98" x2="' + (160 + i * 22) + '" y2="92" stroke="#495057"/><text x="' + (160 - i * 22) + '" y="120" font-size="9" text-anchor="middle" fill="#495057">' + i + '</text><text x="' + (160 + i * 22) + '" y="120" font-size="9" text-anchor="middle" fill="#495057">' + i + "</text>";
    const wt = (x, w, lab) => '<line x1="' + x + '" y1="104" x2="' + x + '" y2="128" stroke="#333"/><rect x="' + (x - 18) + '" y="128" width="36" height="26" rx="5" fill="' + (lab ? "#ffe3e3" : "#d0ebff") + '" stroke="#333"/><text x="' + x + '" y="146" font-size="12" font-weight="700" text-anchor="middle">' + (lab || w + "g") + "</text>";
    s += wt(160 - d1 * 22, w1) + wt(160 + d2 * 22, w2, ask ? "？" : null);
    return fig(320, 160, s);
  }
  const levQ = (d) => { let w1, d1, d2, w2; do { w1 = pick([10, 20, 30, 40, 60]); d1 = R(1, 6); d2 = R(1, 6); w2 = (w1 * d1) / d2; } while (!Number.isInteger(w2) || d1 === d2); return num("てこが水平につり合うとき、右のおもりは何g？（目もりは支点からのきょり）" + lever(w1, d1, w2, d2, true), w2, "左：" + w1 + "×" + d1 + "＝" + w1 * d1 + "。右も おもさ×きょり が同じになるので、□×" + d2 + "＝" + w1 * d1 + "、□＝" + w2 + "g。", { chk: w1 + "*" + d1 + "/" + d2, unit: "g" }); };
  A("sci", 6, "てこと電気の利用", [["図でてこのつり合い", levQ, 8]]);

  // ---------- 理科：温度計 ----------
  function thermo(t) { let s = '<rect x="40" y="10" width="20" height="200" rx="10" fill="#fff" stroke="#495057" stroke-width="2"/><circle cx="50" cy="222" r="16" fill="#e03131"/>'; const y = (v) => 200 - (v + 10) * 4; for (let v = -10; v <= 40; v++) { const yy = y(v); s += '<line x1="60" y1="' + yy + '" x2="' + (v % 5 ? 66 : v % 10 ? 70 : 74) + '" y2="' + yy + '" stroke="#495057" stroke-width="' + (v % 10 ? 1 : 1.6) + '"/>'; if (v % 10 === 0) s += '<text x="78" y="' + (yy + 4) + '" font-size="11" fill="#212529">' + v + "</text>"; } s += '<rect x="46" y="' + y(t) + '" width="8" height="' + (214 - y(t)) + '" fill="#e03131"/>'; return fig(110, 244, s); }
  const thQ = (d) => { const t = R(d < 0.5 ? 0 : -8, 38); return num("温度計は何度をさしている？（1目もり1度）" + thermo(t), t, "赤い液の先の目もりを、真横から読む。10度ごとの数字から数えて " + t + "度。", { chk: String(t), unit: "度" }); };
  A("sci", 4, "天気と気温", [["温度計を読もう", thQ, 8]]);
})(typeof window !== "undefined" ? window : globalThis);
