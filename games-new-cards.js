/* ほしまなび — トランプ4種（すべてオリジナル実装） */
(() => {
  "use strict";
  const H = window.HMGames, { rnd, shuffle } = H;
  const add = (id, e, n, c, d, fn) => H.add({ id, e, n, c, d }, fn);
  const SU = ["♠", "♥", "♦", "♣"], RK = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = (joker) => { const d = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ s, r }); if (joker) d.push({ s: -1, r: 0 }); return shuffle(d); };
  const cardHtml = (c, attrs = "", cls = "") => (c.s < 0 ? '<button type="button" class="cardc ' + cls + '" ' + attrs + ">🃏</button>" : '<button type="button" class="cardc ' + (c.s === 1 || c.s === 2 ? "red " : "") + cls + '" ' + attrs + "><span>" + SU[c.s] + "</span>" + RK[c.r] + "</button>");
  const DX = (diff) => Math.max(0, ["easy", "normal", "hard", "ultra"].indexOf(diff));

  // 34) ピラミッド ソリティア
  add("pyramid", "🔺", "ピラミッド", "#00838f", "合計13になる2枚（Kは1枚で13）をえらんで取り除く。ピラミッドを全部消したら勝ち。山札をめくれる回数は難しさで変わる。", (diff) => {
    const passes = [99, 3, 2, 1][DX(diff)];
    const g = H.shell("pyramid", diff, "ピラミッド", '<div class="hg-status">合計13の2枚をえらぼう（K は1枚で消える）</div><div class="py"></div><div class="hg-row py-s"></div>');
    const d = deck(false), pyr = []; let k = 0; for (let r = 0; r < 7; r++) { pyr.push([]); for (let c = 0; c <= r; c++) pyr[r].push(d[k++]); }
    let stock = d.slice(k), waste = [], sel = null, pass = 1;
    const free = (r, c) => pyr[r][c] && (r === 6 || (!pyr[r + 1][c] && !pyr[r + 1][c + 1]));
    const left = () => pyr.flat().filter(Boolean).length;
    function draw() { let h = ""; for (let r = 0; r < 7; r++) { h += '<div class="py-row">'; for (let c = 0; c <= r; c++) { const x = pyr[r][c]; h += x ? cardHtml(x, 'data-r="' + r + '" data-c="' + c + '"', (free(r, c) ? "" : "dim ") + (sel && sel.r === r && sel.c === c ? "sel" : "")) : '<span class="cardc" style="visibility:hidden"></span>'; } h += "</div>"; } g.$(".py").innerHTML = h; const w = waste[waste.length - 1]; g.$(".py-s").innerHTML = '<button type="button" class="cardc back" data-a="stock">' + (stock.length ? stock.length : "↻") + "</button>" + (w ? cardHtml(w, 'data-a="waste"', sel && sel.w ? "sel" : "") : '<span class="cardc dim"></span>') + '<span class="hg-small">山札 ' + pass + "/" + (passes > 50 ? "∞" : passes) + "周目</span>"; }
    const rm = (s) => { if (s.w) waste.pop(); else pyr[s.r][s.c] = null; };
    function stuck() { const cards = []; for (let r = 0; r < 7; r++) for (let c = 0; c <= r; c++) if (free(r, c)) cards.push(pyr[r][c]); const all = cards.concat(stock, waste); if (pass >= passes && !stock.length) { const top = waste[waste.length - 1]; const pool = top ? cards.concat([top]) : cards; for (let i = 0; i < pool.length; i++) { if (pool[i].r === 13) return false; for (let j = i + 1; j < pool.length; j++) if (pool[i].r + pool[j].r === 13) return false; } return true; } return false; }
    function after() { sel = null; draw(); if (!left()) { g.finish(true, false, "ピラミッドを全部消した！"); return; } if (stuck()) g.finish(false, false, "もう取れるカードがない", "のこり " + left() + "枚"); }
    g.on(g.body, "click", (e) => { if (g.over) return; const a = e.target.closest("[data-a]"); let pick = null; if (a && a.dataset.a === "stock") { if (stock.length) waste.push(stock.pop()); else if (pass < passes && waste.length) { stock = waste.reverse(); waste = []; pass++; } sel = null; draw(); if (stuck()) g.finish(false, false, "もう取れるカードがない", "のこり " + left() + "枚"); return; } if (a && a.dataset.a === "waste" && waste.length) pick = { w: true, card: waste[waste.length - 1] }; const t = e.target.closest("[data-r]"); if (t) { const r = +t.dataset.r, c = +t.dataset.c; if (!free(r, c)) return; pick = { r, c, card: pyr[r][c] }; } if (!pick) return; if (pick.card.r === 13) { rm(pick); after(); return; } if (sel && !(sel.w && pick.w) && !(sel.r === pick.r && sel.c === pick.c && !sel.w)) { if (sel.card.r + pick.card.r === 13) { rm(sel); rm(pick); after(); return; } } sel = pick; draw(); });
    draw();
  });

  // 35) 七並べ
  add("sevens", "7️⃣", "七並べ", "#c62828", "7のとなりから順にカードを出していく。出せないときはパス（3回まで）。最初に手札がなくなった人が勝ち。", (diff) => {
    const d = DX(diff);
    const g = H.shell("sevens", diff, "七並べ", '<div class="hg-status"></div><div class="sv-t"></div><div class="hg-row sv-o"></div><div class="sv-h"></div><div class="hg-btns"><button type="button" class="btn" id="sv-pass">パス</button></div>');
    const dk = deck(false), hands = [[], [], [], []]; dk.forEach((c, i) => hands[i % 4].push(c));
    const table = SU.map(() => ({ lo: 8, hi: 6 })); // まだ7もない
    const passes = [0, 0, 0, 0], out = [false, false, false, false]; let turn = 0;
    hands.forEach((h) => { for (let i = h.length - 1; i >= 0; i--) if (h[i].r === 7) { table[h[i].s] = { lo: 7, hi: 7 }; h.splice(i, 1); } });
    hands.forEach((h) => h.sort((a, b) => a.s - b.s || a.r - b.r));
    const can = (c) => c.r === table[c.s].lo - 1 || c.r === table[c.s].hi + 1;
    const NAMES = ["あなた", "CPU1", "CPU2", "CPU3"];
    function draw() { g.$(".sv-t").innerHTML = SU.map((s, i) => '<div class="sv-r"><b class="' + (i === 1 || i === 2 ? "red" : "") + '">' + s + "</b>" + Array.from({ length: 13 }, (_, k) => '<span class="sv-c ' + (k + 1 >= table[i].lo && k + 1 <= table[i].hi ? "on" : "") + '">' + RK[k + 1] + "</span>").join("") + "</div>").join(""); g.$(".sv-o").innerHTML = [1, 2, 3].map((p) => '<span class="hg-small">' + NAMES[p] + "：" + (out[p] ? "脱落" : hands[p].length + "枚") + " パス" + passes[p] + "</span>").join(" "); g.$(".sv-h").innerHTML = hands[0].map((c, i) => cardHtml(c, 'data-i="' + i + '"', turn === 0 && can(c) ? "" : "dim")).join(""); g.status(turn === 0 ? "あなたの番（パス " + passes[0] + "/3）" : NAMES[turn] + "の番…"); }
    function place(p, c) { if (c.r < table[c.s].lo) table[c.s].lo = c.r; if (c.r > table[c.s].hi) table[c.s].hi = c.r; }
    function nextTurn() { if (!hands[0].length) { g.finish(true, false, "1番にあがった！"); return; } for (let p = 1; p < 4; p++) if (!hands[p].length && !out[p]) { g.finish(false, false, NAMES[p] + "が先にあがった"); return; } if (out[0]) { g.finish(false, false, "パスが3回をこえた"); return; } do { turn = (turn + 1) % 4; } while (out[turn]); draw(); if (turn !== 0) g.later(cpu, 500); }
    function doPass(p) { passes[p]++; if (passes[p] > 3) { out[p] = true; hands[p].forEach((c) => place(p, c)); hands[p] = []; } }
    function cpu() { const h = hands[turn], ok = h.filter(can); if (!ok.length) { doPass(turn); nextTurn(); return; } let c; if (d === 0) c = ok[rnd(ok.length)]; else { // 自分の手札がその先に多い列を開く／ultra は相手が欲しいカードを止める
      c = ok.map((x) => { const dir = x.r < 7 ? -1 : 1; const mine = h.filter((y) => y.s === x.s && (dir < 0 ? y.r < x.r : y.r > x.r)).length; const isEnd = x.r === 1 || x.r === 13; return { x, v: mine * (d >= 2 ? 2 : 1) + (isEnd ? 1 : 0) + Math.random() * (d === 1 ? 2 : 0.3) }; }).sort((a, b) => b.v - a.v)[0].x;
      if (d === 3 && passes[turn] < 3 && ok.length && h.length > 3) { const blocker = ok.filter((x) => !h.some((y) => y.s === x.s && Math.abs(y.r - x.r) === 1)); if (blocker.length === ok.length && Math.random() < 0.5) { doPass(turn); nextTurn(); return; } } }
      h.splice(h.indexOf(c), 1); place(turn, c); nextTurn(); }
    g.on(g.body, "click", (e) => { if (g.over || turn !== 0) return; if (e.target.closest("#sv-pass")) { if (hands[0].some(can) && passes[0] >= 3) { g.status("もうパスできない。出せるカードを出そう"); return; } doPass(0); nextTurn(); return; } const t = e.target.closest("[data-i]"); if (!t) return; const c = hands[0][+t.dataset.i]; if (!can(c)) return; hands[0].splice(+t.dataset.i, 1); place(0, c); nextTurn(); });
    draw();
  });

  // 36) ババ抜き
  add("oldmaid", "🃏", "ババ抜き", "#6a1b9a", "となりの人からカードを1枚引き、同じ数字の2枚がそろったら捨てる。最後にジョーカーを持っていた人の負け。早くあがれば勝ち（3位以内）。", (diff) => {
    const d = DX(diff), NP = 4;
    const g = H.shell("oldmaid", diff, "ババ抜き", '<div class="hg-status"></div><div class="hg-row om-o"></div><b class="om-l"></b><div class="om-pick hg-row"></div><b>あなたの手札</b><div class="om-h hg-row"></div>');
    const dk = deck(true), hands = Array.from({ length: NP }, () => []); dk.forEach((c, i) => hands[i % NP].push(c));
    const pairOff = (h) => { const by = {}; h.forEach((c) => { if (c.r) (by[c.r] = by[c.r] || []).push(c); }); let out = h.filter((c) => !c.r); Object.values(by).forEach((a) => { if (a.length % 2) out.push(a[0]); }); return shuffle(out); };
    for (let p = 0; p < NP; p++) hands[p] = pairOff(hands[p]);
    const NAMES = ["あなた", "CPU1", "CPU2", "CPU3"]; let turn = 0, finished = [];
    const alive = () => [0, 1, 2, 3].filter((p) => hands[p].length && !finished.includes(p));
    const nextAlive = (p) => { for (let k = 1; k <= NP; k++) { const q = (p + k) % NP; if (alive().includes(q)) return q; } return -1; };
    function draw() { const src = nextAlive(turn); g.$(".om-o").innerHTML = [1, 2, 3].map((p) => '<span class="hg-small">' + NAMES[p] + "：" + (hands[p].length ? hands[p].length + "枚" : finished.includes(p) ? (finished.indexOf(p) + 1) + "位" : "") + "</span>").join(" "); g.$(".om-h").innerHTML = hands[0].map((c) => cardHtml(c)).join(""); if (turn === 0 && src > 0) { g.$(".om-l").textContent = NAMES[src] + "から1枚えらんで引こう"; g.$(".om-pick").innerHTML = hands[src].map((_, i) => '<button type="button" class="cardc back" data-i="' + i + '"></button>').join(""); } else { g.$(".om-l").textContent = ""; g.$(".om-pick").innerHTML = ""; } g.status(turn === 0 ? "あなたの番" : NAMES[turn] + "の番…"); }
    function takeFrom(p, src, i) { const c = hands[src].splice(i, 1)[0]; const m = c.r ? hands[p].findIndex((x) => x.r === c.r) : -1; if (m >= 0) hands[p].splice(m, 1); else hands[p].push(c); hands[p] = shuffle(hands[p]); [p, src].forEach((q) => { if (!hands[q].length && !finished.includes(q)) finished.push(q); }); return { c, pair: m >= 0 }; }
    function check() { if (finished.includes(0)) { const place = finished.indexOf(0) + 1; g.finish(true, false, place + "位であがり！"); return true; } if (alive().length <= 1) { g.finish(false, false, "ジョーカーが残った…"); return true; } return false; }
    function step() { if (check()) return; turn = nextAlive(turn); if (turn < 0) return; draw(); if (turn !== 0) g.later(cpu, 650); }
    function cpu() { const src = nextAlive(turn); let i = rnd(hands[src].length); if (src === 0 && d >= 2 && hands[0].length > 1) { const j = hands[0].findIndex((c) => !c.r); if (j === i && Math.random() < [0, 0, 0.5, 0.8][d]) i = (i + 1) % hands[0].length; } if (src !== 0 && d >= 1) { const j = hands[src].findIndex((c) => !c.r); if (j === i && Math.random() < 0.3 * d) i = (i + 1) % hands[src].length; } takeFrom(turn, src, i); step(); }
    g.on(g.$(".om-pick"), "click", (e) => { const t = e.target.closest("[data-i]"); if (!t || turn !== 0 || g.over) return; const src = nextAlive(0); const r = takeFrom(0, src, +t.dataset.i); g.status(r.c.r ? RK[r.c.r] + "を引いた" + (r.pair ? "（ペアで捨てた）" : "") : "ジョーカーを引いてしまった！"); g.later(step, 600); draw(); });
    if (!hands[0].length) finished.push(0);
    draw(); if (check()) return;
  });

  // 37) ハイ＆ロー
  add("highlow", "🔼", "ハイ＆ロー", "#ff8f00", "次のカードが今より大きいか小さいかを当てる（同じなら引き分け扱い）。10回ずつで、CPUより多く当てたら勝ち。", (diff) => {
    const d = DX(diff);
    const g = H.shell("highlow", diff, "ハイ＆ロー", '<div class="hg-status"></div><div class="hg-row hl-c"></div><div class="hg-btns"><button type="button" class="btn primary" data-h="hi">ハイ（大きい）</button><button type="button" class="btn" data-h="lo">ロー（小さい）</button></div><div class="hg-row"><b>あなた <span id="hl-m">0</span></b><b>CPU <span id="hl-c">0</span></b></div>');
    let dk = deck(false), cur = dk.pop(), me = 0, cp = 0, n = 0;
    // CPUの成績は、同じ10回を別の山で、強さに応じたかしこさで予想して決める
    const cdk = deck(false); let cc = cdk.pop(); for (let k = 0; k < 10; k++) { const nx = cdk.pop(); const smart = Math.random() < [0.3, 0.6, 0.85, 1][d]; const guess = smart ? (cc.r <= 7 ? "hi" : "lo") : Math.random() < 0.5 ? "hi" : "lo"; if (nx.r !== cc.r && (guess === "hi") === nx.r > cc.r) cp++; cc = nx; }
    const draw = (prev) => { g.$(".hl-c").innerHTML = (prev ? cardHtml(prev, "", "dim") + "→" : "") + cardHtml(cur); g.$("#hl-m").textContent = me; g.status(n + " / 10 回（CPUは10回で " + cp + " 回当てた）"); };
    g.on(g.body, "click", (e) => { const t = e.target.closest("[data-h]"); if (!t || g.over) return; const nx = dk.pop(), prev = cur; if (nx.r !== cur.r && (t.dataset.h === "hi") === nx.r > cur.r) { me++; window.GF.sound("pikon"); } cur = nx; n++; draw(prev); g.$("#hl-c").textContent = n >= 10 ? cp : "?"; if (n >= 10) g.finish(me > cp, me === cp, me > cp ? "CPUより多く当てた！" : me === cp ? "引き分け" : "CPUの勝ち", "あなた " + me + " ・ CPU " + cp); });
    g.$("#hl-c").textContent = "?";
    draw();
  });
})();
