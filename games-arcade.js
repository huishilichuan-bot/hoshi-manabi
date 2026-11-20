/* ほしまなび — アーケードゲーム（カーレース・バトルロイヤル・シューティング）。すべてオリジナルの名前と絵 */
(() => {
  "use strict";
  const H = window.HMGames, X = window.HMPro, { rr, txt, clamp, lerp, rand } = X;
  const add = (id, e, n, c, d, fn) => H.add({ id, e, n, c, d, pro: true }, fn);

  // ===== カーレース：ターボドリフト =====
  add("racing", "🏎️", "ターボドリフト", "#e8590c", "左右をおしてハンドル。カーブで長くおし続けるとドリフトでブースト。2周で1位をめざそう。CPUがゴールしてから6秒たつと時間切れ。", (diff) => {
    const g = X.pro("racing", diff, "ターボドリフト"), W = g.W, Hh = g.H, c = g.c, d = g.d;
    const segL = 200, roadW = 2000, camH = 1000, camD = 0.84, draw = 160, LAPS = 2;
    const segs = [];
    const addRoad = (n, curve, hill) => { const y0 = segs.length ? segs[segs.length - 1].y2 : 0; for (let i = 0; i < n; i++) { const t = i / n, e = (1 - Math.cos(t * Math.PI)) / 2; segs.push({ i: segs.length, curve: curve * Math.sin(t * Math.PI), y1: 0, y2: y0 + hill * e * 1, spr: null, cars: [] }); } };
    addRoad(60, 0, 0); addRoad(80, 3, 800); addRoad(60, 0, -800); addRoad(90, -4, 0); addRoad(60, 0, 1200); addRoad(70, 5, -600); addRoad(50, -2, -600); addRoad(90, -5, 400); addRoad(70, 3, -400); addRoad(60, 0, 0); addRoad(80, 4, 0); addRoad(60, 0, 0);
    segs.forEach((s, i) => { s.y1 = i ? segs[i - 1].y2 : 0; if (i % 12 === 6) s.spr = { k: i % 36 === 6 ? "sign" : "tree", side: (i / 12) % 2 ? -1.4 : 1.4 }; if (i % 7 === 3 && i % 12 !== 6) s.spr = { k: "tree", side: (i % 14 === 3 ? -1 : 1) * rand(1.6, 2.6) }; });
    const trackLen = segs.length * segL, maxV = 7000;
    const names = ["ブレイズ", "ミント", "ストーム", "ルナ", "ボルト"]; const cols = ["#4dabf7", "#69db7c", "#da77f2", "#ffd43b", "#f8f9fa"];
    const cpus = names.map((n, i) => ({ n, col: cols[i], z: (i + 1) * segL * 6, x: [-0.5, 0.5, 0, -0.3, 0.4][i], v: maxV * ([0.66, 0.76, 0.85, 0.92][d] + i * 0.015 + rand(-0.02, 0.02)), lap: 0 }));
    const P = { x: 0, z: 0, v: 0, lap: 0, drift: 0, boost: 0, meter: 0, steer: 0, bump: 0 }; let start = 3, skyX = 0, finished = false, fin = null, tRace = 0, leadFin = null;
    const tape = X.goalTape(g);
    // スタート／ゴールのゲート（最終ラップだけテープをはる）
    const drawArch = (p1) => { const w = p1.w * 1.25, x0 = p1.x - w, x1 = p1.x + w, h = p1.w * 0.75, pw = Math.max(2, p1.w * 0.05); if (w < 6) return; c.fillStyle = "#dee2e6"; c.fillRect(x0 - pw, p1.y - h, pw, h); c.fillRect(x1, p1.y - h, pw, h); const bh = Math.max(4, h * 0.22); c.fillStyle = "#e03131"; c.fillRect(x0 - pw, p1.y - h - bh, x1 - x0 + pw * 2, bh); const n = 12, cw = (x1 - x0) / n; for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? "#111" : "#fff"; c.fillRect(x0 + i * cw, p1.y - h - bh * 0.25, cw, bh * 0.25); } if (bh > 9) txt(c, P.lap >= LAPS - 1 ? "FINISH" : "START", p1.x, p1.y - h - bh * 0.6, Math.min(30, bh * 0.55), "#fff"); if (P.lap === LAPS - 1 && !tape.broke) { c.strokeStyle = "#ff3b5c"; c.lineWidth = Math.max(1.5, p1.w * 0.03); c.beginPath(); c.moveTo(x0, p1.y - h * 0.32); c.quadraticCurveTo(p1.x, p1.y - h * 0.26 + Math.sin(g.time * 6) * p1.w * 0.01, x1, p1.y - h * 0.32); c.stroke(); } };
    let L = false, R = false; const touches = new Map();
    g.dbg = () => ({ P, cpus, seg: segAt(P.z + 300), place: place(), start }); g.cheat = (k) => { start = 0; P.lap = LAPS - 1; P.z = trackLen - 2200; P.v = maxV * 0.8; cpus.forEach((q) => { q.lap = LAPS - 1; q.z = k === "win" ? trackLen * 0.5 : trackLen - 400; }); };
    const upd = () => { L = R = false; touches.forEach((o) => { if (o.x < W / 2) L = true; else R = true; }); };
    g.onDown = (o) => { touches.set(o.id, o); upd(); }; g.onMove = (o) => { touches.set(o.id, o); upd(); }; g.onUp = (o) => { touches.delete(o.id); upd(); if (P.drift > 0.6 && P.meter > 20) { P.boost = 1.2; P.meter = 0; X.SFX.coin(); g.flash("#ffd43b", 0.25); } P.drift = 0; };
    const segAt = (z) => segs[Math.floor(((z % trackLen) + trackLen) % trackLen / segL) % segs.length];
    const place = () => 1 + cpus.filter((k) => k.lap * trackLen + k.z > P.lap * trackLen + P.z).length;
    g.run((dt) => {
      if (start > 0) { start -= dt; if (Math.floor(start + dt) !== Math.floor(start)) X.SFX.tick(); return; }
      if (finished) {
        // ゴール後：減速しながら走り、ほかの車も走りつづける。演出が終わったら結果へ
        P.v = Math.max(maxV * 0.25, P.v - maxV * 0.6 * dt); P.z += P.v * dt; P.steer = lerp(P.steer, 0, 0.1); P.x = lerp(P.x, 0, dt);
        for (const k of cpus) { k.z += k.v * dt; if (k.z >= trackLen) { k.z -= trackLen; k.lap++; } }
        if (tape.done(2.4) && fin.dnf) { g.end(false, "時間切れ…", ["1位 " + fin.lead + " " + fin.leadT.toFixed(1) + "秒", "ゴールまで あと " + Math.max(1, Math.round((fin.left / (LAPS * trackLen)) * 100)) + "%"], false, { v: 0, unit: "秒", lower: true, winOnly: true }); return; }
        if (tape.done(2.4)) { const pl = fin.pl; g.end(pl === 1, pl === 1 ? "1位でゴール！" : pl + "位でゴール", ["順位 " + pl + "/" + (cpus.length + 1), "タイム " + (Math.round(fin.time * 10) / 10).toFixed(1) + "秒"], false, { v: Math.round(fin.time * 10) / 10, unit: "秒", lower: true, winOnly: true, gap: ["1位まで", "あと " + (pl - 1) + "台"] }); }
        return;
      }
      tRace += dt;
      const sp = P.v / maxV, seg = segAt(P.z + 300);
      const steer = (R ? 1 : 0) - (L ? 1 : 0); P.steer = lerp(P.steer, steer, 0.2);
      const curveAbs = Math.abs(seg.curve);
      if (steer && curveAbs > 1.5 && sp > 0.6 && Math.sign(steer) === Math.sign(seg.curve)) { P.drift += dt; if (P.drift > 0.4) { P.meter = Math.min(100, P.meter + 45 * dt); if (Math.random() < 0.7) g.parts.push({ x: W / 2 + rand(-30, 30), y: Hh - 70, vx: -steer * 120, vy: rand(-40, 0), life: 0.5, max: 0.5, color: "rgba(230,230,230,.8)", size: rand(5, 9) }); } } else if (!steer) P.drift = 0;
      P.x += P.steer * dt * 2.2 * (0.4 + sp) * (P.drift > 0.4 ? 1.25 : 1); P.x -= dt * 2 * sp * seg.curve * 0.22;
      const accel = maxV * (P.boost > 0 ? 0.9 : 0.42); let top = maxV * (P.boost > 0 ? 1.3 : 1); if (Math.abs(P.x) > 1.05) { top = maxV * 0.35; if (Math.random() < 0.4) g.shake(2); }
      P.v = P.v < top ? Math.min(top, P.v + accel * dt) : Math.max(top, P.v - maxV * 1.2 * dt); P.boost = Math.max(0, P.boost - dt);
      P.x = clamp(P.x, -2.2, 2.2); P.z += P.v * dt; if (P.z >= trackLen) { P.z -= trackLen; P.lap++; if (P.lap < LAPS) { g.pop(W / 2, Hh * 0.4, "ファイナルラップ！", "#ffd43b", 26); X.SFX.coin(); } }
      skyX -= seg.curve * sp * dt * 30;
      for (const k of cpus) { const ks = segAt(k.z + 400); k.z += k.v * dt * (1 - Math.abs(ks.curve) * 0.012); k.x = lerp(k.x, clamp(-ks.curve * 0.12 + Math.sin(k.z / 3000 + k.v) * 0.4, -0.8, 0.8), dt); if (k.z >= trackLen) { k.z -= trackLen; k.lap++; }
        const dz = (k.lap * trackLen + k.z) - (P.lap * trackLen + P.z); if (dz > 0 && dz < 260 && Math.abs(k.x - P.x) < 0.35 && P.v > k.v) { P.v = k.v * 0.8; P.x += P.x > k.x ? 0.15 : -0.15; X.SFX.hit(); g.shake(8); g.vib(30); } }
      if (Math.random() < sp * 0.5) X.SFX.engine(sp);
      if (!leadFin) { const k = cpus.find((q) => q.lap >= LAPS); if (k && P.lap < LAPS) { leadFin = { n: k.n, t: tRace }; g.pop(W / 2, Hh * 0.32, k.n + "がゴール！ のこり6秒", "#ffe066", 22); X.SFX.tick(); } }
      if (leadFin && P.lap < LAPS && tRace - leadFin.t >= 6) { finished = true; fin = { dnf: true, lead: leadFin.n, leadT: leadFin.t, left: (LAPS - P.lap) * trackLen - P.z }; tape.cross(W / 2, Hh - 90, false, "時間切れ… " + leadFin.n + "が1位", "時間切れ"); return; }
      if (P.lap >= LAPS) { finished = true; const pl = place(); fin = { pl, time: tRace }; tape.cross(W / 2, Hh - 90, pl === 1, pl === 1 ? "1位！ " + tRace.toFixed(1) + "秒" : pl + "位… 1位まであと少し", pl === 1 ? "GOAL!" : pl + "位でゴール"); }
    }, (c) => {
      const sky = c.createLinearGradient(0, 0, 0, Hh * 0.5); sky.addColorStop(0, "#ff922b"); sky.addColorStop(0.6, "#f783ac"); sky.addColorStop(1, "#845ef7"); c.fillStyle = sky; c.fillRect(0, 0, W, Hh);
      c.fillStyle = "#ffe066"; c.beginPath(); c.arc(W * 0.7 + (skyX * 0.2) % W * 0, Hh * 0.22, 34, 0, 7); c.fill();
      for (const [col, h, sp, amp] of [["#5f3dc4", Hh * 0.42, 0.3, 50], ["#3b2a87", Hh * 0.47, 0.6, 34]]) { c.fillStyle = col; c.beginPath(); c.moveTo(0, Hh); for (let x = 0; x <= W; x += 8) c.lineTo(x, h - Math.abs(Math.sin((x + skyX * sp * 40) / 70)) * amp - Math.sin((x + skyX * sp * 40) / 23) * 8); c.lineTo(W, Hh); c.fill(); }
      const base = segAt(P.z), bi = base.i, pct = (P.z % segL) / segL; let dx = -(base.curve * pct), xAcc = 0, maxY = Hh;
      const camY = camH + lerp(base.y1, base.y2, pct); const proj = [];
      for (let n = 0; n < draw; n++) { const s = segs[(bi + n) % segs.length], loop = bi + n >= segs.length ? trackLen : 0; const z1 = s.i * segL + loop - P.z, z2 = z1 + segL; const pp = (wx, wy, wz) => { const sc = camD / Math.max(1, wz); return { x: W / 2 + sc * (wx - P.x * roadW) * W / 2, y: Hh / 2 - sc * (wy - camY) * Hh / 2, w: sc * roadW * W / 2, sc }; };
        const p1 = pp(xAcc, s.y1, z1), p2 = pp(xAcc + dx, s.y2, z2); xAcc += dx; dx += s.curve; proj.push({ s, p1, p2, clip: maxY });
        if (z1 <= camD || p2.y >= maxY) continue; const alt = Math.floor(s.i / 3) % 2;
        c.fillStyle = alt ? "#2f9e44" : "#37b24d"; c.fillRect(0, p2.y, W, p1.y - p2.y + 1);
        const quad = (x1, y1, w1, x2, y2, w2, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x1 - w1, y1); c.lineTo(x2 - w2, y2); c.lineTo(x2 + w2, y2); c.lineTo(x1 + w1, y1); c.fill(); };
        quad(p1.x, p1.y, p1.w * 1.15, p2.x, p2.y, p2.w * 1.15, alt ? "#f1f3f5" : "#e03131"); quad(p1.x, p1.y, p1.w, p2.x, p2.y, p2.w, alt ? "#495057" : "#525a63");
        if (alt) quad(p1.x, p1.y, p1.w * 0.03, p2.x, p2.y, p2.w * 0.03, "#fff");
        if (s.i < 3) for (let k = -4; k < 4; k++) { c.fillStyle = (k + (s.i % 2)) % 2 ? "#fff" : "#111"; c.fillRect(p1.x + (k * p1.w) / 4, p2.y, p1.w / 4, p1.y - p2.y); }
        maxY = p2.y;
      }
      for (let n = proj.length - 1; n >= 0; n--) { const { s, p1 } = proj[n]; if (p1.sc <= 0 || p1.y > Hh + 50) continue; if (s.i === 0) drawArch(p1); if (s.spr) { const sx = p1.x + p1.w * s.spr.side, sz = p1.w * 0.5; if (s.spr.k === "tree") { c.fillStyle = "#6d4c41"; c.fillRect(sx - sz * 0.08, p1.y - sz * 0.5, sz * 0.16, sz * 0.5); c.fillStyle = "#2b8a3e"; c.beginPath(); c.moveTo(sx, p1.y - sz * 1.6); c.lineTo(sx + sz * 0.45, p1.y - sz * 0.4); c.lineTo(sx - sz * 0.45, p1.y - sz * 0.4); c.fill(); } else { c.fillStyle = "#fab005"; rr(c, sx - sz * 0.5, p1.y - sz * 0.9, sz, sz * 0.5, 4); c.fill(); c.fillStyle = "#212529"; c.font = "900 " + Math.max(6, sz * 0.22) + "px system-ui"; c.textAlign = "center"; c.fillText(s.spr.side > 0 ? "<<<" : ">>>", sx, p1.y - sz * 0.58); c.fillStyle = "#868e96"; c.fillRect(sx - 2, p1.y - sz * 0.4, 4, sz * 0.4); } }
        for (const k of cpus) { if (segAt(k.z) !== s) continue; const dz = k.z - P.z; if (dz < -100) continue; const kx = p1.x + p1.w * k.x, kw = p1.w * 0.32, kh = kw * 0.55; if (kw < 2) continue; c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(kx - kw / 2, p1.y - kh * 0.2, kw, kh * 0.25); c.fillStyle = k.col; rr(c, kx - kw / 2, p1.y - kh, kw, kh * 0.8, Math.max(1, kw * 0.12)); c.fill(); c.fillStyle = "rgba(20,30,50,.85)"; rr(c, kx - kw * 0.32, p1.y - kh * 1.2, kw * 0.64, kh * 0.4, Math.max(1, kw * 0.08)); c.fill(); c.fillStyle = "#ff6b6b"; c.fillRect(kx - kw * 0.45, p1.y - kh * 0.55, kw * 0.18, kh * 0.12); c.fillRect(kx + kw * 0.27, p1.y - kh * 0.55, kw * 0.18, kh * 0.12); if (kw > 30) txt(c, k.n, kx, p1.y - kh * 1.45, 10, "#fff"); }
      }
      // 自分の車
      const cx = W / 2, cy = Hh - 64, tilt = P.steer * (P.drift > 0.4 ? 0.35 : 0.12); c.save(); c.translate(cx, cy); c.rotate(tilt);
      c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(0, 18, 64, 12, 0, 0, 7); c.fill();
      const body = c.createLinearGradient(0, -30, 0, 20); body.addColorStop(0, "#ff8787"); body.addColorStop(1, "#c92a2a"); c.fillStyle = body; rr(c, -58, -18, 116, 36, 12); c.fill();
      c.fillStyle = "#1c1f2b"; rr(c, -36, -40, 72, 26, 10); c.fill(); c.fillStyle = "rgba(160,200,255,.6)"; rr(c, -30, -36, 60, 16, 6); c.fill();
      c.fillStyle = "#111"; c.fillRect(-60, 8, 22, 14); c.fillRect(38, 8, 22, 14); c.fillStyle = P.boost > 0 ? "#ffd43b" : "#ffa8a8"; c.fillRect(-50, -10, 18, 6); c.fillRect(32, -10, 18, 6);
      if (P.boost > 0) { for (const s of [-24, 24]) { c.fillStyle = "rgba(255,180,50," + (0.6 + Math.random() * 0.4) + ")"; c.beginPath(); c.moveTo(s - 7, 18); c.lineTo(s, 18 + rand(20, 40)); c.lineTo(s + 7, 18); c.fill(); } }
      c.restore();
      // 表示
      c.fillStyle = "rgba(0,0,0,.45)"; rr(c, 10, 10, W - 20, 52, 14); c.fill(); const pl = place();
      txt(c, pl + "位", 24, 36, 26, pl === 1 ? "#ffd43b" : "#fff", "left"); txt(c, "LAP " + Math.min(LAPS, P.lap + 1) + "/" + LAPS, W / 2, 26, 14, "#fff"); txt(c, Math.round(P.v / maxV * 240) + " km/h", W / 2, 46, 15, "#fff"); 
      c.fillStyle = "rgba(255,255,255,.2)"; rr(c, W - 110, 28, 90, 12, 6); c.fill(); c.fillStyle = P.meter >= 20 ? "#ffd43b" : "#adb5bd"; rr(c, W - 110, 28, 90 * P.meter / 100, 12, 6); c.fill(); txt(c, "ブースト", W - 65, 20, 10, "#fff");
      if (start > 0) txt(c, start > 0.0 ? String(Math.ceil(start)) : "", W / 2, Hh * 0.4, 70, "#fff");
      else if (start > -0.8 && P.z < 3000) txt(c, "GO!", W / 2, Hh * 0.4, 70, "#69db7c");
      c.globalAlpha = 0.18; c.fillStyle = "#fff"; c.fillRect(0, Hh - 150, W / 2 - 2, 150); c.fillRect(W / 2 + 2, Hh - 150, W / 2 - 2, 150); c.globalAlpha = 0.9; txt(c, "◀", 30, Hh - 30, 24, L ? "#ffd43b" : "#fff"); txt(c, "▶", W - 30, Hh - 30, 24, R ? "#ffd43b" : "#fff"); c.globalAlpha = 1;
    });
  });

  // ===== バトルロイヤル：サバイバル・アイランド =====
  add("royale", "🪂", "サバイバル・アイランド", "#5c7cfa", "島に降りて宝箱から武器を集め、せまる嵐の中で最後の1人をめざす。左でいどう、右でねらって撃つ。", (diff) => {
    const g = X.pro("royale", diff, "サバイバル・アイランド"), W = g.W, Hh = g.H, c = g.c, d = g.d;
    const MAP = 1700, ls = X.stick(g, "left", 50), rs = X.stick(g, "right", 50);
    const WEP = [{ n: "ハンドガン", dmg: 13, rate: 3, spr: 0.05, rng: 420, sp: 950, pel: 1, col: "#adb5bd" }, { n: "アサルト", dmg: 9, rate: 8, spr: 0.09, rng: 480, sp: 1100, pel: 1, col: "#51cf66" }, { n: "ショットガン", dmg: 9, rate: 1.3, spr: 0.32, rng: 240, sp: 900, pel: 6, col: "#339af0" }, { n: "スナイパー", dmg: 62, rate: 0.8, spr: 0.01, rng: 900, sp: 1800, pel: 1, col: "#cc5de8" }];
    const solid = []; for (let i = 0; i < 70; i++) solid.push({ x: rand(60, MAP - 60), y: rand(60, MAP - 60), r: rand(18, 34), k: Math.random() < 0.7 ? "tree" : "rock" });
    const houses = []; for (let i = 0; i < 8; i++) houses.push({ x: rand(100, MAP - 260), y: rand(100, MAP - 220), w: rand(120, 170), h: rand(100, 140) });
    const chests = []; for (let i = 0; i < 46; i++) { const hs = houses[i % houses.length]; chests.push(i < 16 ? { x: hs.x + rand(20, hs.w - 20), y: hs.y + rand(20, hs.h - 20), open: false } : { x: rand(60, MAP - 60), y: rand(60, MAP - 60), open: false }); }
    const BOTN = ["ハヤテ", "ソラ", "コハク", "リク", "ミオ", "カイ", "ナギ", "ツバサ", "ヒカリ", "レン", "ユズ"];
    const mk = (x, y, name, bot) => ({ x, y, hp: 100, sh: 0, w: 0, cd: 0, a: 0, name, bot, alive: true, kills: 0, tgt: null, wand: { x, y }, hurt: 0, think: 0 });
    const me = mk(rand(300, MAP - 300), rand(300, MAP - 300), "あなた", false); const ents = [me]; BOTN.forEach((n) => ents.push(mk(rand(80, MAP - 80), rand(80, MAP - 80), n, true)));
    const zone = { x: rand(500, MAP - 500), y: rand(500, MAP - 500), r: 1300, tr: 1300, phase: 0, t: 25 }; const PH = [[900, 25, 2], [560, 22, 4], [320, 20, 7], [150, 18, 11], [40, 16, 16]]; let zdmg = 1;
    const bullets = [], feed = []; let msg = { s: "島に着地！ 宝箱を探そう", t: 2 };
    g.onDown = (o) => { if (!ls.take(o)) rs.take(o); }; g.onMove = (o) => { ls.move(o) || rs.move(o); }; g.onUp = (o) => { ls.rel(o) || rs.rel(o); };
    const blocked = (x, y, r) => solid.some((s) => Math.hypot(s.x - x, s.y - y) < s.r + r);
    function moveE(e, vx, vy, dt) { const nx = clamp(e.x + vx * dt, 10, MAP - 10), ny = clamp(e.y + vy * dt, 10, MAP - 10); if (!blocked(nx, e.y, 12)) e.x = nx; if (!blocked(e.x, ny, 12)) e.y = ny; }
    function fire(e) { const w = WEP[e.w]; if (e.cd > 0) return; e.cd = 1 / w.rate; const err = e.bot ? [0.32, 0.22, 0.14, 0.08][d] : 0; for (let i = 0; i < w.pel; i++) { const a = e.a + rand(-w.spr, w.spr) + rand(-err, err); bullets.push({ x: e.x + Math.cos(e.a) * 16, y: e.y + Math.sin(e.a) * 16, vx: Math.cos(a) * w.sp, vy: Math.sin(a) * w.sp, life: w.rng / w.sp, dmg: w.dmg, by: e, col: w.col }); } if (!e.bot) { X.SFX.shoot(); } else if (Math.hypot(e.x - me.x, e.y - me.y) < 500) X.tone(700, 0.05, "square", 0.02, 300); }
    function hurt(t, dmg, by) { if (!t.alive) return; let dm = dmg; if (t.sh > 0) { const s = Math.min(t.sh, dm); t.sh -= s; dm -= s; } t.hp -= dm; t.hurt = 0.15; if (by === me) { g.pop(t.x - camX(), t.y - camY() - 20, "" + Math.round(dmg), t.sh > 0 ? "#74c0fc" : "#ffe066", 16); X.SFX.hit(); } if (t === me) { g.flash("#ff0000", 0.18); g.shake(5); g.vib(25); } if (t.hp <= 0) { t.alive = false; if (by) by.kills++; feed.unshift({ s: (by ? by.name : "嵐") + " ▶ " + t.name, t: 4 }); g.burst(t.x - camX(), t.y - camY(), ["#ff6b6b", "#ffd43b", "#fff"], 30, 200, 0.8); if (t !== me && by === me) X.SFX.coin(); chests.push({ x: t.x, y: t.y, open: false, drop: t.w }); } }
    const camX = () => clamp(me.x - W / 2, -40, MAP - W + 40), camY = () => clamp(me.y - Hh / 2, -40, MAP - Hh + 40);
    function loot(e, ch) { ch.open = true; const r = Math.random(); if (ch.drop != null && ch.drop > e.w) { e.w = ch.drop; } else if (r < 0.45) { const tier = Math.min(3, Math.floor(rand(1, 4.2))); if (tier > e.w) e.w = tier; else e.sh = Math.min(100, e.sh + 25); } else if (r < 0.75) e.hp = Math.min(100, e.hp + 40); else e.sh = Math.min(100, e.sh + 50); if (e === me) { X.SFX.coin(); g.pop(W / 2, Hh / 2 - 40, r < 0.45 || ch.drop != null ? WEP[e.w].n + " ゲット" : r < 0.75 ? "回復 +40" : "シールド +50", "#ffe066", 18); } }
    const alive = () => ents.filter((e) => e.alive).length;
    g.run((dt) => {
      if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; } feed.forEach((f) => (f.t -= dt)); while (feed.length && feed[feed.length - 1].t <= 0) feed.pop();
      // 嵐
      zone.t -= dt; if (zone.t <= 0 && zone.phase < PH.length) { const p = PH[zone.phase]; zone.tr = p[0]; zone.t = p[1]; zdmg = p[2]; zone.phase++; msg = { s: "⚠ 嵐がせまってくる！", t: 2 }; X.SFX.whoosh(); const nx = zone.x + rand(-1, 1) * (zone.r - zone.tr) * 0.4, ny = zone.y + rand(-1, 1) * (zone.r - zone.tr) * 0.4; zone.nx = clamp(nx, 100, MAP - 100); zone.ny = clamp(ny, 100, MAP - 100); }
      if (zone.r > zone.tr) { zone.r = Math.max(zone.tr, zone.r - 40 * dt * (1 + zone.phase * 0.4)); if (zone.nx != null) { zone.x = lerp(zone.x, zone.nx, dt * 0.2); zone.y = lerp(zone.y, zone.ny, dt * 0.2); } }
      for (const e of ents) { if (!e.alive) continue; e.cd -= dt; e.hurt -= dt; if (Math.hypot(e.x - zone.x, e.y - zone.y) > zone.r) { e.zt = (e.zt || 0) + dt; if (e.zt > 0.5) { e.zt = 0; hurt(e, zdmg * 0.5, null); } } for (const ch of chests) if (!ch.open && Math.hypot(ch.x - e.x, ch.y - e.y) < 20) loot(e, ch); }
      // 自分
      if (me.alive) { moveE(me, ls.dx * 190, ls.dy * 190, dt); if (rs.on && Math.hypot(rs.dx, rs.dy) > 0.3) { me.a = Math.atan2(rs.dy, rs.dx); fire(me); } else if (ls.on && Math.hypot(ls.dx, ls.dy) > 0.2 && !rs.on) me.a = Math.atan2(ls.dy, ls.dx); }
      // ボット
      for (const e of ents) { if (!e.bot || !e.alive) continue; e.think -= dt; if (e.think <= 0) { e.think = rand(0.3, 0.6); let best = null, bd = 1e9; for (const o of ents) { if (o === e || !o.alive) continue; const dd = Math.hypot(o.x - e.x, o.y - e.y); if (dd < bd) { bd = dd; best = o; } } e.tgt = bd < WEP[e.w].rng * 0.95 + 60 ? best : null; if (!e.tgt) { const outside = Math.hypot(e.x - zone.x, e.y - zone.y) > zone.r * 0.8; if (outside) e.wand = { x: zone.x + rand(-80, 80), y: zone.y + rand(-80, 80) }; else if (Math.hypot(e.wand.x - e.x, e.wand.y - e.y) < 30) { const ch = chests.filter((k) => !k.open).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0]; e.wand = ch && Math.hypot(ch.x - zone.x, ch.y - zone.y) < zone.r ? { x: ch.x, y: ch.y } : { x: zone.x + rand(-zone.r, zone.r) * 0.6, y: zone.y + rand(-zone.r, zone.r) * 0.6 }; } } }
        const spd = 120 + d * 15;
        if (e.tgt && e.tgt.alive) { const t = e.tgt, dd = Math.hypot(t.x - e.x, t.y - e.y), aa = Math.atan2(t.y - e.y, t.x - e.x); e.a = lerp(e.a, aa, 0.25); const side = Math.sin(g.time * 1.7 + e.x) > 0 ? 1 : -1; const want = WEP[e.w].rng * 0.6; moveE(e, Math.cos(aa + side * 1.4) * spd * 0.7 + Math.cos(aa) * (dd - want) * 0.5, Math.sin(aa + side * 1.4) * spd * 0.7 + Math.sin(aa) * (dd - want) * 0.5, dt); if (t !== me || Math.random() < [0.45, 0.65, 0.85, 1][d]) fire(e); }
        else { const aa = Math.atan2(e.wand.y - e.y, e.wand.x - e.x); e.a = aa; moveE(e, Math.cos(aa) * spd, Math.sin(aa) * spd, dt); } }
      // 弾
      for (const b of bullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (blocked(b.x, b.y, 2)) { b.life = 0; continue; } if (houses.some((h) => b.x > h.x && b.x < h.x + h.w && b.y > h.y && b.y < h.y + h.h) && Math.random() < 0.0) b.life = 0; for (const e of ents) { if (!e.alive || e === b.by) continue; if (Math.hypot(e.x - b.x, e.y - b.y) < 14) { hurt(e, b.dmg, b.by); b.life = 0; break; } } }
      for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].life <= 0) bullets.splice(i, 1);
      if (!me.alive) { g.end(false, alive() + 1 + "位", ["たおした数 " + me.kills, "のこり " + alive() + "人"]); return; }
      if (alive() === 1) { g.end(true, "ビクトリー！ 1位", ["たおした数 " + me.kills]); }
    }, (c) => {
      const ox = camX(), oy = camY(); c.fillStyle = "#1864ab"; c.fillRect(0, 0, W, Hh);
      c.save(); c.translate(-ox, -oy);
      c.fillStyle = "#e9d8a6"; rr(c, -30, -30, MAP + 60, MAP + 60, 60); c.fill(); c.fillStyle = "#51a35b"; rr(c, 0, 0, MAP, MAP, 40); c.fill();
      c.fillStyle = "rgba(0,0,0,.06)"; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc((i * 397) % MAP, (i * 571) % MAP, 60 + (i % 5) * 20, 0, 7); c.fill(); }
      for (const h of houses) { c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(h.x + 6, h.y + 8, h.w, h.h); c.fillStyle = "#c9a37a"; c.fillRect(h.x, h.y, h.w, h.h); c.strokeStyle = "#7a5230"; c.lineWidth = 6; c.strokeRect(h.x, h.y, h.w, h.h); c.fillStyle = "rgba(0,0,0,.08)"; for (let k = 0; k < h.h; k += 16) c.fillRect(h.x, h.y + k, h.w, 8); }
      for (const ch of chests) if (!ch.open) { const glow = 0.5 + 0.5 * Math.sin(g.time * 4 + ch.x); c.fillStyle = "rgba(255,212,59," + 0.25 * glow + ")"; c.beginPath(); c.arc(ch.x, ch.y, 20, 0, 7); c.fill(); c.fillStyle = "#b07a2a"; rr(c, ch.x - 10, ch.y - 7, 20, 14, 3); c.fill(); c.fillStyle = "#ffd43b"; c.fillRect(ch.x - 10, ch.y - 2, 20, 3); }
      for (const b of bullets) { c.strokeStyle = b.col; c.lineWidth = 3; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); c.stroke(); }
      for (const e of ents) { if (!e.alive) continue; c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(e.x + 2, e.y + 5, 13, 8, 0, 0, 7); c.fill(); c.save(); c.translate(e.x, e.y); c.rotate(e.a); c.fillStyle = "#343a40"; c.fillRect(6, -3, 18, 6); c.restore(); c.fillStyle = e.hurt > 0 ? "#fff" : e === me ? "#4dabf7" : "#f06595"; c.beginPath(); c.arc(e.x, e.y, 12, 0, 7); c.fill(); c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 2; c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.arc(e.x + Math.cos(e.a) * 5, e.y + Math.sin(e.a) * 5, 3, 0, 7); c.fill(); if (e !== me && Math.hypot(e.x - me.x, e.y - me.y) < 420) { c.fillStyle = "rgba(0,0,0,.5)"; c.fillRect(e.x - 16, e.y - 24, 32, 5); c.fillStyle = "#ff6b6b"; c.fillRect(e.x - 16, e.y - 24, 32 * e.hp / 100, 5); txt(c, e.name, e.x, e.y - 32, 10, "#fff"); } }
      for (const s of solid) { if (s.k === "tree") { c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.arc(s.x + 5, s.y + 7, s.r, 0, 7); c.fill(); const tg = c.createRadialGradient(s.x - s.r * 0.3, s.y - s.r * 0.3, 2, s.x, s.y, s.r); tg.addColorStop(0, "#69db7c"); tg.addColorStop(1, "#2b8a3e"); c.fillStyle = tg; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); } else { c.fillStyle = "#868e96"; c.beginPath(); c.arc(s.x, s.y, s.r * 0.85, 0, 7); c.fill(); c.fillStyle = "#adb5bd"; c.beginPath(); c.arc(s.x - 4, s.y - 4, s.r * 0.5, 0, 7); c.fill(); } }
      // 嵐（円の外をむらさきに）
      c.fillStyle = "rgba(132,94,247,.35)"; c.beginPath(); c.rect(ox - 50, oy - 50, W + 100, Hh + 100); c.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2, true); c.fill("evenodd");
      c.strokeStyle = "rgba(208,191,255,.9)"; c.lineWidth = 4; c.beginPath(); c.arc(zone.x, zone.y, zone.r, 0, 7); c.stroke();
      if (zone.tr < zone.r) { c.setLineDash([10, 10]); c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 2; c.beginPath(); c.arc(zone.nx || zone.x, zone.ny || zone.y, zone.tr, 0, 7); c.stroke(); c.setLineDash([]); }
      c.restore(); g.drawFx(); ls.draw(c); rs.draw(c);
      // HUD
      c.fillStyle = "rgba(0,0,0,.5)"; rr(c, 10, 10, 170, 50, 12); c.fill(); c.fillStyle = "rgba(255,255,255,.15)"; rr(c, 18, 18, 150, 10, 5); c.fill(); c.fillStyle = "#51cf66"; rr(c, 18, 18, 150 * Math.max(0, me.hp) / 100, 10, 5); c.fill(); c.fillStyle = "rgba(255,255,255,.15)"; rr(c, 18, 32, 150, 8, 4); c.fill(); c.fillStyle = "#4dabf7"; rr(c, 18, 32, 150 * me.sh / 100, 8, 4); c.fill(); txt(c, WEP[me.w].n, 20, 50, 11, WEP[me.w].col, "left");
      c.fillStyle = "rgba(0,0,0,.5)"; rr(c, W - 92, 10, 82, 82, 12); c.fill(); const ms = 74 / MAP; c.fillStyle = "#51a35b"; c.fillRect(W - 88, 14, 74, 74); c.strokeStyle = "#d0bfff"; c.lineWidth = 2; c.beginPath(); c.arc(W - 88 + zone.x * ms, 14 + zone.y * ms, Math.max(1, zone.r * ms), 0, 7); c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.arc(W - 88 + me.x * ms, 14 + me.y * ms, 3, 0, 7); c.fill();
      txt(c, "のこり " + alive() + "人  たおした " + me.kills, W / 2 + 10, 76, 13, "#fff"); txt(c, zone.phase < PH.length ? "嵐まで " + Math.max(0, Math.ceil(zone.t)) + "秒" : "最終エリア", W / 2 + 10, 96, 12, "#d0bfff");
      feed.slice(0, 3).forEach((f, i) => txt(c, f.s, 14, 120 + i * 18, 11, "#ffe066", "left"));
      if (Math.hypot(me.x - zone.x, me.y - zone.y) > zone.r) txt(c, "嵐の中！ 安全エリアへ", W / 2, Hh * 0.3, 18, "#ff8787");
      if (msg) txt(c, msg.s, W / 2, Hh * 0.22, 20, "#ffe066");
      if (!ls.on) { c.globalAlpha = 0.35; txt(c, "いどう", W * 0.25, Hh - 30, 13, "#fff"); txt(c, "ねらって撃つ", W * 0.75, Hh - 30, 13, "#fff"); c.globalAlpha = 1; }
    });
    g.noAutoParts = true;
  });

  // ===== シューティング：スターストライカー =====
  add("starfighter", "🚀", "スターストライカー", "#4263eb", "指でドラッグして自機を動かす（弾は自動）。Pアイテムでパワーアップ。最後のボスをたおせば勝ち。", (diff) => {
    const g = X.pro("starfighter", diff, "スターストライカー"), W = g.W, Hh = g.H, c = g.c, d = g.d;
    const me = { x: W / 2, y: Hh - 110, pow: 1, lives: [5, 4, 3, 3][d], inv: 2, cd: 0, shield: 0 }; let drag = null, score = 0, t = 0, boss = null, bossWarn = 0;
    const shots = [], foes = [], ebul = [], items = [], stars = []; for (let i = 0; i < 80; i++) stars.push({ x: rand(0, W), y: rand(0, Hh), z: rand(0.3, 1.5) });
    const bsp = [130, 170, 210, 250][d], dens = [0.6, 0.85, 1.1, 1.35][d];
    g.onDown = (o) => { drag = { o, x0: me.x, y0: me.y }; }; g.onMove = (o) => { if (drag && drag.o === o) { me.x = clamp(drag.x0 + (o.x - o.sx) * 1.3, 16, W - 16); me.y = clamp(drag.y0 + (o.y - o.sy) * 1.3, 80, Hh - 30); } }; g.onUp = (o) => { if (drag && drag.o === o) drag = null; };
    function spawn(kind) { if (kind === "zig") { const x = rand(40, W - 40); for (let i = 0; i < 4; i++) foes.push({ k: "zig", x, y: -30 - i * 40, hp: 2, ph: i, t: 0, r: 13, sc: 100 }); } else if (kind === "dive") foes.push({ k: "dive", x: rand(30, W - 30), y: -20, hp: 3, t: 0, r: 15, sc: 150 }); else if (kind === "tur") foes.push({ k: "tur", x: rand(50, W - 50), y: -30, hp: 8, t: 0, r: 20, sc: 400, cd: 1 }); }
    function eshot(x, y, a, s) { ebul.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s }); }
    function kill(f) { f.dead = true; score += f.sc; X.SFX.boom(); g.shake(f.k === "boss" ? 16 : 4); g.burst(f.x, f.y, ["#ffd43b", "#ff922b", "#fff"], f.k === "boss" ? 80 : 18, f.k === "boss" ? 320 : 200, 0.7); if (Math.random() < 0.18 || f.k === "tur") items.push({ x: f.x, y: f.y, k: Math.random() < 0.7 ? "P" : "S" }); }
    function hitMe() { if (me.inv > 0) return; if (me.shield > 0) { me.shield = 0; me.inv = 1; X.SFX.hit(); return; } me.lives--; me.inv = 2; me.pow = Math.max(1, me.pow - 1); g.flash("#ff0000", 0.3); g.shake(10); g.vib(60); X.SFX.boom(); g.burst(me.x, me.y, ["#74c0fc", "#fff"], 30, 220); if (me.lives <= 0) g.end(false, "ゲームオーバー", ["スコア " + score]); }
    g.run((dt) => {
      t += dt; me.inv -= dt; me.cd -= dt;
      for (const s of stars) { s.y += s.z * 120 * dt; if (s.y > Hh) { s.y = 0; s.x = rand(0, W); } }
      if (me.cd <= 0) { me.cd = 0.11; const p = me.pow; const a = [[0], [-0.06, 0.06], [-0.14, 0, 0.14], [-0.22, -0.08, 0.08, 0.22]][Math.min(3, p - 1)]; a.forEach((k) => shots.push({ x: me.x, y: me.y - 18, vx: Math.sin(k) * 700, vy: -Math.cos(k) * 700 })); if (Math.random() < 0.4) X.SFX.shoot(); }
      if (!boss) { if (Math.random() < dt * 0.9 * dens) spawn("zig"); if (Math.random() < dt * 0.5 * dens) spawn("dive"); if (t > 15 && Math.random() < dt * 0.25 * dens) spawn("tur"); if (t > 50) { boss = { k: "boss", x: W / 2, y: -80, hp: 260 + d * 80, max: 260 + d * 80, t: 0, r: 46, sc: 5000 }; foes.push(boss); bossWarn = 2.5; X.SFX.bad(); } }
      bossWarn -= dt;
      for (const f of foes) { f.t += dt; if (f.k === "zig") { f.y += 120 * dt; f.x += Math.sin(f.t * 3 + f.ph) * 120 * dt; if (Math.random() < dt * 0.25 * dens) eshot(f.x, f.y, Math.atan2(me.y - f.y, me.x - f.x), bsp); } else if (f.k === "dive") { f.y += (f.t < 1 ? 80 : 300) * dt; if (f.t > 1) f.x += clamp(me.x - f.x, -1, 1) * 100 * dt; } else if (f.k === "tur") { f.y += (f.y < 140 ? 70 : 12) * dt; f.cd -= dt; if (f.cd <= 0) { f.cd = 1.4 - d * 0.2; for (let k = -1; k <= 1; k++) eshot(f.x, f.y, Math.atan2(me.y - f.y, me.x - f.x) + k * 0.2, bsp); } } else if (f.k === "boss") { f.y = Math.min(150, f.y + 60 * dt); f.x = W / 2 + Math.sin(f.t * 0.7) * (W / 2 - 70); const ph = f.hp < f.max * 0.5 ? 2 : 1; f.cd = (f.cd || 1) - dt; if (f.cd <= 0 && f.y >= 150) { if (Math.floor(f.t) % 2 === 0) { const n = 10 + d * 3 + (ph - 1) * 6; for (let k = 0; k < n; k++) eshot(f.x, f.y + 20, (k / n) * Math.PI * 2 + f.t, bsp * 0.8); f.cd = 1.1 - ph * 0.2; } else { for (let k = -2; k <= 2; k++) eshot(f.x, f.y + 30, Math.atan2(me.y - f.y, me.x - f.x) + k * 0.12, bsp * 1.2); f.cd = 0.6; } } }
        if (f.y > Hh + 60) f.dead = true; if (!f.dead && Math.hypot(f.x - me.x, f.y - me.y) < f.r + 8) { hitMe(); if (f.k !== "boss") kill(f); } }
      for (const s of shots) { s.x += s.vx * dt; s.y += s.vy * dt; for (const f of foes) { if (f.dead) continue; if (Math.abs(f.x - s.x) < f.r && Math.abs(f.y - s.y) < f.r) { s.dead = true; f.hp--; f.flash = 0.06; if (f.hp <= 0) { kill(f); if (f === boss) g.later(() => g.end(true, "ボス撃破！", ["スコア " + score]), 1200); } break; } } }
      for (const b of ebul) { b.x += b.vx * dt; b.y += b.vy * dt; if (Math.hypot(b.x - me.x, b.y - me.y) < 7) { b.dead = true; hitMe(); } }
      for (const it of items) { it.y += 90 * dt; if (Math.hypot(it.x - me.x, it.y - me.y) < 22) { it.dead = true; X.SFX.coin(); if (it.k === "P") { me.pow = Math.min(4, me.pow + 1); g.pop(me.x, me.y - 30, "パワーアップ！", "#ffd43b", 16); } else { me.shield = 1; g.pop(me.x, me.y - 30, "シールド！", "#74c0fc", 16); } } }
      const keep = (a) => { for (let i = a.length - 1; i >= 0; i--) { const o = a[i]; if (o.dead || o.y < -60 || o.y > Hh + 60 || o.x < -60 || o.x > W + 60) a.splice(i, 1); } };
      keep(shots); keep(ebul); keep(items); for (let i = foes.length - 1; i >= 0; i--) if (foes[i].dead) foes.splice(i, 1);
      foes.forEach((f) => (f.flash = Math.max(0, (f.flash || 0) - dt)));
    }, (c) => {
      const bg = c.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, "#0b0b2b"); bg.addColorStop(1, "#24124a"); c.fillStyle = bg; c.fillRect(0, 0, W, Hh);
      const neb = c.createRadialGradient(W * 0.3, (t * 20) % (Hh * 2) - Hh * 0.5, 10, W * 0.3, (t * 20) % (Hh * 2) - Hh * 0.5, 260); neb.addColorStop(0, "rgba(204,93,232,.25)"); neb.addColorStop(1, "rgba(204,93,232,0)"); c.fillStyle = neb; c.fillRect(0, 0, W, Hh);
      for (const s of stars) { c.fillStyle = "rgba(255,255,255," + s.z / 1.6 + ")"; c.fillRect(s.x, s.y, s.z * 1.6, s.z * 1.6 + s.z * 2); }
      for (const it of items) { c.fillStyle = it.k === "P" ? "#ffd43b" : "#74c0fc"; c.beginPath(); c.arc(it.x, it.y, 11, 0, 7); c.fill(); txt(c, it.k, it.x, it.y + 1, 12, "#1b1b3a", "center", 900, null); }
      for (const f of foes) { c.save(); c.translate(f.x, f.y); const fl = f.flash > 0; if (f.k === "boss") { const bgd = c.createLinearGradient(0, -40, 0, 40); bgd.addColorStop(0, fl ? "#fff" : "#e64980"); bgd.addColorStop(1, fl ? "#fff" : "#862e9c"); c.fillStyle = bgd; c.beginPath(); c.moveTo(0, 46); c.lineTo(60, 0); c.lineTo(40, -36); c.lineTo(-40, -36); c.lineTo(-60, 0); c.closePath(); c.fill(); c.fillStyle = "#ffd43b"; c.beginPath(); c.arc(0, 4, 12 + Math.sin(t * 8) * 2, 0, 7); c.fill(); } else { c.fillStyle = fl ? "#fff" : f.k === "zig" ? "#ff6b6b" : f.k === "dive" ? "#fcc419" : "#20c997"; c.beginPath(); if (f.k === "tur") { rr(c, -f.r, -f.r * 0.7, f.r * 2, f.r * 1.4, 6); } else { c.moveTo(0, f.r); c.lineTo(f.r, -f.r * 0.6); c.lineTo(0, -f.r * 0.2); c.lineTo(-f.r, -f.r * 0.6); c.closePath(); } c.fill(); c.fillStyle = "rgba(255,255,255,.7)"; c.beginPath(); c.arc(0, 0, 3.5, 0, 7); c.fill(); } c.restore(); }
      c.fillStyle = "#ffe066"; for (const s of shots) { c.fillRect(s.x - 2, s.y - 8, 4, 12); }
      for (const b of ebul) { c.fillStyle = "#ff8787"; c.beginPath(); c.arc(b.x, b.y, 5, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(b.x, b.y, 2, 0, 7); c.fill(); }
      if (me.lives > 0 && (me.inv <= 0 || Math.floor(me.inv * 12) % 2 === 0)) { c.save(); c.translate(me.x, me.y); c.fillStyle = "rgba(116,192,252," + (0.5 + Math.random() * 0.5) + ")"; c.beginPath(); c.moveTo(-6, 16); c.lineTo(0, 30 + Math.random() * 10); c.lineTo(6, 16); c.fill(); const sg = c.createLinearGradient(0, -20, 0, 16); sg.addColorStop(0, "#e7f5ff"); sg.addColorStop(1, "#4dabf7"); c.fillStyle = sg; c.beginPath(); c.moveTo(0, -22); c.lineTo(16, 14); c.lineTo(0, 8); c.lineTo(-16, 14); c.closePath(); c.fill(); c.fillStyle = "#1c7ed6"; c.beginPath(); c.arc(0, -4, 4, 0, 7); c.fill(); if (me.shield) { c.strokeStyle = "rgba(116,192,252,.8)"; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 24, 0, 7); c.stroke(); } c.restore(); }
      txt(c, "SCORE " + score, 14, 24, 15, "#fff", "left"); txt(c, "❤".repeat(Math.max(0, me.lives)), W - 14, 24, 15, "#ff6b6b", "right"); txt(c, "POWER " + me.pow, 14, 46, 12, "#ffd43b", "left");
      if (boss && !boss.dead) { c.fillStyle = "rgba(255,255,255,.2)"; rr(c, 40, 60, W - 80, 10, 5); c.fill(); c.fillStyle = "#e64980"; rr(c, 40, 60, (W - 80) * boss.hp / boss.max, 10, 5); c.fill(); }
      if (bossWarn > 0 && Math.floor(bossWarn * 4) % 2 === 0) txt(c, "⚠ WARNING ⚠  ボス接近", W / 2, Hh * 0.4, 24, "#ff6b6b");
      if (t < 2.5) txt(c, "ドラッグで移動・弾は自動", W / 2, Hh * 0.55, 16, "#fff");
    });
  });
})();
