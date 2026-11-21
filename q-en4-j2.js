/* ほしまなび 英語 v1.6 — 中2（4技能） */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, E4 = HM.EN4, { R, pick } = U;
  const { T, S, lvPick, J, V } = E4, { VP, vp, vj, THIRD, addF } = E4.JT, up = E4.firstUp;
  const wa = (j) => j + "は";
  const FUT = T(`tomorrow|明日
next Sunday|今度の日曜日に
next week|来週
this weekend|この週末に
this summer|この夏`);
  const FUTP = T(`visit my grandmother|祖母をたずねる|1
go to the beach|海辺へ行く|5
clean my room|部屋をそうじする|s
study for the test|テストに向けて勉強する|s
watch a movie|映画を見る|1
make a cake|ケーキを作る|5
play baseball|野球をする|s
buy a new bike|新しい自転車を買う|5
see a soccer game|サッカーの試合を見る|1
go camping|キャンプに行く|5`);
  const fj = (x, f) => { const m = x[1].match(/^(.*?)([^\s]+)$/); const vv = x[1].replace(/^.*?(する|行く|見る|作る|買う|たずねる)$/, "$1"); return x[1].slice(0, x[1].length - vv.length) + J(vv, x[2], f); };
  const W = T(`sunny|晴れ
rainy|雨
cloudy|くもり
snowy|雪`);
  addF(["will", "won't", "would"]); addF(["must", "should", "may", "can", "could"]); addF(["to", "for", "of"]); addF(["taller", "tall", "tallest"]); addF(["bigger", "big", "biggest"]); addF(["more", "most", "much", "many"]); addF(["than", "then", "that"]); addF(["better", "best", "good", "well"]); addF(["there", "they", "their"]);
  const ADJC = T(`tall|taller|tallest|背が高い
big|bigger|biggest|大きい
old|older|oldest|古い
long|longer|longest|長い
fast|faster|fastest|速い
young|younger|youngest|若い
small|smaller|smallest|小さい
heavy|heavier|heaviest|重い
easy|easier|easiest|かんたんな
popular|more popular|most popular|人気がある
interesting|more interesting|most interesting|おもしろい
difficult|more difficult|most difficult|むずかしい
beautiful|more beautiful|most beautiful|美しい
important|more important|most important|大切な`);
  ADJC.forEach((x) => addF(x.slice(0, 3).filter((w) => !/ /.test(w))));
  const jq = (a) => a.replace(/な$/, ""); // 「かんたんな」→「かんたん」
  // 「〜です」「〜ですか」：「人気がある」は「人気があります」「人気がありますか」にする
  const desu = (a) => (/ある$/.test(a) ? a.replace(/ある$/, "あります") : jq(a) + "です");
  const desuka = (a) => (/ある$/.test(a) ? a.replace(/ある$/, "ありますか") : jq(a) + "ですか");
  const PAIR = T(`this bag|that one|このかばん|あのかばん|bag
this book|that one|この本|あの本|book
this question|that one|この問題|あの問題|question
Ken|Tom|ケン|トム|person
my brother|my father|兄|父|person
this river|that one|この川|あの川|river
this park|that one|この公園|あの公園|park`);
  const FIT = { tall: "person", big: "bag park", old: "bag book park", long: "river book", fast: "person", young: "person", small: "bag park", heavy: "bag book", easy: "question book", popular: "book person park", interesting: "book", difficult: "question book", beautiful: "river park", important: "question" };
  const fit = (a, kind) => FIT[a].split(" ").includes(kind);
  const G8 = [
    { n: "未来の文① will", note: "〈will＋動詞の原形〉＝「〜するつもりだ」「〜だろう」。否定は will not（won't）、疑問文は Will 〜?。", gen: (lv) => {
      // 天気は近い日だけ（「この夏はくもり」は出さない）。Will you 〜? では my を your に
      const x = pick(FUTP), [t, tj] = pick(FUT), w = pick(W), [wt, wtj] = pick(FUT.filter((z) => /tomorrow|weekend|Sunday/.test(z[0]))), xy = x[0].replace(/\bmy\b/, "your");
      return lvPick(lv, () => pick([S("I will " + x[0] + " " + t + ".", "わたしは" + tj + fj(x, "dict") + "つもりです。", { alt: ["I'll " + x[0] + " " + t + "."] }), S("It will be " + w[0] + " " + wt + ".", wtj.replace(/に$/, "") + "は" + w[1] + "でしょう。")]),
        () => pick([S("Will you " + xy + " " + t + "? Yes, I will.", "あなたは" + tj + fj(x, "dict") + "つもりですか？ はい、そのつもりです。"), S("I won't " + x[0] + " " + t + ".", "わたしは" + tj + fj(x, "dict") + "つもりはありません。", { alt: ["I will not " + x[0] + " " + t + "."] })]),
        () => pick([S("Will you help me? Sure.", "手伝ってくれますか？ もちろん。"), S("I think it will be " + w[0] + " " + wt + ".", wtj.replace(/に$/, "") + "は" + w[1] + "だと思います。")]));
    }, read: (lv, k) => E4.PASS.pick(8, 0, k) },
    { n: "未来の文② be going to", note: "〈be going to＋動詞の原形〉＝「〜する予定だ」。be動詞は主語に合わせる（I am / He is / You are）。", gen: (lv) => {
      const x = pick(FUTP), [t, tj] = pick(FUT), th = pick(THIRD);
      return lvPick(lv, () => S("I'm going to " + x[0] + " " + t + ".", "わたしは" + tj + fj(x, "dict") + "予定です。", { alt: ["I am going to " + x[0] + " " + t + "."] }),
        () => pick([S(th[0] + " is going to " + x[0].replace(/\bmy\b/, th[2] === "f" ? "her" : "his") + " " + t + ".", wa(th[1]) + tj + fj(x, "dict") + "予定です。"), S("Are you going to " + x[0].replace(/\bmy\b/, "your") + " " + t + "?", "あなたは" + tj + fj(x, "dict") + "予定ですか？")]),
        () => S("What are you going to do " + t + "? I'm going to " + x[0] + ".", tj + "何をする予定ですか？ " + fj(x, "dict") + "予定です。"));
    }, read: (lv, k) => E4.PASS.pick(8, 1, k) },
    { n: "must / have to", note: "must＝「〜しなければならない」、have to も同じ意味（主語が3人称単数なら has to）。must not＝「〜してはいけない」、don't have to＝「〜しなくてもよい」。", gen: (lv) => {
      const A = T(`wash your hands|手を洗わ
do my homework|宿題をし
get up early tomorrow|明日早く起き
practice hard|一生けんめい練習し
finish this work today|今日この仕事を終わらせ`), a = pick(A), th = pick(THIRD.filter((z) => /^(He|She|Ken|Emma|Tom|Yumi)$/.test(z[0]))), N = T(`run in the hall|ろうかを走って
eat in this room|この部屋で食べて
swim in this river|この川で泳いで
use your phone in class|授業中に携帯電話を使って`), n = pick(N);
      const me = a[0].replace("your", "my");
      return lvPick(lv, () => pick([S("I must " + me + ".", "わたしは" + a[1] + "なければなりません。"), S("I have to " + me + ".", "わたしは" + a[1] + "なければなりません。")]),
        () => pick([S("You must not " + n[0] + ".", n[1] + "はいけません。", { alt: ["You mustn't " + n[0] + "."] }), S(th[0] + " has to " + a[0].replace("your", /^(She|Emma|Yumi)$/.test(th[0]) ? "her" : "his").replace(/\bmy\b/, /^(She|Emma|Yumi)$/.test(th[0]) ? "her" : "his") + ".", wa(th[1]) + a[1] + "なければなりません。")]),
        () => pick([S("You don't have to hurry.", "急がなくてもいいですよ。"), S("Do I have to " + me + "? No, you don't have to.", "わたしは" + a[1] + "なければなりませんか？ いいえ、その必要はありません。"), S("You must not " + n[0] + ".", n[1] + "はいけません。", { alt: ["You mustn't " + n[0] + "."] })]));
    }, read: (lv, k) => E4.PASS.pick(8, 2, k) },
    { n: "may / should / could / shall", note: "May I 〜?＝「〜してもいいですか」、should＝「〜したほうがよい」、Could you 〜?＝「〜していただけますか」、Shall I 〜?＝「〜しましょうか」、Shall we 〜?＝「（いっしょに）〜しませんか」。", gen: (lv) => {
      const C = T(`open the window|窓を開けて
close the door|ドアを閉めて
help me|手伝って
say that again|もう一度言って
take a picture of us|わたしたちの写真をとって`), c = pick(C), SH = T(`go to bed early|早くねた
see a doctor|医者にみてもらった
drink some water|水を飲んだ
take an umbrella|かさを持っていった`), sh = pick(SH), M = T(`use this pen|このペンを使って
come in|入って
sit here|ここにすわって
ask a question|質問して`), m = pick(M);
      return lvPick(lv, () => pick([S("May I " + m[0] + "? Sure.", m[1] + "もいいですか？ どうぞ。"), S("You should " + sh[0] + ".", sh[1] + "ほうがいいですよ。")]),
        () => pick([S("Could you " + c[0] + "?", c[1] + "いただけますか？"), S("Shall I " + c[0].replace("help me", "help you").replace(" us", " you") + "?", c[1].replace("手伝って", "手伝い").replace(/て$/, "").replace("開け", "開け").replace("閉め", "閉め") + "ましょうか？"), S("It may rain tomorrow.", "明日は雨がふるかもしれません。")]),
        () => pick([S("Shall we go shopping? Yes, let's.", "買い物に行きませんか？ はい、そうしましょう。"), S("You should " + sh[0] + ". You look tired.", sh[1] + "ほうがいいですよ。つかれているようですね。"), S("Could you " + c[0] + "? Sure.", c[1] + "いただけますか？ いいですよ。")]));
    }, read: (lv, k) => E4.PASS.pick(8, 3, k) },
    { n: "不定詞①「〜すること」", note: "〈to＋動詞の原形〉は「〜すること」の意味になる。want to 〜＝「〜したい」、like to 〜＝「〜するのが好き」、start to 〜＝「〜し始める」。", gen: (lv) => {
      const x = pick(VP.filter((z) => !/c/.test(z[5] || ""))), J2 = T(`a doctor|医者
a teacher|先生
a pilot|パイロット
an artist|芸術家
a scientist|科学者`), j = pick(J2), th = pick(THIRD);
      return lvPick(lv, () => pick([S("I want to " + vp(x, "b") + ".", "わたしは" + vj(x, "tai") + "です。"), (() => { const y = pick(VP.filter((z) => /f/.test(z[5] || ""))); return S("I like to " + vp(y, "b") + ".", "わたしは" + vj(y, "dict") + "のが好きです。"); })()]),
        () => pick([S("I want to be " + j[0] + ".", "わたしは" + j[1] + "になりたいです。"), S(th[0] + " started to " + vp(x, "b") + ".", wa(th[1]) + x[2] + J(x[3], x[4], "stem") + "始めました。")]),
        () => pick([S("My dream is to be " + j[0] + ".", "わたしの夢は" + j[1] + "になることです。"), S("My dream is to travel around the world.", "わたしの夢は世界中を旅行することです。"), S("What do you want to do? I want to " + vp(x, "b") + ".", "何をしたいですか？ " + vj(x, "tai") + "です。")]));
    }, read: (lv, k) => E4.PASS.pick(8, 4, k) },
    { n: "不定詞②「〜するために」「〜するための」", note: "〈to＋原形〉は「〜するために」（目的）、「〜して（うれしい）」（感情の理由）、名詞のあとで「〜するための・〜すべき」の意味にもなる。", gen: (lv) => {
      const P = T(`the park|play tennis|公園|テニスをする
the library|study|図書館|勉強する
the store|buy some milk|店|牛乳を買う
the station|meet my friend|駅|友だちに会う`), p = pick(P), F = T(`glad|うれしい
happy|うれしい
sad|悲しい
surprised|おどろきました`), f = pick(F), N = T(`a lot of homework to do|やるべき宿題がたくさん
something to drink|何か飲むもの
many places to visit|訪れる場所がたくさん
no time to watch TV|テレビを見る時間がまったく`), n = pick(N);
      const hasJ = { "a lot of homework to do": "わたしにはやるべき宿題がたくさんあります。", "something to drink": "わたしは何か飲むものがほしいです。", "many places to visit": "京都には訪れる場所がたくさんあります。", "no time to watch TV": "わたしにはテレビを見る時間がまったくありません。" };
      const hasE = { "a lot of homework to do": "I have a lot of homework to do.", "something to drink": "I want something to drink.", "many places to visit": "Kyoto has many places to visit.", "no time to watch TV": "I have no time to watch TV." };
      return lvPick(lv, () => S("I went to " + p[0] + " to " + p[1] + ".", "わたしは" + p[3].replace(/(る|う)$/, (m) => m) + "ために" + p[2] + "へ行きました。"),
        () => pick([S("I'm " + f[0] + " to hear that.", "それを聞いて" + (/ました$/.test(f[1]) ? f[1] : f[1] + "です") + "。"), S(hasE[n[0]], hasJ[n[0]])]),
        () => pick([S("Why did you go to " + p[0] + "? To " + p[1] + ".", "なぜ" + p[2] + "へ行ったのですか？ " + p[3] + "ためです。"), S(hasE[n[0]], hasJ[n[0]]), S("I was " + f[0] + " to see the news.", "そのニュースを見て" + (/ました$/.test(f[1]) ? f[1] : f[1].replace(/い$/, "かった") + "です") + "。")]));
    }, read: (lv, k) => E4.PASS.pick(8, 5, k) },
    { n: "動名詞（〜ing「〜すること」）", note: "動詞の ing 形は「〜すること」の意味にもなる。enjoy / finish / stop のあとは ing 形。前置詞（at, of など）のあとも ing 形。", gen: (lv) => {
      // 楽しむ・好き・楽しいは f、得意は k の動詞句だけ
      const x = pick(VP.filter((z) => z[0] !== "go" && /f/.test(z[5] || ""))), xk = pick(VP.filter((z) => /k/.test(z[5] || ""))), xa = pick(VP.filter((z) => z[0] !== "go")), th = pick(THIRD);
      return lvPick(lv, () => pick([S("I enjoy " + vp(x, "ing") + ".", "わたしは" + vj(x, "dict") + "のを楽しみます。"), S("I like " + vp(x, "ing") + ".", "わたしは" + vj(x, "dict") + "のが好きです。")]),
        () => pick([S(th[0] + " finished " + vp(xa, "ing") + ".", wa(th[1]) + xa[2] + J(xa[3], xa[4], "stem") + "終えました。"), S("I'm good at " + vp(xk, "ing") + ".", "わたしは" + vj(xk, "dict") + "のが得意です。")]),
        () => pick([S(up(vp(x, "ing")) + " is fun.", vj(x, "dict") + "のは楽しいです。"), S("How about " + vp(x, "ing") + " together?", "いっしょに" + vj(x, "dict") + "のはどうですか？"), S("Thank you for helping me.", "手伝ってくれてありがとう。")]));
    }, read: (lv, k) => E4.PASS.pick(8, 6, k) },
    { n: "接続詞 when / if / because / that", note: "when＝「〜するとき」、if＝「もし〜なら」、because＝「〜なので」、I think that 〜＝「〜だと思う」（that は省略できる）。", gen: (lv) => {
      const TH = T(`English is fun|英語は楽しい
this book is interesting|この本はおもしろい
he is kind|彼は親切だ
it will rain soon|もうすぐ雨がふる
she is right|彼女は正しい`), th = pick(TH), IF = T(`it is sunny tomorrow|let's go hiking|明日晴れたら|ハイキングに行きましょう
you are free|please help me|もしひまなら|手伝ってください
you are tired|you should rest|もしつかれているなら|休んだほうがいいですよ
it rains tomorrow|I will stay home|明日雨がふったら|わたしは家にいます`), f = pick(IF), BC = T(`I stayed home|I was sick|わたしは家にいました|具合が悪かった
I went to bed early|I was tired|わたしは早くねました|つかれていた
I like summer|I can swim in the sea|わたしは夏が好きです|海で泳げる
I was late|I missed the bus|わたしはおくれました|バスに乗りおくれた`), b = pick(BC);
      return lvPick(lv, () => S("I think that " + th[0] + ".", th[1] + "と思います。", { alt: ["I think " + th[0] + "."] }),
        () => pick([S("If " + f[0] + ", " + f[1] + ".", f[2] + "、" + f[3] + "。", { alt: [up(f[1]) + " if " + f[0] + "."] }), S(b[0] + " because " + b[1] + ".", b[3] + "ので、" + b[2] + "。")]),
        () => pick([S("When I got home, my mother was cooking.", "わたしが帰宅したとき、母は料理をしていました。", { alt: ["My mother was cooking when I got home."] }), S("When I was a child, I lived in Osaka.", "子どものころ、わたしは大阪に住んでいました。", { alt: ["I lived in Osaka when I was a child."] }), S("I don't think " + th[0] + ".", th[1].replace(/い$/, "くない").replace(/だ$/, "ではない").replace(/る$/, "らない").replace(/ふる$/, "ふらない") + "と思います。")]));
    }, read: (lv, k) => E4.PASS.pick(8, 7, k) },
    { n: "There is / There are 〜.", note: "〈There is＋単数〉〈There are＋複数〉＝「〜がある・いる」。疑問文は Is there 〜? / Are there 〜?。", gen: (lv) => {
      const P = T(`under the table|テーブルの下に
on the desk|机の上に
in the box|箱の中に
near my house|わたしの家の近くに`), p = pick(P), O1 = T(`a cat|ねこが1ぴき
a big tree|大きな木が1本
a library|図書館が1つ
an old bike|古い自転車が1台`), o = pick(O1), n = R(2, 6), O2 = T(`books|本|冊|on the desk|机の上に|あります|1冊も
parks|公園|つ|in this town|この町に|あります|1つも
students|生徒|人|in the music room|音楽室に|います|1人も
cups|カップ|個|in the box|箱の中に|あります|1個も
cats|ねこ|ひき|in the garden|庭に|います|1ぴきも`), o2 = pick(O2);
      const OK1 = { "a cat": /table|box|house/, "a big tree": /house/, "a library": /house/, "an old bike": /house/ }, p1 = pick(P.filter((z) => OK1[o[0]].test(z[0])));
      return lvPick(lv, () => S("There is " + o[0] + " " + p1[0] + ".", p1[1] + o[1] + "あります。".replace("ありま", /ねこ/.test(o[1]) ? "いま" : "ありま")),
        () => pick([S("There are " + E4.numWords(n) + " " + o2[0] + " " + o2[3] + ".", o2[4] + o2[1] + "が" + n + o2[2] + o2[5] + "。"), S("Is there a convenience store near here? Yes, there is.", "この近くにコンビニはありますか？ はい、あります。")]),
        () => pick([S("How many " + o2[0] + " are there " + o2[3] + "?", o2[4] + o2[1] + "は" + (o2[2] === "つ" ? "いくつ" : "何" + o2[2]) + o2[5].replace("ます", "ますか？")), S("There aren't any " + o2[0] + " " + o2[3] + ".", o2[4] + o2[1] + "は" + o2[6] + o2[5].replace("ます", "ません。"), { alt: ["There are no " + o2[0] + " " + o2[3] + "."] })]));
    }, read: (lv, k) => E4.PASS.pick(8, 8, k) },
    { n: "比較級（〜より…）", note: "「AはBより〜」は〈比較級＋than〉。短い語は -er（taller）、長い語は more 〜（more interesting）。Which is 〜er, A or B?＝「AとBではどちらが〜？」", gen: (lv) => {
      const a = pick(ADJC), ps = PAIR.filter((p) => fit(a[0], p[4])); const p = pick(ps);
      const be = "is";
      return lvPick(lv, () => S(up(p[0]) + " " + be + " " + a[1] + " than " + p[1] + ".", p[2] + "は" + p[3] + "より" + desu(a[3]) + "。"),
        () => (p[4] === "person" ? S("Who is " + a[1] + ", " + p[0] + " or " + p[1] + "?", p[2] + "と" + p[3] + "では、どちらが" + desuka(a[3]) + "？", { alt: ["Which is " + a[1] + ", " + p[0] + " or " + p[1] + "?"] }) : S("Which is " + a[1] + ", " + p[0] + " or " + p[1] + "?", p[2] + "と" + p[3] + "では、どちらが" + desuka(a[3]) + "？")),
        () => S(up(p[0]) + " " + be + " much " + a[1] + " than " + p[1] + ".", p[2] + "は" + p[3] + "よりずっと" + desu(a[3]) + "。"));
    }, read: (lv, k) => E4.PASS.pick(8, 9, k) },
    { n: "最上級（いちばん〜）", note: "「いちばん〜」は〈the＋最上級〉。-est（the tallest）または the most 〜。「〜の中で」は in＋場所・集団、of＋複数（of the five / of all）。", gen: (lv) => {
      const SP = T(`Mt. Fuji is the highest mountain in Japan.|富士山は日本でいちばん高い山です。
The Shinano River is the longest river in Japan.|信濃川は日本でいちばん長い川です。
This is the most popular song in our class.|これはわたしたちのクラスでいちばん人気のある歌です。
Emma runs the fastest in our class.|エマはクラスでいちばん速く走ります。
Math is the most difficult subject for me.|数学はわたしにとっていちばんむずかしい教科です。
Ken is the tallest of the five.|ケンは5人の中でいちばん背が高いです。
This is the oldest temple in this city.|これはこの市でいちばん古いお寺です。
Summer is the best season for swimming.|夏は水泳にいちばんよい季節です。`), s = pick(SP), Q2 = T(`Who is the tallest in your class?|あなたのクラスでいちばん背が高いのはだれですか？
Which season do you like the best?|どの季節がいちばん好きですか？
What is the most popular sport in Japan?|日本でいちばん人気のあるスポーツは何ですか？
Which is the biggest animal of all?|すべての中でいちばん大きい動物はどれですか？`), q = pick(Q2);
      return lvPick(lv, () => S(s[0], s[1]), () => pick([S(s[0], s[1]), S(q[0], q[1])]), () => S(q[0], q[1]));
    }, read: (lv, k) => E4.PASS.pick(8, 10, k) },
    { n: "as 〜 as / like A better than B", note: "〈as＋原級＋as〉＝「…と同じくらい〜」、not as 〜 as＝「…ほど〜ない」。like A better than B＝「BよりAが好き」、like A the best＝「Aがいちばん好き」。", gen: (lv) => {
      const a = pick(ADJC.filter((x) => !/ /.test(x[1]))), ps = PAIR.filter((p) => fit(a[0], p[4])), p = pick(ps), L = T(`summer|winter|夏|冬
dogs|cats|犬|ねこ
soccer|baseball|サッカー|野球
rice|bread|ごはん|パン
math|science|数学|理科`), l = pick(L);
      return lvPick(lv, () => S(up(p[0]) + " is as " + a[0] + " as " + p[1] + ".", p[2] + "は" + p[3] + "と同じくらい" + desu(a[3]) + "。"),
        () => pick([S("I like " + l[0] + " better than " + l[1] + ".", "わたしは" + l[3] + "より" + l[2] + "が好きです。"), S(up(p[0]) + " is not as " + a[0] + " as " + p[1] + ".", p[2] + "は" + p[3] + "ほど" + jq(a[3]).replace(/い$/, "く").replace(/([^く])$/, "$1では") + "ありません。", { alt: [up(p[0]) + " isn't as " + a[0] + " as " + p[1] + "."] })]),
        () => pick([S("Which do you like better, " + l[0] + " or " + l[1] + "? I like " + l[0] + " better.", l[2] + "と" + l[3] + "ではどちらが好きですか？ " + l[2] + "のほうが好きです。"), S("I like " + l[0] + " the best.", "わたしは" + l[2] + "がいちばん好きです。")]));
    }, read: (lv, k) => E4.PASS.pick(8, 11, k) },
    { n: "受け身（〜される）", note: "〈be動詞＋過去分詞〉＝「〜される・〜されている」。「だれによって」は by 〜。過去なら was / were を使う。", gen: (lv) => {
      const P = T(`English is spoken in many countries.|英語は多くの国で話されています。
This room is cleaned every day.|この部屋は毎日そうじされます。
This temple was built 500 years ago.|このお寺は500年前に建てられました。
This book is read by many students.|この本は多くの生徒に読まれています。
The window was broken yesterday.|その窓はきのう割られました。
These pictures were taken in Kyoto.|これらの写真は京都でとられました。
Soccer is played all over the world.|サッカーは世界中でプレーされています。
This song is loved by young people.|この歌は若い人たちに愛されています。
The letter was written by Ken.|その手紙はケンによって書かれました。
Rice is grown in this area.|米はこの地域で育てられています。`), p = pick(P), Q3 = T(`Is this song sung by many people? Yes, it is.|この歌は多くの人に歌われていますか？ はい、そうです。
When was this temple built?|このお寺はいつ建てられましたか？
What language is spoken in Brazil?|ブラジルでは何語が話されていますか？
Where were these pictures taken?|これらの写真はどこでとられましたか？`), q = pick(Q3);
      return lvPick(lv, () => S(p[0], p[1]), () => pick([S(p[0], p[1]), S(q[0], q[1])]), () => pick([S(q[0], q[1]), S(p[0], p[1])]));
    }, read: (lv, k) => E4.PASS.pick(8, 12, k) },
    { n: "SVOO・SVOC（give 人 物／call A B）", note: "〈give / show / tell＋人＋物〉＝「人に物を〜する」。〈call A B〉＝「AをBと呼ぶ」、〈make A B〉＝「AをBにする」。", gen: (lv) => {
      const O = T(`My father gave me a watch.|父はわたしにうで時計をくれました。
I'll show you some pictures.|あなたに何枚か写真を見せましょう。
Please tell me your name.|わたしにあなたの名前を教えてください。
Ms. Green teaches us English.|グリーン先生はわたしたちに英語を教えています。
I bought my sister a book.|わたしは妹に本を買いました。
Can you send me the map?|わたしに地図を送ってくれますか？`), o = pick(O), C2 = T(`We call him Ken.|わたしたちは彼をケンと呼びます。
This song makes me happy.|この歌はわたしを幸せな気持ちにします。
Please call me Yumi.|わたしをユミと呼んでください。
The news made us sad.|そのニュースはわたしたちを悲しませました。
We named our dog Pochi.|わたしたちは犬をポチと名づけました。
Please keep the room clean.|部屋をきれいにしておいてください。`), c = pick(C2);
      return lvPick(lv, () => S(o[0], o[1]), () => pick([S(o[0], o[1]), S(c[0], c[1])]), () => S(c[0], c[1]));
    }, read: (lv, k) => E4.PASS.pick(8, 13, k) },
    { n: "疑問詞＋to ／ It is 〜 to …", note: "〈how to＋原形〉＝「〜のしかた」、what to 〜＝「何を〜すべきか」、where to 〜＝「どこで〜すべきか」。〈It is 〜 (for 人) to …〉＝「（人にとって）…することは〜だ」。", gen: (lv) => {
      const H = T(`I don't know what to say.|わたしは何と言えばいいかわかりません。
Please tell me how to use this machine.|この機械の使い方を教えてください。
Do you know where to buy tickets?|どこでチケットを買えばいいか知っていますか？
I learned how to cook curry.|わたしはカレーの作り方を学びました。
I can't decide which to choose.|どちらを選べばいいか決められません。
Tell me when to start.|いつ始めればいいか教えてください。`), h = pick(H), I = T(`It is important to study English.|英語を勉強することは大切です。
It is fun for me to play the guitar.|ギターをひくことはわたしにとって楽しいです。
It is difficult for him to get up early.|早起きすることは彼にとってむずかしいです。
It is easy to make this cake.|このケーキを作るのはかんたんです。
It is dangerous to swim in this river.|この川で泳ぐのは危険です。
Is it hard for you to speak English?|英語を話すのはあなたにとってむずかしいですか？`), i = pick(I);
      return lvPick(lv, () => S(h[0], h[1]), () => pick([S(h[0], h[1]), S(i[0], i[1])]), () => S(i[0], i[1]));
    }, read: (lv, k) => E4.PASS.pick(8, 14, k) },
  ];
  E4.J8 = G8;
})(typeof window !== "undefined" ? window : globalThis);
