/* ほしまなび — 横スクロールのラン系（パルクール・ハードル・忍者・恐竜・ねこ・ジャングル・お城・クロスカントリー）と、連打のきょうそう（100m・競泳・カヌー・綱引き）。すべてオリジナル */
(() => {
  "use strict";
  const H = window.HMGames, X = window.HMPro, K = window.HMKit, { rr, txt, clamp, lerp, rand } = X;
  const add = (m, fn) => H.add(Object.assign({ pro: true }, m), fn);
  // ---- 背景 ----
  const BG = {
    city: { sky: ["#ffb26b", "#ff7b54", "#5f3dc4"], far: "#3b2f63", near: "#2a2148", ground: "#3d3d4e", top: "#59596e", kind: "build" },
    track: { sky: ["#a5d8ff", "#d0ebff", "#e7f5ff"], far: "#868e96", near: "#495057", ground: "#c2552f", top: "#e8e8e8", kind: "stand" },
    bamboo: { sky: ["#d3f9d8", "#b2f2bb", "#8ce99a"], far: "#69db7c", near: "#2f9e44", ground: "#5c4033", top: "#7a5c45", kind: "bamboo" },
    desert: { sky: ["#fff3bf", "#ffe8cc", "#ffd8a8"], far: "#e8c07a", near: "#d4a35a", ground: "#e0b46c", top: "#c99a50", kind: "dune" },
    alley: { sky: ["#1c1c3c", "#2b2b5c", "#43437a"], far: "#2a2a50", near: "#1b1b38", ground: "#4a4a5a", top: "#6a6a7a", kind: "build", moon: true },
    jungle: { sky: ["#c3fae8", "#96f2d7", "#63e6be"], far: "#20c997", near: "#087f5b", ground: "#6b4f2a", top: "#2b8a3e", kind: "tree" },
    castle: { sky: ["#dbe4ff", "#bac8ff", "#91a7ff"], far: "#748ffc", near: "#5c7cfa", ground: "#868e96", top: "#adb5bd", kind: "castle" },
    field: { sky: ["#e3fafc", "#c5f6fa", "#99e9f2"], far: "#94d82d", near: "#66a80f", ground: "#82c91e", top: "#5c940d", kind: "hill" },
  };
  function drawBG(c, g, b, cam, GY) {
    const W = g.W, Hh = g.H, gr = c.createLinearGradient(0, 0, 0, GY); b.sky.forEach((s, i) => gr.addColorStop(i / (b.sky.length - 1), s)); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
    if (b.moon) { c.fillStyle = "#fff9db"; c.beginPath(); c.arc(W * 0.78, 90, 22, 0, 7); c.fill(); c.fillStyle = "#fff"; for (let i = 0; i < 30; i++) c.fillRect((i * 71) % W, (i * 37) % (GY * 0.6), 2, 2); }
    for (const [col, par, hgt] of [[b.far, 0.2, 1], [b.near, 0.45, 0.6]]) {
      c.fillStyle = col; const span = 90, off = -((cam * par) % span);
      for (let i = -1; i < W / span + 2; i++) { const x = off + i * span, k = Math.floor(cam * par / span) + i, hh = (40 + ((k * 53) % 60)) * hgt + 30;
        if (b.kind === "build" || b.kind === "stand") { c.fillRect(x, GY - hh - 30, span - 10, hh + 30); if (b.kind === "build") { c.fillStyle = "rgba(255,230,140,.5)"; for (let wy = GY - hh - 20; wy < GY - 10; wy += 16) for (let wx = x + 8; wx < x + span - 20; wx += 14) if ((wx * wy + k) % 3 < 1.6) c.fillRect(wx, wy, 6, 8); c.fillStyle = col; } }
        else if (b.kind === "bamboo") { for (let j = 0; j < 3; j++) { c.fillRect(x + j * 28, GY - 260, 8, 260); } }
        else if (b.kind === "tree") { c.beginPath(); c.arc(x + 40, GY - hh - 20, 40, 0, 7); c.fill(); c.fillRect(x + 34, GY - hh, 12, hh); }
        else if (b.kind === "castle") { c.fillRect(x, GY - hh - 40, span - 30, hh + 40); for (let j = 0; j < 4; j++) c.fillRect(x + j * 16, GY - hh - 52, 9, 12); }
        else { c.beginPath(); c.ellipse(x + 45, GY, 70, hh, 0, Math.PI, 0); c.fill(); }
      }
    }
  }
  // ---- ラン ----
  function runner(cfg) {
    add({ id: cfg.id, e: cfg.e, n: cfg.n, c: cfg.c, d: cfg.d, genre: cfg.genre || "action" }, (diff) => {
      const g = X.pro(cfg.id, diff, cfg.n), W = g.W, Hh = g.H, c = g.c, d = g.d, b = BG[cfg.bg];
      const GY = Hh * 0.74, PX = W * 0.3, V = cfg.v || 320, L = cfg.len || 6200, GRAV = 2000, JV = 760;
      const me = { x: 0, y: 0, vy: 0, v: 0, air: false, dj: false, slide: 0, hit: 0, fall: 0, ph: 0 };
      const cpu = { x: 0, v: 0, sk: [0.76, 0.85, 0.92, 0.985][d], slow: 0, ph: 0, jy: 0, jv: 0 };
      // コース
      const obs = []; let x = 700;
      while (x < L - 300) { const kind = cfg.obs[Math.floor(rand(0, cfg.obs.length))]; const w = kind === "gap" ? rand(80, 120) + d * 8 : kind === "high" ? 34 : 30; obs.push({ x, kind, w }); x += w + rand(240, 380) - d * 25; if (cfg.even) x = obs[obs.length - 1].x + 300 - d * 15; }
      const coins = []; for (let cx = 500; cx < L - 300; cx += rand(260, 480)) { const blocked = obs.some((o) => Math.abs(o.x - cx) < 60); if (!blocked) for (let j = 0; j < 3; j++) coins.push({ x: cx + j * 28, y: 40 + (j === 1 ? 26 : 0), got: false }); }
      let t = 0, ncoin = 0, finT = null, cpuT = null; const tape = X.goalTape(g);
      const onGround = () => !obs.some((o) => o.kind === "gap" && me.x > o.x + 6 && me.x < o.x + o.w - 6);
      function jump() { if (t < 3 || me.fall || finT != null) return; if (!me.air) { me.vy = -JV; me.air = true; me.slide = 0; X.tone(520, 0.12, "square", 0.06, 880); g.burst(PX, GY, "#fff", 6, 90); } else if (!me.dj) { me.dj = true; me.vy = -JV * 0.85; X.tone(700, 0.12, "square", 0.06, 1200); g.burst(PX, GY + me.y, ["#ffe066", "#fff"], 10, 120); } }
      function slide() { if (t < 3 || me.fall || finT != null) return; if (me.air) { me.vy = Math.max(me.vy, 700); } me.slide = 0.65; X.SFX.whoosh(); }
      const SB = { x: 12, y: Hh - 76, w: 96, h: 60 };
      g.onDown = (o) => { o.sl = o.x > SB.x && o.x < SB.x + SB.w && o.y > SB.y && o.y < SB.y + SB.h; if (o.sl) slide(); };
      g.onUp = (o) => { if (o.sl) return; if (o.y - o.sy > 40) slide(); else jump(); };
      function update(dt) {
        t += dt; const go = t >= 3;
        if (go && finT == null) {
          me.v = lerp(me.v, me.hit > 0 ? V * 0.35 : V, dt * (me.hit > 0 ? 8 : 1.6)); me.hit = Math.max(0, me.hit - dt); me.slide = Math.max(0, me.slide - dt);
          if (me.fall > 0) { me.fall -= dt; me.vy += GRAV * dt; me.y += me.vy * dt; if (me.fall <= 0) { const gp = obs.find((o) => o.kind === "gap" && me.x > o.x - 10 && me.x < o.x + o.w + 10); if (gp) me.x = gp.x + gp.w + 8; me.y = 0; me.vy = 0; me.air = false; me.dj = false; me.hit = 0.4; } }
          else {
            me.x += me.v * dt; me.ph += me.v * dt * 0.045;
            if (me.air || me.y < 0) { me.vy += GRAV * dt; me.y += me.vy * dt; if (me.y >= 0 && onGround()) { me.y = 0; me.vy = 0; me.air = false; me.dj = false; g.burst(PX, GY, cfg.dust || "#ddd", 5, 70, 0.4, 2); } }
            if (!me.air && !onGround()) { me.air = true; }
            if (me.y > 30) { me.fall = 1.0; me.vy = 200; X.tone(500, 0.6, "triangle", 0.08, 120); g.pop(PX, GY - 60, "落ちた！", "#ff8787", 22); g.shake(6); }
            for (const o of obs) { if (o.hitDone || o.kind === "gap") continue; if (me.x + 10 < o.x || me.x - 10 > o.x + o.w) continue;
              const hitLow = o.kind === "low" && me.y > -42, hitHigh = o.kind === "high" && me.slide <= 0 && me.y > -110;
              if (hitLow || hitHigh) { o.hitDone = true; o.knock = 1; me.hit = 0.7; g.shake(7); X.SFX.hit(); g.vib(40); g.burst(PX + 10, GY + me.y - 30, ["#fff", "#ff8787"], 14, 200); g.pop(PX, GY - 90, cfg.ouch || "いたっ！", "#ff8787", 20); }
              else if (!o.passed && me.x - 10 > o.x + o.w) { o.passed = true; } }
            for (const cn of coins) { if (!cn.got && Math.abs(cn.x - me.x) < 18 && Math.abs(-cn.y - (me.y - 30 + (me.slide > 0 ? 18 : 0))) < 34) { cn.got = true; ncoin++; X.SFX.coin(); g.burst(PX, GY - cn.y, "#ffd43b", 8, 110); } }
          }
          if (me.x >= L) { finT = t - 3; const win = cpuT == null; tape.cross(PX, GY - 50, win, win ? "タイム " + K.fmtT(finT) + "秒" : "CPUとの差 " + K.fmtT(finT - cpuT) + "秒", win ? "GOAL!" : "ゴール"); }
        } else if (finT != null) { me.x += me.v * dt * 0.6; me.v *= 1 - dt; me.ph += me.v * dt * 0.045; }
        if (go && cpuT == null) { cpu.slow = Math.max(0, cpu.slow - dt); if (Math.random() < dt * 0.25) cpu.slow = rand(0.3, 0.7); cpu.v = lerp(cpu.v, V * cpu.sk * (cpu.slow > 0 ? 0.5 : 1), dt * 2); cpu.x += cpu.v * dt; cpu.ph += cpu.v * dt * 0.045;
          if (cpu.jy >= 0 && obs.some((o) => o.x - cpu.x > 0 && o.x - cpu.x < 40 && o.kind !== "high")) cpu.jv = -JV;
          cpu.jv += GRAV * dt; cpu.jy = Math.min(0, cpu.jy + cpu.jv * dt); if (cpu.x >= L) { cpuT = t - 3; if (finT == null) { X.tone(330, 0.3, "triangle", 0.06); g.pop(W / 2, 90, "CPUがゴール！", "#c9d2ec", 20); } } }
        else if (cpuT != null) cpu.x += cpu.v * dt * 0.4;
        if (tape.done(2.5)) { const win = cpuT == null || finT < cpuT; g.end(win, win ? "1着でゴール！" : "CPUの勝ち…", ["タイム " + K.fmtT(finT) + "秒", cpuT != null ? "CPU " + K.fmtT(cpuT) + "秒" : "CPUはまだ走っていた", "コイン " + ncoin], false, { v: Math.round(finT * 100) / 100, unit: "秒", lower: true, winOnly: true }); }
      }
      function draw(c) {
        const cam = me.x; drawBG(c, g, b, cam, GY - 34);
        // CPUのレーン（うしろ）
        const LY = GY - 34; c.fillStyle = b.top; c.fillRect(0, LY - 4, W, 8);
        const cx = PX + (cpu.x - cam) * 1; if (cx > -40 && cx < W + 40) { c.globalAlpha = 0.85; drawChar(c, cx, LY + cpu.jy * 0.8, cpu.ph, "#ff6b6b", cpu.jy < 0 ? "jump" : "run", 0.8); c.globalAlpha = 1; K.tag(c, cx, LY - 62 + cpu.jy * 0.8, "CPU", "#e03131"); }
        // 地面（穴あき）
        const gaps = obs.filter((o) => o.kind === "gap"); c.fillStyle = b.ground; c.fillRect(0, GY, W, Hh - GY);
        c.fillStyle = b.top; c.fillRect(0, GY, W, 8);
        if (cfg.bg === "track") { c.fillStyle = "rgba(255,255,255,.7)"; c.fillRect(0, GY + 30, W, 3); c.fillRect(0, GY + 70, W, 3); }
        for (let i = -1; i < W / 40 + 2; i++) { const xx = -((cam) % 40) + i * 40; c.fillStyle = "rgba(0,0,0,.08)"; c.fillRect(xx, GY + 12, 20, 6); }
        for (const o of gaps) { const sx = PX + (o.x - cam); if (sx > W || sx + o.w < 0) continue; const gr = c.createLinearGradient(0, GY, 0, Hh); gr.addColorStop(0, cfg.pit || "#1b1b2f"); gr.addColorStop(1, "#000"); c.fillStyle = gr; c.fillRect(sx, GY, o.w, Hh - GY); c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(sx, GY, 6, Hh - GY); }
        // 障害物
        for (const o of obs) { if (o.kind === "gap") continue; const sx = PX + (o.x - cam); if (sx < -60 || sx > W + 60) continue; c.save(); c.translate(sx + o.w / 2, GY); if (o.knock) { o.knock = Math.min(2, o.knock + 0.08); c.rotate(Math.min(1.4, (o.knock - 1) * 2)); } ((cfg.draw || {})[o.kind] || drawOb[o.kind])(c, g.time); c.restore(); }
        // ゴール
        const gx = PX + (L - cam); if (gx > -80 && gx < W + 80) tape.drawSide(c, gx, GY, 130);
        // コイン
        for (const cn of coins) { if (cn.got) continue; const sx = PX + (cn.x - cam); if (sx < -20 || sx > W + 20) continue; const k = Math.abs(Math.cos(g.time * 4 + cn.x)); c.fillStyle = "#ffd43b"; c.beginPath(); c.ellipse(sx, GY - cn.y - 30, 8 * k + 1, 9, 0, 0, 7); c.fill(); c.fillStyle = "#f59f00"; c.beginPath(); c.ellipse(sx, GY - cn.y - 30, 4 * k, 5, 0, 0, 7); c.fill(); }
        // 自分
        const pose = me.fall > 0 ? "fall" : me.slide > 0 && !me.air ? "slide" : me.air ? "jump" : t < 3 ? "stand" : "run";
        if (me.hit > 0 && Math.floor(me.hit * 20) % 2) c.globalAlpha = 0.5;
        drawChar(c, PX, GY + me.y + (pose === "slide" ? -2 : 0), me.ph, cfg.col || "#4c6ef5", pose, 1); c.globalAlpha = 1;
        // スライドボタン
        c.fillStyle = me.slide > 0 ? "rgba(255,224,102,.85)" : "rgba(10,14,40,.45)"; rr(c, SB.x, SB.y, SB.w, SB.h, 16); c.fill(); txt(c, "⬇ スライド", SB.x + SB.w / 2, SB.y + SB.h / 2, 14, "#fff");
        txt(c, "タップでジャンプ（2回でもう一段）", W / 2 + 50, Hh - 46, 12, "rgba(255,255,255,.9)", "center", 800);
        K.hud(c, g, Math.round(Math.min(me.x, L) / 10) + " / " + L / 10 + "m", me.x >= cpu.x ? "リード中" : "CPUを追え！", t > 3 ? K.fmtT(finT != null ? finT : t - 3) + "秒" : "");
        K.progress(c, g, [{ p: cpu.x / L, c: "#ff6b6b" }, { p: me.x / L, c: cfg.col || "#4c6ef5", me: true }]);
        K.countdown(g, t, c);
      }
      const drawChar = cfg.char || ((c, x, y, ph, col, pose, s) => K.person(c, x, y, ph, col, pose === "stand" ? "run" : pose, s, cfg.skin, cfg.hair));
      g.run(update, draw);
    });
  }
  const drawOb = {
    low(c) { c.fillStyle = "#e67700"; rr(c, -16, -34, 32, 34, 4); c.fill(); c.strokeStyle = "#a35200"; c.lineWidth = 2; c.strokeRect(-12, -30, 24, 26); c.beginPath(); c.moveTo(-12, -30); c.lineTo(12, -4); c.moveTo(12, -30); c.lineTo(-12, -4); c.stroke(); },
    high(c, t) { c.fillStyle = "#495057"; c.fillRect(-4, -150, 8, 92); c.fillStyle = "#fa5252"; rr(c, -22, -66, 44, 18, 5); c.fill(); c.fillStyle = "#fff"; for (let i = 0; i < 3; i++) c.fillRect(-18 + i * 14, -62, 7, 10); },
  };
  const OBD = {
    hurdle: { low(c) { c.strokeStyle = "#fff"; c.lineWidth = 4; c.beginPath(); c.moveTo(-12, 0); c.lineTo(-12, -40); c.moveTo(12, 0); c.lineTo(12, -40); c.stroke(); c.fillStyle = "#fff"; c.fillRect(-16, -42, 32, 9); c.fillStyle = "#e03131"; c.fillRect(-16, -42, 10, 9); c.fillRect(6, -42, 10, 9); c.fillStyle = "#333"; c.fillRect(-16, -2, 10, 3); c.fillRect(6, -2, 10, 3); } },
    ninja: { low(c) { c.fillStyle = "#868e96"; c.beginPath(); c.moveTo(-18, 0); c.lineTo(-12, -28); c.lineTo(6, -34); c.lineTo(18, 0); c.fill(); }, high(c, t) { c.save(); c.translate(0, -70); c.rotate(t * 14); c.fillStyle = "#adb5bd"; for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, -4); c.lineTo(16, 0); c.lineTo(0, 4); c.fill(); } c.fillStyle = "#343a40"; c.beginPath(); c.arc(0, 0, 4, 0, 7); c.fill(); c.restore(); } },
    dino: { low(c) { c.fillStyle = "#2b8a3e"; rr(c, -7, -46, 14, 46, 7); c.fill(); rr(c, -20, -32, 9, 18, 4); c.fill(); rr(c, 11, -38, 9, 20, 4); c.fill(); c.fillRect(-14, -20, 8, 6); c.fillRect(6, -24, 8, 6); }, high(c, t) { const f = Math.sin(t * 10) * 10; c.fillStyle = "#7048e8"; c.beginPath(); c.moveTo(-26, -70 + f); c.lineTo(0, -66); c.lineTo(26, -70 + f); c.lineTo(0, -58); c.fill(); c.beginPath(); c.ellipse(0, -64, 14, 6, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(12, -66); c.lineTo(26, -62); c.lineTo(12, -60); c.fill(); } },
    cat: { low(c) { c.fillStyle = "#c08552"; rr(c, -18, -30, 36, 30, 3); c.fill(); c.fillStyle = "#a0522d"; c.fillRect(-18, -30, 36, 5); c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(-2, -30, 4, 30); }, high(c) { c.strokeStyle = "#ced4da"; c.lineWidth = 2; c.beginPath(); c.moveTo(-40, -76); c.lineTo(40, -76); c.stroke(); const cols = ["#ff8787", "#74c0fc", "#ffe066"]; for (let i = 0; i < 3; i++) { c.fillStyle = cols[i]; rr(c, -30 + i * 22, -76, 16, 22, 3); c.fill(); } } },
    jungle: { low(c) { c.fillStyle = "#8d5524"; rr(c, -24, -22, 48, 22, 10); c.fill(); c.fillStyle = "#c08552"; c.beginPath(); c.ellipse(-22, -11, 5, 11, 0, 0, 7); c.fill(); }, high(c, t) { c.strokeStyle = "#2b8a3e"; c.lineWidth = 5; c.beginPath(); c.moveTo(-30, -160); c.quadraticCurveTo(0, -40 + Math.sin(t * 2) * 6, 30, -160); c.stroke(); c.fillStyle = "#40c057"; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(-20 + i * 10, -72 + Math.abs(i - 2) * 9, 6, 3, 0.5, 0, 7); c.fill(); } } },
    castle: { low(c) { c.fillStyle = "#8d5524"; c.beginPath(); c.ellipse(0, -16, 15, 17, 0, 0, 7); c.fill(); c.strokeStyle = "#5c3a1a"; c.lineWidth = 3; c.beginPath(); c.moveTo(-15, -22); c.lineTo(15, -22); c.moveTo(-15, -10); c.lineTo(15, -10); c.stroke(); }, high(c, t) { c.fillStyle = "#495057"; c.fillRect(-3, -160, 6, 90); c.save(); c.translate(0, -66); c.rotate(Math.sin(t * 3) * 0.6); c.fillStyle = "#343a40"; c.beginPath(); c.arc(0, 0, 13, 0, 7); c.fill(); c.fillStyle = "#adb5bd"; for (let i = 0; i < 8; i++) { const a = (i / 8) * 7; c.beginPath(); c.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); c.lineTo(Math.cos(a + 0.2) * 19, Math.sin(a + 0.2) * 19); c.lineTo(Math.cos(a + 0.4) * 11, Math.sin(a + 0.4) * 11); c.fill(); } c.restore(); } },
    field: { low(c) { c.strokeStyle = "#8d5524"; c.lineWidth = 4; c.beginPath(); c.moveTo(-18, 0); c.lineTo(-18, -34); c.moveTo(18, 0); c.lineTo(18, -34); c.moveTo(-22, -28); c.lineTo(22, -28); c.moveTo(-22, -14); c.lineTo(22, -14); c.stroke(); } },
  };
  const catChar = (c, x, y, ph, col, pose, s) => { c.save(); c.translate(x, y); c.scale(s, s); if (pose === "fall") c.rotate(1); c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(0, 1, 16, 3, 0, 0, 7); c.fill(); const sl = pose === "slide", k = Math.sin(ph) * 5;
    c.fillStyle = col; c.beginPath(); c.ellipse(0, sl ? -9 : -16, sl ? 20 : 16, sl ? 8 : 11, 0, 0, 7); c.fill();
    if (!sl) { c.fillRect(-12 + k, -8, 5, 9); c.fillRect(7 - k, -8, 5, 9); }
    c.strokeStyle = col; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(-14, sl ? -10 : -18); c.quadraticCurveTo(-26, -30 - k, -22, -36); c.stroke();
    const hx = sl ? 18 : 15, hy = sl ? -14 : -27; c.beginPath(); c.arc(hx, hy, 10, 0, 7); c.fill(); c.beginPath(); c.moveTo(hx - 8, hy - 5); c.lineTo(hx - 6, hy - 16); c.lineTo(hx - 1, hy - 8); c.moveTo(hx + 8, hy - 5); c.lineTo(hx + 6, hy - 16); c.lineTo(hx + 1, hy - 8); c.fill();
    c.fillStyle = "#222"; c.beginPath(); c.arc(hx + 3, hy - 1, 1.6, 0, 7); c.arc(hx + 8, hy - 1, 1.6, 0, 7); c.fill(); c.fillStyle = "#ff8fab"; c.beginPath(); c.arc(hx + 6, hy + 3, 1.5, 0, 7); c.fill(); c.restore(); };
  runner({ id: "parkour", e: "🤸", n: "パルクール", c: "#5f3dc4", bg: "city", obs: ["gap", "low", "high", "gap"], col: "#ff922b", genre: "action", d: "ビルの屋上を走りぬける！タップでジャンプ、下にスワイプでスライディング。すき間に落ちないで。" });
  runner({ id: "hurdles", e: "🏃", n: "110mハードル", c: "#c2552f", bg: "track", obs: ["low"], even: true, len: 5600, col: "#4c6ef5", draw: OBD.hurdle, genre: "sports", ouch: "ガシャン！", d: "等間隔のハードルをタイミングよくとびこえて、CPUより先にゴール。" });
  runner({ id: "ninjarun", e: "🥷", n: "忍者ラン", c: "#343a40", bg: "bamboo", obs: ["low", "high", "gap"], col: "#343a40", hair: "#111", draw: OBD.ninja, pit: "#1d3b2a", d: "竹林をかける忍者。飛んでくる手裏剣はスライディングでかわせ！" });
  runner({ id: "dinorun", e: "🦖", n: "さばくダッシュ", c: "#e0a030", bg: "desert", obs: ["low", "high", "low"], col: "#e8590c", draw: OBD.dino, dust: "#e8c07a", d: "さばくを走る。サボテンはジャンプ、空飛ぶ恐竜はスライディング！" });
  runner({ id: "catrun", e: "🐈", n: "ねこのよるさんぽ", c: "#364fc7", bg: "alley", obs: ["low", "high", "gap"], col: "#ffa94d", char: catChar, draw: OBD.cat, ouch: "ニャッ！", d: "夜の町をねこが走る。ダンボールをとびこえ、洗たく物の下はスライド。" });
  runner({ id: "junglerun", e: "🌴", n: "ジャングルラン", c: "#087f5b", bg: "jungle", obs: ["low", "high", "gap"], col: "#2b8a3e", draw: OBD.jungle, pit: "#0b7285", d: "丸太をこえて、つるの下をくぐり、川をとびこえろ！" });
  runner({ id: "castlerun", e: "🏰", n: "お城だっしゅつ", c: "#5c7cfa", bg: "castle", obs: ["low", "high", "gap"], col: "#c92a2a", draw: OBD.castle, pit: "#1864ab", d: "ゆれるトゲ鉄球をスライドでかわし、お堀をジャンプ。CPUより先に城をぬけ出せ！" });
  runner({ id: "xcountry", e: "🌾", n: "クロスカントリー", c: "#66a80f", bg: "field", obs: ["low", "gap", "low"], col: "#e64980", draw: OBD.field, pit: "#1971c2", genre: "sports", len: 7000, d: "野原を走る長いきょり走。柵と小川をこえて、さいごまでスピードをたもとう。" });

  // ---- 連打きょうそう ----
  function sprint(cfg) {
    add({ id: cfg.id, e: cfg.e, n: cfg.n, c: cfg.c, d: cfg.d, genre: "sports" }, (diff) => {
      const g = X.pro(cfg.id, diff, cfg.n), W = g.W, Hh = g.H, c = g.c, d = g.d;
      const L = cfg.len || 100, rate = [4.6, 6.0, 7.2, 8.4][d];
      const lanes = [{ me: true, col: cfg.col, p: 0, v: 0 }].concat(K.RIVALS.slice(0, 3).map((r, i) => ({ name: r[0], col: r[1], p: 0, v: 0, rate: rate * rand(0.9, 1.06), acc: 0, fin: null })));
      const me = lanes[0]; let t = 0, last = null, taps = 0, miss = 0, order = [], flashL = 0, flashR = 0;
      const tape = X.goalTape(g); const BTN = [{ x: 14, side: "L" }, { x: W / 2 + 6, side: "R" }];
      const topY = Hh * 0.2, laneH = (Hh * 0.62 - topY) / 4;
      g.onDown = (o) => { if (o.y < Hh - 150 || t < 3 || me.fin != null) return; const side = o.x < W / 2 ? "L" : "R"; if (side === "L") flashL = 0.15; else flashR = 0.15;
        if (side !== last) { me.v = Math.min(cfg.vmax || 11.5, me.v + 0.75); taps++; X.tone(side === "L" ? 520 : 620, 0.05, "square", 0.04); last = side; }
        else { miss++; me.v *= 0.82; X.SFX.bad(); g.pop(W / 2, Hh - 180, "交互に！", "#ff8787", 18); } };
      function update(dt) {
        t += dt; flashL -= dt; flashR -= dt; if (t < 3) return;
        for (const r of lanes) {
          if (r.me) { if (me.fin == null) { me.v = Math.max(0, me.v - dt * (cfg.drag || 4.2)); me.p += me.v * dt; } else me.p += me.v * dt * 0.3; }
          else if (r.fin == null) { r.acc += dt * r.rate * rand(0.8, 1.2); while (r.acc >= 1) { r.acc--; r.v = Math.min(cfg.vmax || 11.5, r.v + 0.75); } r.v = Math.max(0, r.v - dt * (cfg.drag || 4.2)); r.p += r.v * dt; }
          else r.p += r.v * dt * 0.3;
          if (r.fin == null && r.p >= L) { r.fin = t - 3; order.push(r); if (r.me) { const rk = order.length; tape.cross(W * 0.62, topY + laneH * 3.6, rk === 1, rk === 1 ? "タイム " + K.fmtT(r.fin) + "秒" : rk + "位 ・ 1位との差 " + K.fmtT(r.fin - order[0].fin) + "秒", rk === 1 ? "GOAL!" : rk + "位"); } }
          r.ph = (r.ph || 0) + r.v * dt * 0.9;
        }
        if (me.fin == null && order.length === 3 && t - 3 - order[2].fin > 6 && !g.over) { g.end(false, "時間切れ…", ["ゴールまで あと " + Math.ceil(L - me.p) + "m", "連打 " + taps + "回", "1位 " + order[0].name + " " + K.fmtT(order[0].fin) + "秒"], false, { v: 0, unit: "秒", lower: true, winOnly: true }); return; }
        if (tape.done(2.5)) { const rk = order.indexOf(me) + 1; g.end(rk === 1, rk === 1 ? "金メダル！ 1位！" : rk + "位…", ["タイム " + K.fmtT(me.fin) + "秒", "連打 " + taps + "回", miss ? "同じ側 " + miss + "回" : "リズム完ぺき"], false, { v: Math.round(me.fin * 100) / 100, unit: "秒", lower: true, winOnly: true }); }
      }
      function draw(c) {
        cfg.bg(c, W, Hh, topY, laneH, g.time);
        const view = 30, x0 = W * 0.18, cam = clamp(me.p - 8, 0, L);
        const sx = (p) => x0 + (p - cam) * ((W * 0.75) / view);
        // ゴールと目もり
        for (let m = 0; m <= L; m += 10) { const x = sx(m); if (x < -10 || x > W + 10) continue; c.fillStyle = "rgba(255,255,255,.6)"; c.fillRect(x - 1, topY, 2, laneH * 4); txt(c, m + "m", x, topY - 10, 11, "#fff", "center", 800); }
        const gx = sx(L); if (gx > -60 && gx < W + 60) { c.fillStyle = "#fff"; c.fillRect(gx - 3, topY, 6, laneH * 4); tape.drawSide(c, gx - 16, topY + laneH * 4, laneH * 4 + 20); }
        lanes.slice().reverse().forEach((r, ri) => { const i = lanes.indexOf(r), y = topY + laneH * (i + 0.85); const x = sx(r.p); cfg.who(c, x, y, r.ph || 0, r.col, r.v, g.time, laneH); if (!r.me) K.tag(c, x, y - laneH * 0.8, r.name, r.col); else K.tag(c, x, y - laneH * 0.8, "あなた", "#f08c00"); });
        // ボタン
        BTN.forEach((b2, i) => { const on = i ? flashR > 0 : flashL > 0, w = W / 2 - 20, y = Hh - 130; const want = last !== b2.side; c.fillStyle = on ? "#ffe066" : want && t > 3 ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.55)"; rr(c, b2.x, y, w, 112, 22); c.fill(); c.strokeStyle = want && t > 3 ? "#f08c00" : "rgba(0,0,0,.1)"; c.lineWidth = 4; c.stroke(); txt(c, i ? "右 ▶" : "◀ 左", b2.x + w / 2, y + 46, 26, "#343a40", "center", 900, null); txt(c, "交互にタップ", b2.x + w / 2, y + 82, 12, "#868e96", "center", 700, null); });
        const rk = lanes.slice().sort((a, b) => (a.fin != null && b.fin != null ? a.fin - b.fin : a.fin != null ? -1 : b.fin != null ? 1 : b.p - a.p)).indexOf(me) + 1;
        K.hud(c, g, Math.min(L, Math.floor(me.p)) + " / " + L + "m", rk + "位", t > 3 ? K.fmtT(me.fin != null ? me.fin : t - 3) + "秒" : "");
        c.fillStyle = "rgba(10,14,40,.5)"; rr(c, 14, Hh - 160, W - 28, 16, 8); c.fill(); c.fillStyle = me.v > 9 ? "#ff6b6b" : "#ffd43b"; rr(c, 16, Hh - 158, (W - 32) * clamp(me.v / (cfg.vmax || 11.5), 0, 1), 12, 6); c.fill();
        K.countdown(g, t, c);
      }
      g.run(update, draw);
    });
  }
  const trackBG = (c, W, Hh, top, lh) => { const gr = c.createLinearGradient(0, 0, 0, top); gr.addColorStop(0, "#74c0fc"); gr.addColorStop(1, "#d0ebff"); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.fillStyle = "#868e96"; c.fillRect(0, top - 60, W, 40); for (let i = 0; i < W; i += 8) { c.fillStyle = ["#ff8787", "#74c0fc", "#ffe066", "#8ce99a"][(i / 8) % 4]; c.beginPath(); c.arc(i + 4, top - 48 + ((i * 7) % 9), 3, 0, 7); c.fill(); } c.fillStyle = "#c2552f"; c.fillRect(0, top, W, lh * 4); c.fillStyle = "#fff"; for (let i = 0; i <= 4; i++) c.fillRect(0, top + lh * i - 1, W, 2); c.fillStyle = "#51cf66"; c.fillRect(0, top + lh * 4, W, Hh); };
  const poolBG = (c, W, Hh, top, lh, t) => { c.fillStyle = "#e9ecef"; c.fillRect(0, 0, W, Hh); c.fillStyle = "#ced4da"; c.fillRect(0, top - 40, W, 30); const gr = c.createLinearGradient(0, top, 0, top + lh * 4); gr.addColorStop(0, "#4dabf7"); gr.addColorStop(1, "#1c7ed6"); c.fillStyle = gr; c.fillRect(0, top, W, lh * 4); for (let i = 1; i < 4; i++) for (let x = 0; x < W; x += 12) { c.fillStyle = (x / 12) % 2 ? "#ffd43b" : "#e03131"; c.beginPath(); c.arc(x + 6, top + lh * i, 4, 0, 7); c.fill(); } c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 2; for (let i = 0; i < 12; i++) { c.beginPath(); const y = top + ((i * 37) % (lh * 4)); c.moveTo(((i * 61 + t * 20) % W), y); c.lineTo(((i * 61 + t * 20) % W) + 20, y); c.stroke(); } c.fillStyle = "#e9ecef"; c.fillRect(0, top + lh * 4, W, Hh); };
  const riverBG = (c, W, Hh, top, lh, t) => { c.fillStyle = "#8ce99a"; c.fillRect(0, 0, W, Hh); c.fillStyle = "#2f9e44"; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc((i * 57) % W, top - 20, 26, 0, 7); c.fill(); } c.fillStyle = "#1098ad"; c.fillRect(0, top, W, lh * 4); c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 2; for (let i = 0; i < 14; i++) { const y = top + 8 + ((i * 29) % (lh * 4 - 10)), x = W - ((i * 73 + t * 60) % (W + 40)); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - 4, x + 16, y); c.stroke(); } for (let i = 1; i < 4; i++) { c.fillStyle = "rgba(255,255,255,.5)"; for (let x = 0; x < W; x += 18) c.fillRect(x, top + lh * i - 1, 8, 2); } c.fillStyle = "#8ce99a"; c.fillRect(0, top + lh * 4, W, Hh); };
  const swimmer = (c, x, y, ph, col, v, t, lh) => { c.save(); c.translate(x, y - lh * 0.3); c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.ellipse(-26, 0, 14 + v, 5, 0, 0, 7); c.fill(); c.fillStyle = "#f8c291"; c.beginPath(); c.ellipse(-6, 0, 16, 5, 0, 0, 7); c.fill(); const a = ph * 1.4; c.strokeStyle = "#f8c291"; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(4, 0); c.lineTo(4 + Math.cos(a) * 16, Math.sin(a) * 10); c.stroke(); c.beginPath(); c.moveTo(4, 0); c.lineTo(4 + Math.cos(a + Math.PI) * 16, Math.sin(a + Math.PI) * 10); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(14, 0, 6.5, 0, 7); c.fill(); c.fillStyle = "#222"; rr(c, 14, -3, 6, 3, 1); c.fill(); c.restore(); };
  const canoe = (c, x, y, ph, col, v, t, lh) => { c.save(); c.translate(x, y - lh * 0.35); c.fillStyle = col; c.beginPath(); c.moveTo(-30, 0); c.quadraticCurveTo(0, 12, 30, 0); c.quadraticCurveTo(0, 4, -30, 0); c.fill(); c.fillStyle = "#f8c291"; c.beginPath(); c.arc(0, -16, 5, 0, 7); c.fill(); c.fillStyle = "#212529"; rr(c, -5, -11, 10, 12, 4); c.fill(); const a = Math.sin(ph * 1.2) * 0.9; c.save(); c.translate(0, -8); c.rotate(a); c.strokeStyle = "#8d5524"; c.lineWidth = 3; c.beginPath(); c.moveTo(-16, 10); c.lineTo(16, -10); c.stroke(); c.fillStyle = "#e67700"; c.beginPath(); c.ellipse(-17, 11, 5, 2.5, -0.6, 0, 7); c.ellipse(17, -11, 5, 2.5, -0.6, 0, 7); c.fill(); c.restore(); c.restore(); };
  sprint({ id: "dash100", e: "🏃‍♂️", n: "100m走", c: "#e8590c", col: "#4c6ef5", bg: trackBG, who: (c, x, y, ph, col) => K.person(c, x, y, ph, col, "run", 0.9), d: "左右のボタンを交互にすばやくタップして走る！同じ側を続けて押すとスピードダウン。" });
  sprint({ id: "swim", e: "🏊", n: "競泳50m", c: "#1c7ed6", col: "#e03131", bg: poolBG, who: swimmer, len: 50, vmax: 6.5, drag: 3, d: "交互タップで水をかいて泳ぐ。リズムよく続けると、どんどん進むよ。" });
  sprint({ id: "canoe", e: "🛶", n: "カヌースプリント", c: "#0c8599", col: "#f08c00", bg: riverBG, who: canoe, len: 200, vmax: 15, drag: 3.6, d: "左右のパドルを交互にこいで200mをかけぬける。" });
  // ---- 綱引き ----
  add({ id: "tugwar", e: "🪢", n: "綱引き", c: "#c92a2a", genre: "sports", d: "交互タップでつなを引こう。まん中の旗が自分の線をこえたら勝ち！" }, (diff) => {
    const g = X.pro("tugwar", diff, "綱引き"), W = g.W, Hh = g.H, c = g.c, d = g.d;
    let t = 0, pos = 0, my = 0, cp = 0, last = null, taps = 0, endT = null, win = false, cpuAcc = 0; const rate = [4.4, 5.8, 7.0, 8.2][d];
    const pull = (side) => { if (t < 3 || endT != null) return; if (side !== last) { my += 1; taps++; last = side; X.tone(side === "L" ? 300 : 360, 0.05, "square", 0.05); g.shake(1.5); } else { my -= 0.6; X.SFX.bad(); } };
    g.onDown = (o) => { if (o.y > Hh - 150) pull(o.x < W / 2 ? "L" : "R"); };
    function update(dt) {
      t += dt; if (t < 3 || endT != null) { if (endT != null) { endT += dt; if (endT > 2.4 && !g.over) g.end(win, win ? "勝ち！ 引きよせた！" : "引っぱられた…", ["タップ " + taps + "回", "つかった時間 " + K.fmtT(t - 3 - endT) + "秒"], false, { v: Math.round((t - 3 - endT) * 100) / 100, unit: "秒", lower: true, winOnly: true }); } return; }
      cpuAcc += dt * rate * (1 + Math.sin(t * 1.3) * 0.25); while (cpuAcc >= 1) { cpuAcc--; cp += 1; }
      const f = (my - cp); my = 0; cp = 0; pos += f * 2.2; pos *= 1 - dt * 0.15;
      if (t - 3 > 45 && Math.abs(pos) <= 110) { endT = 0; win = pos < 0; g.pop(W / 2, Hh * 0.3, "時間切れ！", "#fff", 26); if (win) X.SFX.cheer(); else X.tone(300, 0.6, "triangle", 0.09, 120); return; }
      if (Math.abs(pos) > 110) { endT = 0; win = pos < 0; g.flash(win ? "#fff" : "#9fb4ff", 0.5); g.shake(8); if (win) { X.SFX.cheer(); g.burst(W / 2, Hh * 0.4, ["#ffd43b", "#ff6b6b", "#fff"], 40, 300); } else X.tone(300, 0.6, "triangle", 0.09, 120); }
    }
    function draw(c) {
      const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, "#a5d8ff"); gr.addColorStop(0.45, "#e7f5ff"); gr.addColorStop(0.46, "#8ce99a"); gr.addColorStop(1, "#51cf66"); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
      const cy = Hh * 0.5, cx = W / 2 + pos;
      c.fillStyle = "#fff"; c.fillRect(W / 2 - 110 - 2, cy - 60, 4, 120); c.fillRect(W / 2 + 110 - 2, cy - 60, 4, 120); c.fillStyle = "rgba(255,255,255,.5)"; c.fillRect(W / 2 - 1, cy - 70, 2, 140);
      c.strokeStyle = "#c08552"; c.lineWidth = 6; c.beginPath(); c.moveTo(cx - 240, cy); c.lineTo(cx + 240, cy); c.stroke();
      c.fillStyle = "#e03131"; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - 34); c.lineTo(cx + 18, cy - 26); c.lineTo(cx, cy - 18); c.fill();
      const lean = clamp(pos / 120, -1, 1);
      for (let i = 0; i < 3; i++) { K.person(c, cx - 60 - i * 34, cy + 30, 0.4 + Math.sin(g.time * 10 + i) * (endT == null ? 0.25 : 0), "#4c6ef5", endT != null && !win ? "fall" : "run", 0.9); K.person(c, cx + 60 + i * 34, cy + 30, -0.4, "#e03131", endT != null && win ? "fall" : "run", 0.9); }
      K.tag(c, cx - 90, cy - 70, "あなた", "#4c6ef5"); K.tag(c, cx + 90, cy - 70, "CPU", "#e03131");
      [["L", 14], ["R", W / 2 + 6]].forEach(([s, x], i) => { const w = W / 2 - 20, y = Hh - 130; c.fillStyle = last !== s && t > 3 ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.55)"; rr(c, x, y, w, 112, 22); c.fill(); txt(c, i ? "右 ▶" : "◀ 左", x + w / 2, y + 50, 26, "#343a40", "center", 900, null); txt(c, "交互にタップ", x + w / 2, y + 84, 12, "#868e96", "center", 700, null); });
      K.hud(c, g, "あなた ◀", lean < -0.3 ? "おしてる！" : lean > 0.3 ? "ピンチ！" : "ごかく", "▶ CPU");
      K.countdown(g, t, c);
    }
    g.run(update, draw);
  });
})();
