/* ほしまなび — アカウント（Firebase Auth：Google／メール）とクラウド保存（Firestore users/{uid}）
   Firebase は無料の Spark プランだけで使う。firebase-config.js が本物の設定になるまでは何もしない（今までどおり端末の中だけ）。 */
const CFG = window.HM_FIREBASE || {};
const MOCK = window.__HM_FB_MOCK || null;
const REAL = !!(CFG.enabled && CFG.config && CFG.config.apiKey && !/PLACEHOLDER/.test(CFG.config.apiKey));
const ENABLED = !!(MOCK || REAL);
const SEEN_KEY = "hoshimanabi-auth-seen", OWNER_KEY = "hoshimanabi-owner"; // OWNER_KEY は v1.3 の古い印（読みとって消すだけ）
const GUEST_KEY = "hoshimanabi", ACTIVE_KEY = "hoshimanabi-active";
const ukey = (uid) => "hoshimanabi:u:" + uid, HASH_KEY = (uid) => "hoshimanabi-sync:" + uid;
const isInApp = () => /Line\/|FBAN|FBAV|Instagram|MicroMessenger|Twitter|; wv\)/i.test(navigator.userAgent);
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const APP = () => window.HM_APP;
const isStandalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// ---------- Firebase（本物）をつなぐ部品 ----------
async function realAdapter() {
  const base = "https://www.gstatic.com/firebasejs/" + (CFG.sdk || "12.6.0") + "/";
  const [A, AU, FS] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]);
  const app = A.initializeApp(CFG.config);
  const auth = AU.initializeAuth(app, { persistence: [AU.indexedDBLocalPersistence, AU.browserLocalPersistence], popupRedirectResolver: AU.browserPopupRedirectResolver });
  auth.languageCode = "ja";
  // 端末の中には Firestore のデータを残さない（メモリだけ）。ログアウトしたら何ものこらない
  const db = FS.getFirestore(app);
  const ref = (uid) => FS.doc(db, "users", uid);
  const userOf = (u) => (u ? { uid: u.uid, email: u.email || "", provider: (u.providerData[0] && u.providerData[0].providerId) || "password", name: u.displayName || "" } : null);
  const gp = () => { const p = new AU.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" }); return p; };
  return {
    onAuth: (cb) => AU.onAuthStateChanged(auth, (u) => cb(userOf(u))),
    // Google：ログイン用ヘルパーを同じオリジン（authDomain = huishilichuan-bot.github.io）で配信しているので、
    // ポップアップもリダイレクトも Safari のストレージ分離の影響を受けない。まずポップアップ、ひらけないときはリダイレクト
    google: async () => {
      try { return await AU.signInWithPopup(auth, gp()); }
      catch (e) {
        if (/popup-blocked|operation-not-supported-in-this-environment|internal-error|web-storage-unsupported/.test(e.code || "")) { await AU.signInWithRedirect(auth, gp()); return null; }
        throw e;
      }
    },
    redirectResult: () => AU.getRedirectResult(auth),
    emailIn: (e, p) => AU.signInWithEmailAndPassword(auth, e, p),
    emailUp: (e, p) => AU.createUserWithEmailAndPassword(auth, e, p),
    reset: (e) => AU.sendPasswordResetEmail(auth, e),
    signOut: () => AU.signOut(auth),
    getDoc: async (uid) => { const s = await FS.getDoc(ref(uid)); return s.exists() ? s.data() : null; },
    // ほかの端末の変更を受けとる（1回のログインで1つだけ）
    listen: (uid, cb, onErr) => FS.onSnapshot(ref(uid), { includeMetadataChanges: false }, (snap) => { if (snap.metadata.hasPendingWrites) return; cb(snap.exists() ? snap.data() : null, snap.metadata.fromCache); }, onErr),
    // 書くときは、クラウドの最新と合わせてから書く（同時に遊んでも記録が消えない）
    mergeWrite: (uid, fn) => FS.runTransaction(db, async (t) => { const r = ref(uid); const snap = await t.get(r); const out = fn(snap.exists() ? snap.data() : null); t.set(r, out.doc); return out; }),
    deleteDoc: (uid) => FS.deleteDoc(ref(uid)),
    deleteUser: () => AU.deleteUser(auth.currentUser),
    userAlive: async () => { try { await auth.currentUser.reload(); return true; } catch (e) { return !/user-not-found|user-token-expired|user-disabled|invalid-user-token/.test(e.code || ""); } },
    reauthGoogle: () => AU.reauthenticateWithPopup(auth.currentUser, gp()),
    reauthEmail: (pw) => AU.reauthenticateWithCredential(auth.currentUser, AU.EmailAuthProvider.credential(auth.currentUser.email, pw)),
  };
}

