# v1.6.0 英語4技能のテスト（iPhone 14 / iPad Pro 11 の WebKit）
# 各ステップ12問・スキル3:3:3:3・バッジ／カード（タップ・ドラッグ）／書き取り・英訳・1語・おしい判定／
# スピーキング（音声認識はテスト用のにせものでためす）：合格・やり直し・3回で不正解・あとで話す・マイク拒否・未対応のカード／
# 選択（聞く・会話・絵・長文）／1秒ブロック／スクリーンショット
import subprocess, sys, time, os, json
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-20',t:1}))}catch(e){}"
# 音声認識のにせもの：window.__srSay を「聞こえた言葉」として返す。__srDeny でマイク拒否
FAKE_SR = """
(() => { class FakeSR { constructor(){ this.lang=''; this.onresult=null; this.onend=null; this.onerror=null; this._l={}; }
  addEventListener(t,f){ (this._l[t]=this._l[t]||[]).push(f); }
  _fire(t,e){ const h=this['on'+t]; if(h) h(e); (this._l[t]||[]).forEach(f=>f(e)); }
  start(){ window.__srStarted=(window.__srStarted||0)+1; setTimeout(()=>{ if(window.__srDeny){ this._fire('error',{error:'not-allowed'}); this._fire('end',{}); return; }
    const said=String(window.__srSay||''); const alt={transcript:said,confidence:.9}; const res=[alt]; res.isFinal=true; res.length=1;
    this._fire('result',{resultIndex:0,results:[res]}); this._fire('end',{}); }, 500); }
  stop(){} abort(){} }
  window.webkitSpeechRecognition = FakeSR; window.SpeechRecognition = FakeSR; })();
"""
NOSR = "try{ delete window.webkitSpeechRecognition; delete window.SpeechRecognition; window.webkitSpeechRecognition=undefined; window.SpeechRecognition=undefined; }catch(e){}"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, "screenshots", "v16"); os.makedirs(OUT, exist_ok=True)
PORT = 8816
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
fails = []; errs = []; shots = []
def ok(name, c, extra=""):
    print(("OK  " if c else "NG  ") + name + (" " + str(extra) if extra != "" else ""), flush=True)
    if not c: fails.append(name)
def cur(pg): return pg.evaluate("(() => { const Q = HM_APP.quiz(); const q = (Q.mode === 'retry' ? Q.wrong : Q.qs)[Q.i]; return Object.assign({}, q, { __i: Q.i, __n: Q.n, __need: Q.need }); })()")
def kind(q):
    if q["t"] == "tl": return "tl-listen" if q.get("au") else "tl-write"
    if q["t"] == "ty": return "ty-dict" if q.get("au") else ("ty-fill" if q.get("fill") else "ty-write")
    if q["t"] == "sp": return "sp"
    if q.get("passage"): return "mc-passage"
    if q.get("dlg"): return "mc-dialog"
    if q.get("au"): return "mc-listen"
    if q.get("pics"): return "mc-pic2"
    if q.get("pic"): return "mc-picture"
    return "mc-read"
def snap(pg, name):
    p = f"{OUT}/{name}.png"; pg.screenshot(path=p); shots.append(p)
def fb_ok(pg): return pg.evaluate("!!document.querySelector('.fb.ok')")
def answer_right(pg, q, tag, seen, shoot=True):
    k = kind(q); first = k not in seen; seen.add(k)
    pg.wait_for_timeout(1050)
    if first and shoot: snap(pg, f"{tag}-{k}-q")
    if q["t"] == "tl":
        for piece in q["pieces"]:
            pg.evaluate("(p) => { const b = [...document.querySelectorAll('.e4-pool [data-tw]')].find(x => x.textContent === p); b.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, clientX:1, clientY:1})); window.dispatchEvent(new PointerEvent('pointerup', {bubbles:true, clientX:1, clientY:1})); }", piece)
        pg.click("#work-ok")
    elif q["t"] == "ty":
        pg.fill("#e4in", q["a"]); pg.click("#work-ok")
    elif q["t"] == "sp":
        pg.evaluate("(s) => { window.__srDeny = false; window.__srSay = s; }", q["a"]); pg.click("#e4mic"); pg.wait_for_selector(".fb", timeout=4000)
    else:
        i = q["opts"].index(q["a"]); pg.click(f'[data-mo="{i}"]')
    pg.wait_for_selector(".fb", timeout=4000)
    if first and shoot: snap(pg, f"{tag}-{k}-a")
    return fb_ok(pg)
def nextq(pg): pg.click('[data-q="next"]'); pg.wait_for_timeout(250)
def start(pg, g, ui, si):
    pg.evaluate(f"HM_APP.startStep('en', {g}, {ui}, {si}, {{ noCard: true }})"); pg.wait_for_timeout(600)

