/* ほしまなび — 反射神経・パズルのゲーム（ブロック崩し / もぐらたたき / ランナー / 2048 / ナンプレ / お金パズル）。すべてオリジナル実装 */
(() => {
  "use strict";
  const R = (window.GCGames = window.GCGames || {
    open: {},
    active: null,
    stop() { const a = this.active; this.active = null; if (a && a.stop) { try { a.stop(); } catch (e) {} } },
  });
  const rnd = (n) => Math.floor(Math.random() * n);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function setupCanvas(cv, w, h) { const dpr = Math.min(window.devicePixelRatio || 1, 3); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + "px"; cv.style.height = h + "px"; const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function shell(id, diff, title, html) {
    const GF = window.GF;
    const game = { id, diff, timers: [], raf: 0, stopped: false, over: false, listeners: [] };
    game.later = (fn, ms) => { const t = setTimeout(() => { if (!game.stopped) fn(); }, ms); game.timers.push(t); return t; };
    game.every = (fn, ms) => { const t = setInterval(() => { if (!game.stopped) fn(); }, ms); game.timers.push(t); return t; };
    game.on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); game.listeners.push([el, ev, fn, opt]); };
    game.stop = () => { game.stopped = true; game.timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); cancelAnimationFrame(game.raf); game.listeners.forEach(([el, ev, fn, opt]) => el.removeEventListener(ev, fn, opt)); };
    const body = GF.openLayer(title + "（" + GF.diffName(diff) + "）", () => { if (R.active === game) R.stop(); else game.stop(); });
    R.active = game;
    body.innerHTML = html;
    game.body = body;
    game.$ = (s) => body.querySelector(s);
    game.finish = (win, draw, t, text, metric) => {
      if (game.over) return;
      game.over = true; cancelAnimationFrame(game.raf);
      const reward = GF.reportGame(id, diff, !!win, { metric: metric || (typeof game.metric === "function" ? game.metric(!!win) : game.metric) || null });
      game.later(() => GF.showResult({ win: !!win, draw: !!draw, title: t, text, reward, onRetry: () => R.open[id](diff) }), 500);
    };
    // rAF ループ（dtは最大50msに制限）
    game.loop = (step) => {
      let lastT = null;
      const frame = (ts) => {
        if (game.stopped || game.over) return;
        const dt = lastT == null ? 0 : Math.min(0.05, (ts - lastT) / 1000);
        lastT = ts;
        step(dt);
        if (!game.stopped && !game.over) game.raf = requestAnimationFrame(frame);
      };
      game.raf = requestAnimationFrame(frame);
    };
    return game;
  }
  const hud = (items) => items.map((x) => "<span>" + x + "</span>").join("");

  /* =====================================================
   * ブロック崩し：CPUより先に全部消す
   * ===================================================== */
  const BO = { easy: { rows: 4, speed: 250, cpu: 150, hard: 0 }, normal: { rows: 5, speed: 300, cpu: 105, hard: 0.1 }, hard: { rows: 6, speed: 360, cpu: 80, hard: 0.25 }, ultra: { rows: 7, speed: 430, cpu: 56, hard: 0.4 } };
  R.open.breakout = function (diff) {
    const GF = window.GF, adv = GF.advantage(), cfg = BO[diff] || BO.normal;
    const g = shell("breakout", diff, "ブロック崩し", '<div class="ag-wrap"><div class="cg-hud" id="ag-hud"></div><div class="ag-race"><span>あなた</span><b class="trk"><i class="me" id="race-me"></i></b><span>🤖</span><b class="trk"><i class="cpu" id="race-cpu"></i></b></div><div class="cg-stage" id="ag-stage"><canvas id="ag-cv" aria-label="ブロック崩しの画面"></canvas></div><p class="cg-tip">画面をドラッグしてパドルを動かし、タップで発射。CPUより先にブロックを全部消せば勝ち。</p></div>');
    const stage = g.$("#ag-stage"), cv = g.$("#ag-cv");
    const W = clamp(stage.clientWidth || 360, 280, 440), H = clamp(stage.clientHeight || 460, 360, 620);
    const ctx = setupCanvas(cv, W, H);
    const cols = 8, bw = (W - 20) / cols, bh = 18, top = 46;
    const bricks = [];
    for (let r = 0; r < cfg.rows; r++) for (let c = 0; c < cols; c++) bricks.push({ x: 10 + c * bw, y: top + r * (bh + 6), w: bw - 4, h: bh, hp: Math.random() < cfg.hard ? 2 : 1, r });
    const total = bricks.length;
    const pw = 72 * (1 + adv.paddle / 100), paddle = { x: W / 2 - pw / 2, y: H - 34, w: pw, h: 12 };
    const ball = { x: W / 2, y: paddle.y - 8, vx: 0, vy: 0, r: 6, stuck: true };
    let lives = 3, t = 0, cpuP = 0, started = false, autoT = 2.2, speedMul = 1, msg = "", msgT = 0;
    const jitter = 0.92 + Math.random() * 0.16;
    const launch = () => { if (!ball.stuck || g.over) return; const a = (-Math.PI / 2) + (Math.random() - 0.5) * 0.6; ball.vx = Math.cos(a) * cfg.speed * speedMul; ball.vy = Math.sin(a) * cfg.speed * speedMul; ball.stuck = false; started = true; };
    const setX = (clientX) => { const r = cv.getBoundingClientRect(); paddle.x = clamp(clientX - r.left - paddle.w / 2, 0, W - paddle.w); };
    g.on(cv, "pointerdown", (e) => { setX(e.clientX); launch(); });
    g.on(cv, "pointermove", (e) => { if (e.pointerType === "mouse" && !e.buttons) { setX(e.clientX); return; } setX(e.clientX); });
    g.on(window, "keydown", (e) => { if (e.key === "ArrowLeft") paddle.x = clamp(paddle.x - 28, 0, W - paddle.w); if (e.key === "ArrowRight") paddle.x = clamp(paddle.x + 28, 0, W - paddle.w); if (e.key === " ") launch(); });
    const left = () => bricks.filter((b) => b.hp > 0).length;
    function step(dt) {
      t += dt;
      if (ball.stuck) { ball.x = paddle.x + paddle.w / 2; ball.y = paddle.y - ball.r - 1; autoT -= dt; if (autoT <= 0) launch(); }
      if (started) cpuP = Math.min(1, cpuP + (dt / cfg.cpu) * jitter);
      if (!ball.stuck) {
        const n = 3;
        for (let k = 0; k < n; k++) {
          const px = ball.x, py = ball.y;
          ball.x += (ball.vx * dt) / n; ball.y += (ball.vy * dt) / n;
          if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
          if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
          if (ball.y < ball.r + 30) { ball.y = ball.r + 30; ball.vy = Math.abs(ball.vy); }
          if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h && ball.x >= paddle.x - ball.r && ball.x <= paddle.x + paddle.w + ball.r) {
            const off = clamp((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2), -1, 1);
            const sp = Math.hypot(ball.vx, ball.vy), a = -Math.PI / 2 + off * 1.05;
            ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp; ball.y = paddle.y - ball.r - 0.5;
            GF.haptic && GF.haptic(8);
          }
          for (const b of bricks) {
            if (b.hp <= 0) continue;
            if (ball.x + ball.r < b.x || ball.x - ball.r > b.x + b.w || ball.y + ball.r < b.y || ball.y - ball.r > b.y + b.h) continue;
            b.hp--;
            const fromSide = px + ball.r <= b.x || px - ball.r >= b.x + b.w;
            if (fromSide) ball.vx = -ball.vx; else ball.vy = -ball.vy;
            speedMul = Math.min(1.28, speedMul + 0.006);
            const sp = Math.hypot(ball.vx, ball.vy), want = cfg.speed * speedMul;
            ball.vx *= want / sp; ball.vy *= want / sp;
            break;
          }
          if (ball.y - ball.r > H) {
            lives--; ball.stuck = true; autoT = 1.6; msg = lives > 0 ? "ボールを落としました" : ""; msgT = 1.2;
            if (lives <= 0) return g.finish(false, false, "CPUの勝ち", "ボールがなくなりました（残り " + left() + "個）");
            break;
          }
        }
      }
      const rem = left();
      if (rem === 0) return g.finish(true, false, "勝利！", "CPUより先に全部消しました（" + t.toFixed(1) + "秒）");
      if (cpuP >= 1) return g.finish(false, false, "CPUの勝ち", "CPUが先に全部消しました（残り " + rem + "個）");
      if (msgT > 0) msgT -= dt;
      draw(rem);
    }
    function draw(rem) {
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#14232a"); bg.addColorStop(1, "#0b1418"); ctx.fillStyle = bg; rr(ctx, 0, 0, W, H, 14); ctx.fill();
      const cols2 = ["#e8b85a", "#e59a7f", "#74c3b3", "#8fb0e8", "#b79bdb", "#a8c97f", "#f0a04b"];
      bricks.forEach((b) => { if (b.hp <= 0) return; ctx.fillStyle = b.hp > 1 ? "#d9dde2" : cols2[b.r % cols2.length]; rr(ctx, b.x, b.y, b.w, b.h, 5); ctx.fill(); if (b.hp > 1) { ctx.strokeStyle = "#8a9096"; ctx.lineWidth = 2; ctx.stroke(); } });
      ctx.fillStyle = "#f3f1ea"; rr(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 6); ctx.fill();
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fillStyle = "#ffd34d"; ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = "600 13px sans-serif"; ctx.textAlign = "left"; ctx.fillText("❤️".repeat(Math.max(0, lives)), 10, 22);
      ctx.textAlign = "right"; ctx.fillText("のこり " + rem + " / " + total, W - 10, 22);
      if (ball.stuck && !g.over) { ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "700 15px sans-serif"; ctx.fillText(msgT > 0 && msg ? msg : "タップで発射", W / 2, H * 0.62); if (adv.paddle) { ctx.font = "500 12px sans-serif"; ctx.fillText("レベル有利：パドル +" + adv.paddle + "%", W / 2, H * 0.62 + 22); } }
      g.$("#ag-hud").innerHTML = hud(["⏱ " + t.toFixed(0) + "秒", "あなた " + Math.round(((total - rem) / total) * 100) + "%", "🤖 CPU " + Math.round(cpuP * 100) + "%"]);
      g.$("#race-me").style.width = ((total - rem) / total) * 100 + "%"; g.$("#race-cpu").style.width = cpuP * 100 + "%";
    }
    g.debug = { forceWin: () => bricks.forEach((b) => (b.hp = 0)), state: () => ({ lives, cpuP, left: left() }) };
    draw(total);
    g.loop(step);
  };

  /* =====================================================
   * もぐらたたき：CPUより高い点数を
   * ===================================================== */
  const MO = { easy: { gap: 950, up: 1250, max: 2, cpu: 0.33, bomb: 0.08 }, normal: { gap: 780, up: 1000, max: 2, cpu: 0.55, bomb: 0.1 }, hard: { gap: 620, up: 820, max: 3, cpu: 0.74, bomb: 0.14 }, ultra: { gap: 500, up: 680, max: 3, cpu: 0.93, bomb: 0.16 } };
  const MOLE_SVG = '<svg viewBox="0 0 60 60" aria-hidden="true"><ellipse cx="30" cy="34" rx="20" ry="22" fill="#8a5a3b"/><ellipse cx="30" cy="40" rx="12" ry="11" fill="#c9926a"/><circle cx="23" cy="28" r="3" fill="#1d1d1d"/><circle cx="37" cy="28" r="3" fill="#1d1d1d"/><ellipse cx="30" cy="35" rx="5" ry="4" fill="#e77a8c"/><path d="M26 42 h8" stroke="#5b3a26" stroke-width="2" stroke-linecap="round"/></svg>';
  R.open.mole = function (diff) {
    const GF = window.GF, adv = GF.advantage(), cfg = MO[diff] || MO.normal;
    const BASE = 30, TOTAL = BASE + adv.moleSec;
    const g = shell("mole", diff, "もぐらたたき", '<div class="ag-wrap"><div class="cg-hud" id="ag-hud"></div><div class="mo-grid" id="mo-grid">' + Array.from({ length: 9 }, (_, i) => '<button type="button" class="mo-hole" data-h="' + i + '" aria-label="穴' + (i + 1) + '"><span class="mo-pop"></span></button>').join("") + '</div><p class="cg-tip">出てきたもぐらをタップ（+1）。🪙金のもぐらは+3、💣はさわると−2。CPUより高い点数で勝ち。' + (adv.moleSec ? "<br>レベル有利：あなただけ +" + adv.moleSec + "秒（CPUは30秒）" : "") + '</p><div class="mo-start" id="mo-start"><button type="button" class="btn primary" id="mo-go">スタート</button></div></div>');
    const holes = Array.from({ length: 9 }, () => ({ kind: null, until: 0, hit: false }));
    let score = 0, cpu = 0, t = 0, running = false, nextSpawn = 0.6, hits = 0;
    const grid = g.$("#mo-grid");
    function renderHole(i) {
      const el = grid.children[i], h = holes[i];
      el.classList.toggle("up", !!h.kind && !h.hit); el.classList.toggle("hit", h.hit);
      el.querySelector(".mo-pop").innerHTML = h.kind === "bomb" ? '<span class="mo-bomb">💣</span>' : h.kind ? MOLE_SVG + (h.kind === "gold" ? '<span class="mo-gold">🪙</span>' : "") : "";
    }
    function drawHud() { g.$("#ag-hud").innerHTML = hud(["⏱ " + Math.max(0, TOTAL - t).toFixed(1) + "秒", "あなた " + score + "点", "🤖 CPU " + cpu + "点" + (t >= BASE ? "（終了）" : "")]); }
    function spawn() {
      const up = holes.filter((h) => h.kind && !h.hit).length;
      if (up >= cfg.max) return;
      const free = holes.map((h, i) => i).filter((i) => !holes[i].kind);
      if (!free.length) return;
      const i = free[rnd(free.length)], r = Math.random();
      const kind = r < cfg.bomb ? "bomb" : r < cfg.bomb + 0.1 ? "gold" : "mole";
      holes[i] = { kind, until: t + (cfg.up * (0.8 + Math.random() * 0.4)) / 1000, hit: false };
      if (t < BASE && kind !== "bomb" && Math.random() < cfg.cpu) cpu += kind === "gold" ? 3 : 1;
      renderHole(i);
    }
    g.on(grid, "pointerdown", (e) => {
      const b = e.target.closest("[data-h]"); if (!b || !running) return;
      e.preventDefault();
      const i = +b.dataset.h, h = holes[i];
      if (!h.kind || h.hit) return;
      h.hit = true; h.until = t + 0.25;
      if (h.kind === "bomb") { score = Math.max(0, score - 2); GF.haptic && GF.haptic([20, 40, 20]); } else { score += h.kind === "gold" ? 3 : 1; hits++; GF.haptic && GF.haptic(10); }
      renderHole(i); drawHud();
    });
    function step(dt) {
      if (!running) return;
      t += dt;
      nextSpawn -= dt;
      if (nextSpawn <= 0) { spawn(); nextSpawn = (cfg.gap * (0.7 + Math.random() * 0.6)) / 1000; }
      holes.forEach((h, i) => { if (h.kind && t >= h.until) { holes[i] = { kind: null, until: 0, hit: false }; renderHole(i); } });
      drawHud();
      if (t >= TOTAL) {
        running = false;
        if (score > cpu) g.finish(true, false, "勝利！", "あなた " + score + "点 − CPU " + cpu + "点");
        else if (score === cpu) g.finish(false, true, "引き分け", "どちらも " + score + "点");
        else g.finish(false, false, "CPUの勝ち", "あなた " + score + "点 − CPU " + cpu + "点");
      }
    }
    const start = () => { if (running || g.over) return; const s = g.$("#mo-start"); if (s) s.remove(); running = true; };
    g.$("#mo-go").addEventListener("click", start);
    g.later(start, 2500); // 押さなくても始まる
    g.debug = { start, holes: () => holes, hit: (i) => grid.children[i].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })), forceWin: () => { start(); score = 999; t = TOTAL; }, state: () => ({ score, cpu, t, running }) };
    holes.forEach((_, i) => renderHole(i)); drawHud();
    g.loop(step);
  };

  /* =====================================================
   * ランナー：障害物をよけて、CPUより先にゴール
   * ===================================================== */
  const RU = { easy: { goal: 500, speed: 250, gap: [1.25, 2.0], cpu: 1.4 }, normal: { goal: 700, speed: 290, gap: [1.0, 1.7], cpu: 1.2 }, hard: { goal: 900, speed: 330, gap: [0.85, 1.45], cpu: 1.09 }, ultra: { goal: 1100, speed: 380, gap: [0.72, 1.25], cpu: 1.025 } };
  R.open.runner = function (diff) {
    const GF = window.GF, adv = GF.advantage(), cfg = RU[diff] || RU.normal;
    const g = shell("runner", diff, "ランナー", '<div class="ag-wrap"><div class="cg-hud" id="ag-hud"></div><div class="ag-race"><span>あなた</span><b class="trk"><i class="me" id="race-me"></i></b><span>🤖</span><b class="trk"><i class="cpu" id="race-cpu"></i></b></div><div class="cg-stage" id="ag-stage"><canvas id="ag-cv" aria-label="ランナーの画面"></canvas></div><button type="button" class="cg-btn hand ru-jump" id="ru-jump">ジャンプ</button><p class="cg-tip">画面かボタンをタップでジャンプ（空中でもう1回できます）。ぶつかるとライフが減って少し遅くなります。</p></div>');
    const stage = g.$("#ag-stage"), cv = g.$("#ag-cv");
    const W = clamp(stage.clientWidth || 360, 280, 460), H = clamp(Math.min(stage.clientHeight || 300, 320), 220, 320);
    const ctx = setupCanvas(cv, W, H);
    const ground = H - 46, PX = 70, img = GF.charImage();
    const p = { y: 0, vy: 0, jumps: 0, inv: 0, slow: 0 };
    const PXM = 30; // 30px = 1m
    const nominalTime = (cfg.goal * PXM) / cfg.speed;
    const cpuSpeed = cfg.goal / (nominalTime * cfg.cpu); // m/s
    let dist = 0, cpuDist = 0, t = 0, lives = 3 + adv.lives, obs = [], nextObs = 1.4, scroll = 0, count = 3;
    const jump = () => { if (g.over || count > 0) return; if (p.jumps < 2) { p.vy = p.jumps ? -560 : -640; p.jumps++; } };
    g.on(cv, "pointerdown", (e) => { e.preventDefault(); jump(); });
    g.$("#ru-jump").addEventListener("pointerdown", (e) => { e.preventDefault(); jump(); });
    g.on(window, "keydown", (e) => { if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); jump(); } });
    function step(dt) {
      if (count > 0) { count -= dt; draw(); return; }
      t += dt;
      const sp = cfg.speed * (p.slow > 0 ? 0.45 : 1);
      scroll += sp * dt; dist += (sp * dt) / PXM; cpuDist += cpuSpeed * dt;
      p.vy += 1900 * dt; p.y += p.vy * dt; if (p.y > 0) { p.y = 0; p.vy = 0; p.jumps = 0; }
      if (p.inv > 0) p.inv -= dt; if (p.slow > 0) p.slow -= dt;
      nextObs -= dt;
      if (nextObs <= 0 && dist < cfg.goal - 15) {
        const tall = Math.random() < 0.35, w = 18 + rnd(16), h = tall ? 46 : 26 + rnd(10);
        obs.push({ x: W + 20, w, h, kind: Math.random() < 0.5 ? "rock" : "cone" });
        if (diff !== "easy" && Math.random() < (diff === "ultra" ? 0.3 : 0.18)) obs.push({ x: W + 20 + w + 70 + rnd(30), w: 18, h: 26, kind: "rock" });
        nextObs = cfg.gap[0] + Math.random() * (cfg.gap[1] - cfg.gap[0]);
      }
      obs.forEach((o) => (o.x -= sp * dt));
      obs = obs.filter((o) => o.x + o.w > -10);
      const px1 = PX - 14, px2 = PX + 14, py2 = ground + p.y, py1 = py2 - 40;
      for (const o of obs) {
        if (o.hit || p.inv > 0) continue;
        if (px2 > o.x + 3 && px1 < o.x + o.w - 3 && py2 > ground - o.h + 3) {
          o.hit = true; lives--; p.inv = 1.4; p.slow = 1.1; GF.haptic && GF.haptic([20, 40, 20]);
          if (lives <= 0) { draw(); return g.finish(false, false, "CPUの勝ち", "ライフがなくなりました（" + Math.floor(dist) + "m）"); }
        }
      }
      if (dist >= cfg.goal) { draw(); return g.finish(true, false, "勝利！", "CPUより先にゴール（" + t.toFixed(1) + "秒）"); }
      if (cpuDist >= cfg.goal) { draw(); return g.finish(false, false, "CPUの勝ち", "CPUが先にゴール（あなた " + Math.floor(dist) + "m / " + cfg.goal + "m）"); }
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#9ccfe0"); sky.addColorStop(1, "#e7f3c8"); ctx.fillStyle = sky; rr(ctx, 0, 0, W, H, 14); ctx.fill();
      ctx.fillStyle = "#a6cd9d"; for (let i = -1; i < 4; i++) { const x = ((i * 180 - (scroll * 0.3) % 180) + 180) % (W + 180) - 90; ctx.beginPath(); ctx.ellipse(x, ground + 6, 120, 50, 0, Math.PI, 0); ctx.fill(); }
      ctx.fillStyle = "#3f7a52"; ctx.fillRect(0, ground, W, H - ground);
      ctx.fillStyle = "#2f6d48"; for (let x = -((scroll) % 40); x < W; x += 40) ctx.fillRect(x, ground + 10, 20, 4);
      // ゴール旗
      const goalX = PX + (cfg.goal - dist) * PXM;
      if (goalX < W + 40) { ctx.fillStyle = "#fff"; ctx.fillRect(goalX, ground - 70, 4, 70); ctx.fillStyle = "#e2553c"; ctx.fillRect(goalX + 4, ground - 70, 30, 18); }
      // CPUゴースト
      const gx = PX + (cpuDist - dist) * PXM;
      if (gx > -30 && gx < W + 30) { ctx.globalAlpha = 0.45; ctx.font = "30px sans-serif"; ctx.textAlign = "center"; ctx.fillText("🤖", gx, ground - 6); ctx.globalAlpha = 1; }
      obs.forEach((o) => { ctx.fillStyle = o.kind === "rock" ? "#8a8f94" : "#f0a04b"; if (o.kind === "rock") { rr(ctx, o.x, ground - o.h, o.w, o.h, 8); ctx.fill(); } else { ctx.beginPath(); ctx.moveTo(o.x, ground); ctx.lineTo(o.x + o.w / 2, ground - o.h); ctx.lineTo(o.x + o.w, ground); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(o.x + o.w * 0.3, ground - o.h * 0.5, o.w * 0.4, 4); } });
      if (!(p.inv > 0 && Math.floor(t * 10) % 2)) { if (img && img.complete && img.naturalWidth) ctx.drawImage(img, PX - 24, ground + p.y - 52, 48, 53); else { ctx.fillStyle = "#86cf7f"; ctx.beginPath(); ctx.arc(PX, ground + p.y - 22, 20, 0, Math.PI * 2); ctx.fill(); } }
      ctx.fillStyle = "rgba(20,30,30,.75)"; ctx.font = "600 13px sans-serif"; ctx.textAlign = "left"; ctx.fillText("❤️".repeat(Math.max(0, lives)), 10, 22);
      if (count > 0) { ctx.textAlign = "center"; ctx.font = "800 40px sans-serif"; ctx.fillStyle = "#1c2024"; ctx.fillText(String(Math.ceil(count)), W / 2, H / 2); if (adv.lives) { ctx.font = "600 13px sans-serif"; ctx.fillText("レベル有利：ライフ +" + adv.lives, W / 2, H / 2 + 28); } }
      g.$("#ag-hud").innerHTML = hud(["⏱ " + t.toFixed(1) + "秒", "あなた " + Math.floor(dist) + "m", "🤖 " + Math.floor(cpuDist) + "m / " + cfg.goal + "m"]);
      g.$("#race-me").style.width = Math.min(100, (dist / cfg.goal) * 100) + "%"; g.$("#race-cpu").style.width = Math.min(100, (cpuDist / cfg.goal) * 100) + "%";
    }
    g.debug = { jump, forceWin: () => { count = 0; dist = cfg.goal - 0.1; obs = []; }, state: () => ({ dist, cpuDist, lives }) };
    draw(); g.loop(step);
  };

  /* =====================================================
   * 2048：CPUより少ない手数で目標の数字へ
   * ===================================================== */
  const T2 = { easy: { target: 256, limit: 260 }, normal: { target: 512, limit: 420 }, hard: { target: 1024, limit: 700 }, ultra: { target: 2048, limit: 1000 } };
  function slideRow(row) {
    const a = row.filter((x) => x), out = []; let gain = 0;
    for (let i = 0; i < a.length; i++) { if (a[i] === a[i + 1]) { out.push(a[i] * 2); gain += a[i] * 2; i++; } else out.push(a[i]); }
    while (out.length < 4) out.push(0);
    return { out, gain };
  }
  function move2048(b, dir) { // 0左 1上 2右 3下
    const nb = b.slice(); let moved = false, gain = 0;
    for (let k = 0; k < 4; k++) {
      const idx = [0, 1, 2, 3].map((j) => (dir === 0 ? k * 4 + j : dir === 2 ? k * 4 + (3 - j) : dir === 1 ? j * 4 + k : (3 - j) * 4 + k));
      const res = slideRow(idx.map((i) => b[i]));
      idx.forEach((i, j) => { if (nb[i] !== res.out[j]) moved = true; nb[i] = res.out[j]; });
      gain += res.gain;
    }
    return { b: nb, moved, gain };
  }
  const canMove2048 = (b) => [0, 1, 2, 3].some((d) => move2048(b, d).moved);
  R.open.g2048 = function (diff) {
    const GF = window.GF, adv = GF.advantage(), cfg = T2[diff] || T2.normal;
    const g = shell("g2048", diff, "2048", '<div class="ag-wrap t2"><div class="cg-hud" id="ag-hud"></div><div class="t2-goal" id="t2-goal"></div><div class="t2-board" id="t2-board" aria-label="2048の盤"></div><div class="t2-ctrl"><button type="button" class="btn sm ghost" data-d="0" aria-label="左">◀</button><button type="button" class="btn sm ghost" data-d="1" aria-label="上">▲</button><button type="button" class="btn sm ghost" data-d="3" aria-label="下">▼</button><button type="button" class="btn sm ghost" data-d="2" aria-label="右">▶</button><button type="button" class="btn sm ghost" id="t2-undo">↩ もどす</button></div><p class="cg-tip">盤をスワイプ（または矢印）で動かして、同じ数字を合体。</p></div>');
    let b = Array(16).fill(0), moves = 0, score = 0, undos = adv.undo2048, prev = null, lastNew = -1;
    const add = () => { const e = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); if (!e.length) return; lastNew = e[rnd(e.length)]; b[lastNew] = Math.random() < 0.9 ? 2 : 4; };
    add(); add();
    const boardEl = g.$("#t2-board");
    function render(merged) {
      boardEl.innerHTML = b.map((v, i) => '<div class="t2-cell"><span class="t2-tile v' + Math.min(v, 4096) + (i === lastNew ? " new" : "") + (merged && merged.includes(i) ? " merge" : "") + '">' + (v || "") + "</span></div>").join("");
      const mx = Math.max(...b);
      g.$("#ag-hud").innerHTML = hud(["手数 " + moves + " / " + cfg.limit, "最大 " + mx, "スコア " + score]);
      g.$("#t2-goal").innerHTML = "目標 <b>" + cfg.target + "</b>　🤖 CPUは <b>" + cfg.limit + "手</b> で到達";
      const u = g.$("#t2-undo"); u.disabled = !(undos > 0 && prev); u.textContent = "↩ もどす " + undos;
    }
    function doMove(d) {
      if (g.over) return;
      const r = move2048(b, d); if (!r.moved) return;
      prev = { b: b.slice(), moves, score };
      const merged = r.b.map((v, i) => (v && v !== b[i] && b.some((x) => x === v / 2) ? i : -1)).filter((i) => i >= 0);
      b = r.b; score += r.gain; moves++; add(); render(merged);
      if (Math.max(...b) >= cfg.target) return g.finish(true, false, "勝利！", moves + "手で " + cfg.target + " に到達（CPUは" + cfg.limit + "手）");
      if (moves >= cfg.limit) return g.finish(false, false, "CPUの勝ち", "CPUの手数（" + cfg.limit + "手）に達しました（最大 " + Math.max(...b) + "）");
      if (!canMove2048(b)) return g.finish(false, false, "動かせなくなりました", "最大 " + Math.max(...b) + "（目標 " + cfg.target + "）");
    }
    g.$(".t2-ctrl").addEventListener("click", (e) => { const x = e.target.closest("[data-d]"); if (x) doMove(+x.dataset.d); });
    g.$("#t2-undo").addEventListener("click", () => { if (undos <= 0 || !prev || g.over) return; b = prev.b; moves = prev.moves; score = prev.score; prev = null; undos--; lastNew = -1; render(); });
    let sx = 0, sy = 0, down = false;
    g.on(boardEl, "pointerdown", (e) => { down = true; sx = e.clientX; sy = e.clientY; });
    g.on(window, "pointerup", (e) => { if (!down) return; down = false; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; doMove(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 2) : dy < 0 ? 1 : 3); });
    g.on(window, "keydown", (e) => { const m = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 }[e.key]; if (m != null) { e.preventDefault(); doMove(m); } });
    g.debug = { move: doMove, canMove: () => canMove2048(b), forceWin: () => { b[0] = cfg.target / 2; b[1] = cfg.target / 2; b[2] = 0; b[3] = 0; doMove(0); }, state: () => ({ b, moves }) };
    render();
  };

  /* =====================================================
   * ナンプレ（9×9）：CPUが解き終わる前に解く
   * ===================================================== */
  const SU = { easy: { givens: 42, time: 15 * 60 }, normal: { givens: 35, time: 12 * 60 }, hard: { givens: 30, time: 10 * 60 }, ultra: { givens: 26, time: 7 * 60 } };
  const BOX = (i) => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);
  function suSolve(g0, limit, randomize) {
    const g = g0.slice(), rows = Array(9).fill(0), cols = Array(9).fill(0), boxes = Array(9).fill(0);
    for (let i = 0; i < 81; i++) if (g[i]) { const m = 1 << g[i]; rows[Math.floor(i / 9)] |= m; cols[i % 9] |= m; boxes[BOX(i)] |= m; }
    let count = 0, sol = null;
    (function rec() {
      if (count >= limit) return;
      let best = -1, bestMask = 0, bestN = 10;
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue;
        const mask = ~(rows[Math.floor(i / 9)] | cols[i % 9] | boxes[BOX(i)]) & 0x3fe;
        let n = 0; for (let m = mask; m; m &= m - 1) n++;
        if (n < bestN) { best = i; bestMask = mask; bestN = n; if (n <= 1) break; }
      }
      if (best < 0) { count++; if (!sol) sol = g.slice(); return; }
      if (!bestN) return;
      const ds = []; for (let d = 1; d <= 9; d++) if (bestMask & (1 << d)) ds.push(d);
      if (randomize) shuffle(ds);
      const r = Math.floor(best / 9), c = best % 9, bx = BOX(best);
      for (const d of ds) {
        const m = 1 << d; g[best] = d; rows[r] |= m; cols[c] |= m; boxes[bx] |= m;
        rec();
        g[best] = 0; rows[r] &= ~m; cols[c] &= ~m; boxes[bx] &= ~m;
        if (count >= limit) return;
      }
    })();
    return { count, sol };
  }
  function suGenerate(givens) {
    const full = suSolve(Array(81).fill(0), 1, true).sol;
    const puz = full.slice();
    let filled = 81;
    for (const i of shuffle([...Array(81).keys()])) {
      if (filled <= givens) break;
      const v = puz[i]; puz[i] = 0;
      if (suSolve(puz, 2, false).count !== 1) puz[i] = v; else filled--;
    }
    return { puz, sol: full };
  }
  R.open.sudoku = function (diff) {
    const GF = window.GF, adv = GF.advantage(), cfg = SU[diff] || SU.normal;
    const g = shell("sudoku", diff, "ナンプレ", '<div class="ag-wrap su"><div class="cg-hud" id="ag-hud"></div><div class="ag-race"><span>🤖 CPU</span><b class="trk"><i class="cpu" id="race-cpu"></i></b></div><div class="su-board" id="su-board" role="grid" aria-label="ナンプレの盤"></div><div class="su-pad" id="su-pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => '<button type="button" data-d="' + d + '">' + d + "</button>").join("") + '</div><div class="su-tools"><button type="button" class="btn sm ghost" data-t="memo" aria-pressed="false">✏️ メモ</button><button type="button" class="btn sm ghost" data-t="erase">消す</button><button type="button" class="btn sm ghost" data-t="hint" id="su-hint">💡 ヒント</button></div></div>');
    const { puz, sol } = suGenerate(cfg.givens);
    const given = puz.map((v) => !!v), cur = puz.slice(), notes = Array(81).fill(0);
    let sel = -1, memo = false, mistakes = 0, t = 0, hints = adv.sudokuHints, wrong = -1;
    const boardEl = g.$("#su-board");
    function render() {
      const sv = sel >= 0 ? cur[sel] : 0;
      boardEl.innerHTML = cur.map((v, i) => {
        const cls = ["su-c"];
        if (given[i]) cls.push("g");
        if (i === sel) cls.push("sel");
        else if (sel >= 0 && (Math.floor(i / 9) === Math.floor(sel / 9) || i % 9 === sel % 9 || BOX(i) === BOX(sel))) cls.push("rel");
        if (sv && v === sv && i !== sel) cls.push("same");
        if (i === wrong) cls.push("bad");
        if (i % 9 === 2 || i % 9 === 5) cls.push("br");
        if (Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5) cls.push("bb");
        const inner = v ? v : notes[i] ? '<span class="su-n">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => "<i>" + (notes[i] & (1 << d) ? d : "") + "</i>").join("") + "</span>" : "";
        return '<button type="button" class="' + cls.join(" ") + '" data-i="' + i + '" aria-label="' + (Math.floor(i / 9) + 1) + "行" + ((i % 9) + 1) + "列" + (v ? " " + v : " 空き") + '">' + inner + "</button>";
      }).join("");
      const left = cur.filter((v, i) => v !== sol[i]).length;
      g.$("#ag-hud").innerHTML = hud(["⏱ " + Math.floor((cfg.time - t) / 60) + ":" + String(Math.max(0, Math.floor((cfg.time - t) % 60))).padStart(2, "0"), "ミス " + mistakes + " / 3", "のこり " + left + "マス"]);
      g.$("#race-cpu").style.width = Math.min(100, (t / cfg.time) * 100) + "%";
      const hb = g.$("#su-hint"); hb.disabled = hints <= 0; hb.textContent = "💡 ヒント " + hints;
    }
    function check() { if (cur.every((v, i) => v === sol[i])) g.finish(true, false, "勝利！", "CPUより先に解けました（" + Math.floor(t / 60) + "分" + Math.floor(t % 60) + "秒）"); }
    function input(d) {
      if (g.over || sel < 0 || given[sel]) return;
      if (memo) { if (!cur[sel]) notes[sel] ^= 1 << d; render(); return; }
      if (sol[sel] === d) {
        cur[sel] = d; notes[sel] = 0; wrong = -1;
        const r = Math.floor(sel / 9), c = sel % 9, bx = BOX(sel);
        for (let i = 0; i < 81; i++) if (Math.floor(i / 9) === r || i % 9 === c || BOX(i) === bx) notes[i] &= ~(1 << d);
        render(); check();
      } else {
        mistakes++; wrong = sel; GF.haptic && GF.haptic([20, 40, 20]); render();
        if (mistakes >= 3) return g.finish(false, false, "CPUの勝ち", "ミスが3回になりました");
        g.later(() => { if (wrong === sel) { wrong = -1; render(); } }, 700);
      }
    }
    boardEl.addEventListener("click", (e) => { const c = e.target.closest("[data-i]"); if (c) { sel = +c.dataset.i; render(); } });
    g.$("#su-pad").addEventListener("click", (e) => { const b = e.target.closest("[data-d]"); if (b) input(+b.dataset.d); });
    g.$(".su-tools").addEventListener("click", (e) => {
      const b = e.target.closest("[data-t]"); if (!b || g.over) return;
      if (b.dataset.t === "memo") { memo = !memo; b.setAttribute("aria-pressed", String(memo)); }
      if (b.dataset.t === "erase" && sel >= 0 && !given[sel]) { if (cur[sel] !== sol[sel]) cur[sel] = 0; notes[sel] = 0; render(); }
      if (b.dataset.t === "hint" && hints > 0) {
        let i = sel >= 0 && cur[sel] !== sol[sel] ? sel : cur.findIndex((v, k) => v !== sol[k]);
        if (i < 0) return;
        hints--; cur[i] = sol[i]; given[i] = true; notes[i] = 0; sel = i; render(); check();
      }
    });
    g.on(window, "keydown", (e) => { if (/^[1-9]$/.test(e.key)) input(+e.key); });
    g.every(() => { if (g.over) return; t += 1; if (t >= cfg.time) { render(); g.finish(false, false, "CPUの勝ち", "CPUが先に解き終わりました"); } else render(); }, 1000);
    g.debug = { sol: () => sol, cur: () => cur, select: (i) => { sel = i; render(); }, input, forceWin: () => { for (let i = 0; i < 81; i++) cur[i] = sol[i]; render(); check(); }, givens: () => given.filter(Boolean).length, elapse: (s) => { t += s; } };
    render();
  };

  /* =====================================================
   * お金パズル（7×7）：同じ硬貨を3つ並べて得点。CPUも同じ盤で勝負
   * ===================================================== */
  const COINS = [{ v: 1, w: 22 }, { v: 5, w: 20 }, { v: 10, w: 20 }, { v: 50, w: 16 }, { v: 100, w: 14 }, { v: 500, w: 8 }];
  const CW = COINS.reduce((a, c) => a + c.w, 0);
  const CN = 7, CMOVES = 20;
  const CO = { easy: "random", normal: "greedy1", hard: "greedy", ultra: "look" };
  function pickCoin(rng) { let x = rng() * CW; for (let i = 0; i < COINS.length; i++) { x -= COINS[i].w; if (x < 0) return i; } return 0; }
  function findMatches(b) {
    const hit = new Set(), groups = [];
    for (let r = 0; r < CN; r++) { let s = 0; for (let c = 1; c <= CN; c++) { if (c < CN && b[r * CN + c] === b[r * CN + s] && b[r * CN + c] >= 0) continue; if (c - s >= 3) { const gp = []; for (let k = s; k < c; k++) { hit.add(r * CN + k); gp.push(r * CN + k); } groups.push(gp); } s = c; } }
    for (let c = 0; c < CN; c++) { let s = 0; for (let r = 1; r <= CN; r++) { if (r < CN && b[r * CN + c] === b[s * CN + c] && b[r * CN + c] >= 0) continue; if (r - s >= 3) { const gp = []; for (let k = s; k < r; k++) { hit.add(k * CN + c); gp.push(k * CN + c); } groups.push(gp); } s = r; } }
    return { hit, groups };
  }
  function newBoard(rng) {
    const b = Array(CN * CN).fill(-1);
    for (let i = 0; i < CN * CN; i++) { let k, guard = 0; do { k = pickCoin(rng); b[i] = k; guard++; } while (guard < 30 && findMatches(b).hit.has(i)); }
    return b;
  }
  // 1手を最後まで解決（連鎖込み）。steps に途中経過を残す
  function resolveBoard(b, rng, steps) {
    let total = 0, chain = 0;
    for (;;) {
      const { hit, groups } = findMatches(b);
      if (!hit.size) break;
      chain++;
      let gain = 0;
      groups.forEach((gp) => { const v = COINS[b[gp[0]]].v; gain += v * gp.length * (gp.length >= 5 ? 2 : gp.length === 4 ? 1.5 : 1); });
      gain = Math.round(gain * chain);
      total += gain;
      if (steps) steps.push({ b: b.slice(), hit: [...hit], gain, chain });
      hit.forEach((i) => (b[i] = -1));
      for (let c = 0; c < CN; c++) { const col = []; for (let r = CN - 1; r >= 0; r--) if (b[r * CN + c] >= 0) col.push(b[r * CN + c]); for (let r = CN - 1, k = 0; r >= 0; r--, k++) b[r * CN + c] = k < col.length ? col[k] : pickCoin(rng); }
    }
    return total;
  }
  function validSwaps(b) {
    const out = [];
    for (let i = 0; i < CN * CN; i++) for (const j of [i + 1, i + CN]) {
      if (j >= CN * CN || (j === i + 1 && i % CN === CN - 1)) continue;
      const nb = b.slice(); [nb[i], nb[j]] = [nb[j], nb[i]];
      if (findMatches(nb).hit.size) out.push([i, j]);
    }
    return out;
  }
  function reshuffleIfStuck(b, rng) { let guard = 0; while (!validSwaps(b).length && guard++ < 50) { const nb = newBoard(rng); for (let i = 0; i < b.length; i++) b[i] = nb[i]; } }
  function cpuPick(b, rngState, mode) {
    const sw = validSwaps(b); if (!sw.length) return null;
    if (mode === "random") return sw[rnd(sw.length)];
    const sim = (s, deep) => { const nb = b.slice(); [nb[s[0]], nb[s[1]]] = [nb[s[1]], nb[s[0]]]; const rng = mulberry(rngState()); if (mode === "greedy1") { const m = findMatches(nb); let v = 0; m.groups.forEach((gp) => (v += COINS[nb[gp[0]]].v * gp.length)); return v; } let v = resolveBoard(nb, rng); if (deep) { const s2 = validSwaps(nb); let b2 = 0; s2.slice(0, 30).forEach((x) => { const n2 = nb.slice(); [n2[x[0]], n2[x[1]]] = [n2[x[1]], n2[x[0]]]; const m = findMatches(n2); let w = 0; m.groups.forEach((gp) => (w += COINS[n2[gp[0]]].v * gp.length)); b2 = Math.max(b2, w); }); v += b2 * 0.6; } return v; };
    let best = sw[0], bv = -1;
    sw.forEach((s) => { const v = sim(s, mode === "look") + (mode === "greedy1" ? Math.random() * 20 : 0) + (Math.max(s[0], s[1]) / 1000); if (v > bv) { bv = v; best = s; } });
    return best;
  }
  R.open.coin = function (diff) {
    const GF = window.GF, adv = GF.advantage();
    const seed = (Math.random() * 1e9) >>> 0;
    const myMoves = CMOVES + adv.coinMoves;
    const g = shell("coin", diff, "お金パズル", '<div class="ag-wrap co"><div class="cg-hud" id="ag-hud"></div><div class="co-vs"><div><span class="small">あなたのスコア</span><b class="num" id="co-me">¥0</b></div><div><span class="small">🤖 CPUのスコア</span><b class="num" id="co-cpu">¥0</b></div></div><div class="co-board" id="co-board" role="grid" aria-label="お金パズルの盤"></div><p class="cg-tip">となりの硬貨と入れかえて、同じ硬貨を3つ以上そろえると得点（4つで1.5倍・5つで2倍・連鎖でさらに倍）。CPUも同じ盤から' + CMOVES + '手で勝負します。' + (adv.coinMoves ? "<br>レベル有利：あなたは +" + adv.coinMoves + "手" : "") + "</p></div>");
    const rngMe = mulberry(seed), rngCpu = mulberry(seed);
    let b = newBoard(mulberry(seed ^ 0x9e3779b9)); reshuffleIfStuck(b, rngMe);
    let cb = b.slice();
    let me = 0, cpu = 0, used = 0, cpuUsed = 0, sel = -1, busy = false, pops = [];
    const cpuRngSeed = mulberry(seed + 7);
    const boardEl = g.$("#co-board");
    const label = (k) => (k < 0 ? "" : '<span class="cn c' + COINS[k].v + '"><i>' + COINS[k].v + "</i></span>");
    function render() {
      boardEl.innerHTML = b.map((k, i) => '<button type="button" class="co-c' + (i === sel ? " sel" : "") + (pops.includes(i) ? " pop" : "") + '" data-i="' + i + '" aria-label="' + (k >= 0 ? COINS[k].v + "円" : "空き") + '">' + label(k) + "</button>").join("");
      g.$("#co-me").textContent = "¥" + me.toLocaleString("ja-JP"); g.$("#co-cpu").textContent = "¥" + cpu.toLocaleString("ja-JP");
      g.$("#ag-hud").innerHTML = hud(["あなた 残り " + (myMoves - used) + "手", "🤖 残り " + (CMOVES - cpuUsed) + "手"]);
    }
    function cpuStep() {
      if (cpuUsed >= CMOVES) return;
      const s = cpuPick(cb, () => (cpuRngSeed() * 4294967296) >>> 0, CO[diff]);
      if (!s) { reshuffleIfStuck(cb, rngCpu); return; }
      [cb[s[0]], cb[s[1]]] = [cb[s[1]], cb[s[0]]];
      cpu += resolveBoard(cb, rngCpu); cpuUsed++;
      reshuffleIfStuck(cb, rngCpu);
    }
    function endCheck() {
      if (used < myMoves) return false;
      while (cpuUsed < CMOVES) cpuStep();
      render();
      if (me > cpu) g.finish(true, false, "勝利！", "あなた ¥" + me.toLocaleString("ja-JP") + " − CPU ¥" + cpu.toLocaleString("ja-JP"));
      else if (me === cpu) g.finish(false, true, "引き分け", "どちらも ¥" + me.toLocaleString("ja-JP"));
      else g.finish(false, false, "CPUの勝ち", "あなた ¥" + me.toLocaleString("ja-JP") + " − CPU ¥" + cpu.toLocaleString("ja-JP"));
      return true;
    }
    function trySwap(i, j) {
      if (busy || g.over) return;
      const nb = b.slice(); [nb[i], nb[j]] = [nb[j], nb[i]];
      if (!findMatches(nb).hit.size) { sel = -1; render(); const el = boardEl.querySelector('[data-i="' + j + '"]'); if (el) { el.classList.add("no"); } GF.haptic && GF.haptic([6, 30, 6]); return; }
      sel = -1; busy = true; used++;
      const steps = [];
      const gain = resolveBoard(nb, rngMe, steps);
      reshuffleIfStuck(nb, rngMe);
      let k = 0;
      const anim = () => {
        if (k < steps.length) { b = steps[k].b; pops = steps[k].hit; me += steps[k].gain; render(); k++; g.later(anim, 230); return; }
        b = nb; pops = []; busy = false; cpuStep(); render();
        if (gain > 0) GF.haptic && GF.haptic(10);
        endCheck();
      };
      anim();
    }
    boardEl.addEventListener("click", (e) => {
      const c = e.target.closest("[data-i]"); if (!c || busy || g.over) return;
      const i = +c.dataset.i;
      if (sel < 0) { sel = i; render(); return; }
      const adj = Math.abs(sel - i) === CN || (Math.abs(sel - i) === 1 && Math.floor(sel / CN) === Math.floor(i / CN));
      if (adj) trySwap(sel, i); else { sel = i === sel ? -1 : i; render(); }
    });
    let sx = 0, sy = 0, si = -1;
    g.on(boardEl, "pointerdown", (e) => { const c = e.target.closest("[data-i]"); if (!c) return; sx = e.clientX; sy = e.clientY; si = +c.dataset.i; });
    g.on(window, "pointerup", (e) => { if (si < 0) return; const dx = e.clientX - sx, dy = e.clientY - sy, i = si; si = -1; if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return; let j = -1; if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0 && i % CN < CN - 1) j = i + 1; if (dx < 0 && i % CN > 0) j = i - 1; } else { if (dy > 0 && i + CN < CN * CN) j = i + CN; if (dy < 0 && i - CN >= 0) j = i - CN; } if (j >= 0) { sel = -1; trySwap(i, j); } });
    g.debug = { swaps: () => (busy || g.over ? [] : validSwaps(b)), swap: trySwap, busy: () => busy, forceWin: () => { me = 1e7; used = myMoves; endCheck(); }, state: () => ({ me, cpu, used, cpuUsed }) };
    render();
  };
})();
