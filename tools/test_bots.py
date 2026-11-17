# 新ゲームを「うまい人」っぽいボットで遊び、勝てる（=調整が理不尽でない）か確かめる
import subprocess, sys, time, os, json
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8768
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
BOTS = {
"soccer": """(()=>{const g=__pro; const O={id:1,x:80,y:g.H-100,sx:80,sy:g.H-100}; g.onDown(O); window.__bot=setInterval(()=>{const d=g.dbg(); let tx,ty; if(d.own){tx=d.cx;ty=d.top+150; if(d.me.y<d.top+240){g.onDown({id:2,x:g.W-60,y:g.H-90,sx:g.W-60,sy:g.H-90}); g.onUp({id:2});}} else {tx=d.ball.x;ty=d.ball.y;} const dx=tx-d.me.x, dy=ty-d.me.y, m=Math.hypot(dx,dy)||1; O.x=O.sx+dx/m*60; O.y=O.sy+dy/m*60; g.onMove(O);},50);})()""",
"racing": """(()=>{const g=__pro; let id=1, held=null; window.__bot=setInterval(()=>{const d=g.dbg(); if(d.start>0) return; const u=-d.P.x*2.2+d.seg.curve*0.35; const want=u>0.25?'R':u<-0.25?'L':null; if(want!==held){ if(held) g.onUp({id}); if(want) g.onDown({id, x: want==='R'?g.W*0.8:g.W*0.2, y:g.H*0.8, sx:0, sy:0}); held=want; }},40);})()""",
"basket": """(()=>{const g=__pro; window.__bot=setInterval(()=>{const d=g.dbg(); if(d.ball) return; const o={id:1,x:g.W/2,y:d.baseY,sx:g.W/2,sy:d.baseY,t:performance.now()}; g.onDown(o); o.x=g.W/2+(d.hoopX-g.W/2)/1.3; o.y=d.baseY-g.H*0.34; g.onUp(o);},300);})()""",
"golf": """(()=>{const g=__pro; window.__bot=setInterval(()=>{const d=g.dbg(); if(d.moving) return; const dx=d.hole[0]-d.ball.x, dy=d.hole[1]-d.ball.y, D=Math.hypot(dx,dy); const v=Math.min(900, D*0.87+40+Math.random()*60); const m=v/900*170; const ux=dx/D+ (Math.random()-.5)*0.1, uy=dy/D; const o={id:1,x:100,y:300,sx:100,sy:300}; g.onDown(o); o.x=100-ux*m; o.y=300-uy*m; g.onUp(o);},1600);})()""",
}
DIFFS = sys.argv[1].split(",") if len(sys.argv) > 1 else ["easy", "normal", "hard", "ultra"]
GAMES = sys.argv[2].split(",") if len(sys.argv) > 2 else list(BOTS)
out = {}
try:
  with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = br.new_page(viewport={"width": 390, "height": 844}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(600)
    pg.evaluate("(() => { const s = HM_APP.state(); s.days[HM_APP.today()] = { stars: 4, steps: {} }; HM_APP.save(); HM_APP.render(); })()")
    for gid in GAMES:
      for diff in DIFFS:
        pg.evaluate(f"HM_APP.startGame('{gid}','{diff}')"); pg.wait_for_timeout(300)
        pg.evaluate(BOTS[gid]); t0 = time.time()
        while time.time() - t0 < 150 and pg.evaluate("document.getElementById('gl-result').hidden"): pg.wait_for_timeout(500)
        res = pg.evaluate("document.getElementById('gl-result').hidden ? 'TIMEOUT' : document.getElementById('gl-result').innerText.split('\\n').filter(Boolean).slice(1,3).join(' | ')")
        pg.evaluate("clearInterval(window.__bot); document.getElementById('gl-close').click()"); pg.wait_for_timeout(200)
        out[f"{gid}/{diff}"] = res; print(gid, diff, round(time.time() - t0), res, errs[-1:] if errs else "", flush=True)
    br.close()
finally:
    srv.terminate()
