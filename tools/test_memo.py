# 計算メモ v1.5.2 のテスト（iPhone 14 / iPad Pro 11 の WebKit）
# 専用メモ欄が問題・答えの欄の下にあり重ならない／高さ／描画・色・太さ・消しゴム・戻す・全部消す／
# 書いても画面が動かない／自動で伸びる・下に広げる／2本指スクロール／問題ごとの自動クリア／答えの欄に戻れる
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-21',t:1}))}catch(e){}"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, "screenshots", "v152"); os.makedirs(OUT, exist_ok=True)
PORT = 8815
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
fails = []; errs = []
def ok(name, c, extra=""):
    print(("OK  " if c else "NG  ") + name + (" " + str(extra) if extra != "" else ""), flush=True)
    if not c: fails.append(name)
INK = "(() => { const c = document.querySelector('.memo-cv'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 0) n++; return n; })()"
def cvbox(pg): return pg.evaluate("(() => { const r = document.querySelector('.memo-cv').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()")
def stroke(pg, x0, y0, x1, y1, steps=8):
    pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move((x0 + x1) / 2, (y0 + y1) / 2 + 20, steps=steps); pg.mouse.move(x1, y1, steps=steps); pg.mouse.up()
def to_panel(pg, off=0):
    pg.evaluate(f"(() => {{ const q = document.querySelector('#quiz'), p = document.querySelector('.memo-panel'); q.scrollTop += p.getBoundingClientRect().top - 8 + {off}; }})()"); pg.wait_for_timeout(300)
