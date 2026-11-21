# 新ゲームを「うまい人」っぽいボットで遊び、勝てる（=調整が理不尽でない）か確かめる
import subprocess, sys, time, os, json
from playwright.sync_api import sync_playwright
NOAUTH = "Object.defineProperty(window, 'HM_FIREBASE', { configurable: true, get() { return { enabled: false }; }, set() {} }); try{localStorage.setItem('hoshimanabi:consent',JSON.stringify({v:'2026-11-21',t:1}))}catch(e){}"  # 旧テストではログイン画面を出さない
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8768
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
KEY = "const K=(k)=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k}));"
BOTS = {
"hockey": """(()=>{const g=__pro; window.__bot=setInterval(()=>{const d=g.dbg(); let tx,ty; if(d.pk.y>g.H/2-10){tx=d.pk.x+(d.pk.x-g.W/2)*0.15; ty=d.pk.y+22;} else {tx=d.pk.x; ty=g.H-90;} g.onMove({id:1,x:tx,y:ty+30});},30);})()""",
"snake": KEY+"""(()=>{const g=__pro; window.__bot=setInterval(()=>{const d=g.dbg(); const me=d.me; if(me.dead) return; const occ=new Set(); [d.me,d.cp].forEach(s=>{if(!s.dead) s.body.forEach(p=>occ.add(p[0]+','+p[1]));}); const h=me.body[0]; const free=(x,y)=>x>=0&&y>=0&&x<d.COLS&&y<d.ROWS&&!occ.has(x+','+y); const q=[[h[0],h[1],null]], seen=new Set([h+'']); let best=null; while(q.length&&!best){const [x,y,f]=q.shift(); for(const v of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+v[0],ny=y+v[1]; if(seen.has(nx+','+ny)||!free(nx,ny)) continue; seen.add(nx+','+ny); const fs=f||v; if(d.foods.some(fd=>fd.x===nx&&fd.y===ny)){best=fs;break;} q.push([nx,ny,fs]);}} let v=best; if(!v){v=[[1,0],[-1,0],[0,1],[0,-1]].find(w=>free(h[0]+w[0],h[1]+w[1]));} if(v) K(v[0]===1?'ArrowRight':v[0]===-1?'ArrowLeft':v[1]===1?'ArrowDown':'ArrowUp');},40);})()""",
"highway": KEY+"""(()=>{const g=__pro; window.__bot=setInterval(()=>{const d=g.dbg(); if(d.start>0) return; const lw=(g.W-68)/4; const lane=i=>34+lw*(i+0.5); const danger=i=>d.cars.some(k=>Math.abs(k.x-lane(i))<lw*0.6&&k.y<d.me.y+60&&k.y>d.me.y-330); const cur=d.me.lane; if(danger(cur)){ for(const s of [-1,1]){const n=cur+s; if(n>=0&&n<4&&!danger(n)&&!d.cars.some(k=>Math.abs(k.x-lane(n))<lw*0.6&&Math.abs(k.y-d.me.y)<110)){K(s<0?'ArrowLeft':'ArrowRight');break;}}}},60);})()""",
"runner": KEY+"""(()=>{const g=__pro; window.__bot=setInterval(()=>{const d=g.dbg(); if(d.start>0) return; const o=d.obs.find(o=>o.box&&o.box[0]+o.box[2]>70); if(!o) return; const gap=o.box[0]-90; const lead=d.me.v*0.14; if(gap<lead+20&&gap>0){ if(o.k==='bar'){ if(d.me.slide<=0.1) K('ArrowDown'); } else if(d.me.y>-1) K('ArrowUp'); }},30);})()""",
"flappy": KEY+"""(()=>{const g=__pro; K(' '); window.__bot=setInterval(()=>{const d=g.dbg(); const p=d.pipes.find(p=>p.x+31>d.b.x-14); const ty=p?p.gy+d.gap*0.18:g.H*0.45; if(d.b.y>ty&&d.b.vy>-60) K(' ');},30);})()""",
"meteor": """(()=>{const g=__pro; let O=null; window.__bot=setInterval(()=>{const d=g.dbg(); if(!O){O={id:1,x:100,y:300,sx:100,sy:300}; O.x0=d.me.x; g.onDown(O);} let best=d.me.x,bs=-1e9; for(let x=20;x<g.W-20;x+=10){let s=-Math.abs(x-d.me.x)*0.02; for(const m of d.mets){const t=(m.ty-m.y)/m.vy; const lx=m.x+m.vx*t; if(Math.abs(lx-x)<m.r*2.2+18) s-=10/(0.3+Math.max(0,t)); const px=m.x+m.vx*Math.max(0,(d.me.y-m.y)/m.vy); if(m.y<d.me.y&&Math.abs(px-x)<m.r+18) s-=10;} if(s>bs){bs=s;best=x;}} const nx=d.me.x+Math.max(-14,Math.min(14,best-d.me.x)); O.x=O.sx+(nx-O.x0)/1.25; O.y=300; g.onMove(O); },40);})()""",
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
    pg = br.new_page(viewport={"width": 390, "height": 844}); pg.add_init_script(NOAUTH); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"http://localhost:{PORT}/index.html"); pg.wait_for_timeout(600)
    pg.evaluate("(() => { const s = HM_APP.state(); s.days[HM_APP.today()] = { stars: 4, steps: {} }; HM_APP.save(); HM_APP.render(); })()")
    for gid in GAMES:
      for diff in DIFFS:
        pg.evaluate(f"HM_APP.startGame('{gid}','{diff}')"); pg.wait_for_timeout(300)
        pg.evaluate(BOTS[gid]); t0 = time.time()
        while time.time() - t0 < 200 and pg.evaluate("document.getElementById('gl-result').hidden"): pg.wait_for_timeout(500)
        res = pg.evaluate("document.getElementById('gl-result').hidden ? 'TIMEOUT' : document.getElementById('gl-result').innerText.split('\\n').filter(Boolean).slice(1,3).join(' | ')")
        pg.evaluate("clearInterval(window.__bot); document.getElementById('gl-close').click()"); pg.wait_for_timeout(200)
        out[f"{gid}/{diff}"] = res; print(gid, diff, round(time.time() - t0), res, errs[-1:] if errs else "", flush=True)
    br.close()
finally:
    srv.terminate()
