/* ほしまなび — スポーツゲーム（野球・ゴルフ・サッカー・ボウリング・バスケ）。すべてオリジナル */
(() => {
  "use strict";
  const H = window.HMGames, X = window.HMPro, { rr, txt, clamp, lerp, rand } = X;
  const add = (id, e, n, c, d, fn) => H.add({ id, e, n, c, d, pro: true }, fn);

  // ===== 野球：ホームランバッター =====
  add("baseball", "⚾", "ホームランバッター", "#2e8b57", "ピッチャーの球をタイミングよくタップして打ち返す。10球でCPUより多く点をとれば勝ち。", (diff) => {
    const g = X.pro("baseball", diff, "ホームランバッター"), { W } = g, Hh = g.H, c = g.c, d = g.d;
    const moundY = Hh * 0.42, plateY = Hh * 0.84, cx = W / 2;
    const cpu = [4, 7, 10, 13][d] + Math.floor(rand(0, 3)); let pts = 0, left = 10, state = "wait", t = 0, ball = null, swing = -1, msg = null, fly = null, combo = 0;
    const TYPES = [["ストレート", 1, 0], ["チェンジアップ", 1.35, 0], ["カーブ", 1.15, 1], ["スライダー", 1.05, -1]];
    const baseT = [1.15, 0.95, 0.8, 0.66][d];
    function pitch() { const ty = TYPES[Math.floor(rand(0, d === 0 ? 2 : 4))]; ball = { z: 0, T: baseT * ty[1], curve: ty[2] * rand(18, 34), endX: rand(-26, 26), name: ty[0], kmh: Math.round((150 - (ty[1] - 1) * 60) - (3 - d) * 8 + rand(-3, 3)) }; state = "pitch"; t = 0; X.SFX.whoosh(); }
    const bpos = (z) => { const e = Math.pow(z, 1.25); return { x: cx + ball.curve * Math.sin(z * Math.PI) * (1 - z) * 2 + ball.endX * e, y: lerp(moundY - 30, plateY - 34, e), r: lerp(3, 15, e) }; };
    g.onDown = (o) => { if (state !== "pitch" || swing >= 0) return; swing = 0; X.SFX.whoosh(); const err = ball.z - 0.95, bp = bpos(Math.min(1, ball.z)), dx = Math.abs(o.x - bp.x); let q = Math.abs(err) + Math.max(0, dx - 34) / 900; let r;
      if (ball.z < 0.7 || ball.z > 1.08) r = "miss"; else if (q < 0.03) r = "hr"; else if (q < 0.055) r = "two"; else if (q < 0.085) r = "hit"; else if (q < 0.12) r = "foul"; else r = "miss";
      if (r === "miss") return; const pull = clamp(-err * 9, -1, 1); state = "fly"; X.SFX.bat(); g.vib(25); g.shake(r === "hr" ? 10 : 5); g.burst(bp.x, bp.y, ["#fff", "#ffe066"], 18, 260);
      fly = { r, t: 0, x0: bp.x, y0: bp.y, dirX: r === "foul" ? (pull >= 0 ? -1 : 1) * rand(0.9, 1.3) : pull * 0.7, dist: r === "hr" ? 1.25 : r === "two" ? 0.85 : r === "hit" ? 0.6 : 0.7, T: r === "hr" ? 2.2 : 1.4 }; };
    function result(r) { const v = { hr: 4, two: 2, hit: 1, foul: 0, miss: 0 }[r]; pts += v; combo = v ? combo + 1 : 0; const L = { hr: ["ホームラン！", "#ffd43b"], two: ["ツーベース！", "#74c0fc"], hit: ["ヒット！", "#8ce99a"], foul: ["ファウル", "#ced4da"], miss: ["空ぶり…", "#ff8787"] }[r]; msg = { s: L[0], c: L[1], t: 1.2, v }; if (r === "hr") { X.SFX.cheer(); g.flash("#fff", 0.6); for (let i = 0; i < 5; i++) g.later(() => g.burst(rand(40, W - 40), rand(60, Hh * 0.3), ["#ff6b6b", "#ffd43b", "#74c0fc", "#b197fc"], 30, 220, 1.1, 3), i * 180); } else if (v) X.SFX.coin(); left--; state = "result"; t = 0; }
    g.run((dt) => {
      t += dt; if (msg) msg.t -= dt;
      if (swing >= 0) { swing += dt; if (swing > 0.28) swing = -1; }
      if (state === "wait" && t > 1.0) pitch();
      else if (state === "pitch") { ball.z += dt / ball.T; if (ball.z > 1.15) { result("miss"); X.SFX.bad(); } }
      else if (state === "fly") { fly.t += dt; if (fly.t > fly.T) result(fly.r); }
      else if (state === "result" && t > 1.3) { if (left <= 0) { g.end(pts > cpu, pts > cpu ? "勝ち！" : pts === cpu ? "引き分け" : "CPUの勝ち", ["あなた " + pts + "点", "CPU " + cpu + "点"], pts === cpu); state = "end"; } else { state = "wait"; t = 0; ball = null; fly = null; } }
    }, (c) => {
      const sky = c.createLinearGradient(0, 0, 0, Hh * 0.3); sky.addColorStop(0, "#0b1f4a"); sky.addColorStop(1, "#2d5ea8"); c.fillStyle = sky; c.fillRect(0, 0, W, Hh * 0.3);
      for (let i = 0; i < 4; i++) { c.fillStyle = "rgba(255,255,220," + (0.5 + 0.3 * Math.sin(g.time * 3 + i)) + ")"; c.beginPath(); c.arc(30 + i * (W - 60) / 3, 26, 7, 0, 7); c.fill(); }
      c.fillStyle = "#1c2b45"; c.fillRect(0, Hh * 0.2, W, Hh * 0.1); for (let i = 0; i < 60; i++) { c.fillStyle = ["#e64980", "#fab005", "#4dabf7", "#f1f3f5"][i % 4]; c.fillRect((i * 37) % W, Hh * 0.21 + ((i * 13) % 20) + Math.sin(g.time * 6 + i) * (msg && msg.v >= 4 ? 3 : 0.6), 4, 5); }
      c.fillStyle = "#2f9e44"; c.fillRect(0, Hh * 0.3, W, Hh * 0.7); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.05)"; c.fillRect(0, Hh * 0.3 + i * Hh * 0.0875, W, Hh * 0.0875); }
      c.fillStyle = "#c08a55"; c.beginPath(); c.moveTo(cx, moundY - 50); c.lineTo(W * 0.95, Hh * 0.7); c.lineTo(cx, Hh * 0.98); c.lineTo(W * 0.05, Hh * 0.7); c.closePath(); c.fill();
      c.fillStyle = "#3a9e4f"; c.beginPath(); c.moveTo(cx, moundY + 10); c.lineTo(W * 0.78, Hh * 0.68); c.lineTo(cx, Hh * 0.8); c.lineTo(W * 0.22, Hh * 0.68); c.closePath(); c.fill();
      c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, plateY + 6); c.lineTo(-20, Hh * 0.45); c.moveTo(cx, plateY + 6); c.lineTo(W + 20, Hh * 0.45); c.stroke();
      c.fillStyle = "#d9a066"; c.beginPath(); c.ellipse(cx, moundY + 4, 30, 9, 0, 0, 7); c.fill();
      // ピッチャー
      const arm = state === "pitch" && ball.z < 0.15 ? -1 : state === "wait" ? Math.sin(t * 4) * 0.3 : 0.6;
      c.fillStyle = "#e9ecef"; rr(c, cx - 9, moundY - 40, 18, 28, 6); c.fill(); c.fillStyle = "#f4c7a1"; c.beginPath(); c.arc(cx, moundY - 47, 7, 0, 7); c.fill(); c.fillStyle = "#c92a2a"; c.fillRect(cx - 8, moundY - 55, 16, 5);
      c.strokeStyle = "#e9ecef"; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(cx + 7, moundY - 34); c.lineTo(cx + 7 + Math.cos(arm) * 14, moundY - 34 + Math.sin(arm) * 14); c.stroke();
      // ホームベースとストライクゾーン
      c.fillStyle = "#fff"; c.beginPath(); c.moveTo(cx - 16, plateY); c.lineTo(cx + 16, plateY); c.lineTo(cx + 16, plateY + 7); c.lineTo(cx, plateY + 14); c.lineTo(cx - 16, plateY + 7); c.closePath(); c.fill();
      c.strokeStyle = "rgba(255,255,255,.25)"; c.setLineDash([5, 5]); c.strokeRect(cx - 40, plateY - 80, 80, 70); c.setLineDash([]);
      // ボール
      if (ball && state === "pitch") { const p = bpos(ball.z); c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(p.x, lerp(moundY, plateY, Math.pow(ball.z, 1.25)) + 4, p.r, p.r * 0.35, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); c.strokeStyle = "#e03131"; c.lineWidth = Math.max(1, p.r / 7); c.beginPath(); c.arc(p.x - p.r * 0.6, p.y, p.r * 0.7, -0.9, 0.9); c.stroke(); c.beginPath(); c.arc(p.x + p.r * 0.6, p.y, p.r * 0.7, Math.PI - 0.9, Math.PI + 0.9); c.stroke(); }
      if (fly) { const k = clamp(fly.t / fly.T, 0, 1), y = lerp(fly.y0, Hh * (0.3 - (fly.dist - 0.6) * 0.5), k) - Math.sin(k * Math.PI) * 120 * fly.dist, x = fly.x0 + fly.dirX * W * 0.5 * k, r = lerp(12, 3, k); c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); if (Math.random() < 0.6) g.parts.push({ x, y, vx: 0, vy: 0, life: 0.35, max: 0.35, color: fly.r === "hr" ? "#ffd43b" : "#fff", size: r * 0.6 }); }
      // バッター
      const bx = cx - 46, by = plateY - 30; c.fillStyle = "#1864ab"; rr(c, bx - 12, by - 6, 24, 40, 8); c.fill(); c.fillStyle = "#f4c7a1"; c.beginPath(); c.arc(bx, by - 14, 10, 0, 7); c.fill(); c.fillStyle = "#1864ab"; c.beginPath(); c.arc(bx, by - 17, 10, Math.PI, 0); c.fill();
      const sw = swing >= 0 ? clamp(swing / 0.16, 0, 1) : 0, ang = lerp(-2.3, 0.5, sw); c.save(); c.translate(bx + 8, by + 4); c.rotate(ang); c.fillStyle = "#c48b4f"; rr(c, 0, -4, 64, 8, 4); c.fill(); c.restore();
      // 表示
      c.fillStyle = "rgba(0,0,0,.45)"; rr(c, 10, 10, W - 20, 46, 14); c.fill();
      txt(c, "あなた " + pts, 24, 33, 18, "#74c0fc", "left"); txt(c, "CPU " + cpu, W - 24, 33, 18, "#ff8787", "right"); txt(c, "のこり " + left + "球", W / 2, 33, 15, "#fff");
      if (ball && state === "pitch") txt(c, ball.name + "  " + ball.kmh + "km/h", W / 2, 76, 14, "#fff");
      if (state === "wait" && left === 10) txt(c, "ボールがベースに来たらタップ！", W / 2, Hh * 0.62, 18, "#fff");
      if (msg && msg.t > 0) { const s = 1 + Math.max(0, msg.t - 1) * 3; txt(c, msg.s, W / 2, Hh * 0.55, 40 * s, msg.c); if (msg.v) txt(c, "+" + msg.v + "点", W / 2, Hh * 0.55 + 44, 22, "#fff"); }
    });
  });

  // ===== ゴルフ：グリーンマスター =====
  add("golf", "⛳", "グリーンマスター", "#40c057", "うしろに引っぱってはなすとショット。3ホールの合計打数でCPUより少なければ勝ち。1ホールは最大パー＋3打・22秒まで。", (diff) => {
    const g = X.pro("golf", diff, "グリーンマスター"), W = g.W, Hh = g.H, c = g.c, d = g.d;
    const HOLES = [
      { par: 2, start: [0.5, 0.88], hole: [0.5, 0.16], walls: [[0.2, 0.45, 0.25, 0.04], [0.55, 0.45, 0.25, 0.04]], sand: [[0.5, 0.3, 0.12]], water: [], mill: null },
      { par: 3, start: [0.2, 0.88], hole: [0.78, 0.15], walls: [[0, 0.5, 0.62, 0.04], [0.4, 0.22, 0.04, 0.28]], sand: [[0.8, 0.62, 0.1]], water: [[0.25, 0.3, 0.1]], mill: null },
      { par: 3, start: [0.5, 0.9], hole: [0.5, 0.14], walls: [[0.1, 0.62, 0.3, 0.035], [0.6, 0.62, 0.3, 0.035]], sand: [[0.22, 0.25, 0.09], [0.78, 0.25, 0.09]], water: [[0.5, 0.75, 0.08]], mill: [0.5, 0.42, 0.18] },
    ];
    const top = 64, fh = Hh - top - 10, fx = 10, fw = W - 20, P = (v) => [fx + v[0] * fw, top + v[1] * fh];
    const cpuStrokes = HOLES.map((h) => Math.max(1, h.par + [2, 1, 0, 0][d] + (Math.random() < 0.35 ? 1 : 0) - (d >= 2 && Math.random() < [0, 0, 0.2, 0.4][d] ? 1 : 0)));
    let hi = 0, strokes = [0, 0, 0], ball, last, aim = null, msg = null, sink = 0, trail = [], holeT = 0, over = 0, fin = false;
    const MAXT = 22, maxS = (h) => h.par + 3, tape = X.goalTape(g);
    function setup() { holeT = 0; const h = HOLES[hi]; const s = P(h.start); ball = { x: s[0], y: s[1], vx: 0, vy: 0, r: 7, z: 1 }; last = { x: ball.x, y: ball.y }; msg = { s: "ホール " + (hi + 1) + "（パー" + h.par + "）", t: 1.6 }; }
    setup();
    const moving = () => Math.hypot(ball.vx, ball.vy) > 4;
    g.onDown = (o) => { if (moving() || sink || over || fin || g.over) return; aim = o; };
    g.dbg = () => ({ ball, hole: P(HH().hole), hi, strokes, moving: moving() });
    g.onUp = (o) => { if (!aim || o !== aim) return; const dx = aim.sx - o.x, dy = aim.sy - o.y, m = Math.hypot(dx, dy); aim = null; if (m < 12) return; const pw = Math.min(m, 170) / 170; ball.vx = (dx / m) * pw * 900; ball.vy = (dy / m) * pw * 900; strokes[hi]++; last = { x: ball.x, y: ball.y }; X.SFX.kick(); g.vib(15); };
    const HH = () => HOLES[Math.min(hi, 2)];
    const rects = () => HH().walls.map((w) => [fx + w[0] * fw, top + w[1] * fh, w[2] * fw, w[3] * fh]);
    const circ = (a) => a.map((s) => [fx + s[0] * fw, top + s[1] * fh, s[2] * fw]);
    function collideRect(r) { const nx = clamp(ball.x, r[0], r[0] + r[2]), ny = clamp(ball.y, r[1], r[1] + r[3]); const dx = ball.x - nx, dy = ball.y - ny, dd = Math.hypot(dx, dy); if (dd < ball.r && dd > 0) { const ux = dx / dd, uy = dy / dd, dot = ball.vx * ux + ball.vy * uy; if (dot < 0) { ball.vx -= 1.6 * dot * ux; ball.vy -= 1.6 * dot * uy; X.SFX.tick(); } ball.x = nx + ux * ball.r; ball.y = ny + uy * ball.r; } }
    g.run((dt) => {
      if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
      const h = HH(), hp = P(h.hole);
      if (fin) { if (tape.done(2.6) && !g.over) { const me = strokes.reduce((a, b) => a + b, 0), cp = cpuStrokes.reduce((a, b) => a + b, 0); g.end(me < cp, me < cp ? "勝ち！ CPUより少ない打数！" : me === cp ? "引き分け…あと1打だった" : "CPUの勝ち…", ["あなた " + me + "打", "CPU " + cp + "打", "ホールごと " + strokes.join("・") + "打"], me === cp, { v: me, unit: "打", lower: true }); } return; }
      const nextHole = () => { hi++; if (hi >= 3) { fin = true; const me = strokes.reduce((a, b) => a + b, 0), cp = cpuStrokes.reduce((a, b) => a + b, 0); tape.cross(W / 2, top + fh * 0.5, me < cp, "あなた " + me + "打 ／ CPU " + cp + "打", me < cp ? "ホールアウト！" : me === cp ? "引き分け" : "CPUの勝ち"); return; } setup(); };
      if (sink) { sink -= dt; ball.z = Math.max(0, sink / 0.6); if (sink <= 0) { sink = 0; nextHole(); } return; }
      if (over) { over -= dt; if (over <= 0) { over = 0; nextHole(); } return; }
      holeT += dt;
      if (!moving() && !aim && (strokes[hi] >= maxS(HH()) || holeT >= MAXT)) { strokes[hi] = maxS(HH()); over = 1.4; msg = { s: holeT >= MAXT ? "時間切れ（" + maxS(HH()) + "打）" : "打数オーバー（" + maxS(HH()) + "打）", t: 1.4 }; X.SFX.bad(); return; }
      const steps = 4; for (let k = 0; k < steps; k++) {
        const sdt = dt / steps; ball.x += ball.vx * sdt; ball.y += ball.vy * sdt;
        let fr = 0.42; for (const s of circ(h.sand)) if (Math.hypot(ball.x - s[0], ball.y - s[1]) < s[2]) fr = 0.12;
        const f = Math.pow(fr, sdt); ball.vx *= f; ball.vy *= f; const sp = Math.hypot(ball.vx, ball.vy); if (sp < 6) { ball.vx = ball.vy = 0; }
        if (ball.x < fx + ball.r) { ball.x = fx + ball.r; ball.vx = Math.abs(ball.vx) * 0.6; } if (ball.x > fx + fw - ball.r) { ball.x = fx + fw - ball.r; ball.vx = -Math.abs(ball.vx) * 0.6; }
        if (ball.y < top + ball.r) { ball.y = top + ball.r; ball.vy = Math.abs(ball.vy) * 0.6; } if (ball.y > top + fh - ball.r) { ball.y = top + fh - ball.r; ball.vy = -Math.abs(ball.vy) * 0.6; }
        rects().forEach(collideRect);
        if (h.mill) { const m = P(h.mill), L = h.mill[2] * fw, a = g.time * (1.2 + d * 0.4); for (const aa of [a, a + Math.PI / 2]) { const ex = Math.cos(aa) * L, ey = Math.sin(aa) * L; const tt = clamp(((ball.x - (m[0] - ex)) * 2 * ex + (ball.y - (m[1] - ey)) * 2 * ey) / (4 * L * L), 0, 1); const px = m[0] - ex + 2 * ex * tt, py = m[1] - ey + 2 * ey * tt; const dx = ball.x - px, dy = ball.y - py, dd = Math.hypot(dx, dy); if (dd < ball.r + 4 && dd > 0) { const ux = dx / dd, uy = dy / dd; const dot = ball.vx * ux + ball.vy * uy; ball.vx -= 1.8 * Math.min(0, dot) * ux - ux * 60; ball.vy -= 1.8 * Math.min(0, dot) * uy - uy * 60; ball.x = px + ux * (ball.r + 4); ball.y = py + uy * (ball.r + 4); X.SFX.tick(); } } }
        for (const w of circ(h.water)) if (Math.hypot(ball.x - w[0], ball.y - w[1]) < w[2] && !moving()) { strokes[hi]++; g.burst(ball.x, ball.y, "#74c0fc", 20, 120); X.SFX.bad(); msg = { s: "池ポチャ！ +1打", t: 1.2 }; ball.x = last.x; ball.y = last.y; ball.vx = ball.vy = 0; }
        const dh = Math.hypot(ball.x - hp[0], ball.y - hp[1]), sp2 = Math.hypot(ball.vx, ball.vy);
        if (dh < 10 && sp2 < 330) { sink = 0.6; ball.x = hp[0]; ball.y = hp[1]; ball.vx = ball.vy = 0; X.SFX.cheer(); g.burst(hp[0], hp[1], ["#ffd43b", "#fff", "#69db7c"], 36, 220, 1); const s = strokes[hi], rel = s - h.par; msg = { s: s === 1 ? "ホールインワン！！" : rel <= -2 ? "イーグル！" : rel === -1 ? "バーディー！" : rel === 0 ? "パー" : rel === 1 ? "ボギー" : "+" + rel, t: 1.5 }; g.vib([20, 30, 40]); break; }
        else if (dh < 18 && sp2 < 330) { ball.vx += (hp[0] - ball.x) * 4 * sdt; ball.vy += (hp[1] - ball.y) * 4 * sdt; }
      }
      if (moving()) { trail.push([ball.x, ball.y]); if (trail.length > 18) trail.shift(); } else if (trail.length) trail.shift();
    }, (c) => {
      c.fillStyle = "#1e3a2b"; c.fillRect(0, 0, W, Hh); const h = HOLES[hi > 2 ? 2 : hi];
      c.fillStyle = "#2b8a3e"; rr(c, fx, top, fw, fh, 18); c.fill(); c.save(); rr(c, fx, top, fw, fh, 18); c.clip(); for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? "#37b24d" : "#40c057"; c.fillRect(fx, top + (i * fh) / 14, fw, fh / 14 + 1); }
      const hp = P(h.hole); const gr = c.createRadialGradient(hp[0], hp[1], 5, hp[0], hp[1], 90); gr.addColorStop(0, "#69db7c"); gr.addColorStop(1, "rgba(105,219,124,0)"); c.fillStyle = gr; c.beginPath(); c.arc(hp[0], hp[1], 90, 0, 7); c.fill();
      for (const s of circ(h.sand)) { c.fillStyle = "#e9d8a6"; c.beginPath(); c.arc(s[0], s[1], s[2], 0, 7); c.fill(); c.fillStyle = "rgba(0,0,0,.06)"; for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(s[0] + Math.cos(i * 2.4) * s[2] * 0.6, s[1] + Math.sin(i * 1.7) * s[2] * 0.6, 2, 0, 7); c.fill(); } }
      for (const w of circ(h.water)) { const wg = c.createRadialGradient(w[0], w[1], 2, w[0], w[1], w[2]); wg.addColorStop(0, "#74c0fc"); wg.addColorStop(1, "#1c7ed6"); c.fillStyle = wg; c.beginPath(); c.arc(w[0], w[1], w[2], 0, 7); c.fill(); c.strokeStyle = "rgba(255,255,255,.4)"; c.beginPath(); c.arc(w[0], w[1], w[2] * (0.5 + 0.2 * Math.sin(g.time * 2)), 0, 2); c.stroke(); }
      c.restore();
      for (const r of rects()) { c.fillStyle = "rgba(0,0,0,.25)"; rr(c, r[0] + 3, r[1] + 4, r[2], r[3], 5); c.fill(); const wg = c.createLinearGradient(0, r[1], 0, r[1] + r[3]); wg.addColorStop(0, "#a0785a"); wg.addColorStop(1, "#6d4c3d"); c.fillStyle = wg; rr(c, r[0], r[1], r[2], r[3], 5); c.fill(); }
      if (h.mill) { const m = P(h.mill), L = h.mill[2] * fw, a = g.time * (1.2 + d * 0.4); c.strokeStyle = "#f8f9fa"; c.lineWidth = 8; c.lineCap = "round"; for (const aa of [a, a + Math.PI / 2]) { c.beginPath(); c.moveTo(m[0] - Math.cos(aa) * L, m[1] - Math.sin(aa) * L); c.lineTo(m[0] + Math.cos(aa) * L, m[1] + Math.sin(aa) * L); c.stroke(); } c.fillStyle = "#e03131"; c.beginPath(); c.arc(m[0], m[1], 9, 0, 7); c.fill(); }
      c.fillStyle = "#111"; c.beginPath(); c.arc(hp[0], hp[1], 10, 0, 7); c.fill(); c.strokeStyle = "#f1f3f5"; c.lineWidth = 2; c.beginPath(); c.moveTo(hp[0], hp[1]); c.lineTo(hp[0], hp[1] - 44); c.stroke(); c.fillStyle = "#fa5252"; c.beginPath(); c.moveTo(hp[0], hp[1] - 44); c.lineTo(hp[0] + 22 + Math.sin(g.time * 5) * 3, hp[1] - 37); c.lineTo(hp[0], hp[1] - 30); c.fill();
      trail.forEach((p, i) => { c.globalAlpha = i / trail.length * 0.5; c.fillStyle = "#fff"; c.beginPath(); c.arc(p[0], p[1], 4 * i / trail.length + 1, 0, 7); c.fill(); }); c.globalAlpha = 1;
      if (aim) { const dx = aim.sx - aim.x, dy = aim.sy - aim.y, m = Math.hypot(dx, dy); if (m > 12) { const pw = Math.min(m, 170) / 170, ux = dx / m, uy = dy / m; c.setLineDash([6, 8]); c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 3; c.beginPath(); c.moveTo(ball.x, ball.y); c.lineTo(ball.x + ux * (40 + pw * 160), ball.y + uy * (40 + pw * 160)); c.stroke(); c.setLineDash([]); c.fillStyle = "rgba(0,0,0,.4)"; rr(c, W / 2 - 80, Hh - 34, 160, 14, 7); c.fill(); c.fillStyle = pw > 0.85 ? "#ff6b6b" : pw > 0.5 ? "#ffd43b" : "#69db7c"; rr(c, W / 2 - 80, Hh - 34, 160 * pw, 14, 7); c.fill(); } }
      if (ball.z > 0) { c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(ball.x + 2, ball.y + 3, ball.r * ball.z, ball.r * 0.6 * ball.z, 0, 0, 7); c.fill(); const bg = c.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.r); bg.addColorStop(0, "#fff"); bg.addColorStop(1, "#ced4da"); c.fillStyle = bg; c.beginPath(); c.arc(ball.x, ball.y, ball.r * ball.z, 0, 7); c.fill(); }
      if (hi >= 2) tape.drawTop(c, P(h.hole)[1] + 34, P(h.hole)[0] - 40, P(h.hole)[0] + 40);
      c.fillStyle = "rgba(0,0,0,.45)"; rr(c, 10, 8, W - 20, 48, 14); c.fill();
      if (!fin) { const left = Math.max(0, Math.ceil(MAXT - holeT)); txt(c, "のこり " + left + "秒 ・ 最大" + maxS(h) + "打", W / 2, 66, 11, left <= 10 ? "#ff8787" : "rgba(255,255,255,.8)"); }
      txt(c, "ホール " + Math.min(3, hi + 1) + "/3 ・ パー" + h.par, 22, 24, 13, "#fff", "left"); txt(c, "あなた " + strokes.reduce((a, b) => a + b, 0) + "打", 22, 44, 15, "#74c0fc", "left");
      txt(c, "CPU " + cpuStrokes.slice(0, hi).reduce((a, b) => a + b, 0) + "打（" + Math.min(hi, 3) + "H）", W - 22, 44, 15, "#ff8787", "right"); txt(c, "この打数 " + strokes[Math.min(hi, 2)], W - 22, 24, 13, "#fff", "right");
      if (msg) txt(c, msg.s, W / 2, Hh * 0.5, 30, "#ffe066");
    });
  });

  // ===== サッカー：ストライカーズ =====
  add("soccer", "⚽", "ストライカーズ", "#1c7ed6", "左手でスティック操作、右側タップでシュート。60秒でCPUより多く点をとれば勝ち。", (diff) => {
    const g = X.pro("soccer", diff, "ストライカーズ"), W = g.W, Hh = g.H, c = g.c, d = g.d, st = X.stick(g, "left");
    const top = 70, bot = Hh - 20, L = 14, R = W - 14, gw = 110, cx = W / 2;
    const me = { x: cx, y: bot - 120, team: 0, col: "#339af0", sp: 175 }, cp = { x: cx, y: top + 120, team: 1, col: "#ff6b6b", sp: [120, 145, 165, 180][d] };
    const kp = [{ x: cx, y: bot - 14, col: "#74c0fc", team: 0 }, { x: cx, y: top + 14, col: "#ffa8a8", team: 1 }];
    const ball = { x: cx, y: (top + bot) / 2, vx: 0, vy: 0, own: null };
    let score = [0, 0], time = 60, msg = { s: "キックオフ！", t: 1.2 }, pause = 1.2, face = { x: 0, y: -1 }, steal = 0;
    function kickoff(toward) { me.x = cx; me.y = bot - 120; cp.x = cx; cp.y = top + 120; ball.x = cx; ball.y = (top + bot) / 2; ball.vx = ball.vy = 0; ball.own = null; pause = 1.2; }
    function kick(p, tx, ty, pw) { const dx = tx - ball.x, dy = ty - ball.y, m = Math.hypot(dx, dy) || 1; ball.vx = (dx / m) * pw; ball.vy = (dy / m) * pw; ball.own = null; steal = 0.35; ball.roll = Math.random(); ball.byKeeper = !p.sp; X.SFX.kick(); g.burst(ball.x, ball.y, "#fff", 8, 120, 0.3); }
    g.onDown = (o) => { if (st.take(o)) return; if (ball.own === me) { const tx = clamp(cx + face.x * 150 + (cx - me.x) * 0.25 + rand(-14, 14), cx - gw / 2 + 8, cx + gw / 2 - 8); kick(me, tx, top - 10, 620); g.vib(15); } };
    g.onMove = (o) => st.move(o); g.onUp = (o) => st.rel(o);
    g.dbg = () => ({ me, ball, cp, top, bot, cx, own: ball.own === me, score });
    const near = (a, b, r) => Math.hypot(a.x - b.x, a.y - b.y) < r;
    g.run((dt) => {
      if (pause > 0) { pause -= dt; if (msg) msg.t -= dt; return; } if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
      time -= dt; if (time <= 0) { time = 0; const w = score[0] > score[1]; g.end(w, w ? "勝ち！" : score[0] === score[1] ? "引き分け" : "CPUの勝ち", ["あなた " + score[0], "CPU " + score[1]], score[0] === score[1]); return; }
      steal = Math.max(0, steal - dt);
      // 自分
      if (st.on && (Math.abs(st.dx) + Math.abs(st.dy) > 0.15)) { me.x += st.dx * me.sp * dt; me.y += st.dy * me.sp * dt; const m = Math.hypot(st.dx, st.dy); face = { x: st.dx / m, y: st.dy / m }; }
      // CPU
      const goalMe = { x: cx, y: bot }; let tx, ty;
      if (ball.own === cp) { tx = cx + Math.sin(g.time * 1.3) * 40; ty = bot; if (cp.y > bot - 220 + d * 20) { kick(cp, cx + rand(-gw / 2 + 12, gw / 2 - 12), bot + 10, 520 + d * 50); } }
      else { tx = ball.x; ty = ball.y - 8; if (ball.own === me) { tx = ball.x; ty = ball.y; } }
      const dx = tx - cp.x, dy = ty - cp.y, dm = Math.hypot(dx, dy) || 1; cp.x += (dx / dm) * cp.sp * dt; cp.y += (dy / dm) * cp.sp * dt;
      for (const p of [me, cp]) { p.x = clamp(p.x, L + 8, R - 8); p.y = clamp(p.y, top + 8, bot - 8); }
      if (near(me, cp, 22)) { const a = Math.atan2(me.y - cp.y, me.x - cp.x); me.x += Math.cos(a) * 1.5; me.y += Math.sin(a) * 1.5; cp.x -= Math.cos(a) * 1.5; cp.y -= Math.sin(a) * 1.5; }
      // ボール
      if (ball.own) { const o = ball.own, f = o === me ? face : { x: (tx - cp.x) / dm, y: (ty - cp.y) / dm }; ball.x = lerp(ball.x, o.x + f.x * 14, 0.5); ball.y = lerp(ball.y, o.y + f.y * 14, 0.5); const other = o === me ? cp : me; if (near(other, ball, 18) && Math.random() < (o === me ? [0.6, 1.2, 1.9, 2.6][d] : 2.2) * dt) { ball.own = other; X.SFX.hit(); g.pop(ball.x, ball.y - 20, other === me ? "うばった！" : "とられた", other === me ? "#74c0fc" : "#ff8787", 16); } }
      else { ball.x += ball.vx * dt; ball.y += ball.vy * dt; const f = Math.pow(0.45, dt); ball.vx *= f; ball.vy *= f; if (steal <= 0) for (const p of [me, cp]) if (near(p, ball, 16)) { ball.own = p; break; } }
      if (ball.x < L + 6 || ball.x > R - 6) { ball.vx *= -0.8; ball.x = clamp(ball.x, L + 6, R - 6); }
      const inGoalX = Math.abs(ball.x - cx) < gw / 2;
      // キーパー
      kp.forEach((k, i) => { const ksp = (i === 1 ? [70, 100, 130, 160][d] : 130) * (ball.own ? 0.45 : 1); const tx2 = clamp(ball.own ? cx + (ball.x - cx) * 0.5 : ball.x, cx - gw / 2 + 8, cx + gw / 2 - 8); k.x += clamp(tx2 - k.x, -ksp * dt, ksp * dt); const pSave = i === 1 ? [0.35, 0.5, 0.65, 0.8][d] : [0.8, 0.65, 0.55, 0.45][d]; if (!ball.own && !ball.byKeeper && near(k, ball, 16) && ball.roll < pSave) { kick(k, rand(L + 40, R - 40), i === 0 ? top + (bot - top) * 0.4 : bot - (bot - top) * 0.4, 420); g.pop(k.x, k.y + (i ? 20 : -20), "セーブ！", "#fff", 15); } });
      if (ball.y < top && !ball.own) { if (inGoalX) { score[0]++; msg = { s: "ゴール！！", t: 1.5 }; X.SFX.cheer(); g.flash("#74c0fc", 0.4); g.shake(10); g.burst(ball.x, top, ["#74c0fc", "#fff", "#ffd43b"], 40, 260, 1.1); g.vib([30, 30, 60]); kickoff(); return; } ball.vy = Math.abs(ball.vy) * 0.7; ball.y = top + 1; }
      if (ball.y > bot && !ball.own) { if (inGoalX) { score[1]++; msg = { s: "失点…", t: 1.3 }; X.SFX.bad(); g.shake(6); kickoff(); return; } ball.vy = -Math.abs(ball.vy) * 0.7; ball.y = bot - 1; }
      if (ball.own && (ball.y < top + 2 || ball.y > bot - 2)) ball.y = clamp(ball.y, top + 4, bot - 4);
    }, (c) => {
      c.fillStyle = "#0b3d20"; c.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? "#2f9e44" : "#37b24d"; c.fillRect(L, top + (i * (bot - top)) / 10, R - L, (bot - top) / 10 + 1); }
      c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 2.5; c.strokeRect(L, top, R - L, bot - top); c.beginPath(); c.moveTo(L, (top + bot) / 2); c.lineTo(R, (top + bot) / 2); c.stroke(); c.beginPath(); c.arc(cx, (top + bot) / 2, 46, 0, 7); c.stroke();
      c.strokeRect(cx - 90, top, 180, 70); c.strokeRect(cx - 90, bot - 70, 180, 70);
      for (const [y, s] of [[top, -1], [bot, 1]]) { c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(cx - gw / 2, s < 0 ? y - 14 : y, gw, 14); c.strokeStyle = "#fff"; c.lineWidth = 3; c.strokeRect(cx - gw / 2, s < 0 ? y - 14 : y, gw, 14); }
      const pl = (p, sz, lbl) => { c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(p.x + 2, p.y + 4, sz, sz * 0.6, 0, 0, 7); c.fill(); const gr = c.createRadialGradient(p.x - 3, p.y - 3, 2, p.x, p.y, sz); gr.addColorStop(0, "#fff"); gr.addColorStop(0.25, p.col); gr.addColorStop(1, p.col); c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, sz, 0, 7); c.fill(); c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 2; c.stroke(); if (lbl) txt(c, lbl, p.x, p.y - sz - 8, 11, "#fff"); };
      kp.forEach((k) => pl(k, 10, "")); pl(cp, 12, "CPU"); pl(me, 12, "あなた");
      if (ball.own === me) { c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 2; c.beginPath(); c.arc(me.x, me.y, 18 + Math.sin(g.time * 10) * 2, 0, 7); c.stroke(); }
      c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(ball.x + 2, ball.y + 3, 6, 4, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(ball.x, ball.y, 6, 0, 7); c.fill(); c.fillStyle = "#212529"; c.beginPath(); c.arc(ball.x + Math.cos(g.time * 9) * 2, ball.y, 2.2, 0, 7); c.fill();
      st.draw(c);
      c.fillStyle = "rgba(0,0,0,.5)"; rr(c, W / 2 - 110, 10, 220, 46, 16); c.fill(); txt(c, score[0] + " - " + score[1], W / 2, 33, 26, "#fff"); txt(c, "あなた", W / 2 - 80, 33, 13, "#74c0fc"); txt(c, "CPU", W / 2 + 80, 33, 13, "#ff8787");
      txt(c, Math.ceil(time) + "秒", W - 16, 33, 15, time < 10 ? "#ff8787" : "#fff", "right");
      if (ball.own === me) txt(c, "右側をタップでシュート！", W * 0.72, Hh - 40, 13, "#fff");
      if (msg) txt(c, msg.s, W / 2, Hh * 0.45, 40, "#ffe066");
    });
  });

  // ===== ボウリング：ストライクレーン =====
  add("bowling", "🎳", "ストライクレーン", "#7048e8", "下から上にスワイプして投げる。カーブをえがくと曲がる。5フレームでCPUより高得点なら勝ち。", (diff) => {
    const g = X.pro("bowling", diff, "ストライクレーン"), W = g.W, Hh = g.H, c = g.c, d = g.d;
    const lx = W * 0.2, lw = W * 0.6, top = 80, foul = Hh - 120, pr = 7, br = 11;
    let pins, ball = null, frame = 0, roll = 0, frames = [], down = 0, msg = null, wait = 0, path = [];
    const cpu = []; for (let i = 0; i < 5; i++) cpu.push(Math.min(30, Math.round(rand([10, 14, 17, 20][d], [16, 20, 23, 26][d]))));
    function rack() { pins = []; const sx = lx + lw / 2, sy = top + 40, gap = 22; for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) pins.push({ x: sx + (i - r / 2) * gap, y: sy + (3 - r) * gap * 0.9 + 0, vx: 0, vy: 0, ox: 0, oy: 0, fall: false, a: 1 }); pins.forEach((p) => { p.ox = p.x; p.oy = p.y; }); }
    rack();
    let swipe = null;
    g.onDown = (o) => { if (ball || wait > 0 || g.over) return; swipe = o; path = [[o.x, o.y]]; };
    g.onMove = (o) => { if (swipe === o) path.push([o.x, o.y]); };
    g.onUp = (o) => { if (swipe !== o) return; swipe = null; const dy = o.sy - o.y, dx = o.x - o.sx; if (dy < 40) return; const dtm = Math.max(0.08, (performance.now() - o.t) / 1000); const sp = clamp(dy / dtm, 300, 1100); const mid = path[Math.floor(path.length / 2)] || [o.x, o.y]; const lineX = (o.sx + o.x) / 2; const curve = clamp((mid[0] - lineX) / 40, -1, 1); ball = { x: clamp(o.sx, lx + br, lx + lw - br), y: foul, vx: (dx / dy) * sp * 0.8, vy: -sp, spin: -curve * 260, gut: false }; X.SFX.whoosh(); g.vib(15); };
    function finishRoll() { const n = pins.filter((p) => p.fall && !p.counted).length; pins.forEach((p) => { if (p.fall) p.counted = true; }); if (!frames[frame]) frames[frame] = []; frames[frame].push(n); const tot = frames[frame].reduce((a, b) => a + b, 0);
      if (roll === 0 && tot === 10) { msg = { s: "ストライク！", t: 1.6, c: "#ffd43b" }; X.SFX.cheer(); g.flash("#fff", 0.5); g.burst(W / 2, top + 50, ["#ffd43b", "#ff6b6b", "#74c0fc"], 50, 280, 1.2); next(); }
      else if (roll === 1) { if (tot === 10) { msg = { s: "スペア！", t: 1.4, c: "#74c0fc" }; X.SFX.coin(); } else msg = { s: tot + "本", t: 1, c: "#fff" }; next(); }
      else { msg = { s: n + "本", t: 1, c: "#fff" }; roll = 1; wait = 1.2; pins = pins.filter((p) => !p.fall).concat(pins.filter((p) => p.fall).map((p) => Object.assign(p, { gone: true }))); } }
    function next() { roll = 0; frame++; wait = 1.6; if (frame >= 5) { g.later(() => { const me = score(); const cp = cpu.reduce((a, b) => a + b, 0); g.end(me > cp, me > cp ? "勝ち！" : me === cp ? "引き分け" : "CPUの勝ち", ["あなた " + me, "CPU " + cp], me === cp); }, 1500); } }
    function score() { let s = 0; frames.forEach((f, i) => { const a = f[0] || 0, b = f[1] || 0; s += a + b; const nx = (frames[i + 1] || []).concat(frames[i + 2] || []); if (a === 10) s += (nx[0] || 0) + (nx[1] || 0); else if (a + b === 10) s += nx[0] || 0; }); return s; }
    g.run((dt) => {
      if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
      if (wait > 0) { wait -= dt; if (wait <= 0 && frame < 5 && roll === 0) rack(); if (wait <= 0 && roll === 1) pins = pins.filter((p) => !p.gone); return; }
      const steps = 6; for (let k = 0; k < steps; k++) { const s = dt / steps;
        if (ball) { if (!ball.gut) { ball.vx += ball.spin * s * (ball.y < foul - 150 ? 1 : 0.2); } ball.x += ball.vx * s; ball.y += ball.vy * s; if (!ball.gut && (ball.x < lx + 2 || ball.x > lx + lw - 2)) { ball.gut = true; ball.vx = 0; ball.x = ball.x < lx + 2 ? lx - 8 : lx + lw + 8; msg = { s: "ガター…", t: 1, c: "#ff8787" }; }
          if (!ball.gut) for (const p of pins) { if (p.gone) continue; const dx = p.x - ball.x, dy = p.y - ball.y, dd = Math.hypot(dx, dy); if (dd < br + pr && dd > 0) { const ux = dx / dd, uy = dy / dd, rel = (ball.vx - p.vx) * ux + (ball.vy - p.vy) * uy; if (rel > 0) { p.vx += ux * rel * 1.6; p.vy += uy * rel * 1.6; ball.vx -= ux * rel * 0.25; ball.vy -= uy * rel * 0.25; X.SFX.hit(); g.shake(3); } } } }
        for (let i = 0; i < pins.length; i++) { const p = pins[i]; if (p.gone) continue; p.x += p.vx * s; p.y += p.vy * s; p.vx *= 0.995; p.vy *= 0.995; for (let j = i + 1; j < pins.length; j++) { const q = pins[j]; if (q.gone) continue; const dx = q.x - p.x, dy = q.y - p.y, dd = Math.hypot(dx, dy); if (dd < pr * 2 && dd > 0) { const ux = dx / dd, uy = dy / dd, rel = (p.vx - q.vx) * ux + (p.vy - q.vy) * uy; if (rel > 0) { p.vx -= ux * rel * 0.9; p.vy -= uy * rel * 0.9; q.vx += ux * rel * 0.9; q.vy += uy * rel * 0.9; } const ov = pr * 2 - dd; p.x -= ux * ov / 2; p.y -= uy * ov / 2; q.x += ux * ov / 2; q.y += uy * ov / 2; } } if (!p.fall && Math.hypot(p.x - p.ox, p.y - p.oy) > 6) { p.fall = true; } }
      }
      if (ball && ball.y < top - 30) { ball = null; g.later(finishRoll, 700); }
    }, (c) => {
      c.fillStyle = "#1a1530"; c.fillRect(0, 0, W, Hh);
      c.fillStyle = "#2b2550"; c.fillRect(lx - 16, top - 30, lw + 32, Hh); const lg = c.createLinearGradient(lx, 0, lx + lw, 0); lg.addColorStop(0, "#d9a066"); lg.addColorStop(0.5, "#f1c48a"); lg.addColorStop(1, "#d9a066"); c.fillStyle = lg; c.fillRect(lx, top - 30, lw, Hh);
      c.fillStyle = "rgba(0,0,0,.06)"; for (let i = 1; i < 12; i++) c.fillRect(lx + (i * lw) / 12, top - 30, 1, Hh); c.fillStyle = "#3b2f6b"; for (const x of [lx - 14, lx + lw]) c.fillRect(x, top - 30, 14, Hh);
      for (let i = 0; i < 7; i++) { const x = lx + lw * (0.2 + i * 0.1), y = foul - 160 - Math.abs(i - 3) * 10; c.fillStyle = "#7048e8"; c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x + 5, y + 4); c.lineTo(x - 5, y + 4); c.fill(); }
      c.strokeStyle = "#e03131"; c.lineWidth = 3; c.beginPath(); c.moveTo(lx, foul + 14); c.lineTo(lx + lw, foul + 14); c.stroke();
      for (const p of pins) { if (p.gone) continue; c.globalAlpha = p.fall ? 0.45 : 1; c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(p.x + 2, p.y + 3, pr, pr * 0.6, 0, 0, 7); c.fill(); const pg = c.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, pr); pg.addColorStop(0, "#fff"); pg.addColorStop(1, "#dee2e6"); c.fillStyle = pg; c.beginPath(); c.arc(p.x, p.y, pr, 0, 7); c.fill(); c.strokeStyle = "#e03131"; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, pr - 2.5, 0, 7); c.stroke(); } c.globalAlpha = 1;
      if (ball) { const bg = c.createRadialGradient(ball.x - 3, ball.y - 3, 2, ball.x, ball.y, br); bg.addColorStop(0, "#b197fc"); bg.addColorStop(1, "#5f3dc4"); c.fillStyle = bg; c.beginPath(); c.arc(ball.x, ball.y, br, 0, 7); c.fill(); }
      if (swipe && path.length > 1) { c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 4; c.beginPath(); path.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); }
      if (!ball && wait <= 0 && !swipe) { c.globalAlpha = 0.5 + 0.3 * Math.sin(g.time * 4); txt(c, "↑ 下から上へスワイプ", W / 2, foul + 50, 16, "#fff"); c.globalAlpha = 1; }
      c.fillStyle = "rgba(0,0,0,.55)"; rr(c, 8, 8, W - 16, 56, 12); c.fill();
      for (let i = 0; i < 5; i++) { const f = frames[i] || [], x = 16 + i * ((W - 32) / 5), w = (W - 32) / 5 - 4; c.fillStyle = i === frame ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.06)"; rr(c, x, 14, w, 24, 6); c.fill(); const s = f[0] === 10 ? "X" : f.length === 2 && f[0] + f[1] === 10 ? f[0] + " /" : f.join(" "); txt(c, s, x + w / 2, 26, 13, "#fff", "center", 800, null); txt(c, "" + cpu[i], x + w / 2, 50, 11, "#ffa8a8", "center", 700, null); }
      txt(c, "あなた " + score(), 16, Hh - 18, 15, "#b197fc", "left"); txt(c, "CPU " + cpu.slice(0, frame).reduce((a, b) => a + b, 0), W - 16, Hh - 18, 15, "#ffa8a8", "right");
      if (msg) txt(c, msg.s, W / 2, Hh * 0.45, 40, msg.c || "#fff");
    });
  });

  // ===== バスケ：スリーポイントショット =====
  add("basket", "🏀", "スリーポイントショット", "#f76707", "ゴールに向かって上にスワイプしてシュート。45秒でCPUより多く決めれば勝ち。3本連続で得点2倍。", (diff) => {
    const g = X.pro("basket", diff, "スリーポイントショット"), W = g.W, Hh = g.H, c = g.c, d = g.d;
    const hoopY = Hh * 0.26, baseY = Hh - 110; let hoopX = W / 2, time = 45, pts = 0, streak = 0, ball = null, msg = null, swipe = null, net = 0;
    const cpuT = [8, 12, 15, 18][d] + Math.floor(rand(0, 4));
    g.onDown = (o) => { if (ball || g.over) return; swipe = o; };
    g.dbg = () => ({ hoopX, hoopY, baseY, ball, pts });
    g.onUp = (o) => { if (swipe !== o) return; swipe = null; const dy = o.sy - o.y, dx = o.x - o.sx; if (dy < 50) return; const pw = (dy / (Hh * 0.34)) * 1000; ball = { t: 0, T: 0.95, sx: W / 2, sy: baseY, tx: W / 2 + dx * 1.3, pw, r: 20, done: false }; X.SFX.whoosh(); };
    g.run((dt) => {
      if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; } net = Math.max(0, net - dt);
      time -= dt; if (time <= 0 && !ball) { time = 0; const fin = streak; g.end(pts > cpuT, pts > cpuT ? "勝ち！" : pts === cpuT ? "引き分け" : "CPUの勝ち", ["あなた " + pts + "点", "CPU " + cpuT + "点"], pts === cpuT); return; }
      if (d >= 2) hoopX = W / 2 + Math.sin(g.time * (d === 3 ? 1.4 : 0.9)) * W * 0.22;
      if (ball) { ball.t += dt; const k = ball.t / ball.T; if (k >= 0.62 && !ball.done) { ball.done = true; const ideal = 1000, tol = [0.3, 0.22, 0.17, 0.13][d]; const pe = Math.abs(ball.pw - ideal) / ideal; const xe = Math.abs(ball.tx - hoopX); const ok = xe < [26, 22, 19, 17][d] && pe < tol, rim = xe < 36 && pe < tol + 0.15; if (ok) { const v = streak >= 2 ? 2 : 1; pts += v; streak++; net = 0.5; msg = { s: xe < 9 ? "スウィッシュ！" : "ナイスシュート！", t: 1, c: "#ffd43b" }; X.SFX.coin(); g.burst(hoopX, hoopY + 10, ["#ffd43b", "#ff922b", "#fff"], 26, 200); if (streak >= 3) g.pop(hoopX, hoopY - 40, "ON FIRE ×2", "#ff6b6b", 22); g.vib(20); ball.res = "in"; } else { streak = 0; ball.res = rim ? "rim" : "miss"; if (rim) { X.SFX.hit(); g.shake(4); msg = { s: "リングにはじかれた", t: 0.8, c: "#fff" }; } } } if (k >= 1) ball = null; }
    }, (c) => {
      const bg = c.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, "#1b1f3b"); bg.addColorStop(1, "#3b1f1f"); c.fillStyle = bg; c.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 40; i++) { c.fillStyle = "rgba(255,255,255," + (0.1 + 0.1 * Math.sin(g.time * 2 + i)) + ")"; c.fillRect((i * 53) % W, (i * 29) % (Hh * 0.18), 3, 3); }
      const fl = c.createLinearGradient(0, Hh * 0.45, 0, Hh); fl.addColorStop(0, "#c0773a"); fl.addColorStop(1, "#e8a15f"); c.fillStyle = fl; c.beginPath(); c.moveTo(W * 0.3, Hh * 0.45); c.lineTo(W * 0.7, Hh * 0.45); c.lineTo(W + 40, Hh); c.lineTo(-40, Hh); c.closePath(); c.fill();
      c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 3; c.beginPath(); c.ellipse(W / 2, Hh * 0.62, W * 0.42, Hh * 0.17, 0, 0, Math.PI); c.stroke();
      c.fillStyle = "#f1f3f5"; rr(c, hoopX - 50, hoopY - 70, 100, 66, 6); c.fill(); c.strokeStyle = "#e03131"; c.lineWidth = 3; c.strokeRect(hoopX - 18, hoopY - 40, 36, 28); c.fillStyle = "#adb5bd"; c.fillRect(hoopX - 3, hoopY - 4, 6, Hh * 0.2);
      const drawBall = (x, y, r) => { const gg = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r); gg.addColorStop(0, "#ffa94d"); gg.addColorStop(1, "#d9480f"); c.fillStyle = gg; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke(); };
      let behind = ball && ball.t / ball.T > 0.62 && ball.res === "in";
      const drawNet = () => { c.strokeStyle = "#fff"; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const x0 = hoopX - 20 + i * 8, sway = net > 0 ? Math.sin(g.time * 30 + i) * 3 : 0; c.beginPath(); c.moveTo(x0, hoopY + 2); c.lineTo(hoopX - 12 + i * 4.8 + sway, hoopY + 30); c.stroke(); } };
      if (ball) { const k = Math.min(1, ball.t / ball.T); let x, y, r; if (k < 0.62) { const kk = k / 0.62; x = lerp(ball.sx, ball.tx, kk); y = lerp(ball.sy, hoopY - 4, kk) - Math.sin(kk * Math.PI) * Hh * 0.28 * clamp(ball.pw / 1000, 0.6, 1.4); r = lerp(20, 10, kk); } else { const kk = (k - 0.62) / 0.38; x = ball.tx + (ball.res === "rim" ? (ball.tx < hoopX ? -1 : 1) * kk * 80 : 0); y = hoopY - 4 + (ball.res === "in" ? kk * 70 : ball.res === "rim" ? -Math.sin(kk * Math.PI) * 50 + kk * 60 : kk * 120); r = 10; } if (behind) { drawBall(x, y, r); } c.strokeStyle = "#ff6b00"; c.lineWidth = 4; c.beginPath(); c.ellipse(hoopX, hoopY, 22, 6, 0, 0, 7); c.stroke(); drawNet(); if (!behind) drawBall(x, y, r); }
      else { c.strokeStyle = "#ff6b00"; c.lineWidth = 4; c.beginPath(); c.ellipse(hoopX, hoopY, 22, 6, 0, 0, 7); c.stroke(); drawNet(); drawBall(W / 2, baseY, 20); if (swipe) { const dy = Math.max(0, swipe.sy - swipe.y), k = dy / (Hh * 0.34), tol = [0.3, 0.22, 0.17, 0.13][d]; c.fillStyle = "rgba(0,0,0,.45)"; rr(c, W - 34, baseY - 150, 16, 160, 8); c.fill(); c.fillStyle = "rgba(105,219,124,.55)"; const zy = baseY + 10 - 160 * (1 + tol) / 1.6, zh = 160 * (2 * tol) / 1.6; rr(c, W - 34, zy, 16, zh, 4); c.fill(); c.fillStyle = Math.abs(k - 1) < tol ? "#69db7c" : k > 1 ? "#ff6b6b" : "#ffd43b"; rr(c, W - 31, baseY + 10 - 160 * Math.min(1.6, k) / 1.6, 10, 160 * Math.min(1.6, k) / 1.6, 5); c.fill(); c.strokeStyle = "rgba(255,255,255,.6)"; c.setLineDash([5, 6]); c.lineWidth = 2; c.beginPath(); c.moveTo(swipe.sx, swipe.sy); c.lineTo(swipe.x, swipe.y); c.stroke(); c.setLineDash([]); } else { c.globalAlpha = 0.5 + 0.3 * Math.sin(g.time * 4); txt(c, "↑ ゲージの緑までスワイプしてはなす", W / 2, baseY + 50, 14, "#fff"); c.globalAlpha = 1; } }
      c.fillStyle = "rgba(0,0,0,.5)"; rr(c, 10, 10, W - 20, 50, 14); c.fill(); txt(c, "あなた " + pts, 24, 35, 18, "#ffa94d", "left"); txt(c, "CPU " + cpuT, W - 24, 35, 18, "#ff8787", "right"); txt(c, Math.ceil(time) + "秒", W / 2, 35, 18, time < 10 ? "#ff8787" : "#fff");
      if (streak >= 2) txt(c, "🔥 " + streak + "連続", W / 2, 76, 15, "#ffd43b");
      if (msg) txt(c, msg.s, W / 2, Hh * 0.5, 30, msg.c);
    });
  });
})();
