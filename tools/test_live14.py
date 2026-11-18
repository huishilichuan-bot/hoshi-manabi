# ほしまなび v1.4 — 本番で「2台の端末」（別々のブラウザ）をまねた E2E。使い捨てアカウントを作り、最後に削除する
import os, sys, json, random, string, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOT = os.path.join(ROOT, "screenshots", "v14"); os.makedirs(SHOT, exist_ok=True)
B = "https://huishilichuan-bot.github.io/hoshi-manabi/"
rnd = "".join(random.choice(string.ascii_lowercase + string.digits) for _ in range(8))
EA, EB = f"hoshi-test-{rnd}-a@example.com", f"hoshi-test-{rnd}-b@example.com"
PW = "Hoshi" + "".join(random.choice(string.digits) for _ in range(6)) + "x"
results = []; errors = []
open("/tmp/live14_accounts.txt", "a").write(EA + " " + EB + " " + PW + "\n")
def ok(name, cond, info=""):
    results.append((name, bool(cond))); print(("PASS " if cond else "FAIL ") + name + (" :: " + str(info) if info else ""), flush=True)
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    def device(label):
        ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errors.append(label + ": " + str(e))); pg.on("dialog", lambda d: d.accept())
        pg.on("console", lambda m: errors.append(label + " console: " + m.text) if m.type == "error" else None)
        pg.goto(B); return ctx, pg
    def wait(pg, js, ms=25000):
        t = 0
        while t < ms:
            try:
                if pg.evaluate(js): return True
            except Exception: pass
            pg.wait_for_timeout(250); t += 250
        return False
    V = lambda pg: pg.evaluate("window.HMAuthUI && HMAuthUI.state().view")
    def email(pg, em, signup, shot=None):
        assert wait(pg, "window.HMAuthUI && HMAuthUI.state().view === 'welcome'"), "welcome"
        pg.locator('[data-au="to-email"]').tap(); pg.wait_for_timeout(300)
        pg.locator('.au-seg [data-au="mode-%s"]' % ("signup" if signup else "login")).tap(); pg.wait_for_timeout(300)
        pg.locator("#au-email").fill(em); pg.locator("#au-pw").fill(PW)
        if shot: pg.screenshot(path=os.path.join(SHOT, shot))
        pg.locator("#au-submit").tap()
        wait(pg, "['carry','done'].includes(HMAuthUI.state().view)", 25000)
        if V(pg) == "email": print("   email-view err:", pg.locator("#au-err").inner_text() if pg.locator("#au-err").count() else "", pg.evaluate("JSON.stringify(HMAuthUI.state())")[:200])
        return V(pg)
    def finish(pg):
        ok_ = wait(pg, "HMAuthUI.state().view === 'done' && HMAuthUI.state().ready", 25000)
        pg.locator('[data-au="close"]').tap(); pg.wait_for_timeout(400); return ok_
    st = lambda pg: pg.evaluate("(() => { const s = HM_APP.state(); return { stars: s.totalStars, nick: s.settings.nick, chars: Object.keys(s.chars).sort(), key: HM_APP.profileKey(), uid: HMAuthUI.state().user && HMAuthUI.state().user.uid }; })()")
    def logout(pg):
        pg.locator('.tab[data-tab="settings"]').tap(); pg.wait_for_timeout(600)
        pg.locator('[data-acct="logout"]').tap(); return wait(pg, "HMAuthUI.state().view === 'welcome' && !HMAuthUI.state().user", 15000)
    fbUser = "() => new Promise((res) => { const r = indexedDB.open('firebaseLocalStorageDb'); r.onerror = () => res(-1); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains('firebaseLocalStorage')) return res(0); const q = db.transaction('firebaseLocalStorage').objectStore('firebaseLocalStorage').getAll(); q.onsuccess = () => res(q.result.filter((x) => String(x.fbase_key).includes('authUser')).length); }; })"

    # 端末1：ゲストで遊んでから、新しいアカウントA を作る → 引きつぎを聞かれる
    c1, D1 = device("D1")
    ok("本番 v1.4.1", wait(D1, "window.HM_APP && HM_APP.version === '1.4.1'"))
    wait(D1, "HMAuthUI.state().view === 'welcome'"); D1.locator('[data-au="later"]').tap(); D1.wait_for_timeout(500)
    D1.evaluate("(() => { const s = HM_APP.state(); s.totalStars = 6; s.pulls = 6; s.chars.guestchar = { n: 1, t: 1 }; s.settings.nick = 'ゲストくん'; HM_APP.save(); })()")
    D1.locator('.tab[data-tab="settings"]').tap(); D1.wait_for_timeout(500); D1.locator('[data-acct="login"]').tap()
    v = email(D1, EA, True, "live-01-email-signup.png")
    ok("新しいアカウント＋ゲストの記録 → 引きつぎを聞く", v == "carry", v)
    D1.screenshot(path=os.path.join(SHOT, "live-02-carry.png"))
    D1.locator('[data-au="carry-yes"]').tap()
    ok("A：登録して引きついだ", finish(D1) and st(D1)["stars"] == 6 and "guestchar" in st(D1)["chars"], st(D1))
    uidA = st(D1)["uid"]
    # ログアウト → 端末から消える
    ok("A：ログアウトでログイン画面", logout(D1))
    D1.screenshot(path=os.path.join(SHOT, "live-03-after-logout.png"))
    keys = D1.evaluate("Object.keys(localStorage)")
    s1 = st(D1)
    ok("ログアウト：端末にアカウントの記録なし（localStorage）", not any(k.startswith("hoshimanabi:u:") or k.startswith("hoshimanabi-sync:") or k == "hoshimanabi-active" for k in keys) and s1["stars"] == 0 and s1["key"] == "hoshimanabi" and "guestchar" not in s1["chars"], [keys, s1])
    ok("ログアウト：ログイン状態も消える（IndexedDB）", D1.evaluate(fbUser) == 0)
    # 別のアカウントB → A の記録は見えない
    v = email(D1, EB, True)
    ok("B：ゲストがからっぽなら引きつぎは聞かない", v == "done", v)
    finish(D1); sB = st(D1); uidB = sB["uid"]
    ok("B：A の記録が混ざらない", sB["stars"] == 0 and "guestchar" not in sB["chars"] and sB["nick"] == "", sB)
    D1.evaluate("(() => { const s = HM_APP.state(); s.totalStars = 3; s.settings.nick = 'Bくん'; HM_APP.save(); })()"); D1.evaluate("HMSync.flush()")
    ok("B：保存", wait(D1, "HMSync.status().status === 'saved' && !HMSync.status().dirty", 15000))
    ok("B：ログアウト", logout(D1))
    # もう一度 A → A の記録だけ（引きつぎは聞かない）
    v = email(D1, EA, False, "live-04-email-login.png")
    ok("A：記録のあるアカウントは引きつぎを聞かない", v == "done", v)
    finish(D1); s1 = st(D1)
    ok("A：A の記録だけ（B の⭐3・名前は混ざらない）", s1["stars"] == 6 and s1["nick"] == "ゲストくん" and "guestchar" in s1["chars"], s1)

    # 端末2：同じアカウントA に同時ログイン
    c2, D2 = device("D2")
    v = email(D2, EA, False); finish(D2); s2 = st(D2)
    ok("端末2：同じ A の記録（⭐6・なかま）", s2["stars"] == 6 and "guestchar" in s2["chars"], s2)
    ok("両方ログインしたまま", st(D1)["uid"] == uidA and st(D2)["uid"] == uidA)
    # 端末1 → 端末2 に自動で反映
    D1.evaluate("(() => { const s = HM_APP.state(); s.totalStars += 1; s.chars.d1char = { n: 1, t: 5 }; s.settings.nick = 'iPhoneくん'; HM_APP.save(); })()"); D1.evaluate("HMSync.flush()")
    ok("端末1 の変更が 端末2 に自動で反映（onSnapshot）", wait(D2, "!!HM_APP.state().chars.d1char && HM_APP.state().settings.nick === 'iPhoneくん'", 20000), st(D2))
    D2.evaluate("(() => { const s = HM_APP.state(); s.chars.d2char = { n: 1, t: 6 }; HM_APP.save(); })()"); D2.evaluate("HMSync.flush()")
    ok("端末2 の変更が 端末1 に自動で反映", wait(D1, "!!HM_APP.state().chars.d2char", 20000), st(D1))
    # 同時に遊ぶ：おたがいを見る前に両方で変えて、ほぼ同時に保存
    D1.evaluate("(() => { const s = HM_APP.state(); s.totalStars += 2; s.chars.both1 = { n: 1, t: 7 }; s.days['2026-11-17'] = Object.assign({ stars: 0, steps: {} }, s.days['2026-11-17']); s.days['2026-11-17'].steps['x/1'] = true; HM_APP.save(); })()")
    D2.evaluate("(() => { const s = HM_APP.state(); s.totalStars += 1; s.chars.both2 = { n: 1, t: 8 }; s.days['2026-11-17'] = Object.assign({ stars: 0, steps: {} }, s.days['2026-11-17']); s.days['2026-11-17'].steps['y/1'] = true; HM_APP.save(); })()")
    hi = max(st(D1)["stars"], st(D2)["stars"])
    D1.evaluate("HMSync.flush()"); D2.evaluate("HMSync.flush()")
    conv = "(() => { const s = HM_APP.state(); return !!(s.chars.both1 && s.chars.both2) && !HMSync.status().dirty && HMSync.status().status === 'saved'; })()"
    ok("同時に保存しても両方のなかまが残る（端末1）", wait(D1, conv, 30000), st(D1))
    ok("同時に保存しても両方のなかまが残る（端末2）", wait(D2, conv, 30000), st(D2))
    D1.wait_for_timeout(2500)
    a, b = st(D1), st(D2)
    ok("2台が同じ記録にそろう・⭐はへらない", a["stars"] == b["stars"] and a["stars"] >= hi and a["chars"] == b["chars"] and all(c in a["chars"] for c in ["guestchar", "d1char", "d2char", "both1", "both2"]), [a, b, hi])
    # ルール：A は B の記録を読めない
    rule = D2.evaluate("""async (uidB) => { const base = 'https://www.gstatic.com/firebasejs/' + window.HM_FIREBASE.sdk + '/'; const A = await import(base + 'firebase-app.js'), F = await import(base + 'firebase-firestore.js'); try { await F.getDoc(F.doc(F.getFirestore(A.getApp()), 'users', uidB)); return 'allowed'; } catch (e) { return e.code; } }""", uidB)
    ok("ルール：ほかのアカウントの記録は読めない", rule == "permission-denied", rule)
    # 端末2 でログアウトしても、端末1 はログインしたまま
    D2.locator('.tab[data-tab="settings"]').tap(); D2.wait_for_timeout(400)
    D2.locator(".acct-card").scroll_into_view_if_needed(); D2.screenshot(path=os.path.join(SHOT, "live-05-mypage-account.png"))
    ok("端末2：ログアウト", logout(D2))
    D1.wait_for_timeout(3000)
    D1.evaluate("(() => { const s = HM_APP.state(); s.chars.after = { n: 1, t: 9 }; HM_APP.save(); })()"); D1.evaluate("HMSync.flush()")
    ok("端末1 はログインしたままで保存もできる", st(D1)["uid"] == uidA and wait(D1, "HMSync.status().status === 'saved' && !HMSync.status().dirty", 15000))
    # Google：ポップアップが開く → とじたらエラーを出さずにもどる
    wait(D2, "HMAuthUI.state().view === 'welcome'")
    try:
        with D2.expect_popup(timeout=10000) as pi: D2.locator('[data-au="google"]').tap()
        pop = pi.value; pop.wait_for_load_state(timeout=15000); purl = pop.url
        ok("Google：ポップアップでGoogleのログイン画面がひらく", "accounts.google.com" in purl or "firebaseapp.com/__/auth" in purl, purl[:80])
        pop.close()
        ok("Google：ポップアップをとじたらエラーなしで元にもどる", wait(D2, "!document.querySelector('[data-au=\"google\"]').disabled && document.querySelector('#au-err').hidden", 15000))
    except Exception as e:
        ok("Google：ポップアップ", False, str(e)[:120])
    D2.screenshot(path=os.path.join(SHOT, "live-06-welcome.png"))
    c2.close()
    # 後かたづけ：A と B をアプリの「アカウント削除」で削除
    D1.locator('.tab[data-tab="settings"]').tap(); D1.wait_for_timeout(500)
    D1.locator('[data-acct="delete"]').tap(); D1.wait_for_timeout(500); D1.locator("#del-go").tap()
    ok("A：アカウント削除 → ログイン画面・端末に何も残らない", wait(D1, "HMAuthUI.state().view === 'welcome' && !HMAuthUI.state().user", 20000) and not any(k.startswith("hoshimanabi:u:") for k in D1.evaluate("Object.keys(localStorage)")))
    email(D1, EB, False); finish(D1)
    D1.locator('.tab[data-tab="settings"]').tap(); D1.wait_for_timeout(500)
    D1.locator('[data-acct="delete"]').tap(); D1.wait_for_timeout(500); D1.locator("#del-go").tap()
    ok("B：アカウント削除", wait(D1, "HMAuthUI.state().view === 'welcome' && !HMAuthUI.state().user", 20000))
    for em in [EA, EB]:
        email(D1, em, False); D1.wait_for_timeout(1500)
        ok(f"削除後はログインできない（{em[-16:]}）", V(D1) == "email" and "ちがうみたい" in D1.locator("#au-err").inner_text())
        D1.locator('[data-au="back"]').tap(); D1.wait_for_timeout(300)
    c1.close(); br.close()
real = [e for e in errors if "favicon" not in e and "Failed to load resource" not in e and "Cross-Origin-Opener-Policy" not in e]
ok("JSエラーなし", not real, real[:4])
n = sum(1 for _, c in results if c); print(f"\n{n}/{len(results)} passed")
sys.exit(0 if n == len(results) else 1)
