/* ほしまなび 英語 v1.6 — 小5・小6のリーディング（短い文章を表から作る。質問は日本語） */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, E4 = HM.EN4, { R, pick, shuf } = U;
  const RD = (E4.READ = E4.READ || {});
  const T = (s) => s.trim().split("\n").map((l) => l.trim().split("|").map((x) => x.trim()));
  const others = (list, a, n = 3) => shuf(list.filter((x) => x !== a)).slice(0, n);
  const Q = (q, a, pool, ex) => ({ q, a, o: others([...new Set(pool)], a), ex });
  const D = () => E4.DATA;
  const ordW = (d) => E4.ordWords(d).replace(" ", "-");
  // 小5：自己紹介カード
  RD.profile = (lv) => {
    const d = D(), [n, nj] = pick(d.NAMES), c = pick(d.COUNTRY.slice(1)), c2 = pick(d.COUNTRY.slice(1).filter((x) => x !== c)), m = R(1, 12), day = R(1, 28), sp = pick(d.SPORT), sk = pick(d.SKILL);
    const s = ["Hi! I'm " + n + ".", "I'm from " + c[0] + ".", "My birthday is " + d.MONTH[m - 1] + " " + ordW(day) + ".", "I like " + sp[0] + ".", "I can " + sk[0] + ".", "I want to go to " + c2[0] + "."];
    const text = (lv < 0.4 ? s.filter((_, i) => i !== 5) : s).join(" ");
    const qs = [Q(nj + "はどこの出身ですか？", c[1], d.COUNTRY.slice(1).map((x) => x[1]).filter((x) => x !== c2[1]), "I'm from " + c[0] + ". ＝「" + c[1] + "出身です」。"),
      Q(nj + "の誕生日はいつですか？", m + "月" + day + "日", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((x) => x !== m).map((x) => x + "月" + day + "日"), "My birthday is " + d.MONTH[m - 1] + " " + ordW(day) + ". ＝「誕生日は" + m + "月" + day + "日」。"),
      Q(nj + "の好きなスポーツは何ですか？", sp[1], d.SPORT.map((x) => x[1]), "I like " + sp[0] + ". ＝「" + sp[1] + "が好き」。"),
      Q(nj + "ができることは何ですか？", sk[1] + "こと", d.SKILL.map((x) => x[1] + "こと"), "I can " + sk[0] + ". ＝「" + sk[1] + "ことができる」。")];
    if (lv >= 0.4) qs.push(Q(nj + "が行きたい国はどこですか？", c2[1], d.COUNTRY.slice(1).map((x) => x[1]).filter((x) => x !== c[1]), "I want to go to " + c2[0] + ". ＝「" + c2[1] + "に行きたい」。"));
    return { id: "p5", title: "Hello from " + n, text, au: 1, qs };
  };
  // 小5：道案内・注文の会話
  RD.trip = (lv) => {
    const d = D(), [n, nj] = pick(d.NAMES), [n2, n2j] = pick(d.NAMES.filter((x) => x[0] !== n));
    if (R(0, 1)) {
      const p = pick(d.PLACE), nth = pick(T(`first|1つ目
second|2つ目
third|3つ目`)), lr = pick([["right", "右"], ["left", "左"]]), side = pick([["right", "右"], ["left", "左"]]);
      const text = n + ": Excuse me. Where is the " + p[0] + "? " + n2 + ": Go straight and turn " + lr[0] + " at the " + nth[0] + " corner. You can see it on your " + side[0] + ". " + n + ": Thank you!";
      return { id: "t5", title: "Where is the " + p[0] + "?", text, au: 1, qs: [Q(nj + "はどこへ行きたいですか？", p[1], d.PLACE.map((x) => x[1]), "Where is the " + p[0] + "? ＝「" + p[1] + "はどこですか」。"), Q("何番目の角を曲がりますか？", nth[1], ["1つ目", "2つ目", "3つ目", "4つ目"], "turn at the " + nth[0] + " corner ＝「" + nth[1] + "の角で曲がる」。"), Q("角でどちらに曲がりますか？", lr[1], ["右", "左", "曲がらない"], "turn " + lr[0] + " ＝「" + lr[1] + "に曲がる」。"), Q(p[1] + "はどちら側に見えますか？", side[1] + "側", ["右側", "左側", "正面"], "on your " + side[0] + " ＝「" + side[1] + "側に」。")] };
    }
    const f = pick(d.MENU), f2 = pick(d.MENU.filter((x) => x !== f)), price = R(4, 9) * 100 + pick([0, 50]);
    const text = "Clerk: Hello. What would you like? " + n + ": I'd like " + f[0] + " and " + f2[0] + ". How much is it? Clerk: It's " + price + " yen. " + n + ": Here you are. Clerk: Thank you.";
    return { id: "o5", title: "At a restaurant", text, au: 1, qs: [Q(nj + "が最初にたのんだものは何ですか？", f[1], d.MENU.map((x) => x[1]).filter((x) => x !== f2[1]), "I'd like " + f[0] + " ... ＝「" + f[1] + "をお願いします」。"), Q("もう1つたのんだものは何ですか？", f2[1], d.MENU.map((x) => x[1]).filter((x) => x !== f[1]), "and " + f2[0] + " ＝「それと" + f2[1] + "」。"), Q("全部でいくらですか？", price + "円", [price - 100, price + 100, price + 50, price - 50].filter((x) => x > 0).map((x) => x + "円"), "It's " + price + " yen. ＝「" + price + "円です」。")] };
  };
  // 小5・小6：ある1日
  RD.day = (lv) => {
    const d = D(), [n, nj] = pick(d.NAMES), up = R(5, 7), sch = up + 1, bed = R(8, 10), ch = pick(d.CHORE), fr = pick(T(`always|いつも
usually|たいてい
sometimes|ときどき`)), s = pick(d.SUBJ), dd = pick(d.DAY.slice(0, 5));
    const text = "My name is " + n + ". I get up at " + E4.numWords(up) + ". I " + fr[0] + " " + ch[0] + " in the morning. I go to school at " + E4.numWords(sch) + ". I have " + s[0] + " on " + dd[0] + ". It's my favorite subject. I go to bed at " + E4.numWords(bed) + ".";
    return { id: "d5", title: n + "'s day", text, au: 1, qs: [Q(nj + "は何時に起きますか？", up + "時", [5, 6, 7, 8, 9].filter((x) => x !== up).map((x) => x + "時"), "I get up at " + E4.numWords(up) + ". ＝「" + up + "時に起きる」。"), Q(nj + "が朝" + fr[1] + "することは何ですか？", ch[2], d.CHORE.map((x) => x[2]), "I " + fr[0] + " " + ch[0] + ". ＝「" + fr[1] + ch[1] + "」。"), Q(nj + "の好きな教科は何ですか？", s[1], d.SUBJ.map((x) => x[1]), "I have " + s[0] + " ... It's my favorite subject. ＝「好きな教科は" + s[1] + "」。"), Q(nj + "は何時にねますか？", bed + "時", [7, 8, 9, 10, 11].filter((x) => x !== bed).map((x) => x + "時"), "I go to bed at " + E4.numWords(bed) + ". ＝「" + bed + "時にねる」。")] };
  };
  // 小6：自己紹介（くわしく）
  RD.profile6 = (lv) => {
    const d = D(), [n, nj] = pick(d.NAMES), like = pick(T(`reading books|本を読むこと
cooking|料理をすること
drawing pictures|絵をかくこと
playing the piano|ピアノをひくこと
taking pictures|写真をとること`)), good = pick(d.GOODAT), sp = pick(d.SPORT), city = pick(T(`Tokyo|東京
Osaka|大阪
Sapporo|札幌
Fukuoka|福岡
Sendai|仙台`)), hero = pick(T(`my father|父
my mother|母
my grandfather|祖父
my grandmother|祖母
my sister|姉
my brother|兄`)), tr = pick(d.TRAIT);
    const text = "Hello, everyone. I'm " + n + ". I live in " + city[0] + ". I like " + like[0] + ". I'm good at " + good[0] + ". My favorite sport is " + sp[0] + ". My hero is " + hero[0] + ". " + (/mother|grandmother|sister/.test(hero[0]) ? "She" : "He") + " is very " + tr[0] + ". Thank you.";
    return { id: "p6", title: "My introduction", text, au: 1, qs: [Q(nj + "はどこに住んでいますか？", city[1], ["東京", "大阪", "札幌", "福岡", "仙台", "名古屋"], "I live in " + city[0] + ". ＝「" + city[1] + "に住んでいる」。"), Q(nj + "が得意なことは何ですか？", good[1], d.GOODAT.map((x) => x[1]), "I'm good at " + good[0] + ". ＝「" + good[1] + "が得意」。"), Q(nj + "の好きなスポーツは何ですか？", sp[1], d.SPORT.map((x) => x[1]), "My favorite sport is " + sp[0] + ". ＝「好きなスポーツは" + sp[1] + "」。"), Q(nj + "のヒーローはだれですか？", hero[1], ["父", "母", "祖父", "祖母", "姉", "兄"], "My hero is " + hero[0] + ". ＝「ヒーローは" + hero[1] + "」。"), Q(nj + "のヒーローはどんな人ですか？", d.TRAIT.find((x) => x === tr)[1], d.TRAIT.map((x) => x[1]), "... is very " + tr[0] + ". ＝「とても" + tr[1] + "」。")] };
  };
  // 小6：町・国の紹介
  RD.town = (lv) => {
    const have = pick(T(`a big park|大きな公園
a library|図書館
a zoo|動物園
an aquarium|水族館
a stadium|スタジアム`)), not = pick(T(`a museum|博物館
a swimming pool|プール
a bookstore|本屋
an amusement park|遊園地`)), ev = pick(T(`the summer festival|夏祭り|August|8月
the snow festival|雪まつり|February|2月
the fireworks festival|花火大会|July|7月
the music festival|音楽祭|October|10月`)), food = pick(T(`ramen|ラーメン
sushi|すし
okonomiyaki|お好み焼き
tempura|天ぷら`)), want = pick(T(`a big library|大きな図書館
a new swimming pool|新しいプール
a soccer stadium|サッカースタジアム
a big bookstore|大きな本屋`));
    const text = "This is our town. We have " + have[0] + ". We don't have " + not[0] + ". We have " + ev[0] + " in " + ev[2] + ". You can enjoy it. You can eat delicious " + food[0] + ". I want " + want[0] + " in our town.";
    const H = ["大きな公園", "図書館", "動物園", "水族館", "スタジアム", "博物館", "プール", "本屋", "遊園地"];
    return { id: "w6", title: "Welcome to our town", text, au: 1, qs: [Q("この町にあるものはどれですか？", have[1], H.filter((x) => x !== not[1]), "We have " + have[0] + ". ＝「" + have[1] + "がある」。"), Q("この町にないものはどれですか？", not[1], H.filter((x) => x !== have[1]), "We don't have " + not[0] + ". ＝「" + not[1] + "はない」。"), Q(ev[1] + "は何月にありますか？", ev[3], ["1月", "2月", "4月", "7月", "8月", "10月", "12月"], "We have " + ev[0] + " in " + ev[2] + ". ＝「" + ev[3] + "に" + ev[1] + "がある」。"), Q("この町でおいしく食べられるものは何ですか？", food[1], ["ラーメン", "すし", "お好み焼き", "天ぷら", "カレー"], "You can eat delicious " + food[0] + ". ＝「おいしい" + food[1] + "が食べられる」。"), Q("筆者が町にほしいものは何ですか？", want[1], ["大きな図書館", "新しいプール", "サッカースタジアム", "大きな本屋", "動物園"], "I want " + want[0] + " ... ＝「" + want[1] + "がほしい」。")] };
  };
  // 小6：夏休みの日記
  RD.diary = (lv) => {
    const w = pick(T(`the sea|海
the mountains|山
my grandparents' house|祖父母の家
Okinawa|沖縄`)), who = pick(T(`my family|家族
my friends|友だち
my cousins|いとこたち`)), en = pick(T(`swimming|泳ぐこと
camping|キャンプ
fishing|つり
hiking|ハイキング`)), a = pick(T(`watermelon|すいか
shaved ice|かき氷
grilled fish|焼き魚
corn|とうもろこし`)), sw = pick(T(`fireworks|花火
beautiful stars|きれいな星
a rainbow|にじ`)), x = pick(T(`fun|楽しかった
exciting|わくわくした
great|すばらしかった`));
    const text = "I went to " + w[0] + " with " + who[0] + ". I enjoyed " + en[0] + ". I ate " + a[0] + ". It was delicious. At night, I saw " + sw[0] + ". It was " + x[0] + ". I want to go there again next summer.";
    return { id: "s6", title: "My Summer Vacation", text, au: 1, qs: [Q("筆者はどこに行きましたか？", w[1], ["海", "山", "祖父母の家", "沖縄", "京都"], "I went to " + w[0] + ". ＝「" + w[1] + "に行った」。"), Q("だれといっしょに行きましたか？", who[1], ["家族", "友だち", "いとこたち", "先生"], "with " + who[0] + " ＝「" + who[1] + "と」。"), Q("筆者が楽しんだことは何ですか？", en[1], ["泳ぐこと", "キャンプ", "つり", "ハイキング", "買い物"], "I enjoyed " + en[0] + ". ＝「" + en[1] + "を楽しんだ」。"), Q("筆者が食べたものは何ですか？", a[1], ["すいか", "かき氷", "焼き魚", "とうもろこし", "カレー"], "I ate " + a[0] + ". ＝「" + a[1] + "を食べた」。"), Q("夜に見たものは何ですか？", sw[1], ["花火", "きれいな星", "にじ", "クジラ"], "I saw " + sw[0] + ". ＝「" + sw[1] + "を見た」。")] };
  };
  // 小6：将来の夢
  RD.dream = (lv) => {
    const j = pick(T(`vet|獣医|animals|動物
cook|料理人|cooking|料理
pilot|パイロット|airplanes|飛行機
teacher|先生|children|子ども
baker|パン屋さん|bread|パン
scientist|科学者|science|理科`)), c = pick(T(`the science club|科学部
the brass band|吹奏楽部
the art club|美術部
the soccer team|サッカー部
the tennis team|テニス部`)), s = pick(T(`English|英語
math|数学
science|理科
music|音楽`)), n = pick(E4.DATA.NAMES);
    const text = "Hello, I'm " + n[0] + ". I want to be " + E4.art(j[0]) + ". I like " + j[2] + ". In junior high school, I want to join " + c[0] + ". I want to study " + s[0] + " hard. Thank you for listening.";
    return { id: "m6", title: "My Dream", text, au: 1, qs: [Q(n[1] + "は何になりたいですか？", j[1], ["獣医", "料理人", "パイロット", "先生", "パン屋さん", "科学者"], "I want to be " + E4.art(j[0]) + ". ＝「" + j[1] + "になりたい」。"), Q(n[1] + "が好きなものは何ですか？", j[3], ["動物", "料理", "飛行機", "子ども", "パン", "理科"], "I like " + j[2] + ". ＝「" + j[3] + "が好き」。"), Q("中学校で入りたい部活は何ですか？", c[1], ["科学部", "吹奏楽部", "美術部", "サッカー部", "テニス部"], "I want to join " + c[0] + ". ＝「" + c[1] + "に入りたい」。"), Q("一生けんめい勉強したい教科は何ですか？", s[1], ["英語", "数学", "理科", "音楽", "社会"], "I want to study " + s[0] + " hard. ＝「" + s[1] + "を一生けんめい勉強したい」。")] };
  };
})(typeof window !== "undefined" ? window : globalThis);
