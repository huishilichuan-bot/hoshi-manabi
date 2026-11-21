/* ほしまなび 英語 v1.6 — 読解の文章（中1）。すべてオリジナルの文章 */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, E4 = HM.EN4, { R } = U;
  const PASS = (E4.PASS = E4.PASS || { list: {} });
  PASS.add = (g, id, title, text, qs) => { (PASS.list[g] = PASS.list[g] || []).push({ id, title, text: text.replace(/[ \t]*\n[ \t]*\n\s*/g, "\n\n").replace(/[ \t]*(?<!\n)\n(?!\n)[ \t]*/g, " ").replace(/[ \t]+/g, " ").trim(), qs: qs.map(([q, a, o, ex]) => ({ q, a, o, ex })) }); };
  // 単元の番号とステップから文章をえらぶ（同じ単元でもステップごとに別の文章になりやすい）
  PASS.pick = (g, ui, k) => { const L = PASS.list[g]; if (!L || !L.length) return null; return L[(ui * 3 + k + R(0, 1) * 5) % L.length]; };
  const A = PASS.add.bind(null, 7);
  A("j1a", "Hello from Mika", `Hello, everyone. My name is Mika Sato. I am thirteen years old. I am from Nagano. I am a member of the tennis team. I like music very much. I play the flute every day. My favorite singer is Lisa Wong. She is from Singapore. I have a cat. Her name is Momo. She is small and white. She is very cute. I am happy to be in this class. Let's be friends!`,
    [["ミカは何歳ですか？", "13歳", ["12歳", "14歳", "15歳"], "I am thirteen years old. ＝「13歳です」。"],
     ["ミカはどこの出身ですか？", "長野", ["名古屋", "長崎", "奈良"], "I am from Nagano. ＝「長野出身です」。"],
     ["ミカが毎日することは何ですか？", "フルートをふく", ["テニスをする", "ねこと遊ぶ", "歌を歌う"], "I play the flute every day. ＝「毎日フルートをふく」。"],
     ["モモはどんなねこですか？", "小さくて白い", ["大きくて黒い", "小さくて茶色い", "大きくて白い"], "She is small and white. ＝「小さくて白い」。"],
     ["この文章の内容に合うものはどれですか？", "ミカはテニス部に入っている", ["ミカは犬を飼っている", "リサ・ウォンは日本出身だ", "ミカは音楽が好きではない"], "I am a member of the tennis team. ＝「テニス部の部員です」。"],
     ["ミカは最後に何と言っていましたか？", "友だちになろう", ["また会おう", "ありがとう", "テニスをしよう"], "Let's be friends! ＝「友だちになろう」。"]]);
  A("j1b", "My New Friend", `This is my friend, Daniel. He is from Canada. He is a new student at our school. He is tall and kind. He is good at basketball. He is in the basketball club now. Daniel is not good at Japanese yet, but he studies it every day. His favorite Japanese food is udon. "Udon is really delicious!" he says. On weekends, we often play video games together. He is a very good friend.`,
    [["ダニエルはどこの出身ですか？", "カナダ", ["アメリカ", "オーストラリア", "イギリス"], "He is from Canada. ＝「カナダ出身」。"],
     ["ダニエルが得意なことは何ですか？", "バスケットボール", ["日本語", "サッカー", "料理"], "He is good at basketball. ＝「バスケットボールが得意」。"],
     ["ダニエルが毎日勉強しているものは何ですか？", "日本語", ["英語", "数学", "音楽"], "he studies it (= Japanese) every day ＝「毎日日本語を勉強している」。"],
     ["ダニエルは何と言っていましたか？", "うどんは本当においしい", ["うどんは好きではない", "すしがいちばん好き", "日本語はかんたんだ"], "\"Udon is really delicious!\" ＝「うどんは本当においしい！」"],
     ["週末に2人ですることは何ですか？", "テレビゲームをする", ["バスケットボールをする", "うどんを食べに行く", "日本語を勉強する"], "On weekends, we often play video games together. ＝「週末はよくいっしょにテレビゲームをする」。"],
     ["この文章は主に何について書かれていますか？", "新しい友だちの紹介", ["カナダの学校", "日本の食べ物", "バスケットボールのルール"], "This is my friend, Daniel. から始まり、ダニエルを紹介している。"]]);
  A("j1c", "Yuto's Weekend", `I usually get up at seven on Saturdays. I eat breakfast with my family. Then I practice soccer at school from nine to twelve. I eat lunch with my teammates. In the afternoon, I go to the library and read books about space. I want to know more about the stars. I go home at five and help my father in the kitchen. We cook dinner together. On Sundays, I don't get up early. I sleep until nine!`,
    [["ユウトは土曜日にふだん何時に起きますか？", "7時", ["6時", "8時", "9時"], "I usually get up at seven on Saturdays. ＝「土曜日はたいてい7時に起きる」。"],
     ["ユウトが午前中にすることは何ですか？", "学校でサッカーを練習する", ["図書館で本を読む", "父と料理をする", "家でねる"], "I practice soccer at school from nine to twelve. ＝「9時から12時まで学校でサッカーを練習する」。"],
     ["ユウトは図書館で何についての本を読みますか？", "宇宙", ["サッカー", "料理", "動物"], "read books about space ＝「宇宙についての本を読む」。"],
     ["ユウトは夕方に何をしますか？", "父と夕食を作る", ["サッカーを練習する", "友だちと遊ぶ", "テレビを見る"], "help my father in the kitchen. We cook dinner together. ＝「台所で父を手伝い、いっしょに夕食を作る」。"],
     ["日曜日のユウトについて正しいものはどれですか？", "9時までねている", ["7時に起きる", "サッカーの試合がある", "図書館に行く"], "On Sundays, ... I sleep until nine! ＝「日曜日は9時までねる」。"]]);
  A("j1d", "A Letter from Australia", `Dear Haruka, Thank you for your letter. I live in Sydney with my parents and two brothers. We have a big dog. His name is Max. It is winter here now, but it is not very cold. In Australia, school starts in January or February. I go to school by bus. I study Japanese at school. It is difficult, but it is fun. Do you like sports? I like swimming. Please write back soon. Your friend, Olivia`,
    [["オリビアはだれと住んでいますか？", "両親と2人の兄弟", ["祖父母と姉", "両親と1人の妹", "おじとおば"], "I live in Sydney with my parents and two brothers. ＝「両親と2人の兄弟と住んでいる」。"],
     ["マックスとは何ですか？", "オリビアの家の犬", ["オリビアの兄弟", "オリビアの先生", "オリビアのねこ"], "We have a big dog. His name is Max. ＝「大きな犬を飼っていて、名前はマックス」。"],
     ["オーストラリアの学校はいつ始まりますか？", "1月か2月", ["4月", "9月", "12月"], "school starts in January or February ＝「学校は1月か2月に始まる」。"],
     ["オリビアは学校で何を勉強していますか？", "日本語", ["中国語", "フランス語", "スペイン語"], "I study Japanese at school. ＝「学校で日本語を勉強している」。"],
     ["オリビアは日本語の勉強について何と言っていましたか？", "むずかしいけれど楽しい", ["かんたんで楽しい", "むずかしくて楽しくない", "好きではない"], "It is difficult, but it is fun. ＝「むずかしいけれど楽しい」。"],
     ["この手紙の内容に合うものはどれですか？", "オリビアはバスで学校に行く", ["シドニーは今、夏だ", "オリビアは水泳がきらいだ", "オリビアはねこを飼っている"], "I go to school by bus. ＝「バスで学校に行く」。"]]);
  A("j1e", "At the Zoo", `Ken: Look, Emma! The pandas are eating bamboo. Emma: They are so cute! How many pandas are there? Ken: There are three. The small one is a baby. Emma: Really? I want to take a picture. Can I use your camera? Ken: Sure. Here you are. Emma: Thank you. Oh, the baby is sleeping now. Ken: Let's go and see the lions next. They are near the gate. Emma: OK. After that, let's eat lunch.`,
    [["パンダは何をしていましたか？", "竹を食べていた", ["ねていた", "走っていた", "水を飲んでいた"], "The pandas are eating bamboo. ＝「パンダが竹を食べている」。"],
     ["パンダは何頭いますか？", "3頭", ["1頭", "2頭", "4頭"], "There are three. ＝「3頭いる」。"],
     ["エマは何をしたいと言っていましたか？", "写真をとりたい", ["パンダにさわりたい", "家に帰りたい", "ライオンを見たい"], "I want to take a picture. ＝「写真をとりたい」。"],
     ["エマはケンに何をたのみましたか？", "カメラを使わせてほしい", ["昼食を買ってほしい", "門まで案内してほしい", "パンダの名前を教えてほしい"], "Can I use your camera? ＝「カメラを使ってもいい？」"],
     ["ライオンはどこにいますか？", "門の近く", ["パンダのとなり", "レストランの中", "池の向こう"], "They are near the gate. ＝「門の近くにいる」。"],
     ["2人はライオンを見たあと何をする予定ですか？", "昼食を食べる", ["パンダをもう一度見る", "写真を印刷する", "家に帰る"], "After that, let's eat lunch. ＝「そのあと昼食を食べよう」。"]]);
  A("j1f", "My Grandmother", `My grandmother lives in a small town near the sea. She is seventy years old, but she is very active. She gets up at five every morning and walks on the beach. She grows tomatoes and cucumbers in her garden. She makes delicious pickles. Every summer, I visit her with my family. We go fishing together. She can catch many fish! In the evening, she tells me old stories. I love my grandmother.`,
    [["祖母はどこに住んでいますか？", "海の近くの小さな町", ["山の中の村", "大きな都市", "川の近くの町"], "lives in a small town near the sea ＝「海の近くの小さな町に住んでいる」。"],
     ["祖母が毎朝することは何ですか？", "海辺を散歩する", ["魚をつる", "トマトを売る", "料理教室に行く"], "walks on the beach ＝「海辺を歩く」。"],
     ["祖母の庭で育てているものは何ですか？", "トマトとキュウリ", ["ナスとピーマン", "りんごとみかん", "花とハーブ"], "She grows tomatoes and cucumbers ＝「トマトとキュウリを育てている」。"],
     ["夏に筆者が祖母とすることは何ですか？", "つりに行く", ["山に登る", "買い物に行く", "海で泳ぐ"], "We go fishing together. ＝「いっしょにつりに行く」。"],
     ["この文章の内容に合うものはどれですか？", "祖母はたくさん魚をつることができる", ["祖母は80歳だ", "祖母は朝おそく起きる", "筆者は冬に祖母をたずねる"], "She can catch many fish! ＝「たくさん魚をつることができる」。"]]);
  A("j1g", "School Rules", `Welcome to Midori Junior High School! Here are some rules for new students. Come to school by eight fifteen. Please say "Good morning" to your teachers and friends. Don't use your phone in the classroom. Don't eat snacks in the hallway. Clean your classroom after school. In the library, be quiet and don't run. If you have a problem, talk to your homeroom teacher. Let's enjoy school life together!`,
    [["何時までに学校に来なければなりませんか？", "8時15分", ["8時", "8時30分", "7時45分"], "Come to school by eight fifteen. ＝「8時15分までに来なさい」。"],
     ["教室でしてはいけないことは何ですか？", "携帯電話を使う", ["本を読む", "あいさつをする", "そうじをする"], "Don't use your phone in the classroom. ＝「教室で携帯電話を使ってはいけない」。"],
     ["放課後にすることは何ですか？", "教室をそうじする", ["図書館で走る", "ろうかでおやつを食べる", "早く帰る"], "Clean your classroom after school. ＝「放課後に教室をそうじしなさい」。"],
     ["困ったことがあるときはどうすればよいですか？", "担任の先生に話す", ["友だちに電話する", "図書館に行く", "家に帰る"], "talk to your homeroom teacher ＝「担任の先生に話しなさい」。"],
     ["この文章はだれに向けて書かれていますか？", "新入生", ["先生", "保護者", "卒業生"], "Here are some rules for new students. ＝「新入生のためのきまり」。"]]);
  A("j1h", "Tom's Hobby", `Tom is fourteen. His hobby is cooking. He cooks dinner for his family on Fridays. Last Friday, he made curry and salad. His sister said, "Your curry is the best!" Tom was very happy. He also likes baking. He can make cookies and cakes. Next month is his mother's birthday. He wants to make a big strawberry cake for her. He is practicing now. He wants to be a cook in the future.`,
    [["トムの趣味は何ですか？", "料理", ["サッカー", "読書", "音楽"], "His hobby is cooking. ＝「趣味は料理」。"],
     ["この前の金曜日にトムが作ったものは何ですか？", "カレーとサラダ", ["ケーキとクッキー", "スープとパン", "ピザとサラダ"], "Last Friday, he made curry and salad. ＝「カレーとサラダを作った」。"],
     ["トムの妹は何と言っていましたか？", "あなたのカレーは最高", ["サラダがおいしい", "もっと食べたい", "ケーキを作って"], "\"Your curry is the best!\" ＝「あなたのカレーは最高！」"],
     ["トムは来月、何を作りたいと思っていますか？", "大きないちごのケーキ", ["チョコレートクッキー", "特別なカレー", "フルーツサラダ"], "He wants to make a big strawberry cake for her. ＝「大きないちごのケーキを作りたい」。"],
     ["トムの将来の夢は何ですか？", "料理人", ["先生", "医者", "パイロット"], "He wants to be a cook in the future. ＝「将来は料理人になりたい」。"]]);
  A("j1i", "A Rainy Day", `It was rainy last Sunday. I could not play baseball. So I stayed home. In the morning, I cleaned my room and did my homework. In the afternoon, my brother and I watched an old movie. It was about a dog and a boy. It was a little sad, but it was very good. In the evening, the rain stopped. We went out and saw a beautiful rainbow. It was a nice day after all.`,
    [["この前の日曜日の天気はどうでしたか？", "雨", ["晴れ", "雪", "くもり"], "It was rainy last Sunday. ＝「この前の日曜日は雨だった」。"],
     ["筆者が午前中にしたことは何ですか？", "部屋のそうじと宿題", ["野球の練習", "映画を見ること", "買い物"], "I cleaned my room and did my homework. ＝「部屋をそうじして宿題をした」。"],
     ["映画は何についての話でしたか？", "犬と男の子", ["ねこと女の子", "野球選手", "にじ"], "It was about a dog and a boy. ＝「犬と男の子の話」。"],
     ["夕方に2人が見たものは何ですか？", "美しいにじ", ["大きな犬", "古い映画", "野球の試合"], "We went out and saw a beautiful rainbow. ＝「外に出て美しいにじを見た」。"],
     ["この文章の内容に合うものはどれですか？", "筆者は兄（弟）と映画を見た", ["筆者は野球をした", "映画はとても楽しい話だった", "一日中雨がふっていた"], "my brother and I watched an old movie ＝「兄（弟）とわたしは古い映画を見た」。"]]);
  A("j1j", "What Are They Doing?", `It is Saturday afternoon in the park. Many people are enjoying the sunny day. A young man is running around the pond. Two girls are sitting on a bench. They are eating ice cream. An old man is reading a newspaper under a big tree. Some children are playing soccer. A woman is walking her dog. The dog is very big, but it is gentle. Everyone looks happy.`,
    [["池のまわりを走っているのはだれですか？", "若い男の人", ["2人の女の子", "おじいさん", "子どもたち"], "A young man is running around the pond. ＝「若い男の人が池のまわりを走っている」。"],
     ["2人の女の子は何を食べていますか？", "アイスクリーム", ["サンドイッチ", "おにぎり", "ケーキ"], "They are eating ice cream. ＝「アイスクリームを食べている」。"],
     ["おじいさんはどこで新聞を読んでいますか？", "大きな木の下", ["ベンチの上", "池のそば", "家の中"], "under a big tree ＝「大きな木の下で」。"],
     ["子どもたちは何をしていますか？", "サッカーをしている", ["犬と遊んでいる", "絵をかいている", "泳いでいる"], "Some children are playing soccer. ＝「何人かの子どもがサッカーをしている」。"],
     ["犬について正しいものはどれですか？", "大きいけれどおとなしい", ["小さくておとなしい", "大きくてこわい", "池で泳いでいる"], "The dog is very big, but it is gentle. ＝「とても大きいけれどおとなしい」。"]]);
  A("j1k", "My Trip to Kyoto", `Last month, I went to Kyoto with my family. We stayed there for three days. On the first day, we visited Kinkakuji. It was beautiful in the sunshine. On the second day, we wore kimonos and walked around Gion. My mother took many pictures. On the last day, we ate yudofu. I didn't like it very much, but my father loved it. I bought some sweets for my friends. I want to go there again.`,
    [["筆者はどのくらい京都にいましたか？", "3日間", ["1日", "2日間", "1週間"], "We stayed there for three days. ＝「3日間滞在した」。"],
     ["1日目に訪れたところはどこですか？", "金閣寺", ["祇園", "清水寺", "奈良公園"], "On the first day, we visited Kinkakuji. ＝「1日目に金閣寺を訪れた」。"],
     ["2日目にしたことは何ですか？", "着物を着て祇園を歩いた", ["湯豆腐を食べた", "おみやげを買った", "金閣寺を見た"], "we wore kimonos and walked around Gion ＝「着物を着て祇園を歩いた」。"],
     ["湯豆腐について正しいものはどれですか？", "父はとても気に入った", ["筆者は大好きだった", "母は食べなかった", "2日目に食べた"], "I didn't like it very much, but my father loved it. ＝「わたしはあまり好きではなかったが、父は大好きだった」。"],
     ["筆者が友だちに買ったものは何ですか？", "おかし", ["着物", "写真", "湯豆腐"], "I bought some sweets for my friends. ＝「友だちにおかしを買った」。"]]);
  A("j1l", "The School Festival", `Our school festival was last Saturday. My class had a café. We sold sandwiches, cookies, and juice. I was a waiter. At first I was nervous, but soon I enjoyed it. Many people came to our café. My parents came, too. In the afternoon, I watched the brass band concert in the gym. They played very well. At the end of the day, our class was very tired, but everyone was smiling.`,
    [["筆者のクラスは学園祭で何をしましたか？", "カフェ", ["劇", "合唱", "お化け屋敷"], "My class had a café. ＝「クラスでカフェをした」。"],
     ["カフェで売らなかったものはどれですか？", "アイスクリーム", ["サンドイッチ", "クッキー", "ジュース"], "We sold sandwiches, cookies, and juice. ＝ アイスクリームは売っていない。"],
     ["筆者の係は何でしたか？", "ウェイター", ["料理係", "受付", "ポスター係"], "I was a waiter. ＝「ウェイターだった」。"],
     ["筆者は最初どんな気持ちでしたか？", "きんちょうしていた", ["ねむかった", "怒っていた", "退屈だった"], "At first I was nervous ＝「最初はきんちょうしていた」。"],
     ["午後に筆者が見たものは何ですか？", "吹奏楽部のコンサート", ["ダンスショー", "劇", "サッカーの試合"], "I watched the brass band concert in the gym. ＝「体育館で吹奏楽部のコンサートを見た」。"],
     ["一日の終わりのクラスの様子はどうでしたか？", "つかれていたが、みんな笑顔だった", ["みんな泣いていた", "みんな怒っていた", "まだ元気いっぱいだった"], "our class was very tired, but everyone was smiling ＝「とてもつかれていたが、みんな笑顔だった」。"]]);
  A("j1m", "Where Is My Bag?", `Mother: Riku, it's time for school. Are you ready? Riku: No. I can't find my bag. Mother: Is it in your room? Riku: No, it isn't. I looked everywhere. Mother: Did you look under the table in the living room? Riku: Oh, here it is! Thanks, Mom. Mother: You're welcome. Don't forget your lunch. It's on the kitchen table. Riku: OK. See you later! Mother: Have a nice day.`,
    [["リクがさがしていたものは何ですか？", "かばん", ["弁当", "くつ", "教科書"], "I can't find my bag. ＝「かばんが見つからない」。"],
     ["かばんはどこにありましたか？", "居間のテーブルの下", ["リクの部屋", "台所のテーブルの上", "玄関"], "under the table in the living room ＝「居間のテーブルの下」で見つかった。"],
     ["母はリクに何を忘れないように言いましたか？", "弁当", ["かばん", "かさ", "宿題"], "Don't forget your lunch. ＝「お弁当を忘れないで」。"],
     ["弁当はどこにありますか？", "台所のテーブルの上", ["かばんの中", "居間のテーブルの下", "冷蔵庫の中"], "It's on the kitchen table. ＝「台所のテーブルの上にある」。"],
     ["この会話はいつのことですか？", "学校に行く前", ["夕食のあと", "ねる前", "学校から帰ったあと"], "it's time for school ＝「学校の時間だ」。"]]);
  A("j1n", "Two Pets", `I have two pets, a dog and a parrot. The dog's name is Kuro. He is black and very friendly. He likes running in the park. The parrot's name is Pico. She is green and yellow. She can say some words, like "Hello" and "Good night." Every morning Pico says "Wake up!" to me. My friends laugh when they hear her. Kuro and Pico are good friends. They are my family.`,
    [["筆者が飼っているペットは何ですか？", "犬とオウム", ["犬とねこ", "ねことオウム", "犬とウサギ"], "I have two pets, a dog and a parrot. ＝「犬とオウムを飼っている」。"],
     ["クロはどんな犬ですか？", "黒くてとても人なつっこい", ["白くておとなしい", "黒くてこわい", "茶色くて小さい"], "He is black and very friendly. ＝「黒くてとても人なつっこい」。"],
     ["ピコは毎朝、筆者に何と言いますか？", "起きて！", ["おやすみ", "こんにちは", "おなかがすいた"], "Every morning Pico says \"Wake up!\" ＝「毎朝『起きて！』と言う」。"],
     ["友だちはピコの声を聞くとどうしますか？", "笑う", ["おどろいて帰る", "まねをする", "おこる"], "My friends laugh when they hear her. ＝「友だちは聞くと笑う」。"],
     ["この文章の内容に合うものはどれですか？", "クロとピコは仲がよい", ["ピコは青い", "クロは公園がきらいだ", "ピコは言葉を話せない"], "Kuro and Pico are good friends. ＝「クロとピコは仲よし」。"]]);
})(typeof window !== "undefined" ? window : globalThis);
