# v1.2.0 TODO（再開用：上から順に。終わったら [x]、コミットしてから次へ）
v1.1.0 は完了（2560f9c）。
- [x] C1 新しい問題形式エンジン（ord 並べかえ / match 線でつなぐ / pair カード合わせ / tap 図をタップ）＋ verify 対応 ＋ test
- [x] C2 図（SVG）：時計・分数・図形・グラフ・日本地図・実験図・英語絵カード → 各教科に新形式の問題を配置
- [x] C3 まとめカード（全ステップ、ステップ開始時、相棒が話す）
- [x] C4 コンボ（3/5/10）＋ゲージ
- [x] C5 ステップマップ（すごろく）
- [x] C6 まちがえた問題ボックス
- [x] C7 英語音声（読み上げボタン・リスニング問題）
- [x] C8 ボス問題（単元の最後、HPバー、見た目だけのごほうび）
- [x] C9 学習指導要領の監査（tools/curriculum.json → coverage.json に不足）→ 不足単元を追加（理科小6・社会小6/中1・英語小6 ほか）
- [x] C10 v1.2.0（SW キャッシュ）・screenshots/v12・Actions・ライブ確認・報告
- [x] C11 ネイティブアプリ風の仕上げ（下タブ＋アイコン5つ／上バー＋戻る／画面遷移アニメ／safe-area／スプラッシュ／押した感／読み込み表示／デザインシステム／standalone PWA meta／選択・ズーム防止／設定画面（音オンオフ・音量・名前））＋ before/after スクショ（screenshots/v12/before-*.png, after-*.png）
  - 参考にしたパターン：Duolingo（ステップの道・コンボ・ハートなしの励まし）、Quizlet（カード合わせ）、Khan Academy Kids（大きいタップ領域・キャラ）、スタディサプリ（単元→ステップ）、iOS（タブバー・大見出し・シート）

## 進捗メモ（v1.2）
- 391fed4〜: C3〜C8 実装済み・tools/test_v12.py 51/51・test_app 33/33
- C11: 下タブ（学ぶ/マイページ）・大見出し・戻るに前の画面名・遷移アニメ・スプラッシュ・押した感・音量・マイページ済み。before/after スクショ済み（tools/shots_ui.py）
- v1.1 のバグ修正：body の data-bg に closest がヒットして data-act ボタン（つづきから・ガチャ・ボックス等）が反応しなかった → button[data-bg] に限定
- 残り：C2（日本地図タップ・理科の図）、C9（学習指導要領の監査＋不足単元）、C10（版上げ・SW・live）
- C9 済み：tools/curriculum.json（310項目）→ tools/audit.js → coverage.json.audit。前 291/310（tools/audit-before-v12.txt）→ 後 310/310。q-gaps.js 追加
- 修正：画面遷移アニメ中の横はみ出しでページが縮小される問題（overflow-x clip）。test_v12 52/52
- C10 済み：b72b807 Actions success、公開版 v1.2.0・SWキャッシュ hoshi-manabi-v1.2.0 を確認

# v1.3.0 TODO（アカウント・クラウド保存）
- [x] A1 firebase-config.js（本物の設定・enabled:true）、hm-merge.js（合わせ方）、auth.js（Firebase 12.6.0 CDN・ログイン画面・同期・マイページ欄）
- [x] A2 firestore.rules、privacy.html、terms.html、legal.html 更新、SW v1.3.0（Firebase/Google 通信はキャッシュしない）
- [x] A3 tools/fb_mock.js ＋ tools/test_v13.py（55/55）、旧テストは NOAUTH でログイン画面なし、screenshots/v13
- [x] A4 オーナーが firestore.rules を公開 → main にマージして公開 → 本番でメール登録・同期・削除のE2E → 報告
  - いまはブランチ v1.3.0-auth にだけ push（main に入れると公開される）
  - 本番E2Eで発見：まっさらな端末でログインすると名前などの設定が端末の空の値で上書き → hm-merge.js 修正（isBlank・空の設定はうめる）、tools/test_merge.js、SW v1.3.0-r2

