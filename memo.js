/* ほしまなび 計算メモ v1.5.2
   問題文・答えの欄の下に、専用のメモ欄（白い方眼）を出す。問題文や図には重ならない。
   ・指／Apple Pencil で書ける。ペン4色・太さ3段階・消しゴム・元に戻す・全部消す
   ・下端の近くまで書くと自動で下に伸びる。「↓ 下に広げる」でいくらでも伸ばせる
   ・1本指で書いている間は画面が動かない。2本指か右の「つまみ」で上下にスクロール
   ・問題が変わると自動でクリア */
(function () {
  "use strict";
  const COLORS = [["#1f2933", "くろ"], ["#e03131", "あか"], ["#1c6fd8", "あお"], ["#2b9a3e", "みどり"]];
  const SIZES = [[2.5, "ほそい"], [5, "ふつう"], [10, "ふとい"]];
  const KEY = "hoshimanabi:memo";
  const GROW = 360, EDGE = 90, MAXPX = 16e6, MAXH = 40000;
  let pref = { c: 0, s: 1, closed: false };
  try { Object.assign(pref, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* 既定値 */ }
  let panel = null, paper, cv, ctx, fab, head, scroller, ro;
  let erase = false, strokes = [], cur = null, penSeen = false, dpr = 1, W = 0, Hh = 0, two = null;
  const savePref = () => { try { localStorage.setItem(KEY, JSON.stringify(pref)); } catch (e) { /* 保存できなくても使える */ } };
  const startH = () => Math.max(480, Math.round(window.innerHeight * 0.65));

  function html() {
    return '<div class="memo-head"><div class="mh-t"><span>✏️ 計算メモ <small>2本指か右のつまみでスクロール</small></span><button type="button" class="mh-toggle" data-mt="toggle"></button></div>' +
      '<div class="mh-tools"><div class="mb-g">' + COLORS.map((c, i) => '<button type="button" class="mb-c" data-mc="' + i + '" style="--mc:' + c[0] + '" aria-label="' + c[1] + '"></button>').join("") + "</div>" +
      '<div class="mb-g">' + SIZES.map((s, i) => '<button type="button" class="mb-s" data-ms="' + i + '" aria-label="' + s[1] + '"><i style="--sz:' + (s[0] + 3) + 'px"></i></button>').join("") + "</div>" +
      '<div class="mb-g"><button type="button" class="mb-t" data-mt="erase" aria-label="消しゴム"><span>🧽</span><small>消しゴム</small></button>' +
      '<button type="button" class="mb-t" data-mt="undo" aria-label="元に戻す"><span>↩︎</span><small>戻す</small></button>' +
      '<button type="button" class="mb-t" data-mt="clear" aria-label="全部消す"><span>🗑️</span><small>全部消す</small></button></div></div></div>' +
      '<div class="memo-body"><div class="memo-paper"><canvas class="memo-cv"></canvas></div><div class="memo-grip" aria-label="スクロール用のつまみ"><span>スクロール ↕</span></div></div>' +
      '<button type="button" class="memo-more" data-mt="more">↓ 下に広げる</button>';
  }
  function setSize(h) {
    const w = paper.clientWidth; if (!w) return;
    W = w; Hh = Math.min(MAXH, Math.max(h, 100));
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(MAXPX / (W * Hh))));
    cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
    cv.style.width = W + "px"; cv.style.height = Hh + "px";
    redraw();
  }
  function grow(px) { if (Hh < MAXH) setSize(Hh + px); }
  function syncBar() {
    if (!panel) return;
    head.querySelectorAll("[data-mc]").forEach((b) => b.classList.toggle("on", !erase && +b.dataset.mc === pref.c));
    head.querySelectorAll("[data-ms]").forEach((b) => b.classList.toggle("on", +b.dataset.ms === pref.s));
    head.querySelector('[data-mt="erase"]').classList.toggle("on", erase);
    head.querySelector('[data-mt="undo"]').disabled = !strokes.length;
    head.querySelector('[data-mt="clear"]').disabled = !strokes.length;
    head.querySelector('[data-mt="toggle"]').textContent = pref.closed ? "▼ ひらく" : "▲ とじる";
    panel.classList.toggle("closed", !!pref.closed);
    if (fab) fab.classList.toggle("has", strokes.length > 0);
  }
  function onClick(e) {
    const b = e.target.closest("button"); if (!b || !panel.contains(b)) return;
    if (b.dataset.mc != null) { pref.c = +b.dataset.mc; erase = false; savePref(); }
    else if (b.dataset.ms != null) { pref.s = +b.dataset.ms; savePref(); }
    else if (b.dataset.mt === "erase") erase = !erase;
    else if (b.dataset.mt === "undo") { strokes.pop(); redraw(); }
    else if (b.dataset.mt === "clear") { strokes = []; redraw(); }
    else if (b.dataset.mt === "more") grow(GROW + 40);
    else if (b.dataset.mt === "toggle") { pref.closed = !pref.closed; savePref(); if (!pref.closed) setTimeout(() => setSize(Hh || startH()), 0); }
    syncBar();
  }
  // 座標（画面の拡大設定 zoom にも合わせる）
  function pt(e) { const r = cv.getBoundingClientRect(), k = r.width ? cv.clientWidth / r.width : 1; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; }
  function down(e) {
    if (cur || two) return;
    if (e.pointerType === "pen") penSeen = true;
    else if (penSeen && e.pointerType === "touch") return; // Apple Pencil を使っている間は手のひらを無視
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (x) { /* 古い端末 */ }
    cur = { id: e.pointerId, er: erase, c: COLORS[pref.c][0], w: erase ? SIZES[pref.s][0] * 4 + 10 : SIZES[pref.s][0], pen: e.pointerType === "pen", p: [], t0: performance.now() };
    strokes.push(cur); addPt(e); drawStroke(cur, 0);
  }
  function addPt(e) {
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    (list.length ? list : [e]).forEach((v) => { const p = pt(v); cur.p.push([p[0], p[1], cur.pen && v.pressure ? v.pressure : 0.5]); });
  }
  function move(e) {
    if (!cur || e.pointerId !== cur.id) return;
    e.preventDefault(); addPt(e); drawStroke(cur, Math.max(1, cur.p.length - 6));
    const y = cur.p[cur.p.length - 1][1];
    if (y > Hh - EDGE && Hh < MAXH) grow(GROW); // 下端の近くまで書いたら自動で伸ばす
  }
  function up(e) { if (!cur || (e && e.pointerId !== cur.id)) return; cur = null; syncBar(); }
  // 2本指：書きかけの線をとりけしてスクロール
  function tStart(e) {
    if (e.touches.length >= 2) {
      e.preventDefault();
      if (cur && performance.now() - cur.t0 < 400) { strokes.splice(strokes.indexOf(cur), 1); redraw(); }
      cur = null; two = { y: mid(e) }; syncBar();
    }
  }
  const mid = (e) => (e.touches[0].clientY + e.touches[1].clientY) / 2;
  function tMove(e) {
    if (two && e.touches.length >= 2) { e.preventDefault(); const y = mid(e); if (scroller) scroller.scrollTop -= y - two.y; else window.scrollBy(0, two.y - y); two.y = y; }
    else if (cur || two) e.preventDefault();
  }
  function tEnd(e) { if (two && e.touches.length === 0) two = null; }
  function drawStroke(s, from) {
    const p = s.p; if (!p.length) return;
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = s.er ? "destination-out" : "source-over";
    ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0][0], p[0][1], s.w / 2, 0, 7); ctx.fill(); ctx.restore(); return; }
    for (let i = Math.max(1, from); i < p.length; i++) {
      const a = p[i - 1], b = p[i];
      ctx.lineWidth = s.w * (s.pen ? 0.55 + b[2] * 0.9 : 1);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    ctx.restore();
  }
  function redraw() { if (!ctx) return; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); strokes.forEach((s) => drawStroke(s, 1)); }
  function mount(host, after) {
    panel = document.createElement("section"); panel.className = "memo-panel"; panel.setAttribute("aria-label", "計算メモ");
    panel.innerHTML = html();
    if (after && after.parentNode === host) host.insertBefore(panel, after.nextSibling); else host.appendChild(panel);
    head = panel.querySelector(".memo-head"); paper = panel.querySelector(".memo-paper"); cv = panel.querySelector(".memo-cv"); ctx = cv.getContext("2d");
    scroller = panel.closest("#quiz") || null;
    panel.addEventListener("click", onClick);
    cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("lostpointercapture", up);
    paper.addEventListener("touchstart", tStart, { passive: false });
    paper.addEventListener("touchmove", tMove, { passive: false });
    paper.addEventListener("touchend", tEnd); paper.addEventListener("touchcancel", tEnd);
    // メモ欄の中ではピンチズームしない
    ["gesturestart", "gesturechange"].forEach((t) => paper.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
    if (ro) ro.disconnect();
    if (window.ResizeObserver) { ro = new ResizeObserver(() => { if (paper.isConnected && paper.clientWidth && paper.clientWidth !== W) setSize(Hh || startH()); }); ro.observe(paper); }
    setSize(startH()); syncBar();
  }
  // 計算メモを出す問題：算数・数学はすべて、理科は数字が出てくる問題
  function needs(subj, q) {
    if (subj === "math") return true;
    if (subj !== "sci" || !q) return false;
    const t = String(q.q || "").replace(/<[^>]*>/g, "") + " " + (q.unit || "");
    return /[0-9０-９]/.test(t) || !!q.unit;
  }
  window.HMMemo = {
    needs,
    // 問題が表示されるたびによぶ：前の問題のメモは自動で消え、必要な問題だけメモ欄を出す
    onQuestion(subj, q) {
      strokes = []; cur = null; two = null; erase = false; panel = null; ctx = null; fab = null; W = 0; Hh = 0;
      if (ro) { ro.disconnect(); ro = null; }
      if (!needs(subj, q)) return;
      const quiz = document.getElementById("quiz"); if (!quiz) return;
      const foot = quiz.querySelector("#qz-foot");
      mount(foot ? foot.parentNode : quiz, foot);
      const meta = quiz.querySelector(".qz-meta");
      if (meta) {
        fab = document.createElement("button"); fab.type = "button"; fab.className = "memo-fab"; fab.innerHTML = "✏️ メモ"; fab.setAttribute("aria-label", "計算メモ欄へ");
        meta.classList.add("has-memo"); meta.appendChild(fab);
        fab.addEventListener("click", () => { if (pref.closed) { pref.closed = false; savePref(); syncBar(); setSize(Hh || startH()); } panel.scrollIntoView({ behavior: "smooth", block: "start" }); });
      }
      syncBar();
    },
    off() { strokes = []; cur = null; panel = null; if (ro) { ro.disconnect(); ro = null; } },
    count: () => strokes.length,
    height: () => Hh,
    panel: () => panel,
  };
})();
