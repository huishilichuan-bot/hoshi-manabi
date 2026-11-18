/* ほしまなび — 頭を使うゲーム（リバーシ / 五目並べ / ミニ将棋 / 神経衰弱）。すべてオリジナル実装・CPU対戦 */
(() => {
  "use strict";
  const R = (window.GCGames = window.GCGames || {
    open: {},
    active: null,
    stop() { const a = this.active; this.active = null; if (a && a.stop) { try { a.stop(); } catch (e) {} } },
  });
  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const D8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  // 盤ゲーム共通の画面
  function shell(id, diff, title, o) {
    const GF = window.GF;
    const game = { id, diff, timers: [], stopped: false, over: false };
    game.later = (fn, ms) => { const t = setTimeout(() => { if (!game.stopped) fn(); }, ms); game.timers.push(t); return t; };
    game.stop = () => { game.stopped = true; game.timers.forEach(clearTimeout); };
    const body = GF.openLayer(title + "（" + GF.diffName(diff) + "）", () => { if (R.active === game) R.stop(); else game.stop(); });
    R.active = game;
    body.innerHTML = '<div class="bg-wrap ' + (o.cls || "") + '">' +
      '<div class="bg-player top"><span class="bg-dot ' + (o.cpuDot || "") + '">' + (o.cpuMark || "") + "</span><b>CPU・" + GF.diffName(diff) + '</b><span class="bg-score num" id="bg-score-cpu"></span></div>' +
      (o.topExtra || "") + '<div class="bg-board" id="bg-board" role="grid" aria-label="' + title + 'の盤"></div>' + (o.bottomExtra || "") +
      '<div class="bg-player"><span class="bg-dot ' + (o.meDot || "") + '">' + (o.meMark || "") + '</span><b>あなた</b><span class="bg-score num" id="bg-score-me"></span></div>' +
      '<div class="bg-status" id="bg-status" aria-live="polite"></div><div class="bg-actions" id="bg-actions"></div><div id="bg-extra"></div></div>';
    game.$ = (s) => body.querySelector(s);
    game.status = (t) => { const el = game.$("#bg-status"); if (el) el.textContent = t; };
    game.finish = (win, draw, title2, text, metric) => {
      if (game.over) return;
      game.over = true;
      const reward = GF.reportGame(id, diff, !!win, { metric: metric || (typeof game.metric === "function" ? game.metric(!!win) : game.metric) || null });
      game.later(() => GF.showResult({ win: !!win, draw: !!draw, title: title2, text, reward, onRetry: () => R.open[id](diff) }), 650);
    };
    // ヒント・待った・投了
    game.actions = (h) => {
      const el = game.$("#bg-actions"); if (!el) return;
      if (game.over) { el.innerHTML = ""; return; }
      el.innerHTML = (h.hints != null ? '<button type="button" class="btn sm ghost" data-a="hint"' + (h.hints > 0 && h.canAct ? "" : " disabled") + ">💡 ヒント " + h.hints + "</button>" : "") +
        (h.undos != null ? '<button type="button" class="btn sm ghost" data-a="undo"' + (h.undos > 0 && h.canAct && h.canUndo ? "" : " disabled") + ">↩ 待った " + h.undos + "</button>" : "") +
        '<button type="button" class="btn sm ghost" data-a="resign"' + (h.canAct ? "" : " disabled") + ">" + (game.resignArm ? "本当に投了？" : "🏳 投了") + "</button>";
    };
    body.addEventListener("click", (e) => {
      const b = e.target.closest("[data-a]"); if (!b || b.disabled || game.over) return;
      if (b.dataset.a === "hint" && game.onHint) game.onHint();
      if (b.dataset.a === "undo" && game.onUndo) game.onUndo();
      if (b.dataset.a === "resign") {
        if (!game.resignArm) { game.resignArm = true; game.refresh && game.refresh(); game.later(() => { game.resignArm = false; game.refresh && game.refresh(); }, 3000); return; }
        game.finish(false, false, "投了しました", "また挑戦しましょう。");
        game.refresh && game.refresh();
      }
    });
    return game;
  }

  /* =====================================================
   * リバーシ（8×8）あなた＝黒（先手）
   * ===================================================== */
  const RW = [100, -25, 10, 5, 5, 10, -25, 100, -25, -45, -2, -2, -2, -2, -45, -25, 10, -2, 2, 1, 1, 2, -2, 10, 5, -2, 1, 0, 0, 1, -2, 5, 5, -2, 1, 0, 0, 1, -2, 5, 10, -2, 2, 1, 1, 2, -2, 10, -25, -45, -2, -2, -2, -2, -45, -25, 100, -25, 10, 5, 5, 10, -25, 100];
  function rvFlips(b, i, p) {
    if (b[i]) return null;
    const r0 = i >> 3, c0 = i & 7; let all = null;
    for (const [dr, dc] of D8) {
      let r = r0 + dr, c = c0 + dc; const line = [];
      while (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === -p) { line.push(r * 8 + c); r += dr; c += dc; }
      if (line.length && r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === p) all = all ? all.concat(line) : line;
    }
    return all;
  }
  function rvMoves(b, p) { const out = []; for (let i = 0; i < 64; i++) { const f = rvFlips(b, i, p); if (f) out.push({ i, f }); } return out; }
  function rvApply(b, m, p) { const nb = b.slice(); nb[m.i] = p; m.f.forEach((k) => (nb[k] = p)); return nb; }
  function rvEval(b, p) {
    let s = 0, empt = 0, disc = 0;
    for (let i = 0; i < 64; i++) { s += RW[i] * b[i]; if (!b[i]) empt++; else disc += b[i]; }
    // 角が取られていれば、その周りの減点はしない
    [[0, 1, 8, 9], [7, 6, 15, 14], [56, 57, 48, 49], [63, 62, 55, 54]].forEach(([c, ...adj]) => { if (b[c]) adj.forEach((k) => (s -= RW[k] * b[k])); });
    const mob = rvMoves(b, 1).length - rvMoves(b, -1).length;
    s += mob * 8;
    if (empt < 14) s += disc * (14 - empt) * 2;
    return s * p;
  }
  function rvSearch(b, p, depth, alpha, beta, dl, ctx) {
    if (++ctx.n % 512 === 0 && performance.now() > dl) ctx.timeout = true;
    if (ctx.timeout) return 0;
    const ms = rvMoves(b, p);
    if (!ms.length) {
      if (!rvMoves(b, -p).length) { let d = 0; for (let i = 0; i < 64; i++) d += b[i]; return d * p * 10000; }
      return -rvSearch(b, -p, depth, -beta, -alpha, dl, ctx);
    }
    if (depth <= 0) return rvEval(b, p);
    ms.sort((x, y) => RW[y.i] - RW[x.i]);
    let best = -Infinity;
    for (const m of ms) {
      const v = -rvSearch(rvApply(b, m, p), -p, depth - 1, -beta, -alpha, dl, ctx);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }
  function rvBest(b, p, diff) {
    const ms = rvMoves(b, p); if (!ms.length) return null;
    if (diff === "easy") { if (Math.random() < 0.65) return ms[rnd(ms.length)]; return ms.sort((x, y) => y.f.length - x.f.length)[0]; }
    if (diff === "normal") {
      const sc = ms.map((m) => ({ m, v: -rvEval(rvApply(b, m, p), -p) + Math.random() * 30 })).sort((x, y) => y.v - x.v);
      return sc[0].m;
    }
    const empt = b.filter((x) => !x).length;
    const maxD = diff === "hard" ? 3 : empt <= 12 ? empt : 8;
    const dl = performance.now() + (diff === "hard" ? 500 : 1100);
    let bestM = ms[0];
    for (let d = 1; d <= maxD; d++) {
      const ctx = { n: 0, timeout: false }; let alpha = -Infinity, cur = null;
      const order = ms.slice().sort((x, y) => (x === bestM ? -1 : y === bestM ? 1 : RW[y.i] - RW[x.i]));
      for (const m of order) { const v = -rvSearch(rvApply(b, m, p), -p, d - 1, -Infinity, -alpha, dl, ctx); if (ctx.timeout) break; if (v > alpha) { alpha = v; cur = m; } }
      if (ctx.timeout) break;
      if (cur) bestM = cur;
    }
    return bestM;
  }
  R.open.reversi = function (diff) {
    const GF = window.GF, adv = GF.advantage();
    const g = shell("reversi", diff, "リバーシ", { cls: "rv", cpuDot: "w", meDot: "b" });
    let b = Array(64).fill(0); b[27] = b[36] = -1; b[28] = b[35] = 1;
    let turn = 1, last = -1, hint = -1, thinking = false, hints = adv.hints, undos = adv.undos; const hist = [];
    const boardEl = g.$("#bg-board");
    function render(flipped) {
      const legal = turn === 1 && !thinking && !g.over ? rvMoves(b, 1).map((m) => m.i) : [];
      boardEl.innerHTML = b.map((v, i) => '<button type="button" class="rv-sq' + (i === last ? " last" : "") + (i === hint ? " hint" : "") + '" data-i="' + i + '" aria-label="' + "abcdefgh"[i & 7] + (8 - (i >> 3)) + (v ? (v === 1 ? " 黒" : " 白") : legal.includes(i) ? " 置ける" : "") + '">' + (v ? '<i class="disc ' + (v === 1 ? "b" : "w") + (flipped && flipped.includes(i) ? " flip" : "") + '"></i>' : legal.includes(i) ? '<i class="dot"></i>' : "") + "</button>").join("");
      const nb = b.filter((x) => x === 1).length, nw = b.filter((x) => x === -1).length;
      g.$("#bg-score-me").textContent = "● " + nb; g.$("#bg-score-cpu").textContent = "○ " + nw;
      g.actions({ hints, undos, canAct: turn === 1 && !thinking, canUndo: hist.length > 0 });
    }
    g.refresh = () => render();
    function endCheck() {
      if (rvMoves(b, 1).length || rvMoves(b, -1).length) return false;
      const nb = b.filter((x) => x === 1).length, nw = b.filter((x) => x === -1).length;
      render();
      if (nb > nw) g.finish(true, false, "勝利！", "黒 " + nb + " − 白 " + nw + " であなたの勝ち");
      else if (nb < nw) g.finish(false, false, "CPUの勝ち", "黒 " + nb + " − 白 " + nw);
      else g.finish(false, true, "引き分け", "黒 " + nb + " − 白 " + nw);
      g.status("ゲーム終了");
      return true;
    }
    function playerTurn() {
      if (endCheck()) return;
      if (!rvMoves(b, 1).length) { g.status("置ける場所がないのでパスします"); turn = -1; render(); g.later(cpuTurn, 900); return; }
      turn = 1; g.status("あなたの番（黒）"); render();
    }
    function cpuTurn() {
      if (g.over) return;
      if (endCheck()) return;
      const ms = rvMoves(b, -1);
      if (!ms.length) { g.status("CPUはパスしました"); turn = 1; g.later(playerTurn, 700); render(); return; }
      thinking = true; turn = -1; g.status("CPUが考え中…"); render();
      g.later(() => {
        const m = rvBest(b, -1, diff);
        b = rvApply(b, m, -1); last = m.i; thinking = false;
        render(m.f); playerTurn();
      }, 380);
    }
    boardEl.addEventListener("click", (e) => {
      const c = e.target.closest("[data-i]"); if (!c || turn !== 1 || thinking || g.over) return;
      const i = +c.dataset.i, f = rvFlips(b, i, 1);
      if (!f) { GF.haptic && GF.haptic([6, 30, 6]); return; }
      hist.push({ b: b.slice(), last });
      b = rvApply(b, { i, f }, 1); last = i; hint = -1; turn = -1;
      render(f); g.later(cpuTurn, 250);
    });
    g.onHint = () => { if (hints <= 0 || turn !== 1) return; const m = rvBest(b, 1, "hard"); if (m) { hints--; hint = m.i; render(); g.status("ヒント：光っているマスがおすすめです"); } };
    g.onUndo = () => { if (undos <= 0 || !hist.length || turn !== 1) return; const h = hist.pop(); b = h.b; last = h.last; undos--; hint = -1; playerTurn(); };
    g.debug = { state: () => ({ b, turn }), legal: () => (turn === 1 && !thinking ? rvMoves(b, 1).map((m) => m.i) : []), click: (i) => boardEl.querySelector('[data-i="' + i + '"]').click(), forceWin: () => { b = b.map((x) => (x === 0 ? 1 : x === -1 ? 1 : 1)); b[0] = -1; render(); endCheck(); } };
    playerTurn();
  };

  /* =====================================================
   * 五目並べ（13×13・自由ルール）あなた＝黒（先手）
   * ===================================================== */
  const GN = 13;
  const GDIR = [[0, 1], [1, 0], [1, 1], [1, -1]];
  function gmWin(b, i, p) {
    const r0 = Math.floor(i / GN), c0 = i % GN;
    for (const [dr, dc] of GDIR) {
      let n = 1; const line = [i];
      for (const s of [1, -1]) { let r = r0 + dr * s, c = c0 + dc * s; while (r >= 0 && r < GN && c >= 0 && c < GN && b[r * GN + c] === p) { n++; line.push(r * GN + c); r += dr * s; c += dc * s; } }
      if (n >= 5) return line;
    }
    return null;
  }
  const GSC = [0, 1, 12, 120, 1800, 100000];
  function gmCellScore(b, i, p) {
    const r0 = Math.floor(i / GN), c0 = i % GN; let s = 0;
    for (const [dr, dc] of GDIR) {
      for (let k = -4; k <= 0; k++) {
        let mine = 0, ok = true;
        for (let t = 0; t < 5; t++) {
          const r = r0 + dr * (k + t), c = c0 + dc * (k + t);
          if (r < 0 || r >= GN || c < 0 || c >= GN) { ok = false; break; }
          const v = r * GN + c === i ? p : b[r * GN + c];
          if (v === -p) { ok = false; break; }
          if (v === p) mine++;
        }
        if (ok) s += GSC[mine];
      }
    }
    return s;
  }
  function gmCands(b) {
    const out = [], has = b.some((x) => x);
    if (!has) return [Math.floor(GN * GN / 2)];
    for (let i = 0; i < GN * GN; i++) {
      if (b[i]) continue;
      const r0 = Math.floor(i / GN), c0 = i % GN; let near = false;
      for (let dr = -2; dr <= 2 && !near; dr++) for (let dc = -2; dc <= 2; dc++) { const r = r0 + dr, c = c0 + dc; if (r >= 0 && r < GN && c >= 0 && c < GN && b[r * GN + c]) { near = true; break; } }
      if (near) out.push(i);
    }
    return out;
  }
  function gmScored(b, p, dw) {
    return gmCands(b).map((i) => { const a = gmCellScore(b, i, p), d = gmCellScore(b, i, -p); return { i, a, d, v: a + d * dw }; }).sort((x, y) => y.v - x.v);
  }
  function gmBest(b, p, diff) {
    const cands = gmScored(b, p, diff === "easy" ? 0.45 : diff === "normal" ? 0.85 : 0.95);
    if (!cands.length) return -1;
    // すぐ勝てる・すぐ負ける手は強さに関係なく優先（弱いはたまに見落とす）
    const win = cands.find((c) => { const nb = b.slice(); nb[c.i] = p; return gmWin(nb, c.i, p); });
    const lose = cands.find((c) => { const nb = b.slice(); nb[c.i] = -p; return gmWin(nb, c.i, -p); });
    if (win && (diff !== "easy" || Math.random() < 0.6)) return win.i;
    if (lose && (diff !== "easy" || Math.random() < 0.5)) return lose.i;
    if (diff === "easy") { const top = cands.slice(0, 8); return top[rnd(top.length)].i; }
    if (diff === "normal") { const top = cands.slice(0, 3); return top[Math.random() < 0.6 ? 0 : rnd(top.length)].i; }
    if (diff === "hard") return cands[0].i;
    // ウルトラ：上位候補について相手の最善の返しを読む
    const top = cands.slice(0, 10);
    let best = top[0].i, bestV = -Infinity;
    top.forEach((c) => {
      const nb = b.slice(); nb[c.i] = p;
      const opp = gmScored(nb, -p, 1.0).slice(0, 6);
      let oppMax = 0;
      opp.forEach((o) => { const nb2 = nb.slice(); nb2[o.i] = -p; if (gmWin(nb2, o.i, -p)) oppMax = Math.max(oppMax, 1e7); oppMax = Math.max(oppMax, o.a * 1.1 + o.d * 0.6); });
      const v = c.a * 1.05 + c.d * 0.95 - oppMax * 0.7;
      if (v > bestV) { bestV = v; best = c.i; }
    });
    return best;
  }
  R.open.gomoku = function (diff) {
    const GF = window.GF, adv = GF.advantage();
    const g = shell("gomoku", diff, "五目並べ", { cls: "gm", cpuDot: "w", meDot: "b" });
    let b = Array(GN * GN).fill(0), turn = 1, last = -1, hint = -1, thinking = false, hints = adv.hints, undos = adv.undos, winLine = null;
    const hist = [];
    const boardEl = g.$("#bg-board");
    boardEl.style.setProperty("--n", GN);
    function render() {
      boardEl.innerHTML = b.map((v, i) => { const r = Math.floor(i / GN), c = i % GN; return '<button type="button" class="gm-pt' + (r === 0 ? " t" : "") + (r === GN - 1 ? " bt" : "") + (c === 0 ? " l" : "") + (c === GN - 1 ? " r" : "") + (i === last ? " last" : "") + (i === hint ? " hint" : "") + (winLine && winLine.includes(i) ? " win" : "") + '" data-i="' + i + '" aria-label="' + (r + 1) + "-" + (c + 1) + (v ? (v === 1 ? " 黒" : " 白") : "") + '">' + (v ? '<i class="stone ' + (v === 1 ? "b" : "w") + '"></i>' : "") + "</button>"; }).join("");
      g.$("#bg-score-me").textContent = "● 先手"; g.$("#bg-score-cpu").textContent = "○ 後手";
      g.actions({ hints, undos, canAct: turn === 1 && !thinking, canUndo: hist.length > 0 });
    }
    g.refresh = render;
    function place(i, p) {
      b[i] = p; last = i;
      const w = gmWin(b, i, p);
      if (w) { winLine = w; render(); if (p === 1) g.finish(true, false, "勝利！", "5つ並びました。あなたの勝ち"); else g.finish(false, false, "CPUの勝ち", "CPUが5つ並べました"); g.status("ゲーム終了"); return true; }
      if (b.every((x) => x)) { render(); g.finish(false, true, "引き分け", "盤がいっぱいになりました"); return true; }
      return false;
    }
    boardEl.addEventListener("click", (e) => {
      const c = e.target.closest("[data-i]"); if (!c || turn !== 1 || thinking || g.over) return;
      const i = +c.dataset.i; if (b[i]) return;
      hist.push({ b: b.slice(), last }); hint = -1;
      if (place(i, 1)) return;
      turn = -1; thinking = true; g.status("CPUが考え中…"); render();
      g.later(() => {
        const m = gmBest(b, -1, diff); thinking = false;
        if (place(m, -1)) return;
        turn = 1; g.status("あなたの番（黒）"); render();
      }, 320);
    });
    g.onHint = () => { if (hints <= 0 || turn !== 1) return; hints--; hint = gmBest(b, 1, "hard"); render(); g.status("ヒント：光っている点がおすすめです"); };
    g.onUndo = () => { if (undos <= 0 || !hist.length || turn !== 1) return; const h = hist.pop(); b = h.b; last = h.last; undos--; hint = -1; render(); g.status("1手もどしました"); };
    g.debug = { state: () => ({ b, turn }), legal: () => (turn === 1 && !thinking ? b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0) : []), click: (i) => boardEl.querySelector('[data-i="' + i + '"]').click(), forceWin: () => { [0, 1, 2, 3].forEach((k) => (b[k] = 1)); b[4] = 0; turn = 1; thinking = false; render(); boardEl.querySelector('[data-i="4"]').click(); } };
    g.status("あなたの番（黒）。縦・横・ななめに5つ並べたら勝ち"); render();
  };

  /* =====================================================
   * ミニ将棋（5×5）あなた＝先手（下）
   * 駒コード：owner(16) | 成(8) | 種類 1玉 2金 3銀 4角 5飛 6歩
   * ===================================================== */
  const K = 1, G = 2, S = 3, B = 4, RK = 5, P = 6, PROM = 8, GOTE = 16;
  const NAMES = { 1: "玉", 2: "金", 3: "銀", 4: "角", 5: "飛", 6: "歩" };
  const PNAMES = { 3: "全", 4: "馬", 5: "龍", 6: "と" };
  const HNAME = { 2: "金", 3: "銀", 4: "角", 5: "飛", 6: "歩" };
  const VAL = { 1: 0, 2: 600, 3: 500, 4: 800, 5: 1000, 6: 100 };
  const PVAL = { 3: 600, 4: 1200, 5: 1400, 6: 600 };
  const HVAL = { 2: 640, 3: 540, 4: 860, 5: 1080, 6: 130 };
  const own = (pc) => (pc & GOTE ? 1 : 0);
  const typ = (pc) => pc & 7;
  const isProm = (pc) => !!(pc & PROM);
  const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]], DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  function steps(pc) {
    const t = typ(pc), f = own(pc) ? 1 : -1, pr = isProm(pc);
    if (t === K) return D8;
    if (t === G || (pr && (t === S || t === P))) return [[f, 0], [f, -1], [f, 1], [0, -1], [0, 1], [-f, 0]];
    if (t === S) return [[f, 0], [f, -1], [f, 1], [-f, -1], [-f, 1]];
    if (t === P) return [[f, 0]];
    if (t === B && pr) return ORTH;
    if (t === RK && pr) return DIAG;
    return [];
  }
  const slides = (pc) => (typ(pc) === B ? DIAG : typ(pc) === RK ? ORTH : null);
  function targets(b, i) {
    const pc = b[i], o = own(pc), r0 = Math.floor(i / 5), c0 = i % 5, out = [];
    for (const [dr, dc] of steps(pc)) { const r = r0 + dr, c = c0 + dc; if (r < 0 || r > 4 || c < 0 || c > 4) continue; const q = b[r * 5 + c]; if (!q || own(q) !== o) out.push(r * 5 + c); }
    const sl = slides(pc);
    if (sl) for (const [dr, dc] of sl) { let r = r0 + dr, c = c0 + dc; while (r >= 0 && r <= 4 && c >= 0 && c <= 4) { const q = b[r * 5 + c]; if (!q) out.push(r * 5 + c); else { if (own(q) !== o) out.push(r * 5 + c); break; } r += dr; c += dc; } }
    return out;
  }
  const zone = (sq, o) => (o === 0 ? sq < 5 : sq >= 20);
  const lastRow = (sq, o) => (o === 0 ? sq < 5 : sq >= 20);
  function attacked(b, sq, by) { for (let i = 0; i < 25; i++) { const pc = b[i]; if (pc && own(pc) === by && targets(b, i).includes(sq)) return true; } return false; }
  const kingSq = (b, o) => b.findIndex((pc) => pc && typ(pc) === K && own(pc) === o);
  function pseudo(pos, o, full) {
    const b = pos.b, out = [];
    for (let i = 0; i < 25; i++) {
      const pc = b[i]; if (!pc || own(pc) !== o) continue;
      const t = typ(pc);
      for (const to of targets(b, i)) {
        const canP = !isProm(pc) && t !== K && t !== G && (zone(i, o) || zone(to, o));
        const must = t === P && lastRow(to, o);
        if (canP) { out.push({ f: i, t: to, pr: true }); if (!must && (full || t === S)) out.push({ f: i, t: to, pr: false }); }
        else out.push({ f: i, t: to, pr: false });
      }
    }
    const h = pos.h[o];
    for (const t of [P, S, G, B, RK]) {
      if (!h[t]) continue;
      for (let sq = 0; sq < 25; sq++) {
        if (b[sq]) continue;
        if (t === P) {
          if (lastRow(sq, o)) continue;
          let nifu = false; for (let r = 0; r < 5; r++) { const q = b[r * 5 + (sq % 5)]; if (q && own(q) === o && typ(q) === P && !isProm(q)) { nifu = true; break; } }
          if (nifu) continue;
        }
        out.push({ f: -1, t: sq, d: t });
      }
    }
    return out;
  }
  function make(pos, m) {
    const o = pos.turn;
    if (m.f < 0) { pos.b[m.t] = (o ? GOTE : 0) | m.d; pos.h[o][m.d]--; }
    else { const pc = pos.b[m.f]; m.pc = pc; m.cap = pos.b[m.t]; if (m.cap) pos.h[o][typ(m.cap)]++; pos.b[m.t] = m.pr ? pc | PROM : pc; pos.b[m.f] = 0; }
    pos.turn = 1 - o;
  }
  function unmake(pos, m) {
    pos.turn = 1 - pos.turn; const o = pos.turn;
    if (m.f < 0) { pos.b[m.t] = 0; pos.h[o][m.d]++; }
    else { pos.b[m.f] = m.pc; pos.b[m.t] = m.cap; if (m.cap) pos.h[o][typ(m.cap)]--; }
  }
  const inCheck = (pos, o) => { const k = kingSq(pos.b, o); return k >= 0 && attacked(pos.b, k, 1 - o); };
  function legal(pos, full) {
    const o = pos.turn, out = [];
    for (const m of pseudo(pos, o, full)) {
      make(pos, m);
      let ok = !inCheck(pos, o);
      // 打ち歩詰めの禁止
      if (ok && m.f < 0 && m.d === P && inCheck(pos, 1 - o)) { if (!legal(pos, false).length) ok = false; }
      unmake(pos, m);
      if (ok) out.push(m);
    }
    return out;
  }
  function shEval(pos) {
    let s = 0;
    for (let i = 0; i < 25; i++) {
      const pc = pos.b[i]; if (!pc) continue;
      const t = typ(pc), sg = own(pc) ? -1 : 1;
      let v = isProm(pc) ? PVAL[t] : VAL[t];
      if (t === P && !isProm(pc)) v += (own(pc) ? Math.floor(i / 5) : 4 - Math.floor(i / 5)) * 8;
      s += v * sg;
    }
    for (const t of [G, S, B, RK, P]) s += (pos.h[0][t] - pos.h[1][t]) * HVAL[t];
    // 玉の周りの守り
    for (const o of [0, 1]) { const k = kingSq(pos.b, o); if (k < 0) continue; const r0 = Math.floor(k / 5), c0 = k % 5; let d = 0; for (const [dr, dc] of D8) { const r = r0 + dr, c = c0 + dc; if (r < 0 || r > 4 || c < 0 || c > 4) continue; const q = pos.b[r * 5 + c]; if (q && own(q) === o) d += 12; if (attacked(pos.b, r * 5 + c, 1 - o)) d -= 10; } s += o ? -d : d; }
    return pos.turn ? -s : s;
  }
  const MATE = 1e6;
  function shSearch(pos, depth, alpha, beta, ctx) {
    if (++ctx.n % 256 === 0 && performance.now() > ctx.dl) ctx.timeout = true;
    if (ctx.timeout) return 0;
    const o = pos.turn, ms = pseudo(pos, o, false);
    const ek = kingSq(pos.b, 1 - o);
    for (const m of ms) if (m.f >= 0 && m.t === ek) return MATE;
    if (depth <= 0) return shEval(pos);
    ms.forEach((m) => { const q = m.f >= 0 ? pos.b[m.t] : 0; m.ord = (q ? (isProm(q) ? PVAL[typ(q)] : VAL[typ(q)]) * 10 - (VAL[typ(pos.b[m.f])] || 0) : 0) + (m.pr ? 300 : 0) + (m.f < 0 ? -50 : 0); });
    ms.sort((a, b) => b.ord - a.ord);
    let best = -Infinity;
    for (const m of ms) {
      make(pos, m);
      const v = -shSearch(pos, depth - 1, -beta, -alpha, ctx);
      unmake(pos, m);
      if (ctx.timeout) return 0;
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best === -Infinity ? -MATE : best * 0.999;
  }
  function shBest(pos, diff, forPlayer) {
    const ms = legal(pos, !!forPlayer);
    if (!ms.length) return null;
    const lvl = { easy: 1, normal: 2, hard: 3, ultra: 6 }[diff] || 2;
    const dl = performance.now() + (diff === "ultra" ? 1500 : diff === "hard" ? 900 : 400);
    let bestM = ms[rnd(ms.length)], scores = null;
    for (let d = 1; d <= lvl; d++) {
      const ctx = { n: 0, dl, timeout: false };
      const sc = [];
      let alpha = -Infinity;
      const order = scores ? ms.slice().sort((a, b) => (scores.get(b) || -1e9) - (scores.get(a) || -1e9)) : ms;
      for (const m of order) {
        make(pos, m); const v = -shSearch(pos, d - 1, -Infinity, diff === "easy" ? Infinity : -alpha, ctx); unmake(pos, m);
        if (ctx.timeout) break;
        sc.push([m, v]); if (v > alpha) alpha = v;
      }
      if (ctx.timeout && d > 1) break;
      scores = new Map(sc);
      if (diff === "easy") { const noisy = sc.map(([m, v]) => [m, v + Math.random() * 900]); noisy.sort((a, b) => b[1] - a[1]); bestM = noisy[0][0]; }
      else if (diff === "normal") { const noisy = sc.map(([m, v]) => [m, v + Math.random() * 120]); noisy.sort((a, b) => b[1] - a[1]); bestM = noisy[0][0]; }
      else { sc.sort((a, b) => b[1] - a[1]); bestM = sc[0][0]; }
      if (ctx.timeout) break;
    }
    return bestM;
  }
  function shStart() {
    const b = Array(25).fill(0);
    // 後手（上）：左から 飛 角 銀 金 王、歩は右端の前
    [RK, B, S, G, K].forEach((t, c) => (b[c] = GOTE | t)); b[9] = GOTE | P;
    // 先手（下）：左から 玉 金 銀 角 飛、歩は左端の前
    [K, G, S, B, RK].forEach((t, c) => (b[20 + c] = t)); b[15] = P;
    return { b, h: [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]], turn: 0 };
  }
  const posKey = (pos) => pos.b.join(",") + "|" + pos.h[0].join("") + "|" + pos.h[1].join("") + "|" + pos.turn;
  const pieceLabel = (pc) => (isProm(pc) ? PNAMES[typ(pc)] : typ(pc) === K && own(pc) ? "王" : NAMES[typ(pc)]);
  const sqName = (sq) => (5 - (sq % 5)) + "一二三四五"[Math.floor(sq / 5)];
  R.open.shogi = function (diff) {
    const GF = window.GF, adv = GF.advantage();
    const g = shell("shogi", diff, "ミニ将棋", { cls: "sh", cpuMark: "☖", meMark: "☗", topExtra: '<div class="sh-hand cpu" id="sh-hand-cpu" aria-label="CPUの持ち駒"></div>', bottomExtra: '<div class="sh-hand me" id="sh-hand-me" aria-label="あなたの持ち駒"></div>' });
    let pos = shStart(), sel = null, tg = [], last = null, hint = null, thinking = false, hints = adv.hints, undos = adv.undos, plies = 0, promo = null;
    const hist = [], seen = new Map();
    seen.set(posKey(pos), 1);
    const boardEl = g.$("#bg-board");
    function render() {
      const chk = inCheck(pos, pos.turn) ? kingSq(pos.b, pos.turn) : -1;
      boardEl.innerHTML = pos.b.map((pc, i) => {
        const cls = ["sh-sq"];
        if (sel && sel.f === i) cls.push("sel");
        if (last && (last.f === i || last.t === i)) cls.push("last");
        if (tg.some((m) => m.t === i)) cls.push(pc ? "cap" : "tgt");
        if (hint && (hint.f === i || hint.t === i)) cls.push("hint");
        if (i === chk) cls.push("incheck");
        return '<button type="button" class="' + cls.join(" ") + '" data-i="' + i + '" aria-label="' + sqName(i) + (pc ? (own(pc) ? " 後手の" : " 先手の") + pieceLabel(pc) : "") + '">' + (pc ? '<span class="koma' + (own(pc) ? " gote" : " sente") + (isProm(pc) ? " pr" : "") + '"><b>' + pieceLabel(pc) + "</b></span>" : "") + "</button>";
      }).join("");
      const hand = (o) => [RK, B, G, S, P].filter((t) => pos.h[o][t]).map((t) => '<button type="button" class="sh-h' + (o === 0 && sel && sel.d === t ? " sel" : "") + (o === 0 && hint && hint.d === t ? " hint" : "") + '" data-h="' + t + '"' + (o ? " disabled" : "") + ">" + HNAME[t] + (pos.h[o][t] > 1 ? "<small>×" + pos.h[o][t] + "</small>" : "") + "</button>").join("") || '<span class="small faint">持ち駒なし</span>';
      g.$("#sh-hand-cpu").innerHTML = hand(1); g.$("#sh-hand-me").innerHTML = hand(0);
      g.actions({ hints, undos, canAct: pos.turn === 0 && !thinking && !promo, canUndo: hist.length > 0 });
    }
    g.refresh = render;
    function statusTurn() { g.status(pos.turn === 0 ? "あなたの番（☗先手）" + (inCheck(pos, 0) ? "　王手！" : "") : "CPUが考え中…"); }
    function after(m) {
      last = m; plies++;
      const k = posKey(pos); seen.set(k, (seen.get(k) || 0) + 1);
      const ms = legal(pos, false);
      if (!ms.length) { render(); const meWon = pos.turn === 1; g.status("詰み！"); if (meWon) g.finish(true, false, "勝利！", "CPUの玉を詰ませました"); else g.finish(false, false, "CPUの勝ち", "詰まされました"); return true; }
      if (seen.get(k) >= 4) { render(); g.status("千日手"); g.finish(false, true, "引き分け", "同じ局面が4回（千日手）"); return true; }
      if (plies >= 300) { render(); g.finish(false, true, "引き分け", "300手に達しました"); return true; }
      return false;
    }
    function cpuTurn() {
      thinking = true; statusTurn(); render();
      g.later(() => {
        const m = shBest(pos, diff, false); thinking = false;
        if (!m) return;
        make(pos, m);
        if (after(m)) return;
        statusTurn(); render();
      }, 300);
    }
    function doMove(m) {
      hist.push({ b: pos.b.slice(), h: [pos.h[0].slice(), pos.h[1].slice()], last, plies, seen: new Map(seen) });
      sel = null; tg = []; hint = null; promo = null;
      make(pos, m);
      if (after(m)) return;
      cpuTurn();
    }
    function choose(i, hd) {
      if (pos.turn !== 0 || thinking || g.over || promo) return;
      const all = legal(pos, true);
      if (hd != null) { sel = { d: hd }; tg = all.filter((m) => m.f < 0 && m.d === hd); render(); return; }
      if (sel) {
        const ms = tg.filter((m) => m.t === i);
        if (ms.length === 1) return doMove(ms[0]);
        if (ms.length === 2) {
          promo = ms; render();
          g.$("#bg-extra").innerHTML = '<div class="sh-promo"><p>成りますか？</p><div class="row" style="gap:8px"><button type="button" class="btn primary grow" data-pr="1">成る（' + PNAMES[typ(pos.b[ms[0].f])] + '）</button><button type="button" class="btn grow" data-pr="0">成らない</button></div></div>';
          return;
        }
      }
      const pc = pos.b[i];
      if (pc && own(pc) === 0) { sel = { f: i }; tg = all.filter((m) => m.f === i); } else { sel = null; tg = []; }
      render();
    }
    boardEl.addEventListener("click", (e) => { const c = e.target.closest("[data-i]"); if (c) choose(+c.dataset.i); });
    g.$("#sh-hand-me").addEventListener("click", (e) => { const c = e.target.closest("[data-h]"); if (c) choose(null, +c.dataset.h); });
    g.$("#bg-extra").addEventListener("click", (e) => { const c = e.target.closest("[data-pr]"); if (!c || !promo) return; const m = promo.find((x) => x.pr === (c.dataset.pr === "1")); g.$("#bg-extra").innerHTML = ""; promo = null; doMove(m); });
    g.onHint = () => { if (hints <= 0 || pos.turn !== 0) return; const m = shBest(pos, "hard", true); if (!m) return; hints--; hint = m; render(); g.status("ヒント：" + (m.f < 0 ? HNAME[m.d] + "を" + sqName(m.t) + "に打つ" : sqName(m.f) + " → " + sqName(m.t) + (m.pr ? "成" : ""))); };
    g.onUndo = () => { if (undos <= 0 || !hist.length || pos.turn !== 0) return; const h = hist.pop(); pos.b = h.b; pos.h = h.h; pos.turn = 0; last = h.last; plies = h.plies; seen.clear(); h.seen.forEach((v, k) => seen.set(k, v)); undos--; sel = null; tg = []; hint = null; statusTurn(); render(); };
    g.debug = { pos: () => pos, legal: () => (pos.turn === 0 && !thinking && !g.over ? legal(pos, true) : []), play: (m) => doMove(m), thinking: () => thinking,
      click: (i) => boardEl.querySelector('[data-i="' + i + '"]').click(),
      setPos: (b, h, turn) => { pos.b = b.slice(); pos.h = h ? h.map((x) => x.slice()) : [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]]; pos.turn = turn || 0; sel = null; tg = []; last = null; seen.clear(); render(); statusTurn(); },
      codes: { K, G, S, B, RK, P, PROM, GOTE },
      forceWin: () => { pos.b = Array(25).fill(0); pos.b[2] = GOTE | K; pos.b[12] = G; pos.b[13] = G; pos.b[24] = K; pos.h = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]]; pos.turn = 0; render(); const m = legal(pos, true).find((x) => x.f === 13 && x.t === 7); doMove(m); } };
    statusTurn(); render();
  };

  /* =====================================================
   * 神経衰弱（20枚）CPUと交代でめくる
   * ===================================================== */
  const MEM_E = ["🍙", "🍩", "☕", "🍣", "🎁", "🚲", "📷", "🎧", "⌚", "🌻"];
  const MEM_RECALL = { easy: 0.22, normal: 0.5, hard: 0.8, ultra: 1 };
  R.open.memory = function (diff) {
    const GF = window.GF, adv = GF.advantage();
    const g = shell("memory", diff, "神経衰弱", { cls: "mm", cpuMark: "🤖", meMark: "🙂" });
    const cards = shuffle(MEM_E.concat(MEM_E)).map((e) => ({ e, open: false, done: null }));
    const mem = new Map(); // CPUの記憶 index -> 絵
    let turn = "me", first = -1, busy = false, me = 0, cpu = 0, peek = adv.peek > 0;
    const boardEl = g.$("#bg-board");
    function render() {
      boardEl.innerHTML = cards.map((c, i) => '<button type="button" class="mm-card' + (c.open || c.done || peek ? " open" : "") + (c.done ? " done " + c.done : "") + '" data-i="' + i + '" aria-label="' + (c.open || c.done ? c.e : "カード" + (i + 1)) + '"><span class="mm-in"><span class="mm-back"></span><span class="mm-face">' + c.e + "</span></span></button>").join("");
      g.$("#bg-score-me").textContent = me + "ペア"; g.$("#bg-score-cpu").textContent = cpu + "ペア";
      g.actions({ canAct: turn === "me" && !busy && !peek });
    }
    g.refresh = render;
    const remember = (i) => { if (Math.random() < MEM_RECALL[diff]) mem.set(i, cards[i].e); };
    function checkEnd() {
      if (!cards.every((c) => c.done)) return false;
      render();
      if (me > cpu) g.finish(true, false, "勝利！", "あなた " + me + " − CPU " + cpu + " ペア");
      else if (me < cpu) g.finish(false, false, "CPUの勝ち", "あなた " + me + " − CPU " + cpu + " ペア");
      else g.finish(false, true, "引き分け", "5ペアずつでした");
      g.status("ゲーム終了"); return true;
    }
    function resolve(a, bIdx, who) {
      busy = true;
      if (cards[a].e === cards[bIdx].e) {
        cards[a].done = cards[bIdx].done = who; cards[a].open = cards[bIdx].open = false;
        mem.delete(a); mem.delete(bIdx);
        if (who === "me") me++; else cpu++;
        g.status(who === "me" ? "そろった！ もう一度あなたの番" : "CPUがそろえました。CPUの番が続きます");
        render();
        g.later(() => { busy = false; if (checkEnd()) return; if (who === "cpu") cpuTurn(); else render(); }, 700);
      } else {
        g.status("ざんねん…");
        g.later(() => { cards[a].open = cards[bIdx].open = false; busy = false; turn = who === "me" ? "cpu" : "me"; render(); if (turn === "cpu") cpuTurn(); else g.status("あなたの番：2枚めくってください"); }, 950);
      }
    }
    function cpuTurn() {
      if (g.over) return;
      turn = "cpu"; busy = true; g.status("CPUの番…"); render();
      const avail = cards.map((c, i) => i).filter((i) => !cards[i].done);
      const known = [...mem.entries()].filter(([i]) => !cards[i].done);
      let a = -1, bb = -1;
      for (let x = 0; x < known.length && a < 0; x++) for (let y = x + 1; y < known.length; y++) if (known[x][1] === known[y][1]) { a = known[x][0]; bb = known[y][0]; break; }
      if (a < 0) { const unk = avail.filter((i) => !mem.has(i)); a = (unk.length ? unk : avail)[rnd((unk.length ? unk : avail).length)]; }
      g.later(() => {
        cards[a].open = true; render();
        if (bb < 0) {
          remember(a);
          const pair = [...mem.entries()].find(([i, e]) => i !== a && !cards[i].done && e === cards[a].e);
          if (pair) bb = pair[0];
          else { const unk = avail.filter((i) => i !== a && !mem.has(i)); const pool = unk.length ? unk : avail.filter((i) => i !== a); bb = pool[rnd(pool.length)]; }
        }
        g.later(() => { cards[bb].open = true; remember(bb); render(); g.later(() => resolve(a, bb, "cpu"), 500); }, 650);
      }, 600);
    }
    boardEl.addEventListener("click", (e) => {
      const c = e.target.closest("[data-i]"); if (!c || turn !== "me" || busy || g.over || peek) return;
      const i = +c.dataset.i; if (cards[i].open || cards[i].done) return;
      cards[i].open = true; remember(i); render();
      if (first < 0) { first = i; return; }
      const a = first; first = -1; resolve(a, i, "me");
    });
    g.debug = { cards: () => cards, turn: () => (busy || g.over ? "busy" : turn), click: (i) => boardEl.querySelector('[data-i="' + i + '"]').click(), forceWin: () => { cards.forEach((c) => (c.done = "me")); me = 10; checkEnd(); } };
    render();
    if (peek) { g.status("レベル有利：" + adv.peek + "秒だけ全部見られます"); g.later(() => { peek = false; render(); g.status("あなたの番：2枚めくってください"); }, adv.peek * 1000); }
    else g.status("あなたの番：2枚めくってください");
  };
})();