try:
  with sync_playwright() as p:
    br = p.webkit.launch()
    for devname, tag in [("iPhone 14", "iphone"), ("iPad Pro 11", "ipad")]:
        ctx = br.new_context(**p.devices[devname]); pg = ctx.new_page(); pg.add_init_script(NOAUTH)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(1000)
        pg.evaluate("HM_APP.startStep('math', 3, 1, 0, { noCard: true })"); pg.wait_for_timeout(700)
        ok(tag + " 算数でメモ欄が出る", pg.is_visible(".memo-panel"))
        geo = pg.evaluate("""(() => { const R = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.top, r.bottom]; };
            const ans = R('#quiz .keypad') || R('#quiz .opts') || R('#quiz .qz-body'); return { q: R('#quiz .qz-q'), ans, body: R('#quiz .qz-body'), panel: R('.memo-panel'), cvh: document.querySelector('.memo-cv').getBoundingClientRect().height, ih: innerHeight }; })()""")
        ok(tag + " メモ欄は問題文・答えの欄より下（重ならない）", geo["panel"][0] >= geo["body"][1] and geo["panel"][0] >= geo["ans"][1] and geo["panel"][0] >= geo["q"][1], geo)
        ok(tag + " メモ欄の高さが画面の1/3以上", geo["cvh"] >= geo["ih"] / 3, round(geo["cvh"]))
        pg.screenshot(path=f"{OUT}/50-memo-{tag}-top.png")
        to_panel(pg, 0)
        x, y, w, h = cvbox(pg)
        st0 = pg.evaluate("[document.querySelector('#quiz').scrollTop, scrollY, visualViewport.scale]")
        stroke(pg, x + 30, y + 160, x + w * 0.7, y + 220); n1 = pg.evaluate(INK)
        st1 = pg.evaluate("[document.querySelector('#quiz').scrollTop, scrollY, visualViewport.scale]")
        ok(tag + " 1本指で書ける", n1 > 50); ok(tag + " 書いている間は画面が動かない・ズームしない", st0 == st1 and st1[2] == 1, [st0, st1])
        pg.click('[data-mc="1"]'); pg.click('[data-ms="2"]'); stroke(pg, x + 30, y + 260, x + w * 0.8, y + 300)
        red = pg.evaluate("(() => { const c = document.querySelector('.memo-cv'), k = c.width / c.clientWidth; const d = c.getContext('2d').getImageData(0, Math.round(230 * k), c.width, Math.round(100 * k)).data; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] > 200 && d[i + 1] < 90) return true; return false; })()")
        n2 = pg.evaluate(INK); ok(tag + " 色・太さを変えられる（赤・太い）", red and n2 > n1)
        pg.click('[data-mc="2"]'); pg.click('[data-ms="0"]'); stroke(pg, x + 40, y + 360, x + w * 0.6, y + 380)
        pg.click('[data-mc="3"]'); pg.click('[data-ms="1"]'); stroke(pg, x + 40, y + 420, x + w * 0.6, y + 440)
        n3 = pg.evaluate(INK)
        pg.click('[data-mt="erase"]'); stroke(pg, x + 30, y + 280, x + w * 0.8, y + 280); n4 = pg.evaluate(INK); ok(tag + " 消しゴムで消える", n4 < n3)
        pg.click('[data-mt="undo"]'); n5 = pg.evaluate(INK); ok(tag + " 元に戻す", abs(n5 - n3) <= n3 * 0.01 and n5 > n4, [n3, n4, n5])
        pg.click('[data-mc="0"]')
        pg.screenshot(path=f"{OUT}/51-memo-{tag}-panel.png")
        # 自動で下に伸びる
        h0 = pg.evaluate("HMMemo.height()"); x, y, w, h = cvbox(pg)
        vis_bottom = min(y + h, pg.evaluate("innerHeight")) - 5
        to_panel(pg, h0 - pg.evaluate("innerHeight") + 150); x, y, w, h = cvbox(pg)
        stroke(pg, x + 50, y + h - 150, x + 120, y + h - 40)
        h1 = pg.evaluate("HMMemo.height()"); ok(tag + " 下端まで書くと自動で伸びる", h1 > h0, [h0, h1])
        pg.evaluate("document.querySelector('.memo-more').click()"); pg.evaluate("document.querySelector('.memo-more').click()")
        h2 = pg.evaluate("HMMemo.height()"); ok(tag + " 「↓下に広げる」で伸ばせる", h2 >= h1 + 700, [h1, h2])
        ok(tag + " 伸ばしても書いた線は残る", pg.evaluate("HMMemo.count()") >= 5)
        # 2本指スクロール（合成タッチ）
        to_panel(pg, 200); x, y, w, h = cvbox(pg)
        r = pg.evaluate(f"""(() => {{ try {{ const t = document.querySelector('.memo-paper'), q = document.querySelector('#quiz'), s0 = q.scrollTop, n0 = HMMemo.count();
            const mk = (id, X, Y) => ({{ identifier: id, target: t, clientX: X, clientY: Y, pageX: X, pageY: Y }});
            const fire = (type, list) => {{ const ev = new Event(type, {{ bubbles: true, cancelable: true }}); Object.defineProperty(ev, 'touches', {{ value: list }}); Object.defineProperty(ev, 'targetTouches', {{ value: list }}); t.dispatchEvent(ev); }};
            fire('touchstart', [mk(1, {x+60}, 300), mk(2, {x+160}, 300)]); fire('touchmove', [mk(1, {x+60}, 200), mk(2, {x+160}, 200)]); fire('touchmove', [mk(1, {x+60}, 120), mk(2, {x+160}, 120)]); fire('touchend', []);
            return [s0, q.scrollTop, n0, HMMemo.count()]; }} catch (e) {{ return 'skip:' + e.message; }} }})()""")
        if isinstance(r, str): print("SKIP 2本指（この環境では合成タッチ不可）", r)
        else: ok(tag + " 2本指でメモ欄の中をスクロール", r[1] - r[0] >= 150 and r[3] == r[2], r)
        ok(tag + " スクロール用のつまみ（1本指で上下）", pg.evaluate("getComputedStyle(document.querySelector('.memo-grip')).touchAction") in ("pan-y", "pan-y pinch-zoom") and pg.is_visible(".memo-grip"))
        ok(tag + " メモ欄の中はスクロール・ズームをしない設定", pg.evaluate("getComputedStyle(document.querySelector('.memo-cv')).touchAction") == "none")
        # 答えの欄に戻れる
        pg.evaluate("document.querySelector('#quiz').scrollTop = 0"); pg.wait_for_timeout(300)
        ok(tag + " スクロールで答えの欄に戻れる", pg.evaluate("(() => { const r = document.querySelector('#quiz .qz-q').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()"))
        # 答える → 次の問題で自動クリア
        n0 = pg.inner_text(".qz-n")
        pg.evaluate("(() => { const b = document.querySelector('#quiz .opt'); if (b) { b.click(); return; } document.querySelector('#quiz [data-key=\"1\"]').click(); document.querySelector('#quiz [data-key=\"ok\"]').click(); })()"); pg.wait_for_timeout(1500)
        ok(tag + " 答えたあともメモ欄は答えの欄・解説の下", pg.evaluate("document.querySelector('.memo-panel').getBoundingClientRect().top >= document.querySelector('#qz-foot').getBoundingClientRect().bottom - 1") and pg.evaluate("HMMemo.count()") >= 5)
        for _ in range(3):
            pg.evaluate("(() => { const n = document.querySelector('[data-q=\"next\"]'); if (n) n.click(); })()"); pg.wait_for_timeout(800)
            if pg.inner_text(".qz-n") != n0: break
        ok(tag + " 次の問題へ " + n0 + "→" + pg.inner_text(".qz-n"), pg.inner_text(".qz-n") != n0)
        ok(tag + " 問題が変わると自動でクリア", pg.evaluate("HMMemo.count()") == 0 and pg.evaluate(INK) == 0 and pg.evaluate("HMMemo.height()") < h2)
        # とじる／ひらく
        pg.evaluate("document.querySelector('[data-mt=\"toggle\"]').click()"); pg.wait_for_timeout(200)
        ok(tag + " とじる", not pg.is_visible(".memo-cv")); pg.evaluate("document.querySelector('[data-mt=\"toggle\"]').click()"); pg.wait_for_timeout(300); ok(tag + " ひらく", pg.is_visible(".memo-cv"))
        ok("判定：国語は出さない・理科の数字問題は出す", not pg.evaluate("HMMemo.needs('ja', { q: '3つ' })") and pg.evaluate("HMMemo.needs('sci', { q: '2A の電流' })"))
        pg.evaluate("HM_APP.startStep('ja', 3, 0, 0, { noCard: true })"); pg.wait_for_timeout(500)
        ok(tag + " 国語の問題ではメモ欄なし", not pg.is_visible(".memo-panel"))
        ctx.close()
    br.close()
finally:
  srv.terminate()
print("errors", errs[:5]); print("FAIL" if fails or errs else "PASS", len(fails))
