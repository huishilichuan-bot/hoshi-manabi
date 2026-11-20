from playwright.sync_api import sync_playwright
NOAUTH = "try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-20',t:1}))}catch(e){}"
U = "https://huishilichuan-bot.github.io/hoshi-manabi/"
with sync_playwright() as p:
    br = p.webkit.launch(); ctx = br.new_context(**p.devices["iPhone 14"]); pg = ctx.new_page(); pg.add_init_script(NOAUTH)
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(U + "?v=" + str(__import__('time').time()), wait_until="networkidle"); pg.wait_for_timeout(1500); pg.click('[data-au="later"]') if pg.is_visible('[data-au="later"]') else None; pg.wait_for_timeout(500)
    print("version", pg.evaluate("(window.HM_APP && document.body.innerText.match(/v?1\\.5\\.\\d/)||[''])[0]"), pg.evaluate("typeof HMMemo"), pg.evaluate("typeof HMSafety"), pg.evaluate("Object.keys((HM.PRECALC||{}).r||{}).length"))
    pg.evaluate("(() => { const s = HM_APP.state(); s.days[HM_APP.today()] = { stars: 4, steps: {} }; HM_APP.save(); HM_APP.render(); })()"); pg.evaluate("HM_APP.openGameMenu('golf')"); pg.wait_for_timeout(800)
    print("modesel", pg.evaluate("[...document.querySelectorAll('.ms-btn')].map(b=>b.textContent.trim()).join(',')"), pg.is_visible(".ms-top"))
    pg.screenshot(path="/workspace/hoshi-manabi/screenshots/v15/40-live-mode-select.png")
    pg.evaluate("document.querySelector('.ms-top').click()"); pg.wait_for_timeout(400)
    pg.evaluate("HM_APP.startStep('math', 4, 0, 0, { noCard: true })"); pg.wait_for_timeout(700)
    print("memo fab", pg.is_visible(".memo-fab")); pg.tap(".memo-fab"); pg.wait_for_timeout(300)
    pg.mouse.move(80, 300); pg.mouse.down(); pg.mouse.move(300, 380, steps=8); pg.mouse.up()
    print("strokes", pg.evaluate("HMMemo.count()"))
    pg.screenshot(path="/workspace/hoshi-manabi/screenshots/v15/41-live-memo.png")
    print("sw", pg.evaluate("navigator.serviceWorker && navigator.serviceWorker.controller ? 'ctl' : 'noctl'"), "errors", errs[:3])
    br.close()
