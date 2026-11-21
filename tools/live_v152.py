# 本番（GitHub Pages）で v1.5.2 の計算メモ欄を iPhone / iPad の WebKit で確認
import time
from playwright.sync_api import sync_playwright
NOAUTH = "try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-21',t:1}))}catch(e){}"
U = "https://huishilichuan-bot.github.io/hoshi-manabi/"
OUT = "/workspace/hoshi-manabi/screenshots/v152"
with sync_playwright() as p:
    br = p.webkit.launch()
    for dev, tag in [("iPhone 14", "iphone"), ("iPad Pro 11", "ipad")]:
        ctx = br.new_context(**p.devices[dev]); pg = ctx.new_page(); pg.add_init_script(NOAUTH)
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(U + "?v=" + str(time.time()), wait_until="networkidle"); pg.wait_for_timeout(1500)
        if pg.is_visible('[data-au="later"]'): pg.click('[data-au="later"]'); pg.wait_for_timeout(500)
        ver = pg.evaluate("(document.body.innerText.match(/v1\\.5\\.\\d/)||[''])[0]")
        pg.evaluate("HM_APP.startStep('math', 4, 1, 0, { noCard: true })"); pg.wait_for_timeout(800)
        g = pg.evaluate("(() => { const a = document.querySelector('#quiz .qz-body').getBoundingClientRect(), m = document.querySelector('.memo-panel').getBoundingClientRect(), c = document.querySelector('.memo-cv').getBoundingClientRect(); return [m.top >= a.bottom, Math.round(c.height), innerHeight]; })()")
        pg.screenshot(path=f"{OUT}/60-live-{tag}-top.png")
        pg.evaluate("(() => { const q = document.querySelector('#quiz'), p = document.querySelector('.memo-panel'); q.scrollTop += p.getBoundingClientRect().top - 8; })()"); pg.wait_for_timeout(300)
        r = pg.evaluate("(() => { const r = document.querySelector('.memo-cv').getBoundingClientRect(); return [r.x, r.y, r.width]; })()")
        s0 = pg.evaluate("document.querySelector('#quiz').scrollTop")
        pg.mouse.move(r[0] + 40, r[1] + 220); pg.mouse.down(); pg.mouse.move(r[0] + r[2] * 0.4, r[1] + 300, steps=8); pg.mouse.move(r[0] + r[2] * 0.75, r[1] + 260, steps=8); pg.mouse.up()
        pg.click('[data-mc="1"]'); pg.mouse.move(r[0] + 40, r[1] + 360); pg.mouse.down(); pg.mouse.move(r[0] + r[2] * 0.7, r[1] + 400, steps=10); pg.mouse.up()
        s1 = pg.evaluate("document.querySelector('#quiz').scrollTop")
        pg.screenshot(path=f"{OUT}/61-live-{tag}-memo.png")
        print(tag, ver, "下にある", g[0], "高さ", g[1], "/", g[2], "線", pg.evaluate("HMMemo.count()"), "画面固定", s0 == s1, "errors", errs[:2])
        ctx.close()
    br.close()
