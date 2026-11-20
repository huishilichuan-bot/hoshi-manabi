/* ほしまなび 計算メモ（手書きキャンバス）
   算数・数学と、数字の出てくる理科の問題で使える。指・Apple Pencil で書ける。
   ペン4色・太さ3段階・消しゴム・元に戻す・全部消す。問題が変わると自動でクリア。
   ひらいている間は画面のスクロール・ズームを止める。 */
(function () {
  "use strict";
  const COLORS = [["#1f2933", "くろ"], ["#e03131", "あか"], ["#1c6fd8", "あお"], ["#2b9a3e", "みどり"]];
  const SIZES = [[2.5, "ほそい"], [5, "ふつう"], [10, "ふとい"]];
  const KEY = "hoshimanabi:memo";
  let pref = { c: 0, s: 1 };
  try { Object.assign(pref, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* 既定値 */ }
  let root, cv, ctx, fab, bar, open = false, erase = false, strokes = [], cur = null, penSeen = false, avail = false, dpr = 1;

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function build() {
    if (root) return;
    fab = el("button", "memo-fab", '<span class="mf-i">✏️</span><b>メモ</b>');
    fab.type = "button"; fab.setAttribute("aria-label", "計算メモをひらく"); fab.hidden = true;
    root = el("div", "memo-layer"); root.hidden = true; root.setAttribute("aria-label", "計算メモ");
    cv = el("canvas", "memo-cv"); ctx = cv.getContext("2d");
    bar = el("div", "memo-bar");
    bar.innerHTML =
      '<div class="mb-g">' + COLORS.map((c, i) => '<button type="button" class="mb-c" data-mc="' + i + '" style="--mc:' + c[0] + '" aria-label="' + c[1] + '"></button>').join("") + "</div>" +
      '<div class="mb-g">' + SIZES.map((s, i) => '<button type="button" class="mb-s" data-ms="' + i + '" aria-label="' + s[1] + '"><i style="--sz:' + (s[0] + 3) + 'px"></i></button>').join("") + "</div>" +
      '<div class="mb-g"><button type="button" class="mb-t" data-mt="erase" aria-label="消しゴム"><span>🧽</span><small>消しゴム</small></button>' +
      '<button type="button" class="mb-t" data-mt="undo" aria-label="元に戻す"><span>↩︎</span><small>戻す</small></button>' +
      '<button type="button" class="mb-t" data-mt="clear" aria-label="全部消す"><span>🗑️</span><small>全部消す</small></button>' +
      '<button type="button" class="mb-t mb-close" data-mt="close" aria-label="メモをとじる"><span>✕</span><small>とじる</small></button></div>';
    root.appendChild(cv); root.appendChild(bar);
    document.body.appendChild(root); document.body.appendChild(fab);
    fab.addEventListener("click", () => (open ? close() : show()));
    bar.addEventListener("click", onBar);
    cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("lostpointercapture", up);
    // スクロール・ピンチズーム・ダブルタップズームを止める
    const stop = (e) => { if (open) e.preventDefault(); };
    root.addEventListener("touchstart", (e) => { if (open && e.target === cv) e.preventDefault(); }, { passive: false });
    root.addEventListener("touchmove", stop, { passive: false });
    ["gesturestart", "gesturechange", "gestureend"].forEach((t) => document.addEventListener(t, stop, { passive: false }));
    document.addEventListener("touchmove", (e) => { if (open && e.touches.length > 1) e.preventDefault(); }, { passive: false });
    window.addEventListener("resize", () => { if (open) { size(); redraw(); } });
    syncBar();
  }
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + "px"; cv.style.height = h + "px";
  }
  function syncBar() {
    bar.querySelectorAll("[data-mc]").forEach((b) => b.classList.toggle("on", !erase && +b.dataset.mc === pref.c));
    bar.querySelectorAll("[data-ms]").forEach((b) => b.classList.toggle("on", +b.dataset.ms === pref.s));
    bar.querySelector('[data-mt="erase"]').classList.toggle("on", erase);
    bar.querySelector('[data-mt="undo"]').disabled = !strokes.length;
    bar.querySelector('[data-mt="clear"]').disabled = !strokes.length;
    fab.classList.toggle("has", strokes.length > 0);
  }
  function savePref() { try { localStorage.setItem(KEY, JSON.stringify(pref)); } catch (e) { /* 保存できなくても使える */ } }
  function onBar(e) {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mc != null) { pref.c = +b.dataset.mc; erase = false; savePref(); }
    else if (b.dataset.ms != null) { pref.s = +b.dataset.ms; savePref(); }
    else if (b.dataset.mt === "erase") erase = !erase;
    else if (b.dataset.mt === "undo") { strokes.pop(); redraw(); }
    else if (b.dataset.mt === "clear") { strokes = []; redraw(); }
    else if (b.dataset.mt === "close") { close(); return; }
    syncBar();
  }
  function down(e) {
    if (!open || cur) return;
    if (e.pointerType === "pen") penSeen = true;
    else if (penSeen && e.pointerType === "touch") return; // Apple Pencil を使っている間は手のひらを無視
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (x) { /* 古い端末 */ }
    cur = { id: e.pointerId, er: erase, c: COLORS[pref.c][0], w: erase ? SIZES[pref.s][0] * 4 + 10 : SIZES[pref.s][0], pen: e.pointerType === "pen", p: [] };
    strokes.push(cur); addPt(e); redraw();
  }
  function addPt(e) {
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    (list.length ? list : [e]).forEach((v) => cur.p.push([v.clientX, v.clientY, cur.pen && v.pressure ? v.pressure : 0.5]));
  }
  function move(e) { if (!cur || e.pointerId !== cur.id) return; e.preventDefault(); addPt(e); drawStroke(cur, Math.max(0, cur.p.length - 6)); }
  function up(e) { if (!cur || (e && e.pointerId !== cur.id)) return; cur = null; syncBar(); }
  function drawStroke(s, from) {
    const p = s.p; if (!p.length) return;
    ctx.save(); ctx.scale(dpr, dpr);
    ctx.globalCompositeOperation = s.er ? "destination-out" : "source-over";
    ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0][0], p[0][1], s.w / 2, 0, 7); ctx.fill(); ctx.restore(); return; }
    for (let i = Math.max(1, from); i < p.length; i++) {
      const a = p[i - 1], b = p[i], pr = s.pen ? 0.55 + b[2] * 0.9 : 1;
      ctx.lineWidth = s.w * pr;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    ctx.restore();
  }
  function redraw() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); strokes.forEach((s) => drawStroke(s, 1)); }
  function show() {
    if (!avail) return;
    build(); open = true; root.hidden = false; size(); redraw();
    document.body.classList.add("memo-open"); fab.classList.add("on"); fab.setAttribute("aria-label", "計算メモをとじる"); syncBar();
  }
  function close() {
    if (!root) return;
    open = false; cur = null; root.hidden = true;
    document.body.classList.remove("memo-open"); fab.classList.remove("on"); fab.setAttribute("aria-label", "計算メモをひらく"); syncBar();
  }
  function clear() { strokes = []; cur = null; if (ctx) redraw(); if (bar) syncBar(); }
  // 計算メモを出す問題：算数・数学はすべて、理科は数字が出てくる問題
  function needs(subj, q) {
    if (subj === "math") return true;
    if (subj !== "sci" || !q) return false;
    const t = String(q.q || "").replace(/<[^>]*>/g, "") + " " + (q.unit || "");
    return /[0-9０-９]/.test(t) || !!q.unit;
  }
  window.HMMemo = {
    needs,
    // 問題が表示されるたびによぶ：前の問題のメモを自動で消し、必要な問題だけボタンを出す
    onQuestion(subj, q) {
      build(); clear(); close(); avail = needs(subj, q); fab.hidden = !avail;
      // ボタンは問題の見出しの行（右はし）におく。見つからないときは画面の右上
      const meta = document.querySelector("#quiz .qz-meta");
      if (meta && avail) { meta.classList.add("has-memo"); meta.appendChild(fab); fab.classList.add("inline"); }
      else { document.body.appendChild(fab); fab.classList.remove("inline"); }
    },
    off() { if (!root) return; clear(); close(); avail = false; fab.hidden = true; },
    isOpen: () => open,
    count: () => strokes.length,
  };
})();
