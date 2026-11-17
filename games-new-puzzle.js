/* ほしまなび — パズル11種（すべてオリジナル実装） */
(() => {
  "use strict";
  const H = window.HMGames, { rnd, shuffle } = H;
  const add = (id, e, n, c, d, fn) => H.add({ id, e, n, c, d }, fn);
  const cellBtns = (n) => Array.from({ length: n }, (_, i) => '<button type="button" class="hg-cell" data-i="' + i + '"></button>').join("");

  // 11) 地雷さがし
  add("mines", "💣", "地雷さがし", "#607d8b", "数字はまわり8マスの地雷の数。地雷以外を全部あけたら勝ち。長押し（または旗モード）で🚩。CPUより先にクリアしよう。", (diff) => {
    const [N, M, T] = [[8, 8, 240], [9, 12, 200], [10, 16, 220], [10, 20, 200]][["easy", "normal", "hard", "ultra"].indexOf(diff)] || [9, 12, 200];
    const g = H.shell("mines", diff, "地雷さがし", '<div class="hg-status">最初のマスは安全</div><div class="hg-btns"><button type="button" class="btn" id="mn-flag">🚩 旗モード：OFF</button></div><div class="hg-grid mn" style="grid-template-columns:repeat(' + N + ',1fr);width:min(94vw,420px);gap:2px">' + cellBtns(N * N) + "</div>");
    g.race(T);
    let mine = null; const open = Array(N * N).fill(0), flag = Array(N * N).fill(0); let flagMode = false;
    const nb = (i) => { const r = Math.floor(i / N), c = i % N, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) o.push(rr * N + cc); } return o; };
    const cnt = (i) => nb(i).filter((j) => mine[j]).length;
    function init(first) { mine = Array(N * N).fill(0); const ban = new Set([first, ...nb(first)]); let k = 0; while (k < M) { const i = rnd(N * N); if (!mine[i] && !ban.has(i)) { mine[i] = 1; k++; } } }
    function reveal(i) { const st = [i]; while (st.length) { const j = st.pop(); if (open[j] || flag[j]) continue; open[j] = 1; if (!cnt(j)) nb(j).forEach((x) => { if (!open[x]) st.push(x); }); } }
    const COL = ["", "#4fc3f7", "#81c784", "#ff8a65", "#ba68c8", "#ffd54f", "#4dd0e1", "#fff", "#aaa"];
    function draw(boom) { g.$$(".hg-cell").forEach((el, i) => { el.style.fontSize = "15px"; if (open[i]) { el.style.background = "rgba(255,255,255,.04)"; const n = cnt(i); el.textContent = n || ""; el.style.color = COL[n]; } else { el.style.background = "rgba(255,255,255,.22)"; el.textContent = boom && mine && mine[i] ? "💣" : flag[i] ? "🚩" : ""; } }); }
    function tap(i, asFlag) { if (g.over) return; if (asFlag) { if (!open[i]) { flag[i] ^= 1; draw(); } return; } if (flag[i] || open[i]) return; if (!mine) init(i); if (mine[i]) { draw(true); g.finish(false, false, "ドカーン！", "地雷をあけてしまった。"); return; } reveal(i); draw(); if (open.filter((x) => !x).length === M) g.finish(true, false, "クリア！", "CPUより先に全部あけた！"); }
    let pressT = 0, pressI = -1, longDone = false;
    g.on(g.$(".mn"), "pointerdown", (e) => { const t = e.target.closest("[data-i]"); if (!t) return; pressI = +t.dataset.i; longDone = false; pressT = setTimeout(() => { longDone = true; tap(pressI, true); }, 420); });
    g.on(g.$(".mn"), "pointerup", () => clearTimeout(pressT));
    g.on(g.$(".mn"), "click", (e) => { const t = e.target.closest("[data-i]"); if (!t || longDone) return; tap(+t.dataset.i, flagMode); });
    g.on(g.$("#mn-flag"), "click", () => { flagMode = !flagMode; g.$("#mn-flag").textContent = "🚩 旗モード：" + (flagMode ? "ON" : "OFF"); });
    draw();
  });

  // 12) スライドパズル
  add("slide", "🧩", "スライドパズル", "#8d6e63", "あいているマスのとなりの数字をタップして動かし、1から順に並べよう。", (diff) => {
    const [N, T] = [[3, 120], [3, 70], [4, 240], [4, 160]][["easy", "normal", "hard", "ultra"].indexOf(diff)] || [3, 90];
    const g = H.shell("slide", diff, "スライドパズル", '<div class="hg-status">1から順に並べよう</div><div class="hg-grid sl" style="grid-template-columns:repeat(' + N + ',1fr);width:min(80vw,340px);gap:5px">' + cellBtns(N * N) + "</div>");
    g.race(T);
    const b = Array.from({ length: N * N }, (_, i) => (i + 1) % (N * N)); let z = N * N - 1, moves = 0;
    const nb = (i) => { const r = Math.floor(i / N), c = i % N, o = []; if (r) o.push(i - N); if (r < N - 1) o.push(i + N); if (c) o.push(i - 1); if (c < N - 1) o.push(i + 1); return o; };
    let prev = -1; for (let k = 0; k < (N === 3 ? 60 : 160); k++) { const ops = nb(z).filter((x) => x !== prev); const j = ops[rnd(ops.length)]; b[z] = b[j]; b[j] = 0; prev = z; z = j; }
    if (b.every((v, i) => v === (i + 1) % (N * N))) { const j = nb(z)[0]; b[z] = b[j]; b[j] = 0; z = j; }
    function draw() { g.$$(".hg-cell").forEach((el, i) => { el.textContent = b[i] || ""; el.style.fontSize = "26px"; el.style.background = b[i] ? "linear-gradient(145deg,#a1887f,#6d4c41)" : "transparent"; }); }
    g.on(g.$(".sl"), "click", (e) => { const t = e.target.closest("[data-i]"); if (!t || g.over) return; const i = +t.dataset.i; if (!nb(z).includes(i)) return; b[z] = b[i]; b[i] = 0; z = i; moves++; draw(); g.status(moves + "手"); if (b.every((v, k) => v === (k + 1) % (N * N))) g.finish(true, false, "そろった！", moves + "手でクリア"); });
    draw();
  });

  // 13) ライトパズル
  add("lights", "💡", "ライトパズル", "#f9a825", "タップすると、そのマスと上下左右の明かりが反転。全部消せたら勝ち。", (diff) => {
    const [N, K, T] = [[4, 3, 90], [5, 5, 120], [5, 8, 150], [6, 10, 180]][["easy", "normal", "hard", "ultra"].indexOf(diff)] || [5, 5, 120];
    const g = H.shell("lights", diff, "ライトパズル", '<div class="hg-status">明かりを全部消そう</div><div class="hg-grid lt" style="grid-template-columns:repeat(' + N + ',1fr);width:min(84vw,340px);gap:5px">' + cellBtns(N * N) + "</div>");
    g.race(T);
    const b = Array(N * N).fill(0);
    const press = (i) => { const r = Math.floor(i / N), c = i % N; [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) b[rr * N + cc] ^= 1; }); };
    const picks = shuffle([...Array(N * N).keys()]).slice(0, K); picks.forEach(press);
    if (!b.some((x) => x)) press(0);
    let n = 0;
    function draw() { g.$$(".hg-cell").forEach((el, i) => { el.style.background = b[i] ? "radial-gradient(circle,#fff59d,#fbc02d)" : "rgba(255,255,255,.08)"; el.style.boxShadow = b[i] ? "0 0 12px #fdd835" : "none"; }); }
    g.on(g.$(".lt"), "click", (e) => { const t = e.target.closest("[data-i]"); if (!t || g.over) return; press(+t.dataset.i); n++; draw(); g.status(n + "回"); if (!b.some((x) => x)) g.finish(true, false, "全部消えた！", n + "回でクリア"); });
    draw();
  });

  // 14) ハノイの塔
  add("hanoi", "🗼", "ハノイの塔", "#5d4037", "円ばんを全部右の柱へ。小さい円ばんの上に大きい円ばんはのせられない。", (diff) => {
    const [D, T] = [[3, 60], [4, 90], [5, 150], [6, 240]][["easy", "normal", "hard", "ultra"].indexOf(diff)] || [4, 90];
    const g = H.shell("hanoi", diff, "ハノイの塔", '<div class="hg-status">柱をタップして持ち上げ、別の柱をタップして置く（最短 ' + (2 ** D - 1) + '手）</div><div class="hn"></div>');
    g.race(T);
    const P = [Array.from({ length: D }, (_, k) => D - k), [], []]; let hold = -1, n = 0;
    function draw() { g.$(".hn").innerHTML = P.map((p, i) => '<button type="button" class="hn-p ' + (hold === i ? "on" : "") + '" data-p="' + i + '"><span class="hn-rod"></span>' + p.map((d) => '<span class="hn-d" style="width:' + (20 + d * 12) + "%;background:hsl(" + d * 50 + ',70%,55%)"></span>').reverse().join("") + "</button>").join(""); }
    g.on(g.$(".hn"), "click", (e) => { const t = e.target.closest("[data-p]"); if (!t || g.over) return; const i = +t.dataset.p; if (hold < 0) { if (P[i].length) hold = i; } else { if (i !== hold) { const d = P[hold][P[hold].length - 1], top = P[i][P[i].length - 1]; if (!top || top > d) { P[i].push(P[hold].pop()); n++; } else g.status("大きい円ばんは小さい円ばんの上におけない"); } hold = -1; } draw(); if (P[2].length === D) g.finish(true, false, "完成！", n + "手（最短 " + (2 ** D - 1) + "手）"); else if (hold < 0) g.status(n + "手"); });
    draw();
  });

  // 15) ノノグラム（お絵かきロジック）
  add("nonogram", "🖼️", "ノノグラム", "#26a69a", "数字は、その列・行でぬるマスが続く数。ヒントに合うようにぬろう。", (diff) => {
    const [N, T] = [[5, 150], [6, 200], [8, 300], [10, 420]][["easy", "normal", "hard", "ultra"].indexOf(diff)] || [6, 200];
    const g = H.shell("nonogram", diff, "ノノグラム", '<div class="hg-status">ヒントに合うようにぬろう</div><div class="hg-btns"><button type="button" class="btn" id="ng-x">✕ 印モード：OFF</button></div><div class="ng"></div>');
    g.race(T);
    let sol; do { sol = Array.from({ length: N * N }, () => (Math.random() < 0.55 ? 1 : 0)); } while (sol.filter((x) => x).length < N);
    const runs = (a) => { const o = []; let k = 0; a.forEach((v) => { if (v) k++; else if (k) { o.push(k); k = 0; } }); if (k) o.push(k); return o.length ? o : [0]; };
    const row = (a, r) => a.slice(r * N, r * N + N), col = (a, c) => Array.from({ length: N }, (_, r) => a[r * N + c]);
    const RH = [...Array(N).keys()].map((r) => runs(row(sol, r))), CH = [...Array(N).keys()].map((c) => runs(col(sol, c)));
    const b = Array(N * N).fill(0); let xMode = false;
    function draw() { let h = '<table class="ngt"><tr><td></td>' + CH.map((c) => '<td class="ngh v">' + c.join("<br>") + "</td>").join("") + "</tr>"; for (let r = 0; r < N; r++) { h += '<tr><td class="ngh">' + RH[r].join(" ") + "</td>"; for (let c = 0; c < N; c++) { const i = r * N + c; h += '<td><button type="button" class="ngc ' + (b[i] === 1 ? "on" : b[i] === 2 ? "x" : "") + '" data-i="' + i + '">' + (b[i] === 2 ? "✕" : "") + "</button></td>"; } h += "</tr>"; } g.$(".ng").innerHTML = h + "</table>"; }
    const ok = () => { const f = b.map((v) => (v === 1 ? 1 : 0)); for (let r = 0; r < N; r++) if (runs(row(f, r)).join() !== RH[r].join()) return false; for (let c = 0; c < N; c++) if (runs(col(f, c)).join() !== CH[c].join()) return false; return true; };
    g.on(g.$(".ng"), "click", (e) => { const t = e.target.closest("[data-i]"); if (!t || g.over) return; const i = +t.dataset.i; b[i] = xMode ? (b[i] === 2 ? 0 : 2) : b[i] === 1 ? 0 : 1; draw(); if (ok()) g.finish(true, false, "完成！", "ヒントにぴったり合った！"); });
    g.on(g.$("#ng-x"), "click", () => { xMode = !xMode; g.$("#ng-x").textContent = "✕ 印モード：" + (xMode ? "ON" : "OFF"); });
    draw();
  });

  // 16) カラーフラッド
  add("flood", "🎨", "カラーフラッド", "#ab47bc", "左上から色をぬり広げて、全部を1色にしよう。CPUより少ない手数なら勝ち。", (diff) => {
    const [N, C] = [[8, 4], [10, 5], [12, 6], [14, 6]][["easy", "normal", "hard", "ultra"].indexOf(diff)] || [10, 5];
    const COLS = ["#ef5350", "#42a5f5", "#66bb6a", "#ffca28", "#ab47bc", "#ff7043"].slice(0, C);
    const g = H.shell("flood", diff, "カラーフラッド", '<div class="hg-status"></div><div class="hg-grid fl" style="grid-template-columns:repeat(' + N + ',1fr);width:min(88vw,360px);gap:0"></div><div class="hg-btns fl-c">' + COLS.map((c, i) => '<button type="button" class="btn" data-c="' + i + '" style="background:' + c + ';width:52px;height:52px;border:0"></button>').join("") + "</div>");
    const init = Array.from({ length: N * N }, () => rnd(C));
    const region = (b) => { const s = new Set([0]), st = [0]; while (st.length) { const i = st.pop(), r = Math.floor(i / N), c = i % N; [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc, j = rr * N + cc; if (rr >= 0 && rr < N && cc >= 0 && cc < N && !s.has(j) && b[j] === b[0]) { s.add(j); st.push(j); } }); } return s; };
    const fill = (b, col) => { const s = region(b); s.forEach((i) => (b[i] = col)); };
    // CPU（くいしんぼう方式＋1手先読み）の手数
    const cpuB = init.slice(); let cpuMoves = 0; while (region(cpuB).size < N * N && cpuMoves < 200) { let best = -1, bc = 0; for (let c = 0; c < C; c++) { if (c === cpuB[0]) continue; const t = cpuB.slice(); fill(t, c); let sz = region(t).size; if (diff === "ultra" || diff === "hard") { let m2 = 0; for (let c2 = 0; c2 < C; c2++) { if (c2 === c) continue; const t2 = t.slice(); fill(t2, c2); m2 = Math.max(m2, region(t2).size); } sz = sz * 2 + m2; } if (sz > best) { best = sz; bc = c; } } fill(cpuB, bc); cpuMoves++; }
    const limit = cpuMoves + [6, 3, 1, 0][g.d];
    const b = init.slice(); let n = 0;
    g.$(".fl").innerHTML = Array.from({ length: N * N }, (_, i) => '<span class="flc" data-i="' + i + '"></span>').join("");
    function draw() { g.$$(".flc").forEach((el, i) => (el.style.background = COLS[b[i]])); g.status(n + " / " + limit + " 手（CPUは " + cpuMoves + " 手）"); }
    g.on(g.$(".fl-c"), "click", (e) => { const t = e.target.closest("[data-c]"); if (!t || g.over) return; const c = +t.dataset.c; if (c === b[0]) return; fill(b, c); n++; draw(); if (region(b).size === N * N) g.finish(n <= limit, false, n <= limit ? "1色になった！" : "手数オーバー", n + "手（目標 " + limit + "手以内）"); else if (n >= limit) g.finish(false, false, "手数オーバー", "目標は " + limit + "手でした"); });
    draw();
  });

  // 17) パイプつなぎ
  add("pipes", "🚰", "パイプつなぎ", "#0288d1", "パイプをタップして回し、まん中の水道から全部のパイプに水を通そう。", (diff) => {
    const [N, T] = [[4, 90], [5, 120], [6, 180], [7, 240]][["easy", "normal", "hard", "ultra"].indexOf(diff)] || [5, 120];
    const g = H.shell("pipes", diff, "パイプつなぎ", '<div class="hg-status">全部に水を通そう</div><div class="hg-grid pp" style="grid-template-columns:repeat(' + N + ',1fr);width:min(88vw,360px);gap:2px">' + cellBtns(N * N) + "</div>");
    g.race(T);
    // 1=上 2=右 4=下 8=左
    const con = Array(N * N).fill(0), src = Math.floor(N / 2) * N + Math.floor(N / 2); const seen = new Set([src]), st = [src];
    while (st.length) { const i = st[st.length - 1], r = Math.floor(i / N), c = i % N; const opts = [[-1, 0, 1, 4], [0, 1, 2, 8], [1, 0, 4, 1], [0, -1, 8, 2]].filter(([dr, dc]) => { const rr = r + dr, cc = c + dc; return rr >= 0 && rr < N && cc >= 0 && cc < N && !seen.has(rr * N + cc); }); if (!opts.length) { st.pop(); continue; } const [dr, dc, a, b2] = opts[rnd(opts.length)], j = (r + dr) * N + c + dc; con[i] |= a; con[j] |= b2; seen.add(j); st.push(j); }
    const rot = (m) => ((m << 1) | (m >> 3)) & 15;
    const cur = con.map((m) => { let x = m; for (let k = rnd(4); k > 0; k--) x = rot(x); return x; });
    function wet() { const s = new Set([src]), q = [src]; while (q.length) { const i = q.pop(), r = Math.floor(i / N), c = i % N; [[-1, 0, 1, 4], [0, 1, 2, 8], [1, 0, 4, 1], [0, -1, 8, 2]].forEach(([dr, dc, a, b2]) => { const rr = r + dr, cc = c + dc, j = rr * N + cc; if (rr >= 0 && rr < N && cc >= 0 && cc < N && cur[i] & a && cur[j] & b2 && !s.has(j)) { s.add(j); q.push(j); } }); } return s; }
    function svg(m, w, isSrc) { const col = w ? "#4fc3f7" : "#9e9e9e"; let p = ""; if (m & 1) p += "M50 50 L50 0 "; if (m & 2) p += "M50 50 L100 50 "; if (m & 4) p += "M50 50 L50 100 "; if (m & 8) p += "M50 50 L0 50 "; return '<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="' + p + '" stroke="' + col + '" stroke-width="22" stroke-linecap="round"/>' + (isSrc ? '<circle cx="50" cy="50" r="20" fill="#0277bd"/>' : '<circle cx="50" cy="50" r="12" fill="' + col + '"/>') + "</svg>"; }
    function draw() { const w = wet(); g.$$(".hg-cell").forEach((el, i) => { el.innerHTML = svg(cur[i], w.has(i), i === src); el.style.background = "rgba(255,255,255,.07)"; }); return w.size; }
    g.on(g.$(".pp"), "click", (e) => { const t = e.target.closest("[data-i]"); if (!t || g.over) return; const i = +t.dataset.i; cur[i] = rot(cur[i]); if (draw() === N * N) g.finish(true, false, "全部に水が通った！"); });
    draw();
  });

  // 18) ブロックはめ
  add("blockfit", "🟪", "ブロックはめ", "#7e57c2", "3つのブロックを8×8の盤にはめる。縦か横が1列そろうと消えて得点。CPUの得点をこえたら勝ち。", (diff) => {
    const target = [60, 120, 200, 300][["easy", "normal", "hard", "ultra"].indexOf(diff)] || 120;
    const N = 8, SH = [[[0, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]];
    const g = H.shell("blockfit", diff, "ブロックはめ", '<div class="hg-status">得点 0 / CPU ' + target + '</div><div class="hg-grid bf" style="grid-template-columns:repeat(8,1fr);width:min(88vw,360px);gap:2px">' + cellBtns(64) + '</div><div class="bf-pieces hg-row"></div><p class="hg-small">ブロックをえらんでから、置きたい場所（左上）をタップ</p>');
    const b = Array(64).fill(0); let pieces = [], sel = -1, score = 0;
    const fits = (p, at) => { const r0 = Math.floor(at / N), c0 = at % N; return p.every(([r, c]) => r0 + r < N && c0 + c < N && !b[(r0 + r) * N + c0 + c]); };
    const canAny = () => pieces.some((p) => p && b.some((_, i) => fits(p, i)));
    const deal = () => { pieces = [0, 1, 2].map(() => SH[rnd(SH.length)]); };
    function draw() { g.$$(".bf .hg-cell").forEach((el, i) => (el.style.background = b[i] ? "hsl(" + b[i] + ",65%,55%)" : "rgba(255,255,255,.1)")); g.$(".bf-pieces").innerHTML = pieces.map((p, k) => (p ? '<button type="button" class="bf-p ' + (k === sel ? "on" : "") + '" data-k="' + k + '">' + mini(p) + "</button>" : '<span class="bf-p empty"></span>')).join(""); g.status("得点 " + score + " / CPU " + target); }
    const mini = (p) => { const R = Math.max(...p.map((x) => x[0])) + 1, C = Math.max(...p.map((x) => x[1])) + 1; let h = '<span class="mini" style="grid-template-columns:repeat(' + C + ',12px)">'; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) h += '<i style="background:' + (p.some((x) => x[0] === r && x[1] === c) ? "#b39ddb" : "transparent") + '"></i>'; return h + "</span>"; };
    g.on(g.body, "click", (e) => { if (g.over) return; const pk = e.target.closest("[data-k]"); if (pk) { sel = +pk.dataset.k; draw(); return; } const t = e.target.closest(".bf [data-i]"); if (!t || sel < 0) return; const p = pieces[sel], at = +t.dataset.i; if (!fits(p, at)) { g.status("そこには置けない"); return; } const hue = rnd(360), r0 = Math.floor(at / N), c0 = at % N; p.forEach(([r, c]) => (b[(r0 + r) * N + c0 + c] = hue || 1)); score += p.length; pieces[sel] = null; sel = -1; const full = []; for (let r = 0; r < N; r++) if ([...Array(N).keys()].every((c) => b[r * N + c])) for (let c = 0; c < N; c++) full.push(r * N + c); let lines = full.length / N; for (let c = 0; c < N; c++) if ([...Array(N).keys()].every((r) => b[r * N + c])) { lines++; for (let r = 0; r < N; r++) full.push(r * N + c); } full.forEach((i) => (b[i] = 0)); score += lines * 10 * lines; if (pieces.every((x) => !x)) deal(); draw(); if (score >= target) { g.finish(true, false, "CPUをこえた！", score + "点"); return; } if (!canAny()) g.finish(false, false, "置ける場所がない", score + "点（CPU " + target + "点）"); });
    deal(); draw();
  });

  // 19) メイク10
  add("make10", "🔟", "メイク10", "#ef6c00", "4つの数を全部1回ずつ使い、＋−×÷とかっこで10を作ろう。時間内にCPUより多く作れたら勝ち。", (diff) => {
    const [cpuN, secs] = [[2, 90], [3, 90], [4, 80], [5, 75]][["easy", "normal", "hard", "ultra"].indexOf(diff)] || [3, 90];
    const g = H.shell("make10", diff, "メイク10", '<div class="hg-status"></div><div class="m10-expr num">　</div><div class="hg-btns m10-n"></div><div class="hg-btns m10-o">' + ["+", "−", "×", "÷", "(", ")"].map((o) => '<button type="button" class="btn" data-o="' + o + '">' + o + "</button>").join("") + '<button type="button" class="btn" data-o="del">⌫</button><button type="button" class="btn" data-o="skip">パス</button><button type="button" class="btn primary" data-o="ok">＝10？</button></div>');
    // 分数で正確に計算するソルバー
    const fr = (n, d = 1) => { const gg = (a, b) => (b ? gg(b, a % b) : Math.abs(a)); const k = gg(n, d) || 1; return d < 0 ? [-n / k, -d / k] : [n / k, d / k]; };
    const ops = [(a, b) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]), (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]), (a, b) => fr(a[0] * b[0], a[1] * b[1]), (a, b) => (b[0] ? fr(a[0] * b[1], a[1] * b[0]) : null)];
    const solvable = (ns) => { const go = (arr) => { if (arr.length === 1) return arr[0][0] === 10 * arr[0][1]; for (let i = 0; i < arr.length; i++) for (let j = 0; j < arr.length; j++) { if (i === j) continue; const rest = arr.filter((_, k) => k !== i && k !== j); for (const op of ops) { const v = op(arr[i], arr[j]); if (v && go(rest.concat([v]))) return true; } } return false; }; return go(ns.map((n) => [n, 1])); };
    let nums, used, expr, solved = 0;
    const t0 = performance.now();
    function newQ() { do { nums = [1, 2, 3, 4].map(() => 1 + rnd(9)); } while (!solvable(nums)); used = [false, false, false, false]; expr = []; draw(); }
    function draw() { g.$(".m10-expr").textContent = expr.map((x) => x.v).join(" ") || "　"; g.$(".m10-n").innerHTML = nums.map((n, i) => '<button type="button" class="btn m10b" data-n="' + i + '" ' + (used[i] ? "disabled" : "") + ">" + n + "</button>").join(""); }
    function evalExpr() { const tk = expr.map((x) => x.v); let p = 0; const peek = () => tk[p], eat = () => tk[p++]; const prim = () => { const t = eat(); if (t === "(") { const v = add2(); if (eat() !== ")") throw 0; return v; } if (/^\d$/.test(t)) return [+t, 1]; throw 0; }; const mul = () => { let v = prim(); while (peek() === "×" || peek() === "÷") { const o = eat(), r = prim(); v = o === "×" ? ops[2](v, r) : ops[3](v, r); if (!v) throw 0; } return v; }; const add2 = () => { let v = mul(); while (peek() === "+" || peek() === "−") { const o = eat(), r = mul(); v = o === "+" ? ops[0](v, r) : ops[1](v, r); } return v; }; const v = add2(); if (p !== tk.length) throw 0; return v; }
    g.on(g.body, "click", (e) => { if (g.over) return; const nb = e.target.closest("[data-n]"); if (nb) { const i = +nb.dataset.n; if (used[i]) return; used[i] = true; expr.push({ v: String(nums[i]), i }); draw(); return; } const ob = e.target.closest("[data-o]"); if (!ob) return; const o = ob.dataset.o; if (o === "del") { const x = expr.pop(); if (x && x.i != null) used[x.i] = false; draw(); } else if (o === "skip") newQ(); else if (o === "ok") { if (used.some((u) => !u)) { g.status("4つの数を全部使ってね"); return; } try { const v = evalExpr(); if (v[0] === 10 * v[1]) { solved++; window.GF.sound("pikon"); newQ(); } else { g.status("答えは " + (v[1] === 1 ? v[0] : v[0] + "/" + v[1]) + "。10じゃないよ"); } } catch (er) { g.status("式の形がおかしいよ"); } } else { expr.push({ v: o }); draw(); } });
    g.every(() => { const left = Math.max(0, secs - (performance.now() - t0) / 1000); const cpu = Math.min(cpuN, Math.floor(((secs - left) / secs) * cpuN + 0.0001)); g.status("のこり " + Math.ceil(left) + "秒 ・ あなた " + solved + "問 ・ CPU " + cpu + "問"); if (left <= 0) g.finish(solved > cpuN, solved === cpuN, solved > cpuN ? "CPUより多く作った！" : solved === cpuN ? "引き分け" : "CPUの勝ち", "あなた " + solved + "問 ・ CPU " + cpuN + "問"); }, 250);
    newQ();
  });

  // 20) ブロックおとし
  add("fall", "🧱", "ブロックおとし", "#3949ab", "落ちてくるブロックを回して並べ、横1列をそろえて消そう。目標の列数を消したら勝ち。", (diff) => {
    const goal = [5, 10, 15, 20][["easy", "normal", "hard", "ultra"].indexOf(diff)] || 10, speed = [0.75, 0.55, 0.42, 0.3][["easy", "normal", "hard", "ultra"].indexOf(diff)] || 0.55;
    const W = 10, Hh = 18, S = 18;
    const g = H.shell("fall", diff, "ブロックおとし", '<div class="hg-status">0 / ' + goal + ' 列</div><canvas></canvas><div class="hg-btns"><button type="button" class="btn" data-a="l">◀</button><button type="button" class="btn" data-a="r">▶</button><button type="button" class="btn" data-a="rot">⟳ 回す</button><button type="button" class="btn" data-a="drop">⬇ 落とす</button></div>');
    const cv = g.$("canvas"), ctx = H.setupCanvas(cv, W * S, Hh * S);
    const P = [[[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1], [1, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]], [[0, 2], [1, 0], [1, 1], [1, 2]], [[0, 1], [0, 2], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 1], [1, 2]]];
    const COL = ["#4dd0e1", "#ffd54f", "#ba68c8", "#64b5f6", "#ffb74d", "#81c784", "#e57373"];
    const b = Array(W * Hh).fill(-1); let cur, lines = 0, acc = 0;
    const spawn = () => { const k = rnd(7); cur = { k, cells: P[k].map((x) => x.slice()), r: 0, c: 3 }; if (!ok(cur.cells, 0, 3)) g.finish(false, false, "うまってしまった", lines + "列消した（目標 " + goal + "）"); };
    const ok = (cells, r, c) => cells.every(([y, x]) => { const yy = y + r, xx = x + c; return xx >= 0 && xx < W && yy < Hh && (yy < 0 || b[yy * W + xx] < 0); });
    function lock() { cur.cells.forEach(([y, x]) => { const yy = y + cur.r; if (yy >= 0) b[yy * W + x + cur.c] = cur.k; }); for (let r = Hh - 1; r >= 0; r--) { let full = true; for (let c = 0; c < W; c++) if (b[r * W + c] < 0) full = false; if (full) { b.splice(r * W, W); b.unshift(...Array(W).fill(-1)); lines++; r++; } } g.status(lines + " / " + goal + " 列"); if (lines >= goal) { g.finish(true, false, "目標達成！", lines + "列消した"); return; } spawn(); }
    function act(a) { if (g.over || !cur) return; if (a === "l" && ok(cur.cells, cur.r, cur.c - 1)) cur.c--; if (a === "r" && ok(cur.cells, cur.r, cur.c + 1)) cur.c++; if (a === "rot") { const n = cur.cells.map(([y, x]) => [x, 2 - y]); const mny = Math.min(...n.map((p) => p[0])), mnx = Math.min(...n.map((p) => p[1])); const nn = n.map(([y, x]) => [y - mny, x - mnx]); for (const dx of [0, -1, 1, -2]) if (ok(nn, cur.r, cur.c + dx)) { cur.cells = nn; cur.c += dx; break; } } if (a === "drop") { while (ok(cur.cells, cur.r + 1, cur.c)) cur.r++; lock(); } }
    g.on(g.body, "click", (e) => { const t = e.target.closest("[data-a]"); if (t) act(t.dataset.a); });
    g.on(window, "keydown", (e) => { const m = { ArrowLeft: "l", ArrowRight: "r", ArrowUp: "rot", ArrowDown: "drop" }[e.key]; if (m) { act(m); e.preventDefault(); } });
    spawn();
    g.loop((dt) => { acc += dt; if (acc > speed) { acc = 0; if (ok(cur.cells, cur.r + 1, cur.c)) cur.r++; else lock(); } ctx.fillStyle = "#0b1a2a"; ctx.fillRect(0, 0, W * S, Hh * S); b.forEach((v, i) => { if (v >= 0) { ctx.fillStyle = COL[v]; ctx.fillRect((i % W) * S + 1, Math.floor(i / W) * S + 1, S - 2, S - 2); } }); if (cur) { ctx.fillStyle = COL[cur.k]; cur.cells.forEach(([y, x]) => ctx.fillRect((x + cur.c) * S + 1, (y + cur.r) * S + 1, S - 2, S - 2)); } });
  });

  // 21) 光の順番おぼえ
  add("simon", "🔆", "光の順番おぼえ", "#00897b", "光った順番どおりにタップ。目標の長さまで覚えられたら勝ち。", (diff) => {
    const goal = [6, 8, 10, 12][["easy", "normal", "hard", "ultra"].indexOf(diff)] || 8, fast = [700, 560, 450, 360][["easy", "normal", "hard", "ultra"].indexOf(diff)] || 560;
    const g = H.shell("simon", diff, "光の順番おぼえ", '<div class="hg-status">よく見てね</div><div class="hg-grid sm" style="grid-template-columns:repeat(2,1fr);width:min(76vw,300px);gap:10px">' + cellBtns(4) + "</div>");
    const C = ["#e53935", "#1e88e5", "#43a047", "#fdd835"], F = [330, 392, 494, 587];
    const seq = []; let pos = 0, input = false;
    const cells = g.$$(".hg-cell"); cells.forEach((el, i) => { el.style.background = C[i]; el.style.opacity = ".45"; el.style.borderRadius = "18px"; });
    const flash = (i) => { cells[i].style.opacity = "1"; window.GF.sound("soft"); g.later(() => (cells[i].style.opacity = ".45"), fast * 0.6); };
    function round() { seq.push(rnd(4)); input = false; pos = 0; g.status("長さ " + seq.length + " / " + goal); seq.forEach((v, k) => g.later(() => flash(v), 500 + k * fast)); g.later(() => { input = true; g.status("あなたの番（" + seq.length + "こ）"); }, 500 + seq.length * fast); }
    g.on(g.$(".sm"), "click", (e) => { const t = e.target.closest("[data-i]"); if (!t || !input || g.over) return; const i = +t.dataset.i; flash(i); if (i !== seq[pos]) { g.finish(false, false, "まちがえた", (seq.length - 1) + "こまで覚えた（目標 " + goal + "）"); return; } pos++; if (pos === seq.length) { input = false; if (seq.length >= goal) g.finish(true, false, "全部覚えた！", goal + "こ覚えた"); else g.later(round, 700); } });
    round();
  });
})();
