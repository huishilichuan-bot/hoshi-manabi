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