try:
  with sync_playwright() as p:
    br = p.webkit.launch()
    for devname, tag in [("iPhone 14", "iphone"), ("iPad Pro 11", "ipad")]:
        ctx = br.new_context(**p.devices[devname]); pg = ctx.new_page(); pg.add_init_script(NOAUTH); pg.add_init_script(FAKE_SR)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(1200)
        ok(tag + " バージョン 1.6.0", pg.evaluate("HM_APP.version") == "1.6.0")
        info = pg.evaluate("Object.fromEntries(Object.entries(HM.SUBJECTS.en).map(([g, us]) => [g, [us.length, us.reduce((a, u) => a + u.steps.length, 0), us.reduce((a, u) => a + u.steps.reduce((b, s) => b + s.cnt, 0), 0)]]))")
        ok(tag + " 英語の学年・単元・ステップ数", info.get("3") == [10, 30, 360] and info.get("9") == [16, 48, 576], info)
        seen = set()
        # 全問正解で1ステップずつ（小3・小6・中1・中3）
        for (g, ui, si) in ([(3, 0, 0), (6, 3, 1), (7, 9, 2), (9, 2, 2)] if tag == "iphone" else [(4, 1, 0), (8, 4, 1), (9, 0, 2)]):
            start(pg, g, ui, si)
            sk = {"L": 0, "S": 0, "W": 0, "R": 0}; allok = True; badges = True
            for n in range(12):
                q = cur(pg); sk[q["skill"]] += 1
                badges = badges and pg.evaluate("!!document.querySelector('.qz-meta .e4-skill')")
                r = answer_right(pg, q, tag, seen)
                if not r: allok = False; print("   × ", kind(q), q.get("a"), pg.evaluate("document.querySelector('.fb') && document.querySelector('.fb').innerText.slice(0,120)"))
                nextq(pg)
            ok(f"{tag} 英語{g}年 ステップ：12問すべて正解できる", allok)
            ok(f"{tag} 英語{g}年 スキルが3問ずつ", sk == {"L": 3, "S": 3, "W": 3, "R": 3}, sk)
            ok(f"{tag} 英語{g}年 スキルのバッジ", badges)
            ok(f"{tag} 英語{g}年 結果画面・⭐", pg.evaluate("!!document.querySelector('.sum-t') && /パーフェクト|合格/.test(document.querySelector('.sum-t').textContent)"))
            if g == 9 and tag == "iphone": snap(pg, f"{tag}-summary")
        print("   形式:", sorted(seen))
        # --- 個別のふるまい ---
        def find(g, pred, tries=12):
            for ui in range(0, 6):
                for si in range(3):
                    start(pg, g, ui, si)
                    for n in range(12):
                        q = cur(pg)
                        if pred(q): return q
                        answer_right(pg, q, tag, set(), shoot=False); nextq(pg)
            return None
        # 1秒ブロック（スピーキング以外）
        q = find(7, lambda q: q["t"] == "mc")
        pg.click(f'[data-mo="{q["opts"].index(q["a"])}"]'); blocked = not pg.evaluate("!!document.querySelector('.fb')")
        ok(tag + " 1秒以内の回答はブロック", blocked)
        # ドラッグでカードを置く
        q = find(5, lambda q: q["t"] == "tl")
        pg.wait_for_timeout(1050)
        for piece in q["pieces"]:
            b = pg.evaluate("(p) => { const b = [...document.querySelectorAll('.e4-pool [data-tw]')].find(x => x.textContent === p); const r = b.getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2]; }", piece)
            ln = pg.evaluate("(() => { const r = document.querySelector('.e4-line').getBoundingClientRect(); return [r.right - 12, r.bottom - 12]; })()")
            pg.mouse.move(b[0], b[1]); pg.mouse.down(); pg.mouse.move(b[0] + 20, b[1] - 20, steps=4); pg.mouse.move(ln[0], ln[1], steps=8); pg.mouse.up(); pg.wait_for_timeout(80)
        got = pg.evaluate("[...document.querySelectorAll('.e4-line [data-tp]')].map(x => x.textContent).join(' ')")
        ok(tag + " ドラッグでカードをならべられる", got == q["a"], [got, q["a"]])
        if tag == "iphone": snap(pg, f"{tag}-tl-drag")
        pg.click("#work-ok"); pg.wait_for_selector(".fb"); ok(tag + " ドラッグで作った文で正解", fb_ok(pg)); nextq(pg)
        # 書く：おしい（つづり1文字）／文法ちがいは不正解
        q = find(8, lambda q: q["t"] == "ty" and not q.get("fill") and any(len(w) >= 5 and w.isalpha() and w.islower() for w in q["a"].split()))
        w = next(w for w in q["a"].split() if len(w) >= 5 and w.isalpha() and w.islower()); typo = w[:-2] + w[-1] + w[-2] if w[-1] != w[-2] else w[:-1] + "x"
        pg.wait_for_timeout(1050); pg.fill("#e4in", q["a"].replace(w, typo, 1)); pg.click("#work-ok"); pg.wait_for_selector(".fb")
        ok(tag + " つづりの小さなまちがいは「おしい」で正解", fb_ok(pg) and pg.evaluate("/おしい/.test(document.querySelector('#quiz').innerText)"), typo)
        if tag == "iphone": snap(pg, f"{tag}-ty-close")
        nextq(pg)
        # スピーキング：まちがい → やり直し → 合格（色分け）
        q = find(6, lambda q: q["t"] == "sp" and len(q["a"].split()) >= 4)
        pg.wait_for_timeout(300)
        if tag == "iphone": snap(pg, f"{tag}-sp-ready")
        half = " ".join(q["a"].split()[:2])
        pg.evaluate("(s) => { window.__srSay = s; }", half); pg.click("#e4mic"); pg.wait_for_timeout(900)
        ok(tag + " 話した言葉が足りないと、赤い単語とやり直し", pg.evaluate("document.querySelectorAll('.e4-w.miss').length > 0 && !document.querySelector('.fb') && /あと 2 回/.test(document.querySelector('#e4heard').innerText)"))
        if tag == "iphone": snap(pg, f"{tag}-sp-retry")
        pg.evaluate("(s) => { window.__srSay = s; }", q["a"].lower().replace(",", "")); pg.click("#e4mic"); pg.wait_for_selector(".fb", timeout=4000)
        ok(tag + " お手本どおり話すと合格（大文字・記号は関係なし）", fb_ok(pg) and pg.evaluate("document.querySelectorAll('.e4-w.hit').length") == len(q["a"].split()))
        if tag == "iphone": snap(pg, f"{tag}-sp-pass")
        nextq(pg)
        # 3回まちがえると不正解
        q = find(6, lambda q: q["t"] == "sp" and len(q["a"].split()) >= 3)
        for t in range(3): pg.evaluate("window.__srSay = 'banana'"); pg.click("#e4mic"); pg.wait_for_timeout(800)
        ok(tag + " 3回とも合わないと不正解", pg.evaluate("!!document.querySelector('.fb.ng')")); nextq(pg)
        # あとで話す：まちがいにならず、問題数がへる
        q = find(7, lambda q: q["t"] == "sp")
        n0 = q["__n"]; pg.click("#e4later"); pg.wait_for_selector(".fb.skip")
        st = pg.evaluate("(() => { const Q = HM_APP.quiz(); return [Q.n, Q.need, Q.combo, (HM_APP.state().wrongBox||[]).some(x => x.q && x.q.a === %s)]; })()" % json.dumps(q["a"]))
        ok(tag + " 「あとで話す」はまちがいにならない（問題数−1・合格ライン再計算）", st[0] == n0 - 1 and st[1] == pg.evaluate(f"HM_APP.passNeed({n0 - 1})") and not st[3], st)
        if tag == "iphone": snap(pg, f"{tag}-sp-later")
        nextq(pg)
        # マイク拒否
        q = find(7, lambda q: q["t"] == "sp")
        pg.evaluate("window.__srDeny = true"); pg.click("#e4mic"); pg.wait_for_timeout(800)
        ok(tag + " マイクが使えないときは案内と「あとで話す」", pg.evaluate("/マイクをオン/.test(document.querySelector('#e4heard').innerText) && !!document.querySelector('#e4later.glow') && !document.querySelector('.fb')"))
        pg.evaluate("window.__srDeny = false"); pg.click("#e4later"); pg.wait_for_selector(".fb.skip"); nextq(pg)
        ctx.close()
        # 音声認識がないブラウザ：カードでならべる
        ctx = br.new_context(**p.devices[devname]); pg = ctx.new_page(); pg.add_init_script(NOAUTH); pg.add_init_script(NOSR)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(1200)
        q = find(4, lambda q: q["t"] == "sp")
        ok(tag + " 音声認識がないときはカードで答えられる", pg.evaluate("!!document.querySelector('#e4alt .e4-pool') && !document.querySelector('#e4mic')"))
        pg.wait_for_timeout(1050)
        for piece in q["a"].replace(",", "").replace(".", "").replace("?", "").replace("!", "").split():
            pg.evaluate("(p) => { const b = [...document.querySelectorAll('#e4alt .e4-pool [data-tw]')].find(x => x.textContent === p); b.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, clientX:1, clientY:1})); window.dispatchEvent(new PointerEvent('pointerup', {bubbles:true, clientX:1, clientY:1})); }", piece)
        if tag == "iphone": snap(pg, f"{tag}-sp-fallback")
        pg.click("#e4altok"); pg.wait_for_selector(".fb"); ok(tag + " カードで正しくならべると正解", fb_ok(pg))
        ctx.close()
    br.close()
finally:
    srv.terminate()
ok("ページのエラーなし", not errs, errs[:3])
print("screenshots:", len(shots))
print("FAILS:", fails if fails else "なし")
sys.exit(1 if fails else 0)
