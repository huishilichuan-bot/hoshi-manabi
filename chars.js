/* ほしまなび — なかまキャラクターの絵（SVG・すべてオリジナル） */
(() => {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ---------- キャラクター（7レアリティ・40種類。すべてオリジナル） ----------
  const CHAR_STAGES = [[1, "あかちゃん"], [5, "こども"], [15, "おとな"], [30, "マスター"], [50, "レジェンド"]];
  const RARITIES = [
    { id: 0, n: "ノーマル", s: "N", c: "#8b959b" },
    { id: 1, n: "レア", s: "R", c: "#3f8fd2" },
    { id: 2, n: "スーパーレア", s: "SR", c: "#8a5cd6" },
    { id: 3, n: "ウルトラレア", s: "UR", c: "#e29a1f" },
    { id: 4, n: "激レア", s: "激", c: "#e0483a" },
    { id: 5, n: "伝説", s: "伝", c: "#c9a227" },
    { id: 6, n: "神話", s: "神", c: "#d94fb0" },
  ];
  // [id, 名前, レア, 体の色, ふち色, かざり, ひとこと]
  const CH = [
    ["mori", "もりっこ", 0, "#86cf7f", "#3f8c4a", "sprout", "森で生まれたなかま。いつも前向きで、最初の1問をいっしょに解く。"],
    ["pon", "ぽんた", 0, "#c9a47a", "#7a5634", "earsRound", "のんびり屋。むずかしい問題もあわてず考える。"],
    ["mochi", "もちもち", 0, "#fbf6ee", "#b9a894", "blush", "やわらかい頭で、ひらめくのが得意。"],
    ["kinoko", "きのこっこ", 0, "#f3e3c8", "#a8804f", "mushroom", "雨の日は読書の日。森のすみっこの図書係。"],
    ["shizuku", "しずく", 0, "#9fd3f2", "#3a86b8", "drop", "朝つゆのなかま。朝の5分勉強が日課。"],
    ["kumo", "くもすけ", 0, "#e8eef4", "#8fa3b5", "cloud", "ふわふわ浮かんで、空の天気を観察している。"],
    ["donguri", "どんぐりん", 0, "#d79a5b", "#8a5a2b", "acorn", "コツコツ集めるのが得意。⭐も毎日1つずつ。"],
    ["piyo", "ぴよまる", 0, "#ffe27a", "#c9a21c", "bow", "早起きのなかま。朝の音読がすき。"],
    ["ishi", "いしころう", 0, "#b8bdc2", "#6f767c", "pebble", "かたい決意。まちがえても動じない。"],
    ["wata", "わたぼう", 0, "#f6efe6", "#c5b39c", "antenna", "風に乗ってどこへでも。地図を見るのが好き。"],
    ["sakura", "さくらん", 1, "#f7b6c8", "#d9668b", "flower", "春のようにやさしい。ノートの字がきれい。"],
    ["neko", "ねこまる", 1, "#f2c48d", "#b87a3a", "earsCat", "気まぐれだけど、計算は毎日。"],
    ["usagi", "うさみん", 1, "#fde8ef", "#d48aa3", "earsBunny", "耳がいい。英語の発音をすぐまねできる。"],
    ["ringo", "りんごろう", 1, "#f07a6a", "#a83a2e", "cherry", "理科の実験が大好き。りんごが落ちる理由を考え中。"],
    ["mikan", "みかんぼう", 1, "#ffb347", "#c76f12", "leaf", "冬になると元気。こたつで漢字の練習。"],
    ["mame", "そらまめ", 1, "#a9dc7c", "#5d9a34", "sprout2", "小さくても、まっすぐ伸びる。"],
    ["beret", "べれっこ", 1, "#b9a3e3", "#6c55a8", "beret", "絵をかくのが好き。図形の問題が得意。"],
    ["megane", "めがねくん", 1, "#cfe3d6", "#5f8a72", "glasses", "表とグラフの達人。数字に強い。"],
    ["kaede", "かえでちゃん", 1, "#f4a259", "#b5562a", "maple", "秋が好き。落ち葉でしおりを作って本を読む。"],
    ["yoru", "よるのこ", 2, "#8796db", "#3d4a8f", "moonSmall", "夜ふかしをしない、早寝早起きの達人。"],
    ["gorogoro", "ごろぴか", 2, "#ffe36e", "#b89412", "lightning", "ひらめきの速さはいちばん。"],
    ["hyouka", "ひょうか", 2, "#c8ecf7", "#4fa3c4", "ice", "クールに考える。あわてて答えない。"],
    ["tsukimi", "つきみ", 2, "#f5e9b8", "#b59b3d", "moon", "月の満ち欠けにくわしい。"],
    ["mahorin", "まほりん", 2, "#d9b8f2", "#8045b8", "wizard", "むずかしい問題を解く呪文を研究中。"],
    ["honoka", "ほのか", 2, "#ff9a76", "#c8452b", "flame", "やる気の炎。でも火の用心。"],
    ["otone", "おとね", 2, "#9ee0d0", "#2f9a82", "headphones", "音楽と英語の歌が大好き。"],
    ["kin", "きんぴか", 3, "#f4d35e", "#b8861b", "coin", "たくさん学んでかがやく、金色のなかま。"],
    ["hinata", "ひなた", 3, "#ffd36b", "#d98a13", "sun", "まわりを明るくする、おひさま。"],
    ["haneru", "はねる", 3, "#f3f6ff", "#8f9cc9", "wings", "身軽が一番。ランドセルはいつも整理整とん。"],
    ["hakase", "はかせ", 3, "#d7e3ea", "#5a6f7c", "tophat", "なんでも調べてから答える、物知り博士。"],
    ["namio", "なみお", 3, "#7cc6e8", "#1f6f9a", "wave", "大きな波も、こつこつ乗りこえる。"],
    ["kirara", "きらら", 3, "#f6c6ea", "#b04f98", "gem", "宝石みたいに、知識をみがく。"],
    ["hoshi", "ほしぞら", 4, "#4b3f8f", "#211a52", "stars", "星のように強い、ひらめきの天才。"],
    ["tatsu", "たつのしん", 4, "#7fd1a8", "#2c7a55", "horns", "空をかける竜のこども。"],
    ["tenshin", "てんしん", 4, "#fff7e0", "#c8a85a", "halo", "やさしい心で、まちがいをはげましてくれる。"],
    ["konko", "こんこ", 4, "#ffb070", "#c4621d", "earsFox", "ふさふさのしっぽで幸運を呼ぶ。"],
    ["niji", "にじまる", 5, "rainbow", "#7b4bb8", "rainbowArc", "すべての教科をきわめた人に会える、にじ色のなかま。"],
    ["ousama", "おうさま", 5, "royal", "#8a6a12", "crown", "森をおさめる、まじめな王さま。"],
    ["sekaiju", "せかいじゅ", 6, "#7bcf8e", "#2d7a45", "worldtree", "森のはじまりの木の精。"],
    ["ginga", "ぎんが", 6, "galaxy", "#120c3a", "ring", "宇宙をめぐる、伝説のさらに先。"],
  ];
  const HOW = { mori: "最初から一緒" };
  const CHARACTERS = CH.map(([id, name, rarity, color, dark, acc, desc]) => ({ id, name, rarity, color, dark, acc, desc, how: HOW[id] || "なかまガチャで出会える", special: !!HOW[id], rare: rarity >= 3 }));
  const stageIndex = (list, L) => { let idx = 0; list.forEach(([n], i) => { if (L >= n) idx = i; }); return idx; };
  const stageName = (L) => CHAR_STAGES[stageIndex(CHAR_STAGES, L)][1];
  let seq = 0;
  const charById = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
  const star = (x, y, r, fill) => { let p = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; p += (i ? "L" : "M") + (x + Math.cos(a) * rr).toFixed(1) + " " + (y + Math.sin(a) * rr).toFixed(1); } return '<path d="' + p + 'Z" fill="' + fill + '"/>'; };
  // かざり：back = 体の後ろ、front = 体の前
  function accSvg(c, st, eyeY, fill) {
    const d = c.dark;
    switch (c.acc) {
      case "earsRound": return { back: '<circle cx="30" cy="48" r="9" fill="' + fill + '" stroke="' + d + '" stroke-width="2.5"/><circle cx="70" cy="48" r="9" fill="' + fill + '" stroke="' + d + '" stroke-width="2.5"/><circle cx="30" cy="48" r="4" fill="' + d + '" opacity=".5"/><circle cx="70" cy="48" r="4" fill="' + d + '" opacity=".5"/>' };
      case "earsCat": return { back: '<path d="M28 58 L26 30 L46 46Z" fill="' + fill + '" stroke="' + d + '" stroke-width="2.5" stroke-linejoin="round"/><path d="M72 58 L74 30 L54 46Z" fill="' + fill + '" stroke="' + d + '" stroke-width="2.5" stroke-linejoin="round"/><path d="M31 48 L30 37 L39 45Z" fill="#f7a8b8"/><path d="M69 48 L70 37 L61 45Z" fill="#f7a8b8"/>' };
      case "earsBunny": return { back: '<ellipse cx="40" cy="28" rx="7" ry="20" fill="' + fill + '" stroke="' + d + '" stroke-width="2.5" transform="rotate(-10 40 28)"/><ellipse cx="60" cy="28" rx="7" ry="20" fill="' + fill + '" stroke="' + d + '" stroke-width="2.5" transform="rotate(10 60 28)"/><ellipse cx="40" cy="30" rx="3" ry="13" fill="#f7a8b8" transform="rotate(-10 40 30)"/><ellipse cx="60" cy="30" rx="3" ry="13" fill="#f7a8b8" transform="rotate(10 60 30)"/>' };
      case "earsFox": return { back: '<path d="M26 60 L22 24 L48 46Z" fill="' + fill + '" stroke="' + d + '" stroke-width="2.5" stroke-linejoin="round"/><path d="M74 60 L78 24 L52 46Z" fill="' + fill + '" stroke="' + d + '" stroke-width="2.5" stroke-linejoin="round"/><path d="M28 48 L26 32 L40 45Z" fill="#fff4e8"/><path d="M72 48 L74 32 L60 45Z" fill="#fff4e8"/><path d="M76 92 C96 88 98 66 88 60 C86 74 80 82 70 86Z" fill="' + fill + '" stroke="' + d + '" stroke-width="2"/><path d="M88 60 C92 64 92 70 90 74 C86 70 86 64 88 60Z" fill="#fff4e8"/>' };
      case "mushroom": return { front: '<path d="M22 54 C22 30 78 30 78 54 Z" fill="#e2493b" stroke="#9e2a20" stroke-width="2.5"/><circle cx="36" cy="44" r="4" fill="#fff"/><circle cx="56" cy="38" r="5" fill="#fff"/><circle cx="68" cy="48" r="3" fill="#fff"/>' };
      case "drop": return { front: '<path d="M50 24 C44 34 42 38 42 42 A8 8 0 0 0 58 42 C58 38 56 34 50 24Z" fill="#6ec3f2" stroke="#2f7fb3" stroke-width="2"/><circle cx="47" cy="40" r="2" fill="#fff" opacity=".8"/>' };
      case "cloud": return { front: '<g fill="#fff" stroke="#9fb1c2" stroke-width="2"><ellipse cx="50" cy="32" rx="16" ry="9"/><ellipse cx="38" cy="36" rx="9" ry="7"/><ellipse cx="62" cy="36" rx="9" ry="7"/></g>' };
      case "acorn": return { front: '<path d="M26 52 C26 36 74 36 74 52 Z" fill="#8a5a2b" stroke="#5a3815" stroke-width="2.5"/><path d="M30 46 L70 46 M32 41 L68 41" stroke="#6e4520" stroke-width="1.5"/><path d="M50 37 L52 30" stroke="#5a3815" stroke-width="3" stroke-linecap="round"/>' };
      case "bow": return { front: '<path d="M60 44 L72 36 L72 52 Z M60 44 L48 36 L48 52 Z" fill="#ff7aa2" stroke="#c23d68" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="44" r="3.5" fill="#c23d68"/>' };
      case "pebble": return { front: '<path d="M40 50 L46 44 M58 46 L62 52" stroke="' + d + '" stroke-width="2" stroke-linecap="round" opacity=".6"/>' };
      case "antenna": return { front: '<path d="M50 44 C50 36 48 30 44 24" stroke="' + d + '" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="43" cy="22" r="5" fill="#ffd8e4" stroke="' + d + '" stroke-width="2"/>' };
      case "flower": return { front: [0, 1, 2, 3, 4].map((i) => { const a = (i * 72 * Math.PI) / 180; return '<circle cx="' + (64 + Math.cos(a) * 6).toFixed(1) + '" cy="' + (42 + Math.sin(a) * 6).toFixed(1) + '" r="5" fill="#ffd1dc" stroke="#e27596" stroke-width="1.2"/>'; }).join("") + '<circle cx="64" cy="42" r="3.5" fill="#ffd34d"/>' };
      case "cherry": return { front: '<path d="M50 26 C46 32 44 36 42 40 M50 26 C54 32 58 36 60 40" stroke="#4a7a2c" stroke-width="2" fill="none"/><path d="M50 26 C56 22 62 24 64 26 C58 28 54 28 50 26Z" fill="#6cc070"/><circle cx="42" cy="42" r="5" fill="#d8323a"/><circle cx="60" cy="42" r="5" fill="#d8323a"/><circle cx="40.5" cy="40.5" r="1.4" fill="#fff"/><circle cx="58.5" cy="40.5" r="1.4" fill="#fff"/>' };
      case "leaf": return { front: '<path d="M50 44 L50 36" stroke="#4a7a2c" stroke-width="3" stroke-linecap="round"/><path d="M50 36 C58 26 70 30 68 36 C62 40 56 40 50 36Z" fill="#5db865" stroke="#3f8c4a" stroke-width="1.5"/>' };
      case "maple": return { front: '<path d="M50 44 L50 38" stroke="#8d5a38" stroke-width="2.5"/>' + '<path d="M50 20 L53 28 L61 25 L57 32 L64 35 L55 37 L56 42 L50 38 L44 42 L45 37 L36 35 L43 32 L39 25 L47 28 Z" fill="#e0533c" stroke="#a8321f" stroke-width="1.2" stroke-linejoin="round"/>' };
      case "sprout2": return { front: '<path d="M50 44 C50 34 48 28 46 22" stroke="#3f8c4a" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="40" cy="22" rx="7" ry="4" fill="#7bd17f" transform="rotate(-30 40 22)"/><ellipse cx="54" cy="18" rx="7" ry="4" fill="#5db865" transform="rotate(20 54 18)"/>' };
      case "beret": return { front: '<ellipse cx="46" cy="43" rx="22" ry="8" fill="#c0392b" transform="rotate(-10 46 43)"/><path d="M44 35 L46 30" stroke="#8e2a1f" stroke-width="3" stroke-linecap="round"/>' };
      case "glasses": return { front: '<g fill="rgba(255,255,255,.25)" stroke="#2b3a40" stroke-width="2.4"><circle cx="40" cy="' + eyeY + '" r="8"/><circle cx="60" cy="' + eyeY + '" r="8"/></g><path d="M48 ' + eyeY + ' L52 ' + eyeY + '" stroke="#2b3a40" stroke-width="2.4"/>' };
      case "moonSmall": return { front: '<circle cx="62" cy="38" r="8" fill="#fff2b3"/><circle cx="66" cy="35" r="7" fill="' + (fill.startsWith("url") ? "#3d4a8f" : fill) + '"/>' };
      case "lightning": return { front: '<path d="M54 18 L42 38 L50 38 L44 54 L60 32 L52 32 L58 18Z" fill="#ffd60a" stroke="#b38b00" stroke-width="1.8" stroke-linejoin="round"/>' };
      case "ice": return { front: '<g stroke="#5bc0de" stroke-width="2.5" stroke-linecap="round"><path d="M50 22 L50 46 M40 28 L60 40 M60 28 L40 40"/></g><circle cx="50" cy="34" r="3" fill="#e9fbff" stroke="#5bc0de" stroke-width="1.5"/>' };
      case "moon": return { back: '<circle cx="50" cy="66" r="44" fill="#fff6c9" opacity=".55"/>', front: '<path d="M44 22 A12 12 0 1 0 60 40 A9 9 0 1 1 44 22Z" fill="#ffe27a" stroke="#c9a21c" stroke-width="1.5"/>' };
      case "wizard": return { front: '<path d="M26 50 L54 10 L74 50 Z" fill="#5b3aa0" stroke="#3a2370" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="50" cy="50" rx="28" ry="5" fill="#4a2e88"/>' + star(52, 32, 6, "#ffd34d") };
      case "flame": return { front: '<path d="M50 14 C58 26 64 32 62 42 C60 50 40 50 38 42 C36 34 44 30 46 22 C48 28 52 30 50 14Z" fill="#ff8a3d" stroke="#c8452b" stroke-width="1.8"/><path d="M50 30 C54 36 56 40 54 44 C52 47 48 47 46 44 C45 40 48 38 50 30Z" fill="#ffe066"/>' };
      case "headphones": return { front: '<path d="M22 66 C20 30 80 30 78 66" stroke="#2b3a40" stroke-width="4" fill="none"/><rect x="16" y="58" width="12" height="18" rx="5" fill="#ff6b8a" stroke="#2b3a40" stroke-width="2"/><rect x="72" y="58" width="12" height="18" rx="5" fill="#ff6b8a" stroke="#2b3a40" stroke-width="2"/>' };
      case "coin": return { front: '<circle cx="50" cy="32" r="11" fill="#ffd34d" stroke="#b8861b" stroke-width="2.5"/><text x="50" y="37" text-anchor="middle" font-size="13" font-weight="800" fill="#8a6200">¥</text>' };
      case "sun": return { back: '<g stroke="#ffb703" stroke-width="4" stroke-linecap="round">' + Array.from({ length: 12 }, (_, i) => { const a = (i * 30 * Math.PI) / 180; return '<path d="M' + (50 + Math.cos(a) * 38).toFixed(1) + " " + (68 + Math.sin(a) * 38).toFixed(1) + " L" + (50 + Math.cos(a) * 46).toFixed(1) + " " + (68 + Math.sin(a) * 46).toFixed(1) + '"/>'; }).join("") + "</g>" };
      case "wings": return { back: '<path d="M24 70 C6 60 2 44 8 38 C16 46 20 50 28 56Z M24 76 C8 72 2 60 6 54 C14 60 20 64 28 66Z" fill="#fff" stroke="#9aa7d6" stroke-width="2"/><path d="M76 70 C94 60 98 44 92 38 C84 46 80 50 72 56Z M76 76 C92 72 98 60 94 54 C86 60 80 64 72 66Z" fill="#fff" stroke="#9aa7d6" stroke-width="2"/>' };
      case "tophat": return { front: '<rect x="36" y="20" width="28" height="22" rx="2" fill="#2b2f36"/><rect x="28" y="40" width="44" height="6" rx="3" fill="#2b2f36"/><rect x="36" y="34" width="28" height="4" fill="#c0392b"/>' };
      case "wave": return { front: '<path d="M30 46 C36 34 44 34 48 42 C50 30 64 28 70 40 C64 38 58 40 56 46 Z" fill="#3fa7d6" stroke="#1f6f9a" stroke-width="2"/><circle cx="62" cy="34" r="2" fill="#fff"/>' };
      case "gem": return { front: '<path d="M42 34 L50 24 L58 34 L50 46 Z" fill="#9be7ff" stroke="#2f8fb8" stroke-width="2" stroke-linejoin="round"/><path d="M42 34 L58 34 M50 24 L50 46" stroke="#2f8fb8" stroke-width="1"/>' };
      case "stars": return { front: '<circle cx="38" cy="80" r="1.6" fill="#fff"/><circle cx="62" cy="84" r="1.2" fill="#fff"/><circle cx="56" cy="52" r="1.4" fill="#fff"/>' + star(50, 32, 9, "#ffd34d") };
      case "horns": return { back: '<path d="M22 74 C8 70 6 58 12 52 C16 60 22 62 28 64Z" fill="#a8e6c8" stroke="' + d + '" stroke-width="2"/><path d="M78 74 C92 70 94 58 88 52 C84 60 78 62 72 64Z" fill="#a8e6c8" stroke="' + d + '" stroke-width="2"/>', front: '<path d="M36 48 C32 38 30 30 34 22 C38 30 42 38 44 46Z" fill="#fff1c2" stroke="#b8922c" stroke-width="2"/><path d="M64 48 C68 38 70 30 66 22 C62 30 58 38 56 46Z" fill="#fff1c2" stroke="#b8922c" stroke-width="2"/>' };
      case "halo": return { front: '<ellipse cx="50" cy="28" rx="17" ry="5" fill="none" stroke="#ffd34d" stroke-width="4"/>', back: '<path d="M24 66 C8 56 6 42 12 36 C18 46 22 50 30 56Z" fill="#fff" stroke="#e0cf9a" stroke-width="2"/><path d="M76 66 C92 56 94 42 88 36 C82 46 78 50 70 56Z" fill="#fff" stroke="#e0cf9a" stroke-width="2"/>' };
      case "rainbowArc": return { back: '<g fill="none" stroke-width="4" opacity=".85"><path d="M8 76 A42 42 0 0 1 92 76" stroke="#ff8fa3"/><path d="M13 76 A37 37 0 0 1 87 76" stroke="#ffd166"/><path d="M18 76 A32 32 0 0 1 82 76" stroke="#8fd3f4"/></g>' };
      case "crown": return { front: '<path d="M33 46 L36 26 L44 38 L50 22 L56 38 L64 26 L67 46 Z" fill="#ffd34d" stroke="#b8861b" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="38" r="3" fill="#e0483a"/><circle cx="40" cy="42" r="2" fill="#4aa3ff"/><circle cx="60" cy="42" r="2" fill="#4aa3ff"/>' };
      case "worldtree": return { back: '<circle cx="50" cy="66" r="46" fill="#d9ffd9" opacity=".5"/>', front: '<path d="M48 46 L48 30 L52 30 L52 46Z" fill="#7a4e2e"/><circle cx="50" cy="24" r="12" fill="#3f9a5c"/><circle cx="41" cy="28" r="8" fill="#57b873"/><circle cx="59" cy="28" r="8" fill="#57b873"/><circle cx="46" cy="20" r="2" fill="#ffd34d"/><circle cx="56" cy="24" r="2" fill="#ff9fb5"/>' };
      case "ring": return { back: '<ellipse cx="50" cy="72" rx="46" ry="12" fill="none" stroke="#c9b6ff" stroke-width="4" transform="rotate(-12 50 72)" opacity=".8"/>', front: '<path d="M8 80 A46 12 -12 0 0 92 62" fill="none" stroke="#e5dbff" stroke-width="4" transform="rotate(0)" opacity=".9"/>' + star(36, 60, 3, "#fff") + star(64, 82, 2.4, "#ffe9a8") + star(58, 56, 1.8, "#fff") };
      case "blush": return { front: '<ellipse cx="50" cy="46" rx="6" ry="3" fill="#fff" opacity=".9"/>' };
    }
    return {};
  }
  function charSvg(charId, level, opts = {}) {
    const c = charById(charId);
    const st = stageIndex(CHAR_STAGES, level);
    const gid = "cg" + ++seq;
    let defs = "";
    let fill = c.color;
    if (c.color === "rainbow") { fill = "url(#" + gid + ")"; defs = '<linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9a9e"/><stop offset="0.3" stop-color="#fad0c4"/><stop offset="0.55" stop-color="#a1e3a1"/><stop offset="0.8" stop-color="#8fd3f4"/><stop offset="1" stop-color="#c3a6f2"/></linearGradient>'; }
    else if (c.color === "royal") { fill = "url(#" + gid + ")"; defs = '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b3"/><stop offset="0.6" stop-color="#f2c94c"/><stop offset="1" stop-color="#d4a017"/></linearGradient>'; }
    else if (c.color === "galaxy") { fill = "url(#" + gid + ")"; defs = '<radialGradient id="' + gid + '" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#7a5cff"/><stop offset="0.5" stop-color="#3a2a8f"/><stop offset="1" stop-color="#140c3d"/></radialGradient>'; }
    const darkBody = c.color === "galaxy" || c.id === "hoshi";
    const rx = 28 + st * 1.6, ry = 26 + st * 1.6, eyeY = 66 - st;
    const sprout = [
      '<path d="M50 40 C50 34 50 30 50 27" stroke="#3f8c4a" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="44" cy="27" rx="6" ry="3.5" fill="#6cc070" transform="rotate(-25 44 27)"/><ellipse cx="56" cy="27" rx="6" ry="3.5" fill="#6cc070" transform="rotate(25 56 27)"/>',
      '<path d="M50 40 C50 32 52 26 54 22" stroke="#3f8c4a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M54 22 C66 12 78 18 74 26 C68 32 58 28 54 22Z" fill="#5db865"/><path d="M54 22 C46 14 36 18 38 25 C42 30 50 27 54 22Z" fill="#7bd17f"/>',
      '<path d="M50 38 C50 30 50 24 50 18" stroke="#3f8c4a" stroke-width="3" fill="none"/><path d="M50 20 C62 6 80 14 74 24 C68 30 56 26 50 20Z" fill="#5db865"/><path d="M50 20 C38 6 20 14 26 24 C32 30 44 26 50 20Z" fill="#7bd17f"/><circle cx="50" cy="16" r="5" fill="#ffd1dc"/><circle cx="50" cy="16" r="2" fill="#f6a5b8"/>',
      "<g>" + [0, 1, 2, 3, 4].map((i) => '<circle cx="' + (32 + i * 9) + '" cy="' + (40 - (i === 2 ? 4 : i % 2 ? 2 : 0)) + '" r="5.5" fill="' + ["#ffb3c7", "#ffe08a", "#ff9fb5", "#ffe08a", "#ffb3c7"][i] + '"/>').join("") + '<path d="M28 44 Q50 36 72 44" stroke="#5db865" stroke-width="3" fill="none"/></g>',
      '<g><path d="M33 40 L36 24 L44 34 L50 20 L56 34 L64 24 L67 40 Z" fill="#ffd34d" stroke="#c99a1c" stroke-width="2"/><circle cx="50" cy="31" r="3" fill="#ff6b8a"/><circle cx="38" cy="35" r="2" fill="#6bd1ff"/><circle cx="62" cy="35" r="2" fill="#6bd1ff"/></g>',
    ][st];
    const acc = c.acc === "sprout" ? { front: sprout } : accSvg(c, st, eyeY, fill);
    const ring = c.rarity >= 4 || st >= 4 ? '<circle cx="50" cy="68" r="' + (rx + 10) + '" fill="none" stroke="' + (c.rarity >= 6 ? "#ff9ee0" : "#ffd34d") + '" stroke-width="2" stroke-dasharray="3 6" opacity="0.8"/>' : "";
    const sparkle = c.rarity >= 5 ? star(16, 40, 4, "#fff3b0") + star(86, 50, 3.4, "#fff3b0") + star(80, 24, 2.6, "#fff") : "";
    const gray = opts.locked ? ' filter="url(#lk' + gid + ')"' : "";
    if (opts.locked) defs += '<filter id="lk' + gid + '"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer></filter>';
    if (opts.silhouette) defs += '<filter id="lk' + gid + '"><feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.38  0 0 0 0 0.4  0 0 0 0.85 0"/></filter>';
    const flt = opts.silhouette ? ' filter="url(#lk' + gid + ')"' : gray;
    const size = opts.size || 80;
    const eye = darkBody ? "#fff" : "#1d2a24", hi = darkBody ? "#1d2a24" : "#fff";
    return '<svg class="char-svg" ' + (opts.ns ? 'xmlns="http://www.w3.org/2000/svg" ' : "") + 'viewBox="0 0 100 110" width="' + size + '" height="' + Math.round(size * 1.1) + '" aria-hidden="true">' + (defs ? "<defs>" + defs + "</defs>" : "") + "<g" + flt + ">" +
      '<ellipse cx="50" cy="102" rx="' + rx * 0.8 + '" ry="5" fill="rgba(20,40,30,0.18)"/>' + ring + (acc.back || "") +
      '<ellipse cx="38" cy="96" rx="9" ry="5" fill="' + c.dark + '"/><ellipse cx="62" cy="96" rx="9" ry="5" fill="' + c.dark + '"/>' +
      '<ellipse cx="50" cy="70" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" stroke="' + c.dark + '" stroke-width="2.5"/>' +
      '<ellipse cx="42" cy="58" rx="9" ry="5" fill="rgba(255,255,255,0.35)" transform="rotate(-20 42 58)"/>' +
      '<circle cx="40" cy="' + eyeY + '" r="4.4" fill="' + eye + '"/><circle cx="60" cy="' + eyeY + '" r="4.4" fill="' + eye + '"/>' +
      '<circle cx="41.5" cy="' + (eyeY - 1.6) + '" r="1.5" fill="' + hi + '"/><circle cx="61.5" cy="' + (eyeY - 1.6) + '" r="1.5" fill="' + hi + '"/>' +
      '<ellipse cx="32" cy="' + (eyeY + 8) + '" rx="5" ry="3" fill="rgba(255,120,140,0.45)"/><ellipse cx="68" cy="' + (eyeY + 8) + '" rx="5" ry="3" fill="rgba(255,120,140,0.45)"/>' +
      '<path d="M45 ' + (eyeY + 9) + " Q50 " + (eyeY + 14) + " 55 " + (eyeY + 9) + '" stroke="' + eye + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' + (acc.front || "") + sparkle + "</g></svg>";
  }
  const imgCache = {};
  function charImage(charId, level) {
    const key = charId + ":" + stageIndex(CHAR_STAGES, level);
    if (imgCache[key]) return imgCache[key];
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(charSvg(charId, level, { size: 100, ns: true }));
    imgCache[key] = img;
    return img;
  }

  window.GCArt = { CHARACTERS, RARITIES, CHAR_STAGES, stageIndex, stageName, charSvg, charImage, charById };
})();