# v1.3.1（書きこみを減らす）
- [x] 30秒の自動保存をやめる。保存はステップの終わり・かくした/とじた（visibilitychange/pagehide）・ガチャ/ボス勝利（3分以内はまとめる）だけ。内容が同じなら書かない（ハッシュ）。起動しなおしでも書かない
- [x] 「今すぐ保存」ボタン削除（同期状態の表示は残す）
- [x] test_v13 62/62（30分のまね：書きこみ10回）、SW hoshi-manabi-v1.3.1

# v1.4.0（アカウントが本物・端末ごとに分ける・同時ログイン）
- [x] app.js：保存場所をプロフィールごと（hoshimanabi / hoshimanabi:u:<uid>）、useProfile、boxGone（クリアの印）
- [x] auth.js：newLogin（クラウドを使う・からっぽのときだけ引きつぎを聞く）、resume、endSession（ログアウトで端末から消す）、onSnapshot、runTransaction で合わせて書く、Google はポップアップ＋やさしいエラー
- [x] test_v13 77/77（モック）、test_merge 10/10
- [x] 本番：2つのブラウザ（2台の端末）で E2E 29/29 → テストアカウント削除（tools/test_live14.py, tools/live_cleanup.py）。SW v1.4.0-r2（保存待ち修正を確実に配るため）

# v1.4.1（iPhone の Google ログイン）
- [x] huishilichuan-bot/huishilichuan-bot.github.io を作成：/__/auth/（Firebase のヘルパー）、/__/firebase/init.json、.nojekyll、/ → /hoshi-manabi/
- [x] authDomain = huishilichuan-bot.github.io、Google はポップアップ → ひらけないときリダイレクト（同じオリジンなので Safari でも動く）
- [ ] オーナー：Google Cloud の OAuth クライアントに承認済みリダイレクトURI https://huishilichuan-bot.github.io/__/auth/handler を追加

# v1.5.0 大改修 TODO（再開用：上から順に。終わったら [x]、コミット＆push してから次へ）
基準：tools/stats-before-v15.json（node tools/stats.js 30）。合計 ステップ912・1周7120問・ちがう問題65263・図3895・形式 ch4062/num2765/ord116/pair78/match12/tap87
- [ ] V1 すぐ直す：早押し 2秒→1秒、名前（manifest/title/OG/apple-title、ユーザーサイトにもOG）、強さ選択をレベル名だけ（大きいカラフルボタン＋記録とランク）、ゴールテープ＋豪華な勝利画面（共通）
- [ ] V2 新しい形式：tf（〇×）、sort（なかま分け）、tiles（文字タイルで穴埋め）、multi（あてはまるもの全部）、kanji（なぞり・書き取り 手書き判定）、line（数直線タップ）＋ verify.js ＋ テスト
- [ ] V3 国語：各学年の最初に「漢字を書こう」単元（学年別漢字配当表、中学は常用漢字）
- [ ] V4 形式を広げる：既存のバンク・表から 〇×/タイル/分類/線つなぎ のステップを自動で作る（正解は元データから）
- [ ] V5 図：算数（図形の名前・立体・角・面積・グラフ・数直線・分数・座標・関数）、理科（実験器具・回路・てこ・天気・地層・細胞・人体・イオン・力・運動グラフ）、社会（日本地図・都道府県・地図記号・世界地図・雨温図・グラフ・年表）
- [ ] V6 単調さ・不適切：文章題の文脈テンプレ（名詞と動詞の組み合わせ表）、となりの問題で同じ答えをさける並べかえ、名詞×動詞の自動検査テスト
- [ ] V7 量：全教科・全学年で ちがう問題 3倍以上・1周の問題数 約3倍、学年が上がっても減らない（自動テスト）
- [ ] V8 ゲーム 100個以上（スポーツ・レース・シューティング・バトロワ風・パルクールほか）、演出・効果音・勝利画面
- [ ] V9 テスト全部・WebKit（iPhone Safari）スクショ screenshots/v15/
- [ ] V10 v1.5.0・SW・公開・報告
