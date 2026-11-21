/* ほしまなび 英語 v1.6 — 小3〜小6（4技能）。文はすべて表から作り、日本語訳もいっしょに持つ */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, E4 = HM.EN4, { R, pick } = U;
  const up = E4.firstUp, art = E4.art;
  const T = (s) => s.trim().split("\n").map((l) => l.trim().split("|").map((x) => x.trim()));
  const S = (en, ja, o) => Object.assign({ en, ja }, o || {});
  const lvPick = (lv, a, b, c) => (lv < 0.34 || !b ? a : lv < 0.67 || !c ? b : c)();
  const NAMES = [["Ken", "ケン"], ["Emma", "エマ"], ["Yumi", "ユミ"], ["Tom", "トム"], ["Mika", "ミカ"], ["Ben", "ベン"], ["Aya", "アヤ"], ["Lucas", "ルーカス"], ["Sara", "サラ"], ["Leo", "レオ"], ["Riku", "リク"], ["Hana", "ハナ"]];
  E4.NAMES = NAMES;
  // 名前の性別（He / She を名前に合わせる）
  E4.SEXOF = { Ken: "m", Tom: "m", Ben: "m", Lucas: "m", Leo: "m", Riku: "m", Emma: "f", Yumi: "f", Mika: "f", Aya: "f", Sara: "f", Hana: "f" };
  // 語形（カードのまぎらわしい語に使う）
  E4.FORMS = E4.FORMS || {};
  const forms = (...gs) => gs.forEach((g) => g.forEach((w) => (E4.FORMS[w.toLowerCase()] = g.filter((x) => x !== w)))) ;
  forms(["is", "are", "am"], ["was", "were"], ["do", "does", "did"], ["have", "has", "had"], ["can", "can't"], ["like", "likes", "liked"], ["play", "plays", "played"], ["want", "wants", "wanted"], ["go", "goes", "went"], ["I", "my", "me"], ["he", "his", "him"], ["she", "her"], ["this", "these"], ["that", "those"], ["a", "an"]);

  // ===== 表 =====
  const FEEL = T(`fine|元気です|元気ではありません|元気ですか|🙂
happy|うれしいです|うれしくありません|うれしいですか|😊
sad|悲しいです|悲しくありません|悲しいですか|😢
sleepy|ねむいです|ねむくありません|ねむいですか|😪
hungry|おなかがすいています|おなかはすいていません|おなかがすいていますか|😋
tired|つかれています|つかれていません|つかれていますか|😩
hot|暑いです|暑くありません|暑いですか|🥵
cold|寒いです|寒くありません|寒いですか|🥶
angry|おこっています|おこっていません|おこっていますか|😠`);
  const COUNT = T(`apple|りんご|こ|🍎
orange|オレンジ|こ|🍊
lemon|レモン|こ|🍋
ball|ボール|こ|⚽
star|星|こ|⭐
pencil|えんぴつ|本|✏️
book|本|さつ|📕
car|車|台|🚗
cake|ケーキ|こ|🍰
flower|花|本|🌷`);
  const COLOR = T(`red|赤|🟥
blue|青|🟦
yellow|黄色|🟨
green|緑|🟩
purple|むらさき|🟪
orange|オレンジ色|🟧
black|黒|⬛
white|白|⬜
brown|茶色|🟫
pink|ピンク|`);
  const FOOD = T(`apples|りんご|🍎
bananas|バナナ|🍌
grapes|ぶどう|🍇
strawberries|いちご|🍓
peaches|もも|🍑
melons|メロン|🍈
cherries|さくらんぼ|🍒
tomatoes|トマト|🍅
carrots|にんじん|🥕
ice cream|アイスクリーム|🍦
pizza|ピザ|🍕
hamburgers|ハンバーガー|🍔
milk|牛乳|🥛`);
  const SPORT = T(`soccer|サッカー|⚽
baseball|野球|⚾
basketball|バスケットボール|🏀
tennis|テニス|🎾
volleyball|バレーボール|🏐
table tennis|卓球|🏓
badminton|バドミントン|🏸`);
  const ANIMAL = T(`cat|cats|ねこ|🐱
dog|dogs|犬|🐶
rabbit|rabbits|うさぎ|🐰
bear|bears|くま|🐻
lion|lions|ライオン|🦁
panda|pandas|パンダ|🐼
tiger|tigers|トラ|🐯
horse|horses|馬|🐴
pig|pigs|ぶた|🐷
monkey|monkeys|さる|🐵
elephant|elephants|ぞう|🐘
koala|koalas|コアラ|🐨
penguin|penguins|ペンギン|🐧
frog|frogs|かえる|🐸`);
  const THING = T(`apple|りんご|🍎
banana|バナナ|🍌
cake|ケーキ|🍰
bus|バス|🚌
car|車|🚗
book|本|📕
cap|ぼうし|🧢
flower|花|🌷
egg|たまご|🥚
umbrella|かさ|☂️
bike|自転車|🚲
clock|時計|🕒
pencil|えんぴつ|✏️
guitar|ギター|🎸`);
  const ITEM = T(`pencil|えんぴつ|✏️
ruler|じょうぎ|📏
notebook|ノート|📓
pen|ペン|🖊️
bag|かばん|🎒
book|本|📕
crayon|クレヨン|🖍️
eraser|消しゴム|
cap|ぼうし|🧢`);
  const HEART = T(`red|赤|❤️
blue|青|💙
green|緑|💚
yellow|黄色|💛
purple|むらさき|💜
black|黒|🖤`);
  const SHAPE = T(`circle|丸|⚪
triangle|三角|🔺
star|星|⭐
heart|ハート|❤️
diamond|ひし形|🔷`);
  const nW = E4.numWords;

  // ===== 小3 =====
  const G3 = [
    { n: "あいさつ", note: "あいさつは相手の目を見て、はっきり言おう。朝は Good morning.、夜ねるときは Good night.。", gen: (lv) => {
      const fixed = T(`Hello.|こんにちは。
Good morning.|おはよう。
Good night.|おやすみなさい。
Goodbye.|さようなら。
Thank you.|ありがとう。
You're welcome.|どういたしまして。
Nice to meet you.|はじめまして。
How are you?|元気ですか？
I'm fine, thank you.|元気です、ありがとう。
I'm sorry.|ごめんなさい。
Excuse me.|すみません。
See you tomorrow.|また明日。`);
      const [n, nj] = pick(NAMES);
      return lvPick(lv, () => { const [en, ja] = pick(fixed); return S(en, ja, { kind: "greet" }); },
        () => pick([S("Hello, I'm " + n + ".", "こんにちは、わたしは" + nj + "です。"), S("Good morning, " + n + ".", "おはよう、" + nj + "。"), S("Thank you, " + n + ".", "ありがとう、" + nj + "。"), S("See you tomorrow, " + n + ".", "また明日ね、" + nj + "。"), S("Goodbye, " + n + ".", "さようなら、" + nj + "。")]),
        () => pick([S("Hello, " + n + ". How are you?", "こんにちは、" + nj + "。元気ですか？"), S("Nice to meet you, " + n + ".", "はじめまして、" + nj + "。"), S("Good night, " + n + ". See you tomorrow.", "おやすみ、" + nj + "。また明日ね。")]));
    } },
    { n: "気持ち（How are you?）", note: "〈I'm＋気持ち〉で「わたしは〜です」。たずねるときは Are you 〜?。", gen: (lv) => {
      const [e, d, ng, qj, pic] = pick(FEEL), [n, nj] = pick(NAMES);
      return lvPick(lv, () => S("I'm " + e + ".", "わたしは" + d + "。", { pic, kind: "feel" }),
        () => pick([S("I'm not " + e + ".", "わたしは" + ng + "。", { kind: "feelN" }), S("Are you " + e + "?", "あなたは" + qj + "？", { kind: "feelQ" }), S("I'm very " + e + ".", "わたしはとても" + d + "。", { pic, kind: "feel" })]),
        () => pick([S(n + " is " + e + ".", nj + "は" + d + "。", { pic, kind: "feel" }), S("How are you? I'm " + e + ".", "元気ですか？ わたしは" + d + "。", { pic, kind: "feel" })]));
    } },
    { n: "数（How many?）", note: "2つ以上は名詞に s をつける（apple → apples）。数は one, two, three…。", gen: (lv) => {
      const [e, j, c, pic] = pick(COUNT), n = R(1, lv < 0.4 ? 5 : lv < 0.7 ? 10 : 20), pl = n === 1 ? e : e + "s", P = n <= 5 ? pic.repeat(n) : "";
      return lvPick(lv, () => S(up(nW(n)) + " " + pl + ".", j + n + c + "。", { pic: P, kind: "count" }),
        () => S("I have " + nW(n) + " " + pl + ".", "わたしは" + j + "を" + n + c + "持っています。", { pic: P, kind: "count" }),
        () => S("How many " + e + "s? " + up(nW(n)) + " " + pl + ".", j + "はいくつ？ " + n + c + "です。", { pic: P, kind: "count" }));
    } },
    { n: "色（I like blue.）", note: "〈I like＋色〉で「〜色が好き」。色の名前には a をつけない。", gen: (lv) => {
      const [e, j, pic] = pick(COLOR);
      return lvPick(lv, () => S("I like " + e + ".", "わたしは" + j + "が好きです。", { pic, kind: "color" }),
        () => pick([S("It's " + e + ".", j + "です。", { pic, kind: "color" }), S("Do you like " + e + "?", "あなたは" + j + "が好きですか？", { kind: "colorQ" })]),
        () => pick([S("What color do you like? I like " + e + ".", "何色が好き？ わたしは" + j + "が好きです。", { pic, kind: "color" }), S("I don't like " + e + ".", "わたしは" + j + "が好きではありません。", { kind: "colorN" })]));
    } },
    { n: "好きなもの（Do you like 〜?）", note: "〈Do you like 〜?〉に Yes, I do. ／ No, I don't. で答える。数えられるものは s をつける。", gen: (lv) => {
      const [e, j, pic] = pick(FOOD), sp = pick(SPORT);
      return lvPick(lv, () => pick([S("I like " + e + ".", "わたしは" + j + "が好きです。", { pic, kind: "food" }), S("I like " + sp[0] + ".", "わたしは" + sp[1] + "が好きです。", { pic: sp[2], kind: "food" })]),
        () => pick([S("Do you like " + e + "?", "あなたは" + j + "が好きですか？", { kind: "foodQ" }), S("I don't like " + e + ".", "わたしは" + j + "が好きではありません。", { kind: "foodN" })]),
        () => pick([S("Do you like " + e + "? Yes, I do.", j + "は好きですか？ はい、好きです。", { kind: "foodQA" }), S("Do you like " + sp[0] + "? No, I don't.", sp[1] + "は好きですか？ いいえ、好きではありません。", { kind: "foodQA" })]));
    } },
    { n: "動物", note: "1ぴきなら a cat、たくさんなら cats。「〜が好き」は I like cats. のように s をつける。", gen: (lv) => {
      const [s1, pl, j, pic] = pick(ANIMAL);
      return lvPick(lv, () => S("I like " + pl + ".", "わたしは" + j + "が好きです。", { pic, kind: "animal" }),
        () => pick([S("It's " + art(s1) + ".", "それは" + j + "です。", { pic, kind: "animal" }), S("Look! " + up(art(s1)) + "!", "見て！ " + j + "だ！", { pic, kind: "animal" })]),
        () => pick([S(up(pl) + " are cute.", j + "はかわいいです。", { pic, kind: "animal" }), S("I have " + art(s1) + ".", "わたしは" + j + "を飼っています。", { pic, kind: "animal" })]));
    } },
    { n: "これは何？（What's this?）", note: "What's this? ＝「これは何？」。答えは It's a 〜.（a のかわりに、母音で始まる語には an）。", gen: (lv) => {
      const [e, j, pic] = pick(THING);
      return lvPick(lv, () => S("It's " + art(e) + ".", "それは" + j + "です。", { pic, kind: "thing" }),
        () => S("What's this? It's " + art(e) + ".", "これは何？ " + j + "です。", { pic, kind: "thing" }),
        () => S("Is this " + art(e) + "? Yes, it is.", "これは" + j + "ですか？ はい、そうです。", { pic, kind: "thing" }));
    } },
    { n: "形とプレゼント（This is for you.）", note: "This is for you. ＝「これをあなたに」。ほしいものは 〜, please. で言う。", gen: (lv) => {
      const sh = pick(SHAPE), h = pick(HEART);
      return lvPick(lv, () => pick([S("A " + sh[0] + ", please.", sh[1] + "をください。", { pic: sh[2], kind: "shape" }), S("This is for you.", "これをあなたにあげます。"), S("Here you are.", "はい、どうぞ。")]),
        () => S("A " + h[0] + " heart, please.", h[1] + "のハートをください。", { pic: h[2], kind: "heart" }),
        () => pick([S("What do you want? A " + sh[0] + ", please.", "何がほしい？ " + sh[1] + "をください。", { pic: sh[2], kind: "shape" }), S("This " + h[0] + " heart is for you.", "この" + h[1] + "のハートをあなたにあげます。", { pic: h[2], kind: "heart" })]));
    } },
    { n: "持ちもの", note: "〈I have a 〜.〉＝「〜を持っています」。〈This is my 〜.〉＝「これはわたしの〜です」。", gen: (lv) => {
      const [e, j, pic] = pick(ITEM);
      return lvPick(lv, () => S("I have " + art(e) + ".", "わたしは" + j + "を持っています。", { pic, kind: "item" }),
        () => S("This is my " + e + ".", "これはわたしの" + j + "です。", { pic, kind: "item" }),
        () => pick([S("Do you have " + art(e) + "? Yes, I do.", j + "を持っていますか？ はい、持っています。", { pic, kind: "item" }), S("I don't have " + art(e) + ".", "わたしは" + j + "を持っていません。", { kind: "itemN" })]));
    } },
    { n: "自己紹介（Who are you?）", note: "I'm 〜. ＝「わたしは〜です」。年れいは I'm eight years old. のように言う。", gen: (lv) => {
      const [n, nj] = pick(NAMES), age = R(7, 10), sp = pick(SPORT);
      return lvPick(lv, () => pick([S("I'm " + n + ".", "わたしは" + nj + "です。"), S("My name is " + n + ".", "わたしの名前は" + nj + "です。")]),
        () => pick([S("I'm " + nW(age) + " years old.", "わたしは" + age + "さいです。"), S("I like " + sp[0] + ".", "わたしは" + sp[1] + "が好きです。")]),
        () => pick([S("Who are you? I'm " + n + ".", "あなたはだれ？ わたしは" + nj + "です。"), S("Hello. My name is " + n + ". I like " + sp[0] + ".", "こんにちは。わたしの名前は" + nj + "です。" + sp[1] + "が好きです。")]));
    } },
  ];

  // ===== 小4 =====
  const WEATHER = T(`sunny|晴れ|☀️
rainy|雨|☔
cloudy|くもり|☁️
snowy|雪|⛄
windy|風が強い|🌬️`);
  const DAY = T(`Monday|月曜日
Tuesday|火曜日
Wednesday|水曜日
Thursday|木曜日
Friday|金曜日
Saturday|土曜日
Sunday|日曜日`);
  const CLOCK = ["", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛"], CLOCK30 = ["", "🕜", "🕝", "🕞", "🕟", "🕠", "🕡", "🕢", "🕣", "🕤", "🕥", "🕦", "🕧"];
  const GAME = T(`tag|おにごっこ|🏃
dodgeball|ドッジボール|🔴
cards|トランプ|🃏
soccer|サッカー|⚽
basketball|バスケットボール|🏀
baseball|野球|⚾`);
  const DAILY = T(`get up|起きます
eat breakfast|朝ごはんを食べます
go to school|学校に行きます
have lunch|昼ごはんを食べます
go home|家に帰ります
do my homework|宿題をします
take a bath|おふろに入ります
go to bed|ねます`);
  const ROOM = T(`library|図書室
music room|音楽室
gym|体育館
science room|理科室
computer room|コンピューター室
classroom|教室
playground|運動場`);
  const BODY = T(`head|頭
shoulders|かた
knees|ひざ
nose|鼻
ears|耳
eyes|目`);
  const POS = T(`on|上
under|下
in|中
by|そば`);
  const FURN = T(`desk|机
chair|いす
box|箱
bed|ベッド
table|テーブル`);
  const G4 = [
    { n: "天気（How's the weather?）", note: "天気は It's sunny. のように It's で言う。", gen: (lv) => {
      const [e, j, pic] = pick(WEATHER);
      return lvPick(lv, () => S("It's " + e + ".", j + "です。", { pic, kind: "w" }),
        () => pick([S("It's " + e + " today.", "今日は" + j + "です。", { pic, kind: "w" }), S("It's hot today.", "今日は暑いです。", { pic: "🥵", kind: "w" }), S("It's cold today.", "今日は寒いです。", { pic: "🥶", kind: "w" })]),
        () => S("How's the weather? It's " + e + ".", "天気はどう？ " + j + "です。", { pic, kind: "w" }));
    } },
    { n: "曜日（What day is it?）", note: "曜日は大文字で始める（Monday）。「〜曜日に」は on Monday(s)。", gen: (lv) => {
      const [e, j] = pick(DAY), sp = pick(SPORT);
      return lvPick(lv, () => S("It's " + e + ".", j + "です。", { kind: "day" }),
        () => pick([S("What day is it? It's " + e + ".", "何曜日？ " + j + "です。", { kind: "day" }), S("I like " + e + "s.", "わたしは" + j + "が好きです。", { kind: "day" })]),
        () => S("I play " + sp[0] + " on " + e + "s.", "わたしは" + j + "に" + sp[1] + "をします。", { kind: "dayP" }));
    } },
    { n: "時こく（What time is it?）", note: "「〜時です」は It's 〜 o'clock.、「〜時半」は It's 〜 thirty.。", gen: (lv) => {
      const h = R(1, 12);
      return lvPick(lv, () => S("It's " + nW(h) + " o'clock.", h + "時です。", { pic: CLOCK[h], kind: "time" }),
        () => pick([S("It's " + nW(h) + " thirty.", h + "時30分です。", { pic: CLOCK30[h], kind: "time" }), S("What time is it? It's " + nW(h) + " o'clock.", "何時？ " + h + "時です。", { pic: CLOCK[h], kind: "time" })]),
        () => pick([S("It's time for lunch.", "昼ごはんの時間です。", { kind: "tfor" }), S("It's time for bed.", "ねる時間です。", { kind: "tfor" }), S("It's time for school.", "学校の時間です。", { kind: "tfor" }), pick([S("It's twelve o'clock. It's time for lunch.", "12時です。昼ごはんの時間です。", { pic: CLOCK[12], kind: "time" }), S("It's eight o'clock. It's time for school.", "8時です。学校の時間です。", { pic: CLOCK[8], kind: "time" }), S("It's nine o'clock. It's time for bed.", "9時です。ねる時間です。", { pic: CLOCK[9], kind: "time" }), S("It's seven o'clock. It's time for breakfast.", "7時です。朝ごはんの時間です。", { pic: CLOCK[7], kind: "time" })])]));
    } },
    { n: "遊び（Let's play.）", note: "Let's 〜. ＝「〜しよう」。さそわれたら Yes, let's. と答える。", gen: (lv) => {
      const [e, j, pic] = pick(GAME);
      const act = pick(T(`sing|歌おう|🎤
dance|おどろう|💃
jump rope|なわとびをしよう|🪢
go outside|外に行こう|🌳
play together|いっしょに遊ぼう|🤝`));
      return lvPick(lv, () => S("Let's play " + e + ".", j + "をしよう。", { pic, kind: "play" }),
        () => pick([S("Let's " + act[0] + ".", act[1] + "。", { pic: act[2], kind: "play" }), S("Let's play " + e + ". Yes, let's.", j + "をしよう。うん、そうしよう。", { pic, kind: "play" })]),
        () => S("Do you like " + e + "? Yes, I do. Let's play " + e + ".", j + "は好き？ うん、好き。" + j + "をしよう。", { pic, kind: "play" }));
    } },
    { n: "持ちもの（Do you have 〜?）", note: "Do you have 〜? ＝「〜を持っていますか」。2本以上は pencils のように s をつける。", gen: (lv) => {
      const [e, j, pic] = pick(ITEM.filter((x) => x[0] !== "cap")), n = R(2, 10), c = e === "pencil" || e === "pen" || e === "crayon" ? "本" : e === "book" || e === "notebook" ? "さつ" : "こ";
      return lvPick(lv, () => S("Do you have " + art(e) + "?", j + "を持っていますか？", { kind: "haveQ" }),
        () => pick([S("I have " + nW(n) + " " + e + "s.", "わたしは" + j + "を" + n + c + "持っています。", { kind: "haveN" }), S("I don't have " + art(e) + ".", "わたしは" + j + "を持っていません。", { kind: "haveNeg" })]),
        () => pick([S("Do you have " + art(e) + "? No, I don't.", j + "を持っていますか？ いいえ、持っていません。", { kind: "haveQA" }), S("Do you have " + art(e) + "? Yes, I do.", j + "を持っていますか？ はい、持っています。", { kind: "haveQA" })]));
    } },
    { n: "ほしいもの（What do you want?）", note: "I want 〜. ＝「〜がほしい」。ていねいにたのむときは 〜, please.。", gen: (lv) => {
      const f = pick(T(`an apple|りんご|🍎
a banana|バナナ|🍌
a hamburger|ハンバーガー|🍔
ice cream|アイスクリーム|🍦
a cake|ケーキ|🍰
pizza|ピザ|🍕
an orange|オレンジ|🍊
a sandwich|サンドイッチ|🥪
milk|牛乳|🥛
orange juice|オレンジジュース|🧃`));
      return lvPick(lv, () => S("I want " + f[0] + ".", f[1] + "がほしいです。", { pic: f[2], kind: "want" }),
        () => pick([S(up(f[0]) + ", please.", f[1] + "をください。", { pic: f[2], kind: "want" }), S("What do you want? I want " + f[0] + ".", "何がほしい？ " + f[1] + "がほしいです。", { pic: f[2], kind: "want" })]),
        () => S(up(f[0]) + ", please. Thank you.", f[1] + "をください。ありがとう。", { pic: f[2], kind: "want" }));
    } },
    { n: "場所（Where is 〜?）", note: "on＝上、under＝下、in＝中、by＝そば。Where is 〜? ＝「〜はどこ？」", gen: (lv) => {
      const [an, , aj] = pick(ANIMAL.slice(0, 3)), [p, pj] = pick(POS), [f, fj] = p === "in" ? ["box", "箱"] : pick(FURN), it = pick(ITEM.filter((x) => !/^e/.test(x[0])));
      return lvPick(lv, () => S("The " + an + " is " + p + " the " + f + ".", an === "dog" || an === "cat" || an === "rabbit" ? aj + "は" + fj + "の" + pj + "にいます。" : aj + "は" + fj + "の" + pj + "にいます。", { kind: "pos" }),
        () => S("Where is the " + it[0] + "? It's " + p + " the " + f + ".", it[1] + "はどこ？ " + fj + "の" + pj + "にあります。", { kind: "pos" }),
        () => S("My " + it[0] + " is " + p + " the " + f + ".", "わたしの" + it[1] + "は" + fj + "の" + pj + "にあります。", { kind: "pos" }));
    } },
    { n: "体（Touch your 〜.）", note: "命令するときは動詞から始める（Touch your head.）。", gen: (lv) => {
      const [b, bj] = pick(BODY);
      const act = T(`Stand up.|立ってください。
Sit down.|すわってください。
Clap your hands.|手をたたいてください。
Raise your hand.|手をあげてください。
Turn around.|ぐるっと回ってください。
Jump.|ジャンプしてください。`);
      return lvPick(lv, () => S("Touch your " + b + ".", bj + "をさわってください。", { kind: "body" }),
        () => { const [e, j] = pick(act); return S(e, j, { kind: "body" }); },
        () => { const [e, j] = pick(act.filter((x) => x[0] !== "Jump.")); return S(e.replace(".", "") + " and touch your " + b + ".", j.replace("ください。", "") + "、" + bj + "をさわってください。", { kind: "body" }); });
    } },
    { n: "一日の生活", note: "〈at＋時こく〉で「〜時に」。I get up at six. ＝「6時に起きます」。", gen: (lv) => {
      // 活動ごとに、ふつうの時こくだけを使う（ちょうど／30分）。午後は +12 で順番をくらべる
      const DT = [["get up", "起きます", [6, 7], [6], 0], ["eat breakfast", "朝ごはんを食べます", [7], [6, 7], 0], ["go to school", "学校に行きます", [7, 8], [7], 0], ["have lunch", "昼ごはんを食べます", [12], [12], 0], ["go home", "家に帰ります", [3, 4, 5], [3, 4], 12], ["do my homework", "宿題をします", [4, 5, 6, 7], [4, 5, 6], 12], ["take a bath", "おふろに入ります", [7, 8, 9], [7, 8], 12], ["go to bed", "ねます", [9, 10], [9], 12]];
      const [e, j, hs, hh] = pick(DT), h = pick(hs), h2 = pick(hh);
      return lvPick(lv, () => S("I " + e + " at " + nW(h) + ".", "わたしは" + h + "時に" + j + "。", { alt: ["I " + e + " at " + nW(h) + " o'clock."], kind: "daily" }),
        () => S("I " + e + " at " + nW(h2) + " thirty.", "わたしは" + h2 + "時30分に" + j + "。", { alt: ["I " + e + " at " + nW(h2) + "-thirty."], kind: "daily" }),
        () => {
          for (let t = 0; t < 20; t++) {
            const i = R(0, DT.length - 2), k = R(i + 1, DT.length - 1), A = DT[i], B = DT[k], ha = pick(A[2]), hb = pick(B[2]);
            if (hb + B[4] <= ha + A[4]) continue;
            return S("I " + A[0] + " at " + nW(ha) + ". I " + B[0] + " at " + nW(hb) + ".", "わたしは" + ha + "時に" + A[1] + "。" + hb + "時に" + B[1] + "。", { kind: "daily" });
          }
          return S("I get up at six. I go to school at eight.", "わたしは6時に起きます。8時に学校に行きます。", { kind: "daily" });
        });
    } },
    { n: "数（〜60）", note: "21〜99は twenty-one のように、10の位と1の位をつなげて言う。", gen: (lv) => {
      const n = R(lv < 0.4 ? 11 : 21, lv < 0.4 ? 30 : 60), it = pick(T(`cards|カード|まい
pencils|えんぴつ|本
stickers|シール|まい
marbles|ビー玉|こ
books|本|さつ`));
      return lvPick(lv, () => S("I have " + nW(n).replace(" ", "-") + " " + it[0] + ".", "わたしは" + it[1] + "を" + n + it[2] + "持っています。", { kind: "num" }),
        () => S("How many " + it[0] + "? " + up(nW(n).replace(" ", "-")) + ".", it[1] + "はいくつ？ " + n + it[2] + "です。", { kind: "num" }),
        () => S("It's " + nW(n * 10).replace(/ty (\w)/, "ty-$1") + " yen.", n * 10 + "円です。", { kind: "num" }));
    } },
    { n: "お気に入りの場所", note: "This is 〜. ＝「ここは〜です」。Let's go to 〜. ＝「〜に行こう」。", gen: (lv) => {
      const [e, j] = pick(ROOM);
      return lvPick(lv, () => S("This is the " + e + ".", "ここは" + j + "です。", { kind: "room" }),
        () => pick([S("I like the " + e + ".", "わたしは" + j + "が好きです。", { kind: "room" }), S("Let's go to the " + e + ".", j + "に行こう。", { kind: "room" })]),
        () => S("This is my favorite place. It's the " + e + ".", "ここはわたしのお気に入りの場所です。" + j + "です。", { kind: "room" }));
    } },
  ];

  // ===== 小5 =====
  const COUNTRY = T(`Japan|日本
America|アメリカ
Canada|カナダ
Australia|オーストラリア
China|中国
Korea|韓国
India|インド
Brazil|ブラジル
France|フランス
Italy|イタリア
Spain|スペイン
Kenya|ケニア
Egypt|エジプト`);
  const MONTH = "January February March April May June July August September October November December".split(" ");
  const SUBJ = T(`Japanese|国語
math|算数
science|理科
social studies|社会
English|英語
music|音楽
home economics|家庭科`);
  const SKILL = T(`swim|泳ぐ
skate|スケートをする
ski|スキーをする
play the piano|ピアノをひく
play the recorder|リコーダーをふく
cook|料理をする
sing well|上手に歌う
run fast|速く走る
jump high|高くとぶ
ride a unicycle|一輪車に乗る
draw pictures well|上手に絵をかく`);
  const SEE = T(`Italy|pizza|ピザ|eat
India|curry|カレー|eat
France|croissants|クロワッサン|eat
Korea|kimchi|キムチ|eat
Spain|paella|パエリア|eat
Egypt|the pyramids|ピラミッド|see
Australia|kangaroos|カンガルー|see
China|pandas|パンダ|see
France|the Eiffel Tower|エッフェル塔|see
Kenya|giraffes|キリン|see`);
  const PLACE = T(`station|駅
hospital|病院
post office|郵便局
library|図書館
park|公園
bookstore|本屋
supermarket|スーパーマーケット
museum|博物館
zoo|動物園`);
  const MENU = T(`a hamburger|ハンバーガー
a hot dog|ホットドッグ
spaghetti|スパゲッティ
salad|サラダ
French fries|フライドポテト
orange juice|オレンジジュース
ice cream|アイスクリーム
curry and rice|カレーライス
a sandwich|サンドイッチ
pizza|ピザ`);
  const TRAIT = T(`kind|やさしい
brave|勇かん
funny|おもしろい
cool|かっこいい
strong|強い
smart|かしこい
cheerful|明るい`);
  const GOODAT = T(`cooking|料理
singing|歌
swimming|水泳
drawing|絵をかくこと
dancing|ダンス
running|走ること`);
  const FREQ = T(`always|いつも
usually|たいてい
sometimes|ときどき`);
  const CHORE = T(`walk my dog|犬の散歩をします|犬の散歩をすること
wash the dishes|皿を洗います|皿を洗うこと
clean my room|部屋をそうじします|部屋をそうじすること
take out the garbage|ごみを出します|ごみを出すこと
read books|本を読みます|本を読むこと
water the flowers|花に水をやります|花に水をやること
feed my cat|ねこにえさをやります|ねこにえさをやること`);
  const SEASON = T(`spring|春
summer|夏
fall|秋
winter|冬`);
  const ord = (d) => E4.ordWords(d).replace(" ", "-");
  const G5 = [
    { n: "自己紹介（I'm from 〜.）", note: "〈I'm from＋国〉＝「〜出身です」。国名は大文字で始める。", gen: (lv) => {
      const [n, nj] = pick(NAMES), [c, cj] = pick(COUNTRY), sp = pick(SPORT), sk = pick(SKILL);
      return lvPick(lv, () => pick([S("My name is " + n + ".", "わたしの名前は" + nj + "です。"), S("I'm from " + c + ".", "わたしは" + cj + "出身です。")]),
        () => pick([S("I'm " + n + ". I'm from " + c + ".", "わたしは" + nj + "です。" + cj + "出身です。"), S("I like " + sp[0] + ".", "わたしは" + sp[1] + "が好きです。")]),
        () => pick([S("Hello, I'm " + n + ". I can " + sk[0] + ".", "こんにちは、" + nj + "です。わたしは" + sk[1] + "ことができます。"), S("Where are you from? I'm from " + c + ".", "どこの出身ですか？ " + cj + "出身です。")]));
    }, read: (lv, k) => E4.READ.profile(lv, k) },
    { n: "誕生日（When is your birthday?）", note: "日付は May fifth のように、月＋「〜番目」の言い方（序数）で言う。", gen: (lv) => {
      const m = R(1, 12), d = R(1, lv < 0.5 ? 10 : 31) > 28 && m === 2 ? 14 : R(1, lv < 0.5 ? 10 : 30);
      const gift = pick(T(`a new bike|新しい自転車
a soccer ball|サッカーボール
a watch|うで時計
a new bag|新しいかばん
a big cake|大きなケーキ
a puppy|子犬`));
      return lvPick(lv, () => S("My birthday is " + MONTH[m - 1] + " " + ord(d) + ".", "わたしの誕生日は" + m + "月" + d + "日です。", { kind: "bd" }),
        () => pick([S("When is your birthday? It's " + MONTH[m - 1] + " " + ord(d) + ".", "あなたの誕生日はいつ？ " + m + "月" + d + "日です。", { kind: "bd" }), S("I want " + gift[0] + " for my birthday.", "わたしは誕生日に" + gift[1] + "がほしいです。", { kind: "gift" })]),
        () => S("My birthday is " + MONTH[m - 1] + " " + ord(d) + ". I want " + gift[0] + ".", "わたしの誕生日は" + m + "月" + d + "日です。" + gift[1] + "がほしいです。", { kind: "bd" }));
    }, read: (lv, k) => E4.READ.profile(lv, k) },
    { n: "教科と時間割", note: "〈I have＋教科＋on＋曜日〉＝「〜曜日に〜があります」。", gen: (lv) => {
      const [s, sj] = pick(SUBJ), [d, dj] = pick(DAY.slice(0, 5));
      return lvPick(lv, () => S("I have " + s + " on " + d + ".", dj + "に" + sj + "があります。", { kind: "subj" }),
        () => pick([S("My favorite subject is " + s + ".", "わたしの好きな教科は" + sj + "です。", { kind: "subj" }), S("What do you have on " + d + "?", dj + "は何がありますか？", { kind: "subjQ" })]),
        () => S("I like " + s + ". I have " + s + " on " + d + ".", "わたしは" + sj + "が好きです。" + dj + "に" + sj + "があります。", { kind: "subj" }));
    }, read: (lv, k) => E4.READ.profile(lv, k) },
    { n: "できること（I can 〜.）", note: "〈can＋動詞〉で「〜できる」。できないときは can't。主語が he / she でも can の形は同じ。", gen: (lv) => {
      const [e, j] = pick(SKILL), [n, nj] = pick(NAMES);
      return lvPick(lv, () => S("I can " + e + ".", "わたしは" + j + "ことができます。", { kind: "can" }),
        () => pick([S("I can't " + e + ".", "わたしは" + j + "ことができません。", { alt: ["I cannot " + e + "."], kind: "can" }), S("Can you " + e + "? Yes, I can.", "あなたは" + j + "ことができますか？ はい、できます。", { kind: "can" })]),
        () => pick([S(n + " can " + e + ".", nj + "は" + j + "ことができます。", { kind: "can" }), S("Can you " + e + "? No, I can't.", "あなたは" + j + "ことができますか？ いいえ、できません。", { kind: "can" })]));
    }, read: (lv, k) => E4.READ.profile(lv, k) },
    { n: "行きたい国（I want to go to 〜.）", note: "〈I want to go to＋場所〉＝「〜に行きたい」。〈You can 〜.〉＝「〜できます」。", gen: (lv) => {
      const [c, cj] = pick(COUNTRY.slice(1)), x = pick(SEE), xj = COUNTRY.find((y) => y[0] === x[0])[1];
      return lvPick(lv, () => S("I want to go to " + c + ".", "わたしは" + cj + "に行きたいです。", { kind: "go" }),
        () => pick([S("Where do you want to go? I want to go to " + c + ".", "どこに行きたい？ " + cj + "に行きたいです。", { kind: "go" }), S("I want to " + x[3] + " " + x[1] + ".", "わたしは" + x[2] + "を" + (x[3] === "eat" ? "食べ" : "見") + "たいです。", { kind: "go" })]),
        () => S("You can " + x[3] + " " + x[1] + " in " + x[0] + ".", xj + "では" + x[2] + "を" + (x[3] === "eat" ? "食べる" : "見る") + "ことができます。", { kind: "go" }));
    }, read: (lv, k) => E4.READ.trip(lv, k) },
    { n: "道案内", note: "Go straight.＝まっすぐ、Turn right / left.＝右／左に曲がる。〈at the second corner〉＝2つ目の角で。", gen: (lv) => {
      const [p, pj] = pick(PLACE), lr = pick([["right", "右"], ["left", "左"]]), nth = pick([["first", "1つ目"], ["second", "2つ目"], ["third", "3つ目"]]), b = R(2, 4);
      return lvPick(lv, () => pick([S("Go straight.", "まっすぐ行ってください。", { kind: "way" }), S("Turn " + lr[0] + ".", lr[1] + "に曲がってください。", { kind: "way" }), S("Where is the " + p + "?", pj + "はどこですか？", { kind: "wayQ" })]),
        () => pick([S("Turn " + lr[0] + " at the " + nth[0] + " corner.", nth[1] + "の角を" + lr[1] + "に曲がってください。", { kind: "way" }), S("Go straight for " + nW(b) + " blocks.", b + "ブロックまっすぐ行ってください。", { kind: "way" })]),
        () => { const sd = pick([["right", "右"], ["left", "左"]]); return pick([S("Turn " + lr[0] + " at the " + nth[0] + " corner. It's on your " + sd[0] + ".", nth[1] + "の角を" + lr[1] + "に曲がってください。" + sd[1] + "側にあります。", { kind: "way" }), S("Go straight. The " + p + " is on your " + sd[0] + ".", "まっすぐ行ってください。" + pj + "は" + sd[1] + "側にあります。", { kind: "way" })]); });
    }, read: (lv, k) => E4.READ.trip(lv, k) },
    { n: "注文（What would you like?）", note: "What would you like? ＝「何になさいますか」。I'd like 〜. ＝「〜をお願いします」（I would like のちぢめた形）。", gen: (lv) => {
      const [f, fj] = pick(MENU), p = R(2, 9) * 100 + pick([0, 50]);
      return lvPick(lv, () => pick([S("I'd like " + f + ".", fj + "をお願いします。", { kind: "order" }), S("What would you like?", "何になさいますか？", { kind: "orderQ" })]),
        () => pick([S("How much is it? It's " + p + " yen.", "いくらですか？ " + p + "円です。", { kind: "price" }), S("What would you like? I'd like " + f + ".", "何になさいますか？ " + fj + "をお願いします。", { kind: "order" })]),
        () => S("I'd like " + f + ", please. How much is it?", fj + "をお願いします。いくらですか？", { kind: "order" }));
    }, read: (lv, k) => E4.READ.trip(lv, k) },
    { n: "あこがれの人（He / She is 〜.）", note: "男の人は He、女の人は She。〈be good at 〜〉＝「〜が得意」。", gen: (lv) => {
      const [n, nj] = pick(NAMES), [t, tj] = pick(TRAIT), [g, gj] = pick(GOODAT), he = pick([["He", "彼", "brother", "兄"], ["She", "彼女", "sister", "姉"]]);
      return lvPick(lv, () => pick([S(n + " is my friend.", nj + "はわたしの友だちです。"), S(n + " is " + t + ".", nj + "は" + tj + "です。")]),
        () => pick([S(he[0] + " is good at " + g + ".", he[1] + "は" + gj + "が得意です。"), S("This is my " + he[2] + ". " + he[0] + " is " + t + ".", "こちらはわたしの" + he[3] + "です。" + he[1] + "は" + tj + "です。")]),
        () => S("My hero is my " + he[2] + ". " + he[0] + " is good at " + g + ".", "わたしのヒーローは" + he[3] + "です。" + he[1] + "は" + gj + "が得意です。"));
    }, read: (lv, k) => E4.READ.profile(lv, k) },
    { n: "ふだんの生活（always / sometimes）", note: "always＝いつも、usually＝たいてい、sometimes＝ときどき。動詞の前におく。", gen: (lv) => {
      const [f, fj] = pick(FREQ), [c, cj, cd] = pick(CHORE), h = R(5, 8);
      return lvPick(lv, () => S("I " + f + " " + c + ".", "わたしは" + fj + cj.replace(/^(犬|皿|部屋|ごみ|本|花|ねこ)/, "$1") + "。", { kind: "freq" }),
        () => S("I " + f + " get up at " + nW(h) + ".", "わたしは" + fj + h + "時に起きます。", { kind: "freq" }),
        () => S("I " + f + " " + c + " after dinner.", "わたしは" + fj + "夕食のあとに" + cj + "。", { kind: "freq" }));
    }, read: (lv, k) => E4.READ.day(lv, k) },
    { n: "ものの位置", note: "next to＝となり、in front of＝前、behind＝後ろ。", gen: (lv) => {
      const it = pick(ITEM.filter((x) => !/^e/.test(x[0]))), [f, fj] = pick(FURN), p = pick(T(`on|上
under|下
by|そば
next to|となり
in front of|前
behind|後ろ`));
      return lvPick(lv, () => S("It's " + p[0] + " the " + f + ".", fj + "の" + p[1] + "にあります。", { kind: "pos" }),
        () => S("Where is my " + it[0] + "? It's " + p[0] + " the " + f + ".", "わたしの" + it[1] + "はどこ？ " + fj + "の" + p[1] + "にあります。", { kind: "pos" }),
        () => S("Your " + it[0] + " is " + p[0] + " the " + f + ".", "あなたの" + it[1] + "は" + fj + "の" + p[1] + "にあります。", { kind: "pos" }));
    }, read: (lv, k) => E4.READ.day(lv, k) },
    { n: "季節と行事", note: "〈in＋季節・月〉＝「〜に」。〈We have 〜.〉＝「〜があります」。", gen: (lv) => {
      const [s, sj] = pick(SEASON), ev = pick(T(`Children's Day|こどもの日|May|5
the Star Festival|七夕|July|7
New Year's Day|元日|January|1
Christmas|クリスマス|December|12
Halloween|ハロウィーン|October|10`)), en = pick({ spring: [["the cherry blossoms", "桜"], ["hiking", "ハイキング"]], summer: [["swimming", "水泳"], ["camping", "キャンプ"]], fall: [["hiking", "ハイキング"], ["reading", "読書"]], winter: [["skiing", "スキー"], ["skating", "スケート"]] }[s]);
      return lvPick(lv, () => pick([S("I like " + s + ".", "わたしは" + sj + "が好きです。", { kind: "season" }), S("My favorite season is " + s + ".", "わたしの好きな季節は" + sj + "です。", { kind: "season" })]),
        () => S("We have " + ev[0] + " in " + ev[2] + ".", ev[3] + "月に" + ev[1] + "があります。", { kind: "event" }),
        () => S("I like " + s + ". We can enjoy " + en[0] + ".", "わたしは" + sj + "が好きです。" + en[1] + "を楽しむことができます。", { kind: "season" }));
    }, read: (lv, k) => E4.READ.day(lv, k) },
    { n: "好きなもの・ほしいもの（What 〜 do you like?）", note: "〈What＋名詞＋do you like?〉＝「何の〜が好き？」。", gen: (lv) => {
      const sp = pick(SPORT), an = pick(ANIMAL), co = pick(COLOR);
      return lvPick(lv, () => pick([S("What sport do you like? I like " + sp[0] + ".", "何のスポーツが好き？ " + sp[1] + "が好きです。"), S("What animal do you like? I like " + an[1] + ".", "何の動物が好き？ " + an[2] + "が好きです。")]),
        () => { const w = pick(T(`bike|自転車
bag|かばん
watch|うで時計
cap|ぼうし`)); return pick([S("What color do you like? I like " + co[0] + ".", "何色が好き？ " + co[1] + "が好きです。"), S("I want a new " + w[0] + ".", "わたしは新しい" + w[1] + "がほしいです。")]); },
        () => { const pet = pick(ANIMAL.slice(0, 3)); return S("I like " + pet[1] + ". I want " + art(pet[0]) + ".", "わたしは" + pet[2] + "が好きです。" + pet[2] + "がほしいです。"); });
    }, read: (lv, k) => E4.READ.profile(lv, k) },
  ];
  E4.T = T; E4.S = S; E4.lvPick = lvPick;
  E4.DATA = { COUNTRY, MONTH, SUBJ, SKILL, SPORT, ANIMAL, FOOD, COLOR, DAY, PLACE, MENU, TRAIT, GOODAT, CHORE, SEASON, NAMES };
  HM.EN4.E = { G3, G4, G5 };
})(typeof window !== "undefined" ? window : globalThis);
