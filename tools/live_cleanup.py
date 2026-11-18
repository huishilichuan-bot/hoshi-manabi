# 本番テストで作ったアカウントを消す（/tmp/live14_accounts.txt の行：メールA メールB パスワード）
import sys
from playwright.sync_api import sync_playwright
B = "https://huishilichuan-bot.github.io/hoshi-manabi/"
lines = [l.split() for l in open("/tmp/live14_accounts.txt") if l.strip()]
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    for ea, eb, pw in lines:
        for em in (ea, eb):
            pg = br.new_context().new_page(); pg.goto(B); pg.wait_for_timeout(4000)
            r = pg.evaluate("""async ([em, pw]) => { const base = 'https://www.gstatic.com/firebasejs/' + window.HM_FIREBASE.sdk + '/'; const A = await import(base + 'firebase-app.js'), AU = await import(base + 'firebase-auth.js'), F = await import(base + 'firebase-firestore.js');
              const app = A.getApp(), auth = AU.getAuth(app);
              try { const c = await AU.signInWithEmailAndPassword(auth, em, pw); await F.deleteDoc(F.doc(F.getFirestore(app), 'users', c.user.uid)); await AU.deleteUser(c.user); return 'deleted'; } catch (e) { return e.code; } }""", [em, pw])
            print(em, r); pg.context.close()
    br.close()
