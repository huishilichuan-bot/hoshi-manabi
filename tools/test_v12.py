# ほしまなび v1.2 — 新機能のテスト（ヘッドレスChrome 390×844・タッチ）
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-20',t:1}))}catch(e){}"  # 旧テストではログイン画面を出さない
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
    pg = ctx.new_page(); pg.add_init_script(NOAUTH)
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
        ok(f"{fmt}: 1秒以内はブロック", E("HM_APP.quiz().results.length") == n0 and "ちゃんと読んでね" in pg.inner_text("#toast-root"))
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
    # ---------- ここから v1.2 の機能 ----------
    def ans(correct):
        unblock(); q = cur()
        if q["t"] == "ch":
            opts = q.get("opts") or [q["a"]] + q["o"]
            tgt = q["a"] if correct else [o for o in opts if o != q["a"]][0]
            pg.locator(f'[data-opt="{opts.index(tgt)}"]').tap()
        elif q["t"] == "num":
            val = q["a"] if correct else ("9999" if q["a"] != "9999" else "1")
            for c in val: pg.locator({'-': '[data-key="-"]', '/': '[data-key="/"]', '.': '[data-key="."]'}.get(c, f'[data-key="{c}"]')).tap()
            pg.locator('[data-key="ok"]').tap()
        elif q["t"] == "tf":
            pg.locator(f'[data-tf="{q["a"] if correct else ("×" if q["a"] == "〇" else "〇")}"]').tap()
        elif q["t"] not in ("ord", "match", "pair", "tap"):
            # 新しい形式（並べかえ・ことばカード・漢字など）は、判定だけ固定してアプリの流れを確かめる
            E(f"(() => {{ const c = HMQ.cur(); const f = HMQ.fmt[c.q.t]; f._r = f.result; f.result = () => ({{ ok: {str(correct).lower()}, text: 'test' }}); const b = document.getElementById('work-ok'); if (b) b.disabled = false; }})()")
            if pg.locator('#work-ok').count(): pg.locator('#work-ok').tap()
            else: E(f"HMQ.cur().api.answer({{ ok: {str(correct).lower()}, text: 'test' }})")
            E("(() => { for (const f of Object.values(HMQ.fmt)) if (f._r) { f.result = f._r; delete f._r; } })()")
        else:
            solve(correct); unblock()
            if q["t"] != "tap" and not E("HM_APP.quiz().answered"): pg.locator('#work-ok').tap()
        pg.wait_for_timeout(80)
    # スプラッシュ
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(120)
    ok("スプラッシュ表示", pg.locator("#splash").count() == 1)
    pg.screenshot(path=f"{SHOT}/after-0-splash.png")
    pg.wait_for_timeout(1300); ok("スプラッシュが消える", pg.locator("#splash").count() == 0)
    ok("下タブ5つ（ホーム/学ぶ/ゲーム/なかま/マイページ）", pg.locator(".tab").count() == 5 and "学ぶ" in pg.inner_text("#tabbar") and "マイページ" in pg.inner_text("#tabbar"))
    ok("前の形式テストのまちがいもボックスに入っている", E("HM_APP.state().wrongBox.length") >= 3)
    E("HM_APP.state().wrongBox.length = 0; HM_APP.save()")
    tot0 = E("HM_APP.state().totalStars")
    # まとめカード（図つき）
    start_card = E(FIND, "分数/図で分数"); E("(l) => HM_APP.startStep(l[0], l[1], l[2], l[3])", start_card); pg.wait_for_timeout(500)
    ok("まとめカード（図・れい・解説・相棒）", pg.locator(".card-pt").count() == 1 and pg.locator(".card-pt svg").count() >= 1 and pg.locator(".cp-why").count() == 1 and pg.locator(".cp-char .bubble").count() == 1)
    pg.screenshot(path=f"{SHOT}/feat-1-matome-card.png")
    pg.locator('[data-q="card-go"]').tap(); pg.wait_for_timeout(200); ok("カード → 問題へ", pg.locator(".qz-q").count() == 1)
    E("HM_APP.quiz() && document.querySelector('[data-q=quit]').click()"); pg.wait_for_timeout(200)
    for nm in ["ことばのきまり/ことばの きまり", ]: pass
    # コンボ（3・5・10）
    loc = E("""() => { for (const [s, gs] of Object.entries(HM.SUBJECTS)) for (const [g, us] of Object.entries(gs)) for (let ui = 0; ui < us.length; ui++) for (let si = 0; si < us[ui].steps.length; si++) { const st = us[ui].steps[si]; if (typeof st.src === 'function' && (st.cnt||10) >= 10 && s === 'math') { const set = HM.makeSet(st); if (set.length >= 10 && set.every(q => q.t === 'ch' || q.t === 'num')) return [s, +g, ui, si]; } } return null; }""")
    E("(l) => HM_APP.startStep(l[0], l[1], l[2], l[3], {noCard:true})", loc); pg.wait_for_timeout(200)
    pops = {}
    for i in range(10):
        ans(True); pg.wait_for_timeout(350)
        if i + 1 in (3, 5, 10):
            pops[i + 1] = E("(() => { const d = document.querySelector('.combo-pop'); return d ? d.className : ''; })()")
            pg.screenshot(path=f"{SHOT}/feat-2-combo-{i+1}.png")
        if i < 9: nxt()
    ok("コンボ 3/5/10 で演出がだんだん大きく", "lv1" in pops.get(3, "") and "lv2" in pops.get(5, "") and "lv3" in pops.get(10, ""), pops)
    ok("コンボゲージ", pg.locator("#combo.lv3").count() == 1)
    ok("最高コンボを記録", E("HM_APP.state().bestCombo") >= 10)
    E("document.querySelector('[data-q=quit]').click()"); pg.wait_for_timeout(200)
    # まちがえた問題ボックス
    E("(l) => HM_APP.startStep(l[0], l[1], l[2], l[3], {noCard:true})", loc); pg.wait_for_timeout(200)
    ans(False); pg.wait_for_timeout(200)
    ok("まちがえた問題がボックスに入る", E("HM_APP.state().wrongBox.length") == 1)
    pg.once("dialog", lambda d: d.accept()); pg.locator('[data-q="quit"]').first.tap(); pg.wait_for_timeout(300)
    pg.locator('.tab[data-tab="home"]').tap(); pg.wait_for_timeout(400)
    ok("ホームにボックスのカード", pg.locator('.box-card').count() == 1)
    pg.screenshot(path=f"{SHOT}/feat-3-box-home.png")
    pg.locator('.box-card').tap(); pg.wait_for_timeout(300)
    ok("ボックスの問題画面", pg.locator(".retry-tag.box").count() == 1)
    ans(True); pg.wait_for_timeout(200)
    ok("正解でボックスから消える", E("HM_APP.state().wrongBox.length") == 0)
    nxt(); pg.wait_for_timeout(300)
    ok("ボックスのまとめ", pg.locator(".box-hero").count() == 1)
    pg.screenshot(path=f"{SHOT}/feat-3-box-done.png")
    ok("ボックスでは⭐がふえない", E("HM_APP.state().totalStars") == tot0)
    pg.locator('[data-q="quit"]').first.tap(); pg.wait_for_timeout(300)
    # ステップマップ
    pg.locator('.tab[data-tab="study"]').tap(); pg.wait_for_timeout(300)
    pg.locator('.subj[data-subj="math"]').tap(); pg.wait_for_timeout(60)
    ok("画面遷移中も横にはみ出さない（縮小されない）", E("document.documentElement.scrollWidth <= innerWidth"), E("[document.documentElement.scrollWidth, innerWidth]"))
    pg.wait_for_timeout(240); pg.locator('.grade[data-grade="3"]').tap(); pg.wait_for_timeout(300)
    pg.locator('[data-unit="0"]').tap(); pg.wait_for_timeout(500)
    ok("ステップマップ（道・現在地・ボス）", pg.locator(".smap").count() == 1 and pg.locator(".map-node.cur").count() == 1 and pg.locator(".map-node.boss").count() == 1 and pg.locator(".smap-path").count() == 1)
    ok("戻るボタンに前の画面名", "算数小3" in pg.inner_text("#back-btn"), pg.inner_text("#back-btn"))
    pg.screenshot(path=f"{SHOT}/feat-4-stepmap.png")
    # ステップ1に合格 → 光る
    pg.locator('[data-step="0"]').tap(); pg.wait_for_timeout(300); pg.locator('[data-q="card-go"]').tap(); pg.wait_for_timeout(200)
    n = E("HM_APP.quiz().n")
    for i in range(n):
        ans(True); pg.wait_for_timeout(60)
        nxt() if i < n - 1 else (pg.locator('[data-q="next"]').tap(), pg.wait_for_timeout(500))
    pg.locator('.sum [data-q="quit"]').tap(); pg.wait_for_timeout(600)
    ok("合格したステップが光る・現在地が次へ", pg.locator('.map-node.done[data-step="0"]').count() == 1 and pg.locator('.map-node.cur[data-step="1"]').count() == 1)
    pg.screenshot(path=f"{SHOT}/feat-4-stepmap-cleared.png")
    tot1 = E("HM_APP.state().totalStars")
    # ボス
    pg.locator('[data-boss]').tap(); pg.wait_for_timeout(400)
    ok("ボス登場（読み込み演出）", pg.locator(".boss-intro").count() == 1)
    pg.screenshot(path=f"{SHOT}/feat-5-boss-intro.png")
    pg.wait_for_timeout(1000)
    ok("ボスのHPバー", pg.locator("#bp-hp").count() == 1)
    hp0 = E("HM_APP.quiz().hp")
    ans(True); pg.wait_for_timeout(700)
    ok("正解でボスにヒット（HPがへる）", E("HM_APP.quiz().hp") == hp0 - 1)
    pg.screenshot(path=f"{SHOT}/feat-5-boss-hit.png")
    while E("HM_APP.quiz().hp") > 0:
        nxt(); ans(True); pg.wait_for_timeout(650)
    pg.locator('[data-q="next"]').tap(); pg.wait_for_timeout(500)
    ok("ボスをたおす → 称号・かんむり（見た目だけ）", pg.locator(".boss-end.win").count() == 1 and E("Object.keys(HM_APP.state().bossWins).length") == 1)
    ok("ボスでは⭐がふえない", E("HM_APP.state().totalStars") == tot1)
    pg.screenshot(path=f"{SHOT}/feat-5-boss-win.png")
    pg.locator('.sum [data-q="quit"]').tap(); pg.wait_for_timeout(500)
    ok("マップのボスにかんむり", pg.locator(".map-node.boss.won .mn-crown").count() == 1)
    # 英語の読み上げ・聞きとり
    E("(() => { window.__said = []; speechSynthesis.speak = (u) => { window.__said.push(u.text + '|' + u.lang); }; return 1; })()")
    # v1.6.0：英語は4技能。リスニングは「聞く」ボタンで en-US 読み上げ、英文は画面に出さない
    E("HM_APP.startStep('en', 3, 0, 0, {noCard:true})"); pg.wait_for_timeout(300)
    au = E("(() => { const Q = HM_APP.quiz(); const k = Q.qs.findIndex(q => q.skill === 'L' && q.t === 'tl'); const t = Q.qs[k]; Q.qs[k] = Q.qs[0]; Q.qs[0] = t; HM_APP.showQ(); return t.au; })()"); pg.wait_for_timeout(300)
    ok("聞きとり問題（大きい「聞く」ボタン・英語は文字で出さない）", pg.locator(".e4-au.big .e4-play").count() == 1 and au not in pg.inner_text("#quiz"))
    pg.locator(".e4-play").tap(); pg.wait_for_timeout(1600)  # 声の一覧を待ってから話す（最大1.2秒）
    ok("タップで en-US 読み上げ", (E("window.__said.filter(s => s.trim().charAt(0) !== '|')") or [""])[-1] == au + "|en-US", E("window.__said"))
    pg.screenshot(path=f"{SHOT}/feat-6-listening.png")
    E("document.querySelector('[data-q=quit]').click()"); pg.wait_for_timeout(200)
    # マイページ・設定
    pg.locator('.tab[data-tab="settings"]').tap(); pg.wait_for_timeout(400)
    ok("マイページ（プロフィール・記録）", pg.locator(".ios-profile").count() == 1 and pg.locator(".me-stats > div").count() == 4)
    pg.locator("#vol").fill("0.3"); pg.wait_for_timeout(100)
    ok("音量を保存", abs(E("HM_APP.state().settings.vol") - 0.3) < 1e-9)
    ok("横にはみ出さない", E("document.documentElement.scrollWidth <= innerWidth"))
    pg.screenshot(path=f"{SHOT}/after-5-settings.png", full_page=True)
    # 読み上げできない端末
    ctx2 = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    ctx2.add_init_script("delete window.speechSynthesis; delete window.SpeechSynthesisUtterance;")
    pg2 = ctx2.new_page(); pg2.add_init_script(NOAUTH); pg2.on("pageerror", lambda e: errors.append(str(e)))
    pg2.goto(f"http://localhost:{PORT}/index.html"); pg2.wait_for_timeout(1200)
    pg2.evaluate("HM_APP.startStep('en', 3, 0, 0, {noCard:true})"); pg2.wait_for_timeout(300)
    pg2.evaluate("(() => { const Q = HM_APP.quiz(); const k = Q.qs.findIndex(q => q.skill === 'L' && q.t === 'tl'); const t = Q.qs[k]; Q.qs[k] = Q.qs[0]; Q.qs[0] = t; HM_APP.showQ(); return t.au; })()"); pg2.wait_for_timeout(300)
    t2 = pg2.inner_text("#quiz")
    ok("読み上げなしでも文字で出す（否定的な文なし）", pg2.locator(".say-text").count() == 1 and "できません" not in t2 and "使えません" not in t2)
    pg2.screenshot(path=f"{SHOT}/feat-6-fallback.png")
    ctx2.close()
    br.close()
finally:
    srv.terminate()
ok("JSエラーなし", not errors, errors[:5])
bad = [r for r in results if not r[1]]
print(f"{len(results)-len(bad)}/{len(results)} PASS")
sys.exit(1 if bad else 0)
