/* ほしまなび — v1.5 図のライブラリ（算数・数学）：平面図形・立体（見取図）・展開図・ものさし・分度器・グラフ・座標
   どの図も、問題の答えと同じ数値・同じ形から作る（図と答えがずれないように）。 */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, { R, pick, shuf } = U;
  const FG = (HM.FIG = HM.FIG || {});
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  const fig = (w, h, inner, cls) => '<svg class="qsvg qfig' + (cls ? " " + cls : "") + '" viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" role="img">' + inner + "</svg>";
  FG.fig = fig; FG.f1 = f1;
  const COL = { line: "#2b2d42", fill: "#d0ebff", fill2: "#ffe8cc", fill3: "#d3f9d8", fill4: "#f3d9fa", red: "#e03131", blue: "#1c7ed6", org: "#e8590c", mute: "#868e96", grid: "#dee2e6" };
  FG.COL = COL;
  const T = (x, y, t, o = {}) => '<text x="' + f1(x) + '" y="' + f1(y) + '" font-size="' + (o.size || 13) + '" text-anchor="' + (o.anchor || "middle") + '" fill="' + (o.color || COL.line) + '"' + (o.bold ? ' font-weight="700"' : "") + ' dominant-baseline="middle">' + t + "</text>";
  FG.T = T;
  const L = (a, b, o = {}) => '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="' + (o.color || COL.line) + '" stroke-width="' + (o.w || 2.5) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : "") + ' stroke-linecap="round"/>';
  FG.L = L;
  const PG = (pts, o = {}) => '<polygon points="' + pts.map((p) => f1(p[0]) + "," + f1(p[1])).join(" ") + '" fill="' + (o.fill || "none") + '" stroke="' + (o.color || COL.line) + '" stroke-width="' + (o.w || 2.5) + '" stroke-linejoin="round"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : "") + "/>";
  FG.PG = PG;
  // ---- 座標を図のわくに合わせる（数学の座標：上がy＋） ----
  function fit(pts, W, H, pad = 22) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min((W - 2 * pad) / Math.max(1e-6, x1 - x0), (H - 2 * pad) / Math.max(1e-6, y1 - y0));
    const ox = (W - (x1 - x0) * s) / 2, oy = (H - (y1 - y0) * s) / 2;
    const map = (p) => [ox + (p[0] - x0) * s, H - oy - (p[1] - y0) * s];
    return { map, s };
  }
  FG.fit = fit;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]), unit = (a) => mul(a, 1 / (len(a) || 1));
  const cen = (pts) => mul(pts.reduce((s, p) => add(s, p), [0, 0]), 1 / pts.length);
  FG.v = { sub, add, mul, len, unit, cen };
  // 直角のしるし（画面の座標）
  function rightMark(P, A, B, s = 11) { const u = mul(unit(sub(A, P)), s), v = mul(unit(sub(B, P)), s); const p1 = add(P, u), p2 = add(add(P, u), v), p3 = add(P, v); return '<polyline points="' + [p1, p2, p3].map((p) => f1(p[0]) + "," + f1(p[1])).join(" ") + '" fill="none" stroke="' + COL.red + '" stroke-width="2"/>'; }
  // 等しい辺のしるし（n本線）
  function ticks(A, B, n = 1) { const m = mul(add(A, B), 0.5), d = unit(sub(B, A)), nn = [-d[1], d[0]]; let s = ""; for (let k = 0; k < n; k++) { const c = add(m, mul(d, (k - (n - 1) / 2) * 5)); s += L(add(c, mul(nn, 6)), add(c, mul(nn, -6)), { color: COL.blue, w: 2 }); } return s; }
  // 平行のしるし（矢じり）
  function parMark(A, B, n = 1) { const m = mul(add(A, B), 0.5), d = unit(sub(B, A)), nn = [-d[1], d[0]]; let s = ""; for (let k = 0; k < n; k++) { const c = add(m, mul(d, k * 7)); s += '<polyline points="' + [add(add(c, mul(d, -5)), mul(nn, 5)), c, add(add(c, mul(d, -5)), mul(nn, -5))].map((p) => f1(p[0]) + "," + f1(p[1])).join(" ") + '" fill="none" stroke="' + COL.org + '" stroke-width="2"/>'; } return s; }
  // 角の弧
  function arcMark(P, A, B, r = 18, color = COL.org, label) {
    const a1 = Math.atan2(A[1] - P[1], A[0] - P[0]), a2 = Math.atan2(B[1] - P[1], B[0] - P[0]);
    let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
    const p1 = [P[0] + r * Math.cos(a1), P[1] + r * Math.sin(a1)], p2 = [P[0] + r * Math.cos(a1 + d), P[1] + r * Math.sin(a1 + d)];
    let s = '<path d="M' + f1(p1[0]) + " " + f1(p1[1]) + " A" + r + " " + r + " 0 0 " + (d > 0 ? 1 : 0) + " " + f1(p2[0]) + " " + f1(p2[1]) + '" fill="none" stroke="' + color + '" stroke-width="2.2"/>';
    if (label != null) { const am = a1 + d / 2, rr = r + 13; s += T(P[0] + rr * Math.cos(am), P[1] + rr * Math.sin(am), label, { size: 12, color, bold: true }); }
    return s;
  }
  FG.rightMark = rightMark; FG.ticks = ticks; FG.parMark = parMark; FG.arcMark = arcMark;
  // 辺の長さの文字（図形の外がわ）
  function sideLab(A, B, t, C, off = 13) { const m = mul(add(A, B), 0.5), d = unit(sub(B, A)); let nn = [-d[1], d[0]]; if (C && (sub(m, C)[0] * nn[0] + sub(m, C)[1] * nn[1]) < 0) nn = mul(nn, -1); const p = add(m, mul(nn, off)); return T(p[0], p[1], t, { size: 12, color: COL.blue, bold: true }); }
  FG.sideLab = sideLab;
  // 頂点の名前
  function vLab(P, C, t, off = 13) { const d = unit(sub(P, C)), p = add(P, mul(d, off)); return T(p[0], p[1], t, { size: 13, bold: true }); }
  FG.vLab = vLab;

  // ========== 平面図形 ==========
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const regular = (n, a0 = Math.PI / 2) => [...Array(n)].map((_, k) => [Math.cos(a0 + (2 * Math.PI * k) / n), Math.sin(a0 + (2 * Math.PI * k) / n)]);
  // 形の頂点（数学座標）と、しるし（直角・等辺・平行）
  const SHAPES = {
    "正三角形": () => ({ p: [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]], eq: [[0, 1, 1], [1, 2, 1], [2, 0, 1]] }),
    "二等辺三角形": () => { const h = pick([1.25, 1.4, 1.55, 0.42, 0.5]); return { p: [[0, 0], [1, 0], [0.5, h]], eq: [[1, 2, 1], [2, 0, 1]] }; },
    "直角三角形": () => { const a = pick([1.5, 1.7, 2]), flip = R(0, 1); return { p: flip ? [[0, 0], [a, 0], [a, 1]] : [[0, 0], [a, 0], [0, 1]], right: [flip ? 1 : 0] }; },
    "直角二等辺三角形": () => ({ p: [[0, 0], [1, 0], [0, 1]], right: [0], eq: [[0, 1, 1], [2, 0, 1]] }),
    "三角形": () => { const [x, h] = pick([[0.65, 0.3], [1.2, 0.7], [-0.2, 0.65], [0.35, 0.35], [1.15, 0.7]]); return { p: [[0, 0], [1, 0], [x, h]] }; },
    "正方形": () => ({ p: [[0, 0], [1, 0], [1, 1], [0, 1]], right: [0, 1, 2, 3], eq: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 0, 1]] }),
    "長方形": () => { const w = pick([1.6, 1.8, 2.1]); return { p: [[0, 0], [w, 0], [w, 1], [0, 1]], right: [0, 1, 2, 3] }; },
    "ひし形": () => { const a = pick([1.5, 1.7, 1.9]); return { p: [[-a, 0], [0, -1], [a, 0], [0, 1]], eq: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 0, 1]] }; },
    "平行四辺形": () => { const s = pick([0.45, 0.6, 0.75]); return { p: [[0, 0], [1.7, 0], [1.7 + s, 0.9], [s, 0.9]], par: [[0, 1, 1], [3, 2, 1], [0, 3, 2], [1, 2, 2]] }; },
    "台形": () => { const t = pick([[0.2, 1.3], [0.7, 1.85], [0.3, 1.2]]); return { p: [[0, 0], [2, 0], [t[1], 1], [t[0], 1]], par: [[0, 1, 1], [3, 2, 1]] }; },
    "四角形": () => ({ p: pick([[[0, 0], [1.8, 0.25], [1.45, 1.25], [0.3, 0.85]], [[0, 0.2], [1.6, 0], [1.9, 1.1], [0.5, 1.3]]]) }),
    "正五角形": () => ({ p: regular(5), eq: [0, 1, 2, 3, 4].map((k) => [k, (k + 1) % 5, 1]) }),
    "正六角形": () => ({ p: regular(6, 0), eq: [0, 1, 2, 3, 4, 5].map((k) => [k, (k + 1) % 6, 1]) }),
    "正八角形": () => ({ p: regular(8, Math.PI / 8), eq: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [k, (k + 1) % 8, 1]) }),
    "五角形": () => ({ p: [[0, 0], [1.4, 0.1], [1.7, 0.9], [0.8, 1.45], [-0.15, 0.85]] }),
    "六角形": () => ({ p: [[0, 0], [1.2, -0.1], [1.9, 0.6], [1.5, 1.4], [0.4, 1.5], [-0.3, 0.8]] }),
  };
  FG.SHAPE_NAMES = Object.keys(SHAPES);
  // 図形をかく。o.marks: しるしをかく、o.rot: 回転、o.fill: 色、o.labels: 頂点名、o.sides: 辺の文字 [[i,j,"5cm"]]
  FG.shape = function (name, o = {}) {
    const W = o.W || 220, H = o.H || 160;
    if (name === "円") { const r = Math.min(W, H) / 2 - 20; return fig(W, H, '<circle cx="' + W / 2 + '" cy="' + H / 2 + '" r="' + r + '" fill="' + (o.fill || COL.fill) + '" stroke="' + COL.line + '" stroke-width="2.5"/>' + (o.center ? '<circle cx="' + W / 2 + '" cy="' + H / 2 + '" r="3" fill="' + COL.line + '"/>' : "")); }
    const S = SHAPES[name](); let pts = S.p;
    if (o.rot) pts = pts.map((p) => rot(p, o.rot));
    const { map } = fit(pts, W, H, o.pad || 24), P = pts.map(map), C = cen(P);
    let s = PG(P, { fill: o.fill || COL.fill });
    if (o.marks !== false) {
      (S.right || []).forEach((k) => { s += rightMark(P[k], P[(k + 1) % P.length], P[(k + P.length - 1) % P.length]); });
      if (o.marks === "all" || o.marks === "eq") (S.eq || []).forEach(([i, j, n]) => { s += ticks(P[i], P[j], n); });
      if (o.marks === "all" || o.marks === "par") (S.par || []).forEach(([i, j, n]) => { s += parMark(P[i], P[j], n); });
    }
    if (o.labels) P.forEach((p, k) => { s += vLab(p, C, o.labels[k]); });
    if (o.sides) o.sides.forEach(([i, j, t]) => { s += sideLab(P[i], P[j], t, C); });
    if (o.diag) o.diag.forEach(([i, j]) => { s += L(P[i], P[j], { color: COL.org, dash: "6 4", w: 2 }); });
    return fig(W, H, s);
  };
  FG.shapePts = (name) => SHAPES[name]().p;
  // 方眼の上の図形（ますの数で長さ・面積がわかる）
  FG.gridPoly = function (cells, o = {}) {
    // cells: [[x,y],...] ぬるます、または o.poly: 頂点（ます目の座標）
    const nx = o.nx || 10, ny = o.ny || 6, c = o.c || 20, W = nx * c + 20, H = ny * c + 20;
    let s = "";
    for (let i = 0; i <= nx; i++) s += L([10 + i * c, 10], [10 + i * c, 10 + ny * c], { color: COL.grid, w: 1 });
    for (let j = 0; j <= ny; j++) s += L([10, 10 + j * c], [10 + nx * c, 10 + j * c], { color: COL.grid, w: 1 });
    (cells || []).forEach(([x, y]) => { s += '<rect x="' + (10 + x * c) + '" y="' + (10 + y * c) + '" width="' + c + '" height="' + c + '" fill="' + (o.fill || "#ffa94d") + '" stroke="' + COL.line + '" stroke-width="1.2"/>'; });
    if (o.poly) s += PG(o.poly.map(([x, y]) => [10 + x * c, 10 + y * c]), { fill: o.fill || "rgba(116,192,252,.55)", w: 2.5 });
    if (o.extra) s += o.extra(c);
    return fig(W, H, s);
  };
  // おうぎ形
  FG.sector = function (deg, o = {}) {
    const W = o.W || 200, H = o.H || 170, r = o.r || 70, cx = W / 2, cy = H / 2 + (deg <= 180 ? 25 : 0);
    const a0 = -Math.PI / 2 - (deg * Math.PI) / 360 + Math.PI / 2 - Math.PI / 2, a1 = a0 + (deg * Math.PI) / 180;
    const s0 = -(deg * Math.PI) / 360 - Math.PI / 2, s1 = s0 + (deg * Math.PI) / 180;
    const p0 = [cx + r * Math.cos(s0), cy + r * Math.sin(s0)], p1 = [cx + r * Math.cos(s1), cy + r * Math.sin(s1)];
    let s = '<path d="M' + cx + " " + cy + " L" + f1(p0[0]) + " " + f1(p0[1]) + " A" + r + " " + r + " 0 " + (deg > 180 ? 1 : 0) + " 1 " + f1(p1[0]) + " " + f1(p1[1]) + ' Z" fill="' + (o.fill || COL.fill2) + '" stroke="' + COL.line + '" stroke-width="2.5" stroke-linejoin="round"/>';
    s += arcMark([cx, cy], p0, p1, 16, COL.org, o.angLab);
    if (o.rLab) s += sideLab([cx, cy], p0, o.rLab, p1);
    void a0; void a1;
    return fig(W, H, s);
  };

  // ========== 立体（3Dを正投影。かくれた辺は点線） ==========
  function cam(az = 0.5, el = 0.38) { const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el); return (p) => { const x = p[0] * ca + p[2] * sa, z0 = -p[0] * sa + p[2] * ca; const y = p[1] * ce + z0 * se, z = -p[1] * se + z0 * ce; return [x, y, z]; }; }
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const s3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  // V: 頂点、F: 面（外から見て反時計回り）。視点は z の負の向きから見る（z が小さいほど手前）
  function polyhedron(V, F, o = {}) {
    const W = o.W || 220, H = o.H || 170, C = cam(o.az != null ? o.az : 0.55, o.el != null ? o.el : 0.42);
    const P = V.map(C), ctr = P.reduce((s, p) => [s[0] + p[0] / P.length, s[1] + p[1] / P.length, s[2] + p[2] / P.length], [0, 0, 0]);
    const NN = F.map((f) => { const n = cross(s3(P[f[1]], P[f[0]]), s3(P[f[2]], P[f[0]])); const fc = f.reduce((s, k) => [s[0] + P[k][0] / f.length, s[1] + P[k][1] / f.length, s[2] + P[k][2] / f.length], [0, 0, 0]); const out = s3(fc, ctr); const nn = n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0 ? n.map((x) => -x) : n; const l = Math.hypot(...nn) || 1; return nn.map((x) => x / l); });
    const vis = NN.map((nn) => nn[2] < -1e-9);
    const shade = (nn) => (nn[1] > 0.5 ? "#e7f5ff" : nn[0] > 0.2 ? "#a5d8ff" : COL.fill);
    const edges = new Map(); F.forEach((f, fi) => f.forEach((a, i) => { const b = f[(i + 1) % f.length], k = Math.min(a, b) + "-" + Math.max(a, b); const e = edges.get(k) || { a: Math.min(a, b), b: Math.max(a, b), v: false }; e.v = e.v || vis[fi]; edges.set(k, e); }));
    const { map } = fit(P.map((p) => [p[0], p[1]]), W, H, o.pad || 22), Q = P.map((p) => map([p[0], p[1]]));
    let s = "";
    F.forEach((f, fi) => { if (vis[fi]) s += PG(f.map((k) => Q[k]), { fill: (o.fills && o.fills[fi]) || o.fill || shade(NN[fi]), w: 0.01, color: "none" }); });
    edges.forEach((e) => { if (!e.v) s += L(Q[e.a], Q[e.b], { dash: "5 5", w: 1.8, color: COL.mute }); });
    edges.forEach((e) => { if (e.v) s += L(Q[e.a], Q[e.b], { w: 2.5 }); });
    if (o.marks) s += o.marks(Q, P);
    return fig(W, H, s);
  }
  FG.polyhedron = polyhedron;
  const prismVF = (base, h) => { const n = base.length, V = base.map(([x, z]) => [x, 0, z]).concat(base.map(([x, z]) => [x, h, z])); const F = [[...Array(n).keys()].reverse(), [...Array(n).keys()].map((k) => k + n)]; for (let k = 0; k < n; k++) F.push([k, (k + 1) % n, ((k + 1) % n) + n, k + n]); return [V, F]; };
  const pyrVF = (base, h) => { const n = base.length, V = base.map(([x, z]) => [x, 0, z]).concat([[cen(base)[0], h, cen(base)[1]]]); const F = [[...Array(n).keys()].reverse()]; for (let k = 0; k < n; k++) F.push([k, (k + 1) % n, n]); return [V, F]; };
  const regBase = (n, r = 1, a0 = 0) => [...Array(n)].map((_, k) => [r * Math.cos(a0 + (2 * Math.PI * k) / n), r * Math.sin(a0 + (2 * Math.PI * k) / n)]);
  const SOLIDS = {
    "立方体": (o) => polyhedron(...prismVF([[0, 0], [1, 0], [1, 1], [0, 1]], 1), o),
    "直方体": (o) => polyhedron(...prismVF([[0, 0], [1.8, 0], [1.8, 0.9], [0, 0.9]], 1.1), o),
    "三角柱": (o) => polyhedron(...prismVF(regBase(3, 0.85, -0.75), 1.5), o),
    "五角柱": (o) => polyhedron(...prismVF(regBase(5, 0.9, 0.3), 1.4), o),
    "六角柱": (o) => polyhedron(...prismVF(regBase(6, 0.9, 0.2), 1.4), o),
    "三角すい": (o) => polyhedron(...pyrVF(regBase(3, 1, -0.75), 1.5), o),
    "四角すい": (o) => polyhedron(...pyrVF([[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]], 1.5), o),
    "円柱": (o) => round("cyl", o), "円すい": (o) => round("cone", o), "球": (o) => round("ball", o),
  };
  FG.SOLID_NAMES = Object.keys(SOLIDS);
  FG.solid = (name, o = {}) => SOLIDS[name](o);
  // 回転体（円柱・円すい・球）
  function round(kind, o = {}) {
    const W = o.W || 220, H = o.H || 170, cx = W / 2, rx = o.rx || 52, ry = rx * 0.32, top = 28, bot = H - 30;
    let s = "";
    if (kind === "cyl") {
      s += '<path d="M' + (cx - rx) + " " + top + " L" + (cx - rx) + " " + bot + " A" + rx + " " + ry + " 0 0 0 " + (cx + rx) + " " + bot + " L" + (cx + rx) + " " + top + ' Z" fill="' + (o.fill || COL.fill) + '" stroke="none"/>';
      s += '<ellipse cx="' + cx + '" cy="' + top + '" rx="' + rx + '" ry="' + ry + '" fill="' + (o.fill2 || "#a5d8ff") + '" stroke="' + COL.line + '" stroke-width="2.5"/>';
      s += L([cx - rx, top], [cx - rx, bot]) + L([cx + rx, top], [cx + rx, bot]);
      s += '<path d="M' + (cx - rx) + " " + bot + " A" + rx + " " + ry + " 0 0 0 " + (cx + rx) + " " + bot + '" fill="none" stroke="' + COL.line + '" stroke-width="2.5"/>';
      s += '<path d="M' + (cx - rx) + " " + bot + " A" + rx + " " + ry + " 0 0 1 " + (cx + rx) + " " + bot + '" fill="none" stroke="' + COL.mute + '" stroke-width="1.8" stroke-dasharray="5 5"/>';
    } else if (kind === "cone") {
      s += '<path d="M' + cx + " " + (top - 8) + " L" + (cx - rx) + " " + bot + " A" + rx + " " + ry + " 0 0 0 " + (cx + rx) + " " + bot + ' Z" fill="' + (o.fill || COL.fill2) + '" stroke="' + COL.line + '" stroke-width="2.5" stroke-linejoin="round"/>';
      s += '<path d="M' + (cx - rx) + " " + bot + " A" + rx + " " + ry + " 0 0 1 " + (cx + rx) + " " + bot + '" fill="none" stroke="' + COL.mute + '" stroke-width="1.8" stroke-dasharray="5 5"/>';
      if (o.height) s += L([cx, top - 8], [cx, bot], { color: COL.org, dash: "5 4", w: 2 }) + rightMark([cx, bot], [cx, top], [cx + rx, bot], 9);
    } else {
      const r = Math.min(W, H) / 2 - 14;
      s += '<defs><radialGradient id="gb" cx="38%" cy="35%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="' + (o.fill || "#74c0fc") + '"/></radialGradient></defs><circle cx="' + cx + '" cy="' + H / 2 + '" r="' + r + '" fill="url(#gb)" stroke="' + COL.line + '" stroke-width="2.5"/>';
      s += '<path d="M' + (cx - r) + " " + H / 2 + " A" + r + " " + r * 0.3 + " 0 0 0 " + (cx + r) + " " + H / 2 + '" fill="none" stroke="' + COL.line + '" stroke-width="1.5"/><path d="M' + (cx - r) + " " + H / 2 + " A" + r + " " + r * 0.3 + " 0 0 1 " + (cx + r) + " " + H / 2 + '" fill="none" stroke="' + COL.mute + '" stroke-width="1.3" stroke-dasharray="4 4"/>';
    }
    return fig(W, H, s);
  }
  // 立体の数（面・辺・頂点）
  FG.SOLID_COUNT = { "立方体": [6, 12, 8], "直方体": [6, 12, 8], "三角柱": [5, 9, 6], "五角柱": [7, 15, 10], "六角柱": [8, 18, 12], "三角すい": [4, 6, 4], "四角すい": [5, 8, 5] };

  // ========== 立方体の展開図（ころがして面を決める：正しい展開図かどうかも判定できる） ==========
  // cells: [[x,y]...]（6こ）。返り値：各マスが立方体のどの面か（"B","T","N","S","E","W"）。重なれば null
  FG.foldCube = function (cells) {
    const key = (c) => c[0] + "," + c[1], set = new Map(cells.map((c, i) => [key(c), i]));
    const face = Array(cells.length).fill(null); face[0] = { B: "B", T: "T", N: "N", S: "S", E: "E", W: "W" };
    const q = [0];
    const roll = (st, dir) => { const s = Object.assign({}, st); if (dir === "E") { s.B = st.E; s.E = st.T; s.T = st.W; s.W = st.B; } if (dir === "W") { s.B = st.W; s.W = st.T; s.T = st.E; s.E = st.B; } if (dir === "N") { s.B = st.N; s.N = st.T; s.T = st.S; s.S = st.B; } if (dir === "S") { s.B = st.S; s.S = st.T; s.T = st.N; s.N = st.B; } return s; };
    while (q.length) { const i = q.shift(), [x, y] = cells[i]; for (const [dx, dy, dir] of [[1, 0, "E"], [-1, 0, "W"], [0, -1, "N"], [0, 1, "S"]]) { const j = set.get(x + dx + "," + (y + dy)); if (j != null && !face[j]) { face[j] = roll(face[i], dir); q.push(j); } } }
    if (face.some((f) => !f)) return null;
    const b = face.map((f) => f.B); return new Set(b).size === 6 ? b : null;
  };
  const OPP = { B: "T", T: "B", N: "S", S: "N", E: "W", W: "E" };
  FG.cubeOpp = OPP;
  // ランダムな6マスのつながった形
  FG.hexomino = function () {
    for (;;) { const cells = [[0, 0]], has = new Set(["0,0"]); while (cells.length < 6) { const [x, y] = pick(cells), [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); const k = x + dx + "," + (y + dy); if (!has.has(k)) { has.add(k); cells.push([x + dx, y + dy]); } }
      const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1])); const cc = cells.map(([x, y]) => [x - mx, y - my]);
      if (Math.max(...cc.map((c) => c[0])) <= 4 && Math.max(...cc.map((c) => c[1])) <= 3) return cc; }
  };
  FG.netFig = function (cells, labels, o = {}) {
    const c = o.c || 34, nx = Math.max(...cells.map((x) => x[0])) + 1, ny = Math.max(...cells.map((x) => x[1])) + 1, W = nx * c + 24, H = ny * c + 24;
    let s = ""; const cols = ["#ffd8a8", "#d0ebff", "#d3f9d8", "#f3d9fa", "#fff3bf", "#ffe3e3"];
    cells.forEach(([x, y], i) => { s += '<rect x="' + (12 + x * c) + '" y="' + (12 + y * c) + '" width="' + c + '" height="' + c + '" fill="' + (o.hi === i ? "#ff8787" : o.mono ? "#e7f5ff" : cols[i % 6]) + '" stroke="' + COL.line + '" stroke-width="2.2"/>'; if (labels && labels[i]) s += T(12 + x * c + c / 2, 12 + y * c + c / 2 + 1, labels[i], { size: 15, bold: true }); });
    return fig(W, H, s);
  };
  // 立体の展開図（三角柱・円柱・円すい・四角すい・直方体）
  FG.solidNet = function (kind) {
    let s = "", W = 230, H = 170;
    const st = { fill: COL.fill, w: 2.2 };
    if (kind === "円柱") { s += '<rect x="65" y="55" width="100.5" height="60" fill="' + COL.fill + '" stroke="' + COL.line + '" stroke-width="2.2"/><circle cx="115" cy="39" r="16" fill="' + COL.fill2 + '" stroke="' + COL.line + '" stroke-width="2.2"/><circle cx="115" cy="131" r="16" fill="' + COL.fill2 + '" stroke="' + COL.line + '" stroke-width="2.2"/>'; H = 156; }
    else if (kind === "円すい") { const ax = 115, ay = 14, l = 90, a0 = Math.PI / 2 - Math.PI / 3, a1 = Math.PI / 2 + Math.PI / 3; s += '<path d="M' + ax + " " + ay + " L" + f1(ax + l * Math.cos(a0)) + " " + f1(ay + l * Math.sin(a0)) + " A" + l + " " + l + " 0 0 1 " + f1(ax + l * Math.cos(a1)) + " " + f1(ay + l * Math.sin(a1)) + ' Z" fill="' + COL.fill2 + '" stroke="' + COL.line + '" stroke-width="2.2" stroke-linejoin="round"/><circle cx="' + ax + '" cy="' + (ay + l + 30) + '" r="30" fill="' + COL.fill + '" stroke="' + COL.line + '" stroke-width="2.2"/>'; H = ay + l + 66; }
    else if (kind === "三角柱") { [0, 1, 2].forEach((k) => { s += PG([[45 + k * 46, 55], [91 + k * 46, 55], [91 + k * 46, 115], [45 + k * 46, 115]], st); }); s += PG([[91, 55], [137, 55], [114, 15]], { fill: COL.fill2, w: 2.2 }) + PG([[91, 115], [137, 115], [114, 155]], { fill: COL.fill2, w: 2.2 }); }
    else if (kind === "四角すい") { s += PG([[90, 60], [140, 60], [140, 110], [90, 110]], { fill: COL.fill2, w: 2.2 }); s += PG([[90, 60], [140, 60], [115, 15]], st) + PG([[90, 110], [140, 110], [115, 155]], st) + PG([[90, 60], [90, 110], [45, 85]], st) + PG([[140, 60], [140, 110], [185, 85]], st); }
    else if (kind === "三角すい") { const A = [35, 155], B = [195, 155], C = [115, 155 - 160 * Math.sqrt(3) / 2], ab = mul(add(A, B), 0.5), bc = mul(add(B, C), 0.5), ca = mul(add(C, A), 0.5); s += PG([A, ab, ca], st) + PG([ab, B, bc], st) + PG([ca, bc, C], st) + PG([ab, bc, ca], { fill: COL.fill2, w: 2.2 }); }
    else if (kind === "直方体") { const c = [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], w = [40, 50, 40, 50], hh = [40, 44, 40]; let xs = [12], ys = [12]; w.forEach((v) => xs.push(xs[xs.length - 1] + v)); hh.forEach((v) => ys.push(ys[ys.length - 1] + v)); c.forEach(([x, y]) => { s += PG([[xs[x], ys[y]], [xs[x + 1], ys[y]], [xs[x + 1], ys[y + 1]], [xs[x], ys[y + 1]]], { fill: y === 1 ? COL.fill : COL.fill2, w: 2.2 }); }); W = xs[4] + 12; H = ys[3] + 12; }
    return fig(W, H, s);
  };
  FG.NET_KINDS = ["円柱", "円すい", "三角柱", "四角すい", "三角すい", "直方体"];

  // ========== はかる道具 ==========
  // ものさし：mm（0から len まで赤い帯）
  FG.ruler = function (mm, o = {}) {
    const maxCm = o.maxCm || Math.max(5, Math.ceil(mm / 10) + 1), px = o.px || Math.min(9, 280 / (maxCm * 10)), W = maxCm * 10 * px + 30, H = 78, x0 = 15, y0 = 44;
    let s = '<rect x="' + (x0 - 8) + '" y="' + (y0 - 6) + '" width="' + (maxCm * 10 * px + 16) + '" height="34" rx="4" fill="#fff3bf" stroke="#b08900" stroke-width="1.5"/>';
    for (let k = 0; k <= maxCm * 10; k++) { const x = x0 + k * px, h = k % 10 === 0 ? 14 : k % 5 === 0 ? 10 : 6; s += L([x, y0 - 6], [x, y0 - 6 + h], { w: k % 10 ? 1 : 1.5, color: "#5c4b00" }); if (k % 10 === 0) s += T(x, y0 + 18, String(k / 10), { size: 11, color: "#5c4b00" }); }
    s += '<rect x="' + x0 + '" y="' + (y0 - 30) + '" width="' + f1(mm * px) + '" height="12" rx="3" fill="' + (o.color || "#4dabf7") + '" stroke="' + COL.line + '" stroke-width="1.5"/>';
    s += T(x0 + maxCm * 10 * px - 4, y0 + 18, "cm", { size: 10, anchor: "end", color: "#5c4b00" });
    return fig(W, H, s);
  };
  // 分度器で角をはかる
  FG.protractor = function (deg) {
    const W = 240, H = 140, cx = 120, cy = 120, r = 100;
    let s = '<path d="M' + (cx - r) + " " + cy + " A" + r + " " + r + " 0 0 1 " + (cx + r) + " " + cy + ' Z" fill="rgba(208,235,255,.6)" stroke="#1971c2" stroke-width="1.5"/>';
    for (let k = 0; k <= 180; k++) { const a = Math.PI - (k * Math.PI) / 180, l = k % 10 === 0 ? 12 : k % 5 === 0 ? 8 : 4; s += L([cx + r * Math.cos(a), cy - r * Math.sin(a)], [cx + (r - l) * Math.cos(a), cy - (r - l) * Math.sin(a)], { w: k % 10 ? 0.8 : 1.3, color: "#1864ab" }); if (k % 30 === 0) s += T(cx + (r - 22) * Math.cos(a), cy - (r - 22) * Math.sin(a), String(k), { size: 10, color: "#1864ab" }); }
    const a = Math.PI - (deg * Math.PI) / 180;
    s += L([cx, cy], [cx - r - 8, cy], { w: 3 }) + L([cx, cy], [cx + (r + 10) * Math.cos(a), cy - (r + 10) * Math.sin(a)], { w: 3, color: COL.red }) + '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="' + COL.line + '"/>';
    return fig(W, H, s);
  };
  // めもりを読む（はかり）：最大 max g、1めもり step g、針 v
  FG.scaleDial = function (v, max, step) {
    const W = 200, H = 200, cx = 100, cy = 104, r = 80; let s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 10) + '" fill="#fff" stroke="#495057" stroke-width="4"/>';
    const n = max / step; for (let k = 0; k < n; k++) { const a = (k / n) * 2 * Math.PI, big = (k * step) % (max / 10 >= step ? max / 10 : step * 5) === 0; s += L([cx + Math.sin(a) * r, cy - Math.cos(a) * r], [cx + Math.sin(a) * (r - (big ? 12 : 6)), cy - Math.cos(a) * (r - (big ? 12 : 6))], { w: big ? 2 : 1, color: "#343a40" }); }
    for (let k = 0; k < 10; k++) { const a = (k / 10) * 2 * Math.PI, val = (max / 10) * k; s += T(cx + Math.sin(a) * (r - 24), cy - Math.cos(a) * (r - 24), String(val), { size: 10 }); }
    const a = (v / max) * 2 * Math.PI; s += L([cx, cy], [cx + Math.sin(a) * (r - 6), cy - Math.cos(a) * (r - 6)], { color: COL.red, w: 3 }) + '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="' + COL.red + '"/>';
    s += T(cx, cy + 30, max >= 1000 ? "（はかり " + max / 1000 + "kg）" : "（はかり " + max + "g）", { size: 10, color: COL.mute });
    return fig(W, H, s);
  };
  // 水のかさ（1dLますが n こ・あとはめもり）
  FG.dlCups = function (whole, tenths) {
    const n = whole + (tenths ? 1 : 0), W = Math.max(120, n * 52 + 20), H = 120; let s = "";
    for (let i = 0; i < n; i++) { const x = 14 + i * 52, lvl = i < whole ? 10 : tenths; s += '<rect x="' + x + '" y="' + (20 + (10 - lvl) * 8) + '" width="40" height="' + lvl * 8 + '" fill="#74c0fc"/><rect x="' + x + '" y="20" width="40" height="80" fill="none" stroke="' + COL.line + '" stroke-width="2"/>'; for (let k = 1; k < 10; k++) s += L([x, 20 + k * 8], [x + (k === 5 ? 14 : 8), 20 + k * 8], { w: 1 }); s += T(x + 20, 112, "1dL", { size: 10 }); }
    return fig(W, H, s);
  };
  // 温度計（℃）
  FG.thermo = function (t, lo = -10, hi = 40) {
    const W = 110, H = 230, y = (v) => 200 - ((v - lo) / (hi - lo)) * 180;
    let s = '<rect x="44" y="12" width="18" height="196" rx="9" fill="#fff" stroke="#495057" stroke-width="2"/><circle cx="53" cy="212" r="13" fill="#e03131"/>';
    for (let v = lo; v <= hi; v++) { const big = v % 10 === 0, mid = v % 5 === 0; s += L([62, y(v)], [62 + (big ? 14 : mid ? 10 : 6), y(v)], { w: big ? 1.6 : 0.9 }); if (big) s += T(92, y(v), String(v), { size: 11 }); }
    s += '<rect x="49" y="' + f1(y(t)) + '" width="8" height="' + f1(212 - y(t)) + '" fill="#e03131"/>';
    s += T(92, 8, "℃", { size: 11 });
    return fig(W, H, s);
  };

  // ========== グラフ ==========
  FG.lineGraph = function (labels, vals, step, unitT, o = {}) {
    const n = labels.length, W = Math.max(240, 50 + n * 24), H = 180, x0 = 40, y0 = 150, h = 130, top = Math.ceil(Math.max(...vals) / step) * step, bot = o.min != null ? o.min : 0;
    const X = (i) => x0 + 14 + i * ((W - x0 - 24) / Math.max(1, n - 1)), Y = (v) => y0 - ((v - bot) / (top - bot)) * h;
    let s = "";
    for (let v = bot; v <= top; v += step) { s += L([x0, Y(v)], [W - 6, Y(v)], { color: COL.grid, w: 1 }) + T(x0 - 5, Y(v), String(v), { size: 10, anchor: "end" }); }
    s += L([x0, y0], [x0, y0 - h - 4], { w: 1.5 }) + L([x0, y0], [W - 6, y0], { w: 1.5 });
    s += '<polyline points="' + vals.map((v, i) => f1(X(i)) + "," + f1(Y(v))).join(" ") + '" fill="none" stroke="' + COL.red + '" stroke-width="2.5"/>';
    vals.forEach((v, i) => { s += '<circle cx="' + f1(X(i)) + '" cy="' + f1(Y(v)) + '" r="3.5" fill="' + COL.red + '"/>' + T(X(i), y0 + 13, labels[i], { size: 10 }); });
    s += T(6, 10, "(" + unitT + ")", { size: 10, anchor: "start" });
    return fig(W, H + 6, s);
  };
  FG.pieChart = function (parts, o = {}) {
    // parts: [[名前, ％]]（合計100）
    const W = 230, H = 190, cx = 100, cy = 95, r = 80, cols = ["#ff8787", "#74c0fc", "#69db7c", "#ffd43b", "#b197fc", "#ced4da"];
    let s = "", a = -Math.PI / 2;
    parts.forEach(([nm, p], i) => { const a2 = a + (p / 100) * 2 * Math.PI; s += '<path d="M' + cx + " " + cy + " L" + f1(cx + r * Math.cos(a)) + " " + f1(cy + r * Math.sin(a)) + " A" + r + " " + r + " 0 " + (a2 - a > Math.PI ? 1 : 0) + " 1 " + f1(cx + r * Math.cos(a2)) + " " + f1(cy + r * Math.sin(a2)) + ' Z" fill="' + cols[i % 6] + '" stroke="#fff" stroke-width="2"/>'; const am = (a + a2) / 2; s += T(cx + r * 0.62 * Math.cos(am), cy + r * 0.62 * Math.sin(am), nm, { size: 11, bold: true }); if (!o.hideP) s += T(cx + r * 0.62 * Math.cos(am), cy + r * 0.62 * Math.sin(am) + 13, p + "％", { size: 10 }); a = a2; });
    for (let k = 0; k < 100; k += 5) { const t = -Math.PI / 2 + (k / 100) * 2 * Math.PI; s += L([cx + r * Math.cos(t), cy + r * Math.sin(t)], [cx + (r + (k % 10 ? 4 : 7)) * Math.cos(t), cy + (r + (k % 10 ? 4 : 7)) * Math.sin(t)], { w: 1 }); }
    return fig(W, H, s);
  };
  // 座標平面（点・直線）
  FG.coord = function (o = {}) {
    const n = o.n || 5, c = o.c || 18, W = (2 * n + 1) * c + 20, H = W, O = [W / 2, H / 2];
    const P = (x, y) => [O[0] + x * c, O[1] - y * c];
    let s = "";
    for (let k = -n; k <= n; k++) { s += L(P(k, -n), P(k, n), { color: COL.grid, w: 1 }) + L(P(-n, k), P(n, k), { color: COL.grid, w: 1 }); }
    s += L(P(-n - 0.4, 0), P(n + 0.4, 0), { w: 1.6 }) + L(P(0, -n - 0.4), P(0, n + 0.4), { w: 1.6 }) + T(P(n + 0.2, 0)[0], P(n, 0)[1] + 12, "x", { size: 12 }) + T(P(0, n)[0] + 10, P(0, n + 0.2)[1], "y", { size: 12 }) + T(O[0] - 8, O[1] + 10, "O", { size: 11 });
    for (let k = -n; k <= n; k += 1) if (k && k % (o.labStep || 1) === 0) { s += T(P(k, 0)[0], O[1] + 10, String(k), { size: 8, color: COL.mute }) + T(O[0] - 8, P(0, k)[1], String(k), { size: 8, color: COL.mute }); }
    (o.lines || []).forEach(([a, b, col]) => { const x1 = -n, x2 = n; s += '<clipPath id="cp"><rect x="' + P(-n, n)[0] + '" y="' + P(-n, n)[1] + '" width="' + 2 * n * c + '" height="' + 2 * n * c + '"/></clipPath><g clip-path="url(#cp)">' + L(P(x1, a * x1 + b), P(x2, a * x2 + b), { color: col || COL.blue, w: 2.5 }) + "</g>"; });
    (o.curves || []).forEach(([fn, col]) => { const segs = [[]]; for (let x = -n; x <= n + 1e-9; x += 0.05) { const y = fn(x); if (Number.isFinite(y) && Math.abs(y) <= n + 0.3) segs[segs.length - 1].push(P(x, y)); else if (segs[segs.length - 1].length) segs.push([]); } segs.filter((g) => g.length > 1).forEach((pts) => { s += '<polyline points="' + pts.map((p) => f1(p[0]) + "," + f1(p[1])).join(" ") + '" fill="none" stroke="' + (col || COL.red) + '" stroke-width="2.5"/>'; }); });
    (o.pts || []).forEach(([x, y, lab]) => { const p = P(x, y); s += '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="4" fill="' + COL.red + '"/>' + (lab ? T(p[0] + 9, p[1] - 9, lab, { size: 12, bold: true, color: COL.red }) : ""); });
    return fig(W, H, s);
  };
  // 数のカード・ブロック（10のたば・1のばら）
  FG.blocks = function (tens, ones, o = {}) {
    let s = "", x = 10; const H = 120;
    for (let i = 0; i < tens; i++) { for (let k = 0; k < 10; k++) s += '<rect x="' + x + '" y="' + (10 + k * 10) + '" width="12" height="10" fill="#4dabf7" stroke="#1864ab" stroke-width="1"/>'; x += 18; }
    x += 6; for (let i = 0; i < ones; i++) { s += '<rect x="' + (x + (i % 5) * 14) + '" y="' + (90 - Math.floor(i / 5) * 14) + '" width="12" height="12" fill="#ffa94d" stroke="#d9480f" stroke-width="1"/>'; }
    x += Math.min(ones, 5) * 14 + 10; void o;
    return fig(Math.max(120, x), H, s);
  };
})(typeof window !== "undefined" ? window : globalThis);
