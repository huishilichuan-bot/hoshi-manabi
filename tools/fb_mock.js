/* テスト用：Firebase のにせもの（ネットにつながずに、ログイン画面と同期の流れをためす） */
(function () {
  const db = JSON.parse(sessionStorage.getItem("mockdb") || '{"users":{},"docs":{},"cur":null}');
  const persist = () => sessionStorage.setItem("mockdb", JSON.stringify(db));
  const err = (code) => { const e = new Error(code); e.code = code; return e; };
  let cb = null;
  const M = {
    calls: [], failNext: null, writes: 0, recentLogin: true, delay: 250,
    db,
    _wait() { return new Promise((r) => setTimeout(r, M.delay)); },
    async _maybeFail() { await M._wait(); if (M.failNext) { const c = M.failNext; M.failNext = null; throw err(c); } },
    _set(u) { db.cur = u ? u.uid : null; persist(); if (cb) cb(u); },
    onAuth(f) { cb = f; setTimeout(() => f(db.cur ? db.users[db.cur] : null), 30); return () => {}; },
    async google() { M.calls.push("google"); await M._maybeFail(); const uid = "g-kid"; db.users[uid] = { uid, email: "kid@gmail.com", provider: "google.com" }; M._set(db.users[uid]); return { user: db.users[uid] }; },
    async redirectResult() { return null; },
    async emailUp(e, p) { M.calls.push("up:" + e); await M._maybeFail(); if (Object.values(db.users).some((u) => u.email === e)) throw err("auth/email-already-in-use"); if (p.length < 6) throw err("auth/weak-password"); const uid = "u" + Object.keys(db.users).length; db.users[uid] = { uid, email: e, provider: "password", pw: p }; M._set(db.users[uid]); return { user: db.users[uid] }; },
    async emailIn(e, p) { M.calls.push("in:" + e); await M._maybeFail(); const u = Object.values(db.users).find((x) => x.email === e); if (!u || u.pw !== p) throw err("auth/invalid-credential"); M._set(u); return { user: u }; },
    async reset(e) { M.calls.push("reset:" + e); await M._maybeFail(); },
    async signOut() { M.calls.push("out"); M._set(null); },
    async getDoc(uid) { await M._maybeFail(); M.reads++; return db.docs[uid] ? JSON.parse(JSON.stringify(db.docs[uid])) : null; },
    async setDoc(uid, d) { await M._maybeFail(); M.writes++; db.docs[uid] = d; persist(); M._notify(uid); },
    listeners: {}, reads: 0,
    _notify(uid) { const l = M.listeners[uid]; if (l) setTimeout(() => l(db.docs[uid] ? JSON.parse(JSON.stringify(db.docs[uid])) : null, false), 20); },
    listen(uid, cb) { M.calls.push("listen"); M.listeners[uid] = cb; M._notify(uid); return () => { if (M.listeners[uid] === cb) delete M.listeners[uid]; M.calls.push("unlisten"); }; },
    async mergeWrite(uid, fn) { await M._maybeFail(); M.reads++; const out = fn(db.docs[uid] ? JSON.parse(JSON.stringify(db.docs[uid])) : null); M.writes++; db.docs[uid] = out.doc; persist(); M._notify(uid); return out; },
    // ほかの端末が書いたことにする
    remoteEdit(uid, f) { const d = JSON.parse(db.docs[uid].data); f(d); db.docs[uid] = { data: JSON.stringify(d), updatedAt: Date.now(), v: 1 }; persist(); M._notify(uid); },
    async userAlive() { return !!db.users[db.cur]; },
    async deleteDoc(uid) { M.calls.push("deldoc"); await M._maybeFail(); delete db.docs[uid]; persist(); M._notify(uid); },
    async deleteUser() { M.calls.push("deluser"); await M._maybeFail(); if (!M.recentLogin) throw err("auth/requires-recent-login"); delete db.users[db.cur]; M._set(null); },
    async reauthGoogle() { M.calls.push("reauthG"); M.recentLogin = true; },
    async reauthEmail(pw) { M.calls.push("reauthE"); await M._wait(); if (db.users[db.cur].pw !== pw) throw err("auth/wrong-password"); M.recentLogin = true; },
  };
  window.__HM_FB_MOCK = M;
})();