// ---------- やさしいエラーメッセージ ----------
function jaError(e) {
  const c = (e && e.code) || "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-login-credentials/.test(c)) return "メールアドレスかパスワードがちがうみたい。もう一度たしかめてね。";
  if (/email-already-in-use/.test(c)) return "このメールアドレスはもう登録されているよ。「ログイン」からどうぞ。";
  if (/account-exists-with-different-credential/.test(c)) return "このメールアドレスは、メールアドレスとパスワードで登録されているよ。「メールアドレスで続ける」からログインしてね。";
  if (/invalid-email|missing-email/.test(c)) return "メールアドレスの形をたしかめてね（れい：name@example.com）。";
  if (/weak-password|missing-password/.test(c)) return "パスワードは8文字以上にしてね。";
  if (/network-request-failed|unavailable|offline/.test(c)) return "インターネットにつながっていないみたい。つながってからもう一度ためしてね。";
  if (/too-many-requests/.test(c)) return "何回もためしたので、少し時間をおいてからもう一度ためしてね。";
  if (/popup-closed-by-user|cancelled-popup-request|user-cancelled/.test(c)) return "ログインをとちゅうでやめました。";
  if (/popup-blocked/.test(c)) return isIOS() ? "Googleの画面がひらけなかったよ。もう一度「Googleで続ける」をおしてね。ひらかないときは「メールアドレスで続ける」も使えるよ。" : "Googleの画面がひらけなかったよ。ポップアップを許可して、もう一度おしてね。";
  if (/operation-not-supported|web-storage-unsupported/.test(c)) return "このブラウザの設定ではGoogleでログインできないよ。プライベートブラウズをやめるか、Safari／Chromeで開いてね。「メールアドレスで続ける」も使えるよ。";
  if (/unauthorized-domain/.test(c)) return "このページからはGoogleでログインできないよ。「メールアドレスで続ける」を使ってね。";
  if (/internal-error/.test(c) && isIOS() && isStandalone()) return "ホーム画面のアプリでGoogleがひらけないときは、「メールアドレスで続ける」を使ってね。";
  if (/requires-recent-login/.test(c)) return "安全のため、もう一度ログインしてからためしてね。";
  if (/user-disabled/.test(c)) return "このアカウントは今は使えません。";
  if (/user-token-expired|invalid-user-token/.test(c)) return "ログインの期限が切れたよ。もう一度ログインしてね。";
  return "うまくいかなかったよ。少ししてからもう一度ためしてね。";
}

