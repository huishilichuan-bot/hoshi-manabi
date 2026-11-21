# 新しい本格ゲーム8本を390×844でそれっぽく操作してプレイテスト（スクショ・エラー・結果画面まで）
import subprocess, sys, time, os, random, json
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-21',t:1}))}catch(e){}"  # 旧テストではログイン画面を出さない
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "screenshots", "pro"); os.makedirs(OUT, exist_ok=True)
PORT = 8767
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8); errs = []; report = {}
GAMES = sys.argv[1].split(",") if len(sys.argv) > 1 else ["baseball", "golf", "soccer", "bowling", "basket", "racing", "royale", "starfighter"]
DIFF = sys.argv[2] if len(sys.argv) > 2 else "normal"
LIMIT = float(sys.argv[3]) if len(sys.argv) > 3 else 90
def drag(pg, x0, y0, x1, y1, steps=8, hold=0):
    pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move(x1, y1, steps=steps)
    if hold: pg.wait_for_timeout(hold)
    pg.mouse.up()
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1, has_touch=True)
    pg = ctx.new_page(); pg.add_init_script(NOAUTH)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(600)
    pg.evaluate("(() => { const s = HM_APP.state(); s.days[HM_APP.today()] = { stars: 4, steps: {} }; HM_APP.save(); HM_APP.render(); })()")
    for gid in GAMES:
        eb = len(errs)
        pg.evaluate(f"HM_APP.startGame('{gid}','{DIFF}')"); pg.wait_for_timeout(400)
        cv = pg.locator("#gl-body canvas").first
        b = cv.bounding_box(); X, Y, W, H = b["x"], b["y"], b["width"], b["height"]
        t0 = time.time(); shots = [1.5, 8, 20]; k = 0; done = False
        while time.time() - t0 < LIMIT:
            el = time.time() - t0
            if k < len(shots) and el > shots[k]: pg.screenshot(path=f"{OUT}/{gid}-{DIFF}-{k}.png"); k += 1
            if gid == "baseball": pg.mouse.click(X + W * (0.4 + random.random() * 0.2), Y + H * 0.75); pg.wait_for_timeout(random.randint(150, 900))
            elif gid == "golf":
                bx = pg.evaluate("window.__proDbg && __proDbg.ball ? [__proDbg.ball.x, __proDbg.ball.y] : null")
                sx, sy = (X + bx[0], Y + bx[1]) if bx else (X + W / 2, Y + H * 0.8)
                drag(pg, sx, sy, sx + random.randint(-40, 40), sy + random.randint(60, 140)); pg.wait_for_timeout(2500)
            elif gid == "soccer":
                drag(pg, X + 70, Y + H - 90, X + 70 + random.randint(-50, 50), Y + H - 90 + random.randint(-50, 50), hold=random.randint(200, 700))
                pg.mouse.click(X + W - 60, Y + H - 90); pg.wait_for_timeout(100)
            elif gid in ("bowling", "basket"):
                drag(pg, X + W / 2 + random.randint(-30, 30), Y + H * 0.85, X + W / 2 + random.randint(-50, 50), Y + H * 0.4, steps=5); pg.wait_for_timeout(2200 if gid == "bowling" else 1300)
            elif gid == "racing":
                side = X + (W * 0.2 if random.random() < 0.5 else W * 0.8); pg.mouse.move(side, Y + H * 0.7); pg.mouse.down(); pg.wait_for_timeout(random.randint(200, 900)); pg.mouse.up(); pg.wait_for_timeout(random.randint(100, 400))
            elif gid == "royale":
                drag(pg, X + 80, Y + H - 100, X + 80 + random.randint(-55, 55), Y + H - 100 + random.randint(-55, 55), hold=random.randint(300, 900))
                drag(pg, X + W - 80, Y + H - 100, X + W - 80 + random.randint(-50, 50), Y + H - 100 + random.randint(-50, 50), hold=400)
            elif gid == "hockey":
                pg.mouse.move(X + W / 2, Y + H * 0.8); pg.mouse.down(); pg.mouse.move(X + random.random() * W, Y + H * (0.55 + random.random() * 0.4), steps=6); pg.mouse.up()
            elif gid in ("meteor",):
                drag(pg, X + W / 2, Y + H * 0.8, X + random.random() * W, Y + H * (0.5 + random.random() * 0.4), steps=8, hold=200)
            elif gid in ("highway",):
                pg.mouse.click(X + (W * 0.2 if random.random() < 0.5 else W * 0.8), Y + H * 0.7); pg.wait_for_timeout(random.randint(200, 700))
            elif gid in ("flappy", "runner"):
                pg.mouse.click(X + W / 2, Y + H / 2); pg.wait_for_timeout(random.randint(150, 500))
            elif gid == "snake":
                a, b2 = random.choice([(60, 0), (-60, 0), (0, 60), (0, -60)]); drag(pg, X + W / 2, Y + H / 2, X + W / 2 + a, Y + H / 2 + b2, steps=4); pg.wait_for_timeout(300)
            elif gid == "starfighter":
                drag(pg, X + W / 2, Y + H * 0.85, X + random.random() * W, Y + H * (0.6 + random.random() * 0.3), steps=10, hold=300)
            if pg.evaluate("!document.getElementById('gl-result').hidden"): done = True; break
        pg.wait_for_timeout(400); pg.screenshot(path=f"{OUT}/{gid}-{DIFF}-end.png")
        res = pg.evaluate("document.getElementById('gl-result').hidden ? null : document.getElementById('gl-result').innerText")
        report[gid] = {"secs": round(time.time() - t0, 1), "finished": done, "result": res, "errors": errs[eb:eb + 3]}
        print(gid, json.dumps(report[gid], ensure_ascii=False), flush=True)
        pg.evaluate("document.getElementById('gl-close').click()"); pg.wait_for_timeout(150)
    br.close()
finally:
    srv.terminate()
