# 指定した教科・学年・ステップ名（部分一致）の問題を、アプリの画面で撮る（目で確かめる用）
# 使い方: python tools/preview.py math 4 "分度器" 3 [out_dir]
import subprocess, sys, time, os, json
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} });"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
subj, grade, pat = sys.argv[1], int(sys.argv[2]), sys.argv[3]; n = int(sys.argv[4]) if len(sys.argv) > 4 else 2
OUT = sys.argv[5] if len(sys.argv) > 5 else "/tmp/prev"; os.makedirs(OUT, exist_ok=True)
PORT = 8814
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.6)
errs = []
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = br.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2); pg.add_init_script(NOAUTH)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(700)
    found = pg.evaluate("([s,g,pat]) => { const us = HM.SUBJECTS[s][g]; const out = []; us.forEach((u, ui) => u.steps.forEach((st, si) => { if ((u.n + '/' + st.n).includes(pat)) out.push([ui, si, u.n + '/' + st.n]); })); return out; }", [subj, grade, pat])
    print(found[:8])
    k = 0
    for ui, si, nm in found[:4]:
      pg.evaluate(f"HM_APP.startStep('{subj}', {grade}, {ui}, {si}, {{noCard:true}})"); pg.wait_for_timeout(350)
      for i in range(n):
        pg.screenshot(path=f"{OUT}/p{k}.png"); k += 1
        pg.evaluate("(() => { const q = HM_APP.quiz(); q.i = (q.i + 1) % q.qs.length; HM_APP.showQ && HM_APP.showQ(); })()"); pg.wait_for_timeout(250)
    br.close()
finally:
  srv.terminate()
print("errors:", errs[:5])
