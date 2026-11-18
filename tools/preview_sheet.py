# いくつものステップの1問目を撮って、1枚の一覧にする（目で確かめる用）
# 使い方: python tools/preview_sheet.py out.png "math:4:分度器" "math:5:面積を求め" ...
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
from PIL import Image
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} });"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1]; specs = sys.argv[2:]
PORT = 8815
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.6)
errs = []; ims = []
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = br.new_page(viewport={"width": 390, "height": 760}, device_scale_factor=1); pg.add_init_script(NOAUTH)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(700)
    for sp in specs:
      parts = sp.split(":"); s, g, pat = parts[0], int(parts[1]), parts[2]; k = int(parts[3]) if len(parts) > 3 else 0
      f = pg.evaluate("([s,g,pat]) => { const us = HM.SUBJECTS[s][g]; for (let ui = 0; ui < us.length; ui++) for (let si = 0; si < us[ui].steps.length; si++) if ((us[ui].n + '/' + us[ui].steps[si].n).includes(pat)) return [ui, si]; return null; }", [s, g, pat])
      if not f: print("not found", sp); continue
      pg.evaluate(f"HM_APP.startStep('{s}', {g}, {f[0]}, {f[1]}, {{noCard:true}})"); pg.wait_for_timeout(300)
      if k: pg.evaluate(f"(() => {{ const q = HM_APP.quiz(); q.i = {k} % q.qs.length; HM_APP.showQ(); }})()"); pg.wait_for_timeout(200)
      path = f"/tmp/_pv{len(ims)}.png"; pg.screenshot(path=path); ims.append(Image.open(path))
    br.close()
finally:
  srv.terminate()
cols = min(5, len(ims)); rows = (len(ims) + cols - 1) // cols
W, H = 390, 760; sheet = Image.new("RGB", (cols * W, rows * H), "white")
for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * W, (i // cols) * H))
sheet.save(out); print("saved", out, len(ims), "errors:", errs[:5])
