// ほしまなび — Firestore ルールのテスト（エミュレーターで実行。管理者だけが全員の記録を読める）
// 実行： NODE_PATH=/workspace/fbtools/node_modules /workspace/fbtools/node_modules/.bin/firebase emulators:exec --only firestore --project demo-hoshi "node tools/test_rules.js"
const fs = require("fs"), path = require("path");
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } = require("firebase/firestore");
const results = [];
const ok = (name, c) => { results.push([name, c]); console.log((c ? "PASS " : "FAIL ") + name); };
async function t(name, p) { try { await p; ok(name, true); } catch (e) { ok(name + " :: " + (e && e.message ? e.message.slice(0, 120) : e), false); } }
(async () => {
  const env = await initializeTestEnvironment({ projectId: "demo-hoshi", firestore: { rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8") } });
  const rec = (n) => ({ data: JSON.stringify({ totalStars: n }), updatedAt: Date.now(), v: 1 });
  const ctx = (uid, email, verified = true) => env.authenticatedContext(uid, email ? { email, email_verified: verified } : {}).firestore();
  const A = ctx("alice", "alice@example.com"), B = ctx("bob", "bob@example.com");
  const ADM = ctx("keiji1", "huishilichuan@gmail.com"), ADM2 = ctx("keiji2", "keijitachikawa4@gmail.com");
  const FAKE = ctx("mallory", "huishilichuan@gmail.com", false), GUEST = env.unauthenticatedContext().firestore();
  // 本人
  await t("本人：自分の記録を作れる", assertSucceeds(setDoc(doc(A, "users/alice"), rec(3))));
  await t("本人：自分の記録を読める", assertSucceeds(getDoc(doc(A, "users/alice"))));
  await t("本人：自分の記録を更新できる", assertSucceeds(setDoc(doc(A, "users/alice"), rec(5))));
  await assertSucceeds(setDoc(doc(B, "users/bob"), rec(1)));
  await t("本人：決まった項目以外は書けない", assertFails(setDoc(doc(A, "users/alice"), Object.assign(rec(5), { admin: true }))));
  // ほかの人
  await t("ほかの人の記録は読めない", assertFails(getDoc(doc(A, "users/bob"))));
  await t("ほかの人の記録に書けない", assertFails(setDoc(doc(A, "users/bob"), rec(99))));
  await t("ほかの人の記録を消せない", assertFails(deleteDoc(doc(A, "users/bob"))));
  await t("一般のユーザーは一覧を読めない", assertFails(getDocs(collection(A, "users"))));
  await t("ログインしていない人は読めない", assertFails(getDoc(doc(GUEST, "users/alice"))));
  await t("ログインしていない人は一覧を読めない", assertFails(getDocs(collection(GUEST, "users"))));
  // 管理者
  await t("管理者（huishilichuan）：全員の一覧を読める", assertSucceeds(getDocs(collection(ADM, "users"))));
  await t("管理者（keijitachikawa4）：全員の一覧を読める", assertSucceeds(getDocs(collection(ADM2, "users"))));
  await t("管理者：ひとりの記録を読める", assertSucceeds(getDoc(doc(ADM, "users/bob"))));
  await t("管理者でも人の記録は書きかえられない", assertFails(setDoc(doc(ADM, "users/bob"), rec(0))));
  await t("管理者でも人の記録は消せない", assertFails(deleteDoc(doc(ADM, "users/bob"))));
  await t("メール未確認の同じアドレスは管理者にならない", assertFails(getDocs(collection(FAKE, "users"))));
  await t("ほかのコレクションは読めない", assertFails(getDoc(doc(ADM, "admin/x"))));
  const n = (await getDocs(collection(ADM, "users"))).size;
  ok("管理者の一覧に2人分の記録 :: " + n, n === 2);
  // 友だち招待（v1.6.4）
  const C = ctx("carol", "carol@example.com"), D = ctx("dave", "dave@example.com");
  await t("招待：自分のコードを作れる", assertSucceeds(setDoc(doc(A, "invites/ABC234"), { uid: "alice", t: 1 })));
  await t("招待：人の uid でコードは作れない", assertFails(setDoc(doc(B, "invites/XYZ234"), { uid: "alice", t: 1 })));
  await t("招待：形のちがうコードは作れない", assertFails(setDoc(doc(B, "invites/abc"), { uid: "bob", t: 1 })));
  await t("招待：人のコードを上書きできない", assertFails(setDoc(doc(B, "invites/ABC234"), { uid: "bob", t: 1 })));
  await t("招待：ログインした人はコードを1件読める", assertSucceeds(getDoc(doc(B, "invites/ABC234"))));
  await t("招待：コードの一覧は読めない", assertFails(getDocs(collection(B, "invites"))));
  await t("招待：ログインしていない人は読めない", assertFails(getDoc(doc(GUEST, "invites/ABC234"))));
  await t("招待：自分のコードは使えない", assertFails(setDoc(doc(A, "redeems/alice"), { code: "ABC234", inviter: "alice", t: 1 })));
  await t("招待：招待した人をいつわれない", assertFails(setDoc(doc(B, "redeems/bob"), { code: "ABC234", inviter: "carol", t: 1 })));
  await t("招待：ないコードは使えない", assertFails(setDoc(doc(B, "redeems/bob"), { code: "QQQ234", inviter: "alice", t: 1 })));
  await t("招待：友だちのコードを使える", assertSucceeds(setDoc(doc(B, "redeems/bob"), { code: "ABC234", inviter: "alice", t: 1 })));
  await t("招待：2回目は使えない（1人1回）", assertFails(setDoc(doc(B, "redeems/bob"), { code: "ABC234", inviter: "alice", t: 2 })));
  await t("招待：使った記録は消せない", assertFails(deleteDoc(doc(B, "redeems/bob"))));
  await t("招待：人の代わりには使えない", assertFails(setDoc(doc(C, "redeems/dave"), { code: "ABC234", inviter: "alice", t: 1 })));
  await t("招待：招待した人は自分あての記録を読める", assertSucceeds(getDocs(query(collection(A, "redeems"), where("inviter", "==", "alice")))));
  await t("招待：ほかの人あての記録は読めない", assertFails(getDocs(query(collection(C, "redeems"), where("inviter", "==", "alice")))));
  await t("招待：使った本人は自分の記録を読める", assertSucceeds(getDoc(doc(B, "redeems/bob"))));
  await t("招待：関係ない人は読めない", assertFails(getDoc(doc(C, "redeems/bob"))));
  await t("招待：自分のコードを消せる", assertSucceeds(deleteDoc(doc(A, "invites/ABC234"))));
  await t("本人：自分の記録を消せる", assertSucceeds(deleteDoc(doc(A, "users/alice"))));
  await env.cleanup();
  const f = results.filter((r) => !r[1]);
  console.log(`\n${results.length - f.length}/${results.length} passed`);
  process.exit(f.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
