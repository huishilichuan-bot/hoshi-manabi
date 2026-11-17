/* ほしまなび — 本格ゲーム用エンジン（キャンバス・入力・パーティクル・効果音・画面ゆれ）。すべてオリジナル */
(() => {
  "use strict";
  const H = window.HMGames;
  let AC = null;
  const ac = () => { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} return AC; };
  function tone(f, dur, type = "sine", vol = 0.15, f2 = null, delay = 0) {
    const a = ac(); if (!a) return; const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur = 0.2, vol = 0.2, hp = 400, delay = 0) {
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
        g.time += dt; update(dt);
        for (const p of g.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.vy += (p.g || 0) * dt; p.life -= dt; }
        g.parts = g.parts.filter((p) => p.life > 0); if (g.parts.length > 600) g.parts.splice(0, g.parts.length - 600);
        for (const p of g.pops) { p.y -= 40 * dt; p.life -= dt; } g.pops = g.pops.filter((p) => p.life > 0);
        g.shakeA *= Math.pow(0.02, dt); g.flashA = Math.max(0, g.flashA - dt * 2);
        c.save(); if (g.shakeA > 0.3) c.translate(rand(-g.shakeA, g.shakeA), rand(-g.shakeA, g.shakeA));
        draw(c);
        if (!g.noAutoParts) g.drawFx();
        c.restore();
        if (g.flashA > 0) { c.globalAlpha = g.flashA; c.fillStyle = g.flashC; c.fillRect(0, 0, W, Hh); c.globalAlpha = 1; }
      });
    };
    g.drawFx = () => { for (const p of g.parts) { c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.size, 0, 7); c.fill(); } c.globalAlpha = 1; for (const p of g.pops) { c.globalAlpha = Math.min(1, p.life * 2); txt(c, p.s, p.x, p.y, p.size * (1 + Math.max(0, p.life - 0.7)), p.color); } c.globalAlpha = 1; };
    // 結果：スコア行つき
    g.end = (win, titleText, lines, drawn) => { if (g.over) return; if (win) { SFX.cheer(); vib([30, 40, 60]); } else SFX.bad(); g.finish(win, drawn, titleText, (lines || []).join(" ／ ")); };
    window.__pro = g;
    return g;
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
  window.HMPro = { pro, stick, SFX, tone, noise, vib, rr, txt, clamp, lerp, rand };
})();
