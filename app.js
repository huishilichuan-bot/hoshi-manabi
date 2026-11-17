/* ほしまなび — 勉強して⭐を集める学習アプリ（小1〜中3）。課金・お金の機能はありません。 */
(() => {
  "use strict";
  const VERSION = "1.0.1";
  const KEY = "hoshimanabi";
  const SCHEMA = 1;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const now = () => Date.now();
  // テスト用に時計をずらせる（?clock=ミリ秒 のときだけ）
  let clockOffset = 0;
  const today = () => dkey(now() + clockOffset);
  const pad = (n) => String(n).padStart(2, "0");
  function dkey(t) { const d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  // ---------- 定数 ----------
  const SUBJ = [
    { id: "math", n: "算数・数学", e: "🔢", c: "#2f7fd8" },
    { id: "ja", n: "国語", e: "📖", c: "#d9534f" },
    { id: "life", n: "生活", e: "🌱", c: "#4caf50" },
    { id: "sci", n: "理科", e: "🔬", c: "#8a5cd6" },
    { id: "soc", n: "社会", e: "🗾", c: "#e08a12" },
    { id: "en", n: "英語", e: "🔤", c: "#1f9a82" },
  ];
  const subjById = (id) => SUBJ.find((s) => s.id === id);
  const gradeName = (g) => (g <= 6 ? "小" + g : "中" + (g - 6));
  const subjName = (s, g) => (s === "math" ? (g <= 6 ? "算数" : "数学") : subjById(s).n);
  const STARS_TO_UNLOCK = 4;
  const STEP_MIN = 7;
  const READ_MS = 2000;
  const GACHA_RATES = [40, 30, 15, 8.5, 4, 2, 0.5];
  const GACHA_RATES_SR = (() => { const t = GACHA_RATES.slice(2).reduce((a, b) => a + b, 0); return GACHA_RATES.map((r, i) => (i >= 2 ? (r / t) * 100 : 0)); })();
  const SHARD_DUP = [1, 1, 2, 2, 3, 4, 5];
  const STAR_COST = [3, 5, 8, 12, 20]; // ★1〜★5 に必要なかけら
  const DIFFS = [{ id: "easy", name: "弱い" }, { id: "normal", name: "中" }, { id: "hard", name: "強い" }, { id: "ultra", name: "ウルトラ最強" }];
  const DIFF_DESC = { easy: "はじめての人向け", normal: "ちょうどいい", hard: "手ごたえあり", ultra: "本気のCPU" };
  const BGS = [
    { id: "note", n: "ノート", r: -1 }, { id: "sky", n: "青空", r: 1 }, { id: "sunset", n: "夕やけ", r: 2 }, { id: "night", n: "星空", r: 3 },
    { id: "aurora", n: "オーロラ", r: 4 }, { id: "gold", n: "黄金", r: 5 }, { id: "cosmos", n: "にじの宇宙", r: 6 },
  ];
  const MARUS = [
    { id: "red", n: "赤い⭕", r: -1 }, { id: "blue", n: "青い⭕", r: 1 }, { id: "star", n: "星つき⭕", r: 2 }, { id: "hanamaru", n: "花まる", r: 3 },
    { id: "rainbow", n: "にじ⭕", r: 4 }, { id: "gold", n: "金の⭕", r: 5 }, { id: "myth", n: "神話の⭕", r: 6 },
  ];
  const TITLES = [
    { id: "first", n: "はじめの一歩", ok: () => true, how: "最初から" },
    { id: "s10", n: "がんばり屋", ok: (c) => c.total >= 10, how: "⭐を合計10こ" },
    { id: "s50", n: "努力家", ok: (c) => c.total >= 50, how: "⭐を合計50こ" },
    { id: "s100", n: "学びの達人", ok: (c) => c.total >= 100, how: "⭐を合計100こ" },
    { id: "s300", n: "星の勇者", ok: (c) => c.total >= 300, how: "⭐を合計300こ" },
    { id: "s1000", n: "星の王", ok: (c) => c.total >= 1000, how: "⭐を合計1000こ" },
    { id: "r1", n: "レアの持ち主", ok: (c) => c.maxR >= 1, how: "レア以上のなかま" },
    { id: "r2", n: "スーパーレアの持ち主", ok: (c) => c.maxR >= 2, how: "スーパーレア以上" },
    { id: "r3", n: "ウルトラレアの持ち主", ok: (c) => c.maxR >= 3, how: "ウルトラレア以上" },
    { id: "r4", n: "激レアの持ち主", ok: (c) => c.maxR >= 4, how: "激レア以上" },
    { id: "r5", n: "伝説の持ち主", ok: (c) => c.maxR >= 5, how: "伝説以上" },
    { id: "r6", n: "神話の持ち主", ok: (c) => c.maxR >= 6, how: "神話のなかま" },
  ];

  // ---------- 保存 ----------
  function fresh() {
    return { schema: SCHEMA, created: now(), settings: { sound: true, haptic: true, nick: "" }, days: {}, totalStars: 0, pulls: 0, pullsUsed: 0,
      chars: { mori: { n: 1, shards: 0, star: 0, t: now() } }, partner: "mori", look: { bg: "note", maru: "red", title: "first" },
      progress: {}, last: null, reports: [], gachaLog: [], games: {} };
  }
  function migrate(s) {
    if (!s || typeof s !== "object") return fresh();
    const f = fresh();
    for (const k in f) if (s[k] == null) s[k] = f[k];
    s.settings = Object.assign(f.settings, s.settings || {});
    s.look = Object.assign(f.look, s.look || {});
    if (!s.chars.mori) s.chars.mori = f.chars.mori;
    s.schema = SCHEMA;
    return s;
  }
  let state;
  try { state = migrate(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) { state = fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast("保存できませんでした（容量がいっぱいかも）"); } }
  save();
  const dayRec = (k) => (state.days[k] = state.days[k] || { stars: 0, steps: {} });
  const starsToday = () => (state.days[today()] || { stars: 0 }).stars;
  const gamesOpen = () => starsToday() >= STARS_TO_UNLOCK;
  const pullsLeft = () => Math.max(0, state.pulls - state.pullsUsed);
  const maxRarity = () => Math.max(...Object.keys(state.chars).map((id) => GCArt.charById(id).rarity));
  const titleCtx = () => ({ total: state.totalStars, maxR: maxRarity() });

  // ---------- 音・振動・トースト ----------
  let actx = null;
  function tone(notes, type = "sine", vol = 0.18) {
    if (!state.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      const t0 = actx.currentTime;
      notes.forEach(([f, d, len]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + d);
        g.gain.exponentialRampToValueAtTime(vol, t0 + d + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + len);
        o.connect(g); g.connect(actx.destination);
        o.start(t0 + d); o.stop(t0 + d + len + 0.02);
      });
    } catch (e) {}
  }
  function sound(kind) {
    if (kind === "pikon") return tone([[1318.5, 0, 0.1], [1760, 0.09, 0.38]], "sine", 0.22); // ピコーン
    if (kind === "miss") return tone([[330, 0, 0.16], [262, 0.12, 0.26]], "triangle", 0.12);
    if (kind === "star") return tone([[784, 0, 0.16], [988, 0.12, 0.16], [1175, 0.24, 0.18], [1568, 0.38, 0.5]]);
    if (kind === "fanfare") return tone([[784, 0, 0.18], [988, 0.12, 0.18], [1175, 0.24, 0.2], [1568, 0.38, 0.5]]);
    if (kind === "soft") return tone([[660, 0, 0.18]]);
    if (kind === "block") return tone([[220, 0, 0.12]], "square", 0.06);
    if (kind && kind.startsWith("r")) { const r = +kind.slice(1); const base = [523, 587, 659, 784, 880, 988, 1175]; const ns = []; for (let i = 0; i <= Math.min(6, r + 1); i++) ns.push([base[i] * (r >= 4 ? 1.5 : 1), i * 0.09, 0.3]); if (r >= 4) ns.push([2093, ns.length * 0.09, 0.8]); return tone(ns, r >= 5 ? "triangle" : "sine"); }
    return tone([[1568, 0, 0.09], [2093, 0.07, 0.32]]);
  }
  function haptic(p) { if (state.settings.haptic && navigator.vibrate) { try { navigator.vibrate(p || 12); } catch (e) {} } }
  function toast(msg, ms) {
    const root = $("#toast-root"), el = document.createElement("div");
    el.className = "toast"; el.innerHTML = '<span class="t-msg">' + msg + "</span>";
    root.appendChild(el);
    while (root.children.length > 3) root.firstChild.remove();
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 260); }, ms || 2600);
  }

  // ---------- シート ----------
  let sheetClose = null;
  function openSheet(html, opt = {}) {
    closeSheet(true);
    const root = $("#sheet-root");
    root.innerHTML = '<div class="scrim"></div><div class="sheet" role="dialog" aria-label="' + esc(opt.label || "") + '"><div class="grabber"></div><button type="button" class="sheet-close" aria-label="閉じる">✕</button>' + html + "</div>";
    const sh = $(".sheet", root), sc = $(".scrim", root);
    requestAnimationFrame(() => { sh.classList.add("show"); sc.classList.add("show"); });
    sc.addEventListener("click", () => closeSheet());
    $(".sheet-close", sh).addEventListener("click", () => closeSheet());
    sheetClose = opt.onClose || null;
    if (opt.mount) opt.mount(sh);
    return sh;
  }
  function closeSheet(instant) {
    const root = $("#sheet-root"); if (!root.firstChild) return;
    const f = sheetClose; sheetClose = null;
    if (instant) root.innerHTML = "";
    else { $$(".show", root).forEach((e) => e.classList.remove("show")); setTimeout(() => (root.innerHTML = ""), 280); }
    if (f) try { f(); } catch (e) {}
  }

  // ---------- 画面 ----------
  let tab = "home";
  let nav = []; // 勉強タブの中の階層 [{v:"grades",s}, {v:"units",s,g}, {v:"steps",s,g,u}]
  function setTab(t) { tab = t; if (t !== "study") nav = []; render(); window.scrollTo(0, 0); }
  function applyLook() {
    document.body.dataset.bg = state.look.bg;
    document.body.dataset.maru = state.look.maru;
  }
  function topStars() {
    const n = starsToday();
    let h = "";
    for (let i = 0; i < STARS_TO_UNLOCK; i++) h += '<span class="ts ' + (i < n ? "on" : "") + '">★</span>';
    if (n > STARS_TO_UNLOCK) h += '<span class="ts-more">+' + (n - STARS_TO_UNLOCK) + "</span>";
    return h;
  }
  function render() {
    applyLook();
    $$(".tab").forEach((b) => b.setAttribute("aria-current", b.dataset.tab === tab ? "page" : "false"));
    $("#top-stars").innerHTML = topStars();
    const back = $("#back-btn");
    back.hidden = !(tab === "study" && nav.length);
    const m = $("#main");
    let title = "ほしまなび";
    if (tab === "home") m.innerHTML = viewHome();
    else if (tab === "study") { const r = viewStudy(); m.innerHTML = r.html; title = r.title; }
    else if (tab === "games") { m.innerHTML = viewGames(); title = "ゲーム"; }
    else if (tab === "gacha") { m.innerHTML = viewGacha(); title = "なかま"; }
    else if (tab === "settings") { m.innerHTML = viewSettings(); title = "設定"; }
    $("#top-title").textContent = title;
    mountPartner();
  }
  function charLevelFor(id) { const e = state.chars[id]; const s = e ? e.star || 0 : 0; return [5, 15, 15, 30, 30, 50][s]; }
  function charHtml(id, size, cls = "") { return '<div class="char ' + cls + '" style="width:' + size + "px;height:" + size + 'px">' + GCArt.charSvg(id, charLevelFor(id), { size }) + "</div>"; }
  function rarityTag(r) { const R = GCArt.RARITIES[r]; return '<span class="rtag r' + r + '" style="--rc:' + R.c + '">' + R.n + "</span>"; }
  function starMarks(n) { return n ? '<span class="cstars">' + "★".repeat(n) + "</span>" : ""; }
  const titleName = () => (TITLES.find((t) => t.id === state.look.title && t.ok(titleCtx())) || TITLES[0]).n;

  // ホーム
  const HOME_LINES = ["今日もいっしょにがんばろう！", "1ステップは約7分。まずは1つやってみよう。", "まちがえても大丈夫。⭐はへらないよ。", "⭐を4つ集めると、今日のゲームがひらくよ。", "解説を読むと、もっと分かるようになるよ。"];
  function viewHome() {
    const p = GCArt.charById(state.partner), n = starsToday(), e = state.chars[p.id] || {};
    const line = HOME_LINES[(new Date().getDate() + n) % HOME_LINES.length];
    let h = '<section class="hero"><div class="hero-bg"></div><div class="hero-in"><div class="title-badge">🏅 ' + esc(titleName()) + "</div>" +
      '<div class="partner-wrap" id="partner">' + charHtml(p.id, 150, "bob r" + p.rarity) + "</div>" +
      '<div class="bubble">' + esc(line) + "</div>" +
      '<div class="pname">' + esc(p.name) + " " + rarityTag(p.rarity) + starMarks(e.star || 0) + "</div></div></section>";
    h += '<section class="card today"><div class="today-row"><div><b>今日の⭐</b><div class="big-stars">' + topStars() + "</div></div><div class=\"today-r\">" +
      (n >= STARS_TO_UNLOCK ? '<span class="ok">🎮 ゲーム解放中！</span>' : "あと <b>" + (STARS_TO_UNLOCK - n) + "</b> こで<br>ゲーム解放") + "</div></div>" +
      '<p class="small muted">⭐は1ステップで6割以上正解すると1こ（ガチャ1回つき）。毎日0にもどります。⭐やポイントがへることはありません。</p></section>';
    if (state.last) {
      const L = state.last, st = findStep(L.s, L.g, L.u, L.st);
      if (st) h += '<button type="button" class="card cont" data-act="cont"><span class="ce">' + subjById(L.s).e + '</span><span class="grow"><b>つづきから</b><span class="small muted">' + esc(subjName(L.s, L.g) + " " + gradeName(L.g) + " ／ " + st.unit.n + " ／ " + st.step.n) + "</span></span>›</button>";
    }
    h += '<div class="quick">' + SUBJ.map((s) => '<button type="button" class="qbtn" data-subj="' + s.id + '" style="--sc:' + s.c + '"><span>' + s.e + "</span>" + esc(s.n) + "</button>").join("") + "</div>";
    if (pullsLeft()) h += '<button type="button" class="card gacha-call" data-act="gacha"><span class="ce">🎁</span><span class="grow"><b>ガチャを ' + pullsLeft() + " 回ひけます</b><span class=\"small muted\">⭐をとったごほうび。見た目が変わるだけで、勉強やゲームが有利になることはありません。</span></span>›</button>";
    h += '<p class="foot">累計 ⭐ ' + state.totalStars + " こ ・ なかま " + Object.keys(state.chars).length + "/" + GCArt.CHARACTERS.length + "</p>";
    return h;
  }
  function mountPartner() {
    const w = $("#partner"); if (!w) return;
    w.addEventListener("click", () => { w.classList.remove("hop"); void w.offsetWidth; w.classList.add("hop"); sound("soft"); });
  }

  // ---------- 教材の検索 ----------
  const S = () => HM.SUBJECTS;
  function gradesOf(s) { return Object.keys(S()[s] || {}).map(Number).sort((a, b) => a - b); }
  function findStep(s, g, u, st) { const us = (S()[s] || {})[g]; if (!us || !us[u] || !us[u].steps[st]) return null; return { unit: us[u], step: us[u].steps[st] }; }
  const stepKey = (s, g, u, st) => { const f = findStep(s, g, u, st); return s + "|" + g + "|" + (f ? f.unit.n + "|" + f.step.n : u + "|" + st); };
  function stepQCount(step) { return typeof step.src === "function" ? step.cnt || 10 : Math.min(step.cnt || 10, step.src.length); }
  function unitStats(s, g, ui) {
    const u = S()[s][g][ui]; let done = 0;
    u.steps.forEach((st, si) => { const p = state.progress[stepKey(s, g, ui, si)]; if (p && p.passed) done++; });
    return { done, total: u.steps.length };
  }

  // 勉強タブ
  function viewStudy() {
    const top = nav[nav.length - 1];
    if (!top) {
      return { title: "勉強", html: '<p class="lead">教科をえらぼう</p><div class="subj-grid">' + SUBJ.map((s) => { const gs = gradesOf(s.id); return '<button type="button" class="subj" data-subj="' + s.id + '" style="--sc:' + s.c + '"><span class="se">' + s.e + "</span><b>" + esc(s.n) + '</b><small>' + (gs.length ? gradeName(gs[0]) + "〜" + gradeName(gs[gs.length - 1]) : "") + "</small></button>"; }).join("") + "</div>" };
    }
    if (top.v === "grades") {
      const s = subjById(top.s);
      return { title: s.n, html: '<p class="lead">学年をえらぼう</p><div class="grade-grid">' + gradesOf(top.s).map((g) => { const us = S()[top.s][g]; let d = 0, t = 0; us.forEach((u, ui) => { const r = unitStats(top.s, g, ui); d += r.done; t += r.total; }); return '<button type="button" class="grade" data-grade="' + g + '" style="--sc:' + s.c + '"><b>' + gradeName(g) + "</b><small>" + esc(subjName(top.s, g)) + "</small>" + bar(d, t) + "</button>"; }).join("") + "</div>" };
    }
    if (top.v === "units") {
      const us = S()[top.s][top.g];
      return { title: subjName(top.s, top.g) + " " + gradeName(top.g), html: '<p class="lead">単元をえらぼう</p><div class="list">' + us.map((u, ui) => { const r = unitStats(top.s, top.g, ui); return '<button type="button" class="row-btn" data-unit="' + ui + '"><span class="un">' + (ui + 1) + '</span><span class="grow"><b>' + esc(u.n) + '</b><span class="small muted">' + r.total + "ステップ ・ 合格 " + r.done + "</span>" + bar(r.done, r.total) + "</span>›</button>"; }).join("") + "</div>" };
    }
    if (top.v === "steps") {
      const u = S()[top.s][top.g][top.u], tk = dayRec(today()).steps;
      return { title: u.n, html: '<p class="lead">ステップ（やさしい → むずかしい）</p><div class="list">' + u.steps.map((st, si) => { const k = stepKey(top.s, top.g, top.u, si), p = state.progress[k]; const n = stepQCount(st); return '<button type="button" class="row-btn step" data-step="' + si + '"><span class="un st">' + (si + 1) + '</span><span class="grow"><b>' + esc(st.n) + '</b><span class="small muted">' + n + "問 ・ 約" + STEP_MIN + "分 ・ 合格 " + HM.passNeed(n) + "問" + (p ? " ・ ベスト " + p.best + "/" + p.n : "") + "</span></span>" + (tk[k] ? '<span class="got">⭐</span>' : p && p.passed ? '<span class="got done">✓</span>' : "") + "›</button>"; }).join("") + "</div>" };
    }
    return { title: "勉強", html: "" };
  }
  const bar = (d, t) => '<span class="pbar"><i style="width:' + (t ? Math.round((d / t) * 100) : 0) + '%"></i></span>';

  // ---------- クイズ ----------
  let Q = null;
  function startStep(s, g, ui, si, opt = {}) {
    const f = findStep(s, g, ui, si); if (!f) return;
    let qs;
    try { qs = HM.makeSet(f.step); } catch (e) { toast("問題を作れませんでした"); return; }
    if (!qs.length) return;
    Q = { s, g, ui, si, key: stepKey(s, g, ui, si), unit: f.unit, step: f.step, qs, i: 0, mode: "main", results: [], baseCorrect: 0, retryCorrect: 0, need: HM.passNeed(qs.length), n: qs.length, starGiven: false, shownAt: 0, answered: false, passOpen: true };
    state.last = { s, g, u: ui, st: si }; save();
    $("#quiz").hidden = false; document.body.classList.add("in-quiz");
    showQ();
  }
  function curList() { return Q.mode === "main" ? Q.qs : Q.retry; }
  function showQ() {
    const list = curList(), q = list[Q.i];
    Q.answered = false; Q.input = "";
    const total = list.length;
    let h = '<div class="qz-head"><button type="button" class="qz-x" data-q="quit" aria-label="やめる">✕</button><div class="qz-prog"><i style="width:' + Math.round((Q.i / total) * 100) + '%"></i></div><span class="qz-n num">' + (Q.i + 1) + "/" + total + "</span></div>";
    h += '<div class="qz-body">';
    h += '<div class="qz-meta">' + esc(subjName(Q.s, Q.g) + " " + gradeName(Q.g) + " ／ " + Q.step.n) + (Q.mode === "retry" ? ' <span class="retry-tag">やり直し</span>' : "") + "</div>";
    if (q.pass) h += '<details class="passage"' + (Q.passOpen ? " open" : "") + '><summary>📄 文章を読む</summary><div class="ptext">' + esc(q.pass).replace(/\n/g, "<br>") + "</div></details>";
    h += '<div class="qz-q">' + q.q + "</div>";
    if (q.t === "ch") h += '<div class="opts">' + (q.opts || [q.a].concat(q.o)).map((o, i) => '<button type="button" class="opt" data-opt="' + i + '">' + esc(o) + "</button>").join("") + "</div>";
    else h += '<div class="num-in"><div class="ans-box" id="ans-box"><span id="ans-val" class="num"></span><span class="caret"></span>' + (q.unit ? '<span class="ans-unit">' + esc(q.unit) + "</span>" : "") + "</div>" + keypad(q) + "</div>";
    h += '</div><div class="qz-foot" id="qz-foot"></div>';
    const el = $("#quiz");
    el.innerHTML = h;
    el.scrollTop = 0;
    Q.shownAt = performance.now();
    const pd = $(".passage", el); if (pd) pd.addEventListener("toggle", () => (Q.passOpen = pd.open));
  }
  function keypad(q) {
    const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "/"];
    let h = '<div class="keypad">' + keys.map((k) => '<button type="button" class="key" data-key="' + k + '">' + (k === "/" ? "分数 /" : k) + "</button>").join("");
    h += '<button type="button" class="key" data-key="-">−</button><button type="button" class="key" data-key="del">⌫</button><button type="button" class="key ok" data-key="ok">こたえる</button></div>';
    if (/\//.test(q.a) || q.frac) h += '<p class="small muted center">分数は「3/4」のように入れてね（3 → 分数 / → 4）。</p>';
    return h;
  }
  function norm(s) { return String(s).trim().replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[−ー－]/g, "-").replace(/／/g, "/").replace(/．/g, ".").replace(/\s+/g, ""); }
  function fracVal(s) { const m = /^(-?)(\d+)\/(\d+)$/.exec(s); if (!m || +m[3] === 0) return null; return (m[1] ? -1 : 1) * (+m[2] / +m[3]); }
  // 数の答えの判定：文字が同じ、または小数として同じ値（0.50 と 0.5）
  function judgeNum(input, a) {
    const x = norm(input), y = norm(a);
    if (!x) return { empty: true };
    if (x === y) return { ok: true };
    if (/^-?\d+(\.\d+)?$/.test(x) && /^-?\d+(\.\d+)?$/.test(y) && Math.abs(parseFloat(x) - parseFloat(y)) < 1e-9) return { ok: true };
    const fx = fracVal(x), fy = /\//.test(y) ? fracVal(y) : /^-?\d+(\.\d+)?$/.test(y) ? parseFloat(y) : null;
    if (fx != null && fy != null && Math.abs(fx - fy) < 1e-9) return { reduce: true };
    return { ok: false };
  }
  function tooFast() {
    if (performance.now() - Q.shownAt < READ_MS) { toast("📖 ちゃんと読んでね"); sound("block"); haptic(30); const b = $(".qz-q"); if (b) { b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); } return true; }
    return false;
  }
  function answer(given) {
    const q = curList()[Q.i];
    if (Q.answered) return;
    if (tooFast()) return;
    let ok;
    if (q.t === "ch") ok = given === q.a;
    else {
      const j = judgeNum(given, q.a);
      if (j.empty) { toast("答えを入れてね"); return; }
      if (j.reduce) { toast("おしい！ 値は同じだよ。答えの形（約分など）を見直してね"); return; }
      ok = j.ok;
    }
    Q.answered = true;
    if (Q.mode === "main") Q.results.push({ q, ok, given });
    else { Q.retryRes.push({ q, ok, given }); if (ok) Q.retryCorrect++; }
    if (ok && Q.mode === "main") Q.baseCorrect++;
    // 画面
    if (q.t === "ch") $$(".opt").forEach((b) => { const v = (q.opts || [q.a].concat(q.o))[+b.dataset.opt]; b.disabled = true; if (v === q.a) b.classList.add("right"); else if (v === given) b.classList.add("wrong"); });
    else { const box = $("#ans-box"); box.classList.add(ok ? "right" : "wrong"); $$(".key").forEach((k) => (k.disabled = true)); }
    if (ok) { bigMaru(); sound("pikon"); haptic(15); } else { sound("miss"); haptic([20, 40, 20]); }
    let f = '<div class="fb ' + (ok ? "ok" : "ng") + '">';
    f += ok ? '<div class="fb-h">⭕ 正解！</div>' : '<div class="fb-h">✖ ざんねん</div><div class="fb-a">正解：<b>' + esc(q.a) + (q.unit && q.t !== "ch" ? esc(q.unit) : "") + "</b></div>";
    const ex = '<div class="fb-ex"><b>解説</b><p>' + esc(q.ex || "").replace(/\n/g, "<br>") + "</p></div>";
    f += ok ? '<button type="button" class="btn sm ghost" data-q="ex">💡 解説を見る</button><div class="ex-wrap" hidden>' + ex + "</div>" : ex;
    f += '<div class="fb-act"><button type="button" class="link-btn" data-q="report">この問題おかしい？</button><button type="button" class="btn primary" data-q="next">次へ ›</button></div></div>';
    $("#qz-foot").innerHTML = f;
    // 再挑戦中に6割に届いたら、その場で⭐
    if (Q.mode === "retry" && !Q.starGiven && Q.baseCorrect + Q.retryCorrect >= Q.need) { giveStar(); setTimeout(() => celebrateStar(true), 450); }
    const nb = $('[data-q="next"]'); if (nb) setTimeout(() => nb.focus && nb.focus({ preventScroll: true }), 50);
  }
  function bigMaru() {
    const fx = $("#fx-root"), d = document.createElement("div");
    d.className = "big-maru m-" + state.look.maru;
    d.innerHTML = maruSvg(state.look.maru);
    fx.appendChild(d); setTimeout(() => d.remove(), 900);
  }
  function maruSvg(id) {
    const col = { red: "#e5383b", blue: "#2f7fd8", star: "#e5383b", hanamaru: "#e5383b", rainbow: "url(#rg)", gold: "url(#gg)", myth: "url(#mg)" }[id] || "#e5383b";
    let x = '<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5f6d"/><stop offset=".25" stop-color="#ffc371"/><stop offset=".5" stop-color="#5ee07a"/><stop offset=".75" stop-color="#4facfe"/><stop offset="1" stop-color="#b06ab3"/></linearGradient><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#e0b030"/><stop offset="1" stop-color="#a87a10"/></linearGradient><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ad9"/><stop offset=".5" stop-color="#7a5cff"/><stop offset="1" stop-color="#36d1dc"/></linearGradient></defs>';
    if (id === "hanamaru") { x += '<path d="M100 30 C150 26 176 66 168 104 C160 150 110 170 70 156 C30 140 22 92 46 60 C66 36 108 44 124 70 C140 98 120 132 92 128 C66 124 64 92 86 86" fill="none" stroke="' + col + '" stroke-width="13" stroke-linecap="round"/>'; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; x += '<circle cx="' + (100 + Math.cos(a) * 88).toFixed(1) + '" cy="' + (100 + Math.sin(a) * 88).toFixed(1) + '" r="10" fill="#ff9fb0" opacity=".9"/>'; } }
    else x += '<circle cx="100" cy="100" r="70" fill="none" stroke="' + col + '" stroke-width="' + (id === "myth" ? 18 : 16) + '"/>';
    if (id === "star" || id === "gold" || id === "myth") for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; x += starPath(100 + Math.cos(a) * 92, 100 + Math.sin(a) * 92, 11, id === "star" ? "#ffcf3f" : "#fff6c2"); }
    if (id === "myth") x += '<circle cx="100" cy="100" r="88" fill="none" stroke="url(#rg)" stroke-width="3" stroke-dasharray="6 8"/>';
    return '<svg viewBox="0 0 200 200" width="230" height="230">' + x + "</svg>";
  }
  function starPath(cx, cy, r, fill) { let p = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; p += (i ? "L" : "M") + (cx + Math.cos(a) * rr).toFixed(1) + " " + (cy + Math.sin(a) * rr).toFixed(1); } return '<path d="' + p + 'Z" fill="' + fill + '"/>'; }
  function next() {
    const list = curList();
    if (!Q.answered) return;
    if (Q.i + 1 < list.length) { Q.i++; showQ(); return; }
    finishRound();
  }
  function finishRound() {
    if (Q.mode === "main") {
      const p = state.progress[Q.key] || { best: 0, n: Q.n, plays: 0, passed: false };
      Q.prevBest = p.plays ? p.best : null;
      p.plays++; p.n = Q.n; p.best = Math.max(p.best, Q.baseCorrect); p.last = Q.baseCorrect; p.t = now();
      state.progress[Q.key] = p;
      if (Q.baseCorrect >= Q.need) giveStar();
      save();
    } else {
      // 再挑戦：まちがいリストを更新
      Q.wrongLeft = Q.retryRes.filter((r) => !r.ok).map((r) => r.q);
    }
    summary();
  }
  // ⭐をあげる（同じステップは1日1回まで）。⭐やポイントがへることはない。
  function giveStar() {
    if (Q.starGiven) return;
    Q.starGiven = true;
    const p = state.progress[Q.key] || { best: 0, n: Q.n, plays: 1, passed: false };
    p.passed = true; state.progress[Q.key] = p;
    const d = dayRec(today());
    if (d.steps[Q.key]) { Q.starDup = true; save(); return; }
    d.steps[Q.key] = true; d.stars += 1;
    state.totalStars += 1; state.pulls += 1;
    Q.starNew = true;
    save();
  }
  function celebrateStar(inline) {
    sound("star");
    const fx = $("#fx-root"), d = document.createElement("div");
    d.className = "star-pop"; d.innerHTML = "<span>⭐</span><b>" + (Q && Q.starDup ? "合格！（このステップの⭐は今日もうもらったよ）" : "⭐ ゲット！ ガチャ1回") + "</b>";
    fx.appendChild(d); setTimeout(() => d.remove(), 1800);
    $("#top-stars").innerHTML = topStars();
  }
  const PRAISE = {
    perfect: ["全問正解！ 完ぺきだね！", "パーフェクト！ すごすぎる！", "1問もまちがえなかった！ 天才かも！"],
    pass: ["合格！ よくがんばったね！", "6割こえた！ その調子！", "いいね！ ちゃんと分かってきてる！"],
    up: ["前よりできるようになってる！", "成長してるのが分かるよ！"],
    not: ["おしい！ まちがえた問題だけやり直そう。", "大丈夫、やり直せば⭐がもらえるよ。", "解説を読んで、もう一回いってみよう！"],
  };
  const SPECIAL = { 4: "激レアのぼくも感心したよ！", 5: "伝説級のがんばりだ！", 6: "神話にきざまれる努力だね…！" };
  function summary() {
    const p = GCArt.charById(state.partner), combined = Q.baseCorrect + (Q.retryCorrect || 0), passed = combined >= Q.need;
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    let kind = Q.mode === "main" && Q.baseCorrect === Q.n ? "perfect" : passed ? "pass" : "not";
    let line = pick(PRAISE[kind]);
    if (Q.mode === "main" && Q.prevBest != null && Q.baseCorrect > Q.prevBest) line = pick(PRAISE.up) + " " + line;
    if (SPECIAL[p.rarity] && passed) line += " " + SPECIAL[p.rarity];
    const wrong = Q.mode === "main" ? Q.results.filter((r) => !r.ok).map((r) => r.q) : Q.wrongLeft;
    const pct = Math.round((combined / Q.n) * 100);
    let h = '<div class="sum">';
    h += '<div class="sum-top"><div class="ring" style="--p:' + pct + '"><div><b class="num">' + combined + "</b><small>/" + Q.n + "</small></div></div>";
    h += '<div class="sum-r"><div class="sum-t">' + (kind === "perfect" ? "パーフェクト！" : passed ? "合格！" : "あと " + (Q.need - combined) + " 問で合格") + '</div><div class="small muted">合格ライン：' + Q.n + "問中 " + Q.need + "問（6割・切り上げ）</div>";
    if (Q.mode === "main" && Q.prevBest != null) h += '<div class="small">前回までのベスト ' + Q.prevBest + " → 今回 " + Q.baseCorrect + (Q.baseCorrect > Q.prevBest ? ' <b class="up">+' + (Q.baseCorrect - Q.prevBest) + "</b>" : "") + "</div>";
    if (Q.mode === "retry") h += '<div class="small">最初 ' + Q.baseCorrect + "問 ＋ やり直し " + Q.retryCorrect + "問</div>";
    h += "</div></div>";
    h += '<div class="sum-star ' + (Q.starGiven ? "got" : "") + '">' + (Q.starGiven ? (Q.starNew ? "⭐ を1こゲット！ ガチャが1回ひけます" : "合格！（このステップの⭐は今日もうもらったよ。ほかのステップで⭐を集めよう）") : "⭐ はまだ。まちがえた問題をやり直すと、合わせて6割で⭐！") + "</div>";
    h += '<div class="sum-char">' + charHtml(p.id, 110, "bob r" + p.rarity + (p.rarity >= 4 ? " glow" : "")) + '<div class="bubble">' + esc(line) + "</div></div>";
    h += '<div class="today-mini">今日の⭐ ' + topStars() + (gamesOpen() ? ' <span class="ok">🎮 ゲーム解放中</span>' : " あと" + (STARS_TO_UNLOCK - starsToday()) + "こでゲーム") + "</div>";
    h += '<div class="sum-act">';
    if (wrong && wrong.length) h += '<button type="button" class="btn ' + (passed ? "" : "primary") + ' block" data-q="retry">🔁 まちがえた ' + wrong.length + " 問をやり直す</button>";
    if (Q.starNew && pullsLeft()) h += '<button type="button" class="btn gold block" data-q="gacha">🎁 ガチャをひく</button>';
    const nx = findStep(Q.s, Q.g, Q.ui, Q.si + 1);
    if (nx) h += '<button type="button" class="btn ' + (passed ? "primary" : "") + ' block" data-q="nextstep">次のステップ：' + esc(nx.step.n) + " ›</button>";
    h += '<button type="button" class="btn block" data-q="again">もう一度このステップ</button><button type="button" class="btn ghost block" data-q="quit">単元にもどる</button></div>';
    if (Q.results.length) h += '<details class="review"><summary>問題をふりかえる</summary>' + Q.results.map((r, i) => '<div class="rv ' + (r.ok ? "ok" : "ng") + '"><b>' + (i + 1) + ". " + (r.ok ? "⭕" : "✖") + '</b> <span class="rq">' + strip(r.q.q).slice(0, 80) + "</span><br><span class=\"small\">正解：" + esc(r.q.a) + "</span></div>").join("") + "</details>";
    h += "</div>";
    Q.wrongForRetry = wrong;
    $("#quiz").innerHTML = h; $("#quiz").scrollTop = 0;
    if (Q.starNew && !Q.celebrated) { Q.celebrated = true; setTimeout(() => celebrateStar(), 200); }
  }
  const strip = (html) => esc(String(html).replace(/<svg[\s\S]*?<\/svg>/g, "［図］").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  function startRetry() {
    const w = Q.wrongForRetry || []; if (!w.length) return;
    Q.mode = "retry"; Q.i = 0; Q.retryRes = [];
    if (Q.retryCorrect == null) Q.retryCorrect = 0;
    Q.retry = w.map((q) => Object.assign({}, q, { opts: q.t === "ch" ? HM.U.shuf([q.a].concat(q.o)) : undefined }));
    showQ();
  }
  function quitQuiz() {
    $("#quiz").hidden = true; $("#quiz").innerHTML = ""; document.body.classList.remove("in-quiz");
    if (Q) { nav = [{ v: "grades", s: Q.s }, { v: "units", s: Q.s, g: Q.g }, { v: "steps", s: Q.s, g: Q.g, u: Q.ui }]; tab = "study"; }
    Q = null; render();
  }
  function reportQ() {
    const q = curList()[Q.i];
    openSheet('<h2>この問題おかしい？</h2><p class="small muted">気づいたことを書いてね。この端末の中だけに保存されます（どこにも送信しません）。設定の「問題の報告」から一覧を見たり書き出したりできます。</p><div class="rep-q">' + strip(q.q) + "<br><small>アプリの正解：" + esc(q.a) + "</small></div>" +
      '<div class="chips">' + ["答えがちがう", "正解が2つある", "問題文が分かりにくい", "解説がおかしい", "その他"].map((c) => '<button type="button" class="chip" data-c="' + c + '">' + c + "</button>").join("") + '</div><textarea class="input" id="rep-note" rows="3" maxlength="300" placeholder="くわしく（なくてもOK）"></textarea><div class="actions"><button type="button" class="btn primary block" id="rep-save">保存する</button></div>', {
      label: "問題の報告",
      mount: (sh) => {
        let kind = "";
        sh.addEventListener("click", (e) => { const c = e.target.closest("[data-c]"); if (c) { kind = c.dataset.c; $$(".chip", sh).forEach((x) => x.classList.toggle("on", x === c)); } });
        $("#rep-save", sh).addEventListener("click", () => {
          const r = curList()[Q.i] && Q.mode === "main" ? Q.results[Q.i] : null;
          state.reports.unshift({ t: now(), app: VERSION, subj: Q.s, grade: Q.g, unit: Q.unit.n, step: Q.step.n, q: strip(q.q), a: q.a, opts: q.t === "ch" ? [q.a].concat(q.o) : null, given: r ? r.given : null, kind: kind || "未選択", note: $("#rep-note", sh).value.trim() });
          state.reports = state.reports.slice(0, 500); save(); closeSheet(); toast("ありがとう！ 報告を保存しました");
        });
      },
    });
  }

  // ---------- ゲーム ----------
  function viewGames() {
    const open = gamesOpen(), n = starsToday();
    let h = '<div class="gate ' + (open ? "open" : "") + '">' + (open ? "🎮 今日はゲームで遊べるよ！（⭐" + n + "）" : "🔒 今日の⭐が " + STARS_TO_UNLOCK + " こになるとひらきます（今 " + n + " こ）") + "</div>";
    h += '<div class="app-grid">' + GAMES.map((g) => '<button type="button" class="app-ic ' + (open ? "" : "locked") + '" data-game="' + g.id + '"><span class="ai" style="--gc:' + g.c + '">' + g.e + (open ? "" : '<span class="lock">🔒</span>') + "</span><span class=\"an\">" + esc(g.n) + "</span></button>").join("") + "</div>";
    h += '<p class="foot">全' + GAMES.length + 'ゲーム。ゲームで勝っても負けても、⭐・ガチャ・なかまは変わりません（ゲームの有利・不利もありません）。</p>';
    return h;
  }
  function openGameMenu(id) {
    const g = GAMES.find((x) => x.id === id); if (!g) return;
    if (!gamesOpen()) { toast("🔒 今日の⭐をあと " + (STARS_TO_UNLOCK - starsToday()) + " こ集めるとひらくよ"); return; }
    const rec = state.games[id] || {};
    openSheet("<h2>" + g.e + " " + esc(g.n) + '</h2><p class="small muted">' + esc(g.d) + '</p><div class="diff-list">' + DIFFS.map((d) => { const r = rec[d.id] || { plays: 0, wins: 0 }; return '<button type="button" class="diff-btn ' + d.id + '" data-diff="' + d.id + '"><span class="grow"><b>' + d.name + "</b><small>" + DIFF_DESC[d.id] + '</small></span><span class="diff-r num">' + (r.wins || 0) + "勝/" + (r.plays || 0) + "回</span></button>"; }).join("") + "</div>", {
      label: g.n,
      mount: (sh) => sh.addEventListener("click", (e) => { const b = e.target.closest("[data-diff]"); if (b) { closeSheet(true); startGame(id, b.dataset.diff); } }),
    });
  }
  function startGame(id, diff) {
    if (!gamesOpen()) return;
    try {
      if (id === "climb") window.GFGames.openClimb(diff);
      else if (id === "arena") window.GFGames.openArena(diff);
      else if (id === "chess") window.GFChess.open({ diff });
      else if (window.GCGames && GCGames.open[id]) GCGames.open[id](diff);
      else toast("このゲームは準備中です");
    } catch (e) { console.error(e); toast("ゲームを開けませんでした"); }
  }
  let layerOnClose = null;
  function openLayer(title, onClose) {
    if (layerOnClose) { const f = layerOnClose; layerOnClose = null; try { f(); } catch (e) {} }
    $("#gl-title").textContent = title;
    $("#gl-result").hidden = true;
    const oldBody = $("#gl-body"), freshEl = oldBody.cloneNode(false);
    oldBody.replaceWith(freshEl);
    $("#game-layer").hidden = false;
    document.body.classList.add("in-game");
    layerOnClose = onClose || null;
    return $("#gl-body");
  }
  function closeLayer() {
    if (layerOnClose) { const f = layerOnClose; layerOnClose = null; try { f(); } catch (e) {} }
    if (window.GFGames) try { GFGames.stop(); } catch (e) {}
    if (window.GCGames) try { GCGames.stop(); } catch (e) {}
    $("#game-layer").hidden = true; $("#gl-body").innerHTML = ""; $("#gl-result").hidden = true;
    document.body.classList.remove("in-game");
    render();
  }
  function showResult(o) {
    const box = $("#gl-result");
    box.innerHTML = '<div class="res-card" role="dialog" aria-label="結果"><div class="res-emoji">' + (o.win ? "🏆" : o.draw ? "🤝" : "🌧️") + "</div><h3>" + esc(o.title) + "</h3><p>" + esc(o.text || "") + '</p><p class="small muted">ゲームの結果で⭐やなかまが変わることはありません。</p><div class="actions two"><button type="button" class="btn" id="res-close">ゲーム一覧へ</button><button type="button" class="btn primary" id="res-retry">もう一回</button></div></div>';
    box.hidden = false;
    $("#res-close").addEventListener("click", closeLayer);
    $("#res-retry").addEventListener("click", () => { box.hidden = true; if (o.onRetry) o.onRetry(); });
    if (o.win) sound("fanfare");
  }
  function reportGame(game, diff, win) {
    state.games[game] = state.games[game] || {};
    const r = state.games[game][diff] || { plays: 0, wins: 0 };
    r.plays++; if (win) r.wins++;
    state.games[game][diff] = r; save();
    return null; // ゲームではごほうびなし
  }
  function copyText(text) {
    const done = () => toast("コピーしました");
    const fb = () => { const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { toast("長押しでコピーしてください"); } ta.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fb); else fb();
  }
  // ゲームの有利・不利はなし（全部0）
  const NO_ADV = Object.freeze({ level: 1, ratio: 0, partnerBonus: 0, climbSec: 0, chessHints: 0, chessUndo: 0, arenaHp: 0, arenaDmg: 0, hints: 0, undos: 0, peek: 0, paddle: 0, moleSec: 0, lives: 0, undo2048: 0, sudokuHints: 0, coinMoves: 0 });
  window.GF = {
    toast: (m) => toast(esc(m)), esc,
    advantage: () => Object.assign({ partner: state.partner }, NO_ADV),
    charImage: () => GCArt.charImage(state.partner, charLevelFor(state.partner)),
    diffName: (id) => (DIFFS.find((d) => d.id === id) || DIFFS[1]).name,
    DIFFS, openLayer, closeLayer, showResult, reportGame, copyText,
    getNick: () => state.settings.nick || "",
    sound: (k) => sound(k), haptic: (p) => haptic(p),
  };

  // ---------- ガチャ・図鑑 ----------
  function rnd01() { try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; } catch (e) { return Math.random(); } }
  function drawRarity(rates, u) { let acc = 0; for (let i = 0; i < rates.length; i++) { acc += rates[i]; if (u * 100 < acc) return i; } for (let i = rates.length - 1; i >= 0; i--) if (rates[i] > 0) return i; return 0; }
  function drawChar(sr, rnd) { const r = drawRarity(sr ? GACHA_RATES_SR : GACHA_RATES, rnd()); const pool = GCArt.CHARACTERS.filter((c) => c.rarity === r); return pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))]; }
  function gachaPull(n, rnd) {
    n = n === 10 ? 10 : 1;
    if (pullsLeft() < n) return { error: "ガチャ回数が足りません（⭐をとると1回ふえます）" };
    rnd = typeof rnd === "function" ? rnd : rnd01;
    const out = [];
    for (let i = 0; i < n; i++) {
      const c = drawChar(n === 10 && i === 9, rnd);
      const had = !!state.chars[c.id];
      const e = state.chars[c.id] || { n: 0, shards: 0, star: 0, t: now() };
      e.n += 1; let shards = 0;
      if (had) { shards = SHARD_DUP[c.rarity]; e.shards += shards; }
      state.chars[c.id] = e;
      out.push({ id: c.id, rarity: c.rarity, isNew: !had, shards });
    }
    state.pullsUsed += n;
    state.gachaLog.unshift({ t: now(), ids: out.map((o) => o.id) }); state.gachaLog = state.gachaLog.slice(0, 50);
    save();
    return { results: out };
  }
  function viewGacha() {
    const left = pullsLeft(), owned = Object.keys(state.chars).length;
    let h = '<section class="card gacha-top"><div class="capsule-machine">🎁</div><div class="grow"><b>なかまガチャ</b><div class="small muted">⭐をとるたびに1回。お金では引けません（課金なし）。</div><div class="pulls">のこり <b class="num">' + left + "</b> 回</div></div></section>";
    h += '<div class="actions two"><button type="button" class="btn primary" data-g="1" ' + (left >= 1 ? "" : "disabled") + '>1回ひく</button><button type="button" class="btn gold" data-g="10" ' + (left >= 10 ? "" : "disabled") + ">10回ひく</button></div>";
    h += '<p class="small muted center">10回ひくと、10回目はスーパーレア以上が確定。<button type="button" class="link-btn" data-g="rates">確率を見る</button></p>';
    h += '<div class="sec">図鑑 <span class="muted">' + owned + "/" + GCArt.CHARACTERS.length + "</span></div>";
    h += '<div class="zukan">' + GCArt.CHARACTERS.map((c) => { const e = state.chars[c.id]; if (!e) return '<div class="zk none"><div class="sil">？</div><small>' + GCArt.RARITIES[c.rarity].s + "</small></div>"; return '<button type="button" class="zk r' + c.rarity + (c.rarity >= 5 ? " goldf" : "") + (state.partner === c.id ? " partner" : "") + '" data-char="' + c.id + '">' + charHtml(c.id, 64) + "<small>" + esc(c.name) + "</small>" + starMarks(e.star || 0) + (c.rarity >= 5 ? '<i class="spk s1"></i><i class="spk s2"></i><i class="spk s3"></i>' : "") + "</button>"; }).join("") + "</div>";
    h += '<div class="sec">見た目（なかまのレア度でふえる）</div>';
    const mr = maxRarity();
    h += '<div class="look"><b>背景</b><div class="chips">' + BGS.map((b) => '<button type="button" class="chip ' + (state.look.bg === b.id ? "on" : "") + '" data-bg="' + b.id + '" ' + (mr >= b.r ? "" : "disabled") + ">" + (mr >= b.r ? "" : "🔒") + esc(b.n) + "</button>").join("") + "</div>";
    h += "<b>⭕のデザイン</b><div class=\"chips\">" + MARUS.map((b) => '<button type="button" class="chip ' + (state.look.maru === b.id ? "on" : "") + '" data-maru="' + b.id + '" ' + (mr >= b.r ? "" : "disabled") + ">" + (mr >= b.r ? "" : "🔒") + esc(b.n) + "</button>").join("") + "</div>";
    const tc = titleCtx();
    h += "<b>称号</b><div class=\"chips\">" + TITLES.map((t) => '<button type="button" class="chip ' + (state.look.title === t.id ? "on" : "") + '" data-title="' + t.id + '" ' + (t.ok(tc) ? "" : "disabled") + ' title="' + esc(t.how) + '">' + (t.ok(tc) ? "" : "🔒") + esc(t.n) + "</button>").join("") + "</div></div>";
    h += '<p class="foot">見た目が変わるだけです。勉強やゲームが有利になることはありません。</p>';
    return h;
  }
  function openRates() {
    const R = GCArt.RARITIES, cnt = R.map((r) => GCArt.CHARACTERS.filter((c) => c.rarity === r.id).length);
    const pct = (x) => (Math.round(x * 1000) / 1000).toString() + "%";
    const head = "<tr><th>レア度</th><th>確率</th><th>種類</th></tr>";
    const row = (rates) => R.map((r, i) => '<tr><td><span class="rdot" style="background:' + r.c + '"></span>' + r.n + '</td><td class="num">' + pct(rates[i]) + '</td><td class="num">' + cnt[i] + "</td></tr>").join("");
    openSheet('<h2>ガチャの確率</h2><p class="small"><b>1回ひく／10回ひくの1〜9回目</b></p><table class="ga-table" id="rates-normal">' + head + row(GACHA_RATES) + '</table><p class="small" style="margin-top:12px"><b>10回ひくの10回目（スーパーレア以上確定）</b></p><table class="ga-table" id="rates-sr">' + head + row(GACHA_RATES_SR) + "</table>" +
      '<details class="ga-all"><summary>なかま別の確率（全' + GCArt.CHARACTERS.length + "種）</summary>" + R.map((r, i) => '<p class="small"><b>' + r.n + "</b>（1体あたり " + pct(GACHA_RATES[i] / cnt[i]) + "）：" + GCArt.CHARACTERS.filter((c) => c.rarity === i).map((c) => esc(c.name)).join("、") + "</p>").join("") + '</details><p class="small muted">同じなかまが出たら「かけら」になり、図鑑で★（見た目のかざり）を上げられます。全部そろえても特別なごほうびはありません（コンプガチャなし）。お金では引けません。</p>', { label: "確率" });
  }
  function doGacha(n) {
    const r = gachaPull(n);
    if (!r || r.error) { toast(esc(r ? r.error : "ひけません")); return; }
    const res = r.results, best = Math.max(...res.map((x) => x.rarity));
    const R = GCArt.RARITIES;
    const fx = document.createElement("div"); fx.className = "gacha-show"; fx.id = "gacha-show";
    const capCls = (x) => (x >= 4 ? "rainbow" : "r" + x);
    fx.innerHTML = '<div class="gs-in"><div class="capsule ' + capCls(best) + '" id="cap"><div class="cap-top"></div><div class="cap-bot"></div></div><p class="gs-hint">タップしてあける</p></div>';
    document.body.appendChild(fx);
    sound("soft");
    let opened = false;
    const open = () => {
      if (opened) return; opened = true;
      sound("r" + best); haptic(best >= 4 ? [30, 40, 30, 40, 80] : 20);
      fx.classList.add("lv" + best);
      fx.innerHTML = '<div class="gs-res ' + (best >= 4 ? "rainbow-bg" : "") + '"><h2>' + (best >= 4 ? "🌈 " : "") + (n === 10 ? "10連の結果" : "結果") + '</h2><div class="gs-grid n' + n + '">' + res.map((x, i) => { const c = GCArt.charById(x.id); return '<div class="gs-card r' + x.rarity + (x.rarity >= 4 ? " shine" : "") + '" style="animation-delay:' + i * 0.08 + 's;--rc:' + R[x.rarity].c + '">' + charHtml(c.id, n === 10 ? 58 : 130) + "<b>" + esc(c.name) + '</b><span class="rtag" style="--rc:' + R[x.rarity].c + '">' + R[x.rarity].n + "</span>" + (x.isNew ? '<span class="new">NEW</span>' : '<span class="dup">かけら+' + x.shards + "</span>") + "</div>"; }).join("") + '</div><div class="actions two"><button type="button" class="btn" id="gs-close">とじる</button>' + (pullsLeft() >= n ? '<button type="button" class="btn primary" id="gs-again">もう' + (n === 10 ? "10" : "1") + "回</button>" : '<button type="button" class="btn primary" id="gs-zukan">図鑑を見る</button>') + "</div></div>";
      $("#gs-close", fx).addEventListener("click", () => { fx.remove(); render(); });
      const ag = $("#gs-again", fx); if (ag) ag.addEventListener("click", () => { fx.remove(); doGacha(n); });
      const zk = $("#gs-zukan", fx); if (zk) zk.addEventListener("click", () => { fx.remove(); tab = "gacha"; render(); });
    };
    fx.addEventListener("click", (e) => { if (!opened) open(); });
    setTimeout(() => { const c = $("#cap", fx); if (c) c.classList.add("wiggle"); }, 100);
  }
  function openChar(id) {
    const c = GCArt.charById(id), e = state.chars[id]; if (!e) return;
    const st = e.star || 0, cost = STAR_COST[st];
    openSheet('<div class="cd ' + (c.rarity >= 5 ? "goldf" : "") + '">' + charHtml(id, 150, "bob r" + c.rarity + (c.rarity >= 4 ? " glow" : "")) + "</div><h2>" + esc(c.name) + " " + rarityTag(c.rarity) + starMarks(st) + '</h2><p class="small">' + esc(c.desc) + '</p><p class="small muted">出た回数 ' + e.n + " ・ かけら " + e.shards + (cost ? "（★" + (st + 1) + "まで " + cost + "）" : "（★MAX）") + '</p><div class="actions two"><button type="button" class="btn primary" id="cd-partner" ' + (state.partner === id ? "disabled" : "") + ">" + (state.partner === id ? "ホームのなかま" : "ホームに出す") + '</button><button type="button" class="btn gold" id="cd-star" ' + (cost && e.shards >= cost ? "" : "disabled") + ">★を上げる" + (cost ? "（かけら" + cost + "）" : "") + '</button></div><p class="small muted">★は見た目（成長した姿・キラキラ）が変わるだけです。</p>', {
      label: c.name,
      mount: (sh) => {
        $("#cd-partner", sh).addEventListener("click", () => { state.partner = id; save(); closeSheet(); toast(esc(c.name) + " がホームに来たよ"); render(); });
        $("#cd-star", sh).addEventListener("click", () => { const e2 = state.chars[id], cst = STAR_COST[e2.star || 0]; if (!cst || e2.shards < cst) return; e2.shards -= cst; e2.star = (e2.star || 0) + 1; save(); sound("fanfare"); closeSheet(true); openChar(id); render(); });
      },
    });
  }

  // ---------- 設定 ----------
  function viewSettings() {
    let h = '<div class="card set"><label class="sw"><span>効果音（ピコーンなど）</span><input type="checkbox" data-set="sound" ' + (state.settings.sound ? "checked" : "") + '></label><label class="sw"><span>振動（対応している端末のみ）</span><input type="checkbox" data-set="haptic" ' + (state.settings.haptic ? "checked" : "") + '></label><label class="field"><span>ニックネーム（チェスの友だち対戦で表示）</span><input class="input" id="nick" maxlength="12" value="' + esc(state.settings.nick) + '"></label></div>';
    h += '<div class="sec">問題の報告 <span class="muted">' + state.reports.length + "件</span></div>";
    if (!state.reports.length) h += '<p class="small muted">「この問題おかしい？」で保存した報告がここに出ます。</p>';
    else h += '<div class="reports">' + state.reports.slice(0, 50).map((r, i) => '<div class="rep"><div class="small muted">' + new Date(r.t).toLocaleString("ja-JP") + " ・ " + esc(subjName(r.subj, r.grade) + gradeName(r.grade)) + " ・ " + esc(r.unit + "／" + r.step) + "</div><div>" + r.q + '</div><div class="small">アプリの正解：' + esc(r.a) + " ・ " + esc(r.kind) + (r.note ? " ・ " + esc(r.note) : "") + '</div><button type="button" class="link-btn" data-rep-del="' + i + '">消す</button></div>').join("") + "</div>";
    h += '<div class="actions two"><button type="button" class="btn" data-act="rep-copy" ' + (state.reports.length ? "" : "disabled") + '>報告をコピー</button><button type="button" class="btn" data-act="rep-dl" ' + (state.reports.length ? "" : "disabled") + ">ファイルに書き出す</button></div>";
    h += '<div class="sec">データ</div><div class="actions two"><button type="button" class="btn" data-act="backup">バックアップを書き出す</button><button type="button" class="btn" data-act="restore">バックアップから戻す</button></div><input type="file" id="restore-file" accept="application/json,.json" hidden>';
    h += '<div class="actions"><button type="button" class="btn danger block" data-act="reset">すべてのデータを消す</button></div>';
    h += '<div class="sec">このアプリについて</div><p class="small">ほしまなび v' + VERSION + "。小1〜中3の算数・数学、国語、生活、理科、社会、英語。学習指導要領（平成29年告示）の内容にそって作っています。<br>⭐は1ステップ6割以上で1こ（同じステップは1日1回）。⭐4こで、その日のゲームがひらきます。<br><b>課金・広告・お金の機能はありません。</b>データはこの端末の中だけに保存され、どこにも送信しません。</p>";
    h += '<p class="small muted">算数・数学の問題はプログラムで作り、答えを別の計算で確かめています。文章の問題も確認していますが、まちがいを見つけたら「この問題おかしい？」で教えてください。<a href="./legal.html">くわしく</a></p>';
    return h;
  }
  function download(name, text) {
    const blob = new Blob([text], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const reportText = () => state.reports.map((r) => [new Date(r.t).toLocaleString("ja-JP"), subjName(r.subj, r.grade) + gradeName(r.grade), r.unit + "／" + r.step, "問題：" + r.q.replace(/&[a-z#0-9]+;/g, (m) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" }[m] || m)), "アプリの正解：" + r.a, "種類：" + r.kind, r.note ? "メモ：" + r.note : ""].filter(Boolean).join("\n")).join("\n\n");

  // ---------- イベント ----------
  document.addEventListener("click", (e) => {
    const t = e.target;
    const tb = t.closest(".tab"); if (tb) { setTab(tb.dataset.tab); return; }
    if (t.closest("#back-btn")) { nav.pop(); render(); window.scrollTo(0, 0); return; }
    if (t.closest("#gl-close")) { closeLayer(); return; }
    // クイズ
    if (t.closest("#quiz")) {
      const o = t.closest("[data-opt]"); if (o && Q) { const q = curList()[Q.i]; answer((q.opts || [q.a].concat(q.o))[+o.dataset.opt]); return; }
      const k = t.closest("[data-key]");
      if (k && Q && !Q.answered) {
        const v = k.dataset.key;
        if (v === "ok") { answer(Q.input); return; }
        if (v === "del") Q.input = Q.input.slice(0, -1);
        else if (v === "-") Q.input = Q.input.startsWith("-") ? Q.input.slice(1) : "-" + Q.input;
        else if (Q.input.length < 12) Q.input += v;
        $("#ans-val").textContent = Q.input.replace(/^-/, "−");
        return;
      }
      const a = t.closest("[data-q]"); if (!a || !Q) return;
      const act = a.dataset.q;
      if (act === "next") next();
      else if (act === "ex") { const w = $(".ex-wrap"); w.hidden = !w.hidden; a.textContent = w.hidden ? "💡 解説を見る" : "解説をとじる"; }
      else if (act === "report") reportQ();
      else if (act === "retry") startRetry();
      else if (act === "again") { const s = [Q.s, Q.g, Q.ui, Q.si]; startStep(...s); }
      else if (act === "nextstep") { const s = [Q.s, Q.g, Q.ui, Q.si + 1]; startStep(...s); }
      else if (act === "gacha") { quitQuiz(); tab = "gacha"; render(); doGacha(1); }
      else if (act === "quit") { if (Q.mode === "main" && Q.results.length && Q.results.length < Q.n && $(".qz-head")) { if (!confirm("やめますか？（このステップの結果は記録されません）")) return; } quitQuiz(); }
      return;
    }
    const m = t.closest("#main"); if (!m) return;
    const sb = t.closest("[data-subj]");
    if (sb) { tab = "study"; nav = [{ v: "grades", s: sb.dataset.subj }]; render(); window.scrollTo(0, 0); return; }
    const gb = t.closest("[data-grade]"); if (gb) { const top = nav[nav.length - 1]; nav.push({ v: "units", s: top.s, g: +gb.dataset.grade }); render(); window.scrollTo(0, 0); return; }
    const ub = t.closest("[data-unit]"); if (ub) { const top = nav[nav.length - 1]; nav.push({ v: "steps", s: top.s, g: top.g, u: +ub.dataset.unit }); render(); window.scrollTo(0, 0); return; }
    const stb = t.closest("[data-step]"); if (stb) { const top = nav[nav.length - 1]; startStep(top.s, top.g, top.u, +stb.dataset.step); return; }
    const gm = t.closest("[data-game]"); if (gm) { openGameMenu(gm.dataset.game); return; }
    const ga = t.closest("[data-g]"); if (ga) { if (ga.dataset.g === "rates") openRates(); else doGacha(+ga.dataset.g); return; }
    const ch = t.closest("[data-char]"); if (ch) { openChar(ch.dataset.char); return; }
    const bg = t.closest("[data-bg]"); if (bg) { state.look.bg = bg.dataset.bg; save(); render(); return; }
    const mr = t.closest("[data-maru]"); if (mr) { state.look.maru = mr.dataset.maru; save(); render(); bigMaru(); return; }
    const ti = t.closest("[data-title]"); if (ti) { state.look.title = ti.dataset.title; save(); render(); return; }
    const rd = t.closest("[data-rep-del]"); if (rd) { state.reports.splice(+rd.dataset.repDel, 1); save(); render(); return; }
    const ac = t.closest("[data-act]");
    if (ac) {
      const a = ac.dataset.act;
      if (a === "cont" && state.last) { const L = state.last; startStep(L.s, L.g, L.u, L.st); }
      else if (a === "gacha") { tab = "gacha"; render(); }
      else if (a === "rep-copy") copyText(reportText());
      else if (a === "rep-dl") download("hoshimanabi-reports-" + today() + ".json", JSON.stringify({ app: "ほしまなび", version: VERSION, exported: new Date().toISOString(), reports: state.reports }, null, 1));
      else if (a === "backup") download("hoshimanabi-backup-" + today() + ".json", JSON.stringify(state));
      else if (a === "restore") $("#restore-file").click();
      else if (a === "reset") { if (confirm("すべてのデータ（⭐・なかま・記録）を消します。よろしいですか？") && confirm("本当に消しますか？もとに戻せません。")) { state = fresh(); save(); render(); toast("データを消しました"); } }
    }
  });
  document.addEventListener("change", (e) => {
    const s = e.target.closest("[data-set]"); if (s) { state.settings[s.dataset.set] = s.checked; save(); return; }
    if (e.target.id === "nick") { state.settings.nick = e.target.value.trim().slice(0, 12); save(); return; }
    if (e.target.id === "restore-file") {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((txt) => { const d = JSON.parse(txt); if (!d || typeof d !== "object" || !d.chars) throw new Error("bad"); state = migrate(d); save(); render(); toast("バックアップから戻しました"); }).catch(() => toast("読みこめませんでした"));
    }
  });
  document.addEventListener("keydown", (e) => {
    if (!Q || $("#quiz").hidden) return;
    if (e.key === "Enter" && Q.answered) { next(); e.preventDefault(); }
  });
  // 日付が変わったら表示を更新（⭐は日ごとに0から）
  let lastDay = today();
  setInterval(() => { if (today() !== lastDay) { lastDay = today(); render(); } }, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && today() !== lastDay) { lastDay = today(); render(); } });

  // ---------- ゲーム一覧（50） ----------
  const GAMES = [
    { id: "climb", e: "🧗", n: "クライミング", c: "#6d8f5a", d: "左手・右手を交互に押して、CPUより先に頂上へ。落石に注意。" },
    { id: "chess", e: "♟️", n: "チェス", c: "#55606b", d: "キャスリングや昇格もある本格ルール。友だちとリンクで対戦も。" },
    { id: "arena", e: "⚔️", n: "アリーナバトル", c: "#b4664b", d: "ドラッグで動いて撃ち合う1対1。草むらに隠れて必殺技も。" },
    { id: "reversi", e: "⚫", n: "リバーシ", c: "#2e7d5b", d: "はさんで裏返す陣取り。角を取ると有利。" },
    { id: "gomoku", e: "⚪", n: "五目並べ", c: "#a8804f", d: "縦・横・ななめに5つ並べたら勝ち。" },
    { id: "shogi", e: "☗", n: "ミニ将棋", c: "#c9a227", d: "5×5の盤で遊ぶ将棋。取った駒は打てます。" },
    { id: "memory", e: "🃏", n: "神経衰弱", c: "#8a5cd6", d: "CPUと交代でめくって、同じ絵のペアを多く集めます。" },
    { id: "breakout", e: "🧱", n: "ブロック崩し", c: "#d9534f", d: "CPUより先にブロックを全部消せたら勝ち。" },
    { id: "mole", e: "🔨", n: "もぐらたたき", c: "#8d6e63", d: "出てきたもぐらをたたいて、CPUより高い点数を。" },
    { id: "runner", e: "🏃", n: "ランナー", c: "#ef8a3a", d: "タップでジャンプ。障害物をよけてCPUより先にゴール。" },
    { id: "g2048", e: "🔢", n: "2048", c: "#e0a030", d: "同じ数字を合体。CPUより少ない手数で目標の数字へ。" },
    { id: "sudoku", e: "🔠", n: "ナンプレ", c: "#3f8fd2", d: "縦・横・3×3に1〜9を1つずつ。CPUより先に解けたら勝ち。" },
    { id: "coin", e: "🪙", n: "コインパズル", c: "#c9a227", d: "同じコインを3つ並べて消す。CPUより高い得点で勝ち。" },
  ].concat((window.HMGames && HMGames.list) || []);
  window.HM_APP = { state: () => state, save, render, today, dkey, setClockOffset: (ms) => { clockOffset = ms; render(); }, GAMES, gachaPull, rates: () => ({ normal: GACHA_RATES.slice(), sr: GACHA_RATES_SR.slice() }), drawRarity, startStep, findStep, judgeNum, passNeed: HM.passNeed, STARS_TO_UNLOCK, READ_MS, starsToday, gamesOpen, pullsLeft, startGame, version: VERSION, quiz: () => Q };

  // テスト用：?clock=+86400000 のように時計をずらせる
  try { const c = new URLSearchParams(location.search).get("clock"); if (c) clockOffset = +c || 0; } catch (e) {}
  render();
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("./sw.js").catch(() => {});
})();
