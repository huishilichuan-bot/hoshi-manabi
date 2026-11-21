/* ほしまなび 英語 v1.6 — 中学の動詞ツール＋中1（4技能） */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, E4 = HM.EN4, { R, pick, shuf } = U;
  const { T, S, lvPick } = E4, up = E4.firstUp, art = E4.art;
  // ---- 英語の動詞の形 ----
  const IRRV = T(`go|went|gone
eat|ate|eaten
have|had|had
make|made|made
take|took|taken
write|wrote|written
read|read|read
see|saw|seen
buy|bought|bought
drink|drank|drunk
draw|drew|drawn
speak|spoke|spoken
sing|sang|sung
swim|swam|swum
get|got|gotten
come|came|come
give|gave|given
do|did|done
run|ran|run
find|found|found
leave|left|left
meet|met|met
teach|taught|taught
tell|told|told
build|built|built
know|knew|known
send|sent|sent
sleep|slept|slept
begin|began|begun
lose|lost|lost
feel|felt|felt
win|won|won
hear|heard|heard
say|said|said
think|thought|thought
catch|caught|caught
forget|forgot|forgotten
grow|grew|grown
ride|rode|ridden
fly|flew|flown
wear|wore|worn
break|broke|broken
choose|chose|chosen
keep|kept|kept
put|put|put
cut|cut|cut
bring|brought|brought
sell|sold|sold
show|showed|shown
stand|stood|stood
understand|understood|understood
become|became|become
hold|held|held
paint|painted|painted`);
  const IRR = {}; IRRV.forEach(([b, p, pp]) => (IRR[b] = { p, pp }));
  IRRV.forEach(([b, p, pp]) => { E4.IRR[b] = b; E4.IRR[p] = b; E4.IRR[pp] = b; });
  const DBL = /^(stop|plan|swim|run|get|sit|cut|put|begin|shop|jog|hit|win|chat)$/;
  const V = {
    s: (b) => (b === "have" ? "has" : b === "do" ? "does" : b === "go" ? "goes" : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + "ies" : /(s|sh|ch|x|o)$/.test(b) ? b + "es" : b + "s"),
    p: (b) => (IRR[b] ? IRR[b].p : /e$/.test(b) ? b + "d" : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + "ied" : DBL.test(b) ? b + b.slice(-1) + "ed" : b + "ed"),
    pp: (b) => (IRR[b] ? IRR[b].pp : V.p(b)),
    ing: (b) => (b === "die" ? "dying" : DBL.test(b) ? b + b.slice(-1) + "ing" : /[^e]e$/.test(b) && b !== "see" ? b.slice(0, -1) + "ing" : b + "ing"),
  };
  E4.V = V;
  // FORMS（カードのまぎらわしい語）に動詞の形を入れる
  const addF = (g) => g.forEach((w) => { const k = w.toLowerCase(); E4.FORMS[k] = [...new Set((E4.FORMS[k] || []).concat(g.filter((x) => x !== w)))]; });
  // ---- 日本語の動詞の形 ----
  const GOD = { う: ["い", "わ", "って", "った"], く: ["き", "か", "いて", "いた"], ぐ: ["ぎ", "が", "いで", "いだ"], す: ["し", "さ", "して", "した"], つ: ["ち", "た", "って", "った"], ぬ: ["に", "な", "んで", "んだ"], ぶ: ["び", "ば", "んで", "んだ"], む: ["み", "ま", "んで", "んだ"], る: ["り", "ら", "って", "った"] };
  function J(v, t, f) {
    let st, na, te, ta;
    if (t === "s") { const b = v.slice(0, -2); st = b + "し"; na = b + "し"; te = b + "して"; ta = b + "した"; }
    else if (t === "k") { const b = v.slice(0, -2); st = b + "き"; na = b + "こ"; te = b + "きて"; ta = b + "きた"; }
    else if (t === "1") { const b = v.slice(0, -1); st = b; na = b; te = b + "て"; ta = b + "た"; }
    else { const b = v.slice(0, -1), e = GOD[v.slice(-1)]; st = b + e[0]; na = b + e[1]; te = b + e[2]; ta = b + e[3]; if (/行く$/.test(v)) { te = b + "って"; ta = b + "った"; } }
    return { dict: v, masu: st + "ます", mashita: st + "ました", masen: st + "ません", masendeshita: st + "ませんでした", te, ta, nai: na + "ない", teimasu: te + "います", teimashita: te + "いました", tai: st + "たい", mashou: st + "ましょう", kudasai: te + "ください", stem: st }[f];
  }
  E4.J = J;
  // ---- 動詞句 ----  英語の原形|目的語など|日本語の目的語|日本語の動詞|活用
  const VP = T(`play|tennis|テニスを|する|s
play|the piano|ピアノを|ひく|5
play|video games|テレビゲームを|する|s
read|a book|本を|読む|5
watch|TV|テレビを|見る|1
study|English|英語を|勉強する|s
study|math|数学を|勉強する|s
cook|dinner|夕食を|作る|5
eat|breakfast|朝食を|食べる|1
write|a letter|手紙を|書く|5
make|a cake|ケーキを|作る|5
clean|the room|部屋を|そうじする|s
listen|to music|音楽を|聞く|5
take|pictures|写真を|とる|5
wash|the dishes|皿を|洗う|5
use|a computer|コンピューターを|使う|5
drink|milk|牛乳を|飲む|5
draw|a picture|絵を|かく|5
speak|English|英語を|話す|5
walk|the dog|犬を散歩に連れて|行く|5
visit|the museum|博物館を|訪れる|1
buy|a new bag|新しいかばんを|買う|5
sing|a song|歌を|歌う|5
practice|soccer|サッカーを|練習する|s
practice|the guitar|ギターを|練習する|s
go|to the library|図書館へ|行く|5
help|the teacher|先生を|手伝う|5`);
  VP.forEach((x) => addF([x[0], V.s(x[0]), V.p(x[0]), V.ing(x[0])].filter((w, i, a) => a.indexOf(w) === i)));
  addF(["do", "does", "did", "doing", "done"]); addF(["am", "is", "are", "was", "were", "be", "been"]); addF(["don't", "doesn't", "didn't"]);
  const vp = (x, form) => (form === "b" ? x[0] : V[form](x[0])) + " " + x[1];
  const vj = (x, f) => x[2] + J(x[3], x[4], f);
  const SUBJ = T(`I|わたし|1
You|あなた|2
We|わたしたち|1
They|かれら|3`);
  const THIRD = T(`He|彼|m
She|彼女|f
Ken|ケン|m
Emma|エマ|f
My brother|兄|m
My sister|姉|f
Tom|トム|m
Yumi|ユミ|f
Our teacher|わたしたちの先生|m
My father|父|m
My mother|母|f`);
  const pron = (t) => (t[2] === "f" ? ["she", "彼女"] : ["he", "彼"]);
  const TIME = T(`every day|毎日
after school|放課後に
on Sundays|日曜日に
every morning|毎朝
after dinner|夕食のあとに`);
  const PAST = T(`yesterday|きのう
last night|昨夜
last Sunday|この前の日曜日に
last week|先週
two days ago|2日前に`);
  const ROLE = T(`a student|学生
a soccer fan|サッカーファン
a member of the brass band|吹奏楽部の部員
a new student|転校生
an English teacher|英語の先生
a good cook|料理が上手な人`);
  const ADJ = T(`hungry|おなかがすいています|おなかがすいていました|おなかがすいていません
tired|つかれています|つかれていました|つかれていません
busy|いそがしいです|いそがしかったです|いそがしくありません
happy|うれしいです|うれしかったです|うれしくありません
sleepy|ねむいです|ねむかったです|ねむくありません
free|ひまです|ひまでした|ひまではありません
sick|具合が悪いです|具合が悪かったです|具合は悪くありません`);
  const THING = T(`my bag|わたしのかばん
a dictionary|辞書
an old camera|古いカメラ
my new bike|わたしの新しい自転車
a famous temple|有名なお寺
a picture of my family|わたしの家族の写真
an umbrella|かさ`);
  const PLC = T(`in the library|図書館に
in the gym|体育館に
at home|家に
in the park|公園に
in the music room|音楽室に`);
  const COUNT = T(`book|books|本|冊
dog|dogs|犬|ひき
pencil|pencils|えんぴつ|本
brother|brothers|兄弟|人
cat|cats|ねこ|ひき
ticket|tickets|チケット|まい
apple|apples|りんご|個`);
  const NUMJ = ["", "1", "2", "3", "4", "5", "6"];
  E4.JT = { VP, vp, vj, SUBJ, THIRD, pron, TIME, PAST, ROLE, ADJ, THING, PLC, COUNT, addF };
  const wa = (j) => j + "は";
  const G7 = [
    { n: "be動詞① I am / You are", note: "「わたしは〜です」は I am 〜.（I'm 〜.）、「あなたは〜です」は You are 〜.。疑問文は Are you 〜? で、答えは Yes, I am. / No, I'm not.", gen: (lv) => {
      const [r, rj] = pick(ROLE), [a, aj, , an] = pick(ADJ);
      return lvPick(lv, () => pick([S("I am " + r + ".", "わたしは" + rj + "です。"), S("I'm " + a + ".", "わたしは" + aj + "。"), S("You are " + r + ".", "あなたは" + rj + "です。")]),
        () => pick([S("Are you " + r + "? Yes, I am.", "あなたは" + rj + "ですか？ はい、そうです。"), S("I'm not " + a + ".", "わたしは" + an + "。", { alt: ["I am not " + a + "."] })]),
        () => pick([S("Are you " + a + "? No, I'm not.", "あなたは" + aj.replace(/。?$/, "") + "か？ いいえ、ちがいます。"), S("I'm " + r + ". I'm from Osaka.", "わたしは" + rj + "です。大阪出身です。")]));
    }, read: (lv, k) => E4.PASS.pick(7, 0, k) },
    { n: "be動詞② He / She / This is 〜", note: "I・you 以外の1人・1つは is。This is 〜.＝「これは〜です」。否定は is not（isn't）、疑問文は Is 〜? と is を前に出す。", gen: (lv) => {
      const t = pick(THIRD), [r, rj] = pick(ROLE), [th, thj] = pick(THING), [p, pj] = pick(PLC);
      return lvPick(lv, () => pick([S("This is " + th + ".", "これは" + thj + "です。"), S(t[0] + " is " + r + ".", wa(t[1]) + rj + "です。")]),
        () => pick([S("Is this " + th + "? Yes, it is.", "これは" + thj + "ですか？ はい、そうです。"), S(t[0] + " isn't " + r + ".", wa(t[1]) + rj + "ではありません。", { alt: [t[0] + " is not " + r + "."] })]),
        () => pick([S(t[0] + " is " + p + " now.", wa(t[1]) + "今、" + pj + "います。"), S("That is " + th + ". It is very nice.", "あれは" + thj + "です。それはとてもすてきです。")]));
    }, read: (lv, k) => E4.PASS.pick(7, 1, k) },
    { n: "一般動詞（I play 〜. / Do you 〜?）", note: "動作を表す語（play, like など）を一般動詞という。疑問文は Do you 〜?、否定文は I don't 〜.。", gen: (lv) => {
      const x = pick(VP), [tm, tmj] = pick(TIME), s0 = pick(SUBJ);
      return lvPick(lv, () => S(s0[0] + " " + vp(x, "b") + ".", wa(s0[1]) + vj(x, "masu") + "。"),
        () => pick([S("I " + vp(x, "b") + " " + tm + ".", "わたしは" + tmj + vj(x, "masu") + "。"), S("I don't " + vp(x, "b") + ".", "わたしは" + vj(x, "masen") + "。", { alt: ["I do not " + vp(x, "b") + "."] })]),
        () => pick([S("Do you " + vp(x, "b") + "? Yes, I do.", "あなたは" + vj(x, "masu") + "か？ はい、" + J(x[3], x[4], "masu") + "。"), S("Do you " + vp(x, "b") + " " + tm + "? No, I don't.", "あなたは" + tmj + vj(x, "masu") + "か？ いいえ、" + J(x[3], x[4], "masen") + "。")]));
    }, read: (lv, k) => E4.PASS.pick(7, 2, k) },
    { n: "複数形と How many 〜?", note: "2つ以上のものは名詞に s をつける（books）。「いくつ〜？」は How many＋複数形 〜?。", gen: (lv) => {
      const c = pick(COUNT), n = R(2, 6), w = E4.numWords(n);
      return lvPick(lv, () => S("I have " + w + " " + c[1] + ".", "わたしは" + c[2] + "を" + NUMJ[n] + c[3] + "持っています。"),
        () => S("How many " + c[1] + " do you have?", "あなたは" + c[2] + "を何" + c[3] + "持っていますか？"),
        () => S("How many " + c[1] + " do you have? I have " + w + ".", c[2] + "を何" + c[3] + "持っていますか？ " + NUMJ[n] + c[3] + "です。", { alt: ["How many " + c[1] + " do you have? I have " + w + " " + c[1] + "."] }));
    }, read: (lv, k) => E4.PASS.pick(7, 3, k) },
    { n: "3人称単数（He plays 〜.）", note: "主語が he / she / Ken など（3人称・単数）で現在の文のとき、動詞に s をつける（plays, studies, goes, has）。", gen: (lv) => {
      const t = pick(THIRD), x = pick(VP), [tm, tmj] = pick(TIME);
      return lvPick(lv, () => S(t[0] + " " + vp(x, "s") + ".", wa(t[1]) + vj(x, "masu") + "。"),
        () => S(t[0] + " " + vp(x, "s") + " " + tm + ".", wa(t[1]) + tmj + vj(x, "masu") + "。"),
        () => { const y = pick(VP.filter((z) => z !== x)); return S(t[0] + " " + vp(x, "s") + " and " + vp(y, "s") + " " + tm + ".", wa(t[1]) + tmj + x[2] + J(x[3], x[4], "te") + "、" + vj(y, "masu") + "。"); });
    }, read: (lv, k) => E4.PASS.pick(7, 4, k) },
    { n: "3単現の疑問文・否定文（Does 〜?）", note: "3人称単数の疑問文は Does＋主語＋動詞の原形 〜?、否定文は doesn't＋動詞の原形。動詞は s のつかない形にもどす。", gen: (lv) => {
      const t = pick(THIRD), x = pick(VP), [p, pj] = pron(t);
      return lvPick(lv, () => S(t[0] + " doesn't " + vp(x, "b") + ".", wa(t[1]) + vj(x, "masen") + "。", { alt: [t[0] + " does not " + vp(x, "b") + "."] }),
        () => S("Does " + (t[0] === "He" || t[0] === "She" ? t[0].toLowerCase() : t[0].replace(/^My/, "your").replace(/^Our/, "your")) + " " + vp(x, "b") + "?", (t[0].startsWith("My") ? "あなたの" + t[1] : t[0].startsWith("Our") ? "あなたたちの先生" : t[1]) + "は" + vj(x, "masu") + "か？"),
        () => { const yes = R(0, 1); const sub = /^(He|She)$/.test(t[0]) ? t[0].toLowerCase() : t[0].replace(/^My/, "your").replace(/^Our/, "your"); return S("Does " + sub + " " + vp(x, "b") + "? " + (yes ? "Yes, " + p + " does." : "No, " + p + " doesn't."), (t[0].startsWith("My") ? "あなたの" + t[1] : t[0].startsWith("Our") ? "あなたたちの先生" : t[1]) + "は" + vj(x, "masu") + "か？ " + (yes ? "はい、" + J(x[3], x[4], "masu") : "いいえ、" + J(x[3], x[4], "masen")) + "。"); });
    }, read: (lv, k) => E4.PASS.pick(7, 5, k) },
    { n: "疑問詞（What / Where / When / Who）", note: "疑問詞は文の最初におく。What＝何、Where＝どこ、When＝いつ、Who＝だれ、Whose＝だれの、Which＝どちら、How＝どう・どのように。", gen: (lv) => {
      const x = pick(VP), [tm, tmj] = pick(TIME), n = pick(E4.DATA.NAMES);
      const A = [S("What do you do " + tm + "?", "あなたは" + tmj + "何をしますか？"), S("Where do you live?", "あなたはどこに住んでいますか？"), S("When is your birthday?", "あなたの誕生日はいつですか？"), S("Who is that boy?", "あの男の子はだれですか？"), S("Whose bag is this?", "これはだれのかばんですか？"), S("Which do you like, dogs or cats?", "犬とねこ、どちらが好きですか？"), S("How do you come to school?", "あなたはどうやって学校に来ますか？")];
      const B = [S("What do you do " + tm + "? I " + vp(x, "b") + ".", tmj + "何をしますか？ " + vj(x, "masu") + "。"), S("Whose bag is this? It's " + n[0] + "'s.", "これはだれのかばんですか？ " + n[1] + "のです。"), S("Where do you " + vp(x, "b") + "? At home.", "あなたはどこで" + vj(x, "masu") + "か？ 家でです。"), S("How do you come to school? By bike.", "どうやって学校に来ますか？ 自転車でです。"), S("Who is that girl? She is " + n[0] + ".", "あの女の子はだれですか？ " + n[1] + "です。")];
      return lvPick(lv, () => pick(A), () => pick(A.concat(B)), () => pick(B));
    }, read: (lv, k) => E4.PASS.pick(7, 6, k) },
    { n: "命令文（〜しなさい／〜しよう）", note: "命令文は動詞の原形で始める。Please をつけるとていねい。Don't 〜.＝「〜してはいけない」、Let's 〜.＝「〜しよう」。", gen: (lv) => {
      const x = pick(VP), C = T(`Open the window.|窓を開けて。
Close the door.|ドアを閉めて。
Stand up.|立って。
Sit down, please.|すわってください。
Be quiet.|静かにして。
Look at this picture.|この写真を見て。
Wash your hands.|手を洗って。`), D2 = T(`Don't run in the classroom.|教室で走ってはいけません。
Don't eat in the library.|図書館で食べてはいけません。
Don't be late.|おくれてはいけません。
Don't use your phone here.|ここで携帯電話を使ってはいけません。`);
      const c = pick(C), d = pick(D2);
      return lvPick(lv, () => S(c[0], c[1]), () => pick([S(d[0], d[1]), S("Let's " + vp(x, "b") + ".", vj(x, "mashou").replace(/ましょう$/, "ましょう") + "。")]), () => pick([S("Please " + vp(x, "b") + ".", vj(x, "kudasai") + "。"), S("Let's " + vp(x, "b") + " together.", "いっしょに" + vj(x, "mashou") + "。"), S(d[0], d[1])]));
    }, read: (lv, k) => E4.PASS.pick(7, 7, k) },
    { n: "助動詞 can（〜できる）", note: "〈can＋動詞の原形〉＝「〜できる」。主語が he / she でも can のあとは原形。否定は can't、疑問文は Can 〜?。Can I 〜?＝「〜してもいいですか」。", gen: (lv) => {
      const x = pick(VP.filter((z) => /piano|English|dinner|cake|picture|song|tennis|computer|guitar/.test(z[1]))), t = pick(THIRD), K = T(`swim fast|速く泳ぐ|5
run fast|速く走る|5
speak Chinese|中国語を話す|5
ride a unicycle|一輪車に乗る|5
cook curry|カレーを作る|5
play the drums|ドラムを演奏する|s`), k2 = pick(K);
      const kj = (f) => k2[1].slice(0, -1) + { masu: "", koto: "" }[f];
      return lvPick(lv, () => pick([S("I can " + k2[0] + ".", "わたしは" + k2[1] + "ことができます。"), S(t[0] + " can " + vp(x, "b") + ".", wa(t[1]) + vj(x, "dict") + "ことができます。")]),
        () => pick([S("Can you " + k2[0] + "? Yes, I can.", "あなたは" + k2[1] + "ことができますか？ はい、できます。"), S(t[0] + " can't " + k2[0] + ".", wa(t[1]) + k2[1] + "ことができません。", { alt: [t[0] + " cannot " + k2[0] + "."] })]),
        () => pick([S("Can I use your pen? Sure.", "あなたのペンを使ってもいいですか？ もちろん。"), S("Can you help me? Sure.", "手伝ってくれますか？ いいですよ。"), S("Can you " + vp(x, "b") + "? No, I can't.", "あなたは" + vj(x, "dict") + "ことができますか？ いいえ、できません。")]));
    }, read: (lv, k) => E4.PASS.pick(7, 8, k) },
    { n: "現在進行形（I am 〜ing.）", note: "〈be動詞＋動詞の ing 形〉＝「（今）〜しているところ」。What are you doing?＝「何をしているの？」", gen: (lv) => {
      const x = pick(VP), t = pick(THIRD), s0 = pick(SUBJ), be = { I: "am", You: "are", We: "are", They: "are" }[s0[0]];
      return lvPick(lv, () => S(s0[0] + " " + be + " " + vp(x, "ing") + " now.", wa(s0[1]) + "今、" + vj(x, "teimasu") + "。"),
        () => pick([S(t[0] + " is " + vp(x, "ing") + ".", wa(t[1]) + vj(x, "teimasu") + "。"), S("What are you doing? I'm " + vp(x, "ing") + ".", "何をしているの？ " + vj(x, "teimasu") + "。")]),
        () => pick([S("Is " + (/^(He|She)$/.test(t[0]) ? t[0].toLowerCase() : t[0].replace(/^My/, "your").replace(/^Our/, "your")) + " " + vp(x, "ing") + " now?", (t[0].startsWith("My") ? "あなたの" + t[1] : t[0].startsWith("Our") ? "あなたたちの先生" : t[1]) + "は今、" + vj(x, "teimasu") + "か？"), S("I'm not " + vp(x, "ing") + ". I'm sleeping.", "わたしは" + x[2] + J(x[3], x[4], "te") + "いません。ねています。")]));
    }, read: (lv, k) => E4.PASS.pick(7, 9, k) },
    { n: "過去形①（played / Did you 〜?）", note: "過去のことは動詞を過去形にする。多くは ed をつける（played, studied, visited）。疑問文は Did＋主語＋原形 〜?、否定は didn't＋原形。", gen: (lv) => {
      const reg = VP.filter((x) => !IRR[x[0]]), x = pick(reg), [p, pj] = pick(PAST), t = pick(THIRD);
      return lvPick(lv, () => S("I " + vp(x, "p") + " " + p + ".", "わたしは" + pj + vj(x, "mashita") + "。"),
        () => pick([S(t[0] + " " + vp(x, "p") + " " + p + ".", wa(t[1]) + pj + vj(x, "mashita") + "。"), S("I didn't " + vp(x, "b") + " " + p + ".", "わたしは" + pj + vj(x, "masendeshita") + "。", { alt: ["I did not " + vp(x, "b") + " " + p + "."] })]),
        () => S("Did you " + vp(x, "b") + " " + p + "? Yes, I did.", "あなたは" + pj + vj(x, "mashita") + "か？ はい、" + J(x[3], x[4], "mashita") + "。"));
    }, read: (lv, k) => E4.PASS.pick(7, 10, k) },
    { n: "過去形②（went / ate / saw）", note: "不規則に変わる動詞は形を覚えよう：go → went、eat → ate、see → saw、make → made、buy → bought、write → wrote。", gen: (lv) => {
      const irr = VP.filter((x) => IRR[x[0]]), x = pick(irr), [p, pj] = pick(PAST), t = pick(THIRD), PL = T(`Kyoto|京都
the zoo|動物園
the beach|海辺
my uncle's house|おじの家`), pl = pick(PL);
      return lvPick(lv, () => pick([S("I " + vp(x, "p") + " " + p + ".", "わたしは" + pj + vj(x, "mashita") + "。"), S("I went to " + pl[0] + " " + p + ".", "わたしは" + pj + pl[1] + "へ行きました。")]),
        () => pick([S(t[0] + " " + vp(x, "p") + " " + p + ".", wa(t[1]) + pj + vj(x, "mashita") + "。"), S("Where did you go " + p + "? I went to " + pl[0] + ".", pj + "どこへ行きましたか？ " + pl[1] + "へ行きました。")]),
        () => pick([S(t[0] + " didn't " + vp(x, "b") + " " + p + ".", wa(t[1]) + pj + vj(x, "masendeshita") + "。", { alt: [t[0] + " did not " + vp(x, "b") + " " + p + "."] }), S("What did you do " + p + "? I " + vp(x, "p") + ".", pj + "何をしましたか？ " + vj(x, "mashita") + "。")]));
    }, read: (lv, k) => E4.PASS.pick(7, 11, k) },
    { n: "was / were と過去進行形", note: "be動詞の過去形は was（I, he, she など）と were（you, we, they）。〈was / were＋ing〉＝「〜していた」。", gen: (lv) => {
      const x = pick(VP), a = pick(ADJ), [p, pj] = pick(PAST), pl = pick(PLC), t = pick(THIRD), TM = T(`at nine last night|昨夜9時に
at that time|そのとき
when you called me|あなたが電話をくれたとき`), tm = pick(TM);
      return lvPick(lv, () => pick([S("I was " + a[0] + " " + p + ".", "わたしは" + pj + a[2] + "。"), S("We were " + pl[0] + " " + p + ".", "わたしたちは" + pj + pl[1] + "いました。")]),
        () => pick([S("I was " + vp(x, "ing") + " " + tm[0] + ".", "わたしは" + tm[1] + vj(x, "teimashita") + "。"), S(t[0] + " was " + pl[0] + " " + p + ".", wa(t[1]) + pj + pl[1] + "いました。")]),
        () => pick([S("What were you doing " + tm[0] + "? I was " + vp(x, "ing") + ".", tm[1] + "何をしていましたか？ " + vj(x, "teimashita") + "。"), S("They were " + vp(x, "ing") + " " + tm[0] + ".", "かれらは" + tm[1] + vj(x, "teimashita") + "。")]));
    }, read: (lv, k) => E4.PASS.pick(7, 12, k) },
  ];
  G7.push({ n: "中1のまとめ", note: "be動詞・一般動詞・can・現在進行形・過去形を使い分けよう。主語と時（今・ふだん・過去）を見て形を決める。", gen: (lv) => pick(G7.slice(2, 13)).gen(lv), read: (lv, k) => E4.PASS.pick(7, 13, k) });
  E4.J7 = G7;
})(typeof window !== "undefined" ? window : globalThis);
