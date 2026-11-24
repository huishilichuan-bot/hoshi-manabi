# ほしまなび v1.6.4 — 友だち招待のテスト（Firebase はにせもの tools/fb_mock.js）と、紹介ページの表示。iPhone サイズ。
# 使い方: python tools/test_ref.py [URL]   （URL を付けると公開サイトで紹介ページだけ確かめる）
import os, sys, subprocess, json
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOT = "/workspace/hoshi-manabi-shots"; os.makedirs(SHOT, exist_ok=True)
LIVE = sys.argv[1] if len(sys.argv) > 1 else None
srv = None
if not LIVE:
    srv = subprocess.Popen([sys.executable, "-m", "http.server", "8775"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
BASE = LIVE or "http://localhost:8775/"
TAG = "live" if LIVE else "local"
MOCK = open(os.path.join(ROOT, "tools", "fb_mock.js"), encoding="utf-8").read()
res = []
def ok(name, cond, info=""):
    res.append(bool(cond)); print(("PASS " if cond else "FAIL ") + name + (" :: " + str(info) if info != "" else ""), flush=True)
with sync_playwright() as p:
    b = p.webkit.launch()
    # 紹介ページ
    ctx = b.new_context(**p.devices["iPhone 14"], service_workers="block"); pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    for path, name, must in [("parents.html", "parents", "学べる教科と学年"), ("guide/", "guide", "目的から選ぶ"), ("guide/kaigai.html", "kaigai", "漢字は"), ("guide/hoshuko.html", "hoshuko", "1週間の例"), ("guide/katei.html", "katei", "家庭学習")]:
        r = pg.goto(BASE + path); pg.wait_for_timeout(700)
        imgs_ok = pg.evaluate("Promise.all([...document.images].map(i => fetch(i.src).then(r => r.ok))).then(a => a.every(Boolean))")
        canon = pg.evaluate("document.querySelector('link[rel=canonical]').href")
        ld = pg.evaluate("JSON.parse(document.querySelector('script[type=\"application/ld+json\"]').textContent)['@graph'].length")
        ok(f"ページ {path}", r.status == 200 and must in pg.inner_text("body") and imgs_ok and canon.startswith("https://huishilichuan-bot.github.io/hoshi-manabi/") and ld == 2, f"{r.status} canon={canon}")
        pg.screenshot(path=f"{SHOT}/v164-{TAG}-page-{name}.png")
        if name == "parents": pg.screenshot(path=f"{SHOT}/v164-{TAG}-page-parents-full.png", full_page=True)
    ok("紹介ページでJSエラーなし", not errs, errs[:2])
    ctx.close()
    # アプリ
    ctx = b.new_context(**p.devices["iPhone 14"], service_workers="block")
    if not LIVE: ctx.add_init_script(MOCK)
    ctx.add_init_script("try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-21',t:1}))}catch(e){}")
    pg = ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); E = pg.evaluate
    pg.goto(BASE + "index.html?ref=QQQ234"); pg.wait_for_timeout(2000)
    ok("バージョン 1.6.4", E("HM_APP.version") == "1.6.4", E("HM_APP.version"))
    ok("はじめの画面に「保護者の方へ」", pg.locator('#auth-layer a[href="./parents.html"]').count() >= 1)
    pg.screenshot(path=f"{SHOT}/v164-{TAG}-welcome.png")
    if not LIVE:
        pg.locator('[data-au="google"]').first.click(); pg.wait_for_timeout(2500)
        ok("にせ Google でログイン", E("HMAuthUI.state().user && HMAuthUI.state().user.uid") == "g-kid")
        E("(()=>{const x=document.querySelector('.au-close,[data-au=\"close\"],[data-au=\"later\"]'); if(x) x.click();})()"); pg.wait_for_timeout(500)
        E("HM_APP.state().pulls = 0; HM_APP.state().pullsUsed = 0; HM_APP.save()")
        pg.locator('.tab[data-tab="settings"]').click(); pg.wait_for_timeout(2500)
        code = E("HM_APP.state().ref && HM_APP.state().ref.code")
        ok("自分の招待コードができる（6文字）", bool(code) and len(code) == 6 and E(f"!!__HM_FB_MOCK.db.inv['{code}']"), code)
        ok("?ref= のコードが入力欄に入っている", pg.input_value("#ref-input") == "QQQ234")
        pg.locator("#ref-sec").scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        pg.screenshot(path=f"{SHOT}/v164-{TAG}-ref-card.png")
        pg.fill("#ref-input", code); pg.click('[data-ref="redeem"]'); pg.wait_for_timeout(900)
        ok("自分のコードは使えない", "自分のコード" in pg.inner_text("#ref-sec") and E("HM_APP.state().pulls") == 0)
        pg.fill("#ref-input", "ZZZ999"); pg.click('[data-ref="redeem"]'); pg.wait_for_timeout(900)
        ok("ないコードは見つからない", "見つからなかった" in pg.inner_text("#ref-sec") and E("HM_APP.state().pulls") == 0)
        E("__HM_FB_MOCK.db.inv['QQQ234'] = { uid: 'friend1', t: 1 }")
        pg.fill("#ref-input", "qqq234"); pg.click('[data-ref="redeem"]'); pg.wait_for_timeout(1200)
        ok("友だちのコードで ガチャ回数 +3", E("HM_APP.state().pulls") == 3 and E("HM_APP.state().ref.by") == "QQQ234" and E("__HM_FB_MOCK.db.red['g-kid'].inviter") == "friend1", E("HM_APP.state().pulls"))
        pg.wait_for_timeout(400); pg.locator("#ref-sec").scroll_into_view_if_needed(); pg.screenshot(path=f"{SHOT}/v164-{TAG}-ref-redeemed.png")
        ok("コードを使ったら入力欄は消える（1人1回）", pg.locator("#ref-input").count() == 0)
        # 友だち2人がこちらのコードを使った → 招待した側に +3×2
        E(f"__HM_FB_MOCK.db.red['f2'] = {{ code: '{code}', inviter: 'g-kid', t: 1 }}; __HM_FB_MOCK.db.red['f3'] = {{ code: '{code}', inviter: 'g-kid', t: 1 }}")
        E("HMRef.refresh(true)"); pg.wait_for_timeout(1500)
        ok("招待した側に ガチャ回数 +6（2人）", E("HM_APP.state().pulls") == 9 and E("HM_APP.state().ref.claimed.length") == 2, E("HM_APP.state().pulls"))
        E("HMRef.refresh(true)"); pg.wait_for_timeout(1200)
        ok("同じ友だちで二重にはもらえない", E("HM_APP.state().pulls") == 9)
        E("for (let i = 0; i < 12; i++) __HM_FB_MOCK.db.red['x' + i] = { code: '" + code + "', inviter: 'g-kid', t: 1 }"); E("HMRef.refresh(true)"); pg.wait_for_timeout(1500)
        ok("ごほうびは10人まで", E("HM_APP.state().ref.n") == 10 and E("HM_APP.state().pulls") == 3 + 30, [E("HM_APP.state().ref.n"), E("HM_APP.state().pulls")])
        E("navigator.share = undefined; window.__copied = null; navigator.clipboard.writeText = (t) => { window.__copied = t; return Promise.resolve(); }")
        pg.click('[data-ref="copy"]'); pg.wait_for_timeout(500)
        cp = E("window.__copied") or ""
        ok("共有メッセージ（日本語・URL・コード）", code in cp and "https://huishilichuan-bot.github.io/hoshi-manabi/?ref=" + code in cp and "ガチャ回数" in cp, cp.replace("\n", " / "))
        E("window.__sh = null; navigator.share = (d) => { window.__sh = d; return Promise.resolve(); }")
        pg.click('[data-ref="share"]'); pg.wait_for_timeout(400)
        ok("共有ボタンは端末の共有シートを使う", (E("window.__sh") or {}).get("url", "").endswith("?ref=" + code))
        pg.locator('.tab[data-tab="home"]').click(); pg.wait_for_timeout(500)
        pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); pg.wait_for_timeout(300)
        ok("ホームの下に「保護者の方へ」", pg.locator('.foot a[href="./parents.html"]').count() == 1)
        pg.screenshot(path=f"{SHOT}/v164-{TAG}-home-foot.png")
    ok("アプリでJSエラーなし", not errs, errs[:3])
    b.close()
if srv: srv.terminate()
print(f"{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)
