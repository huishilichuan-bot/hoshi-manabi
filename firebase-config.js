/* ほしまなび — Firebase の設定（無料の Spark プランだけで使います。お金のかかる機能は使いません）
   enabled: false にすると、ログイン画面を出さず、今までどおり端末の中だけに保存します（Web の apiKey は公開してよい値。データは firestore.rules で本人だけに限定）。 */
window.HM_FIREBASE = {
  enabled: true,
  sdk: "12.6.0",
  config: {
    apiKey: "AIzaSyBhkx_Il1VZpDKc_cKc3q8gE2Hlf0SH8-4",
    authDomain: "hoshi-manabi.firebaseapp.com",
    projectId: "hoshi-manabi",
    storageBucket: "hoshi-manabi.firebasestorage.app",
    messagingSenderId: "399747982554",
    appId: "1:399747982554:web:c7f53a31b4c79bd01b71e3",
  },
};
