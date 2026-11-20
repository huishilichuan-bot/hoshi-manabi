# v1.5.1：iPhone(WebKit) でモード選択・ゴルフ/レーシングの終了・制限時間表示を撮る
import subprocess, sys, time, os, random
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-20',t:1}))}catch(e){}"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, "screenshots", "v15"); os.makedirs(OUT, exist_ok=True)
PORT = 8813
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
errs = []
def res_open(pg): return pg.evaluate("!document.getElementById('gl-result').hidden")
try:
  with sync_playwright() as p:
    br = p.webkit.launch(); dev = p.devices["iPhone 14"]
    ctx = br.new_context(**dev)
    pg = ctx.new_page(); pg.add_init_script(NOAUTH)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(1200)
    pg.evaluate("(() => { const s = HM_APP.state(); s.days[HM_APP.today()] = { stars: 4, steps: {} }; s.games.golf = { easy: { plays: 5, wins: 4, m: { best: 9, unit: '打', lower: true } }, normal: { plays: 2, wins: 1 }, hard: { plays: 1, wins: 0 } }; HM_APP.save(); HM_APP.render(); })()")
    pg.evaluate("HM_APP.openGameMenu('golf')"); pg.wait_for_timeout(900); pg.screenshot(path=f"{OUT}/21-golf-mode-select.png")
    pg.click('[data-diff="easy"]'); pg.wait_for_timeout(1500); pg.screenshot(path=f"{OUT}/22-golf-hud.png")
    # ゴルフ：ランダムに打ち続けて終了まで
    t0 = time.time(); shot_tape = False
    while not res_open(pg) and time.time() - t0 < 150:
        bb = pg.query_selector("#gl-body canvas").bounding_box()
        x = bb["x"] + bb["width"] * random.uniform(0.2, 0.8); y = bb["y"] + bb["height"] * random.uniform(0.3, 0.9)
        pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + random.uniform(-60, 60), y + random.uniform(20, 120), steps=4); pg.mouse.up()
        pg.wait_for_timeout(900)
        if not shot_tape and pg.evaluate("!!(window.GCGames && GCGames.active && GCGames.active.tape && GCGames.active.tape.broke)"):
            pg.screenshot(path=f"{OUT}/23-golf-tape.png"); shot_tape = True
    pg.wait_for_timeout(2300); pg.screenshot(path=f"{OUT}/24-golf-result.png")
    print("golf", round(time.time() - t0), pg.evaluate("document.querySelector('.rs-card') && document.querySelector('.rs-card').innerText.replace(/\\n+/g,' | ')"), flush=True)
    # レーシング：操作しないで時間切れまで
    pg.evaluate("HM_APP.startGame('racing','easy')"); t0 = time.time(); got = False
    while not res_open(pg) and time.time() - t0 < 150:
        pg.wait_for_timeout(500)
        if not got and pg.evaluate("document.querySelector('#gl-body').innerText.includes('のこり6秒') || !!(GCGames.active && GCGames.active.tape && GCGames.active.tape.broke)"):
            pg.wait_for_timeout(300); pg.screenshot(path=f"{OUT}/25-racing-cpu-goal.png"); got = True
    pg.screenshot(path=f"{OUT}/26-racing-timeup.png"); pg.wait_for_timeout(2300); pg.screenshot(path=f"{OUT}/27-racing-result.png")
    print("racing", round(time.time() - t0), pg.evaluate("document.querySelector('.rs-card') && document.querySelector('.rs-card').innerText.replace(/\\n+/g,' | ')"), flush=True)
    # 制限時間の表示（テスト用に40秒へ短縮）
    pg.evaluate("window.HM_SAFETY_SEC=40; HM_APP.startGame('coin','easy')"); pg.wait_for_timeout(15000); pg.screenshot(path=f"{OUT}/28-timelimit-badge.png")
    pg.wait_for_function("!document.getElementById('gl-result').hidden", timeout=60000); pg.wait_for_timeout(2300); pg.screenshot(path=f"{OUT}/29-timelimit-result.png")
    print("coin", pg.evaluate("document.querySelector('.rs-card').innerText.replace(/\\n+/g,' | ')"), flush=True)
    br.close()
finally:
  srv.terminate()
print("errors", errs[:5])