// ---------- 同期 ----------
// 記録はアカウントが本物：ログインしたらクラウド（users/{uid}）を読みこんで使う。端末の中はそのコピー（ログアウトで消す）。
// 書きこみは少なく：① ステップの終わり ② アプリをかくした／とじたとき ③ ガチャ・ボス勝利のあと（①③は3分以内ならまとめる）。
// 内容が前回と同じなら書かない。書くときはクラウドの最新と合わせてから書く（⭐はへらない・なかまは両方・進みは大きい方）。
const MIN_GAP = 180000, RETRY_MS = 60000;
const S = { fb: null, user: null, status: "off", savedAt: 0, lastPush: 0, timer: null, dirty: false, applying: false, paused: false, ready: false, lastHash: "", cloudSig: "", writes: 0, busy: false, unsub: null, carry: null, gen: 0 };
function setStatus(st) { S.status = st; refreshSection(); }
function strHash(t) { t = String(t || ""); let h = 0x811c9dc5; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36) + ":" + t.length; }
function hashOf(st) { const o = Object.assign({}, st); delete o.updatedAt; return strHash(JSON.stringify(o)); }
const parseDoc = (d) => { try { return d && d.data ? JSON.parse(d.data) : null; } catch (e) { return null; } };
const readJSON = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
const M = () => window.HMMerge;
function remember() { if (S.user) try { localStorage.setItem(HASH_KEY(S.user.uid), JSON.stringify({ h: S.lastHash, c: S.cloudSig })); } catch (e) {} }
function apply(st) { S.applying = true; try { APP().importState(st); } finally { S.applying = false; } }
function schedule(ms, why) {
  if (!S.user || S.timer) return;
  S.timer = setTimeout(() => { S.timer = null; push(why || "timer"); }, Math.max(0, ms));
}
// 書きこみ中ならそれが終わるのを待ってから（ログアウト前の保存が途中で切れないように）
async function push(why) {
  if (S.inflight) { try { await S.inflight; } catch (e) {} }
  if (!S.user || S.paused || !S.ready) return;
  const auto = why === "step" || why === "milestone";
  if (auto && Date.now() - S.lastPush < MIN_GAP) { schedule(S.lastPush + MIN_GAP - Date.now(), "timer"); return; }
  if (S.inflight) return push(why);
  const st = APP().exportState(), h = hashOf(st);
  if (h === S.lastHash) { S.dirty = false; if (S.status !== "saved" && S.status !== "offline") setStatus("saved"); return; }
  clearTimeout(S.timer); S.timer = null;
  const uid = S.user.uid, gen = S.gen;
  let done; S.inflight = new Promise((r) => (done = r));
  try {
    S.lastPush = Date.now(); setStatus("saving");
    const out = await S.fb.mergeWrite(uid, (doc) => {
      const remote = parseDoc(doc);
      // クラウドがこの端末の知らないうちに変わっていたら合わせる
      const merged = remote && doc && strHash(doc.data) !== S.cloudSig ? M().mergeStates(st, remote) : st;
      const data = M().slimForCloud(merged);
      return { merged, data, changed: merged !== st, doc: { data, updatedAt: Date.now(), v: 1 } };
    });
    if (gen !== S.gen) return;
    S.writes++; S.cloudSig = strHash(out.data);
    if (out.changed) { const cur = APP().exportState(); apply(hashOf(cur) === h ? out.merged : M().mergeStates(cur, out.merged)); S.lastHash = hashOf(out.merged); }
    else S.lastHash = h;
    remember();
    S.dirty = hashOf(APP().exportState()) !== S.lastHash; S.savedAt = Date.now(); setStatus("saved");
  } catch (e) {
    if (gen !== S.gen) return;
    S.dirty = true; setStatus(navigator.onLine === false || /unavailable|network|offline|failed-precondition/.test((e && e.code) || "") ? "offline" : "error");
    schedule(RETRY_MS, "retry");
  } finally { S.inflight = null; done(); }
}
const unsaved = () => !!(S.user && S.ready && hashOf(APP().exportState()) !== S.lastHash);
window.HMSync = {
  dirty() { if (!S.user || S.applying) return; S.dirty = true; },
  flush: (why) => push(why || "hidden"),
  status: () => ({ status: S.status, user: S.user, savedAt: S.savedAt, dirty: S.dirty || unsaved(), lastPush: S.lastPush, writes: S.writes, timer: !!S.timer, ready: S.ready, profile: APP().profileKey() }),
};
// ほかの端末で変わったとき（クラウドの記録が更新されたとき）
async function onRemote(doc, fromCache) {
  if (!S.user || S.paused) return;
  if (!doc) {
    if (fromCache) return;
    // クラウドの記録がない：アカウントが削除されたか、まだ一度も保存していない
    if (!(await S.fb.userAlive())) { await endSession(); APP().toast("このアカウントは削除されました"); show("welcome"); return; }
    S.cloudSig = ""; S.lastHash = ""; S.ready = true; push("retry"); return;
  }
  const sig = strHash(doc.data);
  if (sig === S.cloudSig && S.ready) { if (S.status === "syncing") setStatus("saved"); return; }
  const remote = parseDoc(doc); if (!remote) return;
  const cur = APP().exportState();
  const localChanged = hashOf(cur) !== S.lastHash;
  if (!localChanged) { apply(remote); S.lastHash = hashOf(APP().exportState()); }
  else { apply(M().mergeStates(cur, remote)); }
  S.cloudSig = sig; remember();
  const first = !S.ready; S.ready = true;
  if (localChanged) { S.dirty = true; push(first ? "signin" : "milestone"); } else { S.dirty = false; S.savedAt = S.savedAt || Date.now(); setStatus("saved"); }
}
function listen() {
  if (S.unsub) { try { S.unsub(); } catch (e) {} }
  const gen = S.gen;
  S.unsub = S.fb.listen(S.user.uid, (d, fc) => { if (gen === S.gen) onRemote(d, fc); }, (e) => { if (gen === S.gen) setStatus(/unavailable|network/.test((e && e.code) || "") ? "offline" : "error"); });
}
// すでにこの端末でログインしていた（起動しなおし）：端末のコピーで先に表示し、クラウドが来たら合わせる
function resume(user) {
  S.user = user; S.gen++; S.ready = false; setStatus("syncing");
  if (APP().profileKey() !== ukey(user.uid)) APP().useProfile(ukey(user.uid));
  const m = readJSON(HASH_KEY(user.uid)) || {}; S.lastHash = m.h || ""; S.cloudSig = m.c || "";
  listen();
}
// 新しくログインした：アカウントの記録（クラウド）を使う。ゲストの記録は、からっぽのアカウントにだけ引きつげる
async function newLogin(user) {
  S.user = user; S.gen++; S.ready = false; setStatus("syncing");
  const gen = S.gen;
  try {
    const doc = await S.fb.getDoc(user.uid);
    if (gen !== S.gen) return;
    const remote = parseDoc(doc);
    // v1.3 の古いデータ：同じ人のものなら合わせ、ほかの人のものなら使わない
    const owner = localStorage.getItem(OWNER_KEY);
    let legacy = null;
    if (owner) { if (owner === user.uid) legacy = readJSON(GUEST_KEY); localStorage.removeItem(OWNER_KEY); localStorage.removeItem(GUEST_KEY); localStorage.removeItem("hoshimanabi-cloudhash"); }
    let account;
    if (remote && !M().isBlank(remote)) account = legacy ? M().mergeStates(legacy, remote) : remote;
    else if (legacy) account = remote ? M().mergeStates(legacy, remote) : legacy;
    else {
      const guest = readJSON(GUEST_KEY);
      if (guest && !M().isBlank(guest)) {
        const yes = await askCarry(guest);
        if (gen !== S.gen) return;
        if (yes) { account = guest; localStorage.removeItem(GUEST_KEY); } else account = remote || null;
      } else account = remote || null;
    }
    localStorage.setItem(ACTIVE_KEY, user.uid);
    APP().useProfile(ukey(user.uid), account, { home: true });
    S.cloudSig = doc ? strHash(doc.data) : "";
    S.lastHash = account === remote && remote ? hashOf(APP().exportState()) : "";
    S.ready = true; remember();
    await push("signin");
    if (gen !== S.gen) return;
    if (S.status === "syncing") setStatus("saved");
    listen();
  } catch (e) {
    if (gen !== S.gen) return;
    // 読みこめなかった：ゲストのデータは使わず、つながったらやりなおす
    setStatus(navigator.onLine === false || /unavailable|network|offline/.test((e && e.code) || "") ? "offline" : "error");
    S.pendingLogin = true;
    setTimeout(() => { if (S.user && S.pendingLogin && gen === S.gen) { S.pendingLogin = false; newLogin(S.user); } }, RETRY_MS);
  }
}
// この端末からアカウントの記録を消して、ゲストにもどす
async function endSession() {
  const uid = (S.user && S.user.uid) || localStorage.getItem(ACTIVE_KEY);
  S.gen++; clearTimeout(S.timer); S.timer = null;
  if (S.unsub) { try { S.unsub(); } catch (e) {} S.unsub = null; }
  if (uid) { localStorage.removeItem(ukey(uid)); localStorage.removeItem(HASH_KEY(uid)); }
  localStorage.removeItem(ACTIVE_KEY);
  S.user = null; S.ready = false; S.dirty = false; S.lastHash = ""; S.cloudSig = ""; S.paused = false; S.pendingLogin = false;
  APP().useProfile(GUEST_KEY, undefined, { home: true });
  setStatus("off");
}
window.addEventListener("hm-step-end", () => push("step"));
window.addEventListener("hm-milestone", () => push("milestone"));
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") push("hidden"); });
window.addEventListener("pagehide", () => push("hidden"));
window.addEventListener("online", () => { if (S.user && S.pendingLogin) { S.pendingLogin = false; newLogin(S.user); } else if (S.dirty) push("retry"); });

