/* ほしまなび 英語 v1.6 — 小6（4技能） */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, E4 = HM.EN4, { R, pick } = U;
  const { T, S, lvPick } = E4, up = E4.firstUp, art = E4.art, nW = E4.numWords;
  const D = E4.DATA;
  const CITY = T(`Tokyo|東京
Osaka|大阪
Sapporo|札幌
Fukuoka|福岡
Nagoya|名古屋
Sendai|仙台
Hiroshima|広島
Naha|那覇`);
  const LIKEING = T(`playing soccer|サッカーをすること
reading books|本を読むこと
cooking|料理をすること
singing|歌うこと
drawing pictures|絵をかくこと
swimming|泳ぐこと
playing the piano|ピアノをひくこと
taking pictures|写真をとること`);
  const JFOOD = T(`sushi|すし
tempura|天ぷら
ramen|ラーメン
okonomiyaki|お好み焼き
rice balls|おにぎり
mochi|もち`);
  const FEST = T(`the snow festival|雪まつり|winter|冬
the fireworks festival|花火大会|summer|夏
the Star Festival|七夕まつり|summer|夏
cherry blossom viewing|お花見|spring|春
moon viewing|お月見|fall|秋`);
  const TOWN = T(`park|公園
library|図書館
zoo|動物園
swimming pool|プール
stadium|スタジアム
aquarium|水族館
bookstore|本屋
museum|博物館`);
  const WENT = T(`the sea|海
the mountains|山
my grandparents' house|祖父母の家
the summer festival|夏祭り
the aquarium|水族館
Okinawa|沖縄
the beach|ビーチ`);
  const ENJOY = T(`swimming|泳ぐこと
camping|キャンプ
fishing|つり
hiking|ハイキング
watching fireworks|花火を見ること
shopping|買い物`);
  const ATE = T(`watermelon|すいか
shaved ice|かき氷
curry|カレー
grilled fish|焼き魚
corn|とうもろこし`);
  const WAS = T(`fun|楽しかったです
exciting|わくわくしました
beautiful|きれいでした
delicious|おいしかったです`);
  const SAW = T(`fireworks|花火
many fish|たくさんの魚
a big whale|大きなクジラ
beautiful stars|きれいな星
a rainbow|にじ`);
  const PASTV = T(`played soccer|サッカーをしました
watched TV|テレビを見ました
visited my aunt|おばをたずねました
studied English|英語を勉強しました
cleaned my room|部屋をそうじしました
read a book|本を読みました
went to the park|公園に行きました
ate pizza|ピザを食べました`);
  const WHEN = T(`yesterday|きのう
last Sunday|この前の日曜日に
last night|昨夜`);
  const LIVE = T(`Sea turtles|sea|ウミガメ|海
Polar bears|Arctic|ホッキョクグマ|北極
Koalas|forests|コアラ|森
Penguins|Antarctic|ペンギン|南極
Camels|desert|ラクダ|さばく
Owls|forests|フクロウ|森`);
  const EAT = T(`Pandas|bamboo|パンダ|竹
Koalas|leaves|コアラ|葉
Sea turtles|jellyfish|ウミガメ|クラゲ
Polar bears|seals|ホッキョクグマ|アザラシ
Rabbits|grass|うさぎ|草`);
  const CANDO = T(`save water|水を節約する
plant trees|木を植える
use my own bag|自分のバッグを使う
turn off the lights|電気を消す
pick up trash|ごみを拾う
recycle cans|かんをリサイクルする`);
  const JOB = T(`vet|獣医
doctor|医者
teacher|先生
singer|歌手
cook|料理人
pilot|パイロット
astronaut|宇宙飛行士
nurse|看護師
soccer player|サッカー選手
baker|パン屋さん
farmer|農家の人
scientist|科学者`);
  const WHY = T(`vet|animals|動物
cook|cooking|料理
singer|singing|歌うこと
pilot|airplanes|飛行機
astronaut|space|宇宙
baker|bread|パン
doctor|science|理科`);
  const CLUB = T(`the brass band|吹奏楽部
the soccer team|サッカー部
the art club|美術部
the tennis team|テニス部
the science club|科学部
the baseball team|野球部
the volleyball team|バレーボール部`);
  const MEM = T(`our school trip|修学旅行
sports day|運動会
the music festival|音楽会
the swimming meet|水泳大会
the school festival|学習発表会`);
  const PLACEJ = T(`Kyoto|京都
Nara|奈良
Nikko|日光
Hiroshima|広島
Kamakura|鎌倉`);
  const SAWJ = T(`old temples|古いお寺
a big Buddha|大きな大仏
beautiful gardens|美しい庭
many deer|たくさんのシカ`);
  const EV = T(`the relay race|リレー
the tug of war|つな引き
the dance|ダンス
the chorus|合唱`);
  const G6 = [
    { n: "自分のこと（I'm good at 〜.）", note: "〈I like 〜ing〉＝「〜することが好き」、〈I'm good at 〜ing〉＝「〜が得意」。", gen: (lv) => {
      const [l, lj] = pick(LIKEING), [c, cj] = pick(CITY), [f, fj] = pick(JFOOD);
      return lvPick(lv, () => pick([S("I like " + l + ".", "わたしは" + lj + "が好きです。"), S("I live in " + c + ".", "わたしは" + cj + "に住んでいます。")]),
        () => pick([S("I'm good at " + l + ".", "わたしは" + lj + "が得意です。"), S("My favorite food is " + f + ".", "わたしの好きな食べ物は" + fj + "です。")]),
        () => S("I live in " + c + ". I like " + l + ".", "わたしは" + cj + "に住んでいます。" + lj + "が好きです。"));
    }, read: (lv, k) => E4.READ.profile6(lv, k) },
    { n: "日本の文化を伝えよう", note: "〈You can enjoy 〜.〉＝「〜を楽しめます」。〈It's 〜.〉で感想をそえよう。", gen: (lv) => {
      const [e, j, s, sj] = pick(FEST), [f, fj] = pick(JFOOD);
      return lvPick(lv, () => pick([S("We have " + e + " in " + s + ".", sj + "には" + j + "があります。"), S("You can enjoy " + e + ".", j + "を楽しむことができます。")]),
        () => pick([S(up(f) + " is a popular Japanese food.", fj + "は人気のある日本の食べ物です。"), S("You can eat " + f + ". It's delicious.", fj + "を食べることができます。とてもおいしいです。")]),
        () => S("In " + s + ", we have " + e + ". It's very beautiful.", sj + "には" + j + "があります。とても美しいです。"));
    }, read: (lv, k) => E4.READ.town(lv, k) },
    { n: "わたしたちの町", note: "〈We have 〜.〉＝「〜があります」、〈We don't have 〜.〉＝「〜がありません」。", gen: (lv) => {
      const [t, tj] = pick(TOWN), t2 = pick(TOWN.filter((x) => x[0] !== t));
      return lvPick(lv, () => S("We have " + art(t) + " in our town.", "わたしたちの町には" + tj + "があります。"),
        () => pick([S("We don't have " + art(t) + " in our town.", "わたしたちの町には" + tj + "がありません。"), S("I want " + art(t) + " in our town.", "わたしたちの町に" + tj + "がほしいです。")]),
        () => S("We have " + art(t) + ", but we don't have " + art(t2[0]) + ".", tj + "はありますが、" + t2[1] + "はありません。"));
    }, read: (lv, k) => E4.READ.town(lv, k) },
    { n: "夏休みの思い出（I went to 〜.）", note: "過去のことは went（行った）、ate（食べた）、saw（見た）、enjoyed（楽しんだ）、It was 〜.（〜でした）で言う。", gen: (lv) => {
      const [w, wj] = pick(WENT), [en, enj] = pick(ENJOY), [a, aj] = pick(ATE), [x, xj] = pick(WAS), [sw, swj] = pick(SAW);
      return lvPick(lv, () => pick([S("I went to " + w + ".", "わたしは" + wj + "に行きました。"), S("I enjoyed " + en + ".", "わたしは" + enj + "を楽しみました。")]),
        () => pick([S("I ate " + a + ".", "わたしは" + aj + "を食べました。"), S("I saw " + sw + ".", "わたしは" + swj + "を見ました。"), S("It was " + x + ".", xj + "。")]),
        () => S("I went to " + w + ". I enjoyed " + en + ". It was " + x + ".", "わたしは" + wj + "に行きました。" + enj + "を楽しみました。" + xj + "。"));
    }, read: (lv, k) => E4.READ.diary(lv, k) },
    { n: "きのうしたこと（過去の文）", note: "過去の文は動詞を過去形にする（play → played、go → went、eat → ate）。", gen: (lv) => {
      const [v, vj] = pick(PASTV), [w, wj] = pick(WHEN);
      return lvPick(lv, () => S("I " + v + ".", "わたしは" + vj + "。"),
        () => S("I " + v + " " + w + ".", "わたしは" + wj + vj + "。"),
        () => { const v2 = pick(PASTV.filter((x) => x[0] !== v)); return S("I " + v + " " + w + ". Then I " + v2[0] + ".", "わたしは" + wj + vj + "。それから、" + v2[1] + "。"); });
    }, read: (lv, k) => E4.READ.diary(lv, k) },
    { n: "スポーツ観戦（I like watching 〜.）", note: "〈like watching 〜〉＝「〜を見るのが好き」。〈My favorite sport is 〜.〉＝「好きなスポーツは〜」。", gen: (lv) => {
      const [s, sj] = pick(D.SPORT), [d, dj] = pick(D.DAY.slice(5));
      return lvPick(lv, () => pick([S("I like watching " + s + ".", "わたしは" + sj + "を見るのが好きです。"), S("My favorite sport is " + s + ".", "わたしの好きなスポーツは" + sj + "です。")]),
        () => pick([S("I play " + s + " every " + d + ".", "わたしは毎週" + dj + "に" + sj + "をします。"), S("Let's play " + s + " together.", "いっしょに" + sj + "をしよう。")]),
        () => pick([S("I like watching " + s + " on TV.", "わたしはテレビで" + sj + "を見るのが好きです。"), S("I want to see a " + s + " game at the stadium.", "わたしはスタジアムで" + sj + "の試合を見たいです。"), S("My favorite sport is " + s + ". I play it every " + d + ".", "わたしの好きなスポーツは" + sj + "です。毎週" + dj + "にします。")]));
    }, read: (lv, k) => E4.READ.profile6(lv, k) },
    { n: "生き物と地球（Where do they live?）", note: "〈live in 〜〉＝「〜に住んでいる」。〈We can 〜.〉＝「わたしたちは〜できる」。", gen: (lv) => {
      const [a, p, aj, pj] = pick(LIVE), [b, f, bj, fj] = pick(EAT), [c, cj] = pick(CANDO);
      return lvPick(lv, () => S(a + " live in the " + p + ".", aj + "は" + pj + "に住んでいます。"),
        () => pick([S(b + " eat " + f + ".", bj + "は" + fj + "を食べます。"), S("We can " + c + ".", "わたしたちは" + cj + "ことができます。")]),
        () => S("Let's save the earth. We can " + c + ".", "地球を守ろう。わたしたちは" + cj + "ことができます。"));
    }, read: (lv, k) => E4.READ.town(lv, k) },
    { n: "将来の夢（I want to be 〜.）", note: "〈I want to be＋職業〉＝「〜になりたい」。理由は Because 〜. や I like 〜. でそえる。", gen: (lv) => {
      const [j, jj] = pick(JOB), w = pick(WHY);
      const wj = D.NAMES && JOB.find((x) => x[0] === w[0])[1];
      return lvPick(lv, () => S("I want to be " + art(j) + ".", "わたしは" + jj + "になりたいです。"),
        () => S("What do you want to be? I want to be " + art(j) + ".", "何になりたいですか？ " + jj + "になりたいです。"),
        () => S("I like " + w[1] + ". So I want to be " + art(w[0]) + ".", "わたしは" + w[2] + "が好きです。だから" + wj + "になりたいです。"));
    }, read: (lv, k) => E4.READ.dream(lv, k) },
    { n: "中学校でしたいこと", note: "〈I want to join 〜.〉＝「〜に入りたい」。〈I want to study 〜 hard.〉＝「〜を一生けんめい勉強したい」。", gen: (lv) => {
      const [c, cj] = pick(CLUB), [s, sj] = pick(D.SUBJ);
      return lvPick(lv, () => S("I want to join " + c + ".", "わたしは" + cj + "に入りたいです。"),
        () => pick([S("I want to study " + s + " hard.", "わたしは" + sj.replace("算数", "数学") + "を一生けんめい勉強したいです。"), S("I want to make many friends.", "わたしはたくさん友だちを作りたいです。")]),
        () => S("In junior high school, I want to join " + c + ".", "中学校では、" + cj + "に入りたいです。"));
    }, read: (lv, k) => E4.READ.dream(lv, k) },
    { n: "小学校の思い出（My best memory is 〜.）", note: "〈My best memory is 〜.〉＝「いちばんの思い出は〜」。そのあと、した事を過去形で伝える。", gen: (lv) => {
      const [m, mj] = pick(MEM), [p, pj] = pick(PLACEJ), [s, sj] = pick(SAWJ), [e, ej] = pick(EV);
      return lvPick(lv, () => S("My best memory is " + m + ".", "わたしのいちばんの思い出は" + mj + "です。"),
        () => pick([S("We went to " + p + ".", "わたしたちは" + pj + "に行きました。"), S("We saw " + s + ".", "わたしたちは" + sj + "を見ました。"), S("We enjoyed " + e + ".", "わたしたちは" + ej + "を楽しみました。")]),
        () => S("My best memory is our school trip. We went to " + p + ".", "わたしのいちばんの思い出は修学旅行です。わたしたちは" + pj + "に行きました。"));
    }, read: (lv, k) => E4.READ.diary(lv, k) },
    { n: "世界の国をしょうかい", note: "〈Let's go to 〜.〉＝「〜に行こう」。〈You can see / eat 〜.〉でみりょくを伝える。", gen: (lv) => {
      const [c, cj] = pick(D.COUNTRY.slice(1)), A = pick(T(`beautiful|美しい
big|大きい
famous|有名な`));
      const x = pick(T(`Italy|pizza|ピザ|eat|イタリア
India|curry|カレー|eat|インド
Egypt|the pyramids|ピラミッド|see|エジプト
Australia|koalas|コアラ|see|オーストラリア
China|pandas|パンダ|see|中国
Kenya|giraffes|キリン|see|ケニア`));
      return lvPick(lv, () => S("Let's go to " + c + ".", cj + "に行こう。"),
        () => S("You can " + x[3] + " " + x[1] + " in " + x[0] + ".", x[4] + "では" + x[2] + "を" + (x[3] === "eat" ? "食べる" : "見る") + "ことができます。"),
        () => S("Let's go to " + x[0] + ". You can " + x[3] + " " + x[1] + ".", x[4] + "に行こう。" + x[2] + "を" + (x[3] === "eat" ? "食べる" : "見る") + "ことができます。"));
    }, read: (lv, k) => E4.READ.town(lv, k) },
    { n: "あの人を紹介（He / She can 〜.）", note: "3人目の人のことは He / She で言う。〈He is good at 〜.〉＝「彼は〜が得意」。", gen: (lv) => {
      const [n, nj] = pick(D.NAMES), [g, gj] = pick(D.GOODAT), [k2, kj] = pick(D.SKILL), he = pick([["He", "彼"], ["She", "彼女"]]), [t, tj] = pick(D.TRAIT);
      return lvPick(lv, () => pick([S(he[0] + " is good at " + g + ".", he[1] + "は" + gj + "が得意です。"), S(n + " can " + k2 + ".", nj + "は" + kj + "ことができます。")]),
        () => S("Who is your hero? My hero is " + n + ".", "あなたのヒーローはだれ？ わたしのヒーローは" + nj + "です。"),
        () => S("This is " + n + ". " + he[0] + " is " + t + ". " + he[0] + " can " + k2 + ".", "こちらは" + nj + "です。" + he[1] + "は" + tj + "です。" + he[1] + "は" + kj + "ことができます。"));
    }, read: (lv, k) => E4.READ.profile6(lv, k) },
    { n: "家の手伝い（always / usually / sometimes）", note: "回数を表す語（always / usually / sometimes）は、ふつう動詞の前におく。", gen: (lv) => {
      const [f, fj] = pick(T(`always|いつも
usually|たいてい
sometimes|ときどき`)), [c, cj] = pick(D.CHORE), [d, dj] = pick(D.DAY);
      return lvPick(lv, () => S("I " + f + " " + c + ".", "わたしは" + fj + cj + "。"),
        () => S("I " + c + " on " + d + "s.", "わたしは" + dj + "に" + cj + "。"),
        () => S("I " + f + " " + c + ". It's my job.", "わたしは" + fj + cj + "。それがわたしの仕事です。"));
    }, read: (lv, k) => E4.READ.day(lv, k) },
  ];
  HM.EN4.E.G6 = G6;
})(typeof window !== "undefined" ? window : globalThis);
