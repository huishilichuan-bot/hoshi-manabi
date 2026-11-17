# ほしまなび v1.3 — ログイン画面とクラウド同期のテスト（Firebase はにせもの tools/fb_mock.js を使う。ネットにはつながない）
import subprocess, sys, time, os, json
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOT = os.path.join(ROOT, "screenshots", "v13"); os.makedirs(SHOT, exist_ok=True)
PORT = 8774
MOCK = open(os.path.join(ROOT, "tools", "fb_mock.js"), encoding="utf-8").read()
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
results = []; errors = []
def ok(name, cond, info=""):
    results.append((name, bool(cond))); print(("PASS " if cond else "FAIL ") + name + (" :: " + str(info) if info else ""))
URL = f"http://localhost:{PORT}/index.html"
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.add_init_script(MOCK)
    # 本物の Firebase へ行く通信がないことを確かめる
    net = []
    ctx.on("request", lambda r: net.append(r.url) if (not r.url.startswith("http://localhost") and ("googleapis" in r.url or "gstatic" in r.url or "firebase" in r.url)) else None)
    pg = ctx.new_page(); pg.clock.install()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    pg.on("dialog", lambda d: d.accept())
    E = pg.evaluate
    def shot(n): pg.wait_for_timeout(350); pg.screenshot(path=os.path.join(SHOT, n + ".png"))
    def view(): return E("HMAuthUI.state().view")
    def tap(sel): pg.locator(sel).first.tap(); pg.wait_for_timeout(120)
    def wait_view(v, ms=4000):
        t = 0
        while t < ms and view() != v: pg.wait_for_timeout(100); t += 100
        return view() == v

    # 1) はじめて開くと、スプラッシュのあとにログイン画面
    pg.goto(URL)
    ok("スプラッシュ中はログイン画面を出さない", pg.locator("#splash").count() == 1 and not pg.locator("#auth-layer:not([hidden])").count())
    ok("スプラッシュのあとにようこそ画面", wait_view("welcome"))
    shot("01-welcome")
    g = pg.locator(".gsi-btn")
    ok("Googleで続けるボタン（公式Gロゴ4色）", g.inner_text().strip() == "Googleで続ける" and E("[...document.querySelectorAll('.gsi-btn .g-logo path')].map(p=>p.getAttribute('fill')).join()") == "#EA4335,#4285F4,#FBBC05,#34A853,none")
    st = E("(() => { const s = getComputedStyle(document.querySelector('.gsi-btn')); return [s.backgroundColor, s.color, s.borderTopColor]; })()")
    ok("Googleボタンの色（白地・#1F1F1F・#747775）", st == ["rgb(255, 255, 255)", "rgb(31, 31, 31)", "rgb(116, 119, 117)"], st)
    ok("メールアドレスで続ける／あとで がある", pg.locator('[data-au="to-email"]').inner_text().strip() == "✉️メールアドレスで続ける".replace("✉️", "✉️") or "メールアドレスで続ける" in pg.locator('[data-au="to-email"]').inner_text())
    ok("あとで（ゲスト）ボタン", "あとで" in pg.locator('[data-au="later"]').inner_text())
    ok("規約・プライバシーへのリンク", pg.locator('.au-legal a[href="./terms.html"]').count() == 1 and pg.locator('.au-legal a[href="./privacy.html"]').count() == 1)
    ok("パートナーが動いている", E("getComputedStyle(document.querySelector('.au-hero .char')).animationName") == "auBob")
    ok("横にはみ出さない", E("document.documentElement.scrollWidth <= innerWidth"))

    # 2) あとで → ゲスト。もう一度開いても出ない
    tap('[data-au="later"]'); pg.wait_for_timeout(400)
    ok("あとで で閉じる", view() is None and E("localStorage.getItem('hoshimanabi-auth-seen')") == "1")
    pg.reload(); pg.wait_for_timeout(2200)
    ok("2回目は出ない（ゲストのまま使える）", not pg.locator("#auth-layer:not([hidden])").count() and pg.locator(".tabbar").count() == 1)
    # マイページのゲスト欄から開ける
    tap('.tab[data-tab="settings"]'); pg.wait_for_timeout(500)
    ok("マイページにゲスト欄", pg.locator(".acct-card.guest").count() == 1)
    pg.locator(".acct-card").scroll_into_view_if_needed(); shot("02-mypage-guest")
    ok("マイページに規約・プライバシーのリンク", pg.locator('.legal-links a[href="./privacy.html"]').count() == 1 and pg.locator('.legal-links a[href="./terms.html"]').count() == 1)
    tap('[data-acct="login"]'); ok("マイページからログイン画面", wait_view("welcome"))

    # 3) メール：新規登録
    tap('[data-au="to-email"]')
    ok("メール画面（ログインタブ）", view() == "email" and pg.locator('.au-seg button.on').inner_text() == "ログイン")
    shot("03-email-login")
    tap('[data-au="mode-signup"]')
    ok("新規登録タブに切りかえ", E("HMAuthUI.state().mode") == "signup" and pg.locator('.au-seg button.on').inner_text() == "新規登録" and pg.locator("#au-pw").get_attribute("autocomplete") == "new-password")
    pg.locator("#au-email").fill("abc"); pg.locator("#au-pw").fill("12345678"); tap("#au-submit")
    ok("メールの形のエラー（やさしい日本語）", "メールアドレスの形" in pg.locator("#au-err").inner_text())
    pg.locator("#au-email").fill("kid@example.com"); pg.locator("#au-pw").fill("abc12"); tap("#au-submit")
    ok("8文字未満のエラー", "8文字以上" in pg.locator("#au-err").inner_text() and E("__HM_FB_MOCK.calls.length") == 0)
    ok("ルール表示：未達", pg.locator("#r-len.ok").count() == 0)
    pg.locator("#au-pw").fill("hoshi2026")
    ok("ルール表示：8文字以上・英数字 ✓", pg.locator("#r-len.ok").count() == 1 and pg.locator("#r-mix.ok").count() == 1)
    tap('[data-au="eye"]'); ok("パスワードを表示", pg.locator("#au-pw").get_attribute("type") == "text")
    shot("04-signup-rules")
    tap('[data-au="eye"]'); ok("パスワードをかくす", pg.locator("#au-pw").get_attribute("type") == "password")
    # ゲストの記録を少し作っておく（あとで合わせられるか見る）
    E("(() => { const s = HM_APP.state(); s.totalStars = 7; s.pulls = 7; s.pullsUsed = 3; s.wrongBox = [{k:'local-q', q:{q:'1+1', a:'2'}}]; HM_APP.save(); })()")
    pg.locator("#au-submit").tap(); pg.wait_for_timeout(60)
    ok("読みこみ中の表示（スピナー・ボタン無効）", pg.locator("#au-submit.busy").count() == 1 and pg.locator("#au-submit").is_disabled())
    shot("05-loading")
    ok("登録できたら完了画面", wait_view("done"))
    shot("06-done")
    pg.wait_for_timeout(600)
    doc = E("__HM_FB_MOCK.db.docs['u0']")
    ok("登録後すぐクラウドに保存（users/{uid}）", doc and json.loads(doc["data"])["totalStars"] == 7 and json.loads(doc["data"])["wrongBox"][0]["k"] == "local-q" and doc["v"] == 1 and isinstance(doc["updatedAt"], int))
    tap('[data-au="close"]'); pg.wait_for_timeout(400)
    tap('.tab[data-tab="settings"]'); pg.wait_for_timeout(400)
    ok("マイページにメールと同期状態", "kid@example.com" in pg.locator(".acct-card").inner_text() and "保存ずみ" in pg.locator(".acct-sync").inner_text())
    pg.locator(".acct-card").scroll_into_view_if_needed(); shot("07-mypage-signed-in")

    # 4) 書きこみを少なく：ステップの終わり・かくしたとき・ガチャ/ボス（3分以内はまとめる）だけ。同じ内容なら書かない
    ok("「今すぐ保存」ボタンはない", pg.locator('[data-acct="sync"]').count() == 0 and "今すぐ保存" not in pg.inner_text("body"))
    W = lambda: E("__HM_FB_MOCK.writes")
    def change(): E("(() => { const s = HM_APP.state(); s.totalStars++; s.pulls++; HM_APP.save(); })()")
    def hide_show():
        E("Object.defineProperty(document, 'visibilityState', {configurable:true, get(){return 'hidden'}}); document.dispatchEvent(new Event('visibilitychange'))"); pg.wait_for_timeout(500)
        E("Object.defineProperty(document, 'visibilityState', {configurable:true, get(){return 'visible'}})")
    w0 = W()
    for _ in range(6): change()
    pg.clock.fast_forward("01:00"); pg.wait_for_timeout(400)
    ok("変わっただけでは書かない（自動の30秒保存なし）", W() == w0 and E("HMSync.status().dirty"))
    E("window.dispatchEvent(new Event('hm-step-end'))"); pg.wait_for_timeout(500)
    ok("前の保存から3分以内のステップ終わりはまとめる（すぐは書かない）", W() == w0 and E("HMSync.status().timer"))
    pg.clock.fast_forward("02:10"); pg.wait_for_timeout(600)
    ok("3分たったら1回だけ書く", W() == w0 + 1, W() - w0)
    hide_show()
    ok("内容が同じなら、かくしても書かない", W() == w0 + 1)
    change(); hide_show()
    ok("変わっていれば、かくしたときに書く", W() == w0 + 2)
    change(); E("window.dispatchEvent(new Event('pagehide'))"); pg.wait_for_timeout(500)
    ok("とじたとき（pagehide）に書く", W() == w0 + 3)
    # オフライン → あとで自動でもう一度
    change(); E("__HM_FB_MOCK.failNext = 'unavailable'"); hide_show()
    ok("オフラインでもこわれない（あとで保存）", "オフライン" in pg.locator(".acct-sync").inner_text() and E("HMSync.status().dirty"))
    pg.clock.fast_forward("01:05"); pg.wait_for_timeout(700)
    ok("1分後に自動でもう一度保存", "保存ずみ" in pg.locator(".acct-sync").inner_text() and W() == w0 + 4)
    # 30分の勉強をまねする：2分ごとにステップ（とちゅうで5回保存）、3回ガチャ、1回ボス勝利、2回アプリをかくす、最後にとじる
    pg.clock.fast_forward("05:00"); pg.wait_for_timeout(300)
    ws = W()
    for k in range(15):
        for _ in range(5): change()
        E("window.dispatchEvent(new Event('hm-step-end'))"); pg.wait_for_timeout(150)
        if k in (2, 7, 12): change(); E("window.dispatchEvent(new Event('hm-milestone'))"); pg.wait_for_timeout(150)
        if k == 10: change(); E("window.dispatchEvent(new Event('hm-milestone'))"); pg.wait_for_timeout(150)
        if k in (5, 11): hide_show()
        pg.clock.fast_forward("02:00"); pg.wait_for_timeout(250)
    hide_show(); pg.wait_for_timeout(400)
    sess = W() - ws
    print("SESSION_WRITES", sess)
    ok("30分のまね：書きこみ12回以下（15ステップ・ガチャ3・ボス1・かくす3）", sess <= 12, sess)
    ok("30分のまね：最後の内容はクラウドに保存ずみ", not E("HMSync.status().dirty") and json.loads(E("__HM_FB_MOCK.db.docs['u0'].data"))["totalStars"] == E("HM_APP.state().totalStars"))
    # 起動しなおしても、変わっていなければ書かない
    wr = W(); pg.reload(); pg.wait_for_timeout(2500)
    ok("ログインしたまま起動しなおしても書かない", E("HMAuthUI.state().status") == "saved" and E("__HM_FB_MOCK.writes") == 0, [E("HMAuthUI.state().status"), E("__HM_FB_MOCK.writes")])
    tap('.tab[data-tab="settings"]'); pg.wait_for_timeout(400)
    # 5) ログアウト → 同じメールで登録しようとするとエラー → まちがったパスワード → ネット → 回数
    tap('[data-acct="logout"]'); pg.wait_for_timeout(700)
    ok("ログアウトでゲスト欄にもどる", pg.locator(".acct-card.guest").count() == 1)
    tap('[data-acct="login"]'); tap('[data-au="to-email"]'); tap('[data-au="mode-signup"]')
    pg.locator("#au-email").fill("kid@example.com"); pg.locator("#au-pw").fill("hoshi2026"); tap("#au-submit"); pg.wait_for_timeout(500)
    ok("登録ずみメールのエラー＋ログインへ", "もう登録されている" in pg.locator("#au-err").inner_text() and pg.locator('#au-err [data-au="mode-login"]').count() == 1)
    shot("08-error-in-use")
    tap('#au-err [data-au="mode-login"]')
    ok("メールが入ったままログインタブ", pg.locator("#au-email").input_value() == "kid@example.com")
    pg.locator("#au-pw").fill("wrongpass1"); tap("#au-submit"); pg.wait_for_timeout(500)
    ok("パスワードちがいのエラー", "ちがうみたい" in pg.locator("#au-err").inner_text())
    shot("09-error-wrong-pw")
    E("__HM_FB_MOCK.failNext = 'auth/network-request-failed'"); pg.locator("#au-pw").fill("hoshi2026"); tap("#au-submit"); pg.wait_for_timeout(500)
    ok("ネットのエラー", "インターネットにつながっていない" in pg.locator("#au-err").inner_text())
    E("__HM_FB_MOCK.failNext = 'auth/too-many-requests'"); tap("#au-submit"); pg.wait_for_timeout(500)
    ok("回数が多いときのエラー", "少し時間をおいて" in pg.locator("#au-err").inner_text())
    # パスワード再設定
    tap('[data-au="to-reset"]')
    ok("再設定画面（メールが入っている）", view() == "reset" and pg.locator("#au-email").input_value() == "kid@example.com")
    tap("#au-submit"); pg.wait_for_timeout(500)
    ok("再設定メールを送った表示", "メールを送りました" in pg.locator("#au-ok").inner_text() and "reset:kid@example.com" in E("__HM_FB_MOCK.calls"))
    shot("10-reset-sent")
    tap('.au-back'); tap('[data-au="back"]')
    ok("もどるボタンでようこそ画面", view() == "welcome")

    # 6) クラウドの記録と合わせる（⭐は多い方・なかまは両方）
    E("""(() => { const d = __HM_FB_MOCK.db; d.docs['g-kid'] = { data: JSON.stringify({ totalStars: 20, pulls: 20, pullsUsed: 20, chars: { cloudchar: { n: 1, t: 1 } }, updatedAt: 1 }), updatedAt: 1, v: 1 }; sessionStorage.setItem('mockdb', JSON.stringify(d)); })()""")
    E("(() => { const s = HM_APP.state(); s.totalStars = 9; s.pulls = 9; s.pullsUsed = 5; HM_APP.save(); localStorage.removeItem('hoshimanabi-owner'); })()")
    tap('[data-au="google"]')
    ok("Googleでログイン", wait_view("done") and E("HMAuthUI.state().user.provider") == "google.com")
    pg.wait_for_timeout(500)
    s = E("(() => { const s = HM_APP.state(); return { t: s.totalStars, left: s.pulls - s.pullsUsed, c: !!s.chars.cloudchar, n: Object.keys(s.chars).length }; })()")
    ok("合わせた記録：⭐は多い方・ガチャのこりはへらない・なかまは両方", s["t"] == 20 and s["left"] == 4 and s["c"] and s["n"] >= 2, s)
    tap('[data-au="close"]')

    # 7) アカウント削除（もう一度ログインが必要なとき）
    E("__HM_FB_MOCK.recentLogin = false")
    tap('.tab[data-tab="settings"]'); pg.wait_for_timeout(400)
    tap('[data-acct="delete"]'); pg.wait_for_timeout(400)
    ok("削除の確認シート", "もとにはもどせません" in pg.locator(".sheet").inner_text())
    shot("11-delete-confirm")
    tap("#del-go"); pg.wait_for_timeout(900)
    ok("最近ログインしていないときは、もう一度ログイン", pg.locator("#ra-g").count() == 1)
    shot("12-reauth")
    tap("#ra-g"); pg.wait_for_timeout(1200)
    calls = E("__HM_FB_MOCK.calls")
    ok("ドキュメント→ユーザーの順に削除", calls[-4:] == ["deldoc", "deluser", "reauthG", "deldoc"] or (calls.count("deluser") == 2 and calls.index("deldoc") < calls.index("deluser")), calls[-6:])
    ok("クラウドの記録が消えた", E("!__HM_FB_MOCK.db.docs['g-kid'] && !__HM_FB_MOCK.db.users['g-kid']"))
    pg.wait_for_timeout(400)
    ok("削除後はゲスト欄", pg.locator(".acct-card.guest").count() == 1)

    # 8) ページ
    for name in ["privacy", "terms"]:
        pg.goto(f"http://localhost:{PORT}/{name}.html"); pg.wait_for_timeout(300)
        t = pg.inner_text("body")
        ok(f"{name}.html：連絡先・制定日・保護者の同意", "huishilichuan@gmail.com" in t and "2026年11月17日" in t and "保護者" in t)
        ok(f"{name}.html：年齢や学年を書いていない", "14歳" not in t and "中学2年" not in t)
        pg.screenshot(path=os.path.join(SHOT, f"13-{name}.png"), full_page=False)
    t = open(os.path.join(ROOT, "privacy.html"), encoding="utf-8").read()
    ok("privacy：Firebase・Google・localStorage・広告なし・販売なし・支払いなし・削除方法", all(k in t for k in ["Firebase", "Google でログイン", "localStorage", "広告は表示しません", "売ったり", "支払い", "アカウントを削除する"]))
    sw = open(os.path.join(ROOT, "sw.js"), encoding="utf-8").read()
    ok("SW：v1.3.1・Firebase 通信はキャッシュしない", 'hoshi-manabi-v1.3.1' in sw and "googleapis" in sw and "firebase" in sw)
    ok("本物の Firebase への通信なし（にせものを使用）", not net, net[:3])
    br.close()
finally:
    srv.terminate()
real_err = [e for e in errors if "favicon" not in e]
ok("JSエラーなし", not real_err, real_err[:3])
n = sum(1 for _, c in results if c); print(f"\n{n}/{len(results)} passed")
sys.exit(0 if n == len(results) else 1)
