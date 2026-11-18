/* ほしまなび — 新しい問題形式の画面（〇×・なかま分け・文字カード・あてはまるものを全部・数直線・漢字の書き取り）
   app.js の showQ から呼ばれる。どの形式も「こたえる」までは何度でもやり直せる。 */
(function (root) {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mixed = (n) => { let o = shuf([...Array(n).keys()]); for (let k = 0; k < 6 && n > 1 && o.every((v, i) => v === i); k++) o = shuf(o); return o; };
  const F = {};
  let cur = null; // { q, w, root, api }

  // ===== 〇× =====
  F.tf = {
    html: (q) => '<div class="tf-row"><button type="button" class="tf-b maru" data-tf="〇"><span>〇</span><small>正しい</small></button><button type="button" class="tf-b batsu" data-tf="×"><span>×</span><small>まちがい</small></button></div>',
    mount(q, w, el, api) { el.querySelectorAll("[data-tf]").forEach((b) => b.addEventListener("click", () => { if (w.done) return; w.given = b.dataset.tf; api.answer({ ok: w.given === q.a, text: w.given }); })); },
    show(q, w, el) { el.querySelectorAll("[data-tf]").forEach((b) => { b.disabled = true; if (b.dataset.tf === q.a) b.classList.add("right"); else if (b.dataset.tf === w.given) b.classList.add("wrong"); }); },
    noSubmit: true,
  };

  // ===== なかま分け（タップ → 箱をタップ、またはドラッグ） =====
  F.sort = {
    init: (q) => ({ at: q.items.map(() => -1), order: mixed(q.items.length), sel: null }),
    html: (q, w) => '<div class="srt" id="srt"></div>',
    render(q, w, el) {
      const box = el.querySelector("#srt");
      let h = '<div class="srt-bins" style="--n:' + q.bins.length + '">' + q.bins.map((b, bi) => '<div class="srt-bin" data-bin="' + bi + '"><div class="srt-bh">' + esc(b) + '</div><div class="srt-in">' + w.order.filter((i) => w.at[i] === bi).map((i) => chip(q, w, i)).join("") + "</div></div>").join("") + "</div>";
      const pool = w.order.filter((i) => w.at[i] === -1);
      h += '<div class="srt-pool">' + (pool.length ? pool.map((i) => chip(q, w, i)).join("") : '<span class="srt-empty">ぜんぶ入れたよ。よければ「こたえる」</span>') + "</div>";
      box.innerHTML = h;
    },
    mount(q, w, el, api) {
      const box = el.querySelector("#srt");
      const rerender = () => { F.sort.render(q, w, el); api.ready(w.at.every((x) => x >= 0)); };
      rerender();
      let drag = null;
      box.addEventListener("pointerdown", (e) => {
        if (w.done) return; const c = e.target.closest("[data-it]"); if (!c) return;
        drag = { i: +c.dataset.it, x0: e.clientX, y0: e.clientY, el: c, moved: false, ghost: null };
      });
      const mv = (e) => {
        if (!drag || w.done) return;
        const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
        if (!drag.moved && Math.hypot(dx, dy) > 10) { drag.moved = true; const g = drag.el.cloneNode(true); g.classList.add("srt-ghost"); document.body.appendChild(g); drag.ghost = g; drag.el.classList.add("lift"); }
        if (drag.ghost) { drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px"; box.querySelectorAll(".srt-bin").forEach((b) => { const r = b.getBoundingClientRect(); b.classList.toggle("over", e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom); }); }
      };
      window.addEventListener("pointermove", mv);
      const end = (e) => {
        if (!drag) return; const d = drag; drag = null;
        if (d.ghost) { d.ghost.remove(); let hit = -2; box.querySelectorAll(".srt-bin").forEach((b) => { const r = b.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) hit = +b.dataset.bin; b.classList.remove("over"); }); if (hit >= 0) { w.at[d.i] = hit; w.sel = null; api.sound("tap"); } rerender(); return; }
        // タップ：えらぶ／箱の中なら外に出す
        if (w.at[d.i] >= 0) { w.at[d.i] = -1; w.sel = null; } else w.sel = w.sel === d.i ? null : d.i;
        rerender();
      };
      const cancel = () => { if (drag && drag.ghost) drag.ghost.remove(); drag = null; rerender(); };
      window.addEventListener("pointerup", end); window.addEventListener("pointercancel", cancel);
      box.addEventListener("click", (e) => {
        if (w.done) return; const b = e.target.closest("[data-bin]"); if (!b || e.target.closest("[data-it]")) return;
        if (w.sel == null) { api.toast("先にカードをえらんでね"); return; }
        w.at[w.sel] = +b.dataset.bin; w.sel = null; api.sound("tap"); rerender();
      });
      w.cleanup = () => { window.removeEventListener("pointerup", end); window.removeEventListener("pointermove", mv); window.removeEventListener("pointercancel", cancel); document.querySelectorAll(".srt-ghost").forEach((g) => g.remove()); };
    },
    result: (q, w) => ({ ok: q.items.every((it, i) => w.at[i] === it[1]), text: q.bins.map((b, bi) => b + "：" + q.items.filter((_, i) => w.at[i] === bi).map((x) => x[0]).join("・")).join(" ／ ") }),
    show(q, w, el) { el.querySelectorAll("[data-it]").forEach((c) => { const i = +c.dataset.it; c.classList.add(w.at[i] === q.items[i][1] ? "right" : "wrong"); }); },
  };
  function chip(q, w, i) { return '<button type="button" class="srt-chip' + (w.sel === i ? " sel" : "") + '" data-it="' + i + '">' + esc(q.items[i][0]) + "</button>"; }

  // ===== 文字カード（ならべて答えを作る：穴うめ・英語の文・漢字の読み） =====
  F.tiles = {
    init: (q) => { const all = q.pieces.concat(q.extra || []); return { all, order: mixed(all.length), pick: [] }; },
    html: () => '<div class="tl" id="tl"></div>',
    render(q, w, el) {
      const box = el.querySelector("#tl"), sep = q.sep == null ? "" : q.sep;
      const ans = '<div class="tl-ans' + (sep ? " words" : "") + '">' + (w.pick.length ? w.pick.map((i, k) => '<button type="button" class="tl-p on" data-tp="' + k + '">' + esc(w.all[i]) + "</button>").join("") : '<span class="tl-ph">下のカードをタップしてね</span>') + "</div>";
      const pool = '<div class="tl-pool">' + w.order.map((i) => w.pick.includes(i) ? '<span class="tl-p ghost">' + esc(w.all[i]) + "</span>" : '<button type="button" class="tl-p" data-tw="' + i + '">' + esc(w.all[i]) + "</button>").join("") + "</div>";
      box.innerHTML = ans + pool;
    },
    mount(q, w, el, api) {
      const box = el.querySelector("#tl"), re = () => { F.tiles.render(q, w, el); api.ready(w.pick.length === q.pieces.length); };
      re();
      box.addEventListener("click", (e) => {
        if (w.done) return; let t;
        if ((t = e.target.closest("[data-tw]"))) { if (w.pick.length >= q.pieces.length) { api.toast("カードは " + q.pieces.length + " まいだよ。ちがうカードは上をタップでもどせるよ"); return; } w.pick.push(+t.dataset.tw); api.sound("tap"); }
        else if ((t = e.target.closest("[data-tp]"))) w.pick.splice(+t.dataset.tp, 1);
        else return;
        re();
      });
    },
    result(q, w) { const sep = q.sep == null ? "" : q.sep, text = w.pick.map((i) => w.all[i]).join(sep); return { ok: text === q.pieces.join(sep), text }; },
    show(q, w, el) { const sep = q.sep == null ? "" : q.sep; const ok = w.pick.map((i) => w.all[i]).join(sep) === q.pieces.join(sep); el.querySelectorAll("[data-tp]").forEach((b, k) => b.classList.add(ok || w.all[w.pick[k]] === q.pieces[k] ? "right" : "wrong")); },
  };

  // ===== あてはまるものを全部えらぶ =====
  F.multi = {
    init: (q) => ({ order: mixed(q.opts.length), on: {} }),
    html: (q, w) => '<p class="small muted center mul-hint">あてはまるものを<b>ぜんぶ</b>えらぼう（' + q.opts.length + 'こ中）</p><div class="opts mul" id="mul">' + w.order.map((i) => '<button type="button" class="opt mul-o" data-mo="' + i + '"><span class="mul-ck"></span>' + esc(q.opts[i]) + "</button>").join("") + "</div>",
    mount(q, w, el, api) {
      el.querySelector("#mul").addEventListener("click", (e) => { if (w.done) return; const b = e.target.closest("[data-mo]"); if (!b) return; const i = +b.dataset.mo; w.on[i] = !w.on[i]; b.classList.toggle("on", !!w.on[i]); api.sound("tap"); api.ready(Object.values(w.on).some(Boolean)); });
    },
    result(q, w) { const sel = q.opts.filter((_, i) => w.on[i]); const ok = sel.length === q.ans.length && q.ans.every((a) => sel.includes(a)); return { ok, text: sel.join("・") || "（なし）" }; },
    show(q, w, el) { el.querySelectorAll("[data-mo]").forEach((b) => { const i = +b.dataset.mo, should = q.ans.includes(q.opts[i]); b.disabled = true; if (should) b.classList.add(w.on[i] ? "right" : "miss"); else if (w.on[i]) b.classList.add("wrong"); }); },
  };

  // ===== 数直線（目もりをタップ） =====
  // q: { t:"nl", min, max, step, a:"値", lab: 目もりの数字を出す間かく, fmt:"dec"|"frac"(den) }
  const nlVal = (q, k) => { const v = q.min + k * q.step; return Math.round(v * 1e6) / 1e6; };
  const nlStr = (q, v) => (q.den ? fracStr(Math.round(v * q.den), q.den) : String(v));
  function fracStr(n, d) { const g = gcd(n, d); n /= g; d /= g; return d === 1 ? String(n) : n + "/" + d; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
  F.nl = {
    init: () => ({ k: null }),
    html: (q) => '<div class="nl" id="nl"></div><p class="small muted center">目もりをタップしてね</p>',
    render(q, w, el) {
      const n = Math.round((q.max - q.min) / q.step), W = 340, x0 = 22, x1 = W - 22, y = 56, X = (k) => x0 + ((x1 - x0) * k) / n;
      let s = '<svg viewBox="0 0 ' + W + ' 100" class="nl-svg"><line x1="' + (x0 - 10) + '" y1="' + y + '" x2="' + (x1 + 12) + '" y2="' + y + '" stroke="#3b3355" stroke-width="2.5"/><path d="M' + (x1 + 12) + " " + y + "l-8 -5v10z\" fill=\"#3b3355\"/>";
      const lab = q.lab || n;
      for (let k = 0; k <= n; k++) {
        const big = k % lab === 0, v = nlVal(q, k);
        s += '<line x1="' + X(k) + '" y1="' + (y - (big ? 12 : 7)) + '" x2="' + X(k) + '" y2="' + (y + (big ? 12 : 7)) + '" stroke="#3b3355" stroke-width="' + (big ? 2.2 : 1.3) + '"/>';
        if (big) s += '<text x="' + X(k) + '" y="' + (y + 32) + '" font-size="14" text-anchor="middle" fill="#3b3355" font-weight="700">' + esc(nlStr(q, v)) + "</text>";
        s += '<rect data-nk="' + k + '" x="' + (X(k) - (x1 - x0) / n / 2) + '" y="' + (y - 34) + '" width="' + (x1 - x0) / n + '" height="60" fill="transparent"/>';
      }
      if (w.k != null) s += '<g class="nl-mk"><path d="M' + X(w.k) + " " + (y - 14) + "l-9 -16h18z\" fill=\"" + (w.res == null ? "#ff5fa2" : w.res ? "#2fb36a" : "#e5383b") + '"/></g>';
      if (w.res === false) { const kk = Math.round((parseFloat(q.av != null ? q.av : q.a) - q.min) / q.step); s += '<path d="M' + X(kk) + " " + (y + 14) + "l-9 16h18z\" fill=\"#2fb36a\"/>"; }
      el.querySelector("#nl").innerHTML = s + "</svg>";
    },
    mount(q, w, el, api) { F.nl.render(q, w, el); el.querySelector("#nl").addEventListener("click", (e) => { if (w.done) return; const r = e.target.closest("[data-nk]"); if (!r) return; w.k = +r.dataset.nk; api.sound("tap"); F.nl.render(q, w, el); api.ready(true); }); },
    result(q, w) { const v = nlVal(q, w.k), want = q.av != null ? q.av : parseFloat(q.a); return { ok: Math.abs(v - want) < 1e-6, text: nlStr(q, v) }; },
    show(q, w, el) { w.res = F.nl.result(q, w).ok; F.nl.render(q, w, el); },
  };

  // ===== 漢字の書き取り（書き順アニメ → なぞる → 書く） =====
  const K = (root.HMK = root.HMK || { data: {}, loading: {} });
  K.flush = () => { const qq = root.HMK_Q || []; while (qq.length) Object.assign(K.data, qq.shift()); };
  K.flush();
  K.load = (g) => {
    if (K.loading[g]) return K.loading[g];
    K.loading[g] = new Promise((res, rej) => {
      if (typeof document === "undefined") return rej(new Error("no document"));
      const s = document.createElement("script"); s.src = "./kanji/g" + g + ".js"; s.async = true;
      s.onload = () => { K.flush(); res(); }; s.onerror = () => { delete K.loading[g]; rej(new Error("load")); };
      document.head.appendChild(s);
    });
    return K.loading[g];
  };
  // SVG のパス（KanjiVG：M/C/S/L/H/V/Z, 小文字は相対）を点の列にする
  function pathPts(d, step = 2) {
    const tk = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
    let i = 0, cmd = "", x = 0, y = 0, sx = 0, sy = 0, pcx = null, pcy = null; const pts = [];
    const num = () => parseFloat(tk[i++]);
    const cubic = (x0, y0, x1, y1, x2, y2, x3, y3) => { const len = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2); const n = Math.max(2, Math.ceil(len / step)); for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; pts.push([u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]); } };
    const line = (x0, y0, x3, y3) => { const n = Math.max(1, Math.ceil(Math.hypot(x3 - x0, y3 - y0) / step)); for (let k = 1; k <= n; k++) pts.push([x0 + ((x3 - x0) * k) / n, y0 + ((y3 - y0) * k) / n]); };
    while (i < tk.length) {
      if (/[a-zA-Z]/.test(tk[i])) cmd = tk[i++];
      const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
      if (C === "M") { x = ox + num(); y = oy + num(); sx = x; sy = y; pts.push([x, y]); cmd = rel ? "l" : "L"; pcx = null; }
      else if (C === "C") { const a = ox + num(), b = oy + num(), c = ox + num(), e = oy + num(), f = ox + num(), g = oy + num(); cubic(x, y, a, b, c, e, f, g); pcx = c; pcy = e; x = f; y = g; }
      else if (C === "S") { const a = pcx == null ? x : 2 * x - pcx, b = pcy == null ? y : 2 * y - pcy; const c = ox + num(), e = oy + num(), f = ox + num(), g = oy + num(); cubic(x, y, a, b, c, e, f, g); pcx = c; pcy = e; x = f; y = g; }
      else if (C === "L") { const f = ox + num(), g = oy + num(); line(x, y, f, g); x = f; y = g; pcx = null; }
      else if (C === "H") { const f = (rel ? x : 0) + num(); line(x, y, f, y); x = f; pcx = null; }
      else if (C === "V") { const g = (rel ? y : 0) + num(); line(x, y, x, g); y = g; pcx = null; }
      else if (C === "Z") { line(x, y, sx, sy); x = sx; y = sy; pcx = null; }
      else { i++; }
    }
    return pts;
  }
  K.pathPts = pathPts;
  function resample(pts, n) {
    if (pts.length < 2) return Array.from({ length: n }, () => (pts[0] || [0, 0]).slice());
    const seg = [0]; for (let k = 1; k < pts.length; k++) seg.push(seg[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const L = seg[seg.length - 1] || 1, out = []; let j = 1;
    for (let k = 0; k < n; k++) { const t = (L * k) / (n - 1); while (j < seg.length - 1 && seg[j] < t) j++; const a = seg[j - 1], b = seg[j], r = b > a ? (t - a) / (b - a) : 0; out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * r, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * r]); }
    return out;
  }
  const strokeLen = (p) => { let s = 0; for (let k = 1; k < p.length; k++) s += Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]); return s; };
  const mdist = (a, b) => { let s = 0; for (let k = 0; k < a.length; k++) s += Math.hypot(a[k][0] - b[k][0], a[k][1] - b[k][1]); return s / a.length; };
  // 判定：画数・1画ずつの形と向き・書き順（なぞりはきびしく、書くときは位置と大きさのずれをゆるす）
  K.judge = (ref, user, mode) => {
    const N = 20, R = ref.map((p) => resample(p, N));
    if (user.length !== ref.length) return { ok: false, why: "count", n: user.length, need: ref.length, per: [] };
    let U = user.map((p) => resample(p, N));
    if (mode !== "trace") {
      // 全体の位置と大きさを合わせる
      const bb = (S) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; S.forEach((p) => p.forEach(([x, y]) => { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); })); return [a, b, c, d]; };
      const r = bb(R), u = bb(U), rw = Math.max(12, r[2] - r[0]), rh = Math.max(12, r[3] - r[1]), uw = Math.max(12, u[2] - u[0]), uh = Math.max(12, u[3] - u[1]);
      const sx = rw / uw, sy = rh / uh, cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2, ux = (u[0] + u[2]) / 2, uy = (u[1] + u[3]) / 2;
      U = U.map((p) => p.map(([x, y]) => [cx + (x - ux) * sx, cy + (y - uy) * sy]));
    }
    const tol = mode === "trace" ? 13 : 17, per = [];
    let why = null;
    for (let k = 0; k < R.length; k++) {
      const f = mdist(U[k], R[k]), b = mdist(U[k].slice().reverse(), R[k]);
      const short = strokeLen(R[k]) < 14;   // 点（、）などの短い画は向きを見ない
      let best = k, bestD = f; for (let j = 0; j < R.length; j++) if (j !== k) { const dj = mdist(U[k], R[j]); if (dj < bestD - 4) { best = j; bestD = dj; } }
      let ok = f <= tol + (short ? 4 : 0), w = null;
      if (!ok && !short && b <= tol && b < f) w = "dir";
      else if (!ok && best !== k && bestD <= tol) w = "order";
      else if (!ok) w = "shape";
      per.push({ ok, w, d: Math.round(f * 10) / 10 });
      if (!ok && !why) why = { k, w };
    }
    return { ok: !why, why: why ? why.w : null, at: why ? why.k : -1, per };
  };
  F.kanji = {
    init: (q) => ({ strokes: [], drawing: null, phase: q.mode === "trace" ? "demo" : "write", ref: null }),
    html: (q) => '<div class="kj" id="kj"><div class="kj-pad"><canvas class="kj-cv" id="kj-cv"></canvas><div class="kj-load" id="kj-load">じゅんび中…</div></div><div class="kj-tools"><button type="button" class="kj-b" data-kj="demo">✍️ 書き順</button><button type="button" class="kj-b" data-kj="undo">↩︎ 1画もどす</button><button type="button" class="kj-b" data-kj="clear">🧽 けす</button></div><p class="small muted center kj-msg" id="kj-msg">' + (q.mode === "trace" ? "お手本のあとで、うすい字をなぞろう" : "ます目に大きく書こう") + "</p></div>",
    mount(q, w, el, api) {
      const cv = el.querySelector("#kj-cv"), pad = el.querySelector(".kj-pad"), msg = el.querySelector("#kj-msg");
      const S = Math.min(300, Math.max(220, (el.querySelector("#kj").clientWidth || 320) - 24)), dpr = Math.min(3, root.devicePixelRatio || 1);
      cv.width = S * dpr; cv.height = S * dpr; cv.style.width = S + "px"; cv.style.height = S + "px"; pad.style.width = S + "px"; pad.style.height = S + "px";
      const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sc = S / 109, toRef = (x, y) => [x / sc, y / sc];
      let anim = null;
      const draw = () => {
        c.clearRect(0, 0, S, S);
        c.fillStyle = "#fffdf6"; c.fillRect(0, 0, S, S);
        c.strokeStyle = "#e9b9a6"; c.lineWidth = 1; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(S / 2, 6); c.lineTo(S / 2, S - 6); c.moveTo(6, S / 2); c.lineTo(S - 6, S / 2); c.stroke(); c.setLineDash([]);
        c.strokeStyle = "#c9746a"; c.lineWidth = 2; c.strokeRect(1, 1, S - 2, S - 2);
        if (!w.ref) return;
        const P = w.paths;
        const showGuide = q.mode === "trace" || w.done;
        c.lineCap = "round"; c.lineJoin = "round";
        if (showGuide) { c.save(); c.scale(sc, sc); c.strokeStyle = w.done ? "rgba(60,60,80,.16)" : "rgba(91,76,224,.2)"; c.lineWidth = 7.5; c.lineCap = "round"; c.lineJoin = "round"; P.forEach((p) => c.stroke(p)); c.restore(); }
        if (anim) {
          // 書き順アニメ：1画ずつ、筆の先が進むように
          const { k, t } = anim; c.save(); c.scale(sc, sc); c.lineWidth = 6.2;
          for (let j = 0; j < k; j++) { c.strokeStyle = "#5b4ce0"; c.stroke(P[j]); }
          const pts = w.refPts[k]; if (pts) { const n = Math.max(1, Math.floor(pts.length * t)); c.strokeStyle = "#ff5fa2"; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let m = 1; m < n; m++) c.lineTo(pts[m][0], pts[m][1]); c.stroke(); const hp = pts[n - 1]; c.fillStyle = "#ff5fa2"; c.beginPath(); c.arc(hp[0], hp[1], 3.6, 0, 7); c.fill(); }
          c.restore();
          for (let j = 0; j <= Math.min(k, w.refPts.length - 1); j++) { const p0 = w.refPts[j][0]; c.fillStyle = j === k ? "#ff5fa2" : "#5b4ce0"; c.font = "800 " + Math.round(S * 0.055) + "px system-ui,sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(j + 1), p0[0] * sc - S * 0.04, p0[1] * sc - S * 0.03); }
          return;
        }
        // 自分の線
        const per = w.res ? w.res.per : null;
        w.strokes.forEach((p, i) => { c.strokeStyle = per ? (per[i] && per[i].ok ? "#2fb36a" : "#e5383b") : "#2b2340"; c.lineWidth = S * 0.055; c.beginPath(); p.forEach(([x, y], m) => (m ? c.lineTo(x * sc, y * sc) : c.moveTo(x * sc, y * sc))); c.stroke(); });
        if (w.drawing) { c.strokeStyle = "#2b2340"; c.lineWidth = S * 0.055; c.beginPath(); w.drawing.forEach(([x, y], m) => (m ? c.lineTo(x * sc, y * sc) : c.moveTo(x * sc, y * sc))); c.stroke(); }
        if (w.done && !w.res.ok && w.res.at >= 0) { const p0 = w.refPts[w.res.at][0]; c.fillStyle = "#e5383b"; c.beginPath(); c.arc(p0[0] * sc, p0[1] * sc, 7, 0, 7); c.fill(); }
      };
      const play = () => new Promise((res) => {
        if (!w.ref) return res();
        let k = 0, t = 0, last = performance.now(); anim = { k, t }; msg.textContent = "書き順を見てね";
        const speed = 1 / 0.75;
        const tick = (now) => { if (!anim) return res(); const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt * speed; if (t >= 1) { t = 0; k++; if (k < w.refPts.length) api.sound("tap"); } if (k >= w.refPts.length) { anim = null; draw(); return res(); } anim = { k, t }; draw(); w.raf = requestAnimationFrame(tick); };
        w.raf = requestAnimationFrame(tick);
      });
      const ready = () => api.ready(w.strokes.length > 0 && !anim);
      K.load(q.g).then(() => {
        const ref = K.data[q.a]; const ld = el.querySelector("#kj-load"); if (ld) ld.remove();
        if (!ref) { msg.textContent = "この漢字のお手本を読みこめませんでした"; return; }
        w.ref = ref; w.paths = ref.map((d) => new Path2D(d)); w.refPts = ref.map((d) => pathPts(d, 1.5));
        draw();
        if (q.mode === "trace") play().then(() => { msg.textContent = "うすい字の上を、書き順どおりになぞろう（" + ref.length + "画）"; ready(); });
        else msg.textContent = "ます目に大きく書こう（" + ref.length + "画）";
      }).catch(() => { msg.textContent = "お手本を読みこめませんでした。通信を確かめてね"; });
      const pos = (e) => { const r = cv.getBoundingClientRect(); return toRef(((e.clientX - r.left) / r.width) * S, ((e.clientY - r.top) / r.height) * S); };
      cv.style.touchAction = "none";
      cv.addEventListener("pointerdown", (e) => { if (w.done || anim || !w.ref) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} w.drawing = [pos(e)]; draw(); });
      cv.addEventListener("pointermove", (e) => { if (!w.drawing) return; const p = pos(e), l = w.drawing[w.drawing.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 0.8) { w.drawing.push(p); draw(); } });
      const up = () => { if (!w.drawing) return; const p = w.drawing; w.drawing = null; if (p.length === 1) p.push([p[0][0] + 0.5, p[0][1] + 0.5]); w.strokes.push(p); draw(); ready(); };
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("lostpointercapture", up);
      el.querySelector(".kj-tools").addEventListener("click", (e) => {
        const b = e.target.closest("[data-kj]"); if (!b || w.done) return; const k = b.dataset.kj;
        if (k === "undo") { w.strokes.pop(); draw(); ready(); }
        else if (k === "clear") { w.strokes = []; draw(); ready(); }
        else if (k === "demo" && !anim) { const keep = w.strokes; w.strokes = []; play().then(() => { w.strokes = keep; draw(); msg.textContent = q.mode === "trace" ? "うすい字の上をなぞろう（" + w.ref.length + "画）" : "ます目に大きく書こう（" + w.ref.length + "画）"; ready(); }); }
      });
      w.draw = draw; w.cleanup = () => { anim = null; cancelAnimationFrame(w.raf); };
    },
    result(q, w) {
      if (!w.ref) return { ok: false, text: "（書けなかった）" };
      const r = K.judge(w.refPts, w.strokes, q.mode); w.res = r;
      const nm = { count: "画数が " + w.strokes.length + "画（正しくは " + w.ref.length + "画）", dir: (r.at + 1) + "画目の向き", order: (r.at + 1) + "画目の書き順", shape: (r.at + 1) + "画目の形や位置" };
      return { ok: r.ok, text: r.ok ? q.a + "（" + w.ref.length + "画）" : "「" + q.a + "」の " + nm[r.why] + " を見直そう" };
    },
    show(q, w, el) { w.done = true; if (w.draw) w.draw(); const m = el.querySelector("#kj-msg"); if (m && w.res) m.textContent = w.res.ok ? "とてもじょうず！ 書き順も合っているよ" : w.res.why === "count" ? "画数をたしかめよう。「✍️ 書き順」でもう一度見られるよ" : "赤い画を見直そう。●が書きはじめの場所だよ"; const d = el.querySelector('[data-kj="demo"]'); if (d) { d.disabled = false; } },
  };

  // ===== 共通の入口（app.js から） =====
  root.HMQ = {
    fmt: F, K, pathPts,
    has: (t) => !!F[t],
    html(q) { const f = F[q.t]; cur = { q, w: f.init ? f.init(q) : {} }; return '<div class="work work-' + q.t + '" id="work">' + f.html(q, cur.w) + "</div>" + (f.noSubmit ? "" : '<button type="button" class="btn primary block" data-q="submit" id="work-ok" disabled>こたえる</button>'); },
    mount(q, el, api) { if (!cur || cur.q !== q) return; cur.el = el; cur.api = api; const f = F[q.t]; if (f.mount) f.mount(q, cur.w, el, api); },
    done(q) { const b = document.getElementById("work-ok"); return !!(cur && cur.q === q && b && !b.disabled); },
    result(q) { return F[q.t].result(q, cur.w); },
    show(q) { if (!cur || cur.q !== q) return; cur.w.done = true; const f = F[q.t]; if (f.show) f.show(q, cur.w, cur.el); const b = document.getElementById("work-ok"); if (b) b.remove(); },
    cur: () => cur,
    leave() { if (cur && cur.w && cur.w.cleanup) try { cur.w.cleanup(); } catch (e) {} cur = null; },
  };
})(typeof window !== "undefined" ? window : globalThis);
