/* ほしまなび — ラリー（テニス・卓球・バドミントン・ビーチバレー）、トップビューのバトル（バトルロイヤル系6種）、1対1の格闘（ボクシング・剣道・フェンシング）、すもう。すべてオリジナル */
(() => {
  "use strict";
  const H = window.HMGames, X = window.HMPro, K = window.HMKit, { rr, txt, clamp, lerp, rand } = X;
  const add = (m, fn) => H.add(Object.assign({ pro: true }, m), fn);

  // ===== ラリー =====
  const CT = {
    tennis: { out: "#2f9e44", court: "#1c7ed6", line: "#fff", net: true, ball: "#d8f5a2", rac: "#e8590c", rr: 15 },
    pingpong: { out: "#343a40", court: "#0b7285", line: "#fff", net: true, ball: "#fff", rac: "#e03131", rr: 13, table: true },
    badminton: { out: "#c2552f", court: "#2b8a3e", line: "#fff", net: true, ball: "#fff", rac: "#ffd43b", rr: 15, shuttle: true },
    beach: { out: "#74c0fc", court: "#f2d398", line: "#1c7ed6", net: true, ball: "#ffe066", rac: null, rr: 20, beach: true },
  };
  function rally(cfg) {
    add({ id: cfg.id, e: cfg.e, n: cfg.n, c: cfg.c, d: cfg.d, genre: "sports" }, (diff) => {
      const g = X.pro(cfg.id, diff, cfg.n), W = g.W, Hh = g.H, c = g.c, d = g.d, th = CT[cfg.th];
      const top = 70, bot = Hh - 40, cl = 26, cr = W - 26, mid = (top + bot) / 2, TO = cfg.to || 5;
      const me = { x: W / 2, y: bot - 30, tx: W / 2 }, cpu = { x: W / 2, y: top + 30 };
      const cpuSpd = [150, 210, 270, 340][d], cpuErr = [46, 30, 18, 8][d];
      let ball = null, sc = [0, 0], serve = 0, t = 0, wait = 1.2, rallyN = 0, msg = null, endT = null, best = 0, aimOff = 0;
      g.onDown = (o) => { me.tx = o.x; }; g.onMove = (o) => { me.tx = o.x; };
      function newBall() { const s = serve; ball = { x: s ? cpu.x : me.x, y: s ? cpu.y + 24 : me.y - 24, vx: rand(-60, 60), vy: (s ? 1 : -1) * (cfg.spd || 260), z: 0, last: s }; rallyN = 0; X.SFX.pop(); aimOff = rand(-cpuErr, cpuErr); }
      function point(who) { sc[who]++; best = Math.max(best, rallyN); msg = { s: who === 0 ? "ポイント！" : "CPUのポイント", c: who === 0 ? "#ffe066" : "#c9d2ec", t: 0 }; if (who === 0) { X.SFX.coin(); g.burst(W / 2, Hh / 2, ["#ffd43b", "#fff"], 18, 200); } else { X.SFX.bad(); g.shake(4); } ball = null; wait = 1.3; serve = 1 - serve;
        if (sc[0] >= TO || sc[1] >= TO) { endT = 0; const win = sc[0] > sc[1]; if (win) { X.SFX.cheer(); g.flash("#fff", 0.4); } } }
      function update(dt) {
        t += dt; if (msg) msg.t += dt;
        me.x = lerp(me.x, clamp(me.tx, cl, cr), Math.min(1, dt * 14));
        if (endT != null) { endT += dt; if (endT > 1.6 && !g.over) { const win = sc[0] > sc[1]; g.end(win, win ? "勝ち！ " + sc[0] + "－" + sc[1] : "CPUの勝ち… " + sc[0] + "－" + sc[1], ["あなた " + sc[0] + "点", "CPU " + sc[1] + "点", "最長ラリー " + best + "回"], false, { v: best, unit: "回ラリー" }); } return; }
        if (t < 3) return;
        if (!ball) { wait -= dt; if (wait <= 0) newBall(); return; }
        const sp = th.shuttle ? 1 - dt * 0.6 : 1; ball.vx *= sp; if (th.shuttle) ball.vy *= sp > 0 ? 1 - dt * 0.15 : 1;
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z = Math.abs(Math.sin(((ball.y - (ball.vy > 0 ? top : bot)) / (bot - top)) * Math.PI)) * (th.beach ? 40 : 18);
        if (ball.x < cl - 30 || ball.x > cr + 30) { point(ball.last === 0 ? 1 : 0); return; }
        // CPUの動き
        const tx = ball.vy < 0 ? ball.x + ball.vx * Math.max(0, (ball.y - cpu.y) / Math.max(60, -ball.vy)) * 0.6 + aimOff : W / 2;
        cpu.x += clamp(tx - cpu.x, -cpuSpd * dt, cpuSpd * dt); cpu.x = clamp(cpu.x, cl, cr);
        const hit = (p, dir) => { const off = (ball.x - p.x) / th.rr; ball.vy = dir * Math.min((cfg.spd || 260) * (1 + rallyN * 0.05), (cfg.spd || 260) * 1.9); ball.vx = off * 190 + rand(-30, 30); ball.last = dir < 0 ? 0 : 1; rallyN++; X.SFX.kick(); g.burst(ball.x, ball.y, th.ball, 6, 100, 0.3, 2); aimOff = rand(-cpuErr, cpuErr) * (1 + rallyN * 0.08); };
        if (ball.vy > 0 && ball.y > me.y - 14 && ball.y < me.y + 10 && Math.abs(ball.x - me.x) < th.rr + 16) { hit(me, -1); g.vib(15); if (rallyN % 5 === 0) g.pop(W / 2, mid + 40, rallyN + "回ラリー！", "#ffe066", 18); }
        else if (ball.vy < 0 && ball.y < cpu.y + 14 && ball.y > cpu.y - 10 && Math.abs(ball.x - cpu.x) < th.rr + 12) hit(cpu, 1);
        if (ball.y > bot + 20) point(1); else if (ball.y < top - 20) point(0);
      }
      function player(p, col, up) { c.save(); c.translate(p.x, p.y); c.fillStyle = "rgba(0,0,0,.2)"; c.beginPath(); c.ellipse(3, 4, 15, 10, 0, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 13, 9, 0, 0, 7); c.fill(); c.fillStyle = "#f8c291"; c.beginPath(); c.arc(0, up ? 2 : -2, 7, 0, 7); c.fill(); c.fillStyle = "#3b2a20"; c.beginPath(); c.arc(0, up ? 4 : -4, 7, 0, Math.PI, up); c.fill();
        if (th.rac) { c.strokeStyle = "#555"; c.lineWidth = 3; c.beginPath(); c.moveTo(12, 0); c.lineTo(20, up ? -8 : 8); c.stroke(); c.fillStyle = th.rac; c.beginPath(); c.ellipse(25, up ? -14 : 14, th.table ? 8 : 9, th.table ? 8 : 11, 0, 0, 7); c.fill(); if (!th.table) { c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 1; c.stroke(); } } c.restore(); }
      function draw(c) {
        c.fillStyle = th.out; c.fillRect(0, 0, W, Hh);
        if (th.beach) { c.fillStyle = "#1c7ed6"; c.fillRect(0, 0, W, 50); c.fillStyle = "#f2d398"; c.fillRect(0, 50, W, Hh); }
        c.fillStyle = th.court; rr(c, cl - 8, top - 8, cr - cl + 16, bot - top + 16, th.table ? 10 : 2); c.fill();
        c.strokeStyle = th.line; c.lineWidth = 3; c.strokeRect(cl, top, cr - cl, bot - top); c.beginPath(); c.moveTo(W / 2, top); c.lineTo(W / 2, bot); c.lineWidth = th.table ? 2 : 2; if (!th.beach) c.stroke();
        if (!th.table && !th.beach) { c.beginPath(); c.moveTo(cl, top + (bot - top) * 0.22); c.lineTo(cr, top + (bot - top) * 0.22); c.moveTo(cl, bot - (bot - top) * 0.22); c.lineTo(cr, bot - (bot - top) * 0.22); c.stroke(); }
        // ネット
        c.fillStyle = "rgba(255,255,255,.85)"; c.fillRect(cl - 14, mid - 3, cr - cl + 28, 6); c.fillStyle = "rgba(0,0,0,.25)"; for (let x = cl - 12; x < cr + 12; x += 6) c.fillRect(x, mid - 3, 1, 6); c.fillStyle = "#495057"; c.fillRect(cl - 18, mid - 6, 6, 12); c.fillRect(cr + 12, mid - 6, 6, 12);
        player(cpu, "#e03131", false); player(me, "#4c6ef5", true);
        if (ball) { c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(ball.x + ball.z * 0.4, ball.y + ball.z * 0.6, 6, 4, 0, 0, 7); c.fill();
          if (th.shuttle) { c.save(); c.translate(ball.x, ball.y - ball.z); c.rotate(ball.vy > 0 ? Math.PI : 0); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-7, 8); c.lineTo(7, 8); c.lineTo(3, -2); c.lineTo(-3, -2); c.fill(); c.fillStyle = "#e03131"; c.beginPath(); c.arc(0, -4, 3.5, 0, 7); c.fill(); c.restore(); }
          else { c.fillStyle = th.ball; c.beginPath(); c.arc(ball.x, ball.y - ball.z, th.beach ? 10 : 6, 0, 7); c.fill(); if (th.beach) { c.strokeStyle = "#1c7ed6"; c.lineWidth = 2; c.beginPath(); c.arc(ball.x, ball.y - ball.z, 10, 0.3, 2.2); c.stroke(); } } }
        K.hud(c, g, "あなた " + sc[0], TO + "点先取", "CPU " + sc[1]);
        if (msg && msg.t < 1.2) txt(c, msg.s, W / 2, mid - 40, 28, msg.c);
        if (t < 6) { c.globalAlpha = Math.min(1, 6 - t); txt(c, "指を左右に動かして打ち返そう", W / 2, bot - 70, 14, "#fff"); c.globalAlpha = 1; }
        K.countdown(g, t, c);
      }
      g.run(update, draw);
    });
  }
  rally({ id: "tennis", e: "🎾", n: "テニス", c: "#1c7ed6", th: "tennis", spd: 270, d: "指を左右に動かしてボールを打ち返す。ラケットのはしで打つと角度がつくよ。5点先取！" });
  rally({ id: "pingpong", e: "🏓", n: "卓球", c: "#0b7285", th: "pingpong", spd: 300, to: 7, d: "スピードの速い卓球。ラリーが続くほどボールが速くなる。7点先取！" });
  rally({ id: "badminton", e: "🏸", n: "バドミントン", c: "#2b8a3e", th: "badminton", spd: 330, d: "シャトルは急にスピードが落ちる！落ちてくるところに先回りしよう。" });
  rally({ id: "beachvolley", e: "🏐", n: "ビーチバレー", c: "#f08c00", th: "beach", spd: 220, d: "砂浜のバレー。高く上がったボールの影を見て、落ちるところで受けよう。" });

  // ===== トップビューのバトル =====
  const AR = {
    space: { bg: "#0b0b2a", tile: "rgba(255,255,255,.04)", ob: "#3b2f63", obE: "#7048e8", bul: "#22d3ee", zone: "rgba(204,93,232,.35)", star: true, unit: "ship" },
    snow: { bg: "#e7f5ff", tile: "rgba(116,192,252,.15)", ob: "#fff", obE: "#a5d8ff", bul: "#fff", bulE: "#74c0fc", zone: "rgba(116,192,252,.35)", unit: "kid" },
    zombie: { bg: "#3d4a2e", tile: "rgba(0,0,0,.12)", ob: "#5c3a1a", obE: "#8d5524", bul: "#ffe066", unit: "kid", zombies: true },
    tank: { bg: "#c9b28a", tile: "rgba(0,0,0,.06)", ob: "#868e96", obE: "#495057", bul: "#343a40", unit: "tank" },
    ninja: { bg: "#2f3e2a", tile: "rgba(255,255,255,.04)", ob: "#2b8a3e", obE: "#40c057", bul: "#ced4da", unit: "ninja" },
    water: { bg: "#99e9f2", tile: "rgba(255,255,255,.2)", ob: "#ffd43b", obE: "#fab005", bul: "#1c7ed6", zone: "rgba(28,126,214,.25)", unit: "kid" },
  };
  function unit(c, kind, col, a, t, r) {
    c.save(); c.fillStyle = "rgba(0,0,0,.22)"; c.beginPath(); c.ellipse(3, 4, r, r * 0.8, 0, 0, 7); c.fill();
    if (kind === "tank") { c.rotate(a); c.fillStyle = "#2b2d42"; rr(c, -16, -14, 32, 6, 2); c.fill(); rr(c, -16, 8, 32, 6, 2); c.fill(); c.fillStyle = col; rr(c, -13, -10, 26, 20, 4); c.fill(); c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.arc(0, 0, 7, 0, 7); c.fill(); c.fillStyle = "#343a40"; c.fillRect(2, -2.5, 18, 5); }
    else if (kind === "ship") { c.rotate(a + Math.PI / 2); c.fillStyle = col; c.beginPath(); c.moveTo(0, -15); c.lineTo(11, 11); c.lineTo(0, 6); c.lineTo(-11, 11); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(0, -2, 3.5, 0, 7); c.fill(); c.fillStyle = "#ff922b"; c.beginPath(); c.moveTo(-4, 9); c.lineTo(0, 15 + Math.sin(t * 40) * 3); c.lineTo(4, 9); c.fill(); }
    else if (kind === "zombie") { c.rotate(a); c.fillStyle = "#5c940d"; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.strokeStyle = "#5c940d"; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(4, -7); c.lineTo(17, -7 + Math.sin(t * 6) * 2); c.moveTo(4, 7); c.lineTo(17, 7 - Math.sin(t * 6) * 2); c.stroke(); c.fillStyle = "#94d82d"; c.beginPath(); c.arc(2, 0, r * 0.62, 0, 7); c.fill(); c.fillStyle = "#e03131"; c.beginPath(); c.arc(6, -3, 1.8, 0, 7); c.arc(6, 3, 1.8, 0, 7); c.fill(); }
    else { c.rotate(a); c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.fillStyle = kind === "ninja" ? "#212529" : "#f8c291"; c.beginPath(); c.arc(1, 0, r * 0.62, 0, 7); c.fill(); if (kind === "ninja") { c.fillStyle = "#f8c291"; c.fillRect(3, -4, 4, 8); c.fillStyle = col; c.fillRect(-r, -2, 5, 4); } c.fillStyle = "#555"; c.fillRect(r - 4, -2.5, 10, 5); }
    c.restore();
  }
  function arena(cfg) {
    add({ id: cfg.id, e: cfg.e, n: cfg.n, c: cfg.c, d: cfg.d, genre: "battle" }, (diff) => {
      const g = X.pro(cfg.id, diff, cfg.n), W = g.W, Hh = g.H, c = g.c, d = g.d, th = AR[cfg.th];
      const top = 52, AW = W, AH = Hh - top; const mode = cfg.mode;
      const obs = []; for (let i = 0; i < (cfg.nob || 7); i++) obs.push({ x: rand(40, W - 40), y: rand(top + 80, Hh - 140), r: rand(16, 28) });
      const me = { x: W / 2, y: Hh - 90, hp: 100, max: 100, a: -Math.PI / 2, cd: 0, team: 0, col: "#4c6ef5", me: true, dash: 0, kills: 0 };
      const N = mode === "survive" ? 0 : cfg.n2 || (mode === "royale" ? 7 : 4);
      const bots = []; const cols = ["#ff6b6b", "#51cf66", "#cc5de8", "#ff922b", "#20c997", "#f06595", "#fab005", "#868e96"];
      const botHp = [50, 70, 90, 110][d], botAcc = [0.35, 0.22, 0.13, 0.07][d], botRate = [1.5, 1.15, 0.9, 0.7][d], botSpd = [55, 70, 85, 100][d];
      const place = () => { for (let k = 0; k < 30; k++) { const x = rand(30, W - 30), y = rand(top + 30, Hh * 0.55); if (Math.hypot(x - me.x, y - me.y) > 200 && !obs.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + 20)) return [x, y]; } return [W / 2, top + 40]; };
      for (let i = 0; i < N; i++) { const [x, y] = place(); bots.push({ x, y, hp: botHp, max: botHp, a: Math.PI / 2, cd: rand(0.5, 2), col: cols[i % cols.length], tx: x, ty: y, think: 0, name: "CPU" + (i + 1) }); }
      let buls = [], t = 0, endT = null, win = false, zone = { x: W / 2, y: (top + Hh) / 2, r: Math.hypot(W, AH), tr: Math.hypot(W, AH) }, items = [], wave = 0, spawnT = 2, survT = cfg.surv || 60;
      const st = X.stick(g, "left", 50); let fireHold = false;
      g.onDown = (o) => { if (!st.take(o)) { fireHold = true; o.fire = true; } }; g.onMove = (o) => { st.move(o); }; g.onUp = (o) => { if (!st.rel(o) && o.fire) fireHold = false; };
      const blocked = (x, y, r) => obs.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r);
      function move(u, dx, dy, r) { const nx = clamp(u.x + dx, r, W - r), ny = clamp(u.y + dy, top + r, Hh - r); if (!blocked(nx, u.y, r)) u.x = nx; if (!blocked(u.x, ny, r)) u.y = ny; }
      function shoot(u, a, team) { const sp = cfg.bspd || 340; buls.push({ x: u.x + Math.cos(a) * 16, y: u.y + Math.sin(a) * 16, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, team, life: cfg.blife || 1.2, bounce: cfg.bounce ? 1 : 0, dmg: cfg.dmg || 20 }); if (team === 0 || Math.random() < 0.3) X.SFX.shoot(); }
      const alive = () => bots.filter((b) => b.hp > 0);
      function hurt(u, dmg, from) { u.hp -= dmg; g.burst(u.x, u.y, th.unit === "kid" && cfg.th === "snow" ? "#fff" : cfg.th === "water" ? "#4dabf7" : "#ff8787", 8, 120); if (u === me) { g.shake(5); g.vib(30); X.SFX.hit(); if (me.hp <= 0 && endT == null) { endT = 0; win = false; X.tone(300, 0.8, "triangle", 0.1, 90); } } else if (u.hp <= 0) { X.SFX.boom(); g.burst(u.x, u.y, ["#ffd43b", "#ff922b", "#fff"], 26, 240); if (from === 0) { me.kills++; g.pop(u.x, u.y - 20, cfg.killW || "たおした！", "#ffe066", 18); } if (Math.random() < 0.5) items.push({ x: u.x, y: u.y, k: "hp", t: 0 }); } }
      function update(dt) {
        t += dt; if (endT != null) { endT += dt; if (endT > 2 && !g.over) { const rank = mode === "royale" ? alive().length + (win ? 1 : 1) : 0; const lines = mode === "survive" ? ["生きのこった時間 " + Math.min(survT, Math.max(0, t - 3 - endT)).toFixed(1) + "秒", "たおした数 " + me.kills] : ["たおした数 " + me.kills, mode === "royale" ? (win ? "最後の1人！" : "順位 " + (alive().length + 1) + "位 / " + (N + 1) + "人") : "のこりHP " + Math.max(0, Math.round(me.hp))]; g.end(win, win ? cfg.winT || "ビクトリー！" : cfg.loseT || "やられた…", lines, false, { v: me.kills, unit: "体" }); } return; }
        if (t < 3) return; const el = t - 3;
        // 自分
        const sp = cfg.mspd || 150; move(me, st.dx * sp * dt, st.dy * sp * dt, 13); if (st.on && (Math.abs(st.dx) + Math.abs(st.dy) > 0.2)) me.a = Math.atan2(st.dy, st.dx);
        me.cd -= dt; const targets = mode === "survive" ? zs : alive(); let near = null, nd = 1e9; for (const b of targets) { const dd = Math.hypot(b.x - me.x, b.y - me.y); if (dd < nd) { nd = dd; near = b; } }
        if (fireHold && me.cd <= 0) { const a = near && nd < 320 ? Math.atan2(near.y - me.y, near.x - me.x) : me.a; me.a = a; shoot(me, a, 0); me.cd = cfg.rate || 0.28; }
        // ボット
        for (const b of alive()) { b.think -= dt; b.cd -= dt;
          let tgt = me, td = Math.hypot(me.x - b.x, me.y - b.y); if (mode === "royale") for (const o of alive()) { if (o === b) continue; const dd = Math.hypot(o.x - b.x, o.y - b.y); if (dd < td * 0.8) { td = dd; tgt = o; } }
          if (b.think <= 0) { b.think = rand(0.6, 1.4); const inZ = Math.hypot(b.x - zone.x, b.y - zone.y) < zone.r - 30; if (!inZ) { b.tx = zone.x + rand(-40, 40); b.ty = zone.y + rand(-40, 40); } else if (td < 140) { const a = Math.atan2(b.y - tgt.y, b.x - tgt.x) + rand(-1, 1); b.tx = b.x + Math.cos(a) * 80; b.ty = b.y + Math.sin(a) * 80; } else { b.tx = tgt.x + rand(-90, 90); b.ty = tgt.y + rand(-90, 90); } }
          const a = Math.atan2(b.ty - b.y, b.tx - b.x), dd = Math.hypot(b.tx - b.x, b.ty - b.y); if (dd > 8) move(b, Math.cos(a) * botSpd * dt, Math.sin(a) * botSpd * dt, 13);
          if (td < 300 && b.cd <= 0) { b.cd = botRate * rand(0.8, 1.3); const lead = 0.12; const aa = Math.atan2(tgt.y + (tgt === me ? st.dy * 150 * lead : 0) - b.y, tgt.x + (tgt === me ? st.dx * 150 * lead : 0) - b.x) + rand(-botAcc, botAcc) * 2; b.a = aa; shoot(b, aa, b); } else b.a = Math.atan2(tgt.y - b.y, tgt.x - b.x); }
        // ゾンビ
        if (mode === "survive") { spawnT -= dt; if (spawnT <= 0) { spawnT = Math.max(0.35, [1.6, 1.3, 1.05, 0.85][d] - el * 0.012); const side = Math.floor(rand(0, 4)); const x = side < 2 ? rand(0, W) : side === 2 ? -10 : W + 10, y = side === 0 ? top - 10 : side === 1 ? Hh + 10 : rand(top, Hh); zs.push({ x, y, hp: 2 + Math.floor(el / 20) + (d > 1 ? 1 : 0), a: 0, sp: rand(38, 55) + d * 8 + el * 0.4 }); }
          for (const z of zs) { const a = Math.atan2(me.y - z.y, me.x - z.x); z.a = a; z.x += Math.cos(a) * z.sp * dt; z.y += Math.sin(a) * z.sp * dt; if (Math.hypot(z.x - me.x, z.y - me.y) < 22) { z.hitT = (z.hitT || 0) - dt; if (z.hitT <= 0) { z.hitT = 0.7; hurt(me, 12 + d * 2); } } }
          if (el >= survT && endT == null) { endT = 0; win = true; X.SFX.cheer(); g.flash("#fff", 0.5); } }
        // たま
        for (const bl of buls) { bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.life -= dt;
          const ob = obs.find((o) => Math.hypot(o.x - bl.x, o.y - bl.y) < o.r + 3); if (ob) { if (bl.bounce > 0) { bl.bounce--; const nx = (bl.x - ob.x) / ob.r, ny = (bl.y - ob.y) / ob.r, dot = bl.vx * nx + bl.vy * ny; bl.vx -= 2 * dot * nx; bl.vy -= 2 * dot * ny; bl.x += nx * 4; bl.y += ny * 4; } else { bl.life = 0; g.burst(bl.x, bl.y, th.bul, 4, 60, 0.25, 2); } }
          if (bl.x < 0 || bl.x > W || bl.y < top || bl.y > Hh) { if (bl.bounce > 0) { bl.bounce--; if (bl.x < 0 || bl.x > W) bl.vx *= -1; else bl.vy *= -1; } else bl.life = 0; }
          if (bl.life <= 0) continue;
          if (bl.team !== 0 && Math.hypot(bl.x - me.x, bl.y - me.y) < 14) { bl.life = 0; hurt(me, bl.dmg * (0.7 + d * 0.1), bl.team); continue; }
          if (mode === "survive") { for (const z of zs) if (bl.team === 0 && Math.hypot(bl.x - z.x, bl.y - z.y) < 15) { bl.life = 0; z.hp--; g.burst(z.x, z.y, "#94d82d", 6, 90); if (z.hp <= 0) { z.dead = true; me.kills++; X.SFX.pop(); g.pop(z.x, z.y - 16, "+1", "#ffe066", 16); } break; } }
          else if (bl.team === 0 || mode === "royale") for (const b of alive()) { if (b === bl.team) continue; if (Math.hypot(bl.x - b.x, bl.y - b.y) < 14) { bl.life = 0; hurt(b, bl.dmg, bl.team === 0 ? 0 : 1); break; } } }
        buls = buls.filter((b) => b.life > 0); if (mode === "survive") zs = zs.filter((z) => !z.dead);
        // せまるゾーン
        if (mode === "royale") { const k = clamp((el - 10) / 70, 0, 1); zone.r = lerp(Math.hypot(W, AH) / 2 + 40, 70, k); for (const u of [me].concat(alive())) if (Math.hypot(u.x - zone.x, u.y - zone.y) > zone.r) { u.zt = (u.zt || 0) - dt; if (u.zt <= 0) { u.zt = 0.5; hurt(u, 5, 1); } } }
        for (const it of items) { it.t += dt; if (Math.hypot(it.x - me.x, it.y - me.y) < 20) { it.dead = true; me.hp = Math.min(me.max, me.hp + 30); X.SFX.coin(); g.pop(me.x, me.y - 24, "+30 HP", "#69db7c", 16); } } items = items.filter((i) => !i.dead && i.t < 12);
        if (mode !== "survive" && endT == null && alive().length === 0) { endT = 0; win = true; X.SFX.cheer(); g.flash("#fff", 0.5); g.burst(me.x, me.y, ["#ffd43b", "#fff", "#ff6b6b"], 50, 300, 1.2); }
      }
      let zs = [];
      function draw(c) {
        c.fillStyle = th.bg; c.fillRect(0, 0, W, Hh); c.fillStyle = th.tile; for (let x = 0; x < W; x += 40) for (let y = top; y < Hh; y += 40) if (((x + y) / 40) % 2 === 0) c.fillRect(x, y, 40, 40);
        if (th.star) { c.fillStyle = "#fff"; for (let i = 0; i < 50; i++) { c.globalAlpha = 0.3 + (i % 3) * 0.2; c.fillRect((i * 67) % W, top + (i * 113) % AH, 2, 2); } c.globalAlpha = 1; }
        for (const o of obs) { c.fillStyle = "rgba(0,0,0,.2)"; c.beginPath(); c.arc(o.x + 4, o.y + 5, o.r, 0, 7); c.fill(); c.fillStyle = th.ob; c.beginPath(); c.arc(o.x, o.y, o.r, 0, 7); c.fill(); c.fillStyle = th.obE; c.beginPath(); c.arc(o.x - o.r * 0.3, o.y - o.r * 0.3, o.r * 0.45, 0, 7); c.fill(); }
        for (const it of items) { c.fillStyle = "#fff"; c.beginPath(); c.arc(it.x, it.y, 11, 0, 7); c.fill(); c.fillStyle = "#e03131"; c.fillRect(it.x - 6, it.y - 2, 12, 4); c.fillRect(it.x - 2, it.y - 6, 4, 12); }
        for (const z of zs) { c.save(); c.translate(z.x, z.y); unit(c, "zombie", "#5c940d", z.a, g.time, 13); c.restore(); }
        for (const b of alive()) { c.save(); c.translate(b.x, b.y); unit(c, th.unit, b.col, b.a, g.time, 13); c.restore(); c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(b.x - 14, b.y - 24, 28, 4); c.fillStyle = "#ff6b6b"; c.fillRect(b.x - 14, b.y - 24, 28 * Math.max(0, b.hp) / b.max, 4); }
        if (me.hp > 0) { c.save(); c.translate(me.x, me.y); unit(c, th.unit, me.col, me.a, g.time, 14); c.restore(); c.strokeStyle = "#ffe066"; c.lineWidth = 2; c.beginPath(); c.arc(me.x, me.y, 19, 0, 7); c.stroke(); }
        for (const b of buls) { c.fillStyle = b.team === 0 ? th.bul : th.bulE || th.bul; c.beginPath(); c.arc(b.x, b.y, cfg.bsize || 4, 0, 7); c.fill(); if (cfg.th === "ninja") { c.save(); c.translate(b.x, b.y); c.rotate(g.time * 20); c.fillStyle = "#adb5bd"; c.fillRect(-6, -1.5, 12, 3); c.fillRect(-1.5, -6, 3, 12); c.restore(); } }
        if (mode === "royale") { c.save(); c.beginPath(); c.rect(0, top, W, AH); c.arc(zone.x, zone.y, zone.r, 0, 7, true); c.fillStyle = th.zone || "rgba(255,80,80,.3)"; c.fill("evenodd"); c.restore(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.setLineDash([8, 6]); c.beginPath(); c.arc(zone.x, zone.y, zone.r, 0, 7); c.stroke(); c.setLineDash([]); }
        st.draw(c);
        c.fillStyle = fireHold ? "rgba(255,224,102,.6)" : "rgba(255,255,255,.25)"; c.beginPath(); c.arc(W - 60, Hh - 70, 40, 0, 7); c.fill(); txt(c, cfg.fireW || "うつ", W - 60, Hh - 70, 15, "#fff");
        // HUD
        c.fillStyle = "rgba(10,14,40,.7)"; c.fillRect(0, 0, W, top); c.fillStyle = "#343a40"; rr(c, 12, 12, 120, 12, 6); c.fill(); c.fillStyle = me.hp > 40 ? "#51cf66" : "#ff6b6b"; rr(c, 12, 12, 120 * Math.max(0, me.hp) / me.max, 12, 6); c.fill(); txt(c, "HP " + Math.max(0, Math.round(me.hp)), 72, 36, 11, "#fff");
        txt(c, mode === "survive" ? "のこり " + Math.max(0, Math.ceil(survT - Math.max(0, t - 3))) + "秒" : mode === "royale" ? "のこり " + (alive().length + (me.hp > 0 ? 1 : 0)) + "人" : "敵 " + alive().length, W / 2, 26, 16, "#ffe066"); txt(c, "⚔ " + me.kills, W - 30, 26, 16, "#fff");
        if (t < 7) { c.globalAlpha = Math.min(1, 7 - t); txt(c, "左でいどう ・ 右を長押しでうつ（自動でねらう）", W / 2, top + 24, 12, "#fff"); c.globalAlpha = 1; }
        K.countdown(g, t, c);
      }
      g.run(update, draw);
    });
  }
  arena({ id: "spaceroyale", e: "🌌", n: "スペースロイヤル", c: "#3b2f63", th: "space", mode: "royale", d: "8機の宇宙船でバトルロイヤル。せまるエリアの中で最後の1機をめざせ！" });
  arena({ id: "snowfight", e: "☃️", n: "雪合戦ロイヤル", c: "#74c0fc", th: "snow", mode: "royale", n2: 6, killW: "命中！", fireW: "投げる", blife: 0.9, bspd: 300, bsize: 6, d: "雪玉を投げ合うバトルロイヤル。雪の山にかくれながら、最後まで残ろう。" });
  arena({ id: "zombie", e: "🧟", n: "ゾンビサバイバル", c: "#5c940d", th: "zombie", mode: "survive", surv: 60, rate: 0.2, d: "四方からせまるゾンビから60秒生きのびろ！たおすほど記録アップ。" });
  arena({ id: "tankbattle", e: "🪖", n: "タンクバトル", c: "#868e96", th: "tank", mode: "duel", n2: 3, bounce: true, rate: 0.6, dmg: 30, blife: 2.2, bspd: 230, bsize: 5, mspd: 110, fireW: "発射", d: "かべではね返る砲弾で、3台の敵戦車をすべてたおせ！" });
  arena({ id: "ninjabattle", e: "🗡️", n: "忍者バトル", c: "#2f3e2a", th: "ninja", mode: "duel", n2: 4, rate: 0.35, bspd: 380, mspd: 175, fireW: "手裏剣", d: "すばやい忍者どうしの手裏剣バトル。4人の敵忍者をたおせ！" });
  arena({ id: "waterfight", e: "🔫", n: "水鉄砲バトル", c: "#15aabf", th: "water", mode: "royale", n2: 5, dmg: 12, rate: 0.12, blife: 0.6, bspd: 360, bsize: 4, killW: "びしょぬれ！", fireW: "発射", d: "水鉄砲でびしょぬれにしたら勝ち。プールサイドのバトルロイヤル！" });

  // ===== 1対1の格闘（横から） =====
  function fight(cfg) {
    add({ id: cfg.id, e: cfg.e, n: cfg.n, c: cfg.c, d: cfg.d, genre: "battle" }, (diff) => {
      const g = X.pro(cfg.id, diff, cfg.n), W = g.W, Hh = g.H, c = g.c, d = g.d;
      const GY = Hh * 0.62; const me = { x: W * 0.34, hp: 100, st: "idle", t: 0, sp: 0, hitT: 0 }, cp = { x: W * 0.66, hp: 100, st: "idle", t: 0, next: 1.5, hitT: 0 };
      const wind = [0.85, 0.65, 0.5, 0.38][d], cpuGuard = [0.2, 0.35, 0.5, 0.62][d], dmg = cfg.dmg || 12;
      let t = 0, endT = null, win = false, combo = 0, msg = null, pts = [0, 0];
      const B = [{ k: "guard", l: cfg.guardW || "ガード", x: 0.17, c: "#4dabf7" }, { k: "atk", l: cfg.atkW || "パンチ", x: 0.5, c: "#ff6b6b" }, { k: "sp", l: "ひっさつ", x: 0.83, c: "#ffd43b" }];
      g.onDown = (o) => { if (t < 3 || endT != null || o.y < Hh - 130) return; const b = B[Math.min(2, Math.floor(o.x / (W / 3)))]; act(b.k); };
      g.onUp = () => { if (me.st === "guard") me.st = "idle"; };
      function act(k) { if (me.st === "atk" || me.st === "hurt" || me.st === "sp") return; if (k === "guard") { me.st = "guard"; me.t = 0; return; } if (k === "sp" && me.sp < 100) { X.SFX.bad(); return; } me.st = k; me.t = 0; if (k === "sp") me.sp = 0; X.SFX.whoosh(); }
      function land(att, def, k) { const isMe = att === me; const blocked = def.st === "guard" || (!isMe ? false : (cp.st === "idle" && Math.random() < cpuGuard));
        if (!isMe && def.st === "guard") { X.tone(900, 0.06, "square", 0.06); g.burst(def.x - 20, GY - 60, "#74c0fc", 8, 120); me.sp = Math.min(100, me.sp + 20); msg = { s: "ガード成功！", c: "#74c0fc", t: 0 }; return; }
        if (isMe && blocked) { cp.st = "guard"; cp.t = 0; X.tone(900, 0.06, "square", 0.06); g.burst(def.x + 20, GY - 60, "#ced4da", 8, 120); msg = { s: "ふせがれた", c: "#ced4da", t: 0 }; combo = 0; return; }
        const counter = isMe && cp.st === "wind"; let dm = k === "sp" ? dmg * 3 : dmg * (counter ? 1.8 : 1) * (isMe ? 1 : (0.8 + d * 0.15));
        def.hp = Math.max(0, def.hp - dm); def.st = "hurt"; def.t = 0; def.hitT = 0.25; X.SFX.hit(); g.shake(k === "sp" ? 14 : 6); g.burst(def.x + (isMe ? -18 : 18), GY - 64, k === "sp" ? ["#ffd43b", "#ff922b", "#fff"] : ["#fff", "#ff8787"], k === "sp" ? 40 : 14, 240);
        if (isMe) { combo++; me.sp = Math.min(100, me.sp + 14); msg = { s: k === "sp" ? cfg.spW || "ひっさつ！" : counter ? "カウンター！" : combo > 2 ? combo + "コンボ！" : cfg.hitW || "ヒット！", c: "#ffe066", t: 0 }; if (k === "sp") g.flash("#fff", 0.6); pts[0]++; } else { combo = 0; g.vib(50); g.flash("#ff6b6b", 0.25); pts[1]++; }
        if (def.hp <= 0 && endT == null) { endT = 0; win = isMe; def.st = "ko"; if (win) { X.SFX.cheer(); g.flash("#fff", 0.6); } else X.tone(260, 0.9, "triangle", 0.1, 90); } }
      function update(dt) {
        t += dt; if (msg) msg.t += dt; me.t += dt; cp.t += dt;
        if (endT != null) { endT += dt; if (endT > 2.2 && !g.over) g.end(win, win ? cfg.winT || "KO勝ち！" : "まけちゃった…", ["のこりHP " + Math.round(me.hp), "当てた回数 " + pts[0], "当てられた回数 " + pts[1]], false, { v: Math.round(me.hp), unit: "HP", winOnly: true }); return; }
        if (t < 3) return;
        if (t - 3 > 60 && endT == null) { endT = 0; win = me.hp > cp.hp; }
        if (me.st === "atk" && me.t > 0.18 && !me.done) { me.done = true; if (Math.abs(cp.x - me.x) < 120) land(me, cp, "atk"); }
        if (me.st === "sp" && me.t > 0.35 && !me.done) { me.done = true; land(me, cp, "sp"); }
        if ((me.st === "atk" && me.t > 0.4) || (me.st === "sp" && me.t > 0.7) || (me.st === "hurt" && me.t > 0.4)) { me.st = "idle"; me.done = false; }
        // CPU
        cp.next -= dt;
        if (cp.st === "idle" && cp.next <= 0) { cp.st = "wind"; cp.t = 0; X.tone(200, 0.1, "sawtooth", 0.04); }
        if (cp.st === "wind" && cp.t > wind) { cp.st = "atk"; cp.t = 0; cp.done = false; X.SFX.whoosh(); }
        if (cp.st === "atk" && cp.t > 0.15 && !cp.done) { cp.done = true; land(cp, me, "atk"); }
        if ((cp.st === "atk" && cp.t > 0.4) || (cp.st === "hurt" && cp.t > 0.45) || (cp.st === "guard" && cp.t > 0.5)) { cp.st = "idle"; cp.next = rand(0.6, 1.6) * (1.2 - d * 0.15); }
        if (me.st === "hurt") me.done = false;
      }
      function fighter(p, col, dir, tint) { const s = p.st, k = s === "atk" ? Math.min(1, p.t / 0.18) : s === "sp" ? Math.min(1, p.t / 0.35) : 0, bob = Math.sin(g.time * 6) * 2;
        c.save(); c.translate(p.x + (s === "hurt" ? -dir * 10 * (1 - p.t * 2) : 0) + (s === "atk" || s === "sp" ? dir * 14 * k : 0), GY); if (s === "ko") c.rotate(-dir * Math.min(1.5, endT * 3));
        c.fillStyle = "rgba(0,0,0,.2)"; c.beginPath(); c.ellipse(0, 2, 30, 6, 0, 0, 7); c.fill();
        c.lineCap = "round"; c.strokeStyle = "#2b2d42"; c.lineWidth = 9; c.beginPath(); c.moveTo(-8, -40); c.lineTo(-14, 0); c.moveTo(8, -40); c.lineTo(14, 0); c.stroke();
        c.fillStyle = col; rr(c, -16, -86 + bob, 32, 48, 12); c.fill(); cfg.body && cfg.body(c, dir, bob);
        c.fillStyle = "#f8c291"; c.beginPath(); c.arc(dir * 2, -100 + bob, 14, 0, 7); c.fill(); cfg.head ? cfg.head(c, dir, bob, col) : (c.fillStyle = "#3b2a20", c.beginPath(), c.arc(0, -106 + bob, 14, Math.PI, 0), c.fill());
        c.fillStyle = "#222"; c.beginPath(); c.arc(dir * 8, -101 + bob, 2, 0, 7); c.fill();
        const reach = s === "atk" || s === "sp" ? 30 + 34 * k : s === "guard" ? 18 : 12, ay = s === "guard" ? -96 : -72;
        cfg.arm(c, dir, reach, ay + bob, s);
        c.restore(); if (s === "guard") { c.strokeStyle = "rgba(116,192,252,.8)"; c.lineWidth = 4; c.beginPath(); c.arc(p.x + dir * 26, GY - 70, 36, -1.2, 1.2); if (dir < 0) { c.beginPath(); c.arc(p.x + dir * 26, GY - 70, 36, Math.PI - 1.2, Math.PI + 1.2); } c.stroke(); }
        if (p === cp && s === "wind") { txt(c, "!", p.x, GY - 140, 34, "#ff6b6b"); } }
      function draw(c) {
        cfg.bg(c, W, Hh, GY, g.time);
        fighter(me, cfg.myCol || "#4c6ef5", 1); fighter(cp, cfg.cpCol || "#e03131", -1);
        const bar = (x, hp, col, right) => { c.fillStyle = "rgba(0,0,0,.5)"; rr(c, x, 54, W / 2 - 24, 14, 7); c.fill(); c.fillStyle = col; const w = (W / 2 - 28) * hp / 100; rr(c, right ? x + 2 + (W / 2 - 28 - w) : x + 2, 56, w, 10, 5); c.fill(); };
        bar(12, me.hp, "#51cf66", false); bar(W / 2 + 12, cp.hp, "#ff6b6b", true);
        c.fillStyle = "rgba(0,0,0,.5)"; rr(c, 12, 72, 100, 8, 4); c.fill(); c.fillStyle = me.sp >= 100 ? "#ffd43b" : "#fab005"; rr(c, 12, 72, me.sp, 8, 4); c.fill();
        K.hud(c, g, "あなた", t > 3 ? Math.max(0, Math.ceil(60 - (t - 3))) + "" : "", "CPU");
        B.forEach((b, i) => { const x = (W / 3) * i + 6, w = W / 3 - 12, y = Hh - 120, dis = b.k === "sp" && me.sp < 100; c.fillStyle = dis ? "rgba(255,255,255,.25)" : b.c; rr(c, x, y, w, 100, 18); c.fill(); txt(c, b.l, x + w / 2, y + 50, 17, dis ? "rgba(255,255,255,.6)" : "#fff"); });
        if (msg && msg.t < 0.9) txt(c, msg.s, W / 2, GY - 170, 26, msg.c);
        if (t < 7 && t > 3) { c.globalAlpha = Math.min(1, 7 - t); txt(c, "「!」が出たら すぐ攻撃でカウンター、またはガード", W / 2, Hh - 140, 12, "#fff"); c.globalAlpha = 1; }
        K.countdown(g, t, c);
      }
      g.run(update, draw);
    });
  }
  fight({ id: "boxing", e: "🥊", n: "ボクシング", c: "#c92a2a", atkW: "パンチ", hitW: "ヒット！", spW: "アッパー！", winT: "KO勝ち！", d: "相手の「!」はパンチの合図。ガードするか、先にパンチでカウンター！ゲージがたまれば必殺アッパー。",
    bg: (c, W, Hh, GY) => { const gr = c.createRadialGradient(W / 2, GY - 200, 20, W / 2, GY - 100, 400); gr.addColorStop(0, "#495057"); gr.addColorStop(1, "#141517"); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.fillStyle = "#1c7ed6"; c.fillRect(0, GY, W, Hh - GY); c.strokeStyle = "#ff6b6b"; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0, GY - 60 - i * 34); c.lineTo(W, GY - 60 - i * 34); c.stroke(); } },
    arm: (c, dir, reach, ay) => { c.strokeStyle = "#f8c291"; c.lineWidth = 7; c.beginPath(); c.moveTo(dir * 6, -78); c.lineTo(dir * reach, ay); c.stroke(); c.fillStyle = "#e03131"; c.beginPath(); c.arc(dir * reach, ay, 10, 0, 7); c.fill(); c.fillStyle = "rgba(255,255,255,.3)"; c.beginPath(); c.arc(dir * reach - 3, ay - 3, 4, 0, 7); c.fill(); } });
  fight({ id: "kendo", e: "⚔️", n: "剣道", c: "#364fc7", atkW: "メン！", hitW: "一本！", spW: "ドウ！", guardW: "受ける", dmg: 34, myCol: "#1b1f3b", cpCol: "#e9ecef", winT: "一本勝ち！", d: "竹刀で一本をとる。相手の「!」に合わせて受けるか、先に打ってカウンター！",
    bg: (c, W, Hh, GY) => { c.fillStyle = "#f3d9a4"; c.fillRect(0, 0, W, Hh); c.fillStyle = "#d9a55b"; for (let x = 0; x < W; x += 30) c.fillRect(x, GY, 2, Hh - GY); c.fillStyle = "#c08552"; c.fillRect(0, GY, W, 3); c.fillStyle = "#8d5524"; c.fillRect(0, 0, W, 40); },
    head: (c, dir, bob, col) => { c.fillStyle = "#1b1f3b"; c.beginPath(); c.arc(dir * 2, -100 + bob, 16, 0, 7); c.fill(); c.strokeStyle = "#adb5bd"; c.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(dir * 6 + i * 3, -112 + bob); c.lineTo(dir * 8 + i * 3, -90 + bob); c.stroke(); } },
    arm: (c, dir, reach, ay, s) => { c.strokeStyle = "#1b1f3b"; c.lineWidth = 7; c.beginPath(); c.moveTo(dir * 6, -76); c.lineTo(dir * 14, -74); c.stroke(); c.save(); c.translate(dir * 14, -74); c.rotate(dir * (s === "atk" || s === "sp" ? -0.2 : s === "guard" ? -1.3 : -0.8)); c.strokeStyle = "#f2c94c"; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(dir * (reach + 30), 0); c.stroke(); c.restore(); } });
  fight({ id: "fencing", e: "🤺", n: "フェンシング", c: "#495057", atkW: "突き", hitW: "トゥシュ！", spW: "フレッシュ！", dmg: 20, myCol: "#f8f9fa", cpCol: "#f8f9fa", winT: "勝利！", d: "すばやい突きでポイントをとる。相手の「!」をよく見て受けるかカウンター。",
    bg: (c, W, Hh, GY) => { c.fillStyle = "#212529"; c.fillRect(0, 0, W, Hh); c.fillStyle = "#495057"; c.fillRect(0, GY - 4, W, 16); c.fillStyle = "#fff"; c.fillRect(W / 2 - 1, GY - 4, 2, 16); for (let i = 0; i < 6; i++) { c.fillStyle = "rgba(255,255,255,.05)"; c.beginPath(); c.arc((i * 77) % W, 80 + (i % 2) * 30, 40, 0, 7); c.fill(); } },
    head: (c, dir, bob) => { c.fillStyle = "#adb5bd"; c.beginPath(); c.arc(dir * 2, -100 + bob, 15, 0, 7); c.fill(); c.fillStyle = "#343a40"; for (let i = 0; i < 4; i++) c.fillRect(dir * 2 - 9 + i * 5, -108 + bob, 2, 16); },
    arm: (c, dir, reach, ay, s) => { c.strokeStyle = "#f8f9fa"; c.lineWidth = 6; c.beginPath(); c.moveTo(dir * 6, -76); c.lineTo(dir * (reach * 0.6), ay); c.stroke(); c.strokeStyle = "#ced4da"; c.lineWidth = 2; c.beginPath(); c.moveTo(dir * reach * 0.6, ay); c.lineTo(dir * (reach * 0.6 + 60), ay - (s === "guard" ? 30 : 4)); c.stroke(); c.fillStyle = "#adb5bd"; c.beginPath(); c.arc(dir * reach * 0.6, ay, 5, 0, 7); c.fill(); } });

  // ===== すもう =====
  add({ id: "sumo", e: "🏟️", n: "おすもう", c: "#a0522d", genre: "battle", d: "交互タップでおしこもう！相手が「!」でつっぱってきたら、ふんばるボタンで受け止めろ。土俵の外に出したら勝ち。" }, (diff) => {
    const g = X.pro("sumo", diff, "おすもう"), W = g.W, Hh = g.H, c = g.c, d = g.d;
    const R = Math.min(W * 0.42, 150), cx = W / 2, cy = Hh * 0.42; let pos = 0, t = 0, last = null, endT = null, win = false, cpu = 0, burst = 0, warn = 0, hold = false, push = 0, taps = 0;
    const rate = [4.2, 5.4, 6.5, 7.6][d];
    g.onDown = (o) => { if (t < 3 || endT != null) return; if (o.y > Hh - 130) { const s = o.x < W / 3 ? "L" : o.x > (W * 2) / 3 ? "R" : "H"; if (s === "H") { hold = true; return; } if (s !== last) { push += 1; last = s; taps++; X.tone(220, 0.05, "square", 0.06); g.shake(1.5); } else push -= 0.4; } };
    g.onUp = () => { hold = false; };
    function update(dt) {
      t += dt; if (endT != null) { endT += dt; if (endT > 2.2 && !g.over) g.end(win, win ? "よりきり！ 勝ち！" : "おし出された…", ["タップ " + taps + "回", "取組 " + K.fmtT(t - 3 - endT) + "秒"], false, { v: Math.round((t - 3 - endT) * 100) / 100, unit: "秒", lower: true, winOnly: true }); return; }
      if (t < 3) return;
      cpu += dt * rate * (1 + Math.sin(t * 1.1) * 0.2);
      warn -= dt; if (warn <= 0 && burst <= 0 && Math.random() < dt * 0.35) { warn = 0.8 - d * 0.1; burst = -1; X.tone(200, 0.1, "sawtooth", 0.05); }
      if (burst === -1 && warn <= 0) { burst = 0.45; X.SFX.whoosh(); }
      let f = push - cpu * 0.98; push = 0; cpu = 0;
      if (burst > 0) { burst -= dt; f -= hold ? 0.5 : 9 * dt * 60 / 60 * 3; if (!hold && Math.random() < 0.2) g.shake(4); }
      pos += f * 1.7; pos = clamp(pos, -R * 1.2, R * 1.2);
      if (Math.abs(pos) > R - 14) { endT = 0; win = pos > 0; g.flash(win ? "#fff" : "#9fb4ff", 0.5); g.shake(10); if (win) { X.SFX.cheer(); g.burst(cx + pos, cy, ["#ffd43b", "#fff", "#ff6b6b"], 40, 260); } else X.tone(280, 0.8, "triangle", 0.1, 100); }
    }
    function draw(c) {
      c.fillStyle = "#3d2b1f"; c.fillRect(0, 0, W, Hh); c.fillStyle = "#c9a26a"; c.fillRect(0, cy - R - 30, W, R * 2 + 60);
      c.fillStyle = "#e0c08a"; c.beginPath(); c.arc(cx, cy, R + 10, 0, 7); c.fill(); c.strokeStyle = "#f8f1e0"; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
      c.fillStyle = "#fff"; c.fillRect(cx - 30, cy - 18, 6, 36); c.fillRect(cx + 24, cy - 18, 6, 36);
      const mx = cx + pos; const lean = clamp(pos / R, -1, 1);
      const rikishi = (x, col, dir, s) => { c.save(); c.translate(x, cy); c.fillStyle = "rgba(0,0,0,.2)"; c.beginPath(); c.ellipse(0, 6, 30, 24, 0, 0, 7); c.fill(); c.fillStyle = "#f3c39b"; c.beginPath(); c.ellipse(0, 0, 26, 30, 0, 0, 7); c.fill(); c.fillStyle = col; c.fillRect(-26, 6, 52, 10); c.fillStyle = "#f3c39b"; c.beginPath(); c.ellipse(dir * 26, -8, 10, 8, 0, 0, 7); c.ellipse(dir * 26, 12, 10, 8, 0, 0, 7); c.fill(); c.fillStyle = "#212529"; c.beginPath(); c.arc(-dir * 4, 0, 13, 0, 7); c.fill(); c.beginPath(); c.arc(-dir * 4, -10, 6, 0, 7); c.fill(); if (s) { c.globalAlpha = 0.6; c.fillStyle = "#fff"; c.beginPath(); c.arc(0, 0, 36, 0, 7); c.fill(); c.globalAlpha = 1; } c.restore(); };
      rikishi(mx - 30, "#4c6ef5", 1, false); rikishi(mx + 30, "#e03131", -1, burst > 0);
      if (burst === -1) txt(c, "!", mx + 30, cy - 50, 40, "#ff6b6b");
      [["◀ 押す", 0, "#ff922b"], ["ふんばる", 1, hold ? "#ffd43b" : "#74c0fc"], ["押す ▶", 2, "#ff922b"]].forEach(([l, i, col]) => { const x = (W / 3) * i + 6, w = W / 3 - 12, y = Hh - 120; c.fillStyle = col; rr(c, x, y, w, 100, 18); c.fill(); txt(c, l, x + w / 2, y + 50, 16, "#fff"); });
      K.hud(c, g, "あなた", lean > 0.4 ? "あと少し！" : lean < -0.4 ? "ピンチ！" : "はっけよい！", "CPU");
      if (t < 7 && t > 3) { c.globalAlpha = Math.min(1, 7 - t); txt(c, "左右の「押す」を交互にタップ", W / 2, Hh - 140, 13, "#fff"); c.globalAlpha = 1; }
      K.countdown(g, t, c);
    }
    g.run(update, draw);
  });
})();
