# ほしまなび v1.2 — 新機能のテスト（ヘッドレスChrome 390×844・タッチ）
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOT = os.path.join(ROOT, "screenshots", "v12"); os.makedirs(SHOT, exist_ok=True)
PORT = 8773
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
results = []; errors = []
def ok(name, cond, info=""):
    results.append((name, bool(cond))); print(("PASS " if cond else "FAIL ") + name + (" :: " + str(info) if info else ""))
FIND = """(name) => { for (const [s, gs] of Object.entries(HM.SUBJECTS)) for (const [g, us] of Object.entries(gs)) for (let ui = 0; ui < us.length; ui++) for (let si = 0; si < us[ui].steps.length; si++) if ((us[ui].n + '/' + us[ui].steps[si].n) === name) return [s, +g, ui, si]; return null; }"""
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(1200)
    E = pg.evaluate
    def start(name):
        loc = E(FIND, name); assert loc, name
        E("(l) => HM_APP.startStep(l[0], l[1], l[2], l[3])", loc); pg.wait_for_timeout(250)
        skip_card()
    def skip_card():
        if pg.locator('[data-q="card-go"]').count(): pg.locator('[data-q="card-go"]').tap(); pg.wait_for_timeout(200)
    def cur(): return E("(() => { const Q = HM_APP.quiz(); const l = Q.mode==='retry'?Q.retry:Q.qs; return l[Q.i]; })()")
    def unblock(): E("HM_APP.quiz().shownAt -= 5000")
    def solve(correct):
        q = cur(); t = q["t"]
        if t == "ord":
            items = q["items"][:] if correct else list(reversed(q["items"]))
            for it in items: pg.locator('.ord-chip[data-ow]', has_text=it).first.tap() if False else pg.locator(f'[data-ow="{q["items"].index(it)}"]').tap()
        elif t == "match":
            n = len(q["pairs"])
            for i in range(n):
                j = i if correct else (i + 1) % n
                pg.locator(f'[data-ml="{i}"]').tap(); pg.locator(f'[data-mr="{j}"]').tap()
        elif t == "pair":
            cards = E("HM_APP.quiz().work.cards")
            if correct:
                for i in range(len(q["pairs"])):
                    ks = [k for k, c in enumerate(cards) if c[0] == i]
                    pg.locator(f'[data-pc="{ks[0]}"]').tap(); pg.locator(f'[data-pc="{ks[1]}"]').tap()
            else:
                ks = list(range(len(cards)))
                for a in range(0, len(ks), 2):
                    pg.locator(f'[data-pc="{ks[a]}"]').tap(); pg.locator(f'[data-pc="{ks[a+1]}"]').tap()
                if E("(() => { const w = HM_APP.quiz().work; return w.cards.every((c,k)=>w.cards[w.mate[k]][0]===c[0]); })()"):
                    return solve_pair_wrong(cards)
        elif t == "tap":
            target = q["ans"] if correct else [h[0] for h in q["hits"] if h[0] != q["ans"]][0]
            pg.locator(f'.tapfig [data-hit="{target}"]').first.tap(force=True); pg.wait_for_timeout(80); return
        pg.locator('#work-ok').tap(); pg.wait_for_timeout(80)
    def solve_pair_wrong(cards): pass
    def nxt(): pg.locator('[data-q="next"]').tap(); pg.wait_for_timeout(120); skip_card()
    for fmt, name in [("ord", "かずとすうじ（10まで）/ならべかえ チャレンジ"), ("match", "かけ算/九九を線でつなごう"), ("pair", "たしざん/カードあわせ"), ("tap", "比例と反比例/座標の点をタップ")]:
        start(name)
        q = cur(); ok(f"{fmt}: 形式どおり表示", q["t"] == fmt and (pg.locator("#work").count() == 1 or pg.locator(".tapfig").count() == 1))
        n0 = E("HM_APP.quiz().results.length")
        solve(True); pg.wait_for_timeout(120)
        ok(f"{fmt}: 2秒以内はブロック", E("HM_APP.quiz().results.length") == n0 and "ちゃんと読んでね" in pg.inner_text("#toast-root"))
        pg.screenshot(path=f"{SHOT}/fmt-{fmt}-1.png")
        unblock()
        if fmt == "tap": pg.locator(f'.tapfig [data-hit="{q["ans"]}"]').first.tap(force=True)
        else: pg.locator('#work-ok').tap()
        pg.wait_for_timeout(150)
        ok(f"{fmt}: 正解で⭕", pg.locator(".big-maru").count() == 1 and E("HM_APP.quiz().results.slice(-1)[0].ok") is True)
        pg.wait_for_timeout(700); pg.screenshot(path=f"{SHOT}/fmt-{fmt}-2-correct.png")
        ok(f"{fmt}: 報告ボタンと解説", pg.locator('[data-q="report"]').count() >= 1 and pg.locator('[data-q="ex"]').count() == 1)
        nxt(); unblock()
        if fmt != "pair":
            solve(False); pg.wait_for_timeout(150)
            ok(f"{fmt}: まちがいの判定", E("HM_APP.quiz().results.slice(-1)[0].ok") is False and pg.locator(".fb.ng").count() == 1)
            pg.screenshot(path=f"{SHOT}/fmt-{fmt}-3-wrong.png")
        E("HM_APP.quit && HM_APP.quit()")
        pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(500)
    br.close()
finally:
    srv.terminate()
ok("JSエラーなし", not errors, errors[:5])
bad = [r for r in results if not r[1]]
print(f"{len(results)-len(bad)}/{len(results)} PASS")
sys.exit(1 if bad else 0)
