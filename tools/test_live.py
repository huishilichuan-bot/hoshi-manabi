# 公開サイトを新しいプロファイル（キャッシュなし）で開いて確認
import json, sys
from playwright.sync_api import sync_playwright
URL = "https://huishilichuan-bot.github.io/hoshi-manabi/"
OUT = "/workspace/hoshi-manabi/screenshots/live"
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL + "?v=" + sys.argv[1] if len(sys.argv) > 1 else URL, wait_until="networkidle"); pg.wait_for_timeout(1500)
    info = pg.evaluate("""(() => { const out = {}; let empty = []; for (const [s, gs] of Object.entries(HM.SUBJECTS)) { if (s.startsWith('__')) continue; for (const [g, us] of Object.entries(gs)) { let q = 0, steps = 0; us.forEach((u, ui) => u.steps.forEach((st, si) => { steps++; const set = HM.makeSet(st, 1234 + si); q += set.length; if (!set.length) empty.push(s + g + ':' + u.n + '/' + st.n); })); out[s + g] = [us.length, steps, q]; } } return { out, empty, games: HM_APP.GAMES.length, ver: document.body.innerText.match(/v1\\.\\d\\.\\d/)?.[0] }; })()""")
    pg.screenshot(path=f"{OUT}/home.png")
    pg.click('.tab[data-tab="study"]'); pg.wait_for_timeout(700); pg.screenshot(path=f"{OUT}/study.png")
    pg.evaluate("(() => { const s = HM_APP.state(); s.days[HM_APP.today()] = { stars: 4, steps: {} }; HM_APP.save(); HM_APP.render(); })()")
    pg.click('.tab[data-tab="games"]'); pg.wait_for_timeout(1500); pg.screenshot(path=f"{OUT}/games.png")
    sw = pg.evaluate("navigator.serviceWorker.getRegistration().then(r => !!r)")
    caches = pg.evaluate("caches.keys()")
    print(json.dumps({"ver": info["ver"], "games": info["games"], "empty": info["empty"][:10], "sw": sw, "caches": caches, "errors": errs[:5]}, ensure_ascii=False))
    print(json.dumps(info["out"], ensure_ascii=False))
    br.close()
