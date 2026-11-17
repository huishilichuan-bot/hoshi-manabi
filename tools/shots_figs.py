# 図つき問題のスクショ（screenshots/v12/fig-*.png）
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SHOT = os.path.join(ROOT, "screenshots", "v12")
PORT = 8775
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
FIND = """(name) => { for (const [s, gs] of Object.entries(HM.SUBJECTS)) for (const [g, us] of Object.entries(gs)) for (let ui = 0; ui < us.length; ui++) for (let si = 0; si < us[ui].steps.length; si++) if ((us[ui].n + '/' + us[ui].steps[si].n) === name) return [s, +g, ui, si]; return null; }"""
L = [("japan", "47都道府県（表で練習）/地図で地方をタップ"), ("world", "世界の姿/地図で大陸をタップ"), ("compass", "わたしたちのまち/方位をタップ"), ("insect", "こん虫の育ち方とつくり/体のつくりをタップ"), ("flower", "花から実へ/花のつくりをタップ"), ("body", "人や動物の体/体の中をタップ"), ("moon", "月と星/月の形をタップ・ならべる"), ("circuit", "電気とじしゃく/明かりがつく回路"), ("lever", "てこと電気の利用/図でてこのつり合い"), ("thermo", "天気と気温/温度計を読もう"), ("fraction", "分数/図で分数"), ("triangle", "面積/図で三角形の面積"), ("angle", "角の大きさ/図を見て角度"), ("graph", "1次関数/グラフから式を読む"), ("emoji", "いろいろな単語/絵と英語をつなごう"), ("sentence", "文法いろいろ/英文のならべかえ")]
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True).new_page()
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(1200)
    for nm, step in L:
        loc = pg.evaluate(FIND, step)
        if not loc: print("NOT FOUND", step); continue
        pg.evaluate("(l) => HM_APP.startStep(l[0], l[1], l[2], l[3], {noCard:true})", loc); pg.wait_for_timeout(500)
        pg.screenshot(path=f"{SHOT}/fig-{nm}.png")
        pg.evaluate("document.querySelector('[data-q=quit]').click()"); pg.wait_for_timeout(150)
    print("errors", errs)
    br.close()
finally: srv.terminate()
