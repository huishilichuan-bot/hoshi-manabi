/* ほしまなび — シューティング（縦スクロール5種）と、ねらう・投げるスポーツ（アーチェリー・ダーツ・クレー射撃・射的・やり投げ・砲丸投げ・ハンマー投げ・走り幅跳び・スキージャンプ）。すべてオリジナル */
(() => {
  "use strict";
  const H = window.HMGames, X = window.HMPro, K = window.HMKit, { rr, txt, clamp, lerp, rand } = X;
  const add = (m, fn) => H.add(Object.assign({ pro: true }, m), fn);
  // ===== 縦スクロールシューティング =====
  const SH = {
    galaxy: { bg: ["#0b0b2a", "#1b1464"], star: true, me(c, t) { c.fillStyle = "#e9ecef"; c.beginPath(); c.moveTo(0, -20); c.lineTo(14, 14); c.lineTo(0, 8); c.lineTo(-14, 14); c.fill(); c.fillStyle = "#4dabf7"; c.beginPath(); c.arc(0, -2, 5, 0, 7); c.fill(); c.fillStyle = "#ff922b"; c.beginPath(); c.moveTo(-5, 12); c.lineTo(0, 22 + Math.sin(t * 40) * 4); c.lineTo(5, 12); c.fill(); }, en(c, t, k) { c.fillStyle = ["#ff6b6b", "#cc5de8", "#51cf66"][k % 3]; c.beginPath(); c.moveTo(0, 14); c.lineTo(14, -8); c.lineTo(6, -4); c.lineTo(0, -12); c.lineTo(-6, -4); c.lineTo(-14, -8); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(0, -2, 3.5, 0, 7); c.fill(); }, boss(c, t) { c.fillStyle = "#862e9c"; c.beginPath(); c.ellipse(0, 0, 70, 30, 0, 0, 7); c.fill(); c.fillStyle = "#be4bdb"; c.beginPath(); c.ellipse(0, -10, 34, 22, 0, 0, 7); c.fill(); c.fillStyle = "#ffe066"; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * 24, 14, 5, 0, 7); c.fill(); } c.fillStyle = "#ff8787"; c.beginPath(); c.arc(0, -10, 8 + Math.sin(t * 6) * 2, 0, 7); c.fill(); }, shot: "#74c0fc", ebul: "#ff6b6b", bossName: "宇宙要さい" },
    sky: { bg: ["#74c0fc", "#d0ebff"], cloud: true, me(c, t) { c.fillStyle = "#e03131"; rr(c, -24, -4, 48, 10, 4); c.fill(); c.fillStyle = "#c92a2a"; rr(c, -5, -20, 10, 38, 5); c.fill(); rr(c, -12, 12, 24, 6, 3); c.fill(); c.fillStyle = "#ced4da"; c.globalAlpha = 0.7; c.fillRect(-14, -22, 28, 2 + Math.abs(Math.sin(t * 50)) * 2); c.globalAlpha = 1; c.fillStyle = "#74c0fc"; c.beginPath(); c.arc(0, -4, 4, 0, 7); c.fill(); }, en(c, t, k) { c.fillStyle = ["#495057", "#5c940d", "#364fc7"][k % 3]; rr(c, -18, -4, 36, 8, 3); c.fill(); rr(c, -4, -16, 8, 30, 4); c.fill(); rr(c, -9, -16, 18, 5, 2); c.fill(); }, boss(c, t) { c.fillStyle = "#343a40"; rr(c, -80, -10, 160, 22, 8); c.fill(); rr(c, -16, -46, 32, 90, 14); c.fill(); c.fillStyle = "#495057"; rr(c, -40, 30, 80, 10, 4); c.fill(); c.fillStyle = "#ffd43b"; for (const x of [-56, -30, 30, 56]) { c.beginPath(); c.arc(x, 4, 6, 0, 7); c.fill(); } c.fillStyle = "#ced4da"; c.globalAlpha = 0.6; for (const x of [-56, -30, 30, 56]) c.fillRect(x - 12, 16 + Math.sin(t * 50) * 2, 24, 2); c.globalAlpha = 1; }, shot: "#ffe066", ebul: "#343a40", bossName: "巨大ばくげき機" },
    sea: { bg: ["#0b7285", "#062c3a"], bubble: true, me(c, t) { c.fillStyle = "#ffd43b"; c.beginPath(); c.ellipse(0, 0, 13, 22, 0, 0, 7); c.fill(); c.fillStyle = "#fab005"; rr(c, -4, -30, 8, 12, 3); c.fill(); c.fillStyle = "#74c0fc"; c.beginPath(); c.arc(0, -6, 5, 0, 7); c.arc(0, 8, 4, 0, 7); c.fill(); c.strokeStyle = "#868e96"; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, 24); c.lineTo(8, 24); c.stroke(); }, en(c, t, k) { if (k % 3 === 2) { c.fillStyle = "#343a40"; c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill(); c.fillStyle = "#fa5252"; for (let i = 0; i < 6; i++) { const a = (i / 6) * 7; c.fillRect(Math.cos(a) * 12 - 2, Math.sin(a) * 12 - 2, 4, 4); } return; } c.fillStyle = k % 3 ? "#ff922b" : "#cc5de8"; c.beginPath(); c.ellipse(0, 0, 9, 15, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(0, -12); c.lineTo(-9, -24 + Math.sin(t * 10) * 3); c.lineTo(9, -24 - Math.sin(t * 10) * 3); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(-4, 8, 2.5, 0, 7); c.arc(4, 8, 2.5, 0, 7); c.fill(); }, boss(c, t) { c.fillStyle = "#c2255c"; c.beginPath(); c.ellipse(0, -10, 50, 40, 0, 0, 7); c.fill(); c.strokeStyle = "#c2255c"; c.lineWidth = 9; c.lineCap = "round"; for (let i = 0; i < 6; i++) { const x = -45 + i * 18; c.beginPath(); c.moveTo(x, 20); c.quadraticCurveTo(x + Math.sin(t * 3 + i) * 16, 50, x + Math.sin(t * 2 + i) * 10, 76); c.stroke(); } c.fillStyle = "#fff"; c.beginPath(); c.arc(-16, 0, 10, 0, 7); c.arc(16, 0, 10, 0, 7); c.fill(); c.fillStyle = "#222"; c.beginPath(); c.arc(-14, 3, 5, 0, 7); c.arc(14, 3, 5, 0, 7); c.fill(); }, shot: "#c5f6fa", ebul: "#ff8787", bossName: "大ダコ" },
    dragon: { bg: ["#fd7e14", "#5f3dc4"], cloud: true, me(c, t) { const f = Math.sin(t * 12) * 0.5; c.fillStyle = "#2f9e44"; c.save(); c.rotate(-0.3 - f * 0.4); c.beginPath(); c.moveTo(-4, 0); c.lineTo(-30, -14); c.lineTo(-22, 8); c.fill(); c.restore(); c.save(); c.rotate(0.3 + f * 0.4); c.beginPath(); c.moveTo(4, 0); c.lineTo(30, -14); c.lineTo(22, 8); c.fill(); c.restore(); c.fillStyle = "#40c057"; c.beginPath(); c.ellipse(0, 4, 9, 18, 0, 0, 7); c.fill(); c.beginPath(); c.arc(0, -16, 7, 0, 7); c.fill(); c.fillStyle = "#ffe066"; c.beginPath(); c.arc(-3, -18, 1.8, 0, 7); c.arc(3, -18, 1.8, 0, 7); c.fill(); c.fillStyle = "#e03131"; rr(c, -6, 0, 12, 8, 3); c.fill(); }, en(c, t, k) { const f = Math.sin(t * 16 + k) * 8; c.fillStyle = "#3b2f63"; c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, -6 + f); c.lineTo(-10, 4); c.lineTo(-16, 8 + f * 0.5); c.lineTo(0, 6); c.lineTo(16, 8 + f * 0.5); c.lineTo(10, 4); c.lineTo(18, -6 + f); c.fill(); c.fillStyle = "#ff6b6b"; c.beginPath(); c.arc(-3, 1, 1.6, 0, 7); c.arc(3, 1, 1.6, 0, 7); c.fill(); }, boss(c, t) { c.fillStyle = "#5c940d"; c.beginPath(); c.ellipse(0, 0, 44, 34, 0, 0, 7); c.fill(); c.fillStyle = "#74b816"; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 30, -6); c.lineTo(s * 96, -40 + Math.sin(t * 5) * 14); c.lineTo(s * 70, 20); c.fill(); } c.fillStyle = "#94d82d"; c.beginPath(); c.ellipse(0, 36, 22, 18, 0, 0, 7); c.fill(); c.fillStyle = "#ffe066"; c.beginPath(); c.arc(-9, 34, 4, 0, 7); c.arc(9, 34, 4, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-12, 46); c.lineTo(-8, 54); c.lineTo(-4, 46); c.moveTo(4, 46); c.lineTo(8, 54); c.lineTo(12, 46); c.fill(); }, shot: "#ff922b", ebul: "#cc5de8", bossName: "まおうドラゴン" },
    garden: { bg: ["#d3f9d8", "#8ce99a"], flower: true, me(c, t) { c.fillStyle = "#e03131"; c.beginPath(); c.ellipse(0, 2, 14, 17, 0, 0, 7); c.fill(); c.fillStyle = "#212529"; c.fillRect(-1, -14, 2, 32); c.beginPath(); c.arc(0, -14, 8, Math.PI, 0); c.fill(); for (const [x, y] of [[-7, -2], [7, 2], [-6, 10], [6, 9]]) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); } c.fillStyle = "#fff"; c.beginPath(); c.arc(-3, -17, 2, 0, 7); c.arc(3, -17, 2, 0, 7); c.fill(); }, en(c, t, k) { const f = Math.abs(Math.sin(t * 30)); c.fillStyle = "rgba(255,255,255,.7)"; c.beginPath(); c.ellipse(-8, -6, 8, 4 + f * 3, -0.5, 0, 7); c.ellipse(8, -6, 8, 4 + f * 3, 0.5, 0, 7); c.fill(); c.fillStyle = "#fab005"; c.beginPath(); c.ellipse(0, 0, 8, 12, 0, 0, 7); c.fill(); c.fillStyle = "#212529"; c.fillRect(-8, -2, 16, 3); c.fillRect(-7, 4, 14, 3); c.beginPath(); c.moveTo(-2, 11); c.lineTo(0, 17); c.lineTo(2, 11); c.fill(); }, boss(c, t) { const f = Math.abs(Math.sin(t * 25)); c.fillStyle = "rgba(255,255,255,.75)"; c.beginPath(); c.ellipse(-40, -20, 36, 14 + f * 8, -0.4, 0, 7); c.ellipse(40, -20, 36, 14 + f * 8, 0.4, 0, 7); c.fill(); c.fillStyle = "#f59f00"; c.beginPath(); c.ellipse(0, 0, 34, 46, 0, 0, 7); c.fill(); c.fillStyle = "#212529"; for (let i = -2; i <= 2; i++) c.fillRect(-32 + Math.abs(i) * 3, i * 14 - 3, 64 - Math.abs(i) * 6, 6); c.fillStyle = "#ff6b6b"; c.beginPath(); c.arc(-12, -30, 6, 0, 7); c.arc(12, -30, 6, 0, 7); c.fill(); }, shot: "#fff", ebul: "#e67700", bossName: "女王バチ" },
  };
  function shooter(cfg) {
    add({ id: cfg.id, e: cfg.e, n: cfg.n, c: cfg.c, d: cfg.d, genre: "shoot" }, (diff) => {
      const g = X.pro(cfg.id, diff, cfg.n), W = g.W, Hh = g.H, c = g.c, d = g.d, th = SH[cfg.th];
      const me = { x: W / 2, y: Hh - 110, inv: 2, life: 3, pow: 1, sh: 0 }; let shots = [], ens = [], ebs = [], items = [], boss = null, t = 0, wave = 0, waveT = 1.5, score = 0, fireT = 0, combo = 0, endT = null, win = false;
      const WAVES = 6 + d, ehp = [1, 1, 2, 2][d], espd = [70, 90, 110, 130][d], efire = [0.25, 0.4, 0.55, 0.75][d];
      let drag = null; g.onDown = (o) => { drag = { ox: o.x, oy: o.y, mx: me.x, my: me.y }; }; g.onMove = (o) => { if (!drag) return; me.x = clamp(drag.mx + (o.x - drag.ox) * 1.3, 18, W - 18); me.y = clamp(drag.my + (o.y - drag.oy) * 1.3, Hh * 0.35, Hh - 30); }; g.onUp = () => { drag = null; };
      function spawnWave() { wave++; const pat = wave % 4, n = 5 + Math.min(4, wave);
        for (let i = 0; i < n; i++) { const k = Math.floor(rand(0, 3)); if (pat === 0) ens.push({ x: (W / (n + 1)) * (i + 1), y: -30 - i * 8, vx: 0, vy: espd, k, hp: ehp, t: 0, pat: "line" });
          else if (pat === 1) ens.push({ x: -20 - i * 40, y: 90 + (i % 2) * 40, vx: espd * 1.3, vy: 12, k, hp: ehp, t: 0, pat: "side" });
          else if (pat === 2) ens.push({ x: W / 2, y: -30 - i * 50, vx: 0, vy: espd, k, hp: ehp, t: i, pat: "sine" });
          else ens.push({ x: rand(30, W - 30), y: -30 - i * 60, vx: 0, vy: espd * 0.7, k, hp: ehp, t: 0, pat: "dive" }); } }
      function hitMe() { if (me.inv > 0 || endT != null) return; if (me.sh > 0) { me.sh = 0; me.inv = 1; X.SFX.pop(); g.flash("#74c0fc", 0.3); return; } me.life--; me.inv = 2; me.pow = Math.max(1, me.pow - 1); combo = 0; g.shake(10); X.SFX.boom(); g.vib(80); g.burst(me.x, me.y, ["#ff8787", "#ffd43b", "#fff"], 30, 260); if (me.life <= 0) { endT = 0; win = false; } }
      function kill(e) { score += 100 + combo * 10; combo++; X.SFX.pop(); g.burst(e.x, e.y, ["#ffd43b", "#ff922b", "#fff"], 16, 200); g.pop(e.x, e.y - 10, "+" + (100 + (combo - 1) * 10), "#ffe066", 16); if (Math.random() < 0.12) items.push({ x: e.x, y: e.y, k: Math.random() < 0.6 ? "P" : "S" }); }
      function update(dt) {
        t += dt; me.inv = Math.max(0, me.inv - dt); me.sh = Math.max(0, me.sh - dt);
        if (endT != null) { endT += dt; if (endT > 2.2 && !g.over) g.end(win, win ? cfg.winT || "ボスをたおした！" : "やられた…", ["スコア " + score, "ウェーブ " + Math.min(wave, WAVES) + " / " + WAVES, win ? "残りライフ " + me.life : boss ? "ボスのこりHP " + Math.ceil(boss.hp / boss.max * 100) + "%" : ""], false, { v: score, unit: "点" }); if (!win) return; }
        if (t > 3 && endT == null) { fireT -= dt; if (fireT <= 0) { fireT = 0.16; const n = me.pow; for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 0.16; shots.push({ x: me.x, y: me.y - 18, vx: Math.sin(a) * 600, vy: -Math.cos(a) * 600 }); } if (Math.random() < 0.3) X.SFX.shoot(); } }
        if (t > 3 && !boss && endT == null) { waveT -= dt; if (waveT <= 0 && ens.length < 4) { if (wave < WAVES) { spawnWave(); waveT = 2.2; } else { boss = { x: W / 2, y: -80, hp: 60 + d * 30, max: 60 + d * 30, t: 0, ph: 0 }; X.tone(110, 1, "sawtooth", 0.1, 55); g.flash("#ff6b6b", 0.3); } } }
        for (const s of shots) { s.x += s.vx * dt; s.y += s.vy * dt; } shots = shots.filter((s) => s.y > -20 && !s.dead);
        for (const e of ens) { e.t += dt; if (e.pat === "sine") { e.y += e.vy * dt; e.x = W / 2 + Math.sin(e.t * 1.6) * W * 0.36; } else if (e.pat === "side") { e.x += e.vx * dt; e.y += e.vy * dt; } else if (e.pat === "dive") { e.y += e.vy * dt * (e.y > Hh * 0.3 ? 1.8 : 1); e.x += clamp(me.x - e.x, -60, 60) * dt * (e.y > Hh * 0.3 ? 0.8 : 0); } else e.y += e.vy * dt;
          if (t > 3 && Math.random() < dt * efire && e.y > 0 && e.y < Hh * 0.6) { const a = Math.atan2(me.y - e.y, me.x - e.x); ebs.push({ x: e.x, y: e.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170 }); }
          for (const s of shots) if (!s.dead && Math.abs(s.x - e.x) < 16 && Math.abs(s.y - e.y) < 16) { s.dead = true; e.hp--; g.burst(s.x, s.y, "#fff", 3, 80, 0.25, 2); if (e.hp <= 0) { e.dead = true; kill(e); } }
          if (!e.dead && Math.hypot(e.x - me.x, e.y - me.y) < 22) { e.dead = true; hitMe(); g.burst(e.x, e.y, "#ff922b", 14, 160); } }
        ens = ens.filter((e) => !e.dead && e.y < Hh + 40 && e.x > -80 - 400 && e.x < W + 80);
        if (boss && endT == null) { boss.t += dt; boss.y = lerp(boss.y, 110, dt * 1.2); boss.x = W / 2 + Math.sin(boss.t * 0.8) * W * 0.25; boss.ph -= dt;
          if (boss.ph <= 0 && boss.y > 60) { boss.ph = [1.4, 1.1, 0.9, 0.7][d]; const n = 6 + d * 2, off = boss.t; for (let i = 0; i < n; i++) { const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.22 + Math.sin(off) * 0.2; ebs.push({ x: boss.x, y: boss.y + 30, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150 }); } X.tone(180, 0.15, "sawtooth", 0.05); }
          for (const s of shots) if (!s.dead && Math.abs(s.x - boss.x) < 60 && Math.abs(s.y - boss.y) < 34) { s.dead = true; boss.hp--; score += 10; g.burst(s.x, s.y, "#fff", 3, 90, 0.25, 2); if (boss.hp % 10 === 0) X.SFX.hit(); }
          if (boss.hp <= 0) { endT = 0; win = true; score += 3000 + me.life * 500; g.shake(16); g.flash("#fff", 0.8); X.SFX.boom(); setTimeout(() => X.SFX.boom(), 250); for (let i = 0; i < 6; i++) g.burst(boss.x + rand(-50, 50), boss.y + rand(-30, 30), ["#ffd43b", "#ff922b", "#ff6b6b", "#fff"], 30, 300, 1); ebs = []; boss.dead = true; } }
        for (const b of ebs) { b.x += b.vx * dt; b.y += b.vy * dt; if (Math.hypot(b.x - me.x, b.y - me.y) < 10) { b.dead = true; hitMe(); } } ebs = ebs.filter((b) => !b.dead && b.y < Hh + 20 && b.y > -20 && b.x > -20 && b.x < W + 20);
        for (const it of items) { it.y += 80 * dt; if (Math.hypot(it.x - me.x, it.y - me.y) < 24) { it.dead = true; X.SFX.coin(); if (it.k === "P") { me.pow = Math.min(4, me.pow + 1); g.pop(me.x, me.y - 30, "パワーアップ！", "#ffe066", 16); } else { me.sh = 8; g.pop(me.x, me.y - 30, "バリア！", "#74c0fc", 16); } } } items = items.filter((i) => !i.dead && i.y < Hh + 20);
      }
      function draw(c) {
        const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, th.bg[0]); gr.addColorStop(1, th.bg[1]); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
        if (th.star) for (let i = 0; i < 70; i++) { const sp = 30 + (i % 3) * 40; c.globalAlpha = 0.3 + (i % 3) * 0.25; c.fillStyle = "#fff"; c.fillRect((i * 67) % W, (i * 41 + g.time * sp) % Hh, 2, 2); }
        if (th.cloud) { c.fillStyle = "rgba(255,255,255,.55)"; for (let i = 0; i < 6; i++) { const y = (i * 160 + g.time * 50) % (Hh + 100) - 50, x = (i * 113) % W; c.beginPath(); c.arc(x, y, 24, 0, 7); c.arc(x + 26, y + 4, 20, 0, 7); c.arc(x - 24, y + 6, 18, 0, 7); c.fill(); } }
        if (th.bubble) { c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 1.5; for (let i = 0; i < 24; i++) { const y = Hh - ((i * 53 + g.time * 40) % (Hh + 20)), x = (i * 89) % W + Math.sin(g.time + i) * 6; c.beginPath(); c.arc(x, y, 2 + (i % 4), 0, 7); c.stroke(); } }
        if (th.flower) for (let i = 0; i < 14; i++) { const y = (i * 90 + g.time * 40) % (Hh + 40) - 20, x = (i * 97) % W; c.fillStyle = ["#ff8787", "#ffd43b", "#fff", "#da77f2"][i % 4]; for (let j = 0; j < 5; j++) { const a = (j / 5) * 7; c.beginPath(); c.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 4.5, 0, 7); c.fill(); } c.fillStyle = "#fab005"; c.beginPath(); c.arc(x, y, 3.5, 0, 7); c.fill(); }
        for (const it of items) { c.fillStyle = it.k === "P" ? "#ffd43b" : "#74c0fc"; c.beginPath(); c.arc(it.x, it.y, 11, 0, 7); c.fill(); txt(c, it.k, it.x, it.y + 1, 13, "#fff"); }
        c.fillStyle = th.shot; for (const s of shots) { rr(c, s.x - 2, s.y - 8, 4, 14, 2); c.fill(); }
        for (const e of ens) { c.save(); c.translate(e.x, e.y); th.en(c, g.time, e.k); c.restore(); }
        if (boss && !boss.dead) { c.save(); c.translate(boss.x, boss.y); th.boss(c, g.time); c.restore(); c.fillStyle = "rgba(0,0,0,.5)"; rr(c, 20, 52, W - 40, 12, 6); c.fill(); c.fillStyle = "#ff6b6b"; rr(c, 22, 54, (W - 44) * boss.hp / boss.max, 8, 4); c.fill(); txt(c, th.bossName, W / 2, 74, 12, "#fff"); }
        for (const b of ebs) { c.fillStyle = th.ebul; c.beginPath(); c.arc(b.x, b.y, 5, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(b.x, b.y, 2, 0, 7); c.fill(); }
        if (!(endT != null && !win)) { if (me.inv > 0 && Math.floor(me.inv * 12) % 2) c.globalAlpha = 0.4; c.save(); c.translate(me.x, me.y); th.me(c, g.time); c.restore(); c.globalAlpha = 1; if (me.sh > 0) { c.strokeStyle = "rgba(116,192,252,.8)"; c.lineWidth = 3; c.beginPath(); c.arc(me.x, me.y, 26, 0, 7); c.stroke(); } }
        K.hud(c, g, "❤️".repeat(Math.max(0, me.life)), boss ? "BOSS!" : "ウェーブ " + Math.max(1, Math.min(wave, WAVES)) + "/" + WAVES, score + "点");
        if (t < 6) { c.globalAlpha = Math.min(1, 6 - t); txt(c, "ドラッグで動く（たまは自動）", W / 2, Hh - 40, 14, "#fff"); c.globalAlpha = 1; }
        K.countdown(g, t, c);
      }
      g.run(update, draw);
    });
  }
  shooter({ id: "galaxy", e: "🛸", n: "ギャラクシー防衛", c: "#3b2f63", th: "galaxy", d: "宇宙から来る敵の群れをうちおとし、さいごに宇宙要さいをたおそう。P でパワーアップ、S でバリア。" });
  shooter({ id: "skyace", e: "✈️", n: "スカイエース", c: "#1c7ed6", th: "sky", d: "雲の上の空中戦。敵の飛行機をたおして、巨大ばくげき機に勝て！" });
  shooter({ id: "subhunt", e: "🐙", n: "深海シューター", c: "#0b7285", th: "sea", d: "潜水艦で深い海へ。機雷と魚をよけながら、大ダコをたおそう。" });
  shooter({ id: "dragonrider", e: "🐉", n: "ドラゴンライダー", c: "#e8590c", th: "dragon", d: "小さなドラゴンに乗ってコウモリの群れをけちらし、まおうドラゴンに挑め！" });
  shooter({ id: "bugbuster", e: "🐞", n: "てんとう虫バスター", c: "#2f9e44", th: "garden", d: "花畑を守るてんとう虫。ハチの大群をうちおとして、女王バチをたおそう。" });

  // ===== 投てき・跳躍（3回の記録でCPUとくらべる） =====
  function thrower(cfg) {
    add({ id: cfg.id, e: cfg.e, n: cfg.n, c: cfg.c, d: cfg.d, genre: "sports" }, (diff) => {
      const g = X.pro(cfg.id, diff, cfg.n), W = g.W, Hh = g.H, c = g.c, d = g.d;
      const cpuBest = Math.round(cfg.rec * [0.62, 0.74, 0.84, 0.93][d] * rand(0.97, 1.03) * 100) / 100;
      let angT = 0, tries = [], phase = "ready", t = 0, pw = 0, ang = 0, angDir = 1, meterT = 0, proj = null, runX = 0, foul = false, msg = null, lastTap = 0, cam = 0, spin = 0;
      const GY = Hh * 0.7, M = cfg.scale; // M：1mあたりのピクセル
      const lineX = W * 0.32;
      function start() { phase = cfg.power; pw = 0; runX = 0; spin = 0; foul = false; meterT = 0; proj = null; cam = 0; ang = 10; angDir = 1; }
      g.onDown = () => { const now = g.time;
        if (phase === "ready") { start(); return; }
        if (phase === "mash") { if (now - lastTap > 0.03) { pw = Math.min(1, pw + 0.065); lastTap = now; X.tone(400 + pw * 500, 0.04, "square", 0.04); } if (cfg.mashToLine && runX >= 1) { } return; }
        if (phase === "meter") { phase = "angle"; X.SFX.pop(); return; }
        if (phase === "angle") { release(); return; } };
      function release() {
        const a = (ang * Math.PI) / 180, eff = cfg.opt ? Math.cos(((ang - cfg.opt) * Math.PI) / 180 * 1.6) : 1;
        const dist = Math.max(0.5, cfg.rec * 1.08 * Math.pow(pw, 1.35) * Math.max(0.15, eff) * rand(0.98, 1.02));
        foul = false;
        proj = { t: 0, T: cfg.flight || 1.6, dist, a, x0: lineX, y0: GY - (cfg.h0 || 40), peak: Math.tan(a) * dist * M / 4 + 20 };
        phase = "fly"; X.SFX.whoosh(); cfg.kind === "jump" ? X.tone(600, 0.2, "triangle", 0.08, 900) : X.SFX.kick(); g.vib(20);
      }
      function update(dt) {
        t += dt;
        if (phase === "mash") { pw = Math.max(0, pw - dt * 0.38); if (cfg.mashToLine) { runX += dt * (0.12 + pw * 0.42); if (runX >= 1) { runX = 1; phase = "angle"; ang = 10; angT = 0; X.tone(880, 0.1, "square", 0.06); } } else { meterT += dt; if (meterT > 2.8) { phase = "angle"; ang = 10; } } spin += dt * (2 + pw * 12); }
        if (phase === "meter") { meterT += dt; pw = 0.5 - 0.5 * Math.cos(meterT * (2.6 + d * 0.5)); }
        if (phase === "angle") { ang += angDir * dt * (70 + d * 20); if (ang > 75) { ang = 75; angDir = -1; } if (ang < 5) { ang = 5; angDir = 1; } angT += dt; if (cfg.mashToLine && angT > 2.5) { release(); foul = true; } }
        if (phase === "fly") { proj.t += dt; if (proj.t >= proj.T) { phase = "land"; t = 0; const v = foul ? 0 : Math.round(proj.dist * 100) / 100; tries.push(v); if (foul) { X.SFX.bad(); msg = { s: "ファウル！", c: "#ff8787" }; } else { g.shake(5); X.tone(220, 0.15, "square", 0.08); g.burst(lineX + proj.dist * M - cam, GY, cfg.dust || "#c9a26a", 18, 160); const best = v >= Math.max(...tries); msg = { s: v.toFixed(2) + "m" + (v > cpuBest ? "！" : ""), c: v > cpuBest ? "#ffe066" : "#fff" }; if (v > cpuBest) { X.SFX.cheer(); g.flash("#fff", 0.3); } } } }
        if (phase === "fly" || phase === "land") { const px = lineX + (proj ? proj.dist * M * Math.min(1, proj.t / proj.T) : 0); cam = lerp(cam, Math.max(0, px - W * 0.55), dt * 3); }
        if (phase === "land" && t > 1.8) { if (tries.length >= 3) { phase = "end"; const best = Math.max(...tries); const win = best > cpuBest; g.end(win, win ? "金メダル！ CPUに勝った！" : "CPUの勝ち…", ["ベスト " + best.toFixed(2) + "m", "CPU " + cpuBest.toFixed(2) + "m", "記録 " + tries.map((v) => (v ? v.toFixed(2) : "×")).join("・")], false, { v: best, unit: "m" }); } else { phase = "ready"; msg = null; cam = 0; } }
      }
      function draw(c) {
        const gr = c.createLinearGradient(0, 0, 0, GY); gr.addColorStop(0, cfg.sky ? cfg.sky[0] : "#74c0fc"); gr.addColorStop(1, cfg.sky ? cfg.sky[1] : "#d0ebff"); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
        c.fillStyle = cfg.stand || "#868e96"; for (let i = -1; i < W / 60 + 2; i++) { const x = -((cam * 0.3) % 60) + i * 60; c.fillRect(x, GY - 110, 56, 50); c.fillStyle = "rgba(255,255,255,.25)"; for (let j = 0; j < 5; j++) c.fillRect(x + 4 + j * 10, GY - 104 + (j % 2) * 8, 6, 6); c.fillStyle = cfg.stand || "#868e96"; }
        c.fillStyle = cfg.ground || "#51cf66"; c.fillRect(0, GY - 60, W, Hh); c.fillStyle = cfg.field || "#c2552f"; c.fillRect(0, GY - 14, W, 28);
        if (cfg.ski) { c.fillStyle = "#dee2e6"; c.beginPath(); c.moveTo(-cam - 40, GY - 200); c.lineTo(lineX - cam, GY - 24); c.lineTo(lineX - cam, GY + 14); c.lineTo(-cam - 40, GY + 14); c.fill(); c.strokeStyle = "#4dabf7"; c.lineWidth = 3; c.beginPath(); c.moveTo(-cam - 40, GY - 200); c.lineTo(lineX - cam, GY - 24); c.stroke(); }
        // きょりの目もり
        for (let m = 0; m <= cfg.rec * 1.5; m += cfg.tick) { const x = lineX + m * M - cam; if (x < -20 || x > W + 20) continue; c.fillStyle = "rgba(255,255,255,.8)"; c.fillRect(x - 1, GY - 14, 2, 28); txt(c, m + "m", x, GY + 26, 11, "#fff", "center", 800); }
        c.fillStyle = "#fff"; c.fillRect(lineX - 2 - cam, GY - 16, 4, 32);
        // CPUの記録
        const cx = lineX + cpuBest * M - cam; c.strokeStyle = "#ff6b6b"; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(cx, GY - 90); c.lineTo(cx, GY + 14); c.stroke(); c.setLineDash([]); K.tag(c, cx, GY - 98, "CPU " + cpuBest.toFixed(2) + "m", "#e03131");
        const myBest = tries.length ? Math.max(...tries) : 0; if (myBest) { const bx = lineX + myBest * M - cam; c.strokeStyle = "#ffd43b"; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, GY - 70); c.lineTo(bx, GY + 14); c.stroke(); K.tag(c, bx, GY - 78, "ベスト " + myBest.toFixed(2), "#f08c00"); }
        // 選手と道具
        const runOff = cfg.mashToLine ? (runX - 1) * 150 : 0;
        let px = lineX - 26 + runOff - cam;
        if (cfg.kind === "jump" && (phase === "fly" || phase === "land")) { const k = Math.min(1, proj.t / proj.T); const x = proj.x0 + proj.dist * M * k - cam, y = GY - Math.sin(k * Math.PI) * proj.peak; K.person(c, x, y, 0, cfg.col, k < 1 ? "jump" : "slide", 1); if (cfg.ski) { c.strokeStyle = "#e03131"; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 20, y + 2); c.lineTo(x + 26, y - 8); c.stroke(); } }
        else { const pose = phase === "mash" && cfg.mashToLine ? "run" : "run"; c.save(); if (cfg.spin && phase === "mash") { c.translate(px, GY); c.scale(Math.cos(spin) >= 0 ? 1 : -1, 1); c.translate(-px, -GY); } K.person(c, px, GY, phase === "mash" ? g.time * (6 + pw * 14) : 0.3, cfg.col, pose, 1); c.restore();
          if (cfg.kind !== "jump" && phase !== "fly" && phase !== "land") { c.save(); c.translate(px + 4, GY - 44); if (phase === "angle") c.rotate(-(ang * Math.PI) / 180); cfg.tool(c, g.time, spin); c.restore(); } }
        if (cfg.kind !== "jump" && (phase === "fly" || phase === "land")) { const k = Math.min(1, proj.t / proj.T); const x = proj.x0 + proj.dist * M * k - cam, y = proj.y0 + (GY - proj.y0) * k - Math.sin(k * Math.PI) * proj.peak; c.save(); c.translate(x, y); c.rotate(-proj.a * (1 - k * 2)); cfg.tool(c, g.time, g.time * 10); c.restore(); if (k >= 1) { c.fillStyle = "#fff"; c.beginPath(); c.arc(x, GY, 4, 0, 7); c.fill(); } }
        // メーター
        if (phase === "mash" || phase === "meter") { c.fillStyle = "rgba(10,14,40,.55)"; rr(c, 20, Hh - 96, W - 40, 26, 13); c.fill(); const gg = c.createLinearGradient(20, 0, W - 20, 0); gg.addColorStop(0, "#51cf66"); gg.addColorStop(0.7, "#ffd43b"); gg.addColorStop(1, "#ff6b6b"); c.fillStyle = gg; rr(c, 23, Hh - 93, (W - 46) * pw, 20, 10); c.fill(); txt(c, phase === "mash" ? (cfg.mashToLine ? "連打で助走！ 線についたら角度を決める" : cfg.spin ? "連打で回転スピードアップ！" : "連打でパワーをためる！") : "いいところでタップ！", W / 2, Hh - 120, 15, "#fff"); }
        if (phase === "angle") { const ox = 60, oy = Hh - 70; c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 3; c.beginPath(); c.arc(ox, oy, 46, -Math.PI / 2, 0); c.stroke(); if (cfg.opt) { c.strokeStyle = "#51cf66"; c.lineWidth = 8; c.beginPath(); c.arc(ox, oy, 46, -((cfg.opt + 7) * Math.PI) / 180, -((cfg.opt - 7) * Math.PI) / 180); c.stroke(); } const a = (ang * Math.PI) / 180; c.strokeStyle = "#ffe066"; c.lineWidth = 4; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(a) * 50, oy - Math.sin(a) * 50); c.stroke(); txt(c, Math.round(ang) + "°", ox + 70, oy - 10, 18, "#fff", "left"); txt(c, "タップで" + (cfg.kind === "jump" ? "ふみきる" : "投げる") + "！", W / 2 + 40, oy - 40, 17, "#ffe066"); }
        if (phase === "ready") txt(c, (tries.length + 1) + "回目 ・ タップでスタート", W / 2, Hh - 80, 18, "#fff");
        if (msg && phase === "land") txt(c, msg.s, W / 2, Hh * 0.32, 40, msg.c);
        K.hud(c, g, "記録 " + [0, 1, 2].map((i) => (tries[i] == null ? "－" : tries[i] ? tries[i].toFixed(1) : "×")).join(" / "), "", "CPU " + cpuBest.toFixed(2) + "m");
      }
      g.run(update, draw);
    });
  }
  const javelin = (c) => { c.strokeStyle = "#ced4da"; c.lineWidth = 3; c.beginPath(); c.moveTo(-30, 0); c.lineTo(34, 0); c.stroke(); c.fillStyle = "#495057"; c.beginPath(); c.moveTo(34, -2); c.lineTo(42, 0); c.lineTo(34, 2); c.fill(); c.fillStyle = "#e03131"; c.fillRect(-4, -2, 10, 4); };
  const shot = (c) => { c.fillStyle = "#495057"; c.beginPath(); c.arc(0, 0, 8, 0, 7); c.fill(); c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.arc(-3, -3, 3, 0, 7); c.fill(); };
  const hammer = (c, t, sp) => { const a = sp || 0; c.strokeStyle = "#868e96"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 26, Math.sin(a) * 26); c.stroke(); c.fillStyle = "#343a40"; c.beginPath(); c.arc(Math.cos(a) * 30, Math.sin(a) * 30, 8, 0, 7); c.fill(); };
  thrower({ id: "javelin", e: "🎯", n: "やり投げ", c: "#e67700", col: "#4c6ef5", power: "mash", mashToLine: true, opt: 36, rec: 80, scale: 3.4, tick: 10, flight: 2.0, tool: javelin, d: "連打で助走、白い線の手前で角度を決めて投げる。線をこえるとファウル！3回のベストでCPUと勝負。" });
  thrower({ id: "shotput", e: "⚫", n: "砲丸投げ", c: "#495057", col: "#e03131", power: "meter", opt: 40, rec: 20, scale: 12, tick: 5, flight: 1.3, h0: 46, tool: shot, d: "パワーメーターがいちばん高いときにタップ、つぎに角度を決めて投げる。" });
  thrower({ id: "hammer", e: "🔨", n: "ハンマー投げ", c: "#5c7cfa", col: "#2b8a3e", power: "mash", spin: true, opt: 42, rec: 75, scale: 3.6, tick: 10, flight: 2.0, tool: hammer, d: "連打でぐるぐる回ってスピードをため、いい角度で投げはなそう。" });
  thrower({ id: "longjump", e: "🦘", n: "走り幅跳び", c: "#c2552f", col: "#f08c00", kind: "jump", power: "mash", mashToLine: true, opt: 22, rec: 8, scale: 28, tick: 1, flight: 1.0, h0: 0, field: "#e9c46a", dust: "#e9c46a", d: "連打で助走して、ふみきり線の手前でタップ。角度を決めて遠くへとぼう！" });
  thrower({ id: "skijump", e: "🎿", n: "スキージャンプ", c: "#4dabf7", col: "#e03131", kind: "jump", ski: true, power: "meter", opt: 30, rec: 130, scale: 1.9, tick: 20, flight: 2.6, h0: 0, ground: "#f8f9fa", field: "#e7f5ff", stand: "#adb5bd", sky: ["#4dabf7", "#e7f5ff"], dust: "#fff", d: "スピードメーターが高いときにタップしてふみきり、つぎに体の角度を決めて飛ぶ！" });

  // ===== ねらってうつ（アーチェリー・ダーツ）=====
  function aimer(cfg) {
    add({ id: cfg.id, e: cfg.e, n: cfg.n, c: cfg.c, d: cfg.d, genre: cfg.genre || "sports" }, (diff) => {
      const g = X.pro(cfg.id, diff, cfg.n), W = g.W, Hh = g.H, c = g.c, d = g.d;
      const N = cfg.shots || 6, cx = W / 2, cy = Hh * 0.42, R = Math.min(W * 0.4, 140);
      const cpuPer = [6.0, 7.4, 8.4, 9.2][d]; const cpu = Array.from({ length: N }, () => clamp(Math.round(cpuPer + rand(-1.6, 1.6)), 1, 10)); const cpuTot = cpu.reduce((a, b) => a + b, 0);
      let shots = [], t = 0, hold = false, holdT = 0, aimX = 0, aimY = 0, wind = 0, fly = null, endT = null, last = null;
      const newWind = () => { wind = cfg.wind ? rand(-1, 1) * (0.5 + d * 0.3) : 0; };
      newWind();
      g.onDown = () => { if (t < 1 || fly || endT != null) return; hold = true; holdT = 0; X.tone(300, 0.08, "sine", 0.05); };
      g.onUp = () => { if (!hold || fly || endT != null) return; hold = false; fire(); };
      function fire() { const ax = aimX + wind * 18, ay = aimY; fly = { t: 0, x: ax, y: ay }; X.SFX.whoosh(); }
      function score(x, y) { const r = Math.hypot(x, y) / R; return r > 1 ? 0 : Math.max(1, 10 - Math.floor(r * 10)); }
      function update(dt) {
        t += dt;
        const amp = (cfg.sway || 70) * (1 + d * 0.18) * (hold ? Math.max(0.35, 1 - Math.min(holdT, 1.4) * 0.5 + Math.max(0, holdT - 2.4) * 0.8) : 1);
        aimX = Math.sin(t * 1.3 + Math.sin(t * 0.7) * 1.5) * amp; aimY = Math.sin(t * 1.9 + 1) * amp * 0.75; if (hold) holdT += dt;
        if (fly) { fly.t += dt; if (fly.t >= (cfg.flyT || 0.45)) { const s = score(fly.x, fly.y); shots.push({ x: fly.x, y: fly.y, s }); last = { s, t: 0 }; fly = null; if (s >= 9) { X.SFX.cheer(); g.burst(cx + shots[shots.length - 1].x, cy + shots[shots.length - 1].y, ["#ffd43b", "#fff"], 20, 200); g.flash("#fff", 0.2); } else if (s) X.SFX.hit(); else X.SFX.bad(); g.shake(s >= 9 ? 5 : 2); newWind(); if (shots.length >= N) endT = 0; } }
        if (last) last.t += dt;
        if (endT != null) { endT += dt; if (endT > 1.6 && !g.over) { const me = shots.reduce((a, b) => a + b.s, 0), win = me > cpuTot; g.end(win, win ? "勝ち！ ねらいどおり！" : me === cpuTot ? "引き分け" : "CPUの勝ち…", ["あなた " + me + "点", "CPU " + cpuTot + "点", "10点 " + shots.filter((s) => s.s === 10).length + "本"], me === cpuTot, { v: me, unit: "点" }); } }
      }
      function draw(c) {
        cfg.bg(c, W, Hh, g.time);
        c.save(); c.translate(cx, cy); cfg.target(c, R); for (const s of shots) cfg.stuck(c, s.x, s.y); c.restore();
        if (fly) { const k = fly.t / (cfg.flyT || 0.45); const sx = lerp(cx, cx + fly.x, k), sy = lerp(Hh - 60, cy + fly.y, k); c.save(); c.translate(sx, sy); c.scale(1.6 - k * 0.6, 1.6 - k * 0.6); cfg.stuck(c, 0, 0); c.restore(); }
        else if (endT == null) { const x = cx + aimX, y = cy + aimY; c.strokeStyle = hold ? "#ffe066" : "rgba(255,255,255,.9)"; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, 14, 0, 7); c.moveTo(x - 22, y); c.lineTo(x - 6, y); c.moveTo(x + 6, y); c.lineTo(x + 22, y); c.moveTo(x, y - 22); c.lineTo(x, y - 6); c.moveTo(x, y + 6); c.lineTo(x, y + 22); c.stroke(); }
        if (cfg.wind) { c.fillStyle = "rgba(10,14,40,.5)"; rr(c, W - 110, 52, 98, 30, 10); c.fill(); txt(c, "風 " + (wind < 0 ? "◀" : "▶") + " " + Math.abs(wind * 5).toFixed(1), W - 61, 67, 13, "#fff"); }
        if (last && last.t < 1.2) txt(c, last.s ? last.s + "点" : "はずれ", cx, cy - R - 26, 30, last.s >= 9 ? "#ffe066" : "#fff");
        txt(c, hold ? (holdT > 2.4 ? "手がふるえてきた！はなして！" : "指をはなすとうつ") : "長押しでねらいを安定 → はなしてうつ", W / 2, Hh - 40, 14, "#fff");
        const me = shots.reduce((a, b) => a + b.s, 0), cpuNow = cpu.slice(0, shots.length).reduce((a, b) => a + b, 0);
        K.hud(c, g, "あなた " + me, (Math.min(shots.length + 1, N)) + " / " + N + "本", "CPU " + cpuNow);
      }
      g.run(update, draw);
    });
  }
  const rings = (c, R, cols) => { for (let i = 10; i >= 1; i--) { c.fillStyle = cols[Math.floor((10 - i) / 2)]; c.beginPath(); c.arc(0, 0, (R * i) / 10, 0, 7); c.fill(); c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 1; c.stroke(); } c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(-1, -2, 2, 4); };
  aimer({ id: "archery", e: "🏹", n: "アーチェリー", c: "#2b8a3e", wind: true, d: "風を読んでねらう。長押しでねらいが安定、はなすと矢を放つ。6本の合計点でCPUと勝負。",
    bg: (c, W, Hh) => { const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, "#a5d8ff"); gr.addColorStop(0.55, "#d3f9d8"); gr.addColorStop(0.56, "#69db7c"); gr.addColorStop(1, "#2f9e44"); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.fillStyle = "#8d5524"; c.fillRect(W / 2 - 4, Hh * 0.42, 8, Hh * 0.2); },
    target: (c, R) => { c.fillStyle = "#f8f9fa"; c.beginPath(); c.arc(0, 0, R + 8, 0, 7); c.fill(); rings(c, R, ["#ffd43b", "#ff6b6b", "#4dabf7", "#343a40", "#fff"]); },
    stuck: (c, x, y) => { c.strokeStyle = "#8d5524"; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10, y + 14); c.stroke(); c.fillStyle = "#e03131"; c.beginPath(); c.moveTo(x + 8, y + 12); c.lineTo(x + 16, y + 14); c.lineTo(x + 12, y + 22); c.fill(); c.fillStyle = "#212529"; c.beginPath(); c.arc(x, y, 2.5, 0, 7); c.fill(); } });
  aimer({ id: "darts", e: "🎯", n: "ダーツ", c: "#c92a2a", sway: 62, shots: 6, flyT: 0.3, genre: "sports", d: "ゆれる照準をよく見て、まん中をねらってダーツを投げよう。6投の合計でCPUと勝負。",
    bg: (c, W, Hh) => { c.fillStyle = "#2b2140"; c.fillRect(0, 0, W, Hh); c.fillStyle = "#3b2f63"; for (let i = 0; i < W; i += 30) c.fillRect(i, 0, 14, Hh); c.fillStyle = "#5c3a1a"; c.fillRect(0, Hh - 90, W, 90); },
    target: (c, R) => { c.fillStyle = "#212529"; c.beginPath(); c.arc(0, 0, R + 14, 0, 7); c.fill(); for (let i = 0; i < 20; i++) { const a0 = (i / 20) * Math.PI * 2, a1 = ((i + 1) / 20) * Math.PI * 2; for (let r = 10; r >= 1; r--) { c.fillStyle = r % 2 ? (i % 2 ? "#f1e3c6" : "#212529") : (i % 2 ? "#2f9e44" : "#e03131"); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, (R * r) / 10, a0, a1); c.fill(); } } c.fillStyle = "#2f9e44"; c.beginPath(); c.arc(0, 0, R * 0.1, 0, 7); c.fill(); c.fillStyle = "#e03131"; c.beginPath(); c.arc(0, 0, R * 0.05, 0, 7); c.fill(); },
    stuck: (c, x, y) => { c.fillStyle = "#adb5bd"; c.fillRect(x - 1, y, 2, 12); c.fillStyle = "#4dabf7"; c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x - 6, y + 20); c.lineTo(x + 6, y + 20); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill(); } });

  // ===== 動くまとをタップ（クレー射撃・射的）=====
  function gallery(cfg) {
    add({ id: cfg.id, e: cfg.e, n: cfg.n, c: cfg.c, d: cfg.d, genre: "shoot" }, (diff) => {
      const g = X.pro(cfg.id, diff, cfg.n), W = g.W, Hh = g.H, c = g.c, d = g.d;
      const DUR = cfg.dur || 30; const cpuScore = Math.round(cfg.cpu[d] * rand(0.92, 1.08)); let t = 0, score = 0, hits = 0, miss = 0, tg = [], spawnT = 0, endT = null, combo = 0, holes = [];
      g.onDown = (o) => { if (t < 3 || endT != null) return; X.SFX.shoot(); X.noise(0.08, 0.2, 1500); holes.push({ x: o.x, y: o.y, t: 0 }); let hit = null; for (const a of tg) if (!a.dead && Math.hypot(a.x - o.x, a.y - o.y) < a.r + 8) { hit = a; break; }
        if (hit) { hit.dead = true; const p = hit.pts + combo * 2; score += p; hits++; combo++; X.SFX.pop(); g.burst(hit.x, hit.y, cfg.chip || ["#ff922b", "#fff"], 18, 220); g.pop(hit.x, hit.y - 10, "+" + p, "#ffe066", 18); g.shake(3); } else { miss++; combo = 0; } };
      function update(dt) {
        t += dt; if (t < 3) return; const el = t - 3;
        if (el >= DUR && endT == null) { endT = 0; }
        if (endT != null) { endT += dt; if (endT > 1.2 && !g.over) { const win = score > cpuScore; g.end(win, win ? "勝ち！ ナイスショット！" : score === cpuScore ? "引き分け" : "CPUの勝ち…", ["あなた " + score + "点", "CPU " + cpuScore + "点", "命中 " + hits + " ／ ミス " + miss], score === cpuScore, { v: score, unit: "点" }); } return; }
        spawnT -= dt; if (spawnT <= 0) { spawnT = cfg.every[d] * rand(0.7, 1.3); tg.push(cfg.spawn(W, Hh, d)); }
        for (const a of tg) { a.t += dt; cfg.move(a, dt, W, Hh); } tg = tg.filter((a) => !a.dead && !a.gone);
        for (const h of holes) h.t += dt; holes = holes.filter((h) => h.t < 0.5);
      }
      function draw(c) {
        cfg.bg(c, W, Hh, g.time);
        for (const a of tg) { c.save(); c.translate(a.x, a.y); cfg.draw(c, a, g.time); c.restore(); }
        for (const h of holes) { c.globalAlpha = 1 - h.t * 2; c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.arc(h.x, h.y, 10 + h.t * 30, 0, 7); c.stroke(); c.globalAlpha = 1; }
        const left = Math.max(0, DUR - Math.max(0, t - 3));
        K.hud(c, g, "あなた " + score, "のこり " + Math.ceil(left) + "秒", "CPU " + Math.round(cpuScore * Math.min(1, Math.max(0, t - 3) / DUR)));
        if (combo >= 3) txt(c, combo + "連続！", W / 2, 70, 16, "#ffe066");
        if (t < 6) { c.globalAlpha = Math.min(1, 6 - t); txt(c, "まとをタップしてうつ！", W / 2, Hh - 40, 16, "#fff"); c.globalAlpha = 1; }
        K.countdown(g, t, c);
      }
      g.run(update, draw);
    });
  }
  gallery({ id: "clay", e: "🥏", n: "クレー射撃", c: "#e8590c", cpu: [70, 110, 150, 190], every: [1.1, 0.95, 0.8, 0.7], chip: ["#ff922b", "#e8590c", "#fff"], d: "空に飛び出すクレー（おさら）をタップしてうちくだく。30秒の点数でCPUと勝負。",
    bg: (c, W, Hh) => { const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, "#4dabf7"); gr.addColorStop(0.75, "#e7f5ff"); gr.addColorStop(0.76, "#94d82d"); gr.addColorStop(1, "#5c940d"); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.fillStyle = "#495057"; c.fillRect(10, Hh * 0.72, 30, 20); c.fillRect(W - 40, Hh * 0.72, 30, 20); },
    spawn: (W, Hh, d) => { const L = Math.random() < 0.5; return { x: L ? 26 : W - 26, y: Hh * 0.72, vx: (L ? 1 : -1) * rand(110, 170) * (1 + d * 0.12), vy: -rand(420, 520), r: 14, pts: 10, t: 0 }; },
    move: (a, dt, W, Hh) => { a.vy += 300 * dt; a.x += a.vx * dt; a.y += a.vy * dt; if (a.y > Hh * 0.8) a.gone = true; },
    draw: (c, a, t) => { c.rotate(a.t * 8); c.fillStyle = "#ff922b"; c.beginPath(); c.ellipse(0, 0, 14, 6, 0, 0, 7); c.fill(); c.fillStyle = "#e8590c"; c.beginPath(); c.ellipse(0, -1, 8, 3, 0, 0, 7); c.fill(); } });
  gallery({ id: "shooting", e: "🦆", n: "お祭り射的", c: "#c2255c", cpu: [80, 120, 160, 200], every: [0.7, 0.6, 0.5, 0.42], chip: ["#ffd43b", "#fff"], d: "流れていくアヒルやまとをコルク銃でうとう。金のまとは高得点！",
    bg: (c, W, Hh, t) => { c.fillStyle = "#c2255c"; c.fillRect(0, 0, W, Hh); for (let i = 0; i < W; i += 40) { c.fillStyle = (i / 40) % 2 ? "#fff" : "#e64980"; c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 40, 0); c.lineTo(i + 20, 36); c.fill(); } for (const y of [0.32, 0.5, 0.68]) { c.fillStyle = "#8d5524"; c.fillRect(0, Hh * y + 22, W, 10); } c.fillStyle = "#5c3a1a"; c.fillRect(0, Hh * 0.8, W, Hh * 0.2); for (let i = 0; i < 8; i++) { c.fillStyle = ["#ffd43b", "#ff8787", "#74c0fc"][i % 3]; c.beginPath(); c.arc(20 + i * 50, 48, 9, 0, 7); c.fill(); } },
    spawn: (W, Hh, d) => { const row = Math.floor(rand(0, 3)), dir = row % 2 ? -1 : 1, gold = Math.random() < 0.15; return { x: dir > 0 ? -20 : W + 20, y: Hh * [0.32, 0.5, 0.68][row], vx: dir * rand(70, 110) * (1 + d * 0.15) * (gold ? 1.6 : 1), r: gold ? 12 : 16, pts: gold ? 30 : 10, gold, t: 0 }; },
    move: (a, dt, W) => { a.x += a.vx * dt; if (a.x < -40 || a.x > W + 40) a.gone = true; },
    draw: (c, a, t) => { c.translate(0, Math.sin(a.t * 8) * 2); if (a.gold) { c.fillStyle = "#ffd43b"; c.beginPath(); c.arc(0, 0, 13, 0, 7); c.fill(); c.fillStyle = "#e67700"; c.beginPath(); c.arc(0, 0, 7, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(0, 0, 3, 0, 7); c.fill(); return; } c.scale(a.vx > 0 ? 1 : -1, 1); c.fillStyle = "#ffd43b"; c.beginPath(); c.ellipse(0, 4, 16, 11, 0, 0, 7); c.fill(); c.beginPath(); c.arc(10, -9, 8, 0, 7); c.fill(); c.fillStyle = "#ff922b"; c.beginPath(); c.moveTo(16, -9); c.lineTo(24, -7); c.lineTo(16, -5); c.fill(); c.fillStyle = "#222"; c.beginPath(); c.arc(12, -11, 1.8, 0, 7); c.fill(); c.fillStyle = "#8d5524"; c.fillRect(-3, 14, 6, 10); } });
})();
