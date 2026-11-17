/* ほしまなび — ミニゲーム（クライミング / アリーナバトル） */
(() => {
  "use strict";

  let active = null; // { stop() }

  function stopActive() {
    if (active && active.stop) active.stop();
    active = null;
  }

  function setupCanvas(canvas, logicalW, logicalH) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* =====================================================
   * クライミング
   * ===================================================== */
  const CLIMB_CFG = {
    easy: { goal: 120, cpu: 2.0, rock: 0.45, fall: 210, aim: 0.1 },
    normal: { goal: 160, cpu: 3.2, rock: 0.8, fall: 260, aim: 0.25 },
    hard: { goal: 200, cpu: 5.0, rock: 1.2, fall: 310, aim: 0.4 },
    ultra: { goal: 240, cpu: 9.0, rock: 1.9, fall: 370, aim: 0.55 },
  };
  const CLIMB_LIMIT = 150;

  function openClimb(diff) {
    const GF = window.GF;
    stopActive();
    const cfg = CLIMB_CFG[diff] || CLIMB_CFG.normal;
    const adv = GF.advantage();
    const head = adv.climbSec;
    const body = GF.openLayer(`クライミング（${GF.diffName(diff)}）`, stopActive);
    body.innerHTML = `
      <div class="cg-wrap">
        <div class="cg-hud" id="cg-hud"></div>
        <div class="cg-stage" id="cg-stage"><canvas id="cg-canvas" aria-label="クライミングの画面"></canvas></div>
        <div class="cg-ctrl">
          <button type="button" class="cg-btn lane" data-c="left" aria-label="左へ">◀</button>
          <button type="button" class="cg-btn hand" data-c="lh">左手</button>
          <button type="button" class="cg-btn hand" data-c="rh">右手</button>
          <button type="button" class="cg-btn lane" data-c="right" aria-label="右へ">▶</button>
        </div>
        <p class="cg-tip">左手・右手を<b>交互に</b>押して登る。同じ手を続けるとすべります。落石は◀▶でよけましょう。</p>
      </div>`;
    const stage = document.getElementById("cg-stage");
    const canvas = document.getElementById("cg-canvas");
    const W = Math.max(280, Math.min(stage.clientWidth || 360, 460));
    const H = Math.max(300, stage.clientHeight || 420);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    const ctx = setupCanvas(canvas, W, H);
    const charImg = GF.charImage();

    const laneW = (W - 54) / 3;
    const laneX = (i) => 8 + laneW * i + laneW / 2;
    const playerY = H * 0.74;
    const STEP_PX = 16;

    const g = {
      phase: "count", // count, play, end
      countT: 3,
      t: 0,
      cpuDelay: head,
      player: { lane: 1, x: laneX(1), h: 0, stun: 0, slip: 0, last: null, taps: 0 },
      cpu: { h: 0 },
      rocks: [],
      spawnAcc: 0,
      shake: 0,
      msg: "",
      msgT: 0,
      result: null,
    };

    function input(c) {
      if (g.phase !== "play") return;
      const p = g.player;
      if (c === "left") p.lane = Math.max(0, p.lane - 1);
      else if (c === "right") p.lane = Math.min(2, p.lane + 1);
      else if (c === "lh" || c === "rh") {
        if (p.stun > 0 || p.slip > 0) return;
        if (p.last === c) {
          p.slip = 0.28;
          g.msg = "すべった！交互に押しましょう";
          g.msgT = 0.8;
          p.last = null;
          return;
        }
        p.last = c;
        p.h = Math.min(cfg.goal, p.h + 1);
        p.taps += 1;
      }
    }

    const ctrl = body.querySelector(".cg-ctrl");
    const onDown = (e) => {
      const b = e.target.closest("[data-c]");
      if (!b) return;
      e.preventDefault();
      b.classList.add("down");
      setTimeout(() => b.classList.remove("down"), 90);
      input(b.dataset.c);
    };
    ctrl.addEventListener("pointerdown", onDown);
    const onKey = (e) => {
      const map = { ArrowLeft: "left", ArrowRight: "right", a: "left", d: "right", f: "lh", j: "rh", z: "lh", x: "rh" };
      if (map[e.key]) { e.preventDefault(); input(map[e.key]); }
    };
    window.addEventListener("keydown", onKey);

    let raf = 0;
    let lastTs = 0;
    function frame(ts) {
      const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
      lastTs = ts;
      update(dt);
      draw();
      if (g.phase !== "done") raf = requestAnimationFrame(frame);
    }

    function update(dt) {
      const p = g.player;
      p.x += (laneX(p.lane) - p.x) * Math.min(1, dt * 18);
      if (g.msgT > 0) g.msgT -= dt;
      if (g.shake > 0) g.shake -= dt;
      if (g.phase === "count") {
        g.countT -= dt;
        if (g.countT <= 0) g.phase = "play";
        return;
      }
      if (g.phase !== "play") return;
      g.t += dt;
      if (p.stun > 0) p.stun -= dt;
      if (p.slip > 0) p.slip -= dt;
      // CPU
      if (g.t >= g.cpuDelay) {
        const wobble = 0.85 + 0.3 * Math.abs(Math.sin(g.t * 1.7));
        g.cpu.h = Math.min(cfg.goal, g.cpu.h + cfg.cpu * wobble * dt);
      }
      // rocks
      g.spawnAcc += dt * cfg.rock * (1 + g.t / 120);
      while (g.spawnAcc >= 1) {
        g.spawnAcc -= 1;
        const lane = Math.random() < cfg.aim ? p.lane : Math.floor(Math.random() * 3);
        g.rocks.push({ lane, y: -30, warn: 0.7, r: 13 + Math.random() * 6, spin: Math.random() * 6 });
      }
      g.rocks.forEach((r) => {
        if (r.warn > 0) { r.warn -= dt; return; }
        r.y += cfg.fall * dt;
        r.spin += dt * 4;
        if (!r.hit && r.lane === p.lane && Math.abs(r.y - playerY) < r.r + 14 && p.stun <= 0) {
          r.hit = true;
          p.stun = 1.0;
          p.h = Math.max(0, p.h - 5);
          g.shake = 0.35;
          g.msg = "落石に当たった！";
          g.msgT = 1;
          if (navigator.vibrate) navigator.vibrate(80);
        }
      });
      g.rocks = g.rocks.filter((r) => r.y < H + 40 && !r.hit);
      // end
      if (p.h >= cfg.goal) end(true);
      else if (g.cpu.h >= cfg.goal) end(false);
      else if (g.t >= CLIMB_LIMIT) end(false);
      hud();
    }

    function hud() {
      const el = document.getElementById("cg-hud");
      if (!el) return;
      const cpuWait = Math.max(0, g.cpuDelay - g.t);
      el.innerHTML = `<span>⏱ ${Math.max(0, CLIMB_LIMIT - g.t).toFixed(0)}秒</span>
        <span>あなた ${Math.floor(g.player.h)}/${cfg.goal}</span>
        <span>🤖 ${cpuWait > 0 ? `あと${cpuWait.toFixed(0)}秒で出発` : `${Math.floor(g.cpu.h)}/${cfg.goal}`}</span>`;
    }

    function draw() {
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      if (g.shake > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6);
      // wall
      const grd = ctx.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, "#8fb8d8");
      grd.addColorStop(0.18, "#b49a7a");
      grd.addColorStop(1, "#7d6448");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      const off = (g.player.h * STEP_PX) % 64;
      ctx.fillStyle = "rgba(60,40,25,0.25)";
      for (let y = -64; y < H + 64; y += 64) {
        for (let i = 0; i < 3; i++) {
          const yy = y + off + (i % 2) * 30;
          ctx.beginPath();
          ctx.ellipse(laneX(i) - 18, yy, 7, 5, 0, 0, Math.PI * 2);
          ctx.ellipse(laneX(i) + 18, yy + 32, 7, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.setLineDash([6, 10]);
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(8 + laneW * i, 0);
        ctx.lineTo(8 + laneW * i, H);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // goal line if near
      const toGoal = (cfg.goal - g.player.h) * STEP_PX;
      if (toGoal < playerY + 20) {
        const gy = playerY - toGoal - 20;
        ctx.fillStyle = "#fff";
        ctx.fillRect(8, gy, W - 62, 6);
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("🏁 ゴール", W / 2 - 60, gy - 6);
      }
      // rocks
      g.rocks.forEach((r) => {
        const x = laneX(r.lane);
        if (r.warn > 0) {
          ctx.fillStyle = `rgba(220,60,40,${0.5 + 0.5 * Math.sin(r.warn * 30)})`;
          ctx.beginPath();
          ctx.moveTo(x, 6); ctx.lineTo(x - 12, 28); ctx.lineTo(x + 12, 28); ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("!", x, 25);
          ctx.textAlign = "left";
          return;
        }
        ctx.save();
        ctx.translate(x, r.y);
        ctx.rotate(r.spin);
        ctx.fillStyle = "#5b5550";
        ctx.beginPath();
        ctx.moveTo(-r.r, 0); ctx.lineTo(-r.r * 0.4, -r.r); ctx.lineTo(r.r * 0.7, -r.r * 0.8);
        ctx.lineTo(r.r, 0.2 * r.r); ctx.lineTo(0.3 * r.r, r.r); ctx.lineTo(-0.7 * r.r, 0.8 * r.r); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(-r.r * 0.3, -r.r * 0.6, r.r * 0.5, r.r * 0.3);
        ctx.restore();
      });
      // rope
      ctx.strokeStyle = "rgba(255,230,160,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(g.player.x, playerY + 20);
      ctx.lineTo(g.player.x, H);
      ctx.stroke();
      // player
      const p = g.player;
      ctx.globalAlpha = p.stun > 0 ? 0.45 + 0.4 * Math.abs(Math.sin(g.t * 20)) : 1;
      const bob = p.last === "lh" ? -3 : p.last === "rh" ? 3 : 0;
      ctx.strokeStyle = "#3d2a1a";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.x - 12, playerY); ctx.lineTo(p.x - 20, playerY - 22 + bob);
      ctx.moveTo(p.x + 12, playerY); ctx.lineTo(p.x + 20, playerY - 22 - bob);
      ctx.stroke();
      if (charImg.complete && charImg.naturalWidth) ctx.drawImage(charImg, p.x - 22, playerY - 26, 44, 48);
      else {
        ctx.fillStyle = "#7cc47f";
        ctx.beginPath(); ctx.arc(p.x, playerY, 18, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // rail
      const rx = W - 30;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      roundRect(ctx, rx - 6, 20, 12, H - 40, 6);
      ctx.fill();
      const ry = (h) => H - 20 - (h / cfg.goal) * (H - 40);
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🏁", rx, 16);
      ctx.fillText("🤖", rx + 2, ry(g.cpu.h) + 6);
      ctx.fillStyle = "#ffe08a";
      ctx.beginPath(); ctx.arc(rx - 2, ry(p.h), 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#16302a";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("自", rx - 2, ry(p.h) + 3);
      ctx.textAlign = "left";
      // messages
      if (g.phase === "count") {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "bold 64px sans-serif";
        ctx.fillText(String(Math.ceil(g.countT)), W / 2, H / 2);
        ctx.font = "bold 15px sans-serif";
        ctx.fillText(head > 0 ? `レベル有利：CPUは${head}秒おくれてスタート` : "よーい…", W / 2, H / 2 + 40);
        ctx.textAlign = "left";
      }
      if (g.msgT > 0) {
        ctx.fillStyle = "rgba(22,48,42,0.85)";
        roundRect(ctx, W / 2 - 100, H * 0.42, 200, 34, 12);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(g.msg, W / 2, H * 0.42 + 22);
        ctx.textAlign = "left";
      }
      ctx.restore();
    }

    function end(win) {
      if (g.phase === "done" || g.phase === "end") return;
      g.phase = "end";
      g.result = win;
      draw();
      g.phase = "done";
      const reward = GF.reportGame("climb", diff, win, { time: g.t });
      GF.showResult({
        win,
        title: win ? "登りきった！" : "CPUの勝ち…",
        text: win ? `${g.t.toFixed(1)}秒でゴール！` : g.t >= CLIMB_LIMIT ? "時間切れ" : `CPUが先にゴール（あなた ${Math.floor(g.player.h)}/${cfg.goal}）`,
        reward,
        onRetry: () => openClimb(diff),
      });
    }

    hud();
    raf = requestAnimationFrame(frame);
    active = {
      stop() {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKey);
        g.phase = "done";
      },
      state: g,
      input,
    };
    return active;
  }

  /* =====================================================
   * アリーナバトル
   * ===================================================== */
  const ARENA_W = 360, ARENA_H = 540;
  const WALLS = [
    { x: 50, y: 150, w: 90, h: 22 },
    { x: 220, y: 150, w: 90, h: 22 },
    { x: 150, y: 256, w: 60, h: 28 },
    { x: 50, y: 368, w: 90, h: 22 },
    { x: 220, y: 368, w: 90, h: 22 },
  ];
  const BUSHES = [
    { x: 20, y: 236, w: 70, h: 68 },
    { x: 270, y: 236, w: 70, h: 68 },
  ];
  const ARENA_CFG = {
    easy: { hp: 80, dmg: 10, fire: 1.5, err: 0.35, speed: 80, dodge: 0, lead: 0, shots: 1 },
    normal: { hp: 110, dmg: 14, fire: 1.1, err: 0.2, speed: 105, dodge: 0.15, lead: 0.3, shots: 1 },
    hard: { hp: 150, dmg: 18, fire: 0.8, err: 0.1, speed: 130, dodge: 0.4, lead: 0.7, shots: 1 },
    ultra: { hp: 230, dmg: 24, fire: 0.55, err: 0.03, speed: 150, dodge: 0.7, lead: 1, shots: 3 },
  };
  const ARENA_TIME = 90;

  function rectHit(x, y, r, rc) {
    const cx = Math.max(rc.x, Math.min(x, rc.x + rc.w));
    const cy = Math.max(rc.y, Math.min(y, rc.y + rc.h));
    return (x - cx) ** 2 + (y - cy) ** 2 < r * r;
  }
  function inBush(x, y) {
    return BUSHES.some((b) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h);
  }
  function segBlocked(x1, y1, x2, y2) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 8);
    for (let i = 1; i < steps; i++) {
      const x = x1 + ((x2 - x1) * i) / steps, y = y1 + ((y2 - y1) * i) / steps;
      if (WALLS.some((w) => x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h)) return true;
    }
    return false;
  }
  function moveEntity(e, dx, dy) {
    const nx = Math.max(e.r, Math.min(ARENA_W - e.r, e.x + dx));
    if (!WALLS.some((w) => rectHit(nx, e.y, e.r, w))) e.x = nx;
    const ny = Math.max(e.r, Math.min(ARENA_H - e.r, e.y + dy));
    if (!WALLS.some((w) => rectHit(e.x, ny, e.r, w))) e.y = ny;
  }

  function openArena(diff) {
    const GF = window.GF;
    stopActive();
    const cfg = ARENA_CFG[diff] || ARENA_CFG.normal;
    const adv = GF.advantage();
    const body = GF.openLayer(`アリーナバトル（${GF.diffName(diff)}）`, stopActive);
    body.innerHTML = `
      <div class="ar-wrap">
        <div class="cg-hud" id="ar-hud"></div>
        <div class="ar-stage" id="ar-stage"><canvas id="ar-canvas" aria-label="アリーナの画面"></canvas></div>
        <div class="ar-ctrl">
          <span class="ar-hint">画面をドラッグで移動</span>
          <button type="button" class="ar-auto" id="ar-auto" aria-pressed="false">オート：OFF</button>
          <button type="button" class="ar-super" id="ar-super" disabled>必殺</button>
          <button type="button" class="ar-fire" id="ar-fire">こうげき</button>
        </div>
      </div>`;
    const stage = document.getElementById("ar-stage");
    const canvas = document.getElementById("ar-canvas");
    const availW = Math.min(stage.clientWidth || 360, 460);
    const availH = Math.max(300, stage.clientHeight || 480);
    const scale = Math.min(availW / ARENA_W, availH / ARENA_H);
    const CW = ARENA_W * scale, CH = ARENA_H * scale;
    canvas.style.width = CW + "px";
    canvas.style.height = CH + "px";
    const ctx = setupCanvas(canvas, CW, CH);
    ctx.scale(scale, scale);
    const charImg = GF.charImage();

    const pMax = Math.round(100 * (1 + 0.5 * adv.ratio));
    const pDmg = Math.round(20 * (1 + 0.3 * adv.ratio));
    const g = {
      phase: "count",
      countT: 3,
      t: 0,
      auto: false,
      p: { x: 180, y: 480, r: 15, hp: pMax, max: pMax, ammo: 3, reload: 0, superC: 0, lastHurt: -9, lastShot: -9, dir: { x: 0, y: -1 } },
      e: { x: 180, y: 64, r: 15, hp: cfg.hp, max: cfg.hp, cd: 1.2, lastHurt: -9, lastShot: -9, strafe: 1, strafeT: 1, dodgeT: 0, dodgeDir: { x: 0, y: 0 }, wander: { x: 180, y: 120 } },
      bullets: [],
      joy: null,
      keys: {},
      floaters: [],
    };

    function fire(from, tx, ty, dmg, owner, spread) {
      const base = Math.atan2(ty - from.y, tx - from.x);
      const n = spread || 1;
      for (let i = 0; i < n; i++) {
        const a = base + (n > 1 ? (i - (n - 1) / 2) * 0.16 : 0);
        g.bullets.push({ x: from.x + Math.cos(a) * 18, y: from.y + Math.sin(a) * 18, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, dmg, owner, life: 260 / 430, warned: false });
      }
    }

    function playerAttack(isSuper) {
      if (g.phase !== "play") return;
      const p = g.p, e = g.e;
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      const seen = dist < 300;
      const tx = seen ? e.x : p.x + p.dir.x * 100;
      const ty = seen ? e.y : p.y + p.dir.y * 100;
      if (isSuper) {
        if (p.superC < 1) return;
        p.superC = 0;
        fire(p, tx, ty, Math.round(pDmg * 0.85), "p", 5);
      } else {
        if (p.ammo < 1) return;
        p.ammo -= 1;
        fire(p, tx, ty, pDmg, "p", 1);
      }
      p.lastShot = g.t;
    }

    // input
    const toLocal = (ev) => {
      const rc = canvas.getBoundingClientRect();
      return { x: ((ev.clientX - rc.left) / rc.width) * ARENA_W, y: ((ev.clientY - rc.top) / rc.height) * ARENA_H };
    };
    const onPDown = (ev) => {
      ev.preventDefault();
      const pt = toLocal(ev);
      g.joy = { id: ev.pointerId, ox: pt.x, oy: pt.y, x: pt.x, y: pt.y };
      try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
    };
    const onPMove = (ev) => {
      if (!g.joy || g.joy.id !== ev.pointerId) return;
      const pt = toLocal(ev);
      g.joy.x = pt.x; g.joy.y = pt.y;
    };
    const onPUp = (ev) => {
      if (g.joy && g.joy.id === ev.pointerId) g.joy = null;
    };
    canvas.addEventListener("pointerdown", onPDown);
    canvas.addEventListener("pointermove", onPMove);
    canvas.addEventListener("pointerup", onPUp);
    canvas.addEventListener("pointercancel", onPUp);
    const fireBtn = document.getElementById("ar-fire");
    const superBtn = document.getElementById("ar-super");
    const autoBtn = document.getElementById("ar-auto");
    fireBtn.addEventListener("pointerdown", (ev) => { ev.preventDefault(); playerAttack(false); });
    superBtn.addEventListener("pointerdown", (ev) => { ev.preventDefault(); playerAttack(true); });
    autoBtn.addEventListener("click", () => {
      g.auto = !g.auto;
      autoBtn.textContent = g.auto ? "オート：ON" : "オート：OFF";
      autoBtn.setAttribute("aria-pressed", String(g.auto));
    });
    const onKey = (ev) => {
      const down = ev.type === "keydown";
      g.keys[ev.key.toLowerCase()] = down;
      if (down && ev.key === " ") { ev.preventDefault(); playerAttack(false); }
      if (down && ev.key.toLowerCase() === "e") playerAttack(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    function update(dt) {
      if (g.phase === "count") {
        g.countT -= dt;
        if (g.countT <= 0) g.phase = "play";
        return;
      }
      if (g.phase !== "play") return;
      g.t += dt;
      const p = g.p, e = g.e;
      // player move
      let mx = 0, my = 0;
      if (g.joy) {
        const dx = g.joy.x - g.joy.ox, dy = g.joy.y - g.joy.oy;
        const d = Math.hypot(dx, dy);
        if (d > 6) { mx = dx / Math.max(d, 45); my = dy / Math.max(d, 45); }
      }
      if (g.keys.w || g.keys.arrowup) my -= 1;
      if (g.keys.s || g.keys.arrowdown) my += 1;
      if (g.keys.a || g.keys.arrowleft) mx -= 1;
      if (g.keys.d || g.keys.arrowright) mx += 1;
      const ml = Math.hypot(mx, my);
      if (ml > 1) { mx /= ml; my /= ml; }
      if (ml > 0.05) p.dir = { x: mx / (ml || 1), y: my / (ml || 1) };
      moveEntity(p, mx * 150 * dt, my * 150 * dt);
      // ammo
      if (p.ammo < 3) {
        p.reload += dt;
        if (p.reload >= 0.8) { p.reload = 0; p.ammo += 1; }
      }
      // auto attack
      const distPE = Math.hypot(e.x - p.x, e.y - p.y);
      if (g.auto && p.ammo >= 1 && distPE < 260 && !segBlocked(p.x, p.y, e.x, e.y) && g.t - p.lastShot > 0.55) playerAttack(false);
      // regen
      [p, e].forEach((u) => {
        if (g.t - u.lastHurt > 3 && g.t - u.lastShot > 3 && u.hp < u.max) u.hp = Math.min(u.max, u.hp + u.max * 0.1 * dt);
      });
      // enemy AI
      const visible = !inBush(p.x, p.y) || distPE < 80 || (diff === "ultra" && g.t - p.lastShot < 1.5);
      e.strafeT -= dt;
      if (e.strafeT <= 0) { e.strafe = Math.random() < 0.5 ? -1 : 1; e.strafeT = 0.8 + Math.random() * 1.2; }
      let ex = 0, ey = 0;
      if (e.dodgeT > 0) {
        e.dodgeT -= dt;
        ex = e.dodgeDir.x; ey = e.dodgeDir.y;
      } else if (visible) {
        const ux = (p.x - e.x) / (distPE || 1), uy = (p.y - e.y) / (distPE || 1);
        const lowHp = e.hp / e.max < 0.35 && diff !== "ultra" && diff !== "hard";
        const want = lowHp ? 320 : diff === "easy" ? 150 : 175;
        const radial = distPE > want + 20 ? 1 : distPE < want - 30 ? -1 : 0;
        ex = ux * radial + -uy * e.strafe * (diff === "easy" ? 0.3 : 0.8);
        ey = uy * radial + ux * e.strafe * (diff === "easy" ? 0.3 : 0.8);
      } else {
        const wx = e.wander.x - e.x, wy = e.wander.y - e.y;
        const wd = Math.hypot(wx, wy);
        if (wd < 10) e.wander = { x: 40 + Math.random() * 280, y: 60 + Math.random() * 420 };
        ex = wx / (wd || 1); ey = wy / (wd || 1);
      }
      const el = Math.hypot(ex, ey);
      if (el > 0) {
        const bx = e.x, by = e.y;
        moveEntity(e, (ex / el) * cfg.speed * dt, (ey / el) * cfg.speed * dt);
        if (Math.hypot(e.x - bx, e.y - by) < cfg.speed * dt * 0.2) e.strafe *= -1;
      }
      // enemy dodge
      g.bullets.forEach((b) => {
        if (b.owner !== "p" || b.warned) return;
        const d = Math.hypot(b.x - e.x, b.y - e.y);
        if (d < 140) {
          b.warned = true;
          if (Math.random() < cfg.dodge) {
            const len = Math.hypot(b.vx, b.vy);
            const side = Math.random() < 0.5 ? 1 : -1;
            e.dodgeDir = { x: (-b.vy / len) * side * 1.6, y: (b.vx / len) * side * 1.6 };
            e.dodgeT = 0.3;
          }
        }
      });
      // enemy fire
      e.cd -= dt;
      if (e.cd <= 0 && visible && distPE < 270 && !segBlocked(e.x, e.y, p.x, p.y)) {
        const tt = distPE / 430;
        const vx = mx * 150 * cfg.lead, vy = my * 150 * cfg.lead;
        const err = (Math.random() - 0.5) * 2 * cfg.err;
        const ang = Math.atan2(p.y + vy * tt - e.y, p.x + vx * tt - e.x) + err;
        fire(e, e.x + Math.cos(ang) * 100, e.y + Math.sin(ang) * 100, cfg.dmg, "e", cfg.shots);
        e.lastShot = g.t;
        e.cd = cfg.fire * (0.85 + Math.random() * 0.3);
      }
      // bullets
      g.bullets.forEach((b) => {
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        if (WALLS.some((w) => b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h)) b.life = 0;
        const target = b.owner === "p" ? e : p;
        if (b.life > 0 && Math.hypot(b.x - target.x, b.y - target.y) < target.r + 4) {
          b.life = 0;
          target.hp -= b.dmg;
          target.lastHurt = g.t;
          g.floaters.push({ x: target.x, y: target.y - 20, t: 0.8, text: "-" + b.dmg, c: b.owner === "p" ? "#ffe08a" : "#ff8a7a" });
          if (b.owner === "p") p.superC = Math.min(1, p.superC + 0.25);
        }
      });
      g.bullets = g.bullets.filter((b) => b.life > 0 && b.x > -20 && b.x < ARENA_W + 20 && b.y > -20 && b.y < ARENA_H + 20);
      g.floaters.forEach((f) => { f.t -= dt; f.y -= 30 * dt; });
      g.floaters = g.floaters.filter((f) => f.t > 0);
      superBtn.disabled = p.superC < 1;
      superBtn.classList.toggle("ready", p.superC >= 1);
      if (e.hp <= 0) end(true, "相手をたおしました！");
      else if (p.hp <= 0) end(false, "HPがなくなりました");
      else if (g.t >= ARENA_TIME) {
        const win = p.hp / p.max > e.hp / e.max;
        end(win, win ? "時間切れ・HPが多くて勝ち" : "時間切れ・HPで負け");
      }
      hud();
    }

    function hud() {
      const el = document.getElementById("ar-hud");
      if (!el) return;
      el.innerHTML = `<span>⏱ ${Math.max(0, ARENA_TIME - g.t).toFixed(0)}秒</span><span>❤️ ${Math.max(0, Math.ceil(g.p.hp))}/${g.p.max}</span><span>🤖 ${Math.max(0, Math.ceil(g.e.hp))}/${g.e.max}</span>`;
    }

    function drawUnit(u, isPlayer) {
      const hidden = isPlayer && inBush(u.x, u.y);
      ctx.globalAlpha = hidden ? 0.55 : 1;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath(); ctx.ellipse(u.x, u.y + 13, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
      if (isPlayer) {
        if (charImg.complete && charImg.naturalWidth) ctx.drawImage(charImg, u.x - 19, u.y - 22, 38, 42);
        else { ctx.fillStyle = "#7cc47f"; ctx.beginPath(); ctx.arc(u.x, u.y, u.r, 0, Math.PI * 2); ctx.fill(); }
      } else {
        ctx.fillStyle = diff === "ultra" ? "#7a1fa2" : "#d0503c";
        roundRect(ctx, u.x - 15, u.y - 15, 30, 30, 8);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(u.x - 9, u.y - 6, 6, 6);
        ctx.fillRect(u.x + 3, u.y - 6, 6, 6);
        ctx.fillStyle = "#222";
        ctx.fillRect(u.x - 7, u.y - 4, 3, 3);
        ctx.fillRect(u.x + 5, u.y - 4, 3, 3);
        ctx.fillStyle = "#ffd36b";
        ctx.fillRect(u.x - 1.5, u.y - 22, 3, 8);
      }
      ctx.globalAlpha = 1;
      const w = 36;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(u.x - w / 2, u.y - 32, w, 5);
      ctx.fillStyle = isPlayer ? "#5fd37a" : "#ff6b5a";
      ctx.fillRect(u.x - w / 2, u.y - 32, (w * Math.max(0, u.hp)) / u.max, 5);
      if (isPlayer) {
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i < u.ammo ? "#ffb02e" : "rgba(0,0,0,0.3)";
          ctx.fillRect(u.x - 18 + i * 12.5, u.y + 22, 11, 4);
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, ARENA_W, ARENA_H);
      ctx.fillStyle = "#cfe8b0";
      ctx.fillRect(0, 0, ARENA_W, ARENA_H);
      ctx.fillStyle = "rgba(90,140,70,0.12)";
      for (let y = 0; y < ARENA_H; y += 30) for (let x = (y / 30) % 2 ? 0 : 30; x < ARENA_W; x += 60) ctx.fillRect(x, y, 30, 30);
      BUSHES.forEach((b) => {
        ctx.fillStyle = "#4f9a4f";
        roundRect(ctx, b.x, b.y, b.w, b.h, 18);
        ctx.fill();
        ctx.fillStyle = "#3f8240";
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(b.x + 12 + i * 12, b.y + 14 + (i % 2) * 36, 9, 0, Math.PI * 2); ctx.fill(); }
      });
      WALLS.forEach((w) => {
        ctx.fillStyle = "#9c6b3f";
        roundRect(ctx, w.x, w.y, w.w, w.h, 5);
        ctx.fill();
        ctx.fillStyle = "#b9834f";
        ctx.fillRect(w.x + 3, w.y + 3, w.w - 6, 5);
      });
      g.bullets.forEach((b) => {
        ctx.fillStyle = b.owner === "p" ? "#ffb02e" : "#ff4d6d";
        ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
      });
      drawUnit(g.e, false);
      drawUnit(g.p, true);
      g.floaters.forEach((f) => {
        ctx.fillStyle = f.c;
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y);
        ctx.textAlign = "left";
      });
      if (g.joy) {
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(g.joy.ox, g.joy.oy, 40, 0, Math.PI * 2); ctx.stroke();
        const dx = g.joy.x - g.joy.ox, dy = g.joy.y - g.joy.oy;
        const d = Math.min(40, Math.hypot(dx, dy));
        const a = Math.atan2(dy, dx);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath(); ctx.arc(g.joy.ox + Math.cos(a) * d, g.joy.oy + Math.sin(a) * d, 16, 0, Math.PI * 2); ctx.fill();
      }
      if (g.phase === "count") {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, ARENA_W, ARENA_H);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "bold 64px sans-serif";
        ctx.fillText(String(Math.ceil(g.countT)), ARENA_W / 2, ARENA_H / 2);
        ctx.font = "bold 14px sans-serif";
        ctx.fillText("たおしたら勝ち！", ARENA_W / 2, ARENA_H / 2 + 40);
        ctx.textAlign = "left";
      }
    }

    let raf = 0, lastTs = 0;
    function frame(ts) {
      const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
      lastTs = ts;
      update(dt);
      draw();
      if (g.phase !== "done") raf = requestAnimationFrame(frame);
    }

    function end(win, text) {
      if (g.phase === "done") return;
      g.phase = "done";
      draw();
      const reward = GF.reportGame("arena", diff, win, { time: g.t });
      GF.showResult({ win, title: win ? "勝利！" : "CPUの勝ち", text, reward, onRetry: () => openArena(diff) });
    }

    hud();
    raf = requestAnimationFrame(frame);
    active = {
      stop() {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("keyup", onKey);
        g.phase = "done";
      },
      state: g,
      attack: playerAttack,
    };
    return active;
  }

  window.GFGames = { openClimb, openArena, stop: stopActive, _active: () => active, CLIMB_CFG, ARENA_CFG };
})();