// ---------- 画面 ----------
const G_LOGO = '<svg class="g-logo" viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>';
const STAR = '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><defs><linearGradient id="au-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ff922b"/></linearGradient></defs><path d="M32 4l8.2 17.6 19.3 2.3-14.2 13.2 3.8 19.1L32 46.6 14.9 56.2l3.8-19.1L4.5 23.9l19.3-2.3z" fill="url(#au-g)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>';
const LEGAL = '<p class="au-legal">続けると、<a href="./terms.html">利用規約</a>と<a href="./privacy.html">プライバシーポリシー</a>に同意したことになります。小学生・中学生の人は、おうちの人といっしょに読んでね。</p>';
const EYE = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 3l18 18M10.6 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.5 4.5-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
let view = null, mode = "login", busy = false, lastEmail = "";
function layer() { let L = $("#auth-layer"); if (!L) { L = document.createElement("div"); L.id = "auth-layer"; L.className = "auth-layer"; L.setAttribute("role", "dialog"); L.setAttribute("aria-label", "ログイン"); document.body.appendChild(L); } return L; }
function partner(size) { try { const st = APP().state(); return APP().charHtml(st.partner, size, "au-char"); } catch (e) { return ""; } }
function show(v, opt = {}) {
  view = v; const L = layer(); L.hidden = false; document.body.classList.add("auth-open");
  let h = "";
  if (v === "welcome") {
    h = '<div class="au-welcome"><div class="au-sky"><i class="s1">✦</i><i class="s2">✧</i><i class="s3">✦</i><i class="s4">★</i></div>' +
      '<div class="au-brand">' + STAR + '<b>ほしまなび</b></div><div class="au-hero">' + partner(150) + '<span class="au-shadow"></span></div>' +
      '<h2 class="au-h">記録をクラウドに保存しよう</h2><p class="au-sub">ログインすると、⭐・なかま・進みぐあいが<br>ほかのスマホやタブレットでもつづきから使えるよ。</p>' +
      '<div class="au-btns"><button type="button" class="gsi-btn" data-au="google">' + G_LOGO + '<span>Googleで続ける</span></button>' +
      '<button type="button" class="au-btn mail" data-au="to-email"><span class="au-ic">✉️</span><span>メールアドレスで続ける</span></button>' +
      '<button type="button" class="au-later" data-au="later">あとで（ゲストで使う）</button></div>' + '<div class="au-err" id="au-err" role="alert" hidden></div>' +
      (isInApp() ? '<p class="au-tip">💡 アプリの中のブラウザでGoogleがひらかないときは、メニューの「Safariで開く」（または「ブラウザで開く」）から開いてね。</p>' : "") + LEGAL + "</div>";
  } else if (v === "email") {
    mode = opt.mode || mode;
    const up = mode === "signup";
    h = '<div class="au-page"><div class="au-top"><button type="button" class="au-back" data-au="back" aria-label="もどる">‹</button><div class="au-mini">' + STAR.replace('width="56" height="56"', 'width="28" height="28"') + "<b>ほしまなび</b></div></div>" +
      '<div class="au-seg" role="tablist"><button type="button" role="tab" class="' + (!up ? "on" : "") + '" data-au="mode-login" aria-selected="' + !up + '">ログイン</button><button type="button" role="tab" class="' + (up ? "on" : "") + '" data-au="mode-signup" aria-selected="' + up + '">新規登録</button><i class="au-seg-ind ' + (up ? "r" : "") + '"></i></div>' +
      '<h2 class="au-h2">' + (up ? "アカウントをつくる" : "おかえりなさい！") + '</h2><p class="au-sub2">' + (up ? "メールアドレスとパスワードを決めてね。" : "登録したメールアドレスでログインしてね。") + "</p>" +
      '<form class="au-form" id="au-form" novalidate><label class="au-field"><span>メールアドレス</span><input class="au-in" id="au-email" type="email" inputmode="email" autocomplete="' + (up ? "email" : "username") + '" autocapitalize="off" spellcheck="false" placeholder="name@example.com" value="' + esc(lastEmail) + '" required></label>' +
      '<label class="au-field"><span>パスワード</span><div class="au-pw"><input class="au-in" id="au-pw" type="password" autocomplete="' + (up ? "new-password" : "current-password") + '" placeholder="' + (up ? "8文字以上" : "パスワード") + '" required minlength="8"><button type="button" class="au-eye" data-au="eye" aria-label="パスワードを表示">' + EYE + "</button></div></label>" +
      (up ? '<ul class="au-rules"><li id="r-len">8文字以上</li><li id="r-mix">英字と数字をまぜるとより安全</li></ul>' : '<button type="button" class="au-link" data-au="to-reset">パスワードを忘れた？</button>') +
      '<div class="au-err" id="au-err" role="alert" hidden></div>' +
      '<button type="submit" class="au-btn primary" id="au-submit"><span class="au-lbl">' + (up ? "登録して続ける" : "ログイン") + '</span><span class="au-spin" aria-hidden="true"></span></button></form>' +
      (up ? LEGAL : '<p class="au-switch">はじめての人は <button type="button" class="au-link" data-au="mode-signup">新規登録</button></p>') + "</div>";
  } else if (v === "reset") {
    h = '<div class="au-page"><div class="au-top"><button type="button" class="au-back" data-au="to-email" aria-label="もどる">‹</button><div class="au-mini">' + STAR.replace('width="56" height="56"', 'width="28" height="28"') + '<b>ほしまなび</b></div></div><div class="au-ico-big">🔑</div><h2 class="au-h2">パスワードの再設定</h2><p class="au-sub2">登録したメールアドレスに、新しいパスワードを決めるためのメールを送るよ。</p>' +
      '<form class="au-form" id="au-reset" novalidate><label class="au-field"><span>メールアドレス</span><input class="au-in" id="au-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" placeholder="name@example.com" value="' + esc(lastEmail) + '"></label><div class="au-err" id="au-err" role="alert" hidden></div><div class="au-ok" id="au-ok" hidden></div><button type="submit" class="au-btn primary" id="au-submit"><span class="au-lbl">メールを送る</span><span class="au-spin" aria-hidden="true"></span></button></form></div>';
  } else if (v === "carry") {
    const g = opt.guest || {}, n = Object.keys(g.chars || {}).length;
    h = '<div class="au-done au-carry"><div class="au-hero">' + partner(120) + '</div><h2 class="au-h">ゲストの記録を引きつぐ？</h2><p class="au-sub">この端末でゲストとして集めた記録があるよ。<br>新しいアカウントに引きついで、つづきから始められるよ。</p>' +
      '<div class="au-carry-box"><div><b>⭐ ' + (g.totalStars || 0) + '</b><small>集めた⭐</small></div><div><b>🐾 ' + n + '</b><small>なかま</small></div><div><b>📘 ' + Object.keys(g.progress || {}).length + '</b><small>やったステップ</small></div></div>' +
      '<div class="au-btns"><button type="button" class="au-btn primary" data-au="carry-yes">引きついで始める</button><button type="button" class="au-btn mail" data-au="carry-no">引きつがずに新しく始める</button></div><p class="au-legal">引きつがないときは、ゲストの記録はこの端末にのこるよ（ログアウトするとゲストにもどれます）。</p></div>';
  } else if (v === "done") {
    h = '<div class="au-done"><div class="au-hero">' + partner(140) + '</div><div class="au-check">✓</div><h2 class="au-h">ログインしました！</h2><p class="au-sub">' + esc(S.user ? S.user.email : "") + '<br>記録はアカウントに保存されるよ。<br>ほかの端末でログインしても、同じ記録で遊べるよ。</p><button type="button" class="au-btn primary" data-au="close">はじめる</button></div>';
  }
  L.innerHTML = h; L.className = "auth-layer v-" + v;
  const f = $("#au-form", L); if (f) f.addEventListener("submit", (e) => { e.preventDefault(); submitEmail(); });
  const r = $("#au-reset", L); if (r) r.addEventListener("submit", (e) => { e.preventDefault(); submitReset(); });
  const pw = $("#au-pw", L); if (pw) pw.addEventListener("input", rules);
  L.querySelectorAll(".au-in").forEach((i) => i.addEventListener("input", () => { const e = $("#au-err", L); if (e && !e.hidden) { e.hidden = true; e.textContent = ""; } }));
}
function hide() { const L = $("#auth-layer"); if (L) { L.classList.add("out"); setTimeout(() => { L.hidden = true; L.classList.remove("out"); L.innerHTML = ""; }, 260); } document.body.classList.remove("auth-open"); view = null; }
function rules() { const v = ($("#au-pw") || {}).value || ""; const a = $("#r-len"), b = $("#r-mix"); if (a) a.classList.toggle("ok", v.length >= 8); if (b) b.classList.toggle("ok", /[a-zA-Z]/.test(v) && /\d/.test(v)); }
function err(msg) { const e = $("#au-err"); if (!e) { APP().toast(msg); return; } e.textContent = msg; e.hidden = !msg; if (msg) { e.classList.remove("shake"); void e.offsetWidth; e.classList.add("shake"); } }
function setBusy(b, btn) { busy = b; const s = btn || $("#au-submit"); if (s) { s.classList.toggle("busy", b); s.disabled = b; } document.querySelectorAll("#auth-layer button").forEach((x) => { if (x !== s) x.disabled = b; }); }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
async function submitEmail() {
  if (busy) return;
  const email = $("#au-email").value.trim(), pw = $("#au-pw").value; lastEmail = email;
  if (!EMAIL_RE.test(email)) return err("メールアドレスの形をたしかめてね（れい：name@example.com）。");
  if (mode === "signup" && pw.length < 8) return err("パスワードは8文字以上にしてね。");
  if (!pw) return err("パスワードを入れてね。");
  err(""); setBusy(true);
  try { if (mode === "signup") await S.fb.emailUp(email, pw); else await S.fb.emailIn(email, pw); localStorage.setItem(SEEN_KEY, "1"); afterLogin(); }
  catch (e) { setBusy(false); err(jaError(e)); if (/email-already-in-use/.test(e.code || "")) { const sw = $("#au-err"); if (sw) sw.insertAdjacentHTML("beforeend", ' <button type="button" class="au-link" data-au="mode-login">ログインへ</button>'); } }
}
async function submitReset() {
  if (busy) return;
  const email = $("#au-email").value.trim(); lastEmail = email;
  if (!EMAIL_RE.test(email)) return err("メールアドレスの形をたしかめてね（れい：name@example.com）。");
  err(""); setBusy(true);
  try { await S.fb.reset(email); setBusy(false); const ok = $("#au-ok"); ok.hidden = false; ok.innerHTML = "📩 メールを送りました。<br>とどいたメールのリンクから新しいパスワードを決めてね。迷惑メールのフォルダも見てみてね。"; }
  catch (e) { setBusy(false); err(jaError(e)); }
}
async function google() {
  if (busy) return;
  const btn = document.querySelector('[data-au="google"]'); err(""); setBusy(true, btn); if (btn) btn.classList.add("busy");
  try { const r = await S.fb.google(); if (r === null) return; localStorage.setItem(SEEN_KEY, "1"); afterLogin(); }
  catch (e) { setBusy(false, btn); if (btn) btn.classList.remove("busy"); if (!/popup-closed-by-user|cancelled-popup-request/.test(e.code || "")) err(jaError(e)); }
}
function afterLogin() { setBusy(false); const wait = () => { if (S.user && S.ready) { APP().sound && APP().sound("star"); show("done"); } else if (view !== "carry" || S.user) setTimeout(wait, 100); }; wait(); }
// ゲストの記録を引きつぐか、からっぽの新しいアカウントのときだけ聞く
function askCarry(guest) { return new Promise((res) => { S.carry = res; show("carry", { guest }); }); }

