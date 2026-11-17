/* ほしまなび — アクション・頭の体操12種（すべてオリジナル実装） */
(() => {
  "use strict";
  const H = window.HMGames, { rnd, shuffle } = H;
  const add = (id, e, n, c, d, fn) => H.add({ id, e, n, c, d }, fn);
  const DX = (diff) => ["easy", "normal", "hard", "ultra"].indexOf(diff) < 0 ? 1 : ["easy", "normal", "hard", "ultra"].indexOf(diff);
  const canvasGame = (id, diff, title, status, extra) => { const g = H.shell(id, diff, title, '<div class="hg-status">' + status + "</div><canvas></canvas>" + (extra || "")); const W = Math.min(g.size(), 380), Hh = Math.round(W * 1.3); g.W = W; g.H = Hh; g.ctx = H.setupCanvas(g.$("canvas"), W, Hh); g.cv = g.$("canvas"); return g; };
  const pt = (g, e) => { const r = g.cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * g.W, y: ((e.clientY - r.top) / r.height) * g.H }; };

  // 22) へびゲーム（CPUのへびと対決）
  add("snake", "🐍", "へびゲーム", "#43a047", "スワイプか矢印ボタンで向きを変え、えさを食べてのびよう。CPUのへびより先に長さ12になったら勝ち。ぶつかると負け。", (diff) => {
    const d = DX(diff), N = 16, goal = 12;
    const g = H.shell("snake", diff, "へびゲーム", '<div class="hg-status">🟩 あなた ・ 🟧 CPU</div><canvas></canvas><div class="hg-btns">' + [["↑", 0, -1], ["←", -1, 0], ["↓", 0, 1], ["→", 1, 0]].map(([t, x, y]) => '<button type="button" class="btn" data-dx="' + x + '" data-dy="' + y + '">' + t + "</button>").join("") + "</div>");
    const S = Math.floor(Math.min(g.size(), 360) / N), ctx = H.setupCanvas(g.$("canvas"), N * S, N * S);
    const me = { body: [[3, 8], [2, 8], [1, 8]], dir: [1, 0], next: [1, 0] }, cp = { body: [[12, 7], [13, 7], [14, 7]], dir: [-1, 0] };
    let food = [8, 3], acc = 0; const step = [0.17, 0.14, 0.12, 0.1][d];
    const occ = (x, y) => [me, cp].some((s) => s.body.some(([a, b]) => a === x && b === y));
    const placeFood = () => { do { food = [rnd(N), rnd(N)]; } while (occ(food[0], food[1])); };
    function cpuDir() { const h = cp.body[0], dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([x, y]) => !(x === -cp.dir[0] && y === -cp.dir[1])); const safe = dirs.filter(([x, y]) => { const nx = h[0] + x, ny = h[1] + y; return nx >= 0 && ny >= 0 && nx < N && ny < N && !occ(nx, ny); }); if (!safe.length) return cp.dir; if (Math.random() < [0.35, 0.15, 0.05, 0][d]) return safe[rnd(safe.length)]; safe.sort((a, b) => Math.abs(h[0] + a[0] - food[0]) + Math.abs(h[1] + a[1] - food[1]) - (Math.abs(h[0] + b[0] - food[0]) + Math.abs(h[1] + b[1] - food[1]))); if (d >= 2) { const room = (x, y) => { const seen = new Set([x + "," + y]), q = [[x, y]]; while (q.length && seen.size < 40) { const [a, b] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = a + dx + "," + (b + dy); if (a + dx >= 0 && b + dy >= 0 && a + dx < N && b + dy < N && !seen.has(k) && !occ(a + dx, b + dy)) { seen.add(k); q.push([a + dx, b + dy]); } }); } return seen.size; }; const ok = safe.filter(([x, y]) => room(h[0] + x, h[1] + y) > 12); if (ok.length) return ok[0]; } return safe[0]; }
    function move(s) { const h = s.body[0], nh = [h[0] + s.dir[0], h[1] + s.dir[1]]; if (nh[0] < 0 || nh[1] < 0 || nh[0] >= N || nh[1] >= N || occ(nh[0], nh[1])) return false; s.body.unshift(nh); if (nh[0] === food[0] && nh[1] === food[1]) placeFood(); else s.body.pop(); return true; }
    g.on(g.body, "click", (e) => { const t = e.target.closest("[data-dx]"); if (!t) return; const nd = [+t.dataset.dx, +t.dataset.dy]; if (nd[0] !== -me.dir[0] || nd[1] !== -me.dir[1]) me.next = nd; });
    let sx = 0, sy = 0; g.on(g.$("canvas"), "pointerdown", (e) => { sx = e.clientX; sy = e.clientY; }); g.on(g.$("canvas"), "pointerup", (e) => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 15) return; const nd = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; if (nd[0] !== -me.dir[0] || nd[1] !== -me.dir[1]) me.next = nd; });
    g.on(window, "keydown", (e) => { const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key]; if (m && (m[0] !== -me.dir[0] || m[1] !== -me.dir[1])) { me.next = m; e.preventDefault(); } });
    g.loop((dt) => { acc += dt; if (acc >= step) { acc = 0; me.dir = me.next; if (!move(me)) { g.finish(false, false, "ぶつかった！", "長さ " + me.body.length); return; } cp.dir = cpuDir(); if (!move(cp)) { g.finish(true, false, "CPUがぶつかった！"); return; } if (me.body.length >= goal) { g.finish(true, false, "長さ" + goal + "！"); return; } if (cp.body.length >= goal) { g.finish(false, false, "CPUが先に長さ" + goal); return; } g.status("🟩 あなた " + me.body.length + " ・ 🟧 CPU " + cp.body.length + "（目標 " + goal + "）"); } ctx.fillStyle = "#0b1a2a"; ctx.fillRect(0, 0, N * S, N * S); ctx.fillStyle = "#ff5252"; ctx.beginPath(); ctx.arc(food[0] * S + S / 2, food[1] * S + S / 2, S / 2.4, 0, 7); ctx.fill(); [[me, "#66bb6a"], [cp, "#ffa726"]].forEach(([s, c]) => { ctx.fillStyle = c; s.body.forEach(([x, y], k) => { ctx.globalAlpha = k ? 0.85 : 1; ctx.fillRect(x * S + 1, y * S + 1, S - 2, S - 2); }); ctx.globalAlpha = 1; }); });
  });

  // 23) ふわふわジャンプ
  add("flappy", "🐤", "ふわふわジャンプ", "#fbc02d", "タップで上へふわっと。すき間をくぐって、目標の数だけ通りぬけたら勝ち。", (diff) => {
    const d = DX(diff), goal = [5, 10, 15, 20][d], gap = [170, 150, 135, 120][d];
    const g = canvasGame("flappy", diff, "ふわふわジャンプ", "タップでスタート");
    let y = g.H / 2, vy = 0, started = false, pipes = [], passed = 0, t = 0;
    const flap = () => { started = true; vy = -330; };
    g.on(g.cv, "pointerdown", (e) => { e.preventDefault(); flap(); });
    g.loop((dt) => { const c = g.ctx; if (started) { vy += 900 * dt; y += vy * dt; t += dt; if (t > 1.6) { t = 0; pipes.push({ x: g.W + 30, gy: 80 + Math.random() * (g.H - 160 - gap), ok: false }); } pipes.forEach((p) => (p.x -= (130 + d * 15) * dt)); pipes = pipes.filter((p) => p.x > -60); for (const p of pipes) { if (60 + 14 > p.x && 60 - 14 < p.x + 50 && (y - 14 < p.gy || y + 14 > p.gy + gap)) { g.finish(false, false, "ぶつかった！", passed + "こ通った（目標 " + goal + "）"); return; } if (!p.ok && p.x + 50 < 60) { p.ok = true; passed++; g.status(passed + " / " + goal); if (passed >= goal) { g.finish(true, false, "目標クリア！"); return; } } } if (y > g.H || y < 0) { g.finish(false, false, "落ちた！", passed + "こ通った"); return; } } c.fillStyle = "#6ec6ff"; c.fillRect(0, 0, g.W, g.H); c.fillStyle = "#43a047"; pipes.forEach((p) => { c.fillRect(p.x, 0, 50, p.gy); c.fillRect(p.x, p.gy + gap, 50, g.H); }); c.font = "30px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("🐤", 60, y); });
  });

  // 24) スペースシューター
  add("shooter", "🚀", "スペースシューター", "#283593", "指で左右に動かすと自動でうつ。てきをたおして目標の点に届いたら勝ち。3回当たると負け。", (diff) => {
    const d = DX(diff), goal = [20, 35, 50, 70][d];
    const g = canvasGame("shooter", diff, "スペースシューター", "0 / " + goal + " 点 ・ ❤️❤️❤️");
    let px = g.W / 2, shots = [], foes = [], bombs = [], score = 0, life = 3, ft = 0, st = 0, inv = 0;
    const mv = (e) => { px = Math.max(16, Math.min(g.W - 16, pt(g, e).x)); };
    g.on(g.cv, "pointerdown", mv); g.on(g.cv, "pointermove", mv);
    g.loop((dt) => { const c = g.ctx; ft += dt; st += dt; inv = Math.max(0, inv - dt); if (st > 0.28) { st = 0; shots.push({ x: px, y: g.H - 50 }); } if (ft > [1.1, 0.85, 0.7, 0.55][d]) { ft = 0; foes.push({ x: 20 + Math.random() * (g.W - 40), y: -20, vx: (Math.random() - 0.5) * 60, hp: d >= 2 && Math.random() < 0.3 ? 2 : 1 }); } shots.forEach((s) => (s.y -= 420 * dt)); foes.forEach((f) => { f.y += (60 + d * 20) * dt; f.x += f.vx * dt; if (f.x < 15 || f.x > g.W - 15) f.vx *= -1; if (Math.random() < (0.15 + d * 0.15) * dt) bombs.push({ x: f.x, y: f.y }); }); bombs.forEach((b) => (b.y += 200 * dt)); for (const s of shots) for (const f of foes) if (!s.dead && !f.dead && Math.abs(s.x - f.x) < 18 && Math.abs(s.y - f.y) < 18) { s.dead = true; if (--f.hp <= 0) { f.dead = true; score += 2; } } const hit = (o) => Math.abs(o.x - px) < 18 && Math.abs(o.y - (g.H - 34)) < 18; for (const o of bombs.concat(foes)) if (!o.dead && hit(o) && !inv) { o.dead = true; life--; inv = 1.2; } foes.forEach((f) => { if (f.y > g.H + 20) f.dead = true; }); shots = shots.filter((s) => !s.dead && s.y > -10); foes = foes.filter((f) => !f.dead); bombs = bombs.filter((b) => !b.dead && b.y < g.H + 10); g.status(score + " / " + goal + " 点 ・ " + "❤️".repeat(Math.max(0, life))); if (life <= 0) { g.finish(false, false, "やられた！", score + "点"); return; } if (score >= goal) { g.finish(true, false, "目標の点数！"); return; } c.fillStyle = "#0b1030"; c.fillRect(0, 0, g.W, g.H); c.fillStyle = "#fff"; for (let k = 0; k < 30; k++) c.fillRect((k * 97) % g.W, (k * 53 + performance.now() / 20) % g.H, 2, 2); c.font = "26px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; foes.forEach((f) => c.fillText(f.hp > 1 ? "👾" : "🛸", f.x, f.y)); c.fillStyle = "#ffeb3b"; shots.forEach((s) => c.fillRect(s.x - 2, s.y - 8, 4, 12)); c.fillStyle = "#ff5252"; bombs.forEach((b) => { c.beginPath(); c.arc(b.x, b.y, 4, 0, 7); c.fill(); }); c.globalAlpha = inv ? 0.5 : 1; c.fillText("🚀", px, g.H - 34); c.globalAlpha = 1; });
  });

  // 25) エアホッケー
  add("hockey", "🏒", "エアホッケー", "#00acc1", "指でマレットを動かしてパックを打ち、相手のゴールへ。先に5点で勝ち。", (diff) => {
    const d = DX(diff);
    const g = canvasGame("hockey", diff, "エアホッケー", "あなた 0 - 0 CPU");
    const W = g.W, Hh = g.H, GW = W * 0.38, R = 20, PR = 13;
    let me = { x: W / 2, y: Hh - 60 }, cp = { x: W / 2, y: 60 }, pk = { x: W / 2, y: Hh / 2, vx: 0, vy: 0 }, sM = 0, sC = 0, prev = { x: me.x, y: me.y };
    const reset = (toMe) => { pk = { x: W / 2, y: Hh / 2 + (toMe ? 40 : -40), vx: 0, vy: 0 }; };
    const mv = (e) => { const p = pt(g, e); me.x = Math.max(R, Math.min(W - R, p.x)); me.y = Math.max(Hh / 2 + R, Math.min(Hh - R, p.y)); };
    g.on(g.cv, "pointerdown", mv); g.on(g.cv, "pointermove", mv);
    const hit = (m, mvx, mvy) => { const dx = pk.x - m.x, dy = pk.y - m.y, dist = Math.hypot(dx, dy); if (dist < R + PR && dist > 0) { const nx = dx / dist, ny = dy / dist; pk.x = m.x + nx * (R + PR); pk.y = m.y + ny * (R + PR); const dot = pk.vx * nx + pk.vy * ny; pk.vx -= 2 * dot * nx; pk.vy -= 2 * dot * ny; pk.vx += nx * 160 + mvx * 0.6; pk.vy += ny * 160 + mvy * 0.6; const sp = Math.hypot(pk.vx, pk.vy), mx = 900; if (sp > mx) { pk.vx *= mx / sp; pk.vy *= mx / sp; } } };
    g.loop((dt) => { if (!dt) return; const c = g.ctx; const mvx = (me.x - prev.x) / dt, mvy = (me.y - prev.y) / dt; prev = { x: me.x, y: me.y }; const sp = [150, 230, 320, 420][d], tx = pk.y < Hh / 2 ? pk.x : W / 2 + (pk.x - W / 2) * 0.3, ty = pk.y < Hh / 2 && pk.vy <= 60 ? Math.min(pk.y - 8, Hh / 2 - R) : 50; const ox = cp.x, oy = cp.y; cp.x += Math.max(-sp * dt, Math.min(sp * dt, tx - cp.x)); cp.y += Math.max(-sp * dt, Math.min(sp * dt, ty - cp.y)); cp.y = Math.max(R, Math.min(Hh / 2 - R, cp.y)); pk.x += pk.vx * dt; pk.y += pk.vy * dt; pk.vx *= 0.995; pk.vy *= 0.995; if (pk.x < PR) { pk.x = PR; pk.vx = Math.abs(pk.vx); } if (pk.x > W - PR) { pk.x = W - PR; pk.vx = -Math.abs(pk.vx); } const inGoal = Math.abs(pk.x - W / 2) < GW / 2; if (pk.y < PR) { if (inGoal) { sM++; reset(false); } else { pk.y = PR; pk.vy = Math.abs(pk.vy); } } if (pk.y > Hh - PR) { if (inGoal) { sC++; reset(true); } else { pk.y = Hh - PR; pk.vy = -Math.abs(pk.vy); } } hit(me, mvx, mvy); hit(cp, (cp.x - ox) / dt, (cp.y - oy) / dt); g.status("あなた " + sM + " - " + sC + " CPU"); if (sM >= 5 || sC >= 5) { g.finish(sM >= 5, false, sM >= 5 ? "5点先取！" : "CPUの勝ち", sM + " - " + sC); return; } c.fillStyle = "#e0f7fa"; c.fillRect(0, 0, W, Hh); c.strokeStyle = "#80deea"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, Hh / 2); c.lineTo(W, Hh / 2); c.stroke(); c.beginPath(); c.arc(W / 2, Hh / 2, 40, 0, 7); c.stroke(); c.fillStyle = "#37474f"; c.fillRect(W / 2 - GW / 2, 0, GW, 6); c.fillRect(W / 2 - GW / 2, Hh - 6, GW, 6); c.fillStyle = "#212121"; c.beginPath(); c.arc(pk.x, pk.y, PR, 0, 7); c.fill(); c.fillStyle = "#e53935"; c.beginPath(); c.arc(me.x, me.y, R, 0, 7); c.fill(); c.fillStyle = "#1e88e5"; c.beginPath(); c.arc(cp.x, cp.y, R, 0, 7); c.fill(); });
  });

  // 26) メテオよけ
  add("meteor", "☄️", "メテオよけ", "#6d4c41", "指で左右に動いて、落ちてくるメテオをよけ続けよう。目標の秒数たえたら勝ち。", (diff) => {
    const d = DX(diff), goal = [20, 30, 40, 50][d];
    const g = canvasGame("meteor", diff, "メテオよけ", "0 / " + goal + " 秒");
    let px = g.W / 2, ms = [], t = 0, sp = 0;
    const mv = (e) => (px = Math.max(16, Math.min(g.W - 16, pt(g, e).x)));
    g.on(g.cv, "pointerdown", mv); g.on(g.cv, "pointermove", mv);
    g.loop((dt) => { const c = g.ctx; t += dt; sp += dt; const rate = Math.max(0.12, [0.6, 0.45, 0.35, 0.28][d] - t * 0.006); if (sp > rate) { sp = 0; ms.push({ x: Math.random() * g.W, y: -20, v: 140 + Math.random() * 120 + t * 4 + d * 30, r: 10 + Math.random() * 10 }); } ms.forEach((m) => (m.y += m.v * dt)); ms = ms.filter((m) => m.y < g.H + 30); for (const m of ms) if (Math.hypot(m.x - px, m.y - (g.H - 30)) < m.r + 12) { g.finish(false, false, "当たった！", Math.floor(t) + "秒たえた（目標 " + goal + "）"); return; } g.status(Math.floor(t) + " / " + goal + " 秒"); if (t >= goal) { g.finish(true, false, "よけきった！"); return; } c.fillStyle = "#1a1030"; c.fillRect(0, 0, g.W, g.H); ms.forEach((m) => { c.fillStyle = "#ff7043"; c.beginPath(); c.arc(m.x, m.y, m.r, 0, 7); c.fill(); c.fillStyle = "rgba(255,200,80,.5)"; c.beginPath(); c.arc(m.x, m.y - m.r, m.r * 0.6, 0, 7); c.fill(); }); c.font = "26px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("🧑‍🚀", px, g.H - 30); });
  });

  // 27) タワー積み
  add("tower", "🏗️", "タワー積み", "#8e24aa", "左右に動くブロックを、タップでぴったり積もう。はみ出た分は切られる。目標の段数まで積んだら勝ち。", (diff) => {
    const d = DX(diff), goal = [8, 12, 16, 20][d];
    const g = canvasGame("tower", diff, "タワー積み", "0 / " + goal + " 段");
    const BH = 22; let stack = [{ x: g.W / 2 - 70, w: 140 }], cur = { x: 0, w: 140, dir: 1 }, speed = [120, 160, 200, 250][d];
    g.on(g.cv, "pointerdown", (e) => { e.preventDefault(); const top = stack[stack.length - 1]; const l = Math.max(top.x, cur.x), r = Math.min(top.x + top.w, cur.x + cur.w); if (r - l <= 2) { g.finish(false, false, "はずれた！", (stack.length - 1) + "段（目標 " + goal + "）"); return; } stack.push({ x: l, w: r - l }); window.GF.sound("soft"); if (stack.length - 1 >= goal) { g.finish(true, false, goal + "段完成！"); return; } cur = { x: Math.random() < 0.5 ? -(r - l) : g.W, w: r - l, dir: Math.random() < 0.5 ? 1 : -1 }; cur.x = cur.dir > 0 ? -cur.w : g.W; speed += 8; g.status((stack.length - 1) + " / " + goal + " 段"); });
    g.loop((dt) => { const c = g.ctx; cur.x += cur.dir * speed * dt; if (cur.x > g.W) cur.dir = -1; if (cur.x + cur.w < 0) cur.dir = 1; const off = Math.max(0, stack.length * BH - g.H * 0.6); c.fillStyle = "#1e1530"; c.fillRect(0, 0, g.W, g.H); stack.forEach((s, k) => { c.fillStyle = "hsl(" + (k * 25) % 360 + ",70%,60%)"; c.fillRect(s.x, g.H - (k + 1) * BH + off, s.w, BH - 2); }); c.fillStyle = "hsl(" + (stack.length * 25) % 360 + ",70%,60%)"; c.fillRect(cur.x, g.H - (stack.length + 1) * BH + off, cur.w, BH - 2); });
  });

  // 28) ハイウェイ
  add("highway", "🚗", "ハイウェイ", "#546e7a", "左右をタップして車線を変え、ほかの車をよけて目標のきょりまで走ろう。", (diff) => {
    const d = DX(diff), goal = [800, 1200, 1600, 2000][d];
    const g = canvasGame("highway", diff, "ハイウェイ", "0 / " + goal + " m");
    const L = 4, lw = g.W / L; let lane = 1, x = lw * 1.5, cars = [], dist = 0, sp = 0;
    g.on(g.cv, "pointerdown", (e) => { const p = pt(g, e); if (p.x < g.W / 2 && lane > 0) lane--; else if (p.x >= g.W / 2 && lane < L - 1) lane++; });
    g.on(window, "keydown", (e) => { if (e.key === "ArrowLeft" && lane > 0) lane--; if (e.key === "ArrowRight" && lane < L - 1) lane++; });
    g.loop((dt) => { const c = g.ctx; const v = 220 + d * 50 + dist * 0.05; dist += v * dt * 0.5; sp += dt; x += (lw * (lane + 0.5) - x) * Math.min(1, dt * 12); if (sp > [1, 0.8, 0.65, 0.5][d]) { sp = 0; const free = [0, 1, 2, 3].filter((k) => !cars.some((cc) => cc.l === k && cc.y < 120)); if (free.length > 1) cars.push({ l: free[rnd(free.length)], y: -50, e: ["🚙", "🚕", "🚌", "🚓"][rnd(4)] }); } cars.forEach((cc) => (cc.y += v * 0.6 * dt)); cars = cars.filter((cc) => cc.y < g.H + 40); for (const cc of cars) if (Math.abs(lw * (cc.l + 0.5) - x) < lw * 0.6 && Math.abs(cc.y - (g.H - 50)) < 40) { g.finish(false, false, "ぶつかった！", Math.floor(dist) + "m（目標 " + goal + "m）"); return; } g.status(Math.floor(dist) + " / " + goal + " m"); if (dist >= goal) { g.finish(true, false, "ゴール！"); return; } c.fillStyle = "#455a64"; c.fillRect(0, 0, g.W, g.H); c.strokeStyle = "#fff"; c.setLineDash([20, 20]); c.lineDashOffset = -dist * 2; c.lineWidth = 3; for (let k = 1; k < L; k++) { c.beginPath(); c.moveTo(k * lw, 0); c.lineTo(k * lw, g.H); c.stroke(); } c.setLineDash([]); c.font = "34px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; cars.forEach((cc) => c.fillText(cc.e, lw * (cc.l + 0.5), cc.y)); c.fillText("🏎️", x, g.H - 50); });
  });

  // 29) バブルシューター
  add("bubble", "🫧", "バブルシューター", "#ec407a", "ねらってタップするとバブルを発射。同じ色が3つ以上つながると消える。決められた発射数で全部消したら勝ち。", (diff) => {
    const d = DX(diff), rows = [3, 4, 5, 6][d], C = [3, 4, 4, 5][d];
    const g = canvasGame("bubble", diff, "バブルシューター", "");
    const COLS = ["#ef5350", "#42a5f5", "#66bb6a", "#ffca28", "#ab47bc"].slice(0, C), R = g.W / 16, COLN = 8;
    const grid = []; for (let r = 0; r < 14; r++) { grid.push(Array(COLN).fill(-1)); if (r < rows) for (let c = 0; c < COLN; c++) grid[r][c] = rnd(C); }
    let shotsLeft = [40, 40, 45, 50][d], cur = rnd(C), ball = null;
    const pos = (r, c) => ({ x: R + c * R * 2 + (r % 2 ? R : 0), y: R + r * R * 1.75 });
    const nbs = (r, c) => { const o = r % 2 ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]] : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]; return o.map(([dr, dc]) => [r + dr, c + dc]).filter(([a, b]) => a >= 0 && a < 14 && b >= 0 && b < COLN - (a % 2 ? 1 : 0)); };
    function settle(r, c) { grid[r][c] = ball.col; const same = [[r, c]], seen = new Set([r + "," + c]); for (let k = 0; k < same.length; k++) nbs(...same[k]).forEach(([a, b]) => { if (!seen.has(a + "," + b) && grid[a][b] === ball.col) { seen.add(a + "," + b); same.push([a, b]); } }); if (same.length >= 3) { same.forEach(([a, b]) => (grid[a][b] = -1)); const keep = new Set(), st = []; for (let c2 = 0; c2 < COLN; c2++) if (grid[0][c2] >= 0) { keep.add("0," + c2); st.push([0, c2]); } while (st.length) { const [a, b] = st.pop(); nbs(a, b).forEach(([x, y]) => { if (grid[x][y] >= 0 && !keep.has(x + "," + y)) { keep.add(x + "," + y); st.push([x, y]); } }); } for (let a = 0; a < 14; a++) for (let b = 0; b < COLN; b++) if (grid[a][b] >= 0 && !keep.has(a + "," + b)) grid[a][b] = -1; window.GF.sound("pikon"); } ball = null; const left = grid.flat().filter((x) => x >= 0); if (!left.length) { g.finish(true, false, "全部消した！"); return; } if (grid[12].some((x) => x >= 0)) { g.finish(false, false, "下まで来てしまった"); return; } if (shotsLeft <= 0) { g.finish(false, false, "発射数がなくなった", "のこり " + left.length + "こ"); return; } const colsLeft = [...new Set(left)]; cur = colsLeft[rnd(colsLeft.length)]; }
    g.on(g.cv, "pointerdown", (e) => { if (ball || g.over) return; const p = pt(g, e), ox = g.W / 2, oy = g.H - 30; let a = Math.atan2(p.y - oy, p.x - ox); if (a > -0.15) a = a > Math.PI / 2 ? -Math.PI + 0.15 : -0.15; ball = { x: ox, y: oy, vx: Math.cos(a) * 600, vy: Math.sin(a) * 600, col: cur }; shotsLeft--; });
    g.loop((dt) => { const c = g.ctx; if (ball) { for (let s = 0; s < 4 && ball; s++) { ball.x += (ball.vx * dt) / 4; ball.y += (ball.vy * dt) / 4; if (ball.x < R) { ball.x = R; ball.vx *= -1; } if (ball.x > g.W - R) { ball.x = g.W - R; ball.vx *= -1; } let hit = ball.y < R; for (let r = 0; r < 14 && !hit; r++) for (let cc = 0; cc < COLN; cc++) if (grid[r][cc] >= 0) { const q = pos(r, cc); if (Math.hypot(q.x - ball.x, q.y - ball.y) < R * 1.8) { hit = true; break; } } if (hit) { let best = null, bd = 1e9; for (let r = 0; r < 14; r++) for (let cc = 0; cc < COLN - (r % 2 ? 1 : 0); cc++) if (grid[r][cc] < 0 && (r === 0 || nbs(r, cc).some(([a, b]) => grid[a][b] >= 0))) { const q = pos(r, cc), dd = Math.hypot(q.x - ball.x, q.y - ball.y); if (dd < bd) { bd = dd; best = [r, cc]; } } if (best) settle(best[0], best[1]); else ball = null; } } } g.status("のこり発射 " + shotsLeft); c.fillStyle = "#1c1530"; c.fillRect(0, 0, g.W, g.H); for (let r = 0; r < 14; r++) for (let cc = 0; cc < COLN; cc++) if (grid[r][cc] >= 0) { const q = pos(r, cc); c.fillStyle = COLS[grid[r][cc]]; c.beginPath(); c.arc(q.x, q.y, R - 1, 0, 7); c.fill(); } c.strokeStyle = "rgba(255,255,255,.2)"; c.beginPath(); c.moveTo(0, pos(12, 0).y); c.lineTo(g.W, pos(12, 0).y); c.stroke(); const b = ball || { x: g.W / 2, y: g.H - 30, col: cur }; c.fillStyle = COLS[b.col]; c.beginPath(); c.arc(b.x, b.y, R - 1, 0, 7); c.fill(); });
  });

  // 30) PK戦
  add("pk", "⚽", "PK戦", "#2e7d32", "キッカーのときはけるコース、キーパーのときは飛ぶ方向をえらぶ。5本ずつでゴールが多いほうが勝ち。", (diff) => {
    const d = DX(diff);
    const g = H.shell("pk", diff, "PK戦", '<div class="hg-status"></div><div class="pk-goal"><div class="pk-ball">⚽</div><div class="pk-keeper">🧤</div></div><div class="hg-btns pk-b">' + ["左", "まん中", "右"].map((t, i) => '<button type="button" class="btn" data-k="' + i + '">' + t + "</button>").join("") + '</div><div class="hg-row"><b>あなた <span id="pk-m"></span></b><b>CPU <span id="pk-c"></span></b></div>');
    let round = 0, me = [], cpu = [], hist = [], busy = false;
    const kicking = () => round % 2 === 0;
    function cpuPredict() { if (d >= 2 && hist.length >= 2) { const cnt = [0, 0, 0]; hist.forEach((h) => cnt[h]++); const fav = cnt.indexOf(Math.max(...cnt)); if (Math.random() < [0, 0, 0.55, 0.7][d]) return fav; } return rnd(3); }
    function draw() { g.$("#pk-m").textContent = me.map((x) => (x ? "⭕" : "✖")).join(""); g.$("#pk-c").textContent = cpu.map((x) => (x ? "⭕" : "✖")).join(""); g.status(kicking() ? "あなたがキッカー：コースをえらぼう" : "あなたがキーパー：飛ぶ方向をえらぼう"); }
    function end() { const a = me.filter((x) => x).length, b = cpu.filter((x) => x).length; if (round >= 10 && round % 2 === 0) { if (a !== b) return g.finish(a > b, false, a > b ? "PK戦に勝った！" : "PK戦に負けた", a + " - " + b); if (round >= 20) return g.finish(false, true, "引き分け", a + " - " + b); } const rem = (n) => 5 - Math.min(5, n.length); if (round < 10 && (a + rem(me) < b || b + rem(cpu) < a)) return g.finish(a > b, false, a > b ? "PK戦に勝った！" : "PK戦に負けた", a + " - " + b); }
    g.on(g.$(".pk-b"), "click", (e) => { const t = e.target.closest("[data-k]"); if (!t || busy || g.over) return; busy = true; const k = +t.dataset.k; let goal; const ball = g.$(".pk-ball"), kp = g.$(".pk-keeper"); if (kicking()) { const dive = cpuPredict(); hist.push(k); const miss = Math.random() < 0.06; goal = !miss && dive !== k; ball.style.left = [18, 50, 82][k] + "%"; kp.style.left = [18, 50, 82][dive] + "%"; me.push(goal); } else { const shot = d === 0 ? rnd(3) : Math.random() < 0.15 * d ? (k + 1 + rnd(2)) % 3 : rnd(3); goal = shot !== k && Math.random() > 0.04; ball.style.left = [18, 50, 82][shot] + "%"; kp.style.left = [18, 50, 82][k] + "%"; cpu.push(goal); } ball.style.top = "18%"; g.status(goal ? "ゴール！" : "止めた／はずれ！"); setTimeout(() => { if (g.stopped) return; round++; ball.style.top = "80%"; ball.style.left = "50%"; kp.style.left = "50%"; busy = false; draw(); end(); }, 900); });
    draw();
  });

  // 31) 色ことば
  add("stroop", "🌈", "色ことば", "#f4511e", "文字の「意味」ではなく、文字の「色」をえらぼう。CPUより多く正解したら勝ち。", (diff) => {
    const d = DX(diff), secs = 30, cpuScore = [10, 15, 19, 23][d];
    const C = [["あか", "#e53935"], ["あお", "#1e88e5"], ["みどり", "#43a047"], ["きいろ", "#fdd835"]];
    const g = H.shell("stroop", diff, "色ことば", '<div class="hg-status"></div><div class="st-w"></div><div class="hg-btns st-b">' + C.map((c, i) => '<button type="button" class="btn" data-c="' + i + '" style="background:' + c[1] + ';color:#000;min-width:76px">' + c[0] + "</button>").join("") + "</div>");
    let ok = 0, ng = 0, col = 0; const t0 = performance.now();
    const next = () => { const w = rnd(4); do { col = rnd(4); } while (col === w && Math.random() < 0.8); g.$(".st-w").innerHTML = '<span style="color:' + C[col][1] + '">' + C[w][0] + "</span>"; };
    g.on(g.$(".st-b"), "click", (e) => { const t = e.target.closest("[data-c]"); if (!t || g.over) return; if (+t.dataset.c === col) { ok++; window.GF.sound("soft"); } else ng++; next(); });
    g.every(() => { const left = Math.max(0, secs - (performance.now() - t0) / 1000); g.status("のこり " + Math.ceil(left) + "秒 ・ 正解 " + ok + "（CPU " + cpuScore + "）"); if (left <= 0) g.finish(ok > cpuScore, ok === cpuScore, ok > cpuScore ? "CPUより多い！" : ok === cpuScore ? "引き分け" : "CPUの勝ち", "あなた " + ok + "（まちがい " + ng + "）・ CPU " + cpuScore); }, 200);
    next();
  });

  // 32) 計算バトル
  add("calcbattle", "➗", "計算バトル", "#1565c0", "CPUより先に計算の答えを入れよう。先に10問とったら勝ち。", (diff) => {
    const d = DX(diff), cpuT = [9, 6.5, 4.5, 3.2][d];
    const g = H.shell("calcbattle", diff, "計算バトル", '<div class="hg-status"></div><div class="cb-q num"></div><div class="cb-a num">　</div><div class="hg-rbar" style="width:80%"><i id="cb-t"></i></div><div class="keypad cb-k" style="width:min(86vw,320px)">' + "7894561230".split("").map((k) => '<button type="button" class="key" data-k="' + k + '">' + k + "</button>").join("") + '<button type="button" class="key" data-k="-">−</button><button type="button" class="key" data-k="del">⌫</button></div>');
    let a = 0, inp = "", me = 0, cp = 0, qt = 0;
    function q() { const t = rnd(d >= 2 ? 4 : 3); let x, y, s; if (t === 0) { x = 2 + rnd(20 + d * 30); y = 2 + rnd(20 + d * 30); a = x + y; s = x + " ＋ " + y; } else if (t === 1) { x = 10 + rnd(40 + d * 30); y = 1 + rnd(x); a = x - y; s = x + " − " + y; if (d === 3 && Math.random() < 0.4) { a = y - x; s = y + " − " + x; } } else if (t === 2) { x = 2 + rnd(8 + d); y = 2 + rnd(8 + d); a = x * y; s = x + " × " + y; } else { y = 2 + rnd(9); a = 2 + rnd(9); x = a * y; s = x + " ÷ " + y; } g.$(".cb-q").textContent = s + " ＝"; inp = ""; g.$(".cb-a").textContent = "　"; qt = performance.now(); }
    const st = () => g.status("あなた " + me + " ・ CPU " + cp + "（先に10問）");
    const check = () => { if (me >= 10) g.finish(true, false, "計算で勝った！", me + " - " + cp); else if (cp >= 10) g.finish(false, false, "CPUの勝ち", me + " - " + cp); };
    g.on(g.$(".cb-k"), "click", (e) => { const t = e.target.closest("[data-k]"); if (!t || g.over) return; const k = t.dataset.k; if (k === "del") inp = inp.slice(0, -1); else if (k === "-") inp = inp.startsWith("-") ? inp.slice(1) : "-" + inp; else if (inp.length < 5) inp += k; g.$(".cb-a").textContent = inp.replace("-", "−") || "　"; if (inp && +inp === a) { me++; window.GF.sound("pikon"); st(); check(); if (!g.over) q(); } });
    g.every(() => { const e = (performance.now() - qt) / 1000; g.$("#cb-t").style.width = Math.min(100, (e / cpuT) * 100) + "%"; if (e >= cpuT) { cp++; st(); check(); if (!g.over) { g.status("CPUが先に答えた（答え " + a + "）"); q(); } } }, 100);
    st(); q();
  });

  // 33) 記憶グリッド
  add("memgrid", "🧠", "記憶グリッド", "#5e35b1", "光ったマスを覚えて、同じマスをタップ。レベルが上がるとマスがふえる。目標レベルまで行けたら勝ち。", (diff) => {
    const d = DX(diff), goal = [5, 7, 9, 11][d];
    const g = H.shell("memgrid", diff, "記憶グリッド", '<div class="hg-status"></div><div class="hg-grid mg" style="width:min(86vw,340px);gap:6px"></div>');
    let lv = 1, target = new Set(), got = new Set(), input = false, miss = 0;
    function round() { const N = lv < 3 ? 3 : lv < 6 ? 4 : 5, k = 2 + lv; const grid = g.$(".mg"); grid.style.gridTemplateColumns = "repeat(" + N + ",1fr)"; grid.innerHTML = Array.from({ length: N * N }, (_, i) => '<button type="button" class="hg-cell" data-i="' + i + '"></button>').join(""); target = new Set(shuffle([...Array(N * N).keys()]).slice(0, Math.min(k, N * N - 1))); got = new Set(); miss = 0; input = false; g.status("レベル " + lv + " / " + goal + "：覚えて！"); g.$$(".hg-cell").forEach((el, i) => (el.style.background = target.has(i) ? "#ffd54f" : "rgba(255,255,255,.12)")); g.later(() => { g.$$(".hg-cell").forEach((el) => (el.style.background = "rgba(255,255,255,.12)")); input = true; g.status("レベル " + lv + "：" + target.size + "マスをタップ（まちがい2回まで）"); }, 900 + lv * 250 - d * 150); }
    g.on(g.$(".mg"), "click", (e) => { const t = e.target.closest("[data-i]"); if (!t || !input || g.over) return; const i = +t.dataset.i; if (got.has(i)) return; if (target.has(i)) { got.add(i); t.style.background = "#66bb6a"; if (got.size === target.size) { input = false; if (lv >= goal) { g.finish(true, false, "レベル" + goal + "クリア！"); return; } lv++; g.later(round, 600); } } else { t.style.background = "#e53935"; miss++; if (miss >= 2) { input = false; g.finish(false, false, "まちがいが2回", "レベル " + lv + "（目標 " + goal + "）"); } } });
    round();
  });
})();
