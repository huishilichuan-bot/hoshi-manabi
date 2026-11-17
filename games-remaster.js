/* ほしまなび — 作り直した定番アクション（エアホッケー・メテオ・ハイウェイ・フラッパー・スネーク・ランナー）。すべてオリジナル */
(() => {
  "use strict";
  const H = window.HMGames, X = window.HMPro, { rr, txt, clamp, lerp, rand } = X;
  const add = (id, e, n, c, d, fn) => H.add({ id, e, n, c, d, pro: true }, fn);
  const key = (g, fn) => g.on(window, "keydown", (e) => { const k = { ArrowLeft: "L", ArrowRight: "R", ArrowUp: "U", ArrowDown: "D", " ": "A", Spacebar: "A" }[e.key]; if (k) { e.preventDefault(); fn(k); } });
  const glow = (c, col, b) => { c.shadowColor = col; c.shadowBlur = b; };
  const noGlow = (c) => { c.shadowBlur = 0; };

  // ===== エアホッケー：ネオンホッケー =====
  add("hockey", "🏒", "ネオンホッケー", "#00acc1", "指でマレットを動かしてパックを打ち返す。先に5点とったほうが勝ち。", (diff) => {
    const g = X.pro("hockey", diff, "ネオンホッケー"), W = g.W, Hh = g.H, d = g.d;
    const L = 12, R = W - 12, T = 64, B = Hh - 12, cx = W / 2, cy = (T + B) / 2, gw = W * 0.38, GOAL = 5;
    const me = { x: cx, y: B - 70, vx: 0, vy: 0, r: 26 }, cp = { x: cx, y: T + 70, vx: 0, vy: 0, r: 26 }, pk = { x: cx, y: cy, vx: 0, vy: 0, r: 15 };
    let tgt = { x: me.x, y: me.y }, stall = 0, clock = 150, score = [0, 0], pause = 1.2, msg = { s: "スタート！", t: 1.2 }, trail = [], aimErr = 0, aimT = 0;
    const cps = [360, 500, 650, 820][d], err = [46, 26, 12, 4][d];
    g.onDown = (o) => { tgt = { x: o.x, y: o.y - 30 }; }; g.onMove = (o) => { tgt = { x: o.x, y: o.y - 30 }; };
    g.dbg = () => ({ me, cp, pk, score });
    function reset(toMe) { pk.x = cx; pk.y = toMe ? cy + 70 : cy - 70; pk.vx = pk.vy = 0; pause = 1; trail = []; }
    function moveMallet(m, tx, ty, maxV, dt, minY, maxY) { tx = clamp(tx, L + m.r, R - m.r); ty = clamp(ty, minY + m.r, maxY - m.r); const dx = tx - m.x, dy = ty - m.y, dd = Math.hypot(dx, dy), st = Math.min(dd, maxV * dt); const nx = dd ? m.x + (dx / dd) * st : m.x, ny = dd ? m.y + (dy / dd) * st : m.y; m.vx = dt ? (nx - m.x) / dt : 0; m.vy = dt ? (ny - m.y) / dt : 0; m.x = nx; m.y = ny; }
    function hit(m) { const dx = pk.x - m.x, dy = pk.y - m.y, dd = Math.hypot(dx, dy), md = m.r + pk.r; if (dd < md && dd > 0) { const nx = dx / dd, ny = dy / dd; pk.x = m.x + nx * md; pk.y = m.y + ny * md; const rvx = pk.vx - m.vx, rvy = pk.vy - m.vy, dot = rvx * nx + rvy * ny; if (dot < 0) { pk.vx -= 1.9 * dot * nx; pk.vy -= 1.9 * dot * ny; const sp = Math.hypot(pk.vx, pk.vy); if (sp > 1500) { pk.vx *= 1500 / sp; pk.vy *= 1500 / sp; } X.SFX.hit(); g.burst(pk.x - nx * pk.r, pk.y - ny * pk.r, m === me ? ["#22d3ee", "#fff"] : ["#ff5fa2", "#fff"], 10, 180, 0.35); if (Math.abs(dot) > 600) g.shake(4); if (m === me) g.vib(10); } } }
    g.run((dt) => {
      if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
      moveMallet(me, tgt.x, tgt.y, 2600, dt, cy, B);
      // CPU
      aimT -= dt; if (aimT <= 0) { aimT = 0.25; aimErr = rand(-err, err); }
      let tx, ty;
      if (pause > 0) { tx = cx; ty = T + 70; }
      else if (pk.y < cy + 20 && (pk.vy < 120 || pk.y < T + 160)) { tx = pk.x + aimErr * 0.5 + (pk.x - cx) * 0.08; ty = pk.y - 26 + aimErr * 0.3; if (pk.y < cp.y + 6) { tx = pk.x + (pk.x < cx ? 40 : -40); ty = pk.y - 50; } }
      else { const tt = pk.vy < 0 ? (pk.y - (T + 70)) / Math.max(60, -pk.vy) : 0.4; tx = clamp(pk.x + pk.vx * Math.min(tt, 0.5) + aimErr, cx - gw / 2, cx + gw / 2); ty = T + 60; }
      moveMallet(cp, tx, ty, pause > 0 ? 300 : cps, dt, T, cy);
      if (pause > 0) { pause -= dt; return; }
      clock -= dt; if (clock <= 0) { const w = score[0] > score[1]; return g.end(w, w ? "勝ち！" : score[0] === score[1] ? "引き分け" : "CPUの勝ち", ["あなた " + score[0], "CPU " + score[1], "時間切れ"], score[0] === score[1]); }
      if (Math.hypot(pk.vx, pk.vy) < 60) stall += dt; else stall = 0;
      if (stall > 4) { stall = 0; msg = { s: "フェイスオフ", t: 0.9 }; reset(pk.y < cy); return; }
      const steps = 4; for (let k = 0; k < steps; k++) {
        const s = dt / steps; pk.x += pk.vx * s; pk.y += pk.vy * s;
        if (pk.x < L + pk.r) { pk.x = L + pk.r; pk.vx = Math.abs(pk.vx) * 0.92; X.SFX.tick(); } if (pk.x > R - pk.r) { pk.x = R - pk.r; pk.vx = -Math.abs(pk.vx) * 0.92; X.SFX.tick(); }
        const inGoal = Math.abs(pk.x - cx) < gw / 2 - 4;
        if (pk.y < T + pk.r && !inGoal) { pk.y = T + pk.r; pk.vy = Math.abs(pk.vy) * 0.92; X.SFX.tick(); }
        if (pk.y > B - pk.r && !inGoal) { pk.y = B - pk.r; pk.vy = -Math.abs(pk.vy) * 0.92; X.SFX.tick(); }
        hit(me); hit(cp);
        if (pk.y < T - 10) { score[0]++; X.SFX.cheer(); g.flash("#22d3ee", 0.35); g.shake(10); g.burst(pk.x, T, ["#22d3ee", "#fff", "#ffd43b"], 40, 280, 1); g.vib([30, 30, 60]); msg = { s: "ゴール！！", t: 1.1 }; if (score[0] >= GOAL) return g.end(true, "勝ち！", ["あなた " + score[0], "CPU " + score[1]]); reset(false); return; }
        if (pk.y > B + 10) { score[1]++; X.SFX.bad(); g.shake(6); msg = { s: "失点…", t: 1 }; if (score[1] >= GOAL) return g.end(false, "CPUの勝ち", ["あなた " + score[0], "CPU " + score[1]]); reset(true); return; }
      }
      const f = Math.pow(0.8, dt); pk.vx *= f; pk.vy *= f;
      trail.push([pk.x, pk.y]); if (trail.length > 14) trail.shift();
    }, (c) => {
      c.fillStyle = "#070b1f"; c.fillRect(0, 0, W, Hh);
      const tg = c.createLinearGradient(0, T, 0, B); tg.addColorStop(0, "#14123a"); tg.addColorStop(0.5, "#0d1a3a"); tg.addColorStop(1, "#14123a"); c.fillStyle = tg; rr(c, L, T, R - L, B - T, 26); c.fill();
      c.globalAlpha = 0.08; c.fillStyle = "#fff"; for (let y = T + 14; y < B; y += 22) for (let x = L + 14 + ((y / 22) % 2) * 11; x < R; x += 22) c.fillRect(x, y, 2, 2); c.globalAlpha = 1;
      glow(c, "#a78bfa", 12); c.strokeStyle = "rgba(167,139,250,.75)"; c.lineWidth = 3; c.beginPath(); c.moveTo(L, cy); c.lineTo(R, cy); c.stroke(); c.beginPath(); c.arc(cx, cy, 52, 0, 7); c.stroke();
      c.strokeStyle = "#ff5fa2"; glow(c, "#ff5fa2", 16); c.beginPath(); c.arc(cx, T, gw / 2, 0, Math.PI); c.stroke(); c.strokeStyle = "#22d3ee"; glow(c, "#22d3ee", 16); c.beginPath(); c.arc(cx, B, gw / 2, Math.PI, 0); c.stroke();
      c.lineWidth = 4; c.strokeStyle = "rgba(255,255,255,.55)"; glow(c, "#fff", 8); rr(c, L, T, R - L, B - T, 26); c.stroke(); noGlow(c);
      c.fillStyle = "#ff5fa2"; c.fillRect(cx - gw / 2, T - 6, gw, 6); c.fillStyle = "#22d3ee"; c.fillRect(cx - gw / 2, B, gw, 6);
      trail.forEach((p, i) => { c.globalAlpha = (i / trail.length) * 0.35; c.fillStyle = "#ffe066"; c.beginPath(); c.arc(p[0], p[1], pk.r * (i / trail.length), 0, 7); c.fill(); }); c.globalAlpha = 1;
      glow(c, "#ffe066", 18); const pg = c.createRadialGradient(pk.x - 4, pk.y - 4, 2, pk.x, pk.y, pk.r); pg.addColorStop(0, "#fff9db"); pg.addColorStop(1, "#fab005"); c.fillStyle = pg; c.beginPath(); c.arc(pk.x, pk.y, pk.r, 0, 7); c.fill(); noGlow(c);
      for (const [m, col, lbl] of [[me, "#22d3ee", "あなた"], [cp, "#ff5fa2", "CPU"]]) { glow(c, col, 22); const mg = c.createRadialGradient(m.x - 6, m.y - 6, 3, m.x, m.y, m.r); mg.addColorStop(0, "#fff"); mg.addColorStop(0.35, col); mg.addColorStop(1, "#1b1b3a"); c.fillStyle = mg; c.beginPath(); c.arc(m.x, m.y, m.r, 0, 7); c.fill(); c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(m.x, m.y, m.r * 0.55, 0, 7); c.stroke(); noGlow(c); }
      c.fillStyle = "rgba(0,0,0,.5)"; rr(c, W / 2 - 100, 10, 200, 44, 16); c.fill(); txt(c, score[1] + "", W / 2 + 36, 32, 26, "#ff8fc0"); txt(c, score[0] + "", W / 2 - 36, 32, 26, "#7ee7f7"); txt(c, "-", W / 2, 32, 22, "#fff"); txt(c, "あなた", 40, 32, 12, "#7ee7f7"); txt(c, "CPU", W - 34, 32, 12, "#ff8fc0");
      txt(c, Math.floor(clock / 60) + ":" + String(Math.floor(clock % 60)).padStart(2, "0"), W / 2, T + 18, 12, "rgba(255,255,255,.6)", "center", 800, null);
      if (msg) txt(c, msg.s, W / 2, cy, 36, "#ffe066");
    });
  });

  // ===== メテオよけ：メテオストーム =====
  add("meteor", "☄️", "メテオストーム", "#6d4c41", "指でドラッグして動き、降ってくるメテオをよける。クリスタルを集めて、制限時間まで生きのこれば勝ち。", (diff) => {
    const g = X.pro("meteor", diff, "メテオストーム"), W = g.W, Hh = g.H, d = g.d;
    const GOALT = [30, 40, 50, 60][d], ground = Hh - 70;
    const me = { x: W / 2, y: ground - 20, lives: [4, 3, 3, 3][d], inv: 1.5, shield: 0 }; let drag = null, t = 0, score = 0, spawnT = 0, crysT = 2;
    const mets = [], crys = [], craters = [], stars = []; for (let i = 0; i < 70; i++) stars.push([rand(0, W), rand(0, ground), rand(0.5, 1.8)]);
    g.onDown = (o) => { drag = { o, x0: me.x, y0: me.y }; }; g.onMove = (o) => { if (drag && drag.o === o) { me.x = clamp(drag.x0 + (o.x - o.sx) * 1.25, 16, W - 16); me.y = clamp(drag.y0 + (o.y - o.sy) * 1.25, Hh * 0.45, ground - 18); } }; g.onUp = () => { drag = null; };
    g.dbg = () => ({ me, mets, t });
    function hurt() { if (me.inv > 0) return; if (me.shield) { me.shield = 0; me.inv = 1; X.SFX.hit(); g.pop(me.x, me.y - 30, "シールドで防いだ！", "#74c0fc", 15); return; } me.lives--; me.inv = 1.6; X.SFX.boom(); g.flash("#ff3b3b", 0.3); g.shake(10); g.vib(60); g.burst(me.x, me.y, ["#74c0fc", "#fff"], 26, 220); if (me.lives <= 0) g.end(false, "ざんねん…", ["生きのこった時間 " + Math.floor(t) + "秒", "クリスタル " + score]); }
    g.run((dt) => {
      t += dt; me.inv -= dt; if (t >= GOALT) return g.end(true, "生きのこった！", ["クリスタル " + score, "のこりライフ " + me.lives]);
      const lvl = t / GOALT, rate = [0.9, 1.25, 1.6, 2][d] * (0.6 + lvl * 1.1);
      spawnT -= dt; if (spawnT <= 0) { spawnT = 1 / rate; const big = Math.random() < 0.18 + d * 0.04, x = rand(10, W - 10), tx = clamp(x + rand(-120, 120), 10, W - 10), sp = rand(170, 240) * (1 + d * 0.15) * (big ? 0.8 : 1); const ty = rand(Hh * 0.5, ground); const dist = Math.hypot(tx - x, ty + 40); mets.push({ x, y: -30, vx: ((tx - x) / dist) * sp, vy: ((ty + 40) / dist) * sp, r: big ? rand(22, 28) : rand(10, 16), rot: 0, vr: rand(-4, 4), ty, big, pts: Array.from({ length: 8 }, () => rand(0.75, 1.1)) }); }
      crysT -= dt; if (crysT <= 0) { crysT = rand(1.8, 3); crys.push({ x: rand(30, W - 30), y: rand(Hh * 0.5, ground - 30), t: 0, sh: Math.random() < 0.12 }); }
      for (const m of mets) { m.x += m.vx * dt; m.y += m.vy * dt; m.rot += m.vr * dt; if (Math.random() < 0.8) g.parts.push({ x: m.x - m.vx * 0.04, y: m.y - m.vy * 0.04, vx: rand(-20, 20), vy: rand(-30, 0), life: 0.4, max: 0.4, color: Math.random() < 0.5 ? "#ff922b" : "#ffd43b", size: m.r * 0.35 }); if (Math.hypot(m.x - me.x, m.y - me.y) < m.r + 10) { m.dead = true; hurt(); g.burst(m.x, m.y, ["#ff922b", "#ffd43b", "#868e96"], 18, 200); } if (m.y >= m.ty) { m.dead = true; X.SFX.boom(); g.shake(m.big ? 7 : 3); g.burst(m.x, m.y, ["#ff922b", "#ffd43b", "#868e96", "#fff"], m.big ? 34 : 16, m.big ? 260 : 170, 0.6); craters.push({ x: m.x, y: m.y, r: m.r * 1.3, t: 4 }); if (m.big && Math.hypot(m.x - me.x, m.y - me.y) < m.r * 1.8) hurt(); } }
      for (const cr of crys) { cr.t += dt; if (Math.hypot(cr.x - me.x, cr.y - me.y) < 26) { cr.dead = true; X.SFX.coin(); g.vib(10); if (cr.sh) { me.shield = 1; g.pop(cr.x, cr.y - 20, "シールド！", "#74c0fc", 16); } else { score++; g.pop(cr.x, cr.y - 20, "+1", "#a5f3fc", 18); } g.burst(cr.x, cr.y, ["#a5f3fc", "#fff"], 12, 140, 0.4); } if (cr.t > 6) cr.dead = true; }
      for (const k of craters) k.t -= dt;
      for (const a of [mets, crys, craters]) for (let i = a.length - 1; i >= 0; i--) if (a[i].dead || a[i].t < 0) a.splice(i, 1);
    }, (c) => {
      const sky = c.createLinearGradient(0, 0, 0, ground); sky.addColorStop(0, "#0b0820"); sky.addColorStop(0.7, "#3a1250"); sky.addColorStop(1, "#7a2a3a"); c.fillStyle = sky; c.fillRect(0, 0, W, Hh);
      for (const s of stars) { c.fillStyle = "rgba(255,255,255," + (0.3 + 0.3 * Math.sin(g.time * 2 + s[0])) + ")"; c.fillRect(s[0], s[1], s[2], s[2]); }
      c.fillStyle = "#4a2a3a"; c.beginPath(); c.moveTo(0, ground); for (let x = 0; x <= W; x += 30) c.lineTo(x, ground - 20 - Math.abs(Math.sin(x * 0.02)) * 30); c.lineTo(W, ground); c.fill();
      const gr = c.createLinearGradient(0, Hh * 0.45, 0, Hh); gr.addColorStop(0, "rgba(120,60,60,0)"); gr.addColorStop(1, "rgba(120,60,60,.35)"); c.fillStyle = gr; c.fillRect(0, Hh * 0.45, W, Hh);
      c.fillStyle = "#5c3a2e"; c.fillRect(0, ground, W, Hh - ground); c.fillStyle = "#7a4e3a"; c.fillRect(0, ground, W, 6);
      for (const k of craters) { c.globalAlpha = Math.min(1, k.t) * 0.5; c.fillStyle = "#1a0f0a"; c.beginPath(); c.ellipse(k.x, k.y, k.r, k.r * 0.45, 0, 0, 7); c.fill(); c.globalAlpha = Math.min(1, k.t) * 0.6; c.fillStyle = "#ff922b"; c.beginPath(); c.ellipse(k.x, k.y, k.r * 0.5, k.r * 0.2, 0, 0, 7); c.fill(); } c.globalAlpha = 1;
      for (const m of mets) { c.globalAlpha = 0.35; c.strokeStyle = "#ff6b6b"; c.lineWidth = 2; c.setLineDash([4, 5]); c.beginPath(); c.ellipse(m.x + (m.vx / m.vy) * (m.ty - m.y), m.ty, m.r, m.r * 0.4, 0, 0, 7); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
      for (const cr of crys) { const bob = Math.sin(cr.t * 4) * 4; glow(c, cr.sh ? "#74c0fc" : "#66d9e8", 16); c.fillStyle = cr.sh ? "#74c0fc" : "#99e9f2"; c.beginPath(); c.moveTo(cr.x, cr.y - 14 + bob); c.lineTo(cr.x + 9, cr.y + bob); c.lineTo(cr.x, cr.y + 14 + bob); c.lineTo(cr.x - 9, cr.y + bob); c.closePath(); c.fill(); noGlow(c); c.fillStyle = "rgba(255,255,255,.7)"; c.beginPath(); c.moveTo(cr.x, cr.y - 14 + bob); c.lineTo(cr.x + 4, cr.y + bob); c.lineTo(cr.x, cr.y + bob); c.fill(); if (cr.sh) txt(c, "S", cr.x, cr.y + bob, 10, "#0b3d91", "center", 900, null); }
      for (const m of mets) { const ang = Math.atan2(m.vy, m.vx); const tg = c.createLinearGradient(m.x, m.y, m.x - Math.cos(ang) * m.r * 4, m.y - Math.sin(ang) * m.r * 4); tg.addColorStop(0, "rgba(255,180,60,.8)"); tg.addColorStop(1, "rgba(255,80,40,0)"); c.fillStyle = tg; c.beginPath(); c.moveTo(m.x + Math.cos(ang + 1.57) * m.r, m.y + Math.sin(ang + 1.57) * m.r); c.lineTo(m.x - Math.cos(ang) * m.r * 4, m.y - Math.sin(ang) * m.r * 4); c.lineTo(m.x + Math.cos(ang - 1.57) * m.r, m.y + Math.sin(ang - 1.57) * m.r); c.fill();
        c.save(); c.translate(m.x, m.y); c.rotate(m.rot); const rg = c.createRadialGradient(-m.r * 0.3, -m.r * 0.3, 2, 0, 0, m.r); rg.addColorStop(0, "#a8a29e"); rg.addColorStop(1, "#44403c"); c.fillStyle = rg; c.beginPath(); m.pts.forEach((p, i) => { const a = (i / 8) * Math.PI * 2; c[i ? "lineTo" : "moveTo"](Math.cos(a) * m.r * p, Math.sin(a) * m.r * p); }); c.closePath(); c.fill(); c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.arc(m.r * 0.25, m.r * 0.1, m.r * 0.22, 0, 7); c.fill(); c.restore(); }
      if (me.lives > 0 && (me.inv <= 0 || Math.floor(me.inv * 12) % 2 === 0)) { c.save(); c.translate(me.x, me.y); c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(0, 20, 16, 5, 0, 0, 7); c.fill(); c.fillStyle = "#f1f3f5"; rr(c, -11, -6, 22, 22, 8); c.fill(); c.fillStyle = "#e9ecef"; c.beginPath(); c.arc(0, -12, 12, 0, 7); c.fill(); const vg = c.createLinearGradient(-8, -18, 8, -6); vg.addColorStop(0, "#74c0fc"); vg.addColorStop(1, "#1864ab"); c.fillStyle = vg; rr(c, -8, -18, 16, 11, 5); c.fill(); c.fillStyle = "#fa5252"; c.fillRect(-4, 0, 8, 5); c.fillStyle = "#adb5bd"; c.fillRect(-13, 16, 9, 5); c.fillRect(4, 16, 9, 5); if (me.shield) { glow(c, "#74c0fc", 14); c.strokeStyle = "rgba(116,192,252,.85)"; c.lineWidth = 3; c.beginPath(); c.arc(0, -2, 26, 0, 7); c.stroke(); noGlow(c); } c.restore(); }
      c.fillStyle = "rgba(0,0,0,.45)"; rr(c, 10, 10, W - 20, 46, 14); c.fill(); txt(c, "❤".repeat(Math.max(0, me.lives)) + "♡".repeat(Math.max(0, [4, 3, 3, 3][d] - me.lives)), 20, 33, 17, "#ff6b6b", "left"); txt(c, "💎 " + score, W / 2, 33, 17, "#a5f3fc"); txt(c, "のこり " + Math.max(0, Math.ceil(GOALT - t)) + "秒", W - 20, 33, 16, "#fff", "right");
      c.fillStyle = "rgba(255,255,255,.15)"; c.fillRect(20, 60, W - 40, 5); c.fillStyle = "#ffd43b"; c.fillRect(20, 60, (W - 40) * Math.min(1, t / GOALT), 5);
      if (t < 2.5) txt(c, "ドラッグで移動！ 赤い円に落ちてくるよ", W / 2, Hh * 0.38, 15, "#fff");
    });
  });

  // ===== ハイウェイ：ハイウェイラッシュ =====
  add("highway", "🚗", "ハイウェイラッシュ", "#546e7a", "左右にスワイプ（またはタップ）で車線変更。青いニトロでブースト。CPUより先に3000mを走りきれば勝ち。", (diff) => {
    const g = X.pro("highway", diff, "ハイウェイラッシュ"), W = g.W, Hh = g.H, d = g.d;
    const LN = 4, rl = 34, rw = W - 68, lw = rw / LN, laneX = (i) => rl + lw * (i + 0.5), GOALM = 3000, TOP = 900;
    const me = { lane: 1, x: laneX(1), y: Hh - 130, v: 300, inv: 0, nitro: 0, tilt: 0 }; let dist = 0, cpuD = 0, scroll = 0, cars = [], items = [], spawnT = 1, start = 3, nearCool = 0, decor = [];
    const cpuV = [60, 70, 78, 85][d], dens = [0.9, 1.15, 1.4, 1.7][d];
    for (let i = 0; i < 12; i++) decor.push({ y: i * 90, side: i % 2, k: i % 3 });
    const shift = (s) => { const n = clamp(me.lane + s, 0, LN - 1); if (n !== me.lane) { me.lane = n; X.SFX.whoosh(); g.vib(6); } };
    g.onUp = (o) => { const dx = o.x - o.sx; if (Math.abs(dx) > 24) shift(dx > 0 ? 1 : -1); else shift(o.x < W / 2 ? -1 : 1); };
    key(g, (k) => { if (k === "L") shift(-1); if (k === "R") shift(1); });
    g.dbg = () => ({ me, cars, dist, cpuD, lanes: LN, start });
    const COLS = ["#ff6b6b", "#ffd43b", "#69db7c", "#da77f2", "#f8f9fa", "#ffa94d", "#4dabf7"];
    function drawCar(c, x, y, col, w, h, mine) { c.fillStyle = "rgba(0,0,0,.35)"; rr(c, x - w / 2 + 3, y - h / 2 + 5, w, h, 9); c.fill(); const bg = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); bg.addColorStop(0, col); bg.addColorStop(0.5, "#fff"); bg.addColorStop(0.55, col); bg.addColorStop(1, col); c.fillStyle = bg; rr(c, x - w / 2, y - h / 2, w, h, 9); c.fill(); c.fillStyle = "rgba(20,30,50,.85)"; rr(c, x - w / 2 + 5, y - h / 2 + (mine ? 10 : h * 0.55), w - 10, h * 0.22, 4); c.fill(); rr(c, x - w / 2 + 5, y - h / 2 + (mine ? h * 0.62 : 8), w - 10, h * 0.16, 4); c.fill(); c.fillStyle = mine ? "#fff3bf" : "#ff8787"; c.fillRect(x - w / 2 + 3, y + (mine ? -h / 2 : h / 2 - 5), 8, 4); c.fillRect(x + w / 2 - 11, y + (mine ? -h / 2 : h / 2 - 5), 8, 4); }
    g.run((dt) => {
      if (start > 0) { start -= dt; if (Math.floor(start + dt) !== Math.floor(start)) X.SFX.tick(); return; }
      me.inv -= dt; me.nitro -= dt; nearCool -= dt;
      const top = TOP * (me.nitro > 0 ? 1.35 : 1); me.v = me.v < top ? Math.min(top, me.v + (me.nitro > 0 ? 700 : 240) * dt) : Math.max(top, me.v - 400 * dt);
      const tx = laneX(me.lane); me.tilt = (tx - me.x) * 0.01; me.x = lerp(me.x, tx, Math.min(1, dt * 12));
      dist += (me.v / 10) * dt; cpuD += cpuV * dt * (1 + Math.sin(cpuD / 300) * 0.06); scroll = (scroll + me.v * dt) % 80;
      for (const o of decor) { o.y += me.v * dt; if (o.y > Hh + 60) o.y -= 12 * 90; }
      spawnT -= dt; if (spawnT <= 0) { spawnT = rand(0.45, 0.9) / dens; const used = new Set(cars.filter((k) => k.y < 60).map((k) => k.lane)); const free = [0, 1, 2, 3].filter((i) => !used.has(i)); if (free.length > 1) { const lane = free[Math.floor(Math.random() * free.length)]; cars.push({ lane, x: laneX(lane), y: -70, v: rand(330, 520), col: COLS[Math.floor(Math.random() * COLS.length)], truck: Math.random() < 0.18 }); } if (Math.random() < 0.22) { const lane = Math.floor(Math.random() * LN); items.push({ lane, x: laneX(lane), y: -40 }); } }
      for (const k of cars) { k.y += (me.v - k.v) * dt; const h = k.truck ? 96 : 62; if (me.inv <= 0 && Math.abs(k.x - me.x) < lw * 0.62 && Math.abs(k.y - me.y) < (h + 62) / 2 - 6) { me.inv = 1.3; me.v *= 0.35; X.SFX.boom(); g.shake(12); g.flash("#ff3b3b", 0.25); g.vib(80); g.burst(me.x, me.y - 30, ["#ffd43b", "#ff922b", "#adb5bd"], 26, 220); k.v = me.v + 200; }
        if (!k.near && nearCool <= 0 && k.y > me.y - 20 && k.y < me.y + 40 && Math.abs(k.x - me.x) < lw * 1.2 && Math.abs(k.x - me.x) > lw * 0.7 && me.inv <= 0) { k.near = true; nearCool = 0.3; me.v = Math.min(TOP * 1.15, me.v + 60); g.pop(me.x, me.y - 60, "ニアミス！", "#ffe066", 16); X.SFX.pop(); } }
      for (const it of items) { it.y += me.v * dt; if (Math.abs(it.x - me.x) < lw * 0.6 && Math.abs(it.y - me.y) < 40) { it.dead = true; me.nitro = 2; X.SFX.coin(); g.flash("#74c0fc", 0.2); g.pop(me.x, me.y - 70, "ニトロ！", "#74c0fc", 20); g.vib(15); } }
      cars = cars.filter((k) => k.y < Hh + 140 && k.y > -300); items = items.filter((k) => !k.dead && k.y < Hh + 60);
      if (me.nitro > 0) for (const s of [-10, 10]) g.parts.push({ x: me.x + s, y: me.y + 34, vx: rand(-20, 20), vy: rand(120, 240), life: 0.3, max: 0.3, color: Math.random() < 0.5 ? "#74c0fc" : "#fff", size: 4 });
      if (dist >= GOALM || cpuD >= GOALM) { const win = dist >= GOALM && dist / GOALM >= cpuD / GOALM; g.end(win, win ? "1着でゴール！" : "CPUが先にゴール", ["あなた " + Math.min(GOALM, Math.floor(dist)) + "m", "CPU " + Math.min(GOALM, Math.floor(cpuD)) + "m"]); }
    }, (c) => {
      c.fillStyle = "#2b8a3e"; c.fillRect(0, 0, W, Hh); c.fillStyle = "#37b24d"; for (let y = -80 + scroll; y < Hh; y += 80) { c.fillRect(0, y, rl - 6, 40); c.fillRect(W - rl + 6, y, rl - 6, 40); }
      for (const o of decor) { const x = o.side ? W - 14 : 14; if (o.k === 0) { c.fillStyle = "#1b5e20"; c.beginPath(); c.arc(x, o.y, 13, 0, 7); c.fill(); c.fillStyle = "#2f9e44"; c.beginPath(); c.arc(x - 3, o.y - 3, 8, 0, 7); c.fill(); } else if (o.k === 1) { c.fillStyle = "#adb5bd"; c.fillRect(x - 2, o.y - 14, 4, 28); glow(c, "#ffe066", 12); c.fillStyle = "#fff3bf"; c.beginPath(); c.arc(x, o.y - 16, 4, 0, 7); c.fill(); noGlow(c); } }
      c.fillStyle = "#343a40"; c.fillRect(rl, 0, rw, Hh); c.fillStyle = "#f1f3f5"; c.fillRect(rl - 5, 0, 5, Hh); c.fillRect(rl + rw, 0, 5, Hh);
      for (let i = 1; i < LN; i++) for (let y = -80 + scroll; y < Hh; y += 80) { c.fillStyle = "rgba(255,255,255,.75)"; c.fillRect(rl + lw * i - 2, y, 4, 40); }
      for (const it of items) { glow(c, "#4dabf7", 16); c.fillStyle = "#1c7ed6"; rr(c, it.x - 11, it.y - 16, 22, 32, 6); c.fill(); noGlow(c); c.fillStyle = "#fff"; txt(c, "N", it.x, it.y, 14, "#fff", "center", 900, null); }
      for (const k of cars) drawCar(c, k.x, k.y, k.col, lw * 0.7, k.truck ? 96 : 62, false);
      if (me.nitro > 0) { c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 2; for (let i = 0; i < 10; i++) { const x = rand(0, W), y = rand(0, Hh); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 40); c.stroke(); } }
      if (me.inv <= 0 || Math.floor(me.inv * 12) % 2 === 0) { c.save(); c.translate(me.x, me.y); c.rotate(me.tilt); drawCar(c, 0, 0, "#e03131", lw * 0.72, 66, true); c.restore(); }
      c.fillStyle = "rgba(0,0,0,.5)"; rr(c, 10, 10, W - 20, 62, 14); c.fill();
      const bx = 24, bw = W - 48; c.fillStyle = "rgba(255,255,255,.18)"; rr(c, bx, 50, bw, 8, 4); c.fill(); txt(c, "🏁", bx + bw, 40, 14, "#fff");
      c.fillStyle = "#ff8787"; c.beginPath(); c.arc(bx + bw * Math.min(1, cpuD / GOALM), 54, 6, 0, 7); c.fill(); c.fillStyle = "#74c0fc"; c.beginPath(); c.arc(bx + bw * Math.min(1, dist / GOALM), 54, 7, 0, 7); c.fill();
      txt(c, Math.floor(me.v / 4) + " km/h", 24, 28, 16, me.nitro > 0 ? "#74c0fc" : "#fff", "left"); txt(c, Math.floor(dist) + " / " + GOALM + "m", W / 2, 28, 14, "#fff"); txt(c, (dist >= cpuD ? "リード " : "おくれ ") + Math.abs(Math.floor(dist - cpuD)) + "m", W - 24, 28, 13, dist >= cpuD ? "#69db7c" : "#ff8787", "right");
      if (start > 0) txt(c, String(Math.ceil(start)), W / 2, Hh * 0.4, 72, "#fff"); else if (dist < 60) txt(c, "GO!", W / 2, Hh * 0.4, 72, "#69db7c");
      if (dist < 200) txt(c, "← スワイプ / タップで車線変更 →", W / 2, Hh * 0.55, 14, "#fff");
    });
  });

  // ===== フラッピー：スカイフラッパー =====
  add("flappy", "🐤", "スカイフラッパー", "#fbc02d", "タップでふわっと上昇。柱のすき間をくぐって目標の数だけ通りぬければ勝ち（ライフ3）。", (diff) => {
    const g = X.pro("flappy", diff, "スカイフラッパー"), W = g.W, Hh = g.H, d = g.d;
    const GOAL = [10, 15, 18, 22][d], gap = [210, 185, 165, 150][d], sp = [140, 160, 180, 200][d], ground = Hh - 60;
    const b = { x: W * 0.3, y: Hh * 0.45, vy: 0, inv: 0, lives: 3, flap: 0 }; let pipes = [], passed = 0, started = false, coins = 0, clouds = [], scroll = 0, nextX = W + 60;
    for (let i = 0; i < 6; i++) clouds.push({ x: rand(0, W), y: rand(70, Hh * 0.5), s: rand(0.6, 1.3) });
    const flap = () => { if (g.over) return; started = true; b.vy = -330; b.flap = 0.25; X.SFX.pop(); for (let i = 0; i < 3; i++) g.parts.push({ x: b.x - 10, y: b.y + 6, vx: rand(-60, -20), vy: rand(20, 80), life: 0.4, max: 0.4, color: "#fff3bf", size: 3 }); };
    g.onDown = flap; key(g, (k) => { if (k === "U" || k === "A") flap(); });
    g.dbg = () => ({ b, pipes, passed, gap, ground });
    function addPipe(x) { const gy = rand(110 + gap / 2, ground - 40 - gap / 2); pipes.push({ x, gy, passed: false, coin: true, mv: d >= 2 && Math.random() < 0.35 ? rand(0.8, 1.6) : 0, ph: rand(0, 6) }); }
    function hurt() { if (b.inv > 0) return; b.lives--; b.inv = 1.8; X.SFX.boom(); g.shake(10); g.flash("#ff3b3b", 0.3); g.vib(60); g.burst(b.x, b.y, ["#ffd43b", "#fff", "#ff922b"], 22, 200); if (b.lives <= 0) return g.end(false, "ざんねん…", ["くぐった柱 " + passed + "/" + GOAL]); b.y = Hh * 0.42; b.vy = -100; pipes = pipes.filter((p) => p.x > b.x + 150 || p.x < b.x - 80); }
    g.run((dt) => {
      for (const cl of clouds) { cl.x -= 20 * cl.s * dt; if (cl.x < -80) { cl.x = W + 60; cl.y = rand(70, Hh * 0.5); } }
      b.flap -= dt; b.inv -= dt;
      if (!started) { b.y = Hh * 0.45 + Math.sin(g.time * 3) * 8; return; }
      scroll += sp * dt; b.vy += 900 * dt; b.vy = Math.min(b.vy, 520); b.y += b.vy * dt;
      if (b.y > ground - 12) { b.y = ground - 12; b.vy = -260; hurt(); } if (b.y < 20) { b.y = 20; b.vy = 0; }
      nextX -= sp * dt; if (nextX <= W + 40) { addPipe(W + 40); nextX = W + 40 + rand(200, 240) - d * 10; }
      for (const p of pipes) { p.x -= sp * dt; if (p.mv) p.gy += Math.sin(g.time * p.mv + p.ph) * 40 * dt; p.gy = clamp(p.gy, 100 + gap / 2, ground - 30 - gap / 2);
        const pw = 62; if (b.x + 13 > p.x - pw / 2 && b.x - 13 < p.x + pw / 2 && (b.y - 11 < p.gy - gap / 2 || b.y + 11 > p.gy + gap / 2)) hurt();
        if (p.coin && Math.hypot(b.x - p.x, b.y - p.gy) < 24) { p.coin = false; coins++; X.SFX.coin(); g.burst(p.x, p.gy, ["#ffd43b", "#fff"], 12, 140, 0.4); }
        if (!p.passed && p.x + pw / 2 < b.x - 13) { p.passed = true; passed++; X.SFX.tick(); g.pop(b.x, b.y - 40, passed + "/" + GOAL, "#fff", 18); if (passed >= GOAL) return g.end(true, "ゴール！", ["くぐった柱 " + passed, "コイン " + coins, "のこりライフ " + b.lives]); } }
      pipes = pipes.filter((p) => p.x > -80);
    }, (c) => {
      const k = Math.min(1, passed / GOAL); const sky = c.createLinearGradient(0, 0, 0, Hh); sky.addColorStop(0, k < 0.5 ? "#4dabf7" : "#845ef7"); sky.addColorStop(0.7, k < 0.5 ? "#a5d8ff" : "#ff8787"); sky.addColorStop(1, "#ffe8cc"); c.fillStyle = sky; c.fillRect(0, 0, W, Hh);
      c.fillStyle = "rgba(255,255,255,.9)"; c.beginPath(); c.arc(W * 0.8, Hh * 0.16, 30, 0, 7); c.fill();
      for (const cl of clouds) { c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.arc(cl.x, cl.y, 18 * cl.s, 0, 7); c.arc(cl.x + 20 * cl.s, cl.y - 8 * cl.s, 22 * cl.s, 0, 7); c.arc(cl.x + 44 * cl.s, cl.y, 16 * cl.s, 0, 7); c.fill(); }
      for (const [col, h, s, a] of [["#74b816", ground - 70, 0.25, 40], ["#5c940d", ground - 30, 0.5, 26]]) { c.fillStyle = col; c.beginPath(); c.moveTo(0, ground); for (let x = 0; x <= W; x += 10) c.lineTo(x, h - Math.abs(Math.sin((x + scroll * s) / 90)) * a); c.lineTo(W, ground); c.fill(); }
      for (const p of pipes) { const pw = 62; for (const [y0, y1, cap] of [[0, p.gy - gap / 2, p.gy - gap / 2 - 22], [p.gy + gap / 2, ground, p.gy + gap / 2]]) { const pg = c.createLinearGradient(p.x - pw / 2, 0, p.x + pw / 2, 0); pg.addColorStop(0, "#5f3dc4"); pg.addColorStop(0.4, "#b197fc"); pg.addColorStop(1, "#4c2a9e"); c.fillStyle = pg; c.fillRect(p.x - pw / 2 + 4, y0, pw - 8, y1 - y0); c.fillStyle = "#7048e8"; rr(c, p.x - pw / 2, cap, pw, 22, 6); c.fill(); c.fillStyle = "rgba(255,255,255,.3)"; c.fillRect(p.x - pw / 2 + 8, cap + 4, 6, 14); }
        if (p.coin) { const s = Math.abs(Math.cos(g.time * 4)); glow(c, "#ffd43b", 12); c.fillStyle = "#fcc419"; c.beginPath(); c.ellipse(p.x, p.gy, 10 * s + 1, 10, 0, 0, 7); c.fill(); noGlow(c); } }
      c.fillStyle = "#e9c46a"; c.fillRect(0, ground, W, Hh - ground); c.fillStyle = "#74b816"; c.fillRect(0, ground, W, 10); for (let x = -(scroll % 30); x < W; x += 30) { c.fillStyle = "#94d82d"; c.fillRect(x, ground, 15, 10); }
      if (b.lives > 0 && (b.inv <= 0 || Math.floor(b.inv * 12) % 2 === 0)) { c.save(); c.translate(b.x, b.y); c.rotate(clamp(b.vy / 600, -0.5, 0.9)); const bg = c.createRadialGradient(-4, -4, 2, 0, 0, 16); bg.addColorStop(0, "#fff3bf"); bg.addColorStop(1, "#fab005"); c.fillStyle = bg; c.beginPath(); c.ellipse(0, 0, 16, 13, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(6, -4, 5, 0, 7); c.fill(); c.fillStyle = "#212529"; c.beginPath(); c.arc(7.5, -4, 2.4, 0, 7); c.fill(); c.fillStyle = "#ff922b"; c.beginPath(); c.moveTo(12, 0); c.lineTo(21, 3); c.lineTo(12, 6); c.fill(); c.fillStyle = "#f59f00"; c.beginPath(); c.ellipse(-4, 2, 9, b.flap > 0 ? 3 : 6, b.flap > 0 ? -0.6 : 0.3, 0, 7); c.fill(); c.restore(); }
      c.fillStyle = "rgba(0,0,0,.4)"; rr(c, 10, 10, W - 20, 46, 14); c.fill(); txt(c, "❤".repeat(Math.max(0, b.lives)), 22, 33, 17, "#ff6b6b", "left"); txt(c, passed + " / " + GOAL, W / 2, 33, 22, "#fff"); txt(c, "🪙 " + coins, W - 22, 33, 16, "#ffd43b", "right");
      if (!started) { txt(c, "タップでスタート", W / 2, Hh * 0.62, 22, "#fff"); }
    });
  });

  // ===== へびゲーム：ネオンスネーク =====
  add("snake", "🐍", "ネオンスネーク", "#43a047", "スワイプ（矢印キー）で向きを変えて、えさを食べてのびる。60秒後、CPUより長ければ勝ち。ぶつかると短くなる。", (diff) => {
    const g = X.pro("snake", diff, "ネオンスネーク"), W = g.W, Hh = g.H, d = g.d;
    const COLS = 15, cs = Math.floor((W - 16) / COLS), ROWS = Math.floor((Hh - 90) / cs), ox = Math.floor((W - cs * COLS) / 2), oy = 72;
    const STEP = [0.15, 0.13, 0.115, 0.1][d], mistake = [0.22, 0.1, 0.035, 0.005][d];
    const mk = (x, y, dx, col, glowc) => ({ body: [[x, y + 2], [x, y + 1], [x, y]].map((p) => p.slice()), dir: [0, -1], next: [0, -1], grow: 0, col, glowc, dead: 0, len: 3, best: 3 });
    const me = mk(4, ROWS - 6, 0, "#22d3ee", "#22d3ee"), cp = mk(COLS - 5, ROWS - 6, 0, "#ff5fa2", "#ff5fa2");
    let foods = [], acc = 0, acc2 = 0, cpuF = [0.68, 0.8, 0.9, 1][d], time = 60, start = 2, anchor = null;
    const occ = () => { const s = new Set(); for (const sn of [me, cp]) if (!sn.dead) sn.body.forEach((p) => s.add(p[0] + "," + p[1])); return s; };
    function addFood() { const o = occ(); for (let k = 0; k < 200; k++) { const x = Math.floor(Math.random() * COLS), y = Math.floor(Math.random() * ROWS); if (!o.has(x + "," + y) && !foods.some((f) => f.x === x && f.y === y)) { foods.push({ x, y, gold: Math.random() < 0.15, t: 0 }); return; } } }
    for (let i = 0; i < 4; i++) addFood();
    const turn = (dx, dy) => { const c = me.dir; if (c[0] === -dx && c[1] === -dy) return; me.next = [dx, dy]; };
    g.onDown = (o) => { anchor = { x: o.x, y: o.y }; }; g.onMove = (o) => { if (!anchor) return; const dx = o.x - anchor.x, dy = o.y - anchor.y; if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) { if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0); else turn(0, Math.sign(dy)); anchor = { x: o.x, y: o.y }; } }; g.onUp = () => { anchor = null; };
    key(g, (k) => { if (k === "L") turn(-1, 0); if (k === "R") turn(1, 0); if (k === "U") turn(0, -1); if (k === "D") turn(0, 1); });
    g.dbg = () => ({ me, cp, foods, COLS, ROWS });
    function cpuThink() { const h = cp.body[0], o = occ(); const free = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && !o.has(x + "," + y);
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter((v) => !(v[0] === -cp.dir[0] && v[1] === -cp.dir[1]));
      // BFSで一番近いえさへ
      const q = [[h[0], h[1], null]], seen = new Set([h[0] + "," + h[1]]); let best = null;
      while (q.length && !best) { const [x, y, f] = q.shift(); for (const v of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + v[0], ny = y + v[1], k = nx + "," + ny; if (seen.has(k) || !free(nx, ny)) continue; seen.add(k); const first = f || v; if (foods.some((fd) => fd.x === nx && fd.y === ny)) { best = first; break; } q.push([nx, ny, first]); } }
      const space = (v) => { const sx = h[0] + v[0], sy = h[1] + v[1]; if (!free(sx, sy)) return -1; const st = [[sx, sy]], ss = new Set([sx + "," + sy]); while (st.length && ss.size < 40) { const [x, y] = st.pop(); for (const w of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = x + w[0] + "," + (y + w[1]); if (!ss.has(k) && free(x + w[0], y + w[1])) { ss.add(k); st.push([x + w[0], y + w[1]]); } } } return ss.size; };
      let choice = best && dirs.some((v) => v[0] === best[0] && v[1] === best[1]) && space(best) > 12 ? best : null;
      if (!choice || Math.random() < mistake) { const ok = dirs.map((v) => [v, space(v)]).filter((a) => a[1] > 0).sort((a, b) => b[1] - a[1]); if (Math.random() < mistake && dirs.length) choice = dirs[Math.floor(Math.random() * dirs.length)]; else if (ok.length) choice = ok[0][0]; }
      if (choice) cp.next = choice; }
    function crash(sn) { sn.dead = 1.2; const keep = Math.max(3, Math.ceil(sn.body.length / 2)); X.SFX.boom(); g.shake(sn === me ? 9 : 4); if (sn === me) { g.vib(60); g.flash("#ff3b3b", 0.25); } sn.body.forEach(([x, y], i) => { if (i % 2 === 0) g.burst(ox + x * cs + cs / 2, oy + y * cs + cs / 2, [sn.col, "#fff"], 4, 140, 0.5); }); sn.len = keep; g.pop(W / 2, Hh * 0.45, sn === me ? "ぶつかった！ 長さ半分" : "CPUがぶつかった！", sn === me ? "#ff8787" : "#69db7c", 18); }
    function respawn(sn) { const o = occ(); for (let k = 0; k < 300; k++) { const x = 2 + Math.floor(Math.random() * (COLS - 4)), y = 4 + Math.floor(Math.random() * (ROWS - 6)); let ok = true; for (let i = 0; i < sn.len + 2; i++) if (o.has(x + "," + (y + i - 2))) ok = false; if (ok) { sn.body = Array.from({ length: sn.len }, (_, i) => [x, y + i]); sn.dir = [0, -1]; sn.next = [0, -1]; sn.dead = 0; sn.grow = 0; return; } } sn.dead = 0.5; }
    function stepSnake(sn) { if (sn.dead) return; sn.dir = sn.next; const h = sn.body[0], nh = [h[0] + sn.dir[0], h[1] + sn.dir[1]]; const other = sn === me ? cp : me; const hitSelf = sn.body.slice(0, sn.body.length - (sn.grow ? 0 : 1)).some((p) => p[0] === nh[0] && p[1] === nh[1]); const hitOther = !other.dead && other.body.some((p) => p[0] === nh[0] && p[1] === nh[1]);
      if (nh[0] < 0 || nh[1] < 0 || nh[0] >= COLS || nh[1] >= ROWS || hitSelf || hitOther) return crash(sn);
      sn.body.unshift(nh); const fi = foods.findIndex((f) => f.x === nh[0] && f.y === nh[1]); if (fi >= 0) { const f = foods[fi]; foods.splice(fi, 1); sn.grow += f.gold ? 3 : 1; sn.len += f.gold ? 3 : 1; sn.best = Math.max(sn.best, sn.len); addFood(); const px = ox + nh[0] * cs + cs / 2, py = oy + nh[1] * cs + cs / 2; g.burst(px, py, f.gold ? ["#ffd43b", "#fff"] : [sn.col, "#fff"], 12, 150, 0.4); if (sn === me) { X.SFX.coin(); g.pop(px, py - 16, f.gold ? "+3" : "+1", f.gold ? "#ffd43b" : "#7ee7f7", 16); g.vib(8); } }
      if (sn.grow > 0) sn.grow--; else sn.body.pop(); }
    g.run((dt) => {
      if (start > 0) { start -= dt; return; }
      time -= dt; if (time <= 0) { const a = me.len, b = cp.len; return g.end(a > b, a > b ? "勝ち！" : a === b ? "引き分け" : "CPUの勝ち", ["あなた 長さ" + a, "CPU 長さ" + b], a === b); }
      for (const sn of [me, cp]) if (sn.dead) { sn.dead -= dt; if (sn.dead <= 0) respawn(sn); }
      foods.forEach((f) => (f.t += dt));
      acc += dt; while (acc >= STEP) { acc -= STEP; stepSnake(me); } acc2 += dt * cpuF; while (acc2 >= STEP) { acc2 -= STEP; cpuThink(); stepSnake(cp); }
    }, (c) => {
      c.fillStyle = "#05060f"; c.fillRect(0, 0, W, Hh);
      c.fillStyle = "#0b1020"; rr(c, ox - 4, oy - 4, cs * COLS + 8, cs * ROWS + 8, 12); c.fill();
      c.strokeStyle = "rgba(120,140,255,.08)"; c.lineWidth = 1; for (let i = 0; i <= COLS; i++) { c.beginPath(); c.moveTo(ox + i * cs, oy); c.lineTo(ox + i * cs, oy + ROWS * cs); c.stroke(); } for (let j = 0; j <= ROWS; j++) { c.beginPath(); c.moveTo(ox, oy + j * cs); c.lineTo(ox + COLS * cs, oy + j * cs); c.stroke(); }
      glow(c, "#a78bfa", 14); c.strokeStyle = "rgba(167,139,250,.8)"; c.lineWidth = 2; rr(c, ox - 4, oy - 4, cs * COLS + 8, cs * ROWS + 8, 12); c.stroke(); noGlow(c);
      for (const f of foods) { const px = ox + f.x * cs + cs / 2, py = oy + f.y * cs + cs / 2, r = cs * 0.32 * (1 + 0.12 * Math.sin(f.t * 6)); glow(c, f.gold ? "#ffd43b" : "#69db7c", 14); c.fillStyle = f.gold ? "#ffd43b" : "#8ce99a"; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill(); noGlow(c); }
      const k = acc / STEP;
      for (const sn of [cp, me]) { if (sn.dead) continue; glow(c, sn.glowc, 12); const n = sn.body.length; sn.body.forEach((p, i) => { const a = 1 - (i / n) * 0.55; c.globalAlpha = a; c.fillStyle = sn.col; const pad = i === 0 ? 1 : 2.5; rr(c, ox + p[0] * cs + pad, oy + p[1] * cs + pad, cs - pad * 2, cs - pad * 2, cs * 0.3); c.fill(); }); c.globalAlpha = 1; noGlow(c); const h = sn.body[0], hx = ox + h[0] * cs + cs / 2, hy = oy + h[1] * cs + cs / 2; c.fillStyle = "#fff"; for (const s of [-1, 1]) { const ex = hx + sn.dir[0] * cs * 0.15 + (sn.dir[1] ? s * cs * 0.2 : 0), ey = hy + sn.dir[1] * cs * 0.15 + (sn.dir[0] ? s * cs * 0.2 : 0); c.beginPath(); c.arc(ex, ey, cs * 0.12, 0, 7); c.fill(); } }
      c.fillStyle = "rgba(0,0,0,.6)"; rr(c, 10, 10, W - 20, 50, 14); c.fill(); txt(c, "あなた " + me.len, 24, 35, 18, "#7ee7f7", "left"); txt(c, Math.ceil(time) + "秒", W / 2, 35, 18, time < 10 ? "#ff8787" : "#fff"); txt(c, "CPU " + cp.len, W - 24, 35, 18, "#ff8fc0", "right");
      if (start > 0) txt(c, "スワイプで向きを変えよう", W / 2, Hh * 0.45, 18, "#fff");
      void k;
    });
  });

  // ===== ランナー：パルクールラン =====
  add("runner", "🏃", "パルクールラン", "#ef8a3a", "タップでジャンプ（空中でもう1回）、下スワイプでスライディング。障害物をかわしてCPUより先に800mへ。", (diff) => {
    const g = X.pro("runner", diff, "パルクールラン"), W = g.W, Hh = g.H, d = g.d;
    const GOALM = 800, gy = Hh - 110, px = 90, TOPV = 340;
    const me = { y: 0, vy: 0, jumps: 0, slide: 0, v: 200, inv: 0, run: 0 }; let dist = 0, cpuD = 0, obs = [], coins = 0, cs = [], nextO = 500, start = 3, scroll = 0;
    const cpuV = [26, 29.5, 31.5, 33.5][d];
    const jump = () => { if (g.over || start > 0) return; if (me.jumps < 2) { me.vy = me.jumps ? -520 : -600; me.jumps++; me.slide = 0; X.SFX.pop(); g.burst(px, gy, "#ced4da", 6, 90, 0.3); } };
    const slide = () => { if (g.over || start > 0) return; if (me.y < -5) me.vy = 700; else { me.slide = 0.6; X.SFX.whoosh(); } };
    let dn = null; g.onDown = (o) => { dn = o; }; g.onMove = (o) => { if (dn === o && o.y - o.sy > 30) { slide(); dn = null; } }; g.onUp = (o) => { if (dn === o) { if (o.y - o.sy > 30) slide(); else jump(); } dn = null; };
    key(g, (k) => { if (k === "U" || k === "A") jump(); if (k === "D") slide(); });
    g.dbg = () => ({ me, obs, dist, cpuD, start });
    function spawn(x) { const r = Math.random(), k = r < 0.45 ? "box" : r < 0.75 ? "bar" : r < 0.9 ? "tall" : "double"; obs.push({ x, k }); if (Math.random() < 0.6) for (let i = 0; i < 4; i++) cs.push({ x: x + 120 + i * 34, y: k === "bar" ? -20 : -110 - Math.sin((i / 3) * Math.PI) * 40 }); }
    g.run((dt) => {
      if (start > 0) { start -= dt; if (Math.floor(start + dt) !== Math.floor(start)) X.SFX.tick(); return; }
      me.inv -= dt; me.slide -= dt; me.v = Math.min(TOPV + d * 10, me.v + 180 * dt); me.run += dt * me.v / 40;
      const dx = me.v * dt; dist += dx / 10; cpuD += cpuV * dt; scroll += dx;
      me.vy += 1700 * dt; me.y += me.vy * dt; if (me.y >= 0) { if (me.jumps && me.vy > 300) g.burst(px, gy, "#ced4da", 5, 70, 0.25); me.y = 0; me.vy = 0; me.jumps = 0; }
      nextO -= dx; if (nextO <= 0) { spawn(W + 40); nextO = rand(260, 420) - d * 25; }
      const sliding = me.slide > 0 && me.y >= -2, top = gy + me.y - (sliding ? 28 : 56), bot = gy + me.y;
      for (const o of obs) { o.x -= dx; const box = o.k === "box" ? [o.x - 18, gy - 36, 36, 36] : o.k === "tall" ? [o.x - 16, gy - 62, 32, 62] : o.k === "double" ? [o.x - 40, gy - 34, 80, 34] : [o.x - 30, gy - 110, 60, 56]; o.box = box;
        if (me.inv <= 0 && px + 12 > box[0] && px - 12 < box[0] + box[2] && bot > box[1] && top < box[1] + box[3]) { me.inv = 1.2; me.v *= 0.4; X.SFX.hit(); g.shake(8); g.vib(50); g.flash("#ff3b3b", 0.2); g.burst(px, (top + bot) / 2, ["#ffa94d", "#fff"], 16, 180); g.pop(px + 20, top - 20, "つまずいた！", "#ff8787", 15); } }
      for (const cn of cs) { cn.x -= dx; if (!cn.got && Math.abs(cn.x - px) < 18 && Math.abs(gy + cn.y - (top + bot) / 2) < 34) { cn.got = true; coins++; X.SFX.coin(); g.burst(cn.x, gy + cn.y, ["#ffd43b", "#fff"], 8, 120, 0.3); } }
      obs = obs.filter((o) => o.x > -80); cs = cs.filter((c2) => c2.x > -30 && !c2.got);
      if (dist >= GOALM || cpuD >= GOALM) { const win = dist >= cpuD; g.end(win, win ? "1着でゴール！" : "CPUが先にゴール", ["あなた " + Math.min(GOALM, Math.floor(dist)) + "m", "CPU " + Math.min(GOALM, Math.floor(cpuD)) + "m", "コイン " + coins]); }
    }, (c) => {
      const sky = c.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, "#2b2d6e"); sky.addColorStop(0.6, "#e8590c"); sky.addColorStop(1, "#ffd8a8"); c.fillStyle = sky; c.fillRect(0, 0, W, Hh);
      c.fillStyle = "rgba(255,240,200,.9)"; c.beginPath(); c.arc(W * 0.75, gy - 170, 40, 0, 7); c.fill();
      for (const [col, sp, hmax, wv] of [["#5f3dc4", 0.15, 170, 46], ["#3b2a87", 0.35, 120, 34], ["#1f1a4a", 0.6, 80, 28]]) { c.fillStyle = col; const off = (scroll * sp) % (wv * 4); for (let x = -off - wv; x < W + wv; x += wv) { const h = hmax * (0.5 + 0.5 * Math.abs(Math.sin((x + scroll * sp - ((scroll * sp) % (wv * 4))) * 0.013 + x * 0.1))); c.fillRect(x, gy - h, wv - 4, h); if (sp > 0.5) { c.fillStyle = "rgba(255,224,102,.6)"; for (let wy = gy - h + 8; wy < gy - 10; wy += 16) c.fillRect(x + 6, wy, 5, 6); c.fillStyle = col; } } }
      c.fillStyle = "#343a40"; c.fillRect(0, gy, W, Hh - gy); c.fillStyle = "#495057"; for (let x = -(scroll % 40); x < W; x += 40) c.fillRect(x, gy, 20, 6); c.fillStyle = "#212529"; c.fillRect(0, gy + 6, W, 3);
      for (const cn of cs) { const s = Math.abs(Math.cos(g.time * 5 + cn.x * 0.05)); glow(c, "#ffd43b", 10); c.fillStyle = "#fcc419"; c.beginPath(); c.ellipse(cn.x, gy + cn.y, 8 * s + 1, 8, 0, 0, 7); c.fill(); noGlow(c); }
      for (const o of obs) { const b = o.box; if (!b) continue; if (o.k === "bar") { c.fillStyle = "#adb5bd"; c.fillRect(b[0] + 4, b[1] - 60, 5, 60 + b[3]); c.fillRect(b[0] + b[2] - 9, b[1] - 60, 5, 60 + b[3]); const bg2 = c.createLinearGradient(0, b[1], 0, b[1] + b[3]); bg2.addColorStop(0, "#ff6b6b"); bg2.addColorStop(1, "#c92a2a"); c.fillStyle = bg2; rr(c, b[0], b[1], b[2], b[3], 6); c.fill(); c.fillStyle = "#fff"; for (let i = 0; i < 3; i++) c.fillRect(b[0] + 8 + i * 18, b[1] + 6, 9, b[3] - 12); } else { const bg2 = c.createLinearGradient(b[0], 0, b[0] + b[2], 0); bg2.addColorStop(0, "#e67700"); bg2.addColorStop(1, "#a35200"); c.fillStyle = bg2; rr(c, b[0], b[1], b[2], b[3], 4); c.fill(); c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 2; c.strokeRect(b[0] + 4, b[1] + 4, b[2] - 8, b[3] - 8); c.beginPath(); c.moveTo(b[0] + 4, b[1] + 4); c.lineTo(b[0] + b[2] - 4, b[1] + b[3] - 4); c.stroke(); } }
      const drawRunner = (x, yoff, col, a, phase, sliding, air) => { c.save(); c.globalAlpha = a; c.translate(x, gy + yoff); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 6; c.lineCap = "round"; if (sliding) { c.beginPath(); c.moveTo(-18, -8); c.lineTo(10, -12); c.stroke(); c.beginPath(); c.arc(16, -18, 8, 0, 7); c.fill(); c.beginPath(); c.moveTo(-18, -8); c.lineTo(-30, -4); c.stroke(); } else { const s = Math.sin(phase), s2 = Math.sin(phase + Math.PI); c.beginPath(); c.moveTo(0, -30); c.lineTo(2, -48); c.stroke(); c.beginPath(); c.arc(4, -57, 8, 0, 7); c.fill(); for (const q of air ? [0.6, -0.4] : [s, s2]) { c.beginPath(); c.moveTo(0, -30); c.lineTo(q * 12, -16); c.lineTo(q * 16 - 4, -2); c.stroke(); } for (const q of air ? [-0.8, 0.8] : [s2, s]) { c.beginPath(); c.moveTo(2, -44); c.lineTo(q * 12 + 4, -34); c.stroke(); } } c.restore(); };
      const cdx = (cpuD - dist) * 10; if (Math.abs(cdx) < W) drawRunner(px + cdx, 0, "#ff8fc0", 0.55, g.time * 14, false, false);
      if (me.inv <= 0 || Math.floor(me.inv * 12) % 2 === 0) { c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(px, gy + 2, 16 + me.y * 0.05, 4, 0, 0, 7); c.fill(); drawRunner(px, me.y, "#74c0fc", 1, me.run, me.slide > 0 && me.y >= -2, me.y < -2); }
      c.fillStyle = "rgba(0,0,0,.5)"; rr(c, 10, 10, W - 20, 62, 14); c.fill(); const bx = 24, bw = W - 48; c.fillStyle = "rgba(255,255,255,.18)"; rr(c, bx, 50, bw, 8, 4); c.fill(); txt(c, "🏁", bx + bw, 40, 14, "#fff");
      c.fillStyle = "#ff8fc0"; c.beginPath(); c.arc(bx + bw * Math.min(1, cpuD / GOALM), 54, 6, 0, 7); c.fill(); c.fillStyle = "#74c0fc"; c.beginPath(); c.arc(bx + bw * Math.min(1, dist / GOALM), 54, 7, 0, 7); c.fill();
      txt(c, Math.floor(dist) + " / " + GOALM + "m", 24, 28, 15, "#fff", "left"); txt(c, "🪙 " + coins, W / 2 + 10, 28, 15, "#ffd43b"); txt(c, (dist >= cpuD ? "リード " : "おくれ ") + Math.abs(Math.floor(dist - cpuD)) + "m", W - 24, 28, 13, dist >= cpuD ? "#69db7c" : "#ff8787", "right");
      if (start > 0) txt(c, String(Math.ceil(start)), W / 2, Hh * 0.38, 72, "#fff"); else if (dist < 25) txt(c, "GO!", W / 2, Hh * 0.38, 72, "#69db7c");
      if (dist < 60) txt(c, "タップ＝ジャンプ ／ 下スワイプ＝スライディング", W / 2, Hh * 0.5, 13, "#fff");
    });
  });
})();
