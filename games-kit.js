/* ほしまなび — 量産用のゲーム部品（カウントダウン・HUD・キャラクターの絵）。すべてオリジナル */
(() => {
  "use strict";
  const X = window.HMPro, { rr, txt, clamp, rand } = X;
  const K = {};
  // スタート前の 3・2・1・GO!（t＝経過秒）。走ってよければ true
  K.countdown = (g, t, c) => {
    const n = 3 - Math.floor(t);
    if (g.__cd !== n) { g.__cd = n; if (n > 0) X.tone(660, 0.12, "square", 0.08); else if (n === 0) X.tone(1320, 0.3, "square", 0.1); }
    if (t < 3.6 && c) {
      const k = t % 1, s = n > 0 ? String(n) : "GO!";
      c.save(); c.globalAlpha = n > 0 ? 1 - k * 0.6 : Math.max(0, 1 - (t - 3) * 1.7); c.translate(g.W / 2, g.H * 0.38); c.scale(1.6 - k * 0.6, 1.6 - k * 0.6);
      txt(c, s, 0, 0, n > 0 ? 70 : 64, n > 0 ? "#fff" : "#ffe066", "center", 900, "rgba(0,0,0,.6)"); c.restore();
    }
    return t >= 3;
  };
  // 上の帯（左・中・右）
  K.hud = (c, g, l, m, r) => {
    c.fillStyle = "rgba(10,14,40,.55)"; rr(c, 8, 8, g.W - 16, 34, 12); c.fill();
    if (l) txt(c, l, 20, 25, 15, "#fff", "left", 800, null);
    if (m) txt(c, m, g.W / 2, 25, 15, "#ffe066", "center", 900, null);
    if (r) txt(c, r, g.W - 20, 25, 15, "#fff", "right", 800, null);
  };
  // 進み具合のバー（racers：[{p:0..1, c:色, me:true}]）
  K.progress = (c, g, racers, y = 50) => {
    const x0 = 22, x1 = g.W - 22; c.fillStyle = "rgba(255,255,255,.35)"; rr(c, x0, y, x1 - x0, 6, 3); c.fill();
    c.fillStyle = "#111"; c.fillRect(x1 - 4, y - 3, 4, 12);
    for (const r of racers) { const x = x0 + (x1 - x0) * clamp(r.p, 0, 1); c.fillStyle = r.c; c.beginPath(); c.arc(x, y + 3, r.me ? 7 : 5, 0, 7); c.fill(); if (r.me) { c.lineWidth = 2; c.strokeStyle = "#fff"; c.stroke(); } }
  };
  K.rankName = (n) => n + "位";
  // 人（横から見た図）：x,y＝足もと、ph＝走りの位相、col＝服の色、pose：run/jump/slide/stand/fall/swim
  K.person = (c, x, y, ph, col, pose = "run", s = 1, skin = "#f8c291", hair = "#3b2a20") => {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = "round"; c.lineJoin = "round";
    const leg = Math.sin(ph) * 0.9, arm = -Math.sin(ph) * 0.9;
    c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(0, 1, 13, 3, 0, 0, 7); c.fill();
    if (pose === "slide") { c.rotate(-1.15); }
    if (pose === "fall") { c.rotate(1.2); }
    const hipY = -22, shY = -40;
    const limb = (x0, y0, a, l1, a2, l2, w, colr) => { c.strokeStyle = colr; c.lineWidth = w; const x1 = x0 + Math.sin(a) * l1, y1 = y0 + Math.cos(a) * l1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1 + Math.sin(a + a2) * l2, y1 + Math.cos(a + a2) * l2); c.stroke(); };
    const jl = pose === "jump" ? [0.9, -1.5] : [leg, -Math.abs(leg) * 0.9 - 0.2];
    limb(0, hipY, -jl[0], 11, jl[1] * -1 * 0.8, 11, 5.5, "#2b2d42");
    limb(0, hipY, jl[0], 11, -0.3 - Math.max(0, -jl[0]) * 0.9, 11, 5.5, "#3d405b");
    limb(0, shY + 3, -arm - 0.2, 9, -1.1, 9, 4.5, skin);
    c.fillStyle = col; rr(c, -7, shY - 1, 14, 21, 6); c.fill();
    c.fillStyle = "rgba(255,255,255,.25)"; rr(c, -5, shY + 1, 4, 16, 2); c.fill();
    limb(0, shY + 3, arm + 0.2, 9, -1.1, 9, 4.5, skin);
    c.fillStyle = skin; c.beginPath(); c.arc(2, shY - 9, 8, 0, 7); c.fill();
    c.fillStyle = hair; c.beginPath(); c.arc(1, shY - 11, 8, Math.PI * 0.95, Math.PI * 2.1); c.fill();
    c.fillStyle = "#222"; c.beginPath(); c.arc(6, shY - 9, 1.3, 0, 7); c.fill();
    c.restore();
  };
  // ゼッケンつきの名前ラベル
  K.tag = (c, x, y, s, col) => { c.font = "800 11px system-ui,sans-serif"; const w = c.measureText(s).width + 10; c.fillStyle = col; rr(c, x - w / 2, y - 8, w, 16, 8); c.fill(); txt(c, s, x, y, 11, "#fff", "center", 800, null); };
  K.RIVALS = [["CPU赤", "#ff6b6b"], ["CPU青", "#4dabf7"], ["CPU緑", "#51cf66"], ["CPU紫", "#cc5de8"]];
  K.fmtT = (t) => t.toFixed(2);
  window.HMKit = K;
})();
