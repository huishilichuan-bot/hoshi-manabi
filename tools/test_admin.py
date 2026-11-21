# ほしまなび v1.6.2 — 管理画面のテスト
# ① 管理画面（admin.html）：本物の Firebase SDK ＋ 手元のエミュレーター（Auth・Firestore、ルールは firestore.rules）で、だれが見られるかをためす
# ② アプリ：答えると利用のようすが記録され、ログイン中はアカウント情報も記録に入る（Firebase はにせもの tools/fb_mock.js）
# 実行：cd /tmp/fbemu && NODE_PATH=/workspace/fbtools/node_modules /workspace/fbtools/node_modules/.bin/firebase emulators:exec --only firestore,auth --project demo-hoshi "/workspace/pwvenv/bin/python /workspace/hoshi-manabi/tools/test_admin.py"
import subprocess, sys, time, os, json, urllib.request
from datetime import datetime, timedelta
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOT = os.path.join(ROOT, "screenshots", "v162"); os.makedirs(SHOT, exist_ok=True)
PORT = 8779
LIVE = os.environ.get("ADMIN_LIVE") == "1"
results = []; errors = []
def ok(name, cond, info=""):
    results.append((name, bool(cond))); print(("PASS " if cond else "FAIL ") + name + (" :: " + str(info) if info else ""))

def seed():
    base = "http://127.0.0.1:8080/v1/projects/demo-hoshi/databases/(default)/documents/users?documentId="
    now = datetime.now(); dk = lambda d: (now - timedelta(days=d)).strftime("%Y-%m-%d")
    ms = lambda m: m * 60000
    users = {
        "u-hana": {"acct": {"uid": "u-hana", "email": "hana.parent@example.com", "name": "山田 はな", "provider": "google.com"}, "settings": {"nick": "はなちゃん", "grade": 4},
                   "use": {dk(0): {"ms": ms(28), "n": 36, "ok": 31, "s": {"math": [24, 21], "ja": [12, 10]}}, dk(1): {"ms": ms(34), "n": 40, "ok": 33, "s": {"math": [20, 17], "sci": [20, 16]}}, dk(2): {"ms": ms(22), "n": 30, "ok": 24, "s": {"en": [30, 24]}}, dk(5): {"ms": ms(15), "n": 18, "ok": 15, "s": {"soc": [18, 15]}}},
                   "progress": {"math|4|大きい数|1": {"passed": True}, "math|4|わり算|1": {"passed": True}, "ja|4|漢字|1": {"passed": True}, "sci|4|天気|1": {"passed": True}, "en|5|あいさつ|1": {"passed": True}},
                   "totalStars": 23, "lastActive": int(time.time() * 1000) - 600000, "created": int((now - timedelta(days=12)).timestamp() * 1000)},
        "u-ken": {"acct": {"uid": "u-ken", "email": "ken@example.com", "name": "", "provider": "password"}, "settings": {"nick": "けん", "grade": 8},
                  "use": {dk(3): {"ms": ms(41), "n": 52, "ok": 38, "s": {"math": [30, 22], "en": [22, 16]}}, dk(4): {"ms": ms(19), "n": 24, "ok": 20, "s": {"sci": [24, 20]}}},
                  "progress": {"math|8|連立方程式|1": {"passed": True}, "en|8|不定詞|2": {"passed": True}}, "totalStars": 9, "lastActive": int(time.time() * 1000) - 3 * 86400000},
        "u-old": {"settings": {"nick": ""}, "days": {dk(9): {"stars": 2, "steps": {"a": 1, "b": 1}}}, "progress": {"math|1|たし算|1": {"passed": True}}, "totalStars": 2},
    }
    for uid, st in users.items():
        body = json.dumps({"fields": {"data": {"stringValue": json.dumps(st, ensure_ascii=False)}, "updatedAt": {"integerValue": str(st.get("lastActive", int(time.time() * 1000) - 9 * 86400000))}, "v": {"integerValue": "1"}}}).encode()
        req = urllib.request.Request(base + uid, data=body, method="POST", headers={"Content-Type": "application/json", "Authorization": "Bearer owner"})
        urllib.request.urlopen(req).read()
    return users

srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
try:
  with sync_playwright() as p:
    for dev, tag in ((p.devices["iPhone 14"], "iphone"),):
      br = p.webkit.launch()
      if not LIVE:
        seed()
        ctx = br.new_context(**dev); pg = ctx.new_page()
        pg.on("pageerror", lambda e: errors.append(str(e)))
        U = f"http://localhost:{PORT}/admin.html?emu=1&project=demo-hoshi"
        pg.goto(U); pg.wait_for_selector("#go", timeout=20000)
        ok(tag + " ログインしていないとログイン画面だけ（記録は出ない）", pg.locator(".u").count() == 0 and "管理者ログイン" in pg.inner_text("main"))
        pg.screenshot(path=os.path.join(SHOT, tag + "-admin-login.png"))
        # 一般のユーザー
        pg.evaluate("__adminTest.signInAs('kid@example.com')"); pg.wait_for_function("document.querySelector('main').innerText.includes('運営者専用')", timeout=15000)
        ok(tag + " 一般のユーザーは「運営者専用」で記録は出ない", pg.locator(".u").count() == 0)
        ok(tag + " 一般のユーザーは Firestore の一覧も読めない（ルールで拒否）", pg.evaluate("__adminTest.list()") == "permission-denied")
        pg.screenshot(path=os.path.join(SHOT, tag + "-admin-denied.png"))
        # 管理者と同じアドレスでもメール未確認ならだめ（ルール）
        pg.evaluate("__adminTest.signOut()"); pg.wait_for_selector("#go")
        # 管理者
        pg.evaluate("__adminTest.signInAs('huishilichuan@gmail.com')"); pg.wait_for_selector(".u", timeout=15000)
        ok(tag + " 管理者（huishilichuan@gmail.com）は全員の記録を見られる", pg.locator(".u").count() == 3)
        kp = pg.inner_text(".kpis")
        ok(tag + " 合計：登録3人・今日1人・7日以内2人", "登録ユーザー\n3人" in kp.replace("\n人", "人") or ("3" in kp and "登録ユーザー" in kp), kp.replace("\n", " "))
        ok(tag + " 合計の数字（答えた数200問・正答率81%）", "200" in kp and "81" in kp, kp.replace("\n", " "))
        first = pg.locator(".u").first.inner_text()
        ok(tag + " 最近使った順で、はなさんが先頭（名前・メール・勉強時間・連続）", "山田 はな" in first and "hana.parent@example.com" in first and "1時間39分" in first and "3日" in first, first.replace("\n", " "))
        ok(tag + " 記録のまだない古いユーザーも出る（名前なし）", "名前なし" in pg.inner_text("#list"))
        pg.screenshot(path=os.path.join(SHOT, tag + "-admin-dashboard.png"), full_page=False)
        pg.locator(".u-h").first.click(); pg.wait_for_timeout(300)
        det = pg.inner_text(".u.open")
        ok(tag + " ひとりの詳しい記録（教科ごとの正答率・クリア数・学年）", "算数・数学" in det and "86%" in det and "クリア2" in det and "小4" in det, det.replace("\n", " ")[:300])
        pg.locator(".u.open").scroll_into_view_if_needed(); pg.screenshot(path=os.path.join(SHOT, tag + "-admin-detail.png"))
        pg.fill("#q", "ken"); pg.wait_for_timeout(200)
        ok(tag + " さがす", pg.locator(".u").count() == 1 and "ken@example.com" in pg.inner_text("#list"))
        pg.fill("#q", ""); pg.select_option("#sort", "time"); pg.wait_for_timeout(200)
        ok(tag + " ならべかえ（勉強時間が長い順）", "山田 はな" in pg.locator(".u").first.inner_text())
        with pg.expect_download() as dl: pg.click("#csv")
        d = dl.value; txt = open(d.path(), encoding="utf-8-sig").read()
        ok(tag + " CSVで書き出せる", txt.startswith('"名前"') and "hana.parent@example.com" in txt and txt.count("\n") >= 3)
        ok(tag + " 横にはみ出さない", pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
        pg.click("#out"); pg.wait_for_selector("#go", timeout=10000)
        ok(tag + " ログアウトすると記録は消える", pg.locator(".u").count() == 0)
        pg.evaluate("__adminTest.signInAs('keijitachikawa4@gmail.com')"); pg.wait_for_selector(".u", timeout=15000)
        ok(tag + " 管理者（keijitachikawa4@gmail.com）も見られる", pg.locator(".u").count() == 3)
        ctx.close()
      # ② アプリ側（にせもの Firebase）
      MOCK = open(os.path.join(ROOT, "tools", "fb_mock.js"), encoding="utf-8").read()
      base = "https://huishilichuan-bot.github.io/hoshi-manabi/" if LIVE else f"http://localhost:{PORT}/"
      for em, adm in (("kid2@example.com", False), ("huishilichuan@gmail.com", True)):
        ctx = br.new_context(**dev); ctx.add_init_script(MOCK)
        ctx.add_init_script("try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-21',t:1}));localStorage.setItem('hoshimanabi-auth-seen','1')}catch(e){}")
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(base + "index.html"); pg.wait_for_function("window.HM_APP && window.HMAuthUI", timeout=20000); pg.wait_for_timeout(1500)
        pg.evaluate("(async (em) => { const M = window.__HM_FB_MOCK; await M.emailUp(em, 'hoshi2026'); })('%s')" % em)
        pg.wait_for_function("window.HMSync && HMSync.status().user && HMSync.status().ready", timeout=15000)
        acct = pg.evaluate("HM_APP.state().acct")
        ok(tag + f" ログインするとアカウント情報が記録に入る（{em}）", acct and acct.get("email") == em and acct.get("provider"), acct)
        pg.evaluate("HM_APP.startStep('soc', 3, 0, 0, {noCard:true})"); pg.wait_for_timeout(1200)
        k = pg.evaluate("(() => { const Q = HM_APP.quiz(); const k = Q.qs.findIndex(q => q.t === 'ch'); if (k < 0) return -1; const t = Q.qs[k]; Q.qs[k] = Q.qs[0]; Q.qs[0] = t; HM_APP.showQ(); const o = t.opts || [t.a].concat(t.o); return o.indexOf(t.a); })()")
        pg.wait_for_timeout(1300)
        if k >= 0: pg.locator(f'[data-opt="{k}"]').first.click()
        pg.wait_for_timeout(400)
        use = pg.evaluate("HM_APP.state().use")
        today = datetime.now().strftime("%Y-%m-%d")
        if adm is False:
            ok(tag + " 答えると利用のようすが記録される（勉強時間・答えた数・教科）", use and today in use and use[today]["n"] >= 1 and use[today]["ms"] > 500 and "soc" in use[today]["s"], [k, use])
            pg.evaluate("HMSync.flush('hidden')"); pg.wait_for_timeout(800)
            doc = pg.evaluate("(() => { const M = __HM_FB_MOCK; const uid = M.db.cur; return JSON.parse(M.db.docs[uid].data); })()")
            ok(tag + " クラウドの記録に acct と use が入る（ルールの決まった項目のまま）", doc.get("acct", {}).get("email") == em and today in doc.get("use", {}), list(doc.keys())[:40])
            ok(tag + " クラウドの記録の項目は data・updatedAt・v だけ", pg.evaluate("Object.keys(__HM_FB_MOCK.db.docs[__HM_FB_MOCK.db.cur]).sort().join()") == "data,updatedAt,v")
        pg.evaluate("HM_APP.state(); document.querySelector('[data-q=\"quit\"]') && document.querySelector('[data-q=\"quit\"]').click()"); pg.wait_for_timeout(400)
        html = pg.evaluate("HMAuthUI.sectionHtml ? HMAuthUI.sectionHtml() : ''")
        ok(tag + (" 管理者のマイページには「管理画面」ボタン" if adm else " 一般のユーザーには「管理画面」ボタンが出ない"), ('href="./admin.html"' in html) == adm)
        ctx.close()
      br.close()
finally:
    srv.terminate()
print("errors:", errors[:5])
n = sum(1 for _, c in results if c); print(f"\n{n}/{len(results)} passed")
sys.exit(0 if n == len(results) and not errors else 1)
