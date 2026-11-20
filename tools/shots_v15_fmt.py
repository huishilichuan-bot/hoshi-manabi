# v1.5 新しい問題形式（〇×・なかま分け・文字カード・全部えらぶ・数直線・漢字）を実際に操作して画面を撮る
import subprocess, sys, time, os, json
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-20',t:1}))}catch(e){}"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, "screenshots", "v15"); os.makedirs(OUT, exist_ok=True)
PORT = 8813
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
errs = []; res = []
def chk(name, cond):
    res.append((name, bool(cond))); print(("OK  " if cond else "NG  ") + name, flush=True)
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = br.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2, has_touch=False); pg.add_init_script(NOAUTH)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(800)
    E = pg.evaluate
    # 漢字（小1「なぞる」）：お手本の線をそのままなぞる
    E("HM_APP.startStep('ja', 1, 0, 0, {noCard:true})"); pg.wait_for_timeout(300)
    pg.wait_for_timeout(400)
    q = E("HM_APP.quiz().qs[0]"); chk("kanji question", q["t"] == "kanji" and q["mode"] == "trace")
    pg.wait_for_function("window.HMK && HMK.data[" + json.dumps(q["a"]) + "]", timeout=5000)
    pg.wait_for_timeout(1200)
    pg.screenshot(path=f"{OUT}/fmt-kanji-demo.png")
    pg.wait_for_function("document.getElementById('kj-msg').textContent.includes('なぞろう')", timeout=20000)
    box = pg.locator("#kj-cv").bounding_box(); S = box["width"]
    strokes = E("(k) => HMK.data[k].map((d) => HMK.pathPts(d, 3))", q["a"])
    for st in strokes:
        x0, y0 = st[0]; pg.mouse.move(box["x"] + x0 * S / 109, box["y"] + y0 * S / 109); pg.mouse.down()
        for x, y in st[1:]: pg.mouse.move(box["x"] + x * S / 109, box["y"] + y * S / 109)
        pg.mouse.up()
    pg.wait_for_timeout(100); pg.screenshot(path=f"{OUT}/fmt-kanji-traced.png")
    E("document.getElementById('work-ok').click()"); pg.wait_for_timeout(300)
    chk("kanji trace judged correct", E("HM_APP.quiz().results[0] && HM_APP.quiz().results[0].ok"))
    pg.screenshot(path=f"{OUT}/fmt-kanji-result.png")
    # 書く（小1「書く」）：わざと1画たりない
    E("HM_APP.startStep('ja', 1, 0, 1, {noCard:true})"); pg.wait_for_timeout(300)
    q = E("HM_APP.quiz().qs[0]"); pg.wait_for_function("window.HMK && HMK.data[" + json.dumps(q["a"]) + "]", timeout=5000); pg.wait_for_timeout(1300)
    box = pg.locator("#kj-cv").bounding_box(); S = box["width"]
    strokes = E("(k) => HMK.data[k].map((d) => HMK.pathPts(d, 3))", q["a"])
    for st in strokes[:-1] if len(strokes) > 1 else strokes[:0] + [strokes[0][::-1]]:
        x0, y0 = st[0]; pg.mouse.move(box["x"] + x0 * S / 109 * 0.9 + 8, box["y"] + y0 * S / 109 * 0.9 + 8); pg.mouse.down()
        for x, y in st[1:]: pg.mouse.move(box["x"] + x * S / 109 * 0.9 + 8, box["y"] + y * S / 109 * 0.9 + 8)
        pg.mouse.up()
    E("document.getElementById('work-ok').click()"); pg.wait_for_timeout(300)
    chk("kanji write wrong judged wrong", E("HM_APP.quiz().results[0] && HM_APP.quiz().results[0].ok === false"))
    pg.screenshot(path=f"{OUT}/fmt-kanji-wrong.png")
    br.close()
finally:
  srv.terminate()
print("errors:", errs[:5]); print("RESULT", sum(1 for _, c in res if c), "/", len(res))
