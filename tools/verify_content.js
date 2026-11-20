/* ほしまなび — 不適切な内容チェック（名詞×動詞の組み合わせ・NG語）
   すべての問題（問題バンク全行＋生成問題を種をかえて作ったもの）の 問題文・答え・選択肢・解説 を調べる。
   使い方: node tools/verify_content.js [seeds]  → 見つかったら一覧を出して exit 1 */
"use strict";
const fs = require("fs"), path = require("path"); const ROOT = path.join(__dirname, "..");
global.window = undefined; require(path.join(ROOT, "q-util.js"));
fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/q-[a-z0-9-]+\.js/g).filter((f, i, a) => f !== "q-util.js" && a.indexOf(f) === i).forEach((f) => require(path.join(ROOT, f)));
if (HM.finalize) HM.finalize();
const SEEDS = +(process.argv[2] || 20);
// 人や生き物をあらわす名詞
const NOUN = ["人", "友だち", "友達", "ともだち", "先生", "子ども", "子供", "こども", "赤ちゃん", "お母さん", "お父さん", "おかあさん", "おとうさん", "母", "父", "妹", "弟", "姉", "兄", "おじいさん", "おばあさん", "クラスメート", "みんな", "ねこ", "猫", "犬", "いぬ", "動物", "生き物", "うさぎ", "小鳥", "クラス", "家族", "相手", "女の子", "男の子", "彼", "彼女", "him", "her", "people", "friend", "teacher", "cat", "dog", "baby"];
// それらに向けると不適切になる動詞
const VERB = ["殺す", "殺し", "ころす", "ころし", "なぐる", "なぐっ", "殴", "けがをさせ", "けがさせ", "いじめ", "苛め", "ぬすむ", "盗む", "盗ん", "たたく", "たたい", "叩", "ける", "けっ", "蹴", "すてる", "捨て", "閉じこめ", "とじこめ", "だま", "騙", "おどす", "脅", "ばかにする", "無視する", "kill", "hit", "hurt", "steal", "bully", "kick"];
// 単語だけで不適切なもの
const NG = ["死ね", "しね！", "殺してやる", "ころしてやる", "バカ", "ばか", "アホ", "あほ", "ブス", "デブ", "キモい", "きもい", "うざい", "ウザい", "クズ", "くず野郎", "消えろ", "自殺", "自傷", "麻薬", "覚せい剤", "たばこを吸", "お酒を飲", "ギャンブル", "賭け", "セックス", "エロ", "裸", "ヌード", "差別して", "fuck", "shit", "damn", "stupid", "idiot", "sexy", "drug", "kill yourself"];
// 学習内容として正しい文脈（歴史・理科など）は除く
const OK = [/暗殺|殺害された|殺された|戦い|戦争|変|乱|一揆|事件|弾圧|処刑/, /ばかり|けっこう|けっか|結果|ける[^。]*(?:ボール|サッカー)|ボールをけ|けって(?:い|走)|まける|あける|かける|つける|うける|とける|わける|にげる|あずける|見つける|ける。$/, /すてきな|ごみを(?:すて|捨て)|すて(?:き|ず)/, /だまって|だまる|黙/, /たたいて(?:音|リズム)|太鼓|手をたたく|手を叩|楽器/, /hit (?:the )?(?:ball|song)|hit a ball/i, /くず(?:れ|す)|ばかす|あほうどり|ナトリウム|裸子植物|はだか/, /犬かき|捨て子/];
const strip = (s) => String(s == null ? "" : s).replace(/<[^>]+>/g, " ");
const sentences = (t) => t.split(/[。！？\n.!?|｜／]/).filter(Boolean);
const ngHit = (s, w) => { if (/^[a-z ]+$/i.test(w)) return new RegExp("\\b" + w + "\\b", "i").test(s); let i = s.indexOf(w); while (i >= 0) { const pre = s[i - 1] || "", post = s[i + w.length] || ""; if (!(/[ぁ-んァ-ン]/.test(pre) && /^[ぁ-んァ-ン]+$/.test(w)) && !(/^[ぁ-ん]+$/.test(w) && /[ぁ-ん]/.test(post) && w.length <= 2)) return true; i = s.indexOf(w, i + 1); } return false; };
const hits = [], seen = new Set(); let checked = 0;
function check(q, where) {
  const txt = [q.q, q.a, (q.o || []).join(" ｜ "), q.ex, q.hint].map(strip).join(" ｜ "); const key = txt; if (seen.has(key)) return; seen.add(key); checked++;
  for (const s of sentences(txt)) {
    if (OK.some((re) => re.test(s))) continue;
    for (const w of NG) if (ngHit(s, w)) hits.push([where, "NG語「" + w + "」", s.trim().slice(0, 80)]);
    if (/\b(?:kill|hit|hurt|steal|bully|kick)(?:s|ed|ing)?\b.{0,15}\b(?:people|friends?|teachers?|cats?|dogs?|bab(?:y|ies)|him|her|them|sister|brother|mother|father)\b/i.test(s)) hits.push([where, "英語の動詞×名詞", s.trim().slice(0, 80)]);
    for (const n of NOUN) { const i = s.indexOf(n); if (i < 0) continue; const rest = s.slice(i + n.length, i + n.length + 14);
      if (/^[a-z]/i.test(n) && !new RegExp("\\b" + n + "\\b", "i").test(s)) continue;
      for (const v of VERB) { const j = /^[a-z]/i.test(v) ? (rest.search(new RegExp("\\b" + v + "\\b", "i"))) : rest.indexOf(v); if (j >= 0 && /^[をにがはもへと ]?.{0,6}$/.test(rest.slice(0, j))) hits.push([where, "名詞×動詞「" + n + "…" + v + "」", s.trim().slice(0, 80)]); } }
  }
}
for (const [s, gs] of Object.entries(HM.SUBJECTS)) for (const [g, us] of Object.entries(gs)) us.forEach((u) => u.steps.forEach((st) => {
  const where = s + " " + g + " / " + u.n + " / " + st.n;
  if (Array.isArray(st.src)) st.src.forEach((x) => check(typeof x === "string" ? HM.U.parseBankLine ? HM.U.parseBankLine(x) : { q: x } : x, where));
  else for (let k = 0; k < SEEDS; k++) { try { HM.makeSet(st, k * 7919 + 3).forEach((q) => check(q, where)); } catch (e) {} }
}));
const uniq = [...new Map(hits.map((h) => [h.join("|"), h])).values()];
uniq.slice(0, 200).forEach((h) => console.log(h.join(" :: ")));
console.log(JSON.stringify({ checked, hits: uniq.length, nouns: NOUN.length, verbs: VERB.length, ng: NG.length }));
process.exit(uniq.length ? 1 : 0);