// ---------- マイページのアカウント欄 ----------
function statusLine() {
  const t = S.savedAt ? new Date(S.savedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "";
  if (S.status === "syncing" || S.status === "saving") return '<span class="sy busy">● 同期中…</span>';
  if (S.status === "saved") return '<span class="sy ok">● クラウドに保存ずみ' + (t ? "（" + t + "）" : "") + "</span>";
  if (S.status === "offline") return '<span class="sy off">● オフライン：つながったら自動で保存するよ</span>';
  if (S.status === "error") return '<span class="sy off">● あとでもう一度保存するよ</span>';
  return '<span class="sy">● 準備中</span>';
}
function sectionHtml() {
  if (!ENABLED) return "";
  let h = '<div class="sec">アカウント</div>';
  if (S.user) {
    const ini = (S.user.email || "?").slice(0, 1).toUpperCase();
    h += '<div class="acct-card"><div class="acct-row"><span class="acct-av">' + esc(ini) + '</span><div class="grow"><b class="acct-mail">' + esc(S.user.email) + '</b><small>' + (S.user.provider === "google.com" ? "Google でログイン中" : "メールアドレスでログイン中") + '</small></div></div><div class="acct-sync" id="acct-sync">' + statusLine() + '<small class="acct-note">ほかの端末とも自動で同期するよ</small></div><div class="acct-btns"><button type="button" class="btn" data-acct="logout">ログアウト</button></div><button type="button" class="link-btn acct-del" data-acct="delete">アカウントを削除する</button></div>';
  } else {
    h += '<div class="acct-card guest"><div class="acct-row"><span class="acct-av g">👤</span><div class="grow"><b>ゲストで使っています</b><small>記録はこの端末の中に保存されています</small></div></div><p class="small">ログインすると、記録がアカウントに保存されて、iPhone・iPad など、どの端末でも同じ記録で遊べるよ。</p><button type="button" class="btn primary block" data-acct="login">ログイン・新規登録</button></div>';
  }
  return h;
}
function refreshSection() { const el = document.getElementById("acct-sec"); if (el) el.innerHTML = sectionHtml(); }
async function logout() {
  if (!confirm("ログアウトしますか？\n記録はアカウントに保存されています。この端末からはアカウントの記録が消えて、ログイン画面にもどります。")) return;
  try {
    await push("hidden");
    if (unsaved() && !confirm("まだアカウントに保存できていない記録があります。インターネットにつないでからログアウトすると、その記録も保存されます。\nこのままログアウトしますか？")) return;
    S.paused = true;
    await S.fb.signOut();
  } catch (e) { S.paused = false; APP().toast(jaError(e)); return; }
  await endSession();
  APP().toast("ログアウトしました");
  show("welcome");
}
async function deleteAccount() {
  const sh = APP().openSheet('<h2>アカウントを削除</h2><p>アカウントと、アカウントに保存した記録（⭐・なかま・進みぐあい）がすべて消えます。<b>もとにはもどせません。</b></p><div class="actions"><button type="button" class="btn danger block" id="del-go">削除する</button><button type="button" class="btn block" id="del-no">やめる</button></div>', { label: "アカウントを削除" });
  $("#del-no", sh).addEventListener("click", () => APP().closeSheet());
  $("#del-go", sh).addEventListener("click", async () => { APP().closeSheet(); await doDelete(); });
}
async function doDelete() {
  const uid = S.user && S.user.uid; if (!uid) return;
  S.paused = true; if (S.unsub) { try { S.unsub(); } catch (e) {} S.unsub = null; }
  if (S.inflight) { try { await S.inflight; } catch (e) {} }
  try {
    await S.fb.deleteDoc(uid);
    await S.fb.deleteUser();
  } catch (e) {
    if (/requires-recent-login/.test(e.code || "")) return reauthThenDelete();
    resumeAfterCancel(); APP().toast(jaError(e)); return;
  }
  await endSession();
  APP().toast("アカウントを削除しました");
  show("welcome");
}
// 削除をやめたとき：記録をアカウントにもどして、同期を再開
function resumeAfterCancel() { if (!S.user) return; S.paused = false; S.cloudSig = ""; S.lastHash = ""; push("retry"); listen(); }
function reauthThenDelete() {
  const google = S.user.provider === "google.com"; let okd = false;
  const sh = APP().openSheet('<h2>もう一度ログイン</h2><p class="small">安全のため、削除の前にもう一度ログインしてね。</p>' + (google ? '<button type="button" class="gsi-btn" id="ra-g">' + G_LOGO + "<span>Googleで続ける</span></button>" : '<label class="au-field"><span>パスワード</span><input class="au-in" id="ra-pw" type="password" autocomplete="current-password"></label><div class="au-err" id="ra-err" hidden></div><button type="button" class="btn primary block" id="ra-go">確認して削除</button>') + '<button type="button" class="btn block" id="ra-no" style="margin-top:8px">やめる</button>', { label: "もう一度ログイン", onClose: () => { if (!okd && S.paused) resumeAfterCancel(); } });
  const go = async (fn) => { try { await fn(); okd = true; APP().closeSheet(true); await doDelete(); } catch (e) { const er = $("#ra-err", sh); if (er) { er.hidden = false; er.textContent = jaError(e); } else APP().toast(jaError(e)); } };
  if (google) $("#ra-g", sh).addEventListener("click", () => go(() => S.fb.reauthGoogle()));
  else $("#ra-go", sh).addEventListener("click", () => go(() => S.fb.reauthEmail($("#ra-pw", sh).value)));
  $("#ra-no", sh).addEventListener("click", () => APP().closeSheet());
}

// ---------- クリック ----------
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-au]"), c = e.target.closest("[data-acct]");
  if (a) {
    const k = a.dataset.au;
    if (k === "google") google();
    else if (k === "to-email") { err(""); show("email"); }
    else if (k === "mode-login") show("email", { mode: "login" });
    else if (k === "mode-signup") show("email", { mode: "signup" });
    else if (k === "to-reset") { const em = $("#au-email"); if (em) lastEmail = em.value.trim(); show("reset"); }
    else if (k === "back") show("welcome");
    else if (k === "later") { localStorage.setItem(SEEN_KEY, "1"); hide(); APP().toast("ゲストで使います。マイページからいつでもログインできるよ"); }
    else if (k === "close") { hide(); APP().render(); }
    else if (k === "carry-yes" || k === "carry-no") { const f = S.carry; S.carry = null; if (f) f(k === "carry-yes"); }
    else if (k === "eye") { const i = $("#au-pw"); const on = i.type === "password"; i.type = on ? "text" : "password"; a.innerHTML = on ? EYE_OFF : EYE; a.setAttribute("aria-label", on ? "パスワードをかくす" : "パスワードを表示"); i.focus(); }
    return;
  }
  if (c) {
    const k = c.dataset.acct;
    if (k === "login") show("welcome");
    else if (k === "logout") logout();
    else if (k === "delete") deleteAccount();
  }
});

