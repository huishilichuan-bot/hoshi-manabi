/* ほしまなび — 本格ゲーム用エンジン（キャンバス・入力・パーティクル・効果音・画面ゆれ）。すべてオリジナル */
(() => {
  "use strict";
  const H = window.HMGames;
  let AC = null;
  const ac = () => { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} return AC; };
  // 設定の「効果音」「効果音の音量」にしたがう
  const mvol = () => { try { const st = window.HM_APP.state().settings; return st.sound === false ? 0 : (st.vol == null ? 0.8 : +st.vol); } catch (e) { return 0.8; } };
  function tone(f, dur, type = "sine", vol = 0.15, f2 = null, delay = 0) {
    const m = mvol(); if (m <= 0.01) return; vol = Math.max(0.002, vol * m * 1.25);
    const a = ac(); if (!a) return; const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur = 0.2, vol = 0.2, hp = 400, delay = 0) {
    const m = mvol(); if (m <= 0.01) return; vol = vol * m * 1.25;
    const a = ac(); if (!a) return; const t = a.currentTime + delay, n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; f.type = "highpass"; f.frequency.value = hp; g.gain.value = vol;
    s.connect(f).connect(g).connect(a.destination); s.start(t);
  }
  const SFX = {
    hit: () => { tone(220, 0.12, "square", 0.12, 110); noise(0.08, 0.15, 1200); },
    pop: () => tone(880, 0.08, "sine", 0.12, 1320),
    coin: () => { tone(988, 0.07, "square", 0.08); tone(1319, 0.18, "square", 0.08, null, 0.07); },
    boom: () => { noise(0.45, 0.35, 80); tone(120, 0.4, "sawtooth", 0.12, 40); },
    shoot: () => tone(1200, 0.07, "square", 0.05, 500),
    whoosh: () => noise(0.25, 0.12, 2000),
    kick: () => { tone(160, 0.1, "sine", 0.25, 60); noise(0.05, 0.12, 2000); },
    bat: () => { noise(0.06, 0.4, 1500); tone(500, 0.08, "triangle", 0.15, 900); },
    cheer: () => { noise(1.2, 0.08, 800); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, "triangle", 0.08, null, i * 0.09)); },
    bad: () => tone(200, 0.25, "sawtooth", 0.08, 120),
    tick: () => tone(1500, 0.03, "square", 0.04),
    engine: (p) => tone(60 + p * 140, 0.09, "sawtooth", 0.025),
  };
  const vib = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t, rand = (a, b) => a + Math.random() * (b - a);
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function txt(c, s, x, y, size, color = "#fff", align = "center", weight = 900, stroke = "rgba(0,0,0,.45)") { c.font = weight + " " + size + "px system-ui,-apple-system,'Hiragino Sans',sans-serif"; c.textAlign = align; c.textBaseline = "middle"; if (stroke) { c.lineWidth = Math.max(3, size / 7); c.strokeStyle = stroke; c.lineJoin = "round"; c.strokeText(s, x, y); } c.fillStyle = color; c.fillText(s, x, y); }

  // 本格ゲームの土台：キャンバスを画面いっぱいに置き、入力・パーティクル・ゆれ・表示をまとめる
  function pro(id, diff, title, opts = {}) {
    const g = H.shell(id, diff, title, '<div class="pro-wrap"><canvas class="pro-cv"></canvas>' + (opts.html || "") + "</div>");
    const wrap = g.$(".pro-wrap"), cv = g.$(".pro-cv");
    const W = Math.min(wrap.clientWidth || 374, 480), Hh = Math.max(460, Math.min(780, (window.innerHeight || 800) - 64));
    const c = H.setupCanvas(cv, W, Hh); g.c = c; g.W = W; g.H = Hh; g.cv = cv; g.wrap = wrap;
    g.parts = []; g.pops = []; g.shakeA = 0; g.time = 0; g.flashA = 0; g.flashC = "#fff";
    g.burst = (x, y, color, n = 14, sp = 160, life = 0.6, size = 3) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = sp * (0.3 + Math.random() * 0.7); g.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, color: Array.isArray(color) ? color[i % color.length] : color, size: size * (0.6 + Math.random() * 0.8) }); } };
    g.pop = (x, y, s, color = "#ffe066", size = 22) => g.pops.push({ x, y, s, color, size, life: 0.9 });
    g.shake = (a) => { g.shakeA = Math.max(g.shakeA, a); };
    g.flash = (col = "#fff", a = 0.5) => { g.flashC = col; g.flashA = a; };
    g.sfx = SFX; g.vib = vib;
    // 入力（ポインター1本＋2本目まで）
    const ptrs = new Map(); g.ptrs = ptrs;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * Hh }; };
    g.on(cv, "pointerdown", (e) => { e.preventDefault(); ac(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} const p = pos(e); const o = { id: e.pointerId, x: p.x, y: p.y, sx: p.x, sy: p.y, t: performance.now() }; ptrs.set(e.pointerId, o); g.onDown && g.onDown(o); });
    g.on(cv, "pointermove", (e) => { const o = ptrs.get(e.pointerId); if (!o) return; const p = pos(e); o.x = p.x; o.y = p.y; g.onMove && g.onMove(o); });
    const up = (e) => { const o = ptrs.get(e.pointerId); if (!o) return; ptrs.delete(e.pointerId); g.onUp && g.onUp(o); };
    g.on(cv, "pointerup", up); g.on(cv, "pointercancel", up);
    cv.style.touchAction = "none";
    g.run = (update, draw) => {
      g.loop((dt) => {
        g.time += dt; update(dt * (g.ts == null ? 1 : g.ts)); if (g.tape) g.tape.update(dt);
        for (const p of g.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.vy += (p.g || 0) * dt; p.life -= dt; }
        g.parts = g.parts.filter((p) => p.life > 0); if (g.parts.length > 600) g.parts.splice(0, g.parts.length - 600);
        for (const p of g.pops) { p.y -= 40 * dt; p.life -= dt; } g.pops = g.pops.filter((p) => p.life > 0);
        g.shakeA *= Math.pow(0.02, dt); g.flashA = Math.max(0, g.flashA - dt * 2);
        c.save(); if (g.shakeA > 0.3) c.translate(rand(-g.shakeA, g.shakeA), rand(-g.shakeA, g.shakeA));
        draw(c);
        if (!g.noAutoParts) g.drawFx();
        if (g.tape) g.tape.overlay(c);
        c.restore();
        if (g.flashA > 0) { c.globalAlpha = g.flashA; c.fillStyle = g.flashC; c.fillRect(0, 0, W, Hh); c.globalAlpha = 1; }
      });
    };
    g.drawFx = () => { for (const p of g.parts) { c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.size, 0, 7); c.fill(); } c.globalAlpha = 1; for (const p of g.pops) { c.globalAlpha = Math.min(1, p.life * 2); txt(c, p.s, p.x, p.y, p.size * (1 + Math.max(0, p.life - 0.7)), p.color); } c.globalAlpha = 1; };
    // 結果：スコア行つき
    g.end = (win, titleText, lines, drawn, metric) => { if (g.over) return; if (win) { SFX.cheer(); vib([30, 40, 60]); } else SFX.bad(); g.finish(win, drawn, titleText, (lines || []).join(" ／ "), metric); };
    window.__pro = g;
    return g;
  }
  // ゴールテープ：レース系のゴール演出（テープを描く → 切れる → スロー＋花火＋「GOAL!」 → 結果へ）
  function goalTape(g) {
    const T = { broke: false, t: 0, win: false, fw: 0 }; g.tape = T;
    const tapeCol = (c, a) => { c.strokeStyle = "rgba(255,255,255," + a + ")"; };
    function checker(c, x, y, w, h, n) { const s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < Math.ceil(h / s); j++) { c.fillStyle = (i + j) % 2 ? "#111" : "#fff"; c.fillRect(x + i * s, y + j * s, s, Math.min(s, h - j * s)); } }
    // 横スクロール（横から見た図）：x＝ゴールの位置、gy＝地面
    T.drawSide = (c, x, gy, h = 120) => {
      const top = gy - h, chest = gy - 52;
      c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x - 3, gy - 2, 46, 5);
      // うしろの柱・前の柱・横断幕
      c.fillStyle = "#ced4da"; c.fillRect(x + 30, top + 8, 7, h - 8); c.fillStyle = "#f8f9fa"; c.fillRect(x - 4, top, 8, h);
      c.save(); c.translate(x - 4, top - 26); c.fillStyle = "#e03131"; rr(c, 0, 0, 48, 26, 5); c.fill(); checker(c, 3, 3, 42, 6, 7); txt(c, "GOAL", 24, 17, 12, "#fff"); c.restore();
      checker(c, x - 6, gy - 1, 50, 6, 10);
      if (!T.broke) { c.lineWidth = 5; c.strokeStyle = "#ff3b5c"; c.beginPath(); c.moveTo(x, chest); c.quadraticCurveTo(x + 17, chest + 6 + Math.sin(g.time * 6) * 2, x + 33, chest - 4); c.stroke(); c.lineWidth = 1.5; tapeCol(c, 0.8); c.beginPath(); c.moveTo(x, chest - 1); c.quadraticCurveTo(x + 17, chest + 5, x + 33, chest - 5); c.stroke(); }
      else { const k = Math.min(1, T.t * 2.2), sw = Math.sin(T.t * 9) * (1 - Math.min(1, T.t / 2)) * 0.5; for (const [ax, dir] of [[x, 1], [x + 33, -1]]) { c.save(); c.translate(ax, chest); c.rotate(dir * (0.3 + k * 1.1) + sw); c.lineWidth = 5; c.strokeStyle = "#ff3b5c"; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-dir * 10, 12, -dir * 4, 30); c.stroke(); c.restore(); } }
    };
    // たてスクロール／上から見た図：y＝ゴールの線、x0〜x1＝道のはば
    T.drawTop = (c, y, x0, x1) => {
      checker(c, x0, y - 6, x1 - x0, 12, Math.max(6, Math.round((x1 - x0) / 12)));
      c.fillStyle = "#f8f9fa"; c.beginPath(); c.arc(x0 - 6, y, 7, 0, 7); c.arc(x1 + 6, y, 7, 0, 7); c.fill();
      if (!T.broke) { c.lineWidth = 4; c.strokeStyle = "#ff3b5c"; c.beginPath(); c.moveTo(x0 - 6, y - 14); c.quadraticCurveTo((x0 + x1) / 2, y - 8 + Math.sin(g.time * 6) * 3, x1 + 6, y - 14); c.stroke(); }
      else { const k = Math.min(1, T.t * 2); c.lineWidth = 4; c.strokeStyle = "#ff3b5c"; const mid = (x0 + x1) / 2; c.beginPath(); c.moveTo(x0 - 6, y - 14); c.quadraticCurveTo(x0 + (mid - x0) * 0.5, y - 14 + 30 * k, x0 + (mid - x0) * (1 - k * 0.6), y - 14 + 46 * k); c.stroke(); c.beginPath(); c.moveTo(x1 + 6, y - 14); c.quadraticCurveTo(x1 - (x1 - mid) * 0.5, y - 14 + 30 * k, x1 - (x1 - mid) * (1 - k * 0.6), y - 14 + 46 * k); c.stroke(); }
    };
    // テープを切る（win＝自分が先、label＝下に出す文字）
    T.cross = (x, y, win, label, main) => {
      if (T.broke) return; T.broke = true; T.t = 0; T.win = win; T.main = main || (win ? "GOAL!" : "CPUがゴール"); T.label = label || (win ? "1着！" : "あと少しだった…"); T.x = x; T.y = y;
      g.ts = 0.3; g.flash(win ? "#fff" : "#9fb4ff", 0.55); g.shake(win ? 6 : 3);
      g.burst(x, y, ["#ff3b5c", "#fff", "#ffd43b"], 30, 260, 0.9, 3.5);
      if (win) { SFX.cheer(); tone(1047, 0.5, "triangle", 0.12, null, 0.1); vib([40, 30, 80]); } else { SFX.whoosh(); tone(330, 0.5, "triangle", 0.1, 260, 0.05); }
    };
    T.update = (rdt) => {
      if (!T.broke) return; T.t += rdt;
      if (T.t > 1.0) g.ts = Math.min(1, (g.ts || 0.3) + rdt * 1.5);
      if (T.win) { T.fw -= rdt; if (T.fw <= 0) { T.fw = 0.22; const fx = rand(g.W * 0.15, g.W * 0.85), fy = rand(g.H * 0.12, g.H * 0.45), cols = [["#ffd43b", "#fff"], ["#ff5fa2", "#fff"], ["#22d3ee", "#fff"], ["#69db7c", "#fff"]][Math.floor(rand(0, 4))]; for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2, v = rand(140, 220); g.parts.push({ x: fx, y: fy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.1, max: 1.1, color: cols[i % 2], size: 2.6, g: 160 }); } tone(rand(600, 900), 0.18, "sine", 0.05, 200); } }
    };
    T.overlay = (c) => {
      if (!T.broke) return; const k = Math.min(1, T.t / 0.35), W = g.W, Hh = g.H;
      if (!T.win) { c.fillStyle = "rgba(10,14,40," + Math.min(0.45, T.t * 0.3) + ")"; c.fillRect(0, 0, W, Hh); }
      c.save(); c.translate(W / 2, Hh * 0.3); const sc = T.win ? 0.4 + k * 0.6 + Math.sin(Math.min(1, T.t / 0.5) * Math.PI) * 0.25 : 0.6 + k * 0.4; c.scale(sc, sc); c.rotate(T.win ? Math.sin(T.t * 3) * 0.04 : 0);
      if (T.win) { glowOn(c, "#ffd43b", 24); } txt(c, T.main, 0, 0, T.main.length > 7 ? 32 : T.main.length > 4 ? 44 : 64, T.win ? "#ffe066" : "#c9d2ec", "center", 900, "rgba(0,0,0,.6)"); c.shadowBlur = 0; c.restore();
      if (T.t > 0.35) { c.globalAlpha = Math.min(1, (T.t - 0.35) * 3); txt(c, T.label, W / 2, Hh * 0.3 + 52, 22, T.win ? "#fff" : "#c9d2ec"); c.globalAlpha = 1; }
    };
    T.done = (sec = 2.3) => T.broke && T.t >= sec;
    const glowOn = (c, col, b) => { c.shadowColor = col; c.shadowBlur = b; };
    return T;
  }
  // バーチャルスティック（左半分）
  function stick(g, side = "left", r = 52) {
    const s = { id: null, ox: 0, oy: 0, dx: 0, dy: 0, on: false };
    s.take = (o) => { if (s.id == null && (side === "any" || (side === "left" ? o.sx < g.W * 0.5 : o.sx >= g.W * 0.5))) { s.id = o.id; s.ox = o.sx; s.oy = o.sy; s.on = true; s.dx = s.dy = 0; return true; } return false; };
    s.move = (o) => { if (o.id !== s.id) return false; let dx = o.x - s.ox, dy = o.y - s.oy; const m = Math.hypot(dx, dy); if (m > r) { dx *= r / m; dy *= r / m; } s.dx = dx / r; s.dy = dy / r; return true; };
    s.rel = (o) => { if (o.id !== s.id) return false; s.id = null; s.on = false; s.dx = s.dy = 0; return true; };
    s.draw = (c) => { if (!s.on) return; c.globalAlpha = 0.35; c.fillStyle = "#fff"; c.beginPath(); c.arc(s.ox, s.oy, r, 0, 7); c.fill(); c.globalAlpha = 0.8; c.beginPath(); c.arc(s.ox + s.dx * r, s.oy + s.dy * r, r * 0.42, 0, 7); c.fill(); c.globalAlpha = 1; };
    return s;
  }
  window.HMPro = { pro, stick, goalTape, SFX, tone, noise, vib, rr, txt, clamp, lerp, rand };
})();
