// ほしまなび 英語（小3〜中3）。単語は表から、文法は動詞・形容詞の表から自動生成。
(function (root) {
  const HM = root.HM, U = HM.U;
  const { R, pick, shuf, ch } = U;

  // ---- 単語表（カテゴリー別。選択肢は同じカテゴリーから出す） ----
  const V = {
    color: "red:赤 blue:青 yellow:黄色 green:緑 white:白 black:黒 pink:ピンク purple:むらさき brown:茶色 orange:オレンジ色",
    animal: "dog:犬 cat:ねこ rabbit:うさぎ bird:鳥 fish:魚 bear:くま lion:ライオン monkey:さる elephant:ぞう panda:パンダ tiger:トラ horse:馬 cow:牛 pig:ぶた mouse:ねずみ",
    fruit: "apple:りんご banana:バナナ grapes:ぶどう strawberry:いちご peach:もも melon:メロン lemon:レモン cherry:さくらんぼ watermelon:すいか pineapple:パイナップル",
    day: "Sunday:日曜日 Monday:月曜日 Tuesday:火曜日 Wednesday:水曜日 Thursday:木曜日 Friday:金曜日 Saturday:土曜日",
    weather: "sunny:晴れの rainy:雨の cloudy:くもりの snowy:雪の windy:風の強い",
    shape: "circle:丸 triangle:三角 square:正方形 star:星 heart:ハート rectangle:長方形",
    body: "head:頭 hand:手 eye:目 ear:耳 nose:鼻 mouth:口 shoulder:かた knee:ひざ",
    month: "January:1月 February:2月 March:3月 April:4月 May:5月 June:6月 July:7月 August:8月 September:9月 October:10月 November:11月 December:12月",
    subject: "Japanese:国語 math:算数 science:理科 social_studies:社会 English:英語 music:音楽 P.E.:体育 arts_and_crafts:図画工作 home_economics:家庭科",
    job: "teacher:先生 doctor:医者 nurse:看護師 cook:料理人 farmer:農家の人 pilot:パイロット singer:歌手 police_officer:警察官 firefighter:消防士 florist:花屋さん vet:獣医 baker:パン屋さん scientist:科学者 astronaut:宇宙飛行士",
    place: "school:学校 park:公園 station:駅 hospital:病院 library:図書館 post_office:郵便局 supermarket:スーパーマーケット zoo:動物園 aquarium:水族館 bookstore:本屋 police_station:警察署 temple:寺 shrine:神社",
    verb: "eat:食べる drink:飲む run:走る swim:泳ぐ sing:歌う dance:おどる cook:料理する read:読む write:書く sleep:ねむる walk:歩く study:勉強する buy:買う go:行く come:来る wash:洗う open:開ける close:閉める help:手伝う teach:教える",
    adj: "big:大きい small:小さい long:長い short:短い new:新しい sad:悲しい tall:背が高い fast:速い slow:おそい beautiful:美しい difficult:難しい easy:簡単な famous:有名な kind:親切な busy:いそがしい hungry:おなかがすいた tired:つかれた sleepy:ねむい",
    j1: "family:家族 friend:友だち country:国 language:言語 morning:朝 evening:夕方 breakfast:朝食 dinner:夕食 homework:宿題 weekend:週末 museum:博物館 picture:写真 question:質問 answer:答え favorite:お気に入りの always:いつも usually:たいてい sometimes:ときどき never:一度も〜ない every:毎〜",
    j2: "culture:文化 experience:経験 future:未来 dream:夢 history:歴史 information:情報 environment:環境 volunteer:ボランティア tradition:伝統 festival:祭り island:島 population:人口 speech:スピーチ problem:問題 reason:理由 example:例 important:大切な different:ちがう、異なる popular:人気のある useful:役に立つ",
    j3: "peace:平和 energy:エネルギー technology:科学技術 society:社会 government:政府 century:世紀 opinion:意見 effort:努力 solution:解決策 disaster:災害 equal:平等な necessary:必要な possible:可能な local:地元の global:地球規模の communicate:意思を伝え合う protect:守る reduce:減らす improve:改善する realize:気づく、実現する",
  };
  const VT = {};
  for (const k in V) { VT[k] = V[k].split(" ").map((x) => { const [e, j] = x.split(":"); return [e.replace(/_/g, " "), j]; }); const s = new Set(); VT[k].forEach(([e, j]) => { if (s.has(e) || s.has("@" + j)) throw new Error("vocab dup " + e); s.add(e); s.add("@" + j); }); }
  const vEJ = (cats) => (d) => { const c = pick(cats), [e, j] = pick(VT[c]); return ch("「" + e + "」の意味は？", j, shuf(VT[c].filter((w) => w[1] !== j)).map((w) => w[1]), "「" + e + "」は「" + j + "」。", { en: e }); };
  const vJE = (cats) => (d) => { const c = pick(cats), [e, j] = pick(VT[c]); return ch("「" + j + "」を英語で言うと？", e, shuf(VT[c].filter((w) => w[0] !== e)).map((w) => w[0]), "「" + j + "」は「" + e + "」。", { en: e }); };
  const vMix = (cats) => (d, i) => (d < 0.5 ? vEJ(cats)(d) : vJE(cats)(d));

  // ---- 数 ----
  const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
  const TENS = ",,twenty,thirty,forty,fifty,sixty,seventy,eighty,ninety".split(",");
  const word = (n) => (n < 20 ? ONES[n] : n === 100 ? "one hundred" : TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""));
  const ORD1 = "zeroth first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth".split(" ");
  const TORD = ",,twentieth,thirtieth".split(",");
  const ord = (n) => (n < 20 ? ORD1[n] : n % 10 === 0 ? TORD[n / 10] : TENS[Math.floor(n / 10)] + "-" + ORD1[n % 10]);
  const numQ = (hi) => (d) => {
    const n = R(1, Math.max(10, Math.round(10 + (hi - 10) * d)));
    const near = shuf([n + 1, n - 1, n + 10, n - 10, (n % 10) * 10 + Math.floor(n / 10), n + 2].filter((x) => x >= 1 && x <= 100 && x !== n));
    if (R(0, 1)) return ch("数字の「" + n + "」を英語で言うと？", word(n), near.map(word), n + " は " + word(n) + "。");
    return ch("「" + word(n) + "」は数字でいくつ？", String(n), near.map(String), word(n) + " は " + n + "。");
  };
  const ordQ = (d) => {
    const n = R(1, d < 0.4 ? 12 : 31);
    const near = shuf([n + 1, n - 1, n + 10, n - 10, n + 2].filter((x) => x >= 1 && x <= 31 && x !== n));
    const w = ord(n);
    return ch(n + "日（" + n + "番目）を英語で言うと？", w, near.map(ord).concat([word(n)]), n + "番目は " + w + "。" + (n === 1 || n === 2 || n === 3 ? "first / second / third は形が大きく変わる。" : n === 5 || n === 12 ? "five → fifth、twelve → twelfth のように ve が f に変わる。" : ""));
  };

  // ---- 動詞表 [原形, 3単現, 過去形, 過去分詞, -ing, 目的語など, 日本語] ----
  const VB = [
    ["play", "plays", "played", "played", "playing", "soccer", "サッカーをする"],
    ["study", "studies", "studied", "studied", "studying", "English", "英語を勉強する"],
    ["go", "goes", "went", "gone", "going", "to school", "学校へ行く"],
    ["watch", "watches", "watched", "watched", "watching", "TV", "テレビを見る"],
    ["have", "has", "had", "had", "having", "breakfast", "朝食を食べる"],
    ["like", "likes", "liked", "liked", "liking", "music", "音楽が好きだ"],
    ["eat", "eats", "ate", "eaten", "eating", "lunch", "昼食を食べる"],
    ["wash", "washes", "washed", "washed", "washing", "the dishes", "皿を洗う"],
    ["teach", "teaches", "taught", "taught", "teaching", "math", "数学を教える"],
    ["do", "does", "did", "done", "doing", "my homework", "宿題をする"],
    ["speak", "speaks", "spoke", "spoken", "speaking", "English", "英語を話す"],
    ["write", "writes", "wrote", "written", "writing", "a letter", "手紙を書く"],
    ["make", "makes", "made", "made", "making", "a cake", "ケーキを作る"],
    ["see", "sees", "saw", "seen", "seeing", "a movie", "映画を見る"],
    ["take", "takes", "took", "taken", "taking", "pictures", "写真をとる"],
    ["swim", "swims", "swam", "swum", "swimming", "in the sea", "海で泳ぐ"],
    ["run", "runs", "ran", "run", "running", "in the park", "公園で走る"],
    ["visit", "visits", "visited", "visited", "visiting", "Kyoto", "京都を訪れる"],
    ["cook", "cooks", "cooked", "cooked", "cooking", "dinner", "夕食を料理する"],
    ["buy", "buys", "bought", "bought", "buying", "a new bag", "新しいかばんを買う"],
    ["get", "gets", "got", "gotten", "getting", "up early", "早く起きる"],
    ["sing", "sings", "sang", "sung", "singing", "songs", "歌を歌う"],
    ["clean", "cleans", "cleaned", "cleaned", "cleaning", "the room", "部屋をそうじする"],
    ["use", "uses", "used", "used", "using", "a computer", "コンピューターを使う"],
    ["give", "gives", "gave", "given", "giving", "him a present", "彼にプレゼントをあげる"],
    ["read", "reads", "read", "read", "reading", "books", "本を読む"],
    ["ride", "rides", "rode", "ridden", "riding", "a bike", "自転車に乗る"],
    ["break", "breaks", "broke", "broken", "breaking", "the window", "窓を割る"],
  ];
  // 現在完了で使う（have/has + 過去分詞）文
  const PERF = [["eat", "I have already ( ) lunch.", "わたしはもう昼食を食べました。"], ["see", "I have ( ) this movie twice.", "わたしはこの映画を2回見たことがあります。"], ["write", "She has just ( ) a letter.", "彼女はちょうど手紙を書いたところです。"], ["take", "He has ( ) many pictures.", "彼はたくさん写真をとりました。"], ["speak", "Have you ever ( ) to him?", "あなたは今までに彼と話したことがありますか。"], ["swim", "I have never ( ) in the sea.", "わたしは一度も海で泳いだことがありません。"], ["ride", "Have you ever ( ) a horse?", "あなたは今までに馬に乗ったことがありますか。"], ["give", "My father has ( ) me a watch.", "父はわたしにうで時計をくれました。"], ["sing", "We have ( ) this song many times.", "わたしたちはこの歌を何度も歌ったことがあります。"], ["break", "Who has ( ) the window?", "だれが窓を割ったのですか。"], ["do", "I have already ( ) my homework.", "わたしはもう宿題をしました。"], ["go", "Ken has ( ) to America.", "ケンはアメリカへ行ってしまいました（今ここにいない）。"]];
  const VBm = {}; VB.forEach((v) => (VBm[v[0]] = v));
  const S3 = ["He", "She", "Ken", "My mother", "Yumi", "My brother"], SN = ["I", "You", "We", "They", "My parents", "Ken and Yumi"];
  const thirdQ = (d) => {
    const v = pick(VB.filter((x) => x[0] !== "get")), three = R(0, 2) > 0, s = three ? pick(S3) : pick(SN);
    const obj = v[0] === "do" && three ? (s === "She" || s === "My mother" || s === "Yumi" ? "her homework" : "his homework") : v[0] === "do" ? (s === "I" ? "my homework" : s === "You" ? "your homework" : "their homework") : v[5];
    const a = three ? v[1] : v[0];
    return ch(s + " ( ) " + obj + " every day.", a, [three ? v[0] : v[1], v[4], v[2]], three ? "主語「" + s + "」は3人称単数なので、動詞に s / es をつける →「" + v[1] + "」。" : "主語「" + s + "」は3人称単数ではないので、動詞は原形「" + v[0] + "」。", { en: 1 });
  };
  const pastQ = (d) => {
    const v = pick(VB.filter((x) => x[2] !== x[0] && x[0] !== "get" && x[0] !== "do")), s = pick(S3.concat(SN));
    const wrong = [v[0], v[1], v[4]]; if (v[2] !== v[0] + "ed" && !/e$/.test(v[0])) wrong.unshift(v[0] + "ed");
    return ch(s + " ( ) " + v[5] + " yesterday.", v[2], wrong, "yesterday（きのう）があるので過去形。「" + v[0] + "」の過去形は「" + v[2] + "」" + (v[2] === v[0] + "ed" || v[2] === v[0] + "d" ? "（ed をつける規則動詞）。" : v[0] === "study" ? "（y を i にかえて ed）。" : "（不規則動詞）。"), { en: 1 });
  };
  const IRR = VB.filter((v) => !/ed$/.test(v[2]));
  const irrQ = (d) => { const v = pick(IRR.filter((x) => x[2] !== x[0])); const fake = [v[0] + "ed", v[0].replace(/e$/, "") + "ed", v[1], v[3], v[4]].filter((x) => x !== v[2]); return ch("「" + v[0] + "」の過去形は？", v[2], shuf(fake), "「" + v[0] + "」は不規則動詞。過去形は「" + v[2] + "」、過去分詞は「" + v[3] + "」。", { en: 1 }); };
  const ppQ = (d) => { const [vb, s, j] = pick(PERF), v = VBm[vb]; return ch(s, v[3], [v[2], v[0], v[4], v[1]], "現在完了は〈have / has＋過去分詞〉。「" + v[0] + "」の過去分詞は「" + v[3] + "」。（" + j + "）", { en: 1 }); };
  const progQ = (d) => { const v = pick(VB.filter((x) => !["like", "have", "see"].includes(x[0]))), s = pick(S3.concat(SN)); const be = s === "I" ? "am" : SN.includes(s) ? "are" : "is"; return ch(s + " " + be + " ( ) " + (v[0] === "do" ? "the homework" : v[5]) + " now.", v[4], [v[0], v[1], v[2]], "〈be動詞＋〜ing〉で「今〜しているところ」（現在進行形）。「" + v[0] + "」の ing 形は「" + v[4] + "」。", { en: 1 }); };
  const BE = [["I", "am"], ["You", "are"], ["He", "is"], ["She", "is"], ["We", "are"], ["They", "are"], ["Ken", "is"], ["My cat", "is"], ["Tom and I", "are"], ["This book", "is"], ["These books", "are"], ["My sisters", "are"]];
  const BEC = ["a student", "from Japan", "in the room", "happy", "very kind", "busy today"];
  const beQ = (d) => { const [s, b] = pick(BE); let c = pick(BEC); if (/s$|and|We|They/.test(s) && c === "a student") c = "students"; if (/book/.test(s)) c = pick(["on the desk", "very old", "interesting"]); if (s === "My cat") c = pick(["very cute", "on the sofa", "white"]); return ch(s + " ( ) " + c + ".", b, ["am", "is", "are", "be"].filter((x) => x !== b), "主語が「" + s + "」のとき be動詞は「" + b + "」。I → am、you・複数 → are、3人称単数 → is。", { en: 1 }); };
  const beWQ = (d) => { const [s, b] = pick(BE.filter((x) => x[0] !== "I")); const w = b === "is" ? "was" : "were"; return ch(s + " ( ) " + (/s$|and|We|They/.test(s) ? "busy" : "busy") + " yesterday.", w, ["was", "were", "is", "are"].filter((x) => x !== w), "yesterday なので過去。主語「" + s + "」に合うのは「" + w + "」（is/am → was、are → were）。", { en: 1 }); };

  // ---- 比較 ----
  const CMP = [
    ["tall", "taller", "tallest", "Ken", "Taro", "in his class", "背が高い"], ["long", "longer", "longest", "This river", "that one", "in Japan", "長い"], ["big", "bigger", "biggest", "This dog", "that one", "of the three", "大きい"], ["hot", "hotter", "hottest", "Today", "yesterday", "of the week", "暑い"],
    ["easy", "easier", "easiest", "This question", "that one", "of all", "簡単な"], ["old", "older", "oldest", "My grandfather", "my grandmother", "in my family", "年上の"], ["happy", "happier", "happiest", "Yumi", "her sister", "in the world", "幸せな"], ["large", "larger", "largest", "This park", "that one", "in this city", "広い"],
    ["interesting", "more interesting", "most interesting", "This book", "that one", "of the five", "おもしろい"], ["beautiful", "more beautiful", "most beautiful", "This flower", "that one", "in the garden", "美しい"], ["popular", "more popular", "most popular", "Soccer", "baseball", "in my class", "人気がある"], ["difficult", "more difficult", "most difficult", "This problem", "that one", "of all", "難しい"], ["useful", "more useful", "most useful", "This dictionary", "that one", "of the three", "役に立つ"],
    ["good", "better", "best", "This idea", "that one", "of all", "よい"],
  ];
  const cmpQ = (d) => {
    const [b, er, est, A, B, grp, j] = pick(CMP), t = R(0, 2), more = /^more /.test(er);
    const forms = [b, er, est, more ? b + "er" : "more " + b, more ? b + "est" : "most " + b].filter((x) => !(b === "good" && /good(er|est)$|more good|most good/.test(x) && false));
    if (t === 0) return ch(A + " is ( ) than " + B + ".", er, forms.filter((x) => x !== er), "than（〜よりも）があるので比較級「" + er + "」。" + (more ? "長い語は more をつける。" : b === "good" ? "good の比較級は better（不規則）。" : ""), { en: 1 });
    if (t === 1) return ch(A + " is the ( ) " + grp + ".", est, forms.filter((x) => x !== est), "〈the＋最上級＋in / of〉で「いちばん〜」。「" + b + "」の最上級は「" + est + "」。", { en: 1 });
    return ch(A + " is as ( ) as " + B + ".", b, forms.filter((x) => x !== b), "〈as＋原級＋as〉で「〜と同じくらい」。as と as の間は元の形「" + b + "」。", { en: 1 });
  };

  HM.EN = { VT, VB, CMP, word, ord, PERF };

  // ---- 単元 ----
  HM.addUnits("en", 3, [
    HM.unit("いろいろな単語", [["色", vMix(["color"]), 8], ["動物", vMix(["animal"]), 8], ["くだもの", vMix(["fruit"]), 8], ["形", vMix(["shape"]), 6]]),
    HM.unit("数", [["1〜20の数", numQ(20), 8]]),
  ]);
  HM.addUnits("en", 4, [
    HM.unit("いろいろな単語", [["曜日", vMix(["day"]), 8], ["天気", vMix(["weather"]), 6], ["体の部分", vMix(["body"]), 8]]),
    HM.unit("数", [["1〜60の数", numQ(60), 8]]),
  ]);
  HM.addUnits("en", 5, [
    HM.unit("単語", [["月の名前", vMix(["month"]), 10], ["教科", vMix(["subject"]), 8], ["動作のことば", vMix(["verb"]), 10]]),
    HM.unit("数と日付", [["1〜100の数", numQ(100), 10], ["日付（序数）", ordQ, 10]]),
  ]);
  HM.addUnits("en", 6, [
    HM.unit("単語", [["職業", vMix(["job"]), 10], ["町の場所", vMix(["place"]), 10], ["ようすのことば", vMix(["adj"]), 10]]),
    HM.unit("文の形", [["過去のこと（went / ate / saw）", irrQ, 8]]),
  ]);
  HM.addUnits("en", 7, [
    HM.unit("単語", [["中1の単語", vMix(["j1"]), 10]]),
    HM.unit("be動詞", [["am / are / is", beQ, 10]]),
    HM.unit("一般動詞・3単現", [["3人称単数の s", thirdQ, 10]]),
    HM.unit("現在進行形", [["〜しているところ", progQ, 10]]),
    HM.unit("過去形", [["過去の文", pastQ, 10], ["不規則動詞", irrQ, 10], ["was / were", beWQ, 8]]),
  ]);
  HM.addUnits("en", 8, [
    HM.unit("単語", [["中2の単語", vMix(["j2"]), 10]]),
    HM.unit("比較", [["比較級・最上級・as〜as", cmpQ, 10]]),
  ]);
  HM.addUnits("en", 9, [
    HM.unit("単語", [["中3の単語", vMix(["j3"]), 10]]),
    HM.unit("現在完了", [["過去分詞", ppQ, 10]]),
  ]);
})(typeof window !== "undefined" ? window : globalThis);
