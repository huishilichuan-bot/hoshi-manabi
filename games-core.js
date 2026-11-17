/* ほしまなび — 新しいゲームの共通部品（すべてオリジナル実装） */
(() => {
  "use strict";
  const GC = (window.GCGames = window.GCGames || { open: {}, active: null, stop() { const a = this.active; this.active = null; if (a && a.stop) { try { a.stop(); } catch (e) {} } } });
  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const DI = { easy: 0, normal: 1, hard: 2, ultra: 3 };
  function setupCanvas(cv, w, h) { const dpr = Math.min(window.devicePixelRatio || 1, 3); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + "px"; cv.style.height = h + "px"; const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx; }
  function shell(id, diff, title, html) {
    const GF = window.GF;
    const g = { id, diff, d: DI[diff] != null ? DI[diff] : 1, timers: [], raf: 0, stopped: false, over: false, listeners: [] };
    g.later = (fn, ms) => { const t = setTimeout(() => { if (!g.stopped && !g.over) fn(); }, ms); g.timers.push(t); return t; };
    g.every = (fn, ms) => { const t = setInterval(() => { if (!g.stopped && !g.over) fn(); }, ms); g.timers.push(t); return t; };
    g.on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); g.listeners.push([el, ev, fn, opt]); };
    g.stop = () => { g.stopped = true; g.timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); cancelAnimationFrame(g.raf); g.listeners.forEach(([el, ev, fn, opt]) => el.removeEventListener(ev, fn, opt)); };
    const body = GF.openLayer(title + "（" + GF.diffName(diff) + "）", () => { if (GC.active === g) GC.stop(); else g.stop(); });
    GC.active = g;
    body.innerHTML = '<div class="hg">' + html + "</div>";
    g.body = body;
    g.$ = (s) => body.querySelector(s);
    g.$$ = (s) => Array.from(body.querySelectorAll(s));
    g.status = (t) => { const s = g.$(".hg-status"); if (s) s.innerHTML = t; };
    g.finish = (win, draw, t, text) => {
      if (g.over) return;
      g.over = true; cancelAnimationFrame(g.raf);
      GF.reportGame(id, diff, !!win, {});
      setTimeout(() => { if (!g.stopped) GF.showResult({ win: !!win, draw: !!draw, title: t || (win ? "勝ち！" : draw ? "引き分け" : "負け…"), text, onRetry: () => GC.open[id](diff) }); }, 600);
    };
    g.loop = (step) => { let last = null; const f = (ts) => { if (g.stopped || g.over) return; const dt = last == null ? 0 : Math.min(0.05, (ts - last) / 1000); last = ts; step(dt); g.raf = requestAnimationFrame(f); }; g.raf = requestAnimationFrame(f); };
    // CPUとの時間きょうそう：CPUが secs 秒で終わる前にクリアすれば勝ち
    g.race = (secs, label) => {
      const bar = document.createElement("div"); bar.className = "hg-race"; bar.innerHTML = '<span>🤖 ' + (label || "CPU") + '</span><div class="hg-rbar"><i></i></div><b class="num">' + secs + "s</b>";
      g.body.querySelector(".hg").prepend(bar);
      const t0 = performance.now();
      g.every(() => { const e = (performance.now() - t0) / 1000, left = Math.max(0, secs - e); bar.querySelector("i").style.width = Math.min(100, (e / secs) * 100) + "%"; bar.querySelector("b").textContent = Math.ceil(left) + "s"; if (left <= 0) g.finish(false, false, "CPUの勝ち", "CPUのほうが先に終わりました。"); }, 200);
      return () => (performance.now() - t0) / 1000;
    };
    g.size = () => { const w = Math.min(body.clientWidth || 360, 480) - 16; return Math.max(260, w); };
    return g;
  }
  const list = [];
  window.HMGames = { list, add(meta, fn) { const i = list.findIndex((x) => x.id === meta.id); if (i >= 0) list[i] = meta; else list.push(meta); GC.open[meta.id] = fn; }, shell, rnd, shuffle, setupCanvas, DI };
})();
