# 全50ゲームを少し長めに遊んで（ランダムなタップ・キー）エラーがないか確かめ、一覧画像を作る
import subprocess, sys, time, os, random, json
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-20',t:1}))}catch(e){}"  # 旧テストではログイン画面を出さない
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "screenshots", "games"); os.makedirs(OUT, exist_ok=True)
PORT = 8766
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8); errs = []; bad = []; finished = []
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = br.new_page(viewport={"width": 390, "height": 844}); pg.add_init_script(NOAUTH)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(600)
    pg.evaluate("(() => { const s = HM_APP.state(); s.days[HM_APP.today()] = { stars: 4, steps: {} }; HM_APP.save(); HM_APP.render(); })()")
    assert pg.evaluate("HM_APP.gamesOpen()")
    ids = pg.evaluate("HM_APP.GAMES.map(g=>g.id)")
    secs = float(sys.argv[1]) if len(sys.argv) > 1 else 6
    for gid in ids:
        eb = len(errs)
        pg.evaluate(f"HM_APP.startGame('{gid}','{random.choice(['easy','normal','hard','ultra'])}')"); pg.wait_for_timeout(200)
        t0 = time.time(); shot = False
        while time.time() - t0 < secs:
            box = pg.locator("#gl-body").bounding_box()
            if box:
                x = box["x"] + random.random() * box["width"]; y = box["y"] + 30 + random.random() * max(10, min(box["height"], 700) - 40)
                if random.random() < .7: pg.mouse.click(x, y)
                else: pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + random.randint(-40, 40), y + random.randint(-40, 40), steps=2); pg.mouse.up()
            if random.random() < .3: pg.keyboard.press(random.choice(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"]))
            pg.wait_for_timeout(random.randint(30, 160))
            if not shot and time.time() - t0 > 1.5:
                pg.screenshot(path=f"{OUT}/{gid}.png"); shot = True
            if pg.evaluate("!document.getElementById('gl-result').hidden"): finished.append(gid); break
        if pg.evaluate("!document.getElementById('gl-result').hidden"):
            if gid not in finished: finished.append(gid)
        pg.evaluate("document.getElementById('gl-close').click()"); pg.wait_for_timeout(80)
        if len(errs) > eb: bad.append((gid, errs[eb:eb+3]))
        print(gid, "ERR" if len(errs) > eb else "ok", flush=True)
    br.close()
finally:
    srv.terminate()
print("bad:", json.dumps(bad, ensure_ascii=False)[:3000]); print("finished within time:", len(finished), finished)
