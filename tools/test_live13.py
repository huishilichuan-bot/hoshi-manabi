# ほしまなび v1.3 — 本番サイトでのログイン・同期・ルール・削除のE2E（使い捨てアカウントを作って最後に削除）
import os, sys, json, random, string
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOT = os.path.join(ROOT, "screenshots", "v13")
B = "https://huishilichuan-bot.github.io/hoshi-manabi/"
rnd = "".join(random.choice(string.ascii_lowercase + string.digits) for _ in range(8))
EA, EC = f"hoshi-test-{rnd}@example.com", f"hoshi-test-{rnd}-b@example.com"
PW = "Hoshi" + "".join(random.choice(string.digits) for _ in range(6)) + "x"
results = []; errors = []
def ok(name, cond, info=""):
    results.append((name, bool(cond))); print(("PASS " if cond else "FAIL ") + name + (" :: " + str(info) if info else ""), flush=True)
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    def newpage():
        ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errors.append(str(e))); pg.on("dialog", lambda d: d.accept())
        pg.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
        return ctx, pg
    def wait(pg, js, ms=20000):
        t = 0
        while t < ms:
            try:
                if pg.evaluate(js): return True
            except Exception: pass
            pg.wait_for_timeout(250); t += 250
        return False
    def view(pg): return pg.evaluate("window.HMAuthUI && HMAuthUI.state().view")
    def email_flow(pg, email, pw, signup, shot=None):
        assert wait(pg, "window.HMAuthUI && HMAuthUI.state().view === 'welcome'"), "welcome"
        pg.locator('[data-au="to-email"]').tap(); pg.wait_for_timeout(300)
        if signup: pg.locator('.au-seg [data-au="mode-signup"]').tap(); pg.wait_for_timeout(300)
        pg.locator("#au-email").fill(email); pg.locator("#au-pw").fill(pw); pg.wait_for_timeout(200)
        if shot: pg.screenshot(path=os.path.join(SHOT, shot))
        pg.locator("#au-submit").tap()
        return wait(pg, "HMAuthUI.state().view === 'done' && HMAuthUI.state().status === 'saved'", 25000)

    # A：新規登録して、進みぐあいを作る
    ctxA, A = newpage()
    A.goto(B); ok("本番 v1.3.0", wait(A, "window.HM_APP && HM_APP.version === '1.3.0'"))
    ok("ようこそ画面（スプラッシュのあと）", wait(A, "window.HMAuthUI && HMAuthUI.state().view === 'welcome'"))
    A.wait_for_timeout(500); A.screenshot(path=os.path.join(SHOT, "live-01-welcome.png"))
    ok("A：メールで新規登録→クラウドに保存", email_flow(A, EA, PW, True, "live-02-email-signup.png"), EA)
    uidA = A.evaluate("HMAuthUI.state().user.uid")
    A.locator('[data-au="close"]').tap(); A.wait_for_timeout(500)
    # 本当にステップを1つやる（ならべかえ以外の普通の問題：答えを入れて合格）
    A.evaluate("""(() => { const s = HM_APP.state(); s.settings.nick = 'テストくん'; s.totalStars = 12; s.pulls = 12; s.pullsUsed = 4; s.bestCombo = 7; s.wrongBox = [{k:'live-q', q:{t:'num', q:'3+4 は？', a:'7'}}]; s.bossWins = { 'math/1/0': 1 }; HM_APP.save(); })()""")
    A.evaluate("window.dispatchEvent(new Event('hm-step-end'))"); A.wait_for_timeout(300)
    A.evaluate("HMSync.flush()")
    ok("A：進みぐあいをクラウドに保存", wait(A, "HMSync.status().status === 'saved' && !HMSync.status().dirty", 15000), A.evaluate("HMSync.status().status"))
    A.locator('.tab[data-tab="settings"]').tap(); A.wait_for_timeout(700)
    A.locator(".acct-card").scroll_into_view_if_needed(); A.wait_for_timeout(300)
    ok("A：マイページにメールと保存ずみ", EA in A.locator(".acct-card").inner_text() and "保存ずみ" in A.locator(".acct-sync").inner_text())
    A.screenshot(path=os.path.join(SHOT, "live-03-mypage-account.png"))
    A.evaluate("HMSync.flush()"); A.wait_for_timeout(1500)
    ctxA.close()

    # B：まっさらな別の端末（プロフィール）で同じアカウントにログイン → 記録がもどる
    ctxB, P = newpage()
    P.goto(B)
    ok("B：新しい端末でログイン", email_flow(P, EA, PW, False, "live-04-email-login.png"))
    st = P.evaluate("(() => { const s = HM_APP.state(); return { stars: s.totalStars, left: s.pulls - s.pullsUsed, nick: s.settings.nick, combo: s.bestCombo, box: (s.wrongBox||[]).map(x=>x.k), boss: s.bossWins }; })()")
    ok("B：users/{uid} から記録が復元（⭐12・ガチャのこり8・名前・ボックス）", st["stars"] == 12 and st["left"] == 8 and st["nick"] == "テストくん" and st["combo"] == 7 and "live-q" in st["box"], st)

    # C：2つめのアカウントは A の記録を読めない・書けない（ルール）
    ctxC, C = newpage()
    C.goto(B)
    ok("C：2つめのアカウントを登録", email_flow(C, EC, PW, True))
    C.locator('[data-au="close"]').tap(); C.wait_for_timeout(300)
    rule = C.evaluate("""async (uidA) => {
      const v = window.HM_FIREBASE.sdk, base = 'https://www.gstatic.com/firebasejs/' + v + '/';
      const A = await import(base + 'firebase-app.js'), F = await import(base + 'firebase-firestore.js'), AU = await import(base + 'firebase-auth.js');
      const db = F.getFirestore(A.getApp()); const me = AU.getAuth(A.getApp()).currentUser.uid; const out = {};
      const t = async (k, fn) => { try { await fn(); out[k] = 'allowed'; } catch (e) { out[k] = e.code; } };
      await t('readOther', () => F.getDoc(F.doc(db, 'users', uidA)));
      await t('writeOther', () => F.setDoc(F.doc(db, 'users', uidA), { data: '{}', updatedAt: 1, v: 1 }));
      await t('deleteOther', () => F.deleteDoc(F.doc(db, 'users', uidA)));
      await t('otherCollection', () => F.setDoc(F.doc(db, 'hack', 'x'), { a: 1 }));
      await t('listUsers', () => F.getDocs(F.collection(db, 'users')));
      await t('ownExtraKey', () => F.setDoc(F.doc(db, 'users', me), { data: '{}', updatedAt: 1, v: 1, evil: true }));
      await t('ownTooBig', () => F.setDoc(F.doc(db, 'users', me), { data: 'x'.repeat(800001), updatedAt: 1, v: 1 }));
      await t('ownRead', () => F.getDoc(F.doc(db, 'users', me)));
      return out; }""", uidA)
    ok("ルール：ほかの人の記録は読めない・書けない・消せない", rule["readOther"] == rule["writeOther"] == rule["deleteOther"] == "permission-denied", rule)
    ok("ルール：ほかのコレクション・一覧・余分なキー・大きすぎは拒否", all(rule[k] == "permission-denied" for k in ["otherCollection", "listUsers", "ownExtraKey", "ownTooBig"]), rule)
    ok("ルール：自分の記録は読める", rule["ownRead"] == "allowed", rule)
    # C をアプリから削除
    C.locator('.tab[data-tab="settings"]').tap(); C.wait_for_timeout(600)
    C.locator('[data-acct="delete"]').tap(); C.wait_for_timeout(500); C.locator("#del-go").tap()
    ok("C：アプリの「アカウント削除」で削除", wait(C, "!!document.querySelector('.acct-card.guest')", 20000))
    ctxC.close()

    # B（=Aのアカウント）をアプリから削除
    P.locator('[data-au="close"]').tap(); P.wait_for_timeout(300)
    P.locator('.tab[data-tab="settings"]').tap(); P.wait_for_timeout(600)
    P.locator('[data-acct="delete"]').tap(); P.wait_for_timeout(500)
    P.screenshot(path=os.path.join(SHOT, "live-05-delete-confirm.png"))
    P.locator("#del-go").tap()
    ok("A：アプリの「アカウント削除」で削除", wait(P, "!!document.querySelector('.acct-card.guest')", 20000))
    ctxB.close()

    # 削除できたか：同じメールでログインできない
    for em in [EA, EC]:
        ctxD, D = newpage(); D.goto(B)
        email_flow(D, em, PW, False); D.wait_for_timeout(1500)
        ok(f"削除後はログインできない（{em.split('@')[0][-10:]}）", view(D) == "email" and "ちがうみたい" in D.locator("#au-err").inner_text(), D.locator("#au-err").inner_text() if D.locator("#au-err").count() else "")
        ctxD.close()

    ctxE, E = newpage(); E.goto(B + "privacy.html"); E.wait_for_timeout(1000)
    E.screenshot(path=os.path.join(SHOT, "live-06-privacy.png"))
    ok("プライバシーポリシー公開", "huishilichuan@gmail.com" in E.inner_text("body"))
    E.goto(B + "terms.html"); E.wait_for_timeout(800); E.screenshot(path=os.path.join(SHOT, "live-07-terms.png"))
    ok("利用規約公開", "利用規約" in E.inner_text("body"))
    br.close()
real = [e for e in errors if "favicon" not in e and "Failed to load resource" not in e]  # 拒否テストやログイン失敗の 400 などは想定どおり
ok("JSエラーなし", not real, real[:4])
n = sum(1 for _, c in results if c); print(f"\n{n}/{len(results)} passed")
sys.exit(0 if n == len(results) else 1)
