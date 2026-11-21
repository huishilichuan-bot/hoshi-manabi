# v1.6.0 英語4技能のスクリーンショット（iPhone 14 / iPad Pro 11 の WebKit）。各スキル・形式ごと
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-20',t:1}))}catch(e){}"
FAKE_SR = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_en4.py"), encoding="utf8").read().split('FAKE_SR = """')[1].split('"""')[0]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, "screenshots", "v16"); os.makedirs(OUT, exist_ok=True)
PORT = 8817
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
saved = []
def cur(pg): return pg.evaluate("(() => { const Q = HM_APP.quiz(); return Q.qs[Q.i]; })()")
def kind(q):
    if q["t"] == "tl": return "listen-tiles" if q.get("au") else "write-tiles"
    if q["t"] == "ty": return "listen-dictation" if q.get("au") else ("write-fill" if q.get("fill") else "write-type")
    if q["t"] == "sp": return "speak"
    if q.get("passage"): return "read-passage"
    if q.get("dlg"): return "listen-dialog"
    if q.get("au"): return "listen-meaning"
    if q.get("pics"): return "read-pickpic"
    if q.get("pic"): return "read-picture"
    return "read-meaning"
def solve(pg, q):
    pg.wait_for_timeout(1050)
    if q["t"] == "tl":
        for piece in q["pieces"]:
            pg.evaluate("(p) => { const b = [...document.querySelectorAll('.e4-pool [data-tw]')].find(x => x.textContent === p); b.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, clientX:1, clientY:1})); window.dispatchEvent(new PointerEvent('pointerup', {bubbles:true, clientX:1, clientY:1})); }", piece)
        pg.click("#work-ok")
    elif q["t"] == "ty": pg.fill("#e4in", q["a"]); pg.click("#work-ok")
    elif q["t"] == "sp": pg.evaluate("(s) => { window.__srSay = s; }", q["a"]); pg.click("#e4mic")
    else: pg.click(f'[data-mo="{q["opts"].index(q["a"])}"]')
    pg.wait_for_selector(".fb", timeout=4000); pg.wait_for_timeout(1300)
def shot(pg, name):
    p = f"{OUT}/{name}.png"; pg.screenshot(path=p); saved.append(p)
try:
  with sync_playwright() as p:
    br = p.webkit.launch()
    for devname, tag, plan in [("iPhone 14", "iphone", [(3, 3, 0), (3, 5, 1), (5, 5, 1), (7, 9, 2), (9, 0, 2), (9, 8, 1)]), ("iPad Pro 11", "ipad", [(4, 0, 0), (8, 9, 2), (9, 3, 2)])]:
        ctx = br.new_context(**p.devices[devname]); pg = ctx.new_page(); pg.add_init_script(NOAUTH); pg.add_init_script(FAKE_SR)
        pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(1200)
        seen = set()
        for g, ui, si in plan:
            # 最初の説明カードも1枚
            if (g, ui, si) == plan[0]:
                pg.evaluate(f"HM_APP.startStep('en', {g}, {ui}, {si})"); pg.wait_for_timeout(700); shot(pg, f"{tag}-00-card-g{g}")
                pg.click('[data-q="card-go"]'); pg.wait_for_timeout(500)
            else:
                pg.evaluate(f"HM_APP.startStep('en', {g}, {ui}, {si}, {{ noCard: true }})"); pg.wait_for_timeout(600)
            for n in range(12):
                q = cur(pg); k = kind(q)
                key = k + ("-g9" if k == "read-passage" and g == 9 else "")
                if key not in seen:
                    seen.add(key); pg.wait_for_timeout(300)
                    shot(pg, f"{tag}-{key}-g{g}-q"); solve(pg, q); pg.evaluate("document.querySelector('#quiz').scrollTop = 0"); pg.wait_for_timeout(200); shot(pg, f"{tag}-{key}-g{g}-a")
                else: solve(pg, q)
                pg.click('[data-q="next"]'); pg.wait_for_timeout(250)
        print(tag, sorted(seen))
        ctx.close()
    br.close()
finally:
    srv.terminate()
print("\n".join(saved))
