# 本番で中3長文（400語以上）のリーディング画面を iPhone / iPad で撮る（紙ふぶきが消えてから）
import time
from playwright.sync_api import sync_playwright
NOAUTH = "try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-20',t:1}))}catch(e){}"
U = "https://huishilichuan-bot.github.io/hoshi-manabi/"; OUT = "/workspace/hoshi-manabi/screenshots/v16"
with sync_playwright() as p:
    br = p.webkit.launch()
    for dev, tag in [("iPhone 14", "iphone"), ("iPad Pro 11", "ipad")]:
        ctx = br.new_context(**p.devices[dev]); pg = ctx.new_page(); pg.add_init_script(NOAUTH)
        pg.goto(U + "?v=" + str(time.time()), wait_until="networkidle"); pg.wait_for_timeout(1500)
        if pg.is_visible('[data-au="later"]'): pg.click('[data-au="later"]'); pg.wait_for_timeout(500)
        pg.evaluate("HM_APP.startStep('en', 9, 6, 2, { noCard: true })"); pg.wait_for_timeout(700)
        pg.evaluate("(() => { const Q = HM_APP.quiz(); const k = Q.qs.findIndex(q => q.passage && q.passage.words >= 400); const t = Q.qs[k]; Q.qs[k] = Q.qs[0]; Q.qs[0] = t; HM_APP.showQ(); })()")
        pg.wait_for_timeout(2500)
        info = pg.evaluate("(() => { const q = HM_APP.quiz().qs[0]; return [q.passage.title, q.passage.words, (document.querySelector('.e4-pass').innerText.match(/[A-Za-z']+/g)||[]).length]; })()")
        pg.screenshot(path=f"{OUT}/live-{tag}-read-passage-g9-clean.png")
        pg.evaluate("document.querySelector('.e4-opts, [data-mo]').scrollIntoView({block:'center'})"); pg.wait_for_timeout(400)
        pg.screenshot(path=f"{OUT}/live-{tag}-read-passage-g9-opts.png")
        print(tag, "中3長文", info, "版", pg.evaluate("HM_APP.version"))
        ctx.close()
    br.close()
