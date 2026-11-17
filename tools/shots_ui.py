# UI のスクショ（before/after 用）：python tools/shots_ui.py before|after
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tag = sys.argv[1]; SHOT = os.path.join(ROOT, "screenshots", "v12"); os.makedirs(SHOT, exist_ok=True)
PORT = 8774
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(2500)
    pg.screenshot(path=f"{SHOT}/{tag}-1-home.png")
    pg.locator('[data-tab="study"]').first.click(); pg.wait_for_timeout(600); pg.screenshot(path=f"{SHOT}/{tag}-2-study.png")
    pg.locator('.subj[data-subj="math"]').first.click(); pg.wait_for_timeout(500); pg.locator('.grade[data-grade="3"]').first.click(); pg.wait_for_timeout(500)
    pg.locator('[data-unit="0"]').first.click(); pg.wait_for_timeout(600); pg.screenshot(path=f"{SHOT}/{tag}-3-steps.png")
    pg.locator('[data-tab="games"]').first.click(); pg.wait_for_timeout(600); pg.screenshot(path=f"{SHOT}/{tag}-4-games.png")
    for t in ["zukan", "me", "settings", "collection"]:
        if pg.locator(f'[data-tab="{t}"]').count(): pg.locator(f'[data-tab="{t}"]').first.click(); pg.wait_for_timeout(600); pg.screenshot(path=f"{SHOT}/{tag}-5-{t}.png")
    br.close()
finally: srv.terminate()
