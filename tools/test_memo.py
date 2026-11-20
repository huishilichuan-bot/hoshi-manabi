# 計算メモのテスト（iPhone 14 / iPad の WebKit）：表示条件・描画・色/太さ・消しゴム・戻す・全部消す・自動クリア・スクロール/ズーム停止
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-20',t:1}))}catch(e){}"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, "screenshots", "v15")
PORT = 8814
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
fails = []; errs = []
def ok(name, c):
    print(("OK  " if c else "NG  ") + name, flush=True)
    if not c: fails.append(name)
def ink(pg): return pg.evaluate("(() => { const c = document.querySelector('.memo-cv'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 0) n++; return n; })()")
def stroke(pg, x0, y0, x1, y1):
    pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move((x0 + x1) / 2, (y0 + y1) / 2 + 30, steps=6); pg.mouse.move(x1, y1, steps=6); pg.mouse.up()
try:
  with sync_playwright() as p:
    br = p.webkit.launch()
    for devname, tag in [("iPhone 14", "iphone"), ("iPad Pro 11", "ipad")]:
        ctx = br.new_context(**p.devices[devname]); pg = ctx.new_page(); pg.add_init_script(NOAUTH)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(1000)
        pg.evaluate("HM_APP.startStep('math', 3, 0, 0, { noCard: true })"); pg.wait_for_timeout(600)
        ok(tag + " 算数でメモボタンが出る", pg.is_visible(".memo-fab"))
        pg.tap(".memo-fab"); pg.wait_for_timeout(300)
        ok(tag + " ひらく", pg.is_visible(".memo-layer") and pg.evaluate("document.body.classList.contains('memo-open')"))
        vw = pg.viewport_size
        stroke(pg, 60, 200, 260, 260); n1 = ink(pg); ok(tag + " 指で書ける", n1 > 50)
        pg.click('[data-mc="1"]'); pg.click('[data-ms="2"]'); stroke(pg, 60, 330, 300, 360)
        red = pg.evaluate("(() => { const c = document.querySelector('.memo-cv'), r = c.width / innerWidth; const d = c.getContext('2d').getImageData(0, Math.round(300 * r), c.width, Math.round(90 * r)).data; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] > 200 && d[i + 1] < 90) return true; return false; })()")
        ok(tag + " 色・太さを変えられる（赤・太い）", red)
        n2 = ink(pg); ok(tag + " 太い線でインクがふえる", n2 > n1)
        pg.screenshot(path=f"{OUT}/32-memo-{tag}.png")
        pg.click('[data-mt="erase"]'); stroke(pg, 60, 345, 300, 345); n3 = ink(pg); ok(tag + " 消しゴムで消える", n3 < n2)
        pg.click('[data-mt="undo"]'); ok(tag + " 元に戻す", ink(pg) == n2)
        sy = pg.evaluate("[scrollY, document.querySelector('#quiz').scrollTop, visualViewport.scale]")
        stroke(pg, 200, 600, 200, 150); sy2 = pg.evaluate("[scrollY, document.querySelector('#quiz').scrollTop, visualViewport.scale]")
        ok(tag + " 書いてもスクロール・ズームしない", sy == sy2 and sy2[2] == 1)
        pg.click('[data-mt="clear"]'); ok(tag + " 全部消す", ink(pg) == 0)
        stroke(pg, 60, 200, 260, 260); pg.click('[data-mt="close"]')
        ok(tag + " とじると問題にさわれる", not pg.is_visible(".memo-layer") and pg.evaluate("!document.body.classList.contains('memo-open')"))
        ok(tag + " メモありのしるし", pg.evaluate("document.querySelector('.memo-fab').classList.contains('has')"))
        # 問題を変える → 自動クリア
        n0 = pg.inner_text(".qz-n")
        pg.evaluate("(() => { const b = document.querySelector('#quiz .opt'); if (b) { b.click(); return; } document.querySelector('#quiz [data-key=\"1\"]').click(); document.querySelector('#quiz [data-key=\"ok\"]').click(); })()"); pg.wait_for_timeout(1500)
        for _ in range(3):
            pg.evaluate("(() => { const n = [...document.querySelectorAll('#qz-foot button')].pop(); if (n) n.click(); })()"); pg.wait_for_timeout(700)
            if pg.inner_text(".qz-n") != n0: break
        ok(tag + " 次の問題へ進んだ " + n0 + "→" + pg.inner_text(".qz-n"), pg.inner_text(".qz-n") != n0)
        ok(tag + " 次の問題で自動クリア", pg.evaluate("HMMemo.count()") == 0 and not pg.evaluate("document.querySelector('.memo-fab').classList.contains('has')"))
        # 国語では出ない／理科の数字問題で出る
        ok("判定：国語は出さない", not pg.evaluate("HMMemo.needs('ja', { q: '3つの漢字' })"))
        ok("判定：理科の数字問題は出す", pg.evaluate("HMMemo.needs('sci', { q: '電流が 2A のとき…' })") and not pg.evaluate("HMMemo.needs('sci', { q: 'こん虫のからだは？' })"))
        pg.evaluate("HM_APP.startStep('ja', 3, 0, 0, { noCard: true })"); pg.wait_for_timeout(500)
        ok(tag + " 国語の問題ではボタンなし", not pg.is_visible(".memo-fab"))
        pg.evaluate("document.querySelector('[data-q=\"quit\"]').click()"); pg.wait_for_timeout(500)
        pg.evaluate("(() => { const b = [...document.querySelectorAll('button')].find(b => /やめる/.test(b.textContent) && b.offsetParent); if (b) b.click(); })()"); pg.wait_for_timeout(400)
        ctx.close()
    br.close()
finally:
  srv.terminate()
print("errors", errs[:5]); print("FAIL" if fails or errs else "PASS", len(fails))
