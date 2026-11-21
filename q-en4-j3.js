/* ほしまなび 英語 v1.6 — 中3（4技能） */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, E4 = HM.EN4, { R, pick } = U;
  const { T, S, lvPick } = E4, { THIRD, addF } = E4.JT, up = E4.firstUp, nw = E4.numWords;
  const wa = (j) => j + "は";
  addF(["have", "has", "had", "having"]); addF(["been", "be", "being"]); addF(["for", "since", "from"]); addF(["ever", "never", "every"]); addF(["already", "yet", "just", "still"]); addF(["who", "which", "what", "whose"]); addF(["were", "was", "are"]); addF(["would", "will", "could"]); addF(["too", "so", "very"]);
  const L = (t) => { const a = T(t); return () => pick(a); };
  const subj = () => pick([["I", "わたし", "have"], ["We", "わたしたち", "have"], ["He", "彼", "has"], ["She", "彼女", "has"], ["My sister", "姉", "has"], ["Ken", "ケン", "has"]]);
  const CONT = T(`lived in Osaka|大阪に住んでいます
known Emma|エマを知っています
studied English|英語を勉強しています
wanted a dog|犬をほしいと思っています
played the piano|ピアノをひいています
been a member of the art club|美術部に入っています
been busy|いそがしいです`);
  const FOR = T(`for three years|3年間
for a long time|長い間
since last year|去年から
since 2020|2020年から
since I was ten|10歳のときから
for two weeks|2週間`);
  const EXP = T(`visited Kyoto|京都を訪れた
seen a koala|コアラを見た
eaten natto|納豆を食べた
climbed Mt. Fuji|富士山に登った
been to Hokkaido|北海道に行った
read this book|この本を読んだ
talked with a famous singer|有名な歌手と話した`);
  const TIMES = T(`once|1回
twice|2回
three times|3回
many times|何回も`);
  const DONE = T(`finished my homework|宿題を終えた|finished your homework|宿題を終え
cleaned my room|部屋をそうじした|cleaned your room|部屋をそうじし
eaten lunch|昼食を食べた|eaten lunch|昼食を食べ
read the letter|手紙を読んだ|read the letter|手紙を読み
bought the tickets|チケットを買った|bought the tickets|チケットを買い
washed the dishes|皿を洗った|washed the dishes|皿を洗い`);
  const ING = T(`studying|勉強して
reading a book|本を読んで
playing video games|テレビゲームをして
waiting for the bus|バスを待って
practicing the guitar|ギターを練習して
cleaning the house|家をそうじして`);
  const HRS = T(`for two hours|2時間
for thirty minutes|30分間
since this morning|今朝から
since three o'clock|3時から
for an hour|1時間`);
  const PEO = T(`The boy|男の子
The girl|女の子
The man|男の人
The woman|女の人`);
  const DOING = T(`playing the guitar|ギターをひいている
running in the park|公園で走っている
talking with Ms. Brown|ブラウン先生と話している
reading a newspaper|新聞を読んでいる
standing by the door|ドアのそばに立っている
singing on the stage|ステージで歌っている`);
  const IS = T(`my brother|わたしの兄
my friend|わたしの友だち
our new teacher|わたしたちの新しい先生
my cousin|わたしのいとこ
my sister|わたしの姉`);
  const PP = T(`a car made in Japan|日本で作られた車
a book written in English|英語で書かれた本
a picture taken by my father|父がとった写真
a temple built 600 years ago|600年前に建てられたお寺
a song loved by many people|多くの人に愛されている歌
a dish called sukiyaki|すき焼きと呼ばれる料理
a letter written by my grandmother|祖母が書いた手紙`);
  const CONTACT = T(`the book|I bought yesterday|わたしがきのう買った本|本
the movie|we saw last night|わたしたちが昨夜見た映画|映画
the cake|my mother made|母が作ったケーキ|ケーキ
the song|I like the best|わたしがいちばん好きな歌|歌
the bag|Ken lost last week|ケンが先週なくしたかばん|かばん
the picture|she painted|彼女がかいた絵|絵`);
  const WHO = T(`a friend|lives in Canada|カナダに住んでいる友だち|lives
a sister|can speak French|フランス語を話せる姉|can
a teacher|teaches us music|わたしたちに音楽を教えてくれる先生|teaches
an uncle|works at a hospital|病院で働いているおじ|works
a cousin|plays soccer very well|サッカーがとても上手ないとこ|plays`);
  const WHO2 = T(`The girl who is singing|歌っている女の子|is Emma|エマです
The boy who won the race|レースに勝った男の子|is my brother|わたしの弟です
The man who lives next door|となりに住んでいる男の人|is a doctor|医者です
The student who came from Australia|オーストラリアから来た生徒|is very kind|とても親切です`).map((x) => [x[0], x[1], x[2], x[3] + "。"]);
  const WHICH = T(`a bus|goes to the station|駅へ行くバス
a dog|has long ears|耳の長い犬
a house|stands on the hill|丘の上に建っている家
a shop|sells old books|古本を売っている店
a train|leaves at seven|7時に出発する電車
a robot|can talk with people|人と話せるロボット`);
  const OBJ = T(`the picture|I took in Kyoto|わたしが京都でとった写真|is beautiful|美しい
the cake|my mother made|母が作ったケーキ|was delicious|おいしかった
the singer|I like the best|わたしがいちばん好きな歌手|is from Korea|韓国出身だ
the book|you gave me|あなたがくれた本|was very interesting|とてもおもしろかった
the man|we met yesterday|わたしたちがきのう会った男の人|is a famous artist|有名な芸術家だ`);
  const IND = T(`where he lives|彼がどこに住んでいるか|Where does he live?
what this is|これが何なのか|What is this?
when the party starts|パーティーがいつ始まるか|When does the party start?
why she was late|彼女がなぜおくれたのか|Why was she late?
who that man is|あの男の人がだれなのか|Who is that man?
how old the temple is|そのお寺が何年前のものか|How old is the temple?
what time it is|何時なのか|What time is it?`);
  const IFS = T(`If I were a bird, I could fly to you.|もしわたしが鳥なら、あなたのところへ飛んでいけるのに。
If I had a lot of money, I would travel around the world.|もしお金がたくさんあれば、世界中を旅行するのに。
If I were you, I would ask him.|もしわたしがあなたなら、彼にたずねるのに。
If I had more time, I could read more books.|もしもっと時間があれば、もっと本が読めるのに。
If it were sunny today, we could play outside.|もし今日晴れていたら、外で遊べるのに。
If I lived near the sea, I would swim every day.|もし海の近くに住んでいたら、毎日泳ぐのに。
If I knew her phone number, I would call her.|もし彼女の電話番号を知っていたら、電話するのに。
If I were a teacher, I would give no homework.|もしわたしが先生なら、宿題を出さないのに。`);
  const WISH = T(`I wish I could speak French.|フランス語が話せたらいいのに。
I wish I were taller.|もっと背が高ければいいのに。
I wish I had a sister.|姉がいたらいいのに。
I wish I could fly.|空を飛べたらいいのに。
I wish it were summer now.|今が夏ならいいのに。
I wish I had a dog.|犬を飼っていたらいいのに。
I wish I lived in Hokkaido.|北海道に住んでいたらいいのに。
I wish you were here.|あなたがここにいたらいいのに。`);
  const ASK = T(`want|you|to come to my party|あなたに、わたしのパーティーに来てほしい|わたしは
asked|me|to clean the room|わたしに、部屋をそうじするようにたのんだ|母は
told|us|to be quiet|わたしたちに、静かにするように言った|先生は
want|him|to join our team|彼に、わたしたちのチームに入ってほしい|わたしは
asked|her|to sing a song|彼女に、歌を歌うようにたのんだ|ケンは`);
  const LET = T(`Let me introduce myself.|自己紹介させてください。
Can you help me carry this box?|この箱を運ぶのを手伝ってくれますか？
My father let me use his camera.|父はわたしにカメラを使わせてくれました。
Please let me know the answer.|答えをわたしに知らせてください。
I helped my mother cook dinner.|わたしは母が夕食を作るのを手伝いました。
Let me think about it.|それについて考えさせてください。`);
  const TOO = T(`This tea is too hot to drink.|このお茶は熱すぎて飲めません。
He is too young to drive a car.|彼は若すぎて車を運転できません。
I was too tired to walk.|わたしはつかれすぎて歩けませんでした。
This box is too heavy for me to carry.|この箱はわたしには重すぎて運べません。
I was so tired that I went to bed early.|わたしはとてもつかれていたので、早くねました。
The question was so easy that everyone answered it.|その問題はとてもかんたんだったので、みんなが答えました。
She was so kind that everyone liked her.|彼女はとても親切だったので、みんなに好かれました。
It was so cold that we stayed home.|とても寒かったので、わたしたちは家にいました。`);
  const PASSV = T(`I was surprised at the news.|わたしはその知らせにおどろきました。
This desk is made of wood.|この机は木でできています。
Cheese is made from milk.|チーズは牛乳から作られます。
Her name is known to everyone.|彼女の名前はみんなに知られています。
The mountain is covered with snow.|その山は雪でおおわれています。
I'm interested in Japanese history.|わたしは日本の歴史に興味があります。
The room was filled with people.|その部屋は人でいっぱいでした。
This bag will be sold next month.|このかばんは来月売り出されます。
The game can be seen on TV.|その試合はテレビで見ることができます。
The bridge is being built now.|その橋は今、建設中です。`);
  const neg = (s) => s.replace(/います$/, "いません").replace(/です$/, "ではありません");
  const G9 = [
    { n: "現在完了①（継続：ずっと〜している）", note: "〈have / has＋過去分詞〉で「（今まで）ずっと〜している」。for＋期間（〜の間）、since＋始まった時（〜から）。How long 〜?＝「どのくらいの間？」", gen: (lv) => {
      // 「いそがしい」は短い期間だけ（「2020年からいそがしい」は出さない）
      const s = subj(), c = pick(CONT), f = pick(FOR.filter((x) => (s[0] === "I" || !/I was/.test(x[0])) && (c[0] !== "been busy" || /two weeks/.test(x[0]))));
      return lvPick(lv, () => S(s[0] + " " + s[2] + " " + c[0] + " " + f[0] + ".", wa(s[1]) + f[1] + c[1] + "。"),
        () => S("How long have you " + c[0] + "? " + up(f[0]) + ".", "あなたはどのくらいの間" + c[1].replace(/。?$/, "") + "か？ " + f[1] + "です。"),
        () => { const n = pick(T(`seen Ken|ケンに会っていません
heard from Emma|エマから連絡がありません
eaten sushi|すしを食べていません
played tennis|テニスをしていません`)), f2 = pick(FOR.filter((x) => /since/.test(x[0]) && (s[0] === "I" || !/I was/.test(x[0])))); if (n[0].includes(s[0])) return S("I haven't " + n[0] + " " + f2[0].replace("since I was ten", "since last year") + ".", "わたしは" + (f2[0] === "since I was ten" ? "去年から" : f2[1]) + n[1] + "。", { alt: ["I have not " + n[0] + " " + f2[0].replace("since I was ten", "since last year") + "."] }); return S(s[0] + " " + s[2] + "n't " + n[0] + " " + f2[0] + ".", wa(s[1]) + f2[1] + n[1] + "。", { alt: [s[0] + " " + s[2] + " not " + n[0] + " " + f2[0] + "."] }); });
    }, read: (lv, k) => E4.PASS.pick(9, 0, k) },
    { n: "現在完了②（経験：〜したことがある）", note: "〈have / has＋過去分詞〉で「〜したことがある」。回数は once / twice / 〜 times、Have you ever 〜?＝「今までに〜したことがありますか」、never＝「一度も〜ない」。", gen: (lv) => {
      const s = subj(), e = pick(EXP), t = pick(TIMES);
      return lvPick(lv, () => S(s[0] + " " + s[2] + " " + e[0] + " " + t[0] + ".", wa(s[1]) + t[1] + e[1] + "ことがあります。"),
        () => S("Have you ever " + e[0] + "? Yes, I have.", "あなたは今までに" + e[1] + "ことがありますか？ はい、あります。"),
        () => pick([S(s[0] + " " + s[2] + " never " + e[0] + ".", wa(s[1]) + "一度も" + e[1] + "ことがありません。"), S("How many times have you " + e[0] + "? " + up(t[0]) + ".", "あなたは何回" + e[1] + "ことがありますか？ " + t[1] + "です。")]));
    }, read: (lv, k) => E4.PASS.pick(9, 1, k) },
    { n: "現在完了③（完了：もう〜した）", note: "〈have / has＋過去分詞〉で「（ちょうど・もう）〜したところだ」。just＝ちょうど、already＝もう、yet＝疑問文で「もう」、否定文で「まだ」。", gen: (lv) => {
      const s = subj(), d = pick(DONE);
      const mine = (x) => (/^(He|Ken)$/.test(s[0]) ? x.replace(/\bmy\b/, "his") : /^(She|My sister)$/.test(s[0]) ? x.replace(/\bmy\b/, "her") : /^We$/.test(s[0]) ? x.replace(/\bmy\b/, "our") : x);
      return lvPick(lv, () => S(s[0] + " " + s[2] + " just " + mine(d[0]) + ".", wa(s[1]) + "ちょうど" + d[1] + "ところです。"),
        () => pick([S(s[0] + " " + s[2] + " already " + mine(d[0]) + ".", wa(s[1]) + "もう" + d[3] + "ました。"), S("Have you " + d[2] + " yet? Yes, I have.", "もう" + d[3] + "ましたか？ はい、" + d[3] + "ました。")]),
        () => S("I haven't " + d[0] + " yet.", ("わたしはまだ" + d[3] + "ていません。").replace("読みていません", "読んでいません").replace("買いていません", "買っていません").replace("洗いていません", "洗っていません"), { alt: ["I have not " + d[0] + " yet."] }));
    }, read: (lv, k) => E4.PASS.pick(9, 2, k) },
    { n: "現在完了進行形（ずっと〜し続けている）", note: "〈have / has been＋〜ing〉＝「（今まで）ずっと〜し続けている」。動作が今も続いていることを表す。", gen: (lv) => {
      const s = subj(), g = pick(ING), h = pick(HRS);
      return lvPick(lv, () => S(s[0] + " " + s[2] + " been " + g[0] + " " + h[0] + ".", wa(s[1]) + h[1] + g[1] + "います。"),
        () => pick([S("It has been raining since this morning.", "今朝からずっと雨がふり続いています。"), S("How long have you been " + g[0] + "? " + up(h[0]) + ".", "どのくらいの間" + g[1] + "いるのですか？ " + h[1] + "です。")]),
        () => S("How long have you been " + g[0] + "? I've been " + g[0] + " " + h[0] + ".", "どのくらいの間" + g[1] + "いるのですか？ " + h[1] + g[1] + "います。", { alt: ["How long have you been " + g[0] + "? I have been " + g[0] + " " + h[0] + "."] }));
    }, read: (lv, k) => E4.PASS.pick(9, 3, k) },
    { n: "受け身の発展（be made of / be known to など）", note: "by 以外の前置詞を使う受け身：be made of（材料）／be made from（原料）、be known to（〜に知られている）、be covered with、be interested in、be surprised at。", gen: (lv) => { const p = pick(PASSV); return S(p[0], p[1]); }, read: (lv, k) => E4.PASS.pick(9, 4, k) },
    { n: "名詞を後ろから説明①（〜している…）", note: "〈名詞＋〜ing＋語句〉で「〜している（名詞）」。the boy playing the guitar＝「ギターをひいている男の子」。", gen: (lv) => {
      // 人と説明を合わせる：兄は男の子・男の人、姉は女の子・女の人、先生はおとなだけ
      const p = pick(PEO), d = pick(DOING), i = pick(IS.filter((z) => (z[0] !== "my brother" || /boy|man/i.test(p[0]) && !/woman/i.test(p[0])) && (z[0] !== "my sister" || /girl|woman/i.test(p[0])) && (z[0] !== "our new teacher" || /man|woman/i.test(p[0]))));
      return lvPick(lv, () => S("Look at " + p[0].toLowerCase() + " " + d[0] + ".", d[1] + p[1] + "を見て。"),
        () => S(p[0] + " " + d[0] + " is " + i[0] + ".", d[1] + p[1] + "は" + i[1] + "です。"),
        () => S("Who is " + p[0].toLowerCase() + " " + d[0] + "?", d[1] + p[1] + "はだれですか？"));
    }, read: (lv, k) => E4.PASS.pick(9, 5, k) },
    { n: "名詞を後ろから説明②（〜された…）", note: "〈名詞＋過去分詞＋語句〉で「〜された（名詞）」。a car made in Japan＝「日本で作られた車」。", gen: (lv) => {
      const h = pick(["I have", "This is", "I want"]), p = pick(h === "This is" ? PP : PP.filter((x) => /car|book|picture|letter/.test(x[0]))), hj = { "I have": ["わたしは", "を持っています"], "This is": ["これは", "です"], "I want": ["わたしは", "がほしいです"] }[h];
      return lvPick(lv, () => S(h + " " + p[0] + ".", hj[0] + p[1] + hj[1] + "。"),
        () => S(h + " " + p[0] + ".", hj[0] + p[1] + hj[1] + "。"),
        () => pick([S("The language spoken in Brazil is Portuguese.", "ブラジルで話されている言語はポルトガル語です。"), S("The pictures taken by my father are beautiful.", "父がとった写真は美しいです。"), S("I read a book written in English.", "わたしは英語で書かれた本を読みました。"), S("Kyoto has many temples built long ago.", "京都には昔建てられたお寺がたくさんあります。"), S("Is this a car made in Japan?", "これは日本で作られた車ですか？"), S(h + " " + p[0] + ".", hj[0] + p[1] + hj[1] + "。"), S(h + " " + p[0] + ".", hj[0] + p[1] + hj[1] + "。")]));
    }, read: (lv, k) => E4.PASS.pick(9, 6, k) },
    { n: "名詞を後ろから説明③（主語＋動詞が続く形）", note: "〈名詞＋主語＋動詞〉で「（主語）が〜する（名詞）」。the book I bought＝「わたしが買った本」。", gen: (lv) => {
      const c = pick(CONTACT), E2 = { book: "was interesting|おもしろかったです", movie: "was great|すばらしかったです", cake: "was delicious|おいしかったです", song: "is very old|とても古いです", bag: "was blue|青色でした", picture: "is beautiful|美しいです" }[c[0].split(" ")[1]].split("|");
      return lvPick(lv, () => S("This is " + c[0] + " " + c[1] + ".", "これは" + c[2] + "です。"),
        () => S(up(c[0]) + " " + c[1] + " " + E2[0] + ".", c[2] + "は" + E2[1] + "。"),
        () => pick([S("Everything she said was true.", "彼女が言ったことはすべて本当でした。"), S(up(c[0]) + " " + c[1] + " " + E2[0] + ".", c[2] + "は" + E2[1] + "。"), S("Is this " + c[0] + " " + c[1] + "?", "これは" + c[2] + "ですか？")]));
    }, read: (lv, k) => E4.PASS.pick(9, 7, k) },
    { n: "関係代名詞 who（〜する人）", note: "人を後ろから説明するときは who を使う。a friend who lives in Canada＝「カナダに住んでいる友だち」。who のあとの動詞は説明される人に合わせる。", gen: (lv) => {
      const w = pick(WHO), w2 = pick(WHO2);
      return lvPick(lv, () => S("I have " + w[0] + " who " + w[1] + ".", "わたしには" + w[2] + "がいます。"),
        () => pick([S(w2[0] + " " + w2[2] + ".", w2[1] + "は" + w2[3]), S("I have " + w[0] + " who " + w[1] + ".", "わたしには" + w[2] + "がいます。")]),
        () => pick([S(w2[0] + " " + w2[2] + ".", w2[1] + "は" + w2[3]), S("Do you know anyone who can speak Chinese?", "中国語を話せる人をだれか知っていますか？")]));
    }, read: (lv, k) => E4.PASS.pick(9, 8, k) },
    { n: "関係代名詞 which / that（主格）", note: "人以外を後ろから説明するときは which、人にも物にも使えるのが that。a bus which goes to the station＝「駅へ行くバス」。", gen: (lv) => {
      const w = pick(WHICH), rel = pick(["which", "that"]);
      return lvPick(lv, () => S("This is " + w[0] + " " + rel + " " + w[1] + ".", "これは" + w[2] + "です。", { alt: ["This is " + w[0] + " " + (rel === "which" ? "that" : "which") + " " + w[1] + "."] }),
        () => (/train|bus/.test(w[0]) ? S("Let's take " + w[0].replace(/^an? /, "the ") + " " + rel + " " + w[1] + ".", w[2] + "に乗りましょう。", { alt: ["Let's take " + w[0].replace(/^an? /, "the ") + " " + (rel === "which" ? "that" : "which") + " " + w[1] + "."] }) : /shop/.test(w[0]) ? S("Let's go to the shop " + rel + " " + w[1] + ".", w[2] + "に行きましょう。", { alt: ["Let's go to the shop " + (rel === "which" ? "that" : "which") + " " + w[1] + "."] }) : S("I want " + w[0] + " " + rel + " " + w[1] + ".", "わたしは" + w[2] + "がほしいです。", { alt: ["I want " + w[0] + " " + (rel === "which" ? "that" : "which") + " " + w[1] + "."] })),
        () => pick([(/dog|robot/.test(w[0]) ? S("Do you have " + w[0] + " " + rel + " " + w[1] + "?", "あなたは" + w[2] + "を持っていますか？", { alt: ["Do you have " + w[0] + " " + (rel === "which" ? "that" : "which") + " " + w[1] + "?"] }) : S("There is " + w[0] + " " + rel + " " + w[1] + ".", w[2] + "があります。", { alt: ["There is " + w[0] + " " + (rel === "which" ? "that" : "which") + " " + w[1] + "."] })), S("Look at " + w[0].replace(/^an? /, "the ") + " " + rel + " " + w[1] + ".", w[2] + "を見て。", { alt: ["Look at " + w[0].replace(/^an? /, "the ") + " " + (rel === "which" ? "that" : "which") + " " + w[1] + "."] }), S("I like stories that have happy endings.", "わたしはハッピーエンドの物語が好きです。", { alt: ["I like stories which have happy endings."] }), S("The dog that is sleeping under the tree is Pochi.", "木の下でねている犬はポチです。", { alt: ["The dog which is sleeping under the tree is Pochi."] })]));
    }, read: (lv, k) => E4.PASS.pick(9, 9, k) },
    { n: "関係代名詞（目的格）which / that", note: "〈名詞＋which / that＋主語＋動詞〉＝「（主語）が〜する（名詞）」。目的格の which / that は省略できる。", gen: (lv) => {
      const o = pick(OBJ), rel = o[0] === "the singer" || o[0] === "the man" ? "that" : pick(["which", "that"]);
      const other = /singer|man/.test(o[0]) ? "who" : rel === "which" ? "that" : "which";
      const alts = (pre, post) => ["", other].map((r) => up(pre + o[0] + (r ? " " + r : "") + " " + o[1] + post));
      const jaEnd = o[2] + "は" + o[4].replace(/だ$/, "です").replace(/い$/, "いです").replace(/た$/, "たです") + "。";
      return lvPick(lv, () => S("This is " + o[0] + " " + rel + " " + o[1] + ".", "これは" + o[2] + "です。", { alt: alts("This is ", ".") }),
        () => S(up(o[0]) + " " + rel + " " + o[1] + " " + o[3] + ".", jaEnd, { alt: alts("", " " + o[3] + ".") }),
        () => (/singer|man/.test(o[0]) ? S("Do you know " + o[0] + " " + rel + " " + o[1] + "?", "あなたは" + o[2] + "を知っていますか？", { alt: alts("Do you know ", "?") }) : S(up(o[0]) + " " + rel + " " + o[1] + " " + o[3] + ".", jaEnd, { alt: alts("", " " + o[3] + ".") })));
    }, read: (lv, k) => E4.PASS.pick(9, 10, k) },
    { n: "間接疑問（I know where 〜.）", note: "疑問文が文の中に入ると〈疑問詞＋主語＋動詞〉の順になる。Where does he live? → I know where he lives.", gen: (lv) => {
      const d = pick(IND), H = T(`I don't know|わたしは|がわかりません
Do you know|あなたは|を知っていますか？
Please tell me|わたしに|を教えてください
I want to know|わたしは|を知りたいです`), h = pick(H);
      const end = h[0].startsWith("Do") ? "?" : ".";
      const ja = h[1] + d[1] + h[2] + (h[2].endsWith("？") ? "" : "。");
      return lvPick(lv, () => S("I don't know " + d[0] + ".", "わたしは" + d[1] + "がわかりません。"),
        () => S(h[0] + " " + d[0] + end, ja),
        () => pick([S(h[0] + " " + d[0] + end, ja), S("I wonder why she was late.", "彼女はなぜおくれたのだろう。")]));
    }, read: (lv, k) => E4.PASS.pick(9, 11, k) },
    { n: "仮定法① If I were 〜（もし〜なら）", note: "今の事実とちがうことを想像するときは〈If＋主語＋過去形 〜, 主語＋would / could＋原形〉。be動詞はふつう were を使う。", gen: (lv) => { const p = pick(IFS); return S(p[0], p[1]); }, read: (lv, k) => E4.PASS.pick(9, 12, k) },
    { n: "仮定法② I wish 〜（〜ならいいのに）", note: "〈I wish＋主語＋過去形（were / could など）〉＝「〜ならいいのに」。実現しにくい願いを表す。", gen: (lv) => { const p = pick(WISH); return S(p[0], p[1]); }, read: (lv, k) => E4.PASS.pick(9, 13, k) },
    { n: "want 人 to 〜／let・help 人 〜", note: "〈want / ask / tell＋人＋to＋原形〉＝「人に〜してほしい／〜するようたのむ／言う」。〈let / help＋人＋原形〉＝「人に〜させる／人が〜するのを手伝う」。", gen: (lv) => {
      const a = pick(ASK), sub = { "わたしは": "I", "母は": "My mother", "先生は": "Our teacher", "ケンは": "Ken" }[a[4]], l = pick(LET);
      const ja = a[4] + a[3] + (a[0] === "want" ? "です。" : "。").replace("だ。", "だ。");
      const jaP = ja.replace(/たのんだ。$/, "たのみました。").replace(/言った。$/, "言いました。");
      return lvPick(lv, () => S(sub + " " + a[0] + " " + a[1] + " " + a[2] + ".", jaP), () => pick([S(sub + " " + a[0] + " " + a[1] + " " + a[2] + ".", jaP), S(l[0], l[1])]), () => S(l[0], l[1]));
    }, read: (lv, k) => E4.PASS.pick(9, 14, k) },
  ];
  G9.push({ n: "中3のまとめ（too 〜 to／so 〜 that）", note: "〈too＋形容詞＋to＋原形〉＝「〜すぎて…できない」、〈so＋形容詞＋that＋文〉＝「とても〜なので…」。中3の文法をまとめて使おう。", gen: (lv) => (lv < 0.5 || R(0, 1) ? (() => { const p = pick(TOO); return S(p[0], p[1]); })() : pick(G9.slice(0, 12)).gen(lv)), read: (lv, k) => E4.PASS.pick(9, 15, k) });
  E4.J9 = G9;
})(typeof window !== "undefined" ? window : globalThis);
