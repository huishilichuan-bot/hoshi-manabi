/* ほしまなび — アクション（ジャンプクライマー・よけまくれ・スカイダイビング・フルーツスラッシュ・リズムたいこ）。すべてオリジナル */
(() => {
  "use strict";
  const H = window.HMGames, X = window.HMPro, K = window.HMKit, { rr, txt, clamp, lerp, rand } = X;
  const add = (m, fn) => H.add(Object.assign({ pro: true }, m), fn);

  // ===== ジャンプクライマー =====
  add({ id: "climber", e: "🐸", n: "ジャンプクライマー", c: "#37b24d", genre: "action", d: "足場をつたってどんどん上へ！指を左右に動かして着地しよう。45秒でCPUより高くのぼれば勝ち。" }, (diff) => {
    const g = X.pro("climber", diff, "ジャンプクライマー"), W = g.W, Hh = g.H, c = g.c, d = g.d, DUR = 45;
    const cpuH = Math.round([260, 380, 500, 620][d] * rand(0.93, 1.07));
    const me = { x: W / 2, y: Hh - 120, vy: -700, tx: W / 2 }; let plats = [], cam = 0, best = 0, t = 0, endT = null, win = false, fallen = false;
    for (let y = Hh - 60; y > -4000; y -= rand(62, 92) + d * 4) plats.push({ x: rand(30, W - 90), y, w: rand(56, 76), k: Math.random() < 0.15 + d * 0.04 ? "move" : Math.random() < 0.1 ? "spring" : "n", ph: rand(0, 6) });
    plats[0].x = W / 2 - 35; plats[0].k = "n";
    g.onDown = (o) => { me.tx = o.x; }; g.onMove = (o) => { me.tx = o.x; };
    function update(dt) {
      t += dt; if (endT != null) { endT += dt; if (endT > 2 && !g.over) g.end(win, win ? "勝ち！ 高い！" : fallen ? "落っこちた…" : "CPUの勝ち…", ["あなた " + best + "m", "CPU " + cpuH + "m"], false, { v: best, unit: "m" }); return; }
      if (t < 3) return; const el = t - 3;
      me.x += clamp(me.tx - me.x, -600 * dt, 600 * dt); if (me.x < -10) me.x = W + 10; if (me.x > W + 10) me.x = -10;
      const py = me.y; me.vy += 1500 * dt; me.y += me.vy * dt;
      if (me.vy > 0) for (const p of plats) { if (p.gone) continue; if (py <= p.y && me.y >= p.y && me.x > p.x - 8 && me.x < p.x + p.w + 8) { me.y = p.y; me.vy = p.k === "spring" ? -1150 : -720; if (p.k === "spring") { X.tone(500, 0.3, "triangle", 0.1, 1500); g.burst(me.x, p.y, ["#ffd43b", "#fff"], 14, 180); } else { X.tone(440 + Math.random() * 200, 0.07, "square", 0.05, 700); g.burst(me.x, p.y, "#8ce99a", 6, 90, 0.35, 2); } break; } }
      for (const p of plats) if (p.k === "move") { p.ph += dt * (1.4 + d * 0.3); p.x = clamp(p.x + Math.cos(p.ph) * 80 * dt, 0, W - p.w); }
      cam = Math.min(cam, me.y - Hh * 0.45); best = Math.max(best, Math.round((Hh - 120 - me.y) / 10));
      if (me.y > cam + Hh + 40) { endT = 0; fallen = true; win = best > cpuH; X.tone(400, 0.7, "triangle", 0.09, 100); g.shake(6); }
      if (el >= DUR && endT == null) { endT = 0; win = best > cpuH; if (win) { X.SFX.cheer(); g.flash("#fff", 0.4); } }
      if (best > cpuH && !me.passed) { me.passed = true; X.SFX.coin(); g.pop(W / 2, Hh * 0.3, "CPUの記録をこえた！", "#ffe066", 18); }
    }
    function draw(c) {
      const k = clamp(-cam / 4000, 0, 1); const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, `hsl(${210 - k * 160},70%,${70 - k * 45}%)`); gr.addColorStop(1, `hsl(${190 - k * 140},70%,${85 - k * 50}%)`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
      if (k > 0.4) { c.fillStyle = "#fff"; for (let i = 0; i < 40; i++) { c.globalAlpha = (k - 0.4) * 1.5 * (0.4 + (i % 3) * 0.2); c.fillRect((i * 67) % W, ((i * 97) - cam * 0.1) % Hh, 2, 2); } c.globalAlpha = 1; }
      c.fillStyle = "rgba(255,255,255,.5)"; for (let i = 0; i < 5; i++) { const y = ((i * 230 - cam * 0.3) % (Hh + 100)) - 50, x = (i * 97) % W; c.beginPath(); c.arc(x, y, 22, 0, 7); c.arc(x + 24, y + 4, 18, 0, 7); c.fill(); }
      const cpuY = Hh - 120 - cpuH * 10 - cam; if (cpuY > -10 && cpuY < Hh) { c.strokeStyle = "#ff6b6b"; c.setLineDash([8, 6]); c.lineWidth = 2; c.beginPath(); c.moveTo(0, cpuY); c.lineTo(W, cpuY); c.stroke(); c.setLineDash([]); K.tag(c, W - 60, cpuY - 10, "CPU " + cpuH + "m", "#e03131"); }
      for (const p of plats) { const y = p.y - cam; if (y < -20 || y > Hh + 20) continue; c.fillStyle = p.k === "move" ? "#4dabf7" : p.k === "spring" ? "#fab005" : "#51cf66"; rr(c, p.x, y, p.w, 12, 6); c.fill(); c.fillStyle = "rgba(255,255,255,.35)"; rr(c, p.x + 4, y + 2, p.w - 8, 3, 2); c.fill(); if (p.k === "spring") { c.strokeStyle = "#868e96"; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 4; i++) { c.lineTo(p.x + p.w / 2 - 6 + (i % 2) * 12, y - i * 3); } c.stroke(); } }
      const y = me.y - cam; c.save(); c.translate(me.x, y); const sq = clamp(-me.vy / 900, 0.7, 1.2); c.scale(1 / sq * 0.9 + 0.1, sq); c.fillStyle = "#40c057"; c.beginPath(); c.ellipse(0, -14, 15, 13, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(-6, -26, 6, 0, 7); c.arc(6, -26, 6, 0, 7); c.fill(); c.fillStyle = "#222"; c.beginPath(); c.arc(-5, -26, 2.6, 0, 7); c.arc(7, -26, 2.6, 0, 7); c.fill(); c.strokeStyle = "#2b8a3e"; c.lineWidth = 2; c.beginPath(); c.arc(0, -14, 6, 0.3, 2.8); c.stroke(); c.restore();
      K.hud(c, g, best + "m", "のこり " + Math.max(0, Math.ceil(DUR - Math.max(0, t - 3))) + "秒", "CPU " + cpuH + "m");
      K.countdown(g, t, c);
    }
    g.run(update, draw);
  });

  // ===== よけまくれ =====
  add({ id: "dodge", e: "☄️", n: "よけまくれ！", c: "#e8590c", genre: "action", d: "空から落ちてくるものをドラッグでよけつづけろ！CPUの記録より長く生きのこれば勝ち。" }, (diff) => {
    const g = X.pro("dodge", diff, "よけまくれ！"), W = g.W, Hh = g.H, c = g.c, d = g.d;
    const goal = [25, 35, 45, 55][d]; const me = { x: W / 2, y: Hh - 80 }; let fs = [], t = 0, endT = null, win = false, spawn = 0, life = 3, inv = 0, near = 0, stars = [];
    let drag = null; g.onDown = (o) => { drag = { ox: o.x, oy: o.y, mx: me.x, my: me.y }; }; g.onMove = (o) => { if (drag) { me.x = clamp(drag.mx + (o.x - drag.ox) * 1.4, 16, W - 16); me.y = clamp(drag.my + (o.y - drag.oy) * 1.4, Hh * 0.4, Hh - 30); } }; g.onUp = () => { drag = null; };
    const KINDS = [["rock", 16], ["fire", 12], ["ice", 14], ["big", 26]];
    function update(dt) {
      t += dt; inv -= dt; if (endT != null) { endT += dt; if (endT > 2 && !g.over) { const s = Math.min(goal, endT0); g.end(win, win ? "生きのこった！" : "やられた…", ["生きのこった時間 " + s.toFixed(1) + "秒", "CPUの記録 " + goal + "秒", "ギリギリ回避 " + near + "回"], false, { v: Math.round(s * 10) / 10, unit: "秒" }); } return; }
      if (t < 3) return; const el = t - 3;
      spawn -= dt; if (spawn <= 0) { spawn = Math.max(0.12, (0.6 - d * 0.08) - el * 0.008); const k = KINDS[Math.floor(rand(0, el > 15 ? 4 : 3))]; fs.push({ x: rand(10, W - 10), y: -30, vy: rand(160, 240) + el * 4 + d * 30, vx: k[0] === "fire" ? rand(-60, 60) : 0, r: k[1], k: k[0], rot: rand(0, 6) }); }
      if (Math.random() < dt * 0.15) stars.push({ x: rand(20, W - 20), y: -20 });
      for (const f of fs) { f.y += f.vy * dt; f.x += f.vx * dt; f.rot += dt * 3; const dd = Math.hypot(f.x - me.x, f.y - me.y);
        if (dd < f.r + 10 && inv <= 0) { life--; inv = 1.2; g.shake(8); X.SFX.boom(); g.vib(60); g.burst(me.x, me.y, ["#ff8787", "#fff"], 20, 220); f.dead = true; if (life <= 0) { endT = 0; endT0 = el; win = el >= goal; X.tone(300, 0.8, "triangle", 0.1, 90); } }
        else if (!f.nm && dd < f.r + 26 && f.y > me.y) { f.nm = true; near++; X.tone(1200, 0.05, "sine", 0.04); g.pop(me.x, me.y - 30, "ギリギリ！", "#74c0fc", 14); } }
      fs = fs.filter((f) => !f.dead && f.y < Hh + 40);
      for (const s of stars) { s.y += 120 * dt; if (Math.hypot(s.x - me.x, s.y - me.y) < 24) { s.dead = true; X.SFX.coin(); inv = 3; g.pop(me.x, me.y - 30, "むてき！", "#ffe066", 16); } } stars = stars.filter((s) => !s.dead && s.y < Hh + 20);
      if (el >= goal && endT == null) { endT = 0; endT0 = el; win = true; X.SFX.cheer(); g.flash("#fff", 0.5); fs.forEach((f) => g.burst(f.x, f.y, "#ffd43b", 6, 120)); fs = []; }
    }
    let endT0 = 0;
    function draw(c) {
      const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, "#1b1464"); gr.addColorStop(1, "#e8590c"); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
      c.fillStyle = "#2b2140"; c.beginPath(); c.moveTo(0, Hh); for (let x = 0; x <= W; x += 40) c.lineTo(x, Hh - 30 - Math.sin(x * 0.05) * 14); c.lineTo(W, Hh); c.fill();
      for (const s of stars) { c.save(); c.translate(s.x, s.y); c.rotate(g.time * 3); c.fillStyle = "#ffd43b"; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14, a = (i / 10) * Math.PI * 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); c.restore(); }
      for (const f of fs) { c.save(); c.translate(f.x, f.y); if (f.k === "fire") { const gg = c.createRadialGradient(0, 0, 2, 0, 0, f.r * 2); gg.addColorStop(0, "#fff3bf"); gg.addColorStop(0.4, "#ff922b"); gg.addColorStop(1, "rgba(255,80,0,0)"); c.fillStyle = gg; c.beginPath(); c.arc(0, -f.r * 0.5, f.r * 2, 0, 7); c.fill(); } c.rotate(f.rot); c.fillStyle = f.k === "ice" ? "#a5d8ff" : f.k === "fire" ? "#e8590c" : "#868e96"; c.beginPath(); for (let i = 0; i < 7; i++) { const a = (i / 7) * 7, r = f.r * (0.8 + (i % 2) * 0.25); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); c.fillStyle = "rgba(255,255,255,.25)"; c.beginPath(); c.arc(-f.r * 0.3, -f.r * 0.3, f.r * 0.3, 0, 7); c.fill(); c.restore(); }
      if (life > 0 || endT == null) { if (inv > 0 && Math.floor(inv * 12) % 2) c.globalAlpha = 0.45; c.save(); c.translate(me.x, me.y); c.fillStyle = "#ffe066"; c.beginPath(); c.arc(0, 0, 13, 0, 7); c.fill(); c.fillStyle = "#222"; c.beginPath(); c.arc(-4, -2, 2, 0, 7); c.arc(4, -2, 2, 0, 7); c.fill(); c.strokeStyle = "#222"; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 2, 5, 0.2, 2.9); c.stroke(); c.restore(); c.globalAlpha = 1; if (inv > 1.3) { c.strokeStyle = "#ffe066"; c.lineWidth = 3; c.beginPath(); c.arc(me.x, me.y, 22, 0, 7); c.stroke(); } }
      const el = Math.max(0, t - 3); K.hud(c, g, "❤️".repeat(Math.max(0, life)), el.toFixed(1) + "秒", "CPU " + goal + "秒");
      c.fillStyle = "rgba(255,255,255,.3)"; rr(c, 20, 50, g.W - 40, 6, 3); c.fill(); c.fillStyle = "#ffd43b"; rr(c, 20, 50, (g.W - 40) * clamp(el / goal, 0, 1), 6, 3); c.fill();
      K.countdown(g, t, c);
    }
    g.run(update, draw);
  });

  // ===== スカイダイビング =====
  add({ id: "skydive", e: "🪂", n: "スカイダイビング", c: "#1c7ed6", genre: "action", d: "空からダイブ！リングをくぐって点をかせぎ、さいごはパラシュートで的のまん中に着地しよう。" }, (diff) => {
    const g = X.pro("skydive", diff, "スカイダイビング"), W = g.W, Hh = g.H, c = g.c, d = g.d;
    const ALT = 3000, cpu = Math.round([500, 750, 950, 1150][d] * rand(0.93, 1.07));
    const me = { x: W / 2, alt: ALT, vx: 0, tx: W / 2, chute: false, land: null }; let rings = [], birds = [], score = 0, t = 0, endT = null, ringsN = 0;
    for (let a = ALT - 250; a > 450; a -= rand(130, 190)) rings.push({ x: rand(50, W - 50), alt: a, got: false, big: Math.random() < 0.2 });
    for (let a = ALT - 400; a > 600; a -= rand(250, 380)) birds.push({ x: rand(0, W), alt: a, vx: (Math.random() < 0.5 ? -1 : 1) * rand(50, 90) * (1 + d * 0.2), hit: false });
    const tgx = rand(W * 0.25, W * 0.75);
    g.onDown = (o) => { me.tx = o.x; if (!me.chute && me.alt < 600 && t > 3) { me.chute = true; X.SFX.whoosh(); X.tone(300, 0.3, "triangle", 0.08, 500); } }; g.onMove = (o) => { me.tx = o.x; };
    function update(dt) {
      t += dt; if (endT != null) { endT += dt; if (endT > 2.2 && !g.over) { const win = score > cpu; g.end(win, win ? "ナイスランディング！" : "CPUの勝ち…", ["あなた " + score + "点", "CPU " + cpu + "点", "リング " + ringsN + "こ ・ 着地 " + me.land + "点"], false, { v: score, unit: "点" }); } return; }
      if (t < 3) return;
      me.x += clamp(me.tx - me.x, -(me.chute ? 90 : 260) * dt, (me.chute ? 90 : 260) * dt); me.x = clamp(me.x, 14, W - 14);
      if (!me.chute && me.alt < 280) { me.chute = true; X.SFX.whoosh(); score -= 100; g.pop(me.x, Hh * 0.4, "自動でひらいた −100", "#ff8787", 16); }
      me.alt -= (me.chute ? 70 : 260) * dt;
      for (const r of rings) if (!r.got && Math.abs(r.alt - me.alt) < 14 && Math.abs(r.x - me.x) < (r.big ? 34 : 26)) { r.got = true; ringsN++; const p = r.big ? 150 : 80; score += p; X.SFX.coin(); g.burst(me.x, Hh * 0.38, ["#ffd43b", "#fff"], 14, 160); g.pop(me.x, Hh * 0.38 - 30, "+" + p, "#ffe066", 16); }
      for (const b of birds) { b.x += b.vx * dt; if (b.x < -30) b.x = W + 30; if (b.x > W + 30) b.x = -30; if (!b.hit && Math.abs(b.alt - me.alt) < 14 && Math.abs(b.x - me.x) < 22) { b.hit = true; score -= 60; X.SFX.hit(); g.shake(6); g.pop(me.x, Hh * 0.38 - 30, "鳥とぶつかった −60", "#ff8787", 15); } }
      if (me.alt <= 0) { const dx = Math.abs(me.x - tgx); me.land = dx < 12 ? 500 : dx < 30 ? 300 : dx < 55 ? 150 : 30; score += me.land; me.alt = 0; endT = 0; if (me.land >= 300) { X.SFX.cheer(); g.flash("#fff", 0.4); g.burst(me.x, Hh - 80, ["#ffd43b", "#ff6b6b", "#fff"], 36, 260); } else X.tone(330, 0.4, "triangle", 0.08); }
    }
    function draw(c) {
      const k = me.alt / ALT, PY = Hh * 0.38; const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, `hsl(210,70%,${45 + (1 - k) * 25}%)`); gr.addColorStop(1, `hsl(200,60%,${70 + (1 - k) * 15}%)`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
      const sy = (alt) => PY + (me.alt - alt) * 0.9;
      for (let i = 0; i < 8; i++) { const a = (ALT / 8) * i + 200, y = sy(a); if (y < -40 || y > Hh + 40) continue; c.fillStyle = "rgba(255,255,255,.6)"; const x = (i * 131) % W; c.beginPath(); c.arc(x, y, 30, 0, 7); c.arc(x + 32, y + 6, 24, 0, 7); c.arc(x - 30, y + 8, 20, 0, 7); c.fill(); }
      const gy = sy(0); if (gy < Hh + 200) { c.fillStyle = "#69db7c"; c.fillRect(0, gy, W, Hh); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(tgx, gy, 60, 14, 0, 0, 7); c.fill(); c.fillStyle = "#ff6b6b"; c.beginPath(); c.ellipse(tgx, gy, 40, 9, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(tgx, gy, 22, 5, 0, 0, 7); c.fill(); c.fillStyle = "#e03131"; c.beginPath(); c.ellipse(tgx, gy, 9, 2.5, 0, 0, 7); c.fill(); }
      for (const r of rings) { const y = sy(r.alt); if (y < -30 || y > Hh + 30) continue; c.strokeStyle = r.got ? "rgba(255,255,255,.3)" : r.big ? "#ffd43b" : "#ff922b"; c.lineWidth = r.big ? 6 : 5; c.beginPath(); c.ellipse(r.x, y, r.big ? 34 : 26, 9, 0, 0, 7); c.stroke(); }
      for (const b of birds) { const y = sy(b.alt); if (y < -30 || y > Hh + 30) continue; c.save(); c.translate(b.x, y); c.scale(b.vx > 0 ? 1 : -1, 1); c.strokeStyle = "#343a40"; c.lineWidth = 3; const f = Math.sin(g.time * 14) * 6; c.beginPath(); c.moveTo(-12, -f); c.quadraticCurveTo(-6, -4, 0, 0); c.quadraticCurveTo(6, -4, 12, -f); c.stroke(); c.restore(); }
      const y = me.alt > 0 ? PY : gy - 10; c.save(); c.translate(me.x, y);
      if (me.chute) { c.fillStyle = "#e64980"; c.beginPath(); c.arc(0, -46, 34, Math.PI, 0); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(0, -46, 34, Math.PI * 1.33, Math.PI * 1.66); c.lineTo(0, -46); c.fill(); c.strokeStyle = "#555"; c.lineWidth = 1; c.beginPath(); c.moveTo(-33, -46); c.lineTo(0, -6); c.lineTo(33, -46); c.stroke(); }
      c.fillStyle = "#4c6ef5"; rr(c, -8, -8, 16, 20, 6); c.fill(); c.strokeStyle = "#4c6ef5"; c.lineWidth = 5; c.lineCap = "round"; const sp = me.chute ? 0.3 : 1; c.beginPath(); c.moveTo(-6, -4); c.lineTo(-18 * sp - 4, -12); c.moveTo(6, -4); c.lineTo(18 * sp + 4, -12); c.moveTo(-4, 10); c.lineTo(-12 * sp - 2, 22); c.moveTo(4, 10); c.lineTo(12 * sp + 2, 22); c.stroke(); c.fillStyle = "#f8c291"; c.beginPath(); c.arc(0, -14, 7, 0, 7); c.fill(); c.fillStyle = "#ffd43b"; c.beginPath(); c.arc(0, -16, 7, Math.PI, 0); c.fill(); c.restore();
      K.hud(c, g, Math.max(0, Math.round(me.alt)) + "m", score + "点", "CPU " + cpu + "点");
      if (!me.chute && me.alt < 600 && me.alt > 0) txt(c, "タップでパラシュート！", W / 2, Hh - 40, 18, "#ffe066"); else if (t > 3 && t < 7) txt(c, "指を左右に動かしてリングをくぐろう", W / 2, Hh - 40, 14, "#fff");
      K.countdown(g, t, c);
    }
    g.run(update, draw);
  });

  // ===== フルーツスラッシュ =====
  add({ id: "slash", e: "🍉", n: "フルーツスラッシュ", c: "#e03131", genre: "action", d: "飛び出すフルーツを指でスパッと切ろう！ばくだんは切っちゃダメ。40秒の点数でCPUと勝負。" }, (diff) => {
    const g = X.pro("slash", diff, "フルーツスラッシュ"), W = g.W, Hh = g.H, c = g.c, d = g.d, DUR = 40;
    const cpu = Math.round([30, 45, 60, 75][d] * rand(0.93, 1.07)) * 10;
    const FR = [["🍉", "#e03131", "#51cf66"], ["🍊", "#ff922b", "#ff922b"], ["🍎", "#e03131", "#e03131"], ["🍋", "#fab005", "#ffe066"], ["🍇", "#7048e8", "#9775fa"], ["🍑", "#ff8787", "#ffc9c9"]];
    let fr = [], halves = [], trail = [], t = 0, score = 0, spawn = 0, endT = null, combo = 0, comboT = 0, bombs = 0;
    let down = false; g.onDown = (o) => { down = true; trail = [{ x: o.x, y: o.y, t: 0 }]; }; g.onMove = (o) => { if (!down) return; const p = trail[trail.length - 1]; trail.push({ x: o.x, y: o.y, t: 0 }); if (p) cut(p.x, p.y, o.x, o.y); }; g.onUp = () => { down = false; };
    function cut(x0, y0, x1, y1) { if (t < 3 || endT != null) return; for (const f of fr) { if (f.dead) continue; const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, k = clamp(((f.x - x0) * dx + (f.y - y0) * dy) / L2, 0, 1), px = x0 + dx * k, py = y0 + dy * k; if (Math.hypot(f.x - px, f.y - py) < f.r) { f.dead = true;
      if (f.bomb) { bombs++; score = Math.max(0, score - 50); X.SFX.boom(); g.shake(12); g.flash("#fff", 0.6); g.burst(f.x, f.y, ["#343a40", "#ff922b", "#fff"], 30, 260); g.pop(f.x, f.y - 20, "−50", "#ff8787", 22); combo = 0; continue; }
      combo = comboT > 0 ? combo + 1 : 1; comboT = 0.35; const p = 10 + (combo >= 3 ? combo * 5 : 0); score += p; X.tone(700 + combo * 80, 0.08, "triangle", 0.08, 1400); X.noise(0.06, 0.12, 3000); g.burst(f.x, f.y, [f.c1, f.c2, "#fff"], 16, 200); g.pop(f.x, f.y - 20, combo >= 3 ? combo + "コンボ +" + p : "+" + p, combo >= 3 ? "#ffe066" : "#fff", combo >= 3 ? 20 : 16);
      const a = Math.atan2(dy, dx) + Math.PI / 2; for (const s of [-1, 1]) halves.push({ x: f.x, y: f.y, vx: f.vx + Math.cos(a) * s * 90, vy: f.vy + Math.sin(a) * s * 90, r: f.r, e: f.e, rot: 0, vr: s * 4, side: s, c: f.c1 }); } } }
    function update(dt) {
      t += dt; comboT -= dt; for (const p of trail) p.t += dt; trail = trail.filter((p) => p.t < 0.18);
      if (endT != null) { endT += dt; if (endT > 1.6 && !g.over) { const win = score > cpu; g.end(win, win ? "スパッと勝利！" : "CPUの勝ち…", ["あなた " + score + "点", "CPU " + cpu + "点", bombs ? "ばくだん " + bombs + "回" : "ばくだんゼロ！"], false, { v: score, unit: "点" }); } return; }
      if (t < 3) return; const el = t - 3; if (el >= DUR) { endT = 0; if (score > cpu) { X.SFX.cheer(); g.flash("#fff", 0.4); } return; }
      spawn -= dt; if (spawn <= 0) { spawn = rand(0.5, 1.0) * (1 - d * 0.1) * (el > 20 ? 0.8 : 1); const n = Math.random() < 0.3 ? 3 : 1; for (let i = 0; i < n; i++) { const bomb = Math.random() < 0.1 + d * 0.03 + el * 0.002, f = FR[Math.floor(rand(0, FR.length))]; fr.push({ x: rand(W * 0.15, W * 0.85), y: Hh + 30, vx: rand(-60, 60), vy: -rand(620, 760), r: bomb ? 20 : 24, e: bomb ? "💣" : f[0], c1: f[1], c2: f[2], bomb, rot: rand(0, 6) }); } X.SFX.whoosh(); }
      for (const f of fr) { f.vy += 700 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += dt * 2; } fr = fr.filter((f) => !f.dead && f.y < Hh + 60);
      for (const h of halves) { h.vy += 900 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt; } halves = halves.filter((h) => h.y < Hh + 60);
    }
    function draw(c) {
      c.fillStyle = "#5c3a1a"; c.fillRect(0, 0, W, Hh); for (let x = 0; x < W; x += 46) { c.fillStyle = (x / 46) % 2 ? "#6b4423" : "#7a4f2a"; c.fillRect(x, 0, 44, Hh); c.fillStyle = "rgba(0,0,0,.1)"; c.fillRect(x + 44, 0, 2, Hh); }
      c.textAlign = "center"; c.textBaseline = "middle";
      for (const h of halves) { c.save(); c.translate(h.x, h.y); c.rotate(h.rot); c.beginPath(); c.rect(h.side < 0 ? -40 : 0, -40, 40, 80); c.clip(); c.font = h.r * 2 + "px system-ui"; c.fillText(h.e, 0, 2); c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(-1, -h.r, 2, h.r * 2); c.restore(); }
      for (const f of fr) { c.save(); c.translate(f.x, f.y); c.rotate(f.rot * 0.3); c.font = f.r * 2 + "px system-ui"; c.fillText(f.e, 0, 2); if (f.bomb) { c.fillStyle = Math.sin(g.time * 20) > 0 ? "#ffd43b" : "#ff6b6b"; c.beginPath(); c.arc(10, -16, 4, 0, 7); c.fill(); } c.restore(); }
      if (trail.length > 1) { c.strokeStyle = "#fff"; c.lineCap = "round"; for (let i = 1; i < trail.length; i++) { c.globalAlpha = 1 - trail[i].t / 0.18; c.lineWidth = 6 * (i / trail.length) + 1; c.beginPath(); c.moveTo(trail[i - 1].x, trail[i - 1].y); c.lineTo(trail[i].x, trail[i].y); c.stroke(); } c.globalAlpha = 1; }
      K.hud(c, g, "あなた " + score, "のこり " + Math.max(0, Math.ceil(DUR - Math.max(0, t - 3))) + "秒", "CPU " + cpu);
      if (t < 7 && t > 3) txt(c, "指でなぞって切る！ 💣はさけて", W / 2, Hh - 40, 15, "#fff");
      K.countdown(g, t, c);
    }
    g.run(update, draw);
  });

  // ===== リズムたいこ =====
  add({ id: "rhythm", e: "🥁", n: "リズムたいこ", c: "#c2255c", genre: "action", d: "流れてくる音符がわくに重なったらタップ！赤はドン（左）、青はカッ（右）。CPUより高いスコアをめざせ。" }, (diff) => {
    const g = X.pro("rhythm", diff, "リズムたいこ"), W = g.W, Hh = g.H, c = g.c, d = g.d;
    const BPM = [96, 112, 128, 144][d], beat = 60 / BPM, HY = Hh * 0.7, SPD = 300 + d * 40; const SONG = [];
    let tt = 4; const pat = ["1010", "1101", "1011", "1111", "1001", "1110", "0111", "1011"];
    for (let bar = 0; bar < 14; bar++) { const p = pat[(bar * 3 + d) % pat.length]; for (let i = 0; i < 4; i++) { if (p[i] === "1") SONG.push({ t: tt, k: (bar + i) % 3 === 0 ? 1 : (i % 2 ? 1 : 0), hit: null }); tt += beat * (d >= 2 && i % 2 ? 0.5 : 1); } }
    const END = tt + 1.5; const cpu = Math.round(SONG.length * [55, 70, 82, 92][d] * rand(0.96, 1.04));
    let t = 0, score = 0, combo = 0, maxC = 0, judge = null, endT = null, hitFx = [0, 0];
    const J = [["かんぺき", 0.05, 100, "#ffd43b"], ["よし", 0.1, 60, "#74c0fc"], ["おしい", 0.16, 20, "#ced4da"]];
    g.onDown = (o) => { if (t < 3 || endT != null) return; const k = o.x < W / 2 ? 0 : 1; hitFx[k] = 0.15; if (k === 0) { X.tone(110, 0.15, "sine", 0.3, 60); X.noise(0.05, 0.1, 200); } else { X.tone(1400, 0.05, "square", 0.08); X.noise(0.04, 0.12, 4000); }
      let best = null, bd = 1; for (const n of SONG) { if (n.hit != null) continue; const dd = Math.abs(n.t - t); if (dd < bd && dd < 0.18) { bd = dd; best = n; } }
      if (!best) return; if (best.k !== k) { best.hit = 0; combo = 0; judge = { s: "ちがう！", c: "#ff8787", t: 0 }; return; }
      const j = J.find((x) => bd <= x[1]) || J[2]; best.hit = j[2]; combo++; maxC = Math.max(maxC, combo); score += j[2] + Math.min(50, combo * 2); judge = { s: j[0], c: j[3], t: 0 }; g.burst(W / 2 + (k ? 60 : -60), HY, k ? ["#4dabf7", "#fff"] : ["#ff6b6b", "#fff"], 12, 160); if (combo % 10 === 0) { g.pop(W / 2, HY - 90, combo + "コンボ！", "#ffe066", 22); X.SFX.coin(); } };
    function update(dt) {
      t += dt; hitFx[0] -= dt; hitFx[1] -= dt; if (judge) judge.t += dt;
      for (const n of SONG) if (n.hit == null && t - n.t > 0.18) { n.hit = 0; combo = 0; judge = { s: "ミス", c: "#ff8787", t: 0 }; }
      if (t >= 3) { const bi = Math.floor((t - 4) / beat); if (bi !== g.__b && t > 4 && t < END - 1) { g.__b = bi; X.tone(bi % 4 ? 220 : 330, 0.05, "triangle", 0.03); } }
      if (t >= END && endT == null) { endT = 0; const win = score > cpu; if (win) { X.SFX.cheer(); g.flash("#fff", 0.4); } }
      if (endT != null) { endT += dt; if (endT > 1.4 && !g.over) { const win = score > cpu; const perf = SONG.filter((n) => n.hit === 100).length; g.end(win, win ? "フルスコア級！ 勝ち！" : "CPUの勝ち…", ["あなた " + score + "点", "CPU " + cpu + "点", "かんぺき " + perf + " ・ 最大コンボ " + maxC], false, { v: score, unit: "点" }); } }
    }
    function draw(c) {
      const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, "#2b1055"); gr.addColorStop(1, "#c2255c"); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
      const pulse = t > 4 ? 1 - ((t - 4) % beat) / beat : 0; c.fillStyle = `rgba(255,255,255,${0.05 + pulse * 0.08})`; c.beginPath(); c.arc(W / 2, Hh * 0.35, 90 + pulse * 10, 0, 7); c.fill();
      for (const [k, x, col] of [[0, W / 2 - 60, "#ff6b6b"], [1, W / 2 + 60, "#4dabf7"]]) { c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(x - 34, 60, 68, HY - 60 + 40); c.strokeStyle = hitFx[k] > 0 ? "#fff" : col; c.lineWidth = 4; c.beginPath(); c.arc(x, HY, 30, 0, 7); c.stroke(); }
      for (const n of SONG) { if (n.hit != null && n.hit > 0) continue; const y = HY - (n.t - t) * SPD; if (y < 40 || y > Hh) continue; const x = W / 2 + (n.k ? 60 : -60); c.globalAlpha = n.hit === 0 ? 0.3 : 1; c.fillStyle = n.k ? "#4dabf7" : "#ff6b6b"; c.beginPath(); c.arc(x, y, 24, 0, 7); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 3; c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.arc(x - 6, y - 4, 3, 0, 7); c.arc(x + 6, y - 4, 3, 0, 7); c.fill(); c.globalAlpha = 1; }
      // たいこ
      const dy = Hh - 120; c.fillStyle = hitFx[0] > 0 ? "#ff8787" : "#e03131"; rr(c, 10, dy, W / 2 - 16, 106, 24); c.fill(); c.fillStyle = hitFx[1] > 0 ? "#a5d8ff" : "#1c7ed6"; rr(c, W / 2 + 6, dy, W / 2 - 16, 106, 24); c.fill();
      txt(c, "ドン", W / 4, dy + 53, 26, "#fff"); txt(c, "カッ", (W * 3) / 4, dy + 53, 26, "#fff");
      if (judge && judge.t < 0.5) txt(c, judge.s, W / 2, HY - 60, 24, judge.c);
      if (combo >= 3) txt(c, combo + " コンボ", W / 2, HY + 50, 16, "#fff");
      K.hud(c, g, "あなた " + score, "", "CPU " + cpu);
      c.fillStyle = "rgba(255,255,255,.3)"; rr(c, 20, 50, W - 40, 6, 3); c.fill(); c.fillStyle = "#ffd43b"; rr(c, 20, 50, (W - 40) * clamp((t - 3) / (END - 3), 0, 1), 6, 3); c.fill();
      K.countdown(g, t, c);
    }
    g.run(update, draw);
  });
})();