// ---------- はじめ ----------
window.HMAuthUI = { enabled: ENABLED, sectionHtml, show, hide, state: () => ({ view, mode, busy, user: S.user, status: S.status, ready: S.ready }), jaError };
async function main() {
  if (!ENABLED) return;
  try { S.fb = MOCK ? MOCK : await realAdapter(); }
  catch (e) { console.warn("firebase load", e); window.HMAuthUI.enabled = false; return; }
  let first = true;
  const firstSeen = new Promise((res) => {
    S.fb.onAuth(async (u) => {
      if (u) {
        if (!(S.user && S.user.uid === u.uid)) {
          if (localStorage.getItem(ACTIVE_KEY) === u.uid) resume(u);
          else { if (S.user || localStorage.getItem(ACTIVE_KEY)) await endSession(); newLogin(u); }
        }
      } else if (S.user || localStorage.getItem(ACTIVE_KEY)) {
        // ログインが切れた：この端末からアカウントの記録を消す
        if (!S.paused) { await endSession(); if (!first) show("welcome"); }
      } else if (localStorage.getItem(OWNER_KEY)) {
        // v1.3 でログアウトしたあとに残っていた前のアカウントの記録を消す
        localStorage.removeItem(OWNER_KEY); localStorage.removeItem("hoshimanabi-cloudhash"); localStorage.removeItem(GUEST_KEY); APP().useProfile(GUEST_KEY, null, { home: true });
      }
      refreshSection(); if (APP().tab && APP().tab() === "settings") APP().render();
      if (first) { first = false; res(u); }
    });
  });
  try { if (S.fb.redirectResult) { const r = await S.fb.redirectResult(); if (r && r.user) { localStorage.setItem(SEEN_KEY, "1"); afterLogin(); } } } catch (e) { setTimeout(() => { show("welcome"); err(jaError(e)); }, 900); }
  const u = await firstSeen;
  if (!u && (!localStorage.getItem(SEEN_KEY) || localStorage.getItem("hoshimanabi-show-welcome"))) { localStorage.removeItem("hoshimanabi-show-welcome"); const wait = () => { if (document.getElementById("splash")) setTimeout(wait, 120); else if (!view) show("welcome"); }; wait(); }
}
main();
