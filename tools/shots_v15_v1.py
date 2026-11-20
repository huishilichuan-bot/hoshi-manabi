# v1.5 V1：強さえらび・結果画面（勝ち/負け）・ゴールテープの画面を撮る
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-20',t:1}))}catch(e){}"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, "screenshots", "v15"); os.makedirs(OUT, exist_ok=True)
PORT = 8812
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
errs = []
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = br.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2); pg.add_init_script(NOAUTH)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(800)
    pg.evaluate("(() => { const s = HM_APP.state(); s.days[HM_APP.today()] = { stars: 4, steps: {} }; s.games.runner = { easy: { plays: 5, wins: 3, streak: 2, m: { best: 24.3, unit: '秒', lower: true } }, normal: { plays: 2, wins: 1 } }; HM_APP.save(); HM_APP.render(); })()")
    pg.evaluate("HM_APP.openGameMenu('runner')"); pg.wait_for_timeout(900); pg.screenshot(path=f"{OUT}/v1-diff-select.png")
    pg.evaluate("document.querySelector('[data-diff="easy"]').click()"); pg.wait_for_timeout(500)
    for kind in ["lose", "win"]:
        if kind == "win": pg.evaluate("HM_APP.startGame('runner','easy')"); pg.wait_for_timeout(500)
        pg.evaluate(f"window.__pro.cheat('{kind}')"); pg.wait_for_timeout(500 if kind == "lose" else 350)
        pg.screenshot(path=f"{OUT}/v1-runner-tape-{kind}.png")
        pg.wait_for_function("!document.getElementById('gl-result').hidden", timeout=8000); pg.wait_for_timeout(2300)
        pg.screenshot(path=f"{OUT}/v1-result-{kind}.png")
        print(kind, pg.evaluate("document.querySelector('.rs-card').innerText.replace(/\\n+/g,' | ')"), flush=True)
    for kind in ["win", "lose"]:
        pg.evaluate("HM_APP.startGame('racing','normal')"); pg.wait_for_timeout(600)
        pg.evaluate(f"window.__pro.cheat('{kind}')"); pg.wait_for_timeout(1700)
        pg.screenshot(path=f"{OUT}/v1-racing-goal-{kind}.png")
        pg.wait_for_function("!document.getElementById('gl-result').hidden", timeout=12000); pg.wait_for_timeout(2300)
        pg.screenshot(path=f"{OUT}/v1-racing-result-{kind}.png")
        print("racing", kind, pg.evaluate("document.querySelector('.rs-card').innerText.replace(/\\n+/g,' | ')"), flush=True)
    br.close()
finally:
  srv.terminate()
print("errors:", errs)
