# ほしまなび — ヘッドレスChrome（390×844）での自動テスト
import json, subprocess, sys, time, os, random
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-20',t:1}))}catch(e){}"  # 旧テストではログイン画面を出さない
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOT = os.path.join(ROOT, "screenshots"); os.makedirs(SHOT, exist_ok=True)
PORT = 8765
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
results = []; errors = []
def ok(name, cond, info=""):
    results.append((name, bool(cond), info)); print(("PASS " if cond else "FAIL ") + name + (" :: " + str(info) if info else ""))
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); pg.add_init_script(NOAUTH)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(1200)
    E = pg.evaluate
    ok("ホーム表示", pg.locator(".hx").count() == 1 and pg.locator(".today2").count() == 1)
    pg.screenshot(path=f"{SHOT}/01-home.png")
    # ナビゲーション：教科→学年→単元→ステップ
    pg.click('.tab[data-tab="study"]'); pg.wait_for_timeout(200)
    pg.click('.subj[data-subj="math"]'); pg.wait_for_timeout(200)
    ok("学年一覧（算数・数学 9学年）", pg.locator(".grade").count() == 9, pg.locator(".grade").count())
    pg.click('.grade[data-grade="3"]'); pg.wait_for_timeout(200)
    nunits = pg.locator(".row-btn").count(); ok("単元一覧", nunits > 5, nunits)
    pg.click('.row-btn[data-unit="0"]'); pg.wait_for_timeout(200)
    ok("ステップ一覧", pg.locator(".map-node.step").count() >= 2)
    pg.screenshot(path=f"{SHOT}/02-steps.png")
    pg.click('[data-step="0"]'); pg.wait_for_timeout(300)
    ok("まとめカード", pg.locator(".card-pt").count() == 1 and pg.locator('[data-q="card-go"]').count() == 1)
    pg.click('[data-q="card-go"]'); pg.wait_for_timeout(200)
    ok("クイズ画面", pg.locator(".qz-q").is_visible())
    # 1秒ブロック
    n0 = E("HM_APP.quiz().results.length")
    t = E("HM_APP.quiz().qs[0].t")
    if t == "ch": pg.locator(".opt").first.click()
    else: pg.click('[data-key="1"]'); pg.click('[data-key="ok"]'); pg.click('[data-key="del"]')
    pg.wait_for_timeout(150)
    ok("1秒以内の回答をブロック", E("HM_APP.quiz().results.length") == n0 and "ちゃんと読んでね" in pg.inner_text("#toast-root"))
    pg.screenshot(path=f"{SHOT}/03-question.png")
    def answer(correct):
        q = E("(() => { const Q = HM_APP.quiz(); Q.shownAt -= 5000; const l = Q.mode==='main'?Q.qs:Q.retry; return l[Q.i]; })()")
        if q["t"] == "ch":
            opts = q.get("opts") or [q["a"]] + q["o"]
            target = q["a"] if correct else [o for o in opts if o != q["a"]][0]
            idx = opts.index(target); pg.click(f'[data-opt="{idx}"]')
        else:
            val = q["a"] if correct else ("9999" if q["a"] != "9999" else "1")
            for ch in val:
                pg.click({'-': '[data-key="-"]', '/': '[data-key="/"]', '.': '[data-key="."]'}.get(ch, f'[data-key="{ch}"]'))
            pg.click('[data-key="ok"]')
        pg.wait_for_timeout(60)
    def next_():
        pg.click('[data-q="next"]'); pg.wait_for_timeout(60)
    # 1問目 正解 → ⭕
    answer(True); pg.wait_for_timeout(120)
    ok("正解で⭕表示", pg.locator(".big-maru").count() == 1 and pg.locator(".fb.ok").count() == 1)
    pg.screenshot(path=f"{SHOT}/04-correct.png")
    pg.click('[data-q="ex"]'); ok("解説を見るボタン", pg.locator(".ex-wrap").is_visible())
    next_()
    n = E("HM_APP.quiz().n"); need = E("HM_APP.quiz().need")
    ok("合格ラインが6割切り上げ", need == -(-6 * n // 10), f"{need}/{n}")
    # 合計 need-1 問正解にして不合格にする
    for i in range(1, n):
        answer(i < need - 1)
        if i == n - 1:
            ok("不正解で正解と解説", pg.locator(".fb.ng .fb-ex").count() == 1)
            pg.screenshot(path=f"{SHOT}/05-wrong.png")
        next_()
    pg.wait_for_timeout(300)
    ok("まとめ画面", pg.locator(".sum").count() == 1)
    ok("6割未満では⭐なし", E("HM_APP.starsToday()") == 0)
    pg.click('[data-q="retry"]'); pg.wait_for_timeout(200)
    answer(True); pg.wait_for_timeout(300)
    ok("やり直しで合計6割になった時点で⭐", E("HM_APP.starsToday()") == 1)
    rq = E("HM_APP.quiz().retry.length")
    for i in range(rq):
        if i > 0: answer(False)
        next_()
    pg.wait_for_timeout(300)
    pg.screenshot(path=f"{SHOT}/06-summary.png")
    ok("ガチャ回数+1", E("HM_APP.pullsLeft()") == 1)
    # 同じステップは1日1回
    pg.click('[data-q="again"]'); pg.wait_for_timeout(200)
    for i in range(E("HM_APP.quiz().n")): answer(True); next_()
    pg.wait_for_timeout(200)
    ok("同じステップの⭐は1日1回", E("HM_APP.starsToday()") == 1)
    pg.click('[data-q="quit"]'); pg.wait_for_timeout(200)
    # 別のステップで⭐を3つ → 合計4でゲーム解放
    pg.click('.tab[data-tab="games"]'); pg.wait_for_timeout(200)
    ok("⭐4未満はゲームにロック", pg.locator(".app-ic.locked").count() == 50 and not E("HM_APP.gamesOpen()"), pg.locator(".app-ic").count())
    pg.screenshot(path=f"{SHOT}/07-games-locked.png")
    for (s, g, u, st) in [("ja", 7, 0, 0), ("en", 7, 1, 0), ("sci", 5, 0, 0)]:
        E(f"HM_APP.startStep('{s}',{g},{u},{st},{{noCard:true}})"); pg.wait_for_timeout(150)
        for i in range(E("HM_APP.quiz().n")): answer(True); next_()
        pg.wait_for_timeout(200)
        if pg.locator('[data-q="quit"]').count(): pg.click('.sum [data-q="quit"]')
        pg.wait_for_timeout(150)
    ok("⭐4でゲーム解放", E("HM_APP.starsToday()") == 4 and E("HM_APP.gamesOpen()"))
    pg.click('.tab[data-tab="games"]'); pg.wait_for_timeout(200)
    ok("ゲーム50個のアイコン（ロック解除）", pg.locator(".app-ic").count() == 50 and pg.locator(".app-ic.locked").count() == 0)
    pg.screenshot(path=f"{SHOT}/08-games-open.png")
    # ⭐を減らさない・日付リセット
    total = E("HM_APP.state().totalStars")
    E("HM_APP.setClockOffset(86400000)"); pg.wait_for_timeout(200)
    ok("翌日は⭐0・ゲームロック", E("HM_APP.starsToday()") == 0 and not E("HM_APP.gamesOpen()"))
    ok("累計⭐は減らない", E("HM_APP.state().totalStars") == total, total)
    E("HM_APP.setClockOffset(0)"); pg.wait_for_timeout(200)
    # ガチャの確率（drawRarity を100万回）
    dist = E("""(() => { const r = HM_APP.rates(), c = [0,0,0,0,0,0,0], c2 = [0,0,0,0,0,0,0]; const N = 1000000; for (let i=0;i<N;i++){ c[HM_APP.drawRarity(r.normal, Math.random())]++; c2[HM_APP.drawRarity(r.sr, Math.random())]++; } return {n: c.map(x=>x/N*100), sr: c2.map(x=>x/N*100), rates: r}; })()""")
    dev = max(abs(a - b) for a, b in zip(dist["n"], dist["rates"]["normal"]))
    dev2 = max(abs(a - b) for a, b in zip(dist["sr"], dist["rates"]["sr"]))
    ok("ガチャ確率（通常）が表示どおり", dev < 0.2, "最大ずれ %.3f%%" % dev)
    ok("ガチャ確率（10回目SR以上）", dev2 < 0.25 and dist["sr"][0] == 0 and dist["sr"][1] == 0, "最大ずれ %.3f%%" % dev2)
    ok("確率の合計100%", abs(sum(dist["rates"]["normal"]) - 100) < 1e-9)
    # ガチャを引く（演出）
    pg.click('.tab[data-tab="gacha"]'); pg.wait_for_timeout(200)
    left = E("HM_APP.pullsLeft()"); ok("ガチャ回数＝⭐の数", left == 4, left)
    pg.click('[data-g="1"]'); pg.wait_for_timeout(400); pg.click("#gacha-show"); pg.wait_for_timeout(600)
    pg.screenshot(path=f"{SHOT}/09-gacha.png")
    pg.click("#gs-close"); pg.wait_for_timeout(200)
    ok("ガチャで回数が減る", E("HM_APP.pullsLeft()") == 3)
    ok("ゲーム側の有利はすべて0", E("Object.entries(GF.advantage()).filter(([k,v])=>typeof v==='number' && k!=='level' && v!==0).length") == 0)
    pg.click('[data-g="rates"]'); pg.wait_for_timeout(300)
    ok("確率表を画面に表示", pg.locator("#rates-normal tr").count() == 8)
    pg.screenshot(path=f"{SHOT}/10-rates.png")
    E("document.querySelector('.sheet-close').click()"); pg.wait_for_timeout(300)
    # 報告
    E("HM_APP.startStep('math',1,0,0,{noCard:true})"); pg.wait_for_timeout(200)
    pg.click('#quiz .qz-q'); answer(True); pg.click('[data-q="report"]'); pg.wait_for_timeout(300)
    pg.click('.chip[data-c="答えがちがう"]'); pg.click("#rep-save"); pg.wait_for_timeout(300)
    ok("報告を端末に保存", E("HM_APP.state().reports.length") == 1)
    pg.click('[data-q="quit"]') if pg.locator('.qz-head [data-q="quit"]').count() == 0 else None
    pg.on("dialog", lambda d: d.accept())
    E("document.querySelector('.qz-x') && document.querySelector('.qz-x').click()"); pg.wait_for_timeout(200)
    pg.click('.tab[data-tab="settings"]'); pg.wait_for_timeout(200)
    ok("設定に報告一覧", pg.locator(".rep").count() == 1)
    # 全50ゲーム × 4難易度 を開いてエラーがないか
    ids = E("HM_APP.GAMES.map(g=>g.id)")
    ok("ゲームは50種・重複なし", len(ids) == 50 and len(set(ids)) == 50, len(ids))
    errors_before = len(errors)
    bad = []
    for gid in ids:
        for diff in ["easy", "normal", "hard", "ultra"]:
            eb = len(errors)
            E(f"HM_APP.startGame('{gid}','{diff}')"); pg.wait_for_timeout(250)
            vis = E("!document.getElementById('game-layer').hidden && document.getElementById('gl-body').children.length > 0")
            # 中をランダムにタップ
            for k in range(6):
                box = pg.locator("#gl-body").bounding_box()
                if box: pg.mouse.click(box["x"] + random.random() * box["width"], box["y"] + 40 + random.random() * max(10, min(box["height"], 600) - 50))
                pg.wait_for_timeout(40)
            pg.wait_for_timeout(150)
            if diff == "normal" and gid in ("connect4", "hex", "mancala", "pyramid", "fall", "hockey"):
                pg.screenshot(path=f"{SHOT}/game-{gid}.png")
            E("document.getElementById('gl-close').click()"); pg.wait_for_timeout(60)
            if not vis or len(errors) > eb: bad.append((gid, diff, errors[eb:]))
    ok("全50ゲーム×4難易度が開けてエラーなし", not bad, bad[:5])
    ok("ページ全体でJSエラーなし", not errors, errors[:5])
    br.close()
finally:
    srv.terminate()
passed = sum(1 for r in results if r[1])
print(f"\n{passed}/{len(results)} passed")
json.dump({"passed": passed, "total": len(results), "results": results, "errors": errors[:20]}, open(os.path.join(ROOT, "tools", "test-report.json"), "w"), ensure_ascii=False, indent=1)
sys.exit(0 if passed == len(results) else 1)
