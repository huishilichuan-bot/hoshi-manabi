/* ほしまなび — レース系ゲーム（上から見たコース）。カート・バイク・ボート・スキー・スノボ・宇宙・競馬・自転車・ラリー・水上バイク。すべてオリジナル */
(() => {
  "use strict";
  const H = window.HMGames, X = window.HMPro, K = window.HMKit, { rr, txt, clamp, lerp, rand } = X;
  const add = (m, fn) => H.add(Object.assign({ pro: true, genre: "race" }, m), fn);

  // ---- 乗り物の絵（上から、上向き） ----
  const V = {
    kart(c, col, t, sp) { c.fillStyle = "#222"; [[-13, -12], [9, -12], [-14, 9], [10, 9]].forEach(([x, y]) => { rr(c, x, y, 5, 10, 2); c.fill(); }); c.fillStyle = col; rr(c, -10, -20, 20, 38, 8); c.fill(); c.fillStyle = "rgba(255,255,255,.3)"; rr(c, -7, -18, 5, 30, 3); c.fill(); c.fillStyle = "#ffe066"; c.beginPath(); c.arc(0, 2, 6.5, 0, 7); c.fill(); c.fillStyle = "#333"; rr(c, -5, -3, 10, 4, 2); c.fill(); c.fillStyle = "#444"; rr(c, -11, 16, 22, 4, 2); c.fill(); },
    rally(c, col, t, sp) { c.fillStyle = "#1b1b1b"; [[-13, -14], [8, -14], [-13, 8], [8, 8]].forEach(([x, y]) => { rr(c, x, y, 5, 11, 2); c.fill(); }); c.fillStyle = col; rr(c, -11, -22, 22, 44, 7); c.fill(); c.fillStyle = "#9ad0ff"; rr(c, -8, -12, 16, 8, 3); c.fill(); c.fillStyle = "rgba(0,0,0,.35)"; rr(c, -8, 6, 16, 6, 2); c.fill(); c.fillStyle = "#fff"; c.fillRect(-2, -22, 4, 44); },
    bike(c, col, t, sp) { c.fillStyle = "#222"; rr(c, -3, -22, 6, 11, 3); c.fill(); rr(c, -3, 11, 6, 12, 3); c.fill(); c.fillStyle = col; rr(c, -6, -14, 12, 28, 5); c.fill(); c.strokeStyle = "#555"; c.lineWidth = 3; c.beginPath(); c.moveTo(-11, -12); c.lineTo(11, -12); c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.arc(0, 0, 6, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(0, 0, 6, Math.PI, 0); c.fill(); },
    bicycle(c, col, t, sp) { c.strokeStyle = "#333"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -22); c.lineTo(0, 22); c.stroke(); c.lineWidth = 2.5; c.beginPath(); c.moveTo(-10, -13); c.lineTo(10, -13); c.stroke(); const k = Math.sin(t * 14) * 4; c.fillStyle = "#2b2d42"; c.beginPath(); c.ellipse(-4, 6 + k, 3, 6, 0, 0, 7); c.ellipse(4, 6 - k, 3, 6, 0, 0, 7); c.fill(); c.fillStyle = col; rr(c, -7, -8, 14, 16, 6); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(0, -9, 5.5, 7, 0, 0, 7); c.fill(); c.fillStyle = col; c.fillRect(-1.5, -15, 3, 12); },
    boat(c, col, t, sp) { c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.moveTo(-10, 18); c.lineTo(-18 - sp * 8, 40); c.lineTo(18 + sp * 8, 40); c.lineTo(10, 18); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(0, -26); c.quadraticCurveTo(14, -6, 12, 20); c.lineTo(-12, 20); c.quadraticCurveTo(-14, -6, 0, -26); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(0, -20); c.quadraticCurveTo(10, -4, 9, 16); c.lineTo(-9, 16); c.quadraticCurveTo(-10, -4, 0, -20); c.fill(); c.fillStyle = "#9ad0ff"; rr(c, -6, -6, 12, 7, 3); c.fill(); c.fillStyle = "#ffe066"; c.beginPath(); c.arc(0, 8, 4.5, 0, 7); c.fill(); },
    jetski(c, col, t, sp) { c.fillStyle = "rgba(255,255,255,.6)"; c.beginPath(); c.moveTo(-6, 14); c.lineTo(-14 - sp * 10, 38); c.lineTo(14 + sp * 10, 38); c.lineTo(6, 14); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(0, -22); c.quadraticCurveTo(10, -8, 8, 16); c.lineTo(-8, 16); c.quadraticCurveTo(-10, -8, 0, -22); c.fill(); c.fillStyle = "#333"; rr(c, -9, -8, 18, 3, 1); c.fill(); c.fillStyle = "#2b2d42"; rr(c, -5, -2, 10, 12, 4); c.fill(); c.fillStyle = "#ff922b"; c.beginPath(); c.arc(0, -3, 5, 0, 7); c.fill(); },
    ski(c, col, t, sp) { const a = Math.sin(t * 3) * 0.12; c.save(); c.rotate(a); c.strokeStyle = "#ffd43b"; c.lineWidth = 3; c.beginPath(); c.moveTo(-5, -24); c.lineTo(-5, 18); c.moveTo(5, -24); c.lineTo(5, 18); c.stroke(); c.strokeStyle = "#555"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-12, -6); c.lineTo(-13, 14); c.moveTo(12, -6); c.lineTo(13, 14); c.stroke(); c.fillStyle = col; rr(c, -8, -10, 16, 16, 6); c.fill(); c.fillStyle = "#f8c291"; c.beginPath(); c.arc(0, -10, 5.5, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(0, -11, 5.5, Math.PI, 0); c.fill(); c.restore(); },
    snowboard(c, col, t, sp) { const a = 0.5 + Math.sin(t * 2.5) * 0.25; c.save(); c.rotate(a); c.fillStyle = "#4c6ef5"; rr(c, -20, -6, 40, 12, 6); c.fill(); c.fillStyle = "#fff"; c.fillRect(-14, -1, 28, 2); c.restore(); c.fillStyle = col; rr(c, -8, -8, 16, 16, 7); c.fill(); c.fillStyle = "#f8c291"; c.beginPath(); c.arc(0, -8, 5.5, 0, 7); c.fill(); c.fillStyle = "#212529"; c.beginPath(); c.arc(0, -9, 5.5, Math.PI, 0); c.fill(); },
    sled(c, col, t, sp) { c.strokeStyle = "#8d5524"; c.lineWidth = 3; c.beginPath(); c.moveTo(-9, -18); c.lineTo(-9, 18); c.moveTo(9, -18); c.lineTo(9, 18); c.stroke(); c.fillStyle = "#c08552"; rr(c, -10, -12, 20, 26, 4); c.fill(); c.fillStyle = col; rr(c, -7, -6, 14, 16, 6); c.fill(); c.fillStyle = "#f8c291"; c.beginPath(); c.arc(0, -6, 5.5, 0, 7); c.fill(); c.fillStyle = "#e03131"; c.beginPath(); c.arc(0, -7, 5.5, Math.PI, 0); c.fill(); for (let i = 0; i < 2; i++) { const dx = i ? 6 : -6, k = Math.sin(t * 16 + i) * 3; c.fillStyle = "#adb5bd"; c.beginPath(); c.ellipse(dx, -34 + k, 4, 8, 0, 0, 7); c.fill(); c.fillStyle = "#868e96"; c.beginPath(); c.arc(dx, -43 + k, 3.5, 0, 7); c.fill(); } c.strokeStyle = "#555"; c.lineWidth = 1; c.beginPath(); c.moveTo(-6, -26); c.lineTo(0, -12); c.lineTo(6, -26); c.stroke(); },
    horse(c, col, t, sp) { const k = Math.sin(t * 15) * 3; c.fillStyle = "#8d5524"; c.beginPath(); c.ellipse(0, 2, 9, 20, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(0, -24 + k * 0.3, 5, 9, 0, 0, 7); c.fill(); c.fillStyle = "#5c3a1a"; [[-8, -10 + k], [8, -10 - k], [-8, 14 - k], [8, 14 + k]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 3, 6, 0, 0, 7); c.fill(); }); c.fillStyle = "#3b2414"; c.fillRect(-1.5, -22, 3, 10); c.beginPath(); c.moveTo(-3, 20); c.quadraticCurveTo(0, 32 + k, 3, 20); c.fill(); c.fillStyle = col; rr(c, -6, -6, 12, 13, 5); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(0, -7, 5, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(0, -8, 5, Math.PI, 0); c.fill(); },
    rocket(c, col, t, sp) { const f = 10 + sp * 16 + Math.sin(t * 40) * 4; const gr = c.createLinearGradient(0, 18, 0, 18 + f); gr.addColorStop(0, "#fff3bf"); gr.addColorStop(0.4, "#ff922b"); gr.addColorStop(1, "rgba(255,80,0,0)"); c.fillStyle = gr; c.beginPath(); c.moveTo(-7, 16); c.lineTo(0, 18 + f); c.lineTo(7, 16); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(-16, 16); c.lineTo(-8, 0); c.lineTo(8, 0); c.lineTo(16, 16); c.fill(); c.fillStyle = "#e9ecef"; c.beginPath(); c.moveTo(0, -26); c.quadraticCurveTo(10, -10, 8, 18); c.lineTo(-8, 18); c.quadraticCurveTo(-10, -10, 0, -26); c.fill(); c.fillStyle = "#74c0fc"; c.beginPath(); c.arc(0, -8, 4.5, 0, 7); c.fill(); c.fillStyle = col; c.fillRect(-8, 8, 16, 4); },
  };
  // ---- 障害物の絵 ----
  const OB = {
    cone(c) { c.fillStyle = "#ff922b"; c.beginPath(); c.moveTo(0, -12); c.lineTo(9, 9); c.lineTo(-9, 9); c.fill(); c.fillStyle = "#fff"; c.fillRect(-5, -2, 10, 3); c.fillStyle = "#e8590c"; rr(c, -11, 8, 22, 5, 2); c.fill(); },
    oil(c) { c.fillStyle = "rgba(20,20,30,.85)"; c.beginPath(); c.ellipse(0, 0, 18, 11, 0.3, 0, 7); c.fill(); c.fillStyle = "rgba(160,120,255,.35)"; c.beginPath(); c.ellipse(-4, -3, 7, 3, 0.3, 0, 7); c.fill(); },
    rock(c) { c.fillStyle = "#868e96"; c.beginPath(); c.moveTo(-14, 8); c.lineTo(-10, -9); c.lineTo(3, -13); c.lineTo(14, -2); c.lineTo(11, 10); c.fill(); c.fillStyle = "#adb5bd"; c.beginPath(); c.moveTo(-8, -6); c.lineTo(3, -10); c.lineTo(6, -2); c.fill(); },
    tree(c) { c.fillStyle = "rgba(0,0,0,.2)"; c.beginPath(); c.ellipse(4, 6, 14, 6, 0, 0, 7); c.fill(); c.fillStyle = "#2b8a3e"; c.beginPath(); c.moveTo(0, -20); c.lineTo(13, 6); c.lineTo(-13, 6); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(0, -20); c.lineTo(6, -8); c.lineTo(-6, -8); c.fill(); },
    snowman(c) { c.fillStyle = "#fff"; c.beginPath(); c.arc(0, 5, 10, 0, 7); c.arc(0, -9, 7, 0, 7); c.fill(); c.strokeStyle = "#ced4da"; c.lineWidth = 1; c.stroke(); c.fillStyle = "#ff922b"; c.beginPath(); c.moveTo(0, -9); c.lineTo(7, -8); c.lineTo(0, -7); c.fill(); c.fillStyle = "#e03131"; c.fillRect(-7, -3, 14, 3); },
    buoy(c) { c.fillStyle = "#ff6b6b"; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill(); c.fillStyle = "#fff"; c.fillRect(-10, -2, 20, 4); c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 14, 0, 7); c.stroke(); },
    log(c) { c.fillStyle = "#8d5524"; rr(c, -22, -7, 44, 14, 7); c.fill(); c.fillStyle = "#c08552"; c.beginPath(); c.ellipse(-20, 0, 4, 7, 0, 0, 7); c.fill(); c.strokeStyle = "#5c3a1a"; c.lineWidth = 1; c.beginPath(); c.moveTo(-12, -3); c.lineTo(14, -3); c.stroke(); },
    rockS(c) { c.fillStyle = "#6c5f8f"; c.beginPath(); for (let i = 0; i < 9; i++) { const a = (i / 9) * 7, r = 13 + (i % 3) * 3; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); c.fillStyle = "#4b3f72"; c.beginPath(); c.arc(-3, -2, 4, 0, 7); c.arc(5, 4, 3, 0, 7); c.fill(); },
    hay(c) { c.fillStyle = "#f2c94c"; rr(c, -16, -9, 32, 18, 4); c.fill(); c.strokeStyle = "#c9a227"; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, -9); c.lineTo(-8, 9); c.moveTo(8, -9); c.lineTo(8, 9); c.stroke(); },
    puddle(c) { c.fillStyle = "rgba(90,70,40,.7)"; c.beginPath(); c.ellipse(0, 0, 20, 10, 0, 0, 7); c.fill(); c.fillStyle = "rgba(255,255,255,.25)"; c.beginPath(); c.ellipse(-5, -2, 6, 2, 0, 0, 7); c.fill(); },
    flag(c) { c.strokeStyle = "#333"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 10); c.lineTo(0, -14); c.stroke(); c.fillStyle = "#e03131"; c.beginPath(); c.moveTo(0, -14); c.lineTo(12, -9); c.lineTo(0, -4); c.fill(); },
  };
  // ---- コースのテーマ ----
  const TH = {
    asphalt: { out: "#5aa04a", out2: "#4f9440", road: "#4a4e5a", edge: (i) => (i % 2 ? "#e03131" : "#fff"), line: "#f8f9fa" },
    dirt: { out: "#7a9b4a", out2: "#6d8c40", road: "#b08250", edge: () => "#8d6238", line: "rgba(255,255,255,.0)" },
    snow: { out: "#e7f5ff", out2: "#d0ebff", road: "#f8f9fa", edge: (i) => (i % 2 ? "#74c0fc" : "#fff"), line: "rgba(160,190,220,.0)", tracks: true },
    water: { out: "#1c7ed6", out2: "#1971c2", road: "#339af0", edge: (i) => (i % 2 ? "#ffd43b" : "#fff"), line: "rgba(255,255,255,.0)", waves: true },
    space: { out: "#0b0b2a", out2: "#11113a", road: "#1b1b4a", edge: (i) => (i % 2 ? "#22d3ee" : "#cc5de8"), line: "rgba(34,211,238,.35)", stars: true },
    turf: { out: "#2f9e44", out2: "#2b8a3e", road: "#8ce99a", edge: () => "#fff", line: "rgba(255,255,255,.0)", turf: true },
    track: { out: "#69db7c", out2: "#51cf66", road: "#c2552f", edge: () => "#fff", line: "#fff" },
  };
  function racer(cfg) {
    add({ id: cfg.id, e: cfg.e, n: cfg.n, c: cfg.c, d: cfg.d }, (diff) => {
      const g = X.pro(cfg.id, diff, cfg.n), W = g.W, Hh = g.H, c = g.c, d = g.d, th = TH[cfg.th];
      const L = cfg.len || 9000, RW = Math.min(W * 0.7, 290), PY = Hh * 0.76, VMAX = cfg.vmax || 430;
      const center = (p) => W / 2 + Math.sin(p / 900) * W * 0.11 + Math.sin(p / 2300 + 1) * W * 0.06;
      const me = { pos: 0, lx: 0, v: 0, hit: 0, boost: 0, fin: null, me: true, col: cfg.my || "#ffd43b" };
      const skill = [0.8, 0.89, 0.96, 1.02][d];
      const rivals = K.RIVALS.slice(0, 3).map((r, i) => ({ name: r[0], col: r[1], pos: 0, lx: (i - 1) * RW * 0.28, v: 0, sk: skill * rand(0.96, 1.04), slow: 0, fin: null, tx: 0 }));
      // コースに置くもの（障害物・ブースト・コイン）
      const objs = []; let y = 900;
      while (y < L - 400) { const k = rand(0, 1); if (k < 0.62) objs.push({ pos: y, lx: rand(-0.42, 0.42) * RW, kind: "ob", ob: cfg.obs[Math.floor(rand(0, cfg.obs.length))] }); else if (k < 0.8) objs.push({ pos: y, lx: rand(-0.35, 0.35) * RW, kind: "boost" }); else for (let j = 0; j < 4; j++) objs.push({ pos: y + j * 45, lx: Math.sin(y) * RW * 0.3, kind: "coin" }); y += rand(170, 300) - d * 18; }
      const tape = X.goalTape(g); let t = 0, coins = 0, finT = 0, order = [], drift = 0;
      let target = null;
      g.onDown = (o) => { target = o.x; }; g.onMove = (o) => { target = o.x; }; g.onUp = () => { target = null; };
      const sx = (r) => center(r.pos) + r.lx;
      function update(dt) {
        t += dt; const go = t >= 3;
        if (go && !me.fin) {
          const want = me.boost > 0 ? VMAX * 1.45 : VMAX; me.v = lerp(me.v, me.hit > 0 ? VMAX * 0.3 : want, dt * (me.hit > 0 ? 6 : 1.1));
          const off = Math.abs(me.lx) > RW / 2 - 10; if (off) { me.v *= 1 - dt * 1.6; if (Math.random() < 0.5) g.burst(sx(me), PY + 16, cfg.dust || "#c9a26a", 1, 60, 0.4, 2.5); }
          if (target != null) { const tl = clamp(target - center(me.pos), -RW / 2 - 14, RW / 2 + 14); drift = clamp((tl - me.lx) * 6, -380, 380); me.lx += drift * dt; } else drift *= 0.85;
          me.pos += me.v * dt; me.hit = Math.max(0, me.hit - dt); me.boost = Math.max(0, me.boost - dt);
          for (const o of objs) { if (o.done || Math.abs(o.pos - me.pos) > 22 || Math.abs(o.lx - me.lx) > (o.kind === "ob" ? 24 : 22)) continue; o.done = true;
            if (o.kind === "ob") { me.hit = 0.7; g.shake(8); X.SFX.hit(); g.vib(40); g.burst(sx(me), PY - 10, ["#fff", "#ff8787"], 16, 200); g.pop(sx(me), PY - 40, "ドカッ！", "#ff8787", 20); }
            else if (o.kind === "boost") { me.boost = 1.3; X.SFX.whoosh(); X.tone(660, 0.25, "sawtooth", 0.06, 1320); g.flash("#74c0fc", 0.25); g.pop(sx(me), PY - 40, "ダッシュ！", "#74c0fc", 20); }
            else { coins++; X.SFX.coin(); g.burst(sx(me), PY - 10, "#ffd43b", 8, 120); } }
          if (me.pos >= L) { me.fin = t - 3; order.push(me); const rank = order.indexOf(me) + 1; tape.cross(sx(me), PY - 20, rank === 1, rank === 1 ? "1位！ タイム " + K.fmtT(me.fin) + "秒" : rank + "位… 1位との差 " + K.fmtT(me.fin - order[0].fin) + "秒", rank === 1 ? "GOAL!" : "ゴール"); }
        } else if (me.fin) { me.v *= 1 - dt * 1.2; me.pos += me.v * dt; }
        if (go) for (const r of rivals) {
          if (r.fin) { r.v *= 1 - dt; r.pos += r.v * dt; continue; }
          r.slow = Math.max(0, r.slow - dt); if (Math.random() < dt * (0.22 - d * 0.04)) r.slow = rand(0.3, 0.8);
          r.v = lerp(r.v, VMAX * r.sk * (r.slow > 0 ? 0.55 : 1) * (1 + Math.sin(t * 0.7 + r.sk * 9) * 0.04), dt * 1.2);
          // 近くの障害物をよける
          const ob = objs.find((o) => o.kind === "ob" && o.pos > r.pos && o.pos - r.pos < 160 && Math.abs(o.lx - r.lx) < 30);
          if (ob) r.tx = ob.lx + (ob.lx > 0 ? -60 : 60); else if (Math.random() < dt * 0.5) r.tx = rand(-0.35, 0.35) * RW;
          r.lx += clamp(r.tx - r.lx, -150 * dt, 150 * dt);
          if (Math.abs(r.pos - me.pos) < 34 && Math.abs(r.lx - me.lx) < 24) { const p = r.lx > me.lx ? 1 : -1; r.lx += p * 60 * dt * 4; me.lx -= p * 60 * dt * 4; if (!r.bump || t - r.bump > 0.4) { r.bump = t; X.SFX.kick(); g.shake(4); } }
          r.pos += r.v * dt; if (r.pos >= L) { r.fin = t - 3; order.push(r); if (order.length === 1) { X.tone(440, 0.2, "square", 0.05); } }
        }
        if (tape.done(2.6)) { const rank = order.indexOf(me) + 1; g.end(rank === 1, rank === 1 ? "優勝！ 1位でゴール！" : rank + "位でした…", ["タイム " + K.fmtT(me.fin) + "秒", rank === 1 ? "2位と " + K.fmtT(((order[1] || {}).fin || me.fin + 1) - me.fin) + "秒差" : "1位 " + order[0].name + " " + K.fmtT(order[0].fin) + "秒", "コイン " + coins], false, { v: Math.round(me.fin * 100) / 100, unit: "秒", lower: true, winOnly: true }); }
      }
      function draw(c) {
        const cam = me.pos;
        c.fillStyle = th.out; c.fillRect(0, 0, W, Hh);
        // コース外の模様
        c.fillStyle = th.out2; for (let yy = -80 + (cam % 80); yy < Hh + 80; yy += 80) c.fillRect(0, yy, W, 40);
        if (th.stars) { c.fillStyle = "#fff"; for (let i = 0; i < 60; i++) { const yy = ((i * 97 + cam * (0.2 + (i % 3) * 0.15)) % (Hh + 20)) - 10; c.globalAlpha = 0.3 + (i % 4) * 0.15; c.fillRect((i * 53) % W, yy, 2, 2); } c.globalAlpha = 1; }
        // 道（細かい帯でカーブを描く）
        const step = 12;
        for (let yy = Hh + step; yy > -step; yy -= step) { const p = cam + (PY - yy), cx = center(p), seg = Math.floor(p / 60);
          c.fillStyle = th.road; c.fillRect(cx - RW / 2, yy - step, RW, step + 1);
          c.fillStyle = th.edge(seg); c.fillRect(cx - RW / 2 - 8, yy - step, 8, step + 1); c.fillRect(cx + RW / 2, yy - step, 8, step + 1);
          if (th.line && seg % 2 === 0) { c.fillStyle = th.line; c.fillRect(cx - RW / 6 - 2, yy - step, 4, step + 1); c.fillRect(cx + RW / 6 - 2, yy - step, 4, step + 1); }
          if (th.waves && (Math.floor(p / 24) % 5 === 0)) { c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 2; c.beginPath(); for (let k = -2; k <= 2; k++) { const xx = cx + k * RW / 5 + Math.sin(p / 30 + k) * 6; c.moveTo(xx - 8, yy); c.quadraticCurveTo(xx, yy - 5, xx + 8, yy); } c.stroke(); }
          if (th.turf && seg % 2) { c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(cx - RW / 2, yy - step, RW, step + 1); }
          if (th.tracks && Math.floor(p / 12) % 7 === 0) { c.fillStyle = "rgba(160,190,220,.4)"; c.fillRect(cx - RW / 4 + Math.sin(p / 80) * 20, yy - 2, 3, 3); c.fillRect(cx + RW / 5 + Math.sin(p / 70) * 20, yy - 2, 3, 3); }
        }
        // スタートとゴール
        const gy = PY - (L - cam); if (gy > -20 && gy < Hh + 20) tape.drawTop(c, gy, center(L) - RW / 2, center(L) + RW / 2);
        const sy = PY - (0 - cam); if (sy < Hh + 10) { c.fillStyle = "#fff"; c.fillRect(center(0) - RW / 2, sy - 3, RW, 6); }
        // もの
        for (const o of objs) { if (o.done && o.kind !== "ob") continue; const yy = PY - (o.pos - cam); if (yy < -30 || yy > Hh + 30) continue; const xx = center(o.pos) + o.lx;
          c.save(); c.translate(xx, yy);
          if (o.kind === "ob") { if (o.done) c.globalAlpha = 0.45; OB[o.ob](c); }
          else if (o.kind === "boost") { const k = (g.time * 2) % 1; c.fillStyle = "rgba(51,154,240,.85)"; rr(c, -18, -16, 36, 32, 8); c.fill(); c.fillStyle = "#fff"; for (let j = 0; j < 2; j++) { c.globalAlpha = 1 - ((k + j * 0.5) % 1); c.beginPath(); const oy = 6 - ((k + j * 0.5) % 1) * 12; c.moveTo(-9, oy + 4); c.lineTo(0, oy - 5); c.lineTo(9, oy + 4); c.lineTo(5, oy + 4); c.lineTo(0, oy - 1); c.lineTo(-5, oy + 4); c.fill(); } c.globalAlpha = 1; }
          else { c.fillStyle = "#ffd43b"; c.beginPath(); c.ellipse(0, 0, 8 * Math.abs(Math.cos(g.time * 4 + o.pos)), 8, 0, 0, 7); c.fill(); c.fillStyle = "#f59f00"; c.beginPath(); c.ellipse(0, 0, 4 * Math.abs(Math.cos(g.time * 4 + o.pos)), 4, 0, 0, 7); c.fill(); }
          c.restore(); }
        // ライバルと自分
        const all = rivals.concat([me]).sort((a, b) => b.pos - a.pos);
        for (const r of all) { const yy = r.me ? PY : PY - (r.pos - cam); if (yy < -50 || yy > Hh + 50) continue; const xx = sx(r);
          c.save(); c.translate(xx, yy); c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(4, 6, 15, 22, 0, 0, 7); c.fill();
          if (r.me) c.rotate(clamp(drift / 1400, -0.3, 0.3)); if (r.me && me.hit > 0) c.rotate(Math.sin(me.hit * 30) * 0.4);
          V[cfg.v](c, r.col, g.time + (r.me ? 0 : r.sk * 7), clamp(r.v / VMAX, 0, 1.5)); c.restore();
          if (!r.me) K.tag(c, xx, yy - 36, r.name, r.col); else if (me.boost > 0) { c.globalAlpha = 0.6; g.burst(xx + rand(-6, 6), yy + 24, ["#74c0fc", "#fff"], 1, 40, 0.3, 3); c.globalAlpha = 1; }
        }
        // HUD
        const ranks = rivals.concat([me]).slice().sort((a, b) => (a.fin != null && b.fin != null ? a.fin - b.fin : a.fin != null ? -1 : b.fin != null ? 1 : b.pos - a.pos));
        const myRank = ranks.indexOf(me) + 1;
        K.hud(c, g, (cfg.unitName || "") + Math.round(Math.min(me.pos, L) / 10) + " / " + L / 10 + "m", K.rankName(myRank) + " / 4", t > 3 ? K.fmtT(me.fin != null ? me.fin : t - 3) + "秒" : "");
        K.progress(c, g, rivals.map((r) => ({ p: r.pos / L, c: r.col })).concat([{ p: me.pos / L, c: me.col, me: true }]));
        const spd = Math.round(me.v * (cfg.kmh || 0.36)); c.fillStyle = "rgba(10,14,40,.5)"; rr(c, 10, Hh - 52, 92, 40, 12); c.fill(); txt(c, spd + "", 50, Hh - 33, 22, me.boost > 0 ? "#74c0fc" : "#fff", "right"); txt(c, "km/h", 56, Hh - 30, 11, "#ced4da", "left", 700, null);
        if (t < 6 && t > 0.2) { c.globalAlpha = Math.min(1, (6 - t)); txt(c, "指を左右に動かしてハンドル", W / 2, Hh - 30, 15, "#fff"); c.globalAlpha = 1; }
        K.countdown(g, t, c);
      }
      g.run(update, draw);
    });
  }
  racer({ id: "kart", e: "🏎️", n: "カートグランプリ", c: "#e8590c", v: "kart", th: "asphalt", obs: ["cone", "oil"], d: "指でハンドルを切って、コーンやオイルをよけよう。青いダッシュ板で加速！4台で1位をめざせ。" });
  racer({ id: "bikerace", e: "🏍️", n: "バイクレース", c: "#c92a2a", v: "bike", th: "asphalt", obs: ["cone", "oil", "rock"], vmax: 470, len: 10000, d: "スピードが出るバイクで公道レース。オイルにのるとスリップ！" });
  racer({ id: "rally", e: "🚙", n: "ダートラリー", c: "#a0522d", v: "rally", th: "dirt", obs: ["rock", "puddle", "log"], dust: "#c9a26a", d: "でこぼこの土の道を走るラリー。水たまりと丸太に注意。" });
  racer({ id: "boatrace", e: "🚤", n: "ボートレース", c: "#1971c2", v: "boat", th: "water", obs: ["buoy", "log"], dust: "#fff", d: "波をけって進むボートレース。ブイと流木をよけてゴールへ。" });
  racer({ id: "jetski", e: "🌊", n: "水上バイク", c: "#0c8599", v: "jetski", th: "water", obs: ["buoy", "rock"], dust: "#fff", vmax: 460, d: "水しぶきを上げて走る水上バイク。岩とブイに気をつけて。" });
  racer({ id: "skirace", e: "⛷️", n: "スキー大回転", c: "#4dabf7", v: "ski", th: "snow", obs: ["flag", "tree", "rock"], dust: "#fff", d: "雪の斜面をすべりおりる。旗や木にぶつからないように！" });
  racer({ id: "snowboard", e: "🏂", n: "スノーボードクロス", c: "#5c7cfa", v: "snowboard", th: "snow", obs: ["snowman", "tree", "rock"], dust: "#fff", d: "4人で同時にすべるスノーボードクロス。雪だるまをよけて1位へ。" });
  racer({ id: "sledrace", e: "🛷", n: "犬ぞりレース", c: "#868e96", v: "sled", th: "snow", obs: ["tree", "snowman", "log"], dust: "#fff", vmax: 400, d: "犬たちといっしょに雪原をかける犬ぞりレース。" });
  racer({ id: "spacerace", e: "🚀", n: "スペースレース", c: "#5f3dc4", v: "rocket", th: "space", obs: ["rockS"], dust: "#cc5de8", vmax: 500, len: 11000, d: "宇宙のコースをロケットで飛ぶ。いん石をよけて、ダッシュ板で一気に加速！" });
  racer({ id: "horserace", e: "🏇", n: "競馬ダービー", c: "#2b8a3e", v: "horse", th: "turf", obs: ["hay", "puddle"], dust: "#8ce99a", vmax: 410, d: "芝のコースを馬で走るレース。干し草をよけて最後まで走りぬけ！" });
  racer({ id: "cycling", e: "🚴", n: "ロードバイク", c: "#f08c00", v: "bicycle", th: "asphalt", obs: ["cone", "puddle", "rock"], vmax: 380, d: "自転車ロードレース。ライバルのうしろにつくのも作戦。" });
})();
