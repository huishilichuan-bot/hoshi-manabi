/* ほしまなび — 勉強して⭐を集める学習アプリ（小1〜中3）。課金・お金の機能はありません。 */
(() => {
  "use strict";
  const VERSION = "1.1.0";
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
    { id: "boss1", n: "ボスハンター", ok: (c) => c.boss >= 1, how: "単元のボスに1回勝つ" },
    { id: "boss10", n: "ボスマスター", ok: (c) => c.boss >= 10, how: "10の単元でボスに勝つ" },
    { id: "boss50", n: "伝説のボスハンター", ok: (c) => c.boss >= 50, how: "50の単元でボスに勝つ" },
    { id: "box20", n: "ふくしゅう名人", ok: (c) => c.box >= 20, how: "まちがえた問題ボックスで20問クリア" },
    { id: "combo10", n: "コンボの星", ok: (c) => c.combo >= 10, how: "10問連続で正解" },
  ];

  // ---------- 保存 ----------
  function fresh() {
    return { schema: SCHEMA, created: now(), settings: { sound: true, haptic: true, nick: "", vol: 0.8 }, days: {}, totalStars: 0, pulls: 0, pullsUsed: 0,
      chars: { mori: { n: 1, shards: 0, star: 0, t: now() } }, partner: "mori", look: { bg: "note", maru: "red", title: "first" },
      progress: {}, last: null, reports: [], gachaLog: [], games: {}, wrongBox: [], bossWins: {}, boxCleared: 0, bestCombo: 0 };
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
  const titleCtx = () => ({ total: state.totalStars, maxR: maxRarity(), boss: Object.keys(state.bossWins || {}).length, box: state.boxCleared || 0, combo: state.bestCombo || 0 });

  // ---------- 音・振動・トースト ----------
  let actx = null;
  function tone(notes, type = "sine", vol = 0.18) {
    if (!state.settings.sound) return;
    const mv = state.settings.vol == null ? 0.8 : +state.settings.vol; if (mv <= 0.01) return; vol = Math.max(0.002, vol * mv);
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
    if (kind === "tap") return tone([[880, 0, 0.06]], "sine", 0.08);
    if (kind === "block") return tone([[220, 0, 0.12]], "square", 0.06);
    if (kind && kind.startsWith("r")) { const r = +kind.slice(1); const base = [523, 587, 659, 784, 880, 988, 1175]; const ns = []; for (let i = 0; i <= Math.min(6, r + 1); i++) ns.push([base[i] * (r >= 4 ? 1.5 : 1), i * 0.09, 0.3]); if (r >= 4) ns.push([2093, ns.length * 0.09, 0.8]); return tone(ns, r >= 5 ? "triangle" : "sine"); }
    return tone([[1568, 0, 0.09], [2093, 0.07, 0.32]]);
  }
  // 英語の読み上げ（iOS はタップの中でだけ話せるので、ボタンを押したときに読む）
  const canSpeak = () => typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
  function speak(text) {
    if (!canSpeak() || !text) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = 0.85;
      u.volume = Math.max(0.2, state.settings.vol == null ? 0.8 : +state.settings.vol);
      const vs = speechSynthesis.getVoices() || []; const v = vs.find((x) => /^en[-_]US/i.test(x.lang)) || vs.find((x) => /^en/i.test(x.lang)); if (v) u.voice = v;
      speechSynthesis.speak(u); return true;
    } catch (e) { return false; }
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
  let navDir = "tab";
  let nav = []; // 勉強タブの中の階層 [{v:"grades",s}, {v:"units",s,g}, {v:"steps",s,g,u}]
  function setTab(t) { if (t === tab && t === "study" && nav.length) { nav = []; navDir = "back"; } else navDir = "tab"; tab = t; if (t !== "study") nav = []; render(); window.scrollTo(0, 0); }
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
    m.classList.remove("page-in", "pg-fwd", "pg-back", "pg-tab"); void m.offsetWidth; m.classList.add("page-in", "pg-" + navDir); navDir = "fwd";
    if (tab === "home") m.innerHTML = viewHome();
    else if (tab === "study") { const r = viewStudy(); m.innerHTML = r.html; title = r.title; }
    else if (tab === "games") { m.innerHTML = viewGames(); title = "ゲーム"; }
    else if (tab === "gacha") { m.innerHTML = viewGacha(); title = "なかま"; }
    else if (tab === "settings") { m.innerHTML = viewSettings(); title = "マイページ"; }
    $("#top-title").textContent = title;
    $("#topbar").classList.toggle("large", !(tab === "study" && nav.length));
    const bl = $("#back-btn"); if (bl && !bl.hidden) { const pv = nav[nav.length - 2]; bl.innerHTML = '<span class="chev">‹</span>' + esc(!pv ? "学ぶ" : pv.v === "grades" ? subjById(pv.s).n : pv.v === "units" ? subjName(pv.s, pv.g) + gradeName(pv.g) : "もどる"); }
    mountPartner();
  }
  function charLevelFor(id) { const e = state.chars[id]; const s = e ? e.star || 0 : 0; return [5, 15, 15, 30, 30, 50][s]; }
  function charHtml(id, size, cls = "") { return '<div class="char ' + cls + '" style="width:' + size + "px;height:" + size + 'px">' + GCArt.charSvg(id, charLevelFor(id), { size }) + "</div>"; }
  function rarityTag(r) { const R = GCArt.RARITIES[r]; return '<span class="rtag r' + r + '" style="--rc:' + R.c + '">' + R.n + "</span>"; }
  function starMarks(n) { return n ? '<span class="cstars">' + "★".repeat(n) + "</span>" : ""; }
  const titleName = () => (TITLES.find((t) => t.id === state.look.title && t.ok(titleCtx())) || TITLES[0]).n;

  // ホーム
  const HOME_LINES = ["今日もいっしょにがんばろう！", "1ステップは約7分。まずは1つやってみよう。", "解説まで読むと、ぐっと分かるようになるよ。", "⭐を4つ集めたら、今日はゲームで遊ぼう！", "コツコツが最強。今日の1ステップから。"];
  const TAP_LINES = ["わっ！ びっくりした〜", "えへへ、くすぐったい！", "いっしょに⭐集めよう！", "今日はどの教科にする？", "がんばってるの、ちゃんと見てるよ！", "ゲームまであと少し！", "次のステップ、いけそう！", "ナイス！ その調子！"];
  function ringSvg(n, max) { const k = Math.min(1, n / max), C = 2 * Math.PI * 44; return '<svg class="ring2" viewBox="0 0 100 100"><defs><linearGradient id="rg-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd43b"/><stop offset="1" stop-color="#ff922b"/></linearGradient></defs><circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="10"/><circle class="ring-fg" cx="50" cy="50" r="44" fill="none" stroke="url(#rg-ring)" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - k)).toFixed(1) + '" transform="rotate(-90 50 50)"/></svg>'; }
  function viewHome() {
    const p = GCArt.charById(state.partner), n = starsToday(), e = state.chars[p.id] || {}, need = Math.max(0, STARS_TO_UNLOCK - n);
    const line = HOME_LINES[(new Date().getDate() + n) % HOME_LINES.length];
    let h = '<section class="hx r' + p.rarity + '"><div class="hx-bg"><i class="orb o1"></i><i class="orb o2"></i><i class="orb o3"></i><i class="sparkles"></i></div>' +
      '<div class="hx-top"><span class="chip-t">🏅 ' + esc(titleName()) + '</span><span class="chip-t">累計 ⭐ ' + state.totalStars + "</span></div>" +
      '<div class="hx-bubble" id="hx-bubble">' + esc(line) + "</div>" +
      '<button type="button" class="hx-stage" id="partner" aria-label="相棒にタッチ"><span class="hx-glow"></span><span class="hx-char">' + charHtml(p.id, 220, "r" + p.rarity) + '</span><span class="hx-shadow"></span></button>' +
      '<div class="hx-name"><b>' + esc(p.name) + "</b> " + rarityTag(p.rarity) + starMarks(e.star || 0) + "</div></section>";
    h += '<section class="today2"><div class="t2-ring">' + ringSvg(n, STARS_TO_UNLOCK) + '<div class="t2-num"><b>' + n + '</b><small>/' + STARS_TO_UNLOCK + '</small></div></div><div class="t2-r"><div class="t2-k">今日の⭐</div>' +
      (need ? '<div class="t2-big">ゲームまで あと <b>' + need + "</b> 個</div>" : '<div class="t2-big ok">🎮 ゲーム解放中！</div>') +
      '<div class="t2-stars">' + Array.from({ length: STARS_TO_UNLOCK }, (_, i) => '<span class="t2s ' + (i < n ? "on" : "") + '" style="--i:' + i + '">★</span>').join("") + (n > STARS_TO_UNLOCK ? '<span class="t2-more">+' + (n - STARS_TO_UNLOCK) + "</span>" : "") + "</div></div></section>";
    if ((state.wrongBox || []).length) h += '<button type="button" class="box-card" data-act="box"><span class="bx-i">📦</span><span class="grow"><b>まちがえた問題ボックス</b><small>' + state.wrongBox.length + " 問 ・ 正解すると消えるよ</small></span><span class=\"go\">▶</span></button>";
    if (state.last) {
      const L = state.last, st = findStep(L.s, L.g, L.u, L.st);
      if (st) h += '<button type="button" class="cont2" data-act="cont">' + HMIcons.icon(L.s, subjById(L.s).c, 46) + '<span class="grow"><b>つづきから学ぶ</b><span class="small">' + esc(subjName(L.s, L.g) + " " + gradeName(L.g) + " ／ " + st.unit.n + " ／ " + st.step.n) + '</span></span><span class="go">▶</span></button>';
    }
    h += '<div class="sec2">教科</div><div class="quick2">' + SUBJ.map((s, i) => '<button type="button" class="qb2" data-subj="' + s.id + '" style="--sc:' + s.c + ";--i:" + i + '">' + HMIcons.icon(s.id, s.c, 52) + "<b>" + esc(s.n) + "</b><small>" + (s.id === "life" ? "小1・小2" : s.id === "math" || s.id === "ja" ? "小1〜中3" : "小3〜中3") + "</small></button>").join("") + "</div>";
    if (pullsLeft()) h += '<button type="button" class="gacha2" data-act="gacha"><span class="g2-box">🎁</span><span class="grow"><b>ガチャを ' + pullsLeft() + ' 回ひけます</b><span class="small">新しいなかまに会いに行こう</span></span><span class="go">▶</span></button>';
    h += '<p class="foot">なかま ' + Object.keys(state.chars).length + "/" + GCArt.CHARACTERS.length + " ・ v" + VERSION + "</p>";
    return h;
  }
  function mountPartner() {
    const w = $("#partner"); if (!w) return;
    w.addEventListener("click", () => {
      const ch = w.querySelector(".hx-char"); ch.classList.remove("tap"); void ch.offsetWidth; ch.classList.add("tap");
      const b = $("#hx-bubble"); if (b) { b.textContent = TAP_LINES[Math.floor(Math.random() * TAP_LINES.length)]; b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
      sound("soft"); haptic(12);
      const r = w.getBoundingClientRect(); for (let i = 0; i < 7; i++) { const s = document.createElement("span"); s.className = "heart-p"; s.textContent = ["💖", "✨", "⭐", "💫"][i % 4]; s.style.left = r.left + r.width / 2 + "px"; s.style.top = r.top + r.height * 0.4 + "px"; s.style.setProperty("--dx", (Math.random() * 160 - 80).toFixed(0) + "px"); s.style.setProperty("--dy", (-60 - Math.random() * 90).toFixed(0) + "px"); document.body.appendChild(s); setTimeout(() => s.remove(), 1000); }
    });
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
      return { title: "学ぶ", html: (state.wrongBox && state.wrongBox.length ? '<button type="button" class="box-card" data-act="box"><span class="bx-i">📦</span><span class="grow"><b>まちがえた問題ボックス</b><small>' + state.wrongBox.length + " 問 ・ 正解すると消えるよ</small></span><span class=\"go\">▶</span></button>" : "") + '<p class="lead">教科をえらぼう</p><div class="subj-grid">' + SUBJ.map((s) => { const gs = gradesOf(s.id); return '<button type="button" class="subj" data-subj="' + s.id + '" style="--sc:' + s.c + '"><span class="se">' + HMIcons.icon(s.id, s.c, 54) + "</span><b>" + esc(s.n) + '</b><small>' + (gs.length ? gradeName(gs[0]) + "〜" + gradeName(gs[gs.length - 1]) : "") + "</small></button>"; }).join("") + "</div>" };
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
      const u = S()[top.s][top.g][top.u], tk = dayRec(today()).steps, sb = subjById(top.s);
      const n = u.steps.length, info = u.steps.map((st, si) => { const k = stepKey(top.s, top.g, top.u, si), p = state.progress[k]; return { st, si, p, star: !!tk[k], done: !!(p && p.passed) }; });
      let cur = info.findIndex((x) => !x.done); const allDone = cur < 0;
      const X = [50, 76, 50, 24], GAP = 108, H = (n + 1) * GAP + 90, bk = "boss|" + top.s + "|" + top.g + "|" + u.n, won = !!(state.bossWins || {})[bk];
      const pos = (i) => [X[i % 4], 70 + i * GAP];
      let path = "", pathDone = "";
      for (let i = 0; i < n; i++) { const [x1, y1] = pos(i), [x2, y2] = pos(i + 1); const seg = "M" + x1 + " " + y1 + " C" + x1 + " " + (y1 + GAP / 2) + " " + x2 + " " + (y2 - GAP / 2) + " " + x2 + " " + y2 + " "; path += seg; if (info[i].done && (i + 1 >= n || info[i + 1].done || i + 1 === cur)) pathDone += seg; }
      const done = info.filter((x) => x.done).length;
      let h = '<div class="map-head" style="--sc:' + sb.c + '">' + HMIcons.icon(top.s, sb.c, 40) + '<div class="grow"><small>' + esc(subjName(top.s, top.g) + " " + gradeName(top.g)) + "</small><b>" + esc(u.n) + '</b>' + bar(done, n) + '</div><span class="map-cnt num">' + done + "/" + n + "</span></div>";
      h += '<div class="smap" style="height:' + H + "px;--sc:" + sb.c + '"><svg class="smap-path" viewBox="0 0 100 ' + H + '" preserveAspectRatio="none"><path d="' + path + '" class="sp-all"/><path d="' + pathDone + '" class="sp-done"/></svg>';
      info.forEach((x) => { const [px, py] = pos(x.si); const isCur = x.si === cur; h += '<button type="button" class="map-node step ' + (x.done ? "done " : "") + (isCur ? "cur " : "") + (x.star ? "star" : "") + '" data-step="' + x.si + '" style="left:' + px + "%;top:" + py + 'px"><span class="mn-c">' + (x.star ? "⭐" : x.done ? "✓" : x.si + 1) + '</span><span class="mn-l"><b>' + esc(x.st.n) + "</b><small>" + stepQCount(x.st) + "問" + (x.p ? " ・ ベスト " + x.p.best + "/" + x.p.n : "") + "</small></span>" + (isCur ? '<span class="mn-here">' + charHtml(state.partner, 40) + "</span>" : "") + "</button>"; });
      const [bx, by] = pos(n);
      h += '<button type="button" class="map-node boss ' + (won ? "won " : "") + (allDone ? "cur" : "") + '" data-boss="1" style="left:' + bx + "%;top:" + by + 'px"><span class="mn-c">' + bossSvg(bossLook(top.s, top.g, top.u), 58) + (won ? '<i class="mn-crown">👑</i>' : "") + '</span><span class="mn-l"><b>ボスバトル</b><small>' + (won ? "クリア！ もう一度も OK" : "単元のまとめ問題") + "</small></span></button>";
      h += "</div>";
      if ((state.wrongBox || []).length) h += '<button type="button" class="box-card" data-act="box"><span class="bx-i">📦</span><span class="grow"><b>まちがえた問題ボックス</b><small>' + state.wrongBox.length + " 問 ・ 正解すると消えるよ</small></span><span class=\"go\">▶</span></button>";
      return { title: u.n, html: h };
    }
    return { title: "学ぶ", html: "" };
  }
  const bar = (d, t) => '<span class="pbar"><i style="width:' + (t ? Math.round((d / t) * 100) : 0) + '%"></i></span>';

  // ---------- クイズ ----------
  let Q = null, onAnswered = null;
  function startStep(s, g, ui, si, opt = {}) {
    const f = findStep(s, g, ui, si); if (!f) return;
    let qs;
    try { qs = HM.makeSet(f.step); } catch (e) { toast("問題を作れませんでした"); return; }
    if (!qs.length) return;
    Q = { s, g, ui, si, key: stepKey(s, g, ui, si), unit: f.unit, step: f.step, qs, i: 0, mode: "main", results: [], baseCorrect: 0, retryCorrect: 0, need: HM.passNeed(qs.length), n: qs.length, starGiven: false, shownAt: 0, answered: false, passOpen: true, combo: 0 };
    state.last = { s, g, u: ui, st: si }; save();
    $("#quiz").hidden = false; document.body.classList.add("in-quiz");
    if (opt.noCard) showQ(); else showCard();
  }
  function curList() { return Q.mode === "retry" ? Q.retry : Q.qs; }
  function showQ() {
    const list = curList(), q = list[Q.i];
    Q.answered = false; Q.input = "";
    const total = list.length;
    let h = '<div class="qz-head"><button type="button" class="qz-x" data-q="quit" aria-label="やめる">✕</button><div class="qz-prog"><i style="width:' + Math.round((Q.i / total) * 100) + '%"></i></div><span class="qz-n num">' + (Q.i + 1) + "/" + total + "</span></div>";
    h += comboHtml();
    h += '<div class="qz-body">';
    if (Q.mode === "boss") h += bossHtml();
    const src = q.__src || { s: Q.s, g: Q.g, sn: Q.step.n };
    h += '<div class="qz-meta">' + esc(subjName(src.s, src.g) + " " + gradeName(src.g) + " ／ " + src.sn) + (Q.mode === "retry" ? ' <span class="retry-tag">やり直し</span>' : Q.mode === "box" ? ' <span class="retry-tag box">📦 ボックス</span>' : Q.mode === "boss" ? ' <span class="retry-tag boss">👾 ボス</span>' : "") + "</div>";
    if (q.pass) h += '<details class="passage"' + (Q.passOpen ? " open" : "") + '><summary>📄 文章を読む</summary><div class="ptext">' + esc(q.pass).replace(/\n/g, "<br>") + "</div></details>";
    const say = sayText(q);
    if (q.listen) h += '<div class="qz-q">' + q.q + "</div>" + (canSpeak() ? '<button type="button" class="say-big" data-q="say"><span>🔊</span><b>タップして聞こう</b><small>何回でも聞けるよ</small></button>' : '<div class="say-text">' + esc(say) + "</div>");
    else h += '<div class="qz-q">' + q.q + (say && canSpeak() ? ' <button type="button" class="say-btn" data-q="say" aria-label="英語を聞く">🔊</button>' : "") + "</div>";
    if (q.t === "ch") h += '<div class="opts">' + (q.opts || [q.a].concat(q.o)).map((o, i) => '<button type="button" class="opt" data-opt="' + i + '">' + esc(o) + "</button>").join("") + "</div>";
    else if (q.t === "ord" || q.t === "match" || q.t === "pair" || q.t === "tap") h += workHtml(q);
    else h += '<div class="num-in"><div class="ans-box" id="ans-box"><span id="ans-val" class="num"></span><span class="caret"></span>' + (q.unit ? '<span class="ans-unit">' + esc(q.unit) + "</span>" : "") + "</div>" + keypad(q) + "</div>";
    h += '</div><div class="qz-foot" id="qz-foot"></div>';
    const el = $("#quiz");
    el.innerHTML = h;
    el.scrollTop = 0;
    Q.shownAt = performance.now();
    const pd = $(".passage", el); if (pd) pd.addEventListener("toggle", () => (Q.passOpen = pd.open));
    if (Q.work) renderWork();
  }
  // ---------- 新しい問題形式（並べかえ・線でつなぐ・カード合わせ・図をタップ） ----------
  const PAIR_COL = ["#ff6b6b", "#4dabf7", "#51cf66", "#fcc419", "#cc5de8", "#ff922b"];
  const rshuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function workHtml(q) {
    Q.work = null;
    if (q.t === "tap") return '<div class="tapfig">' + q.svg + '</div><p class="small muted center">図の中をタップしてこたえよう</p>';
    const n = q.t === "ord" ? q.items.length : q.pairs.length;
    let order = rshuf([...Array(n).keys()]); if (n > 1) for (let k = 0; k < 6 && order.every((v, i) => v === i); k++) order = rshuf(order);
    if (q.t === "ord") Q.work = { pick: [], pool: order };
    else if (q.t === "match") Q.work = { right: order, sel: null, link: {} };
    else { const cards = rshuf([...Array(n).keys()].flatMap((i) => [[i, 0], [i, 1]])); Q.work = { cards, sel: null, mate: {} }; }
    const hint = q.t === "ord" ? "タップした順にならぶよ（もう一度タップでもどす）" : q.t === "match" ? "左→右の順にタップして線でつなごう" : "同じ組になるカードを2まいずつタップしよう";
    return '<div class="work work-' + q.t + '" id="work"></div><p class="small muted center">' + hint + '</p><button type="button" class="btn primary block" data-q="submit" id="work-ok" disabled>こたえる</button>';
  }
  function workDone() { const w = Q.work, q = curList()[Q.i]; if (!w) return false; if (q.t === "ord") return w.pick.length === q.items.length; if (q.t === "match") return Object.keys(w.link).length === q.pairs.length; return Object.keys(w.mate).length === w.cards.length; }
  function renderWork() {
    const q = curList()[Q.i], w = Q.work, box = $("#work"); if (!box || !w) return;
    let h = "";
    if (q.t === "ord") {
      h += '<div class="ord-slots">' + q.items.map((_, k) => { const i = w.pick[k]; return '<button type="button" class="ord-slot ' + (i != null ? "on" : "") + '" data-os="' + k + '"><span class="ord-n">' + (k + 1) + "</span>" + (i != null ? esc(q.items[i]) : "") + "</button>"; }).join("") + "</div>";
      h += '<div class="ord-pool">' + w.pool.map((i) => w.pick.includes(i) ? '<span class="ord-chip ghost"></span>' : '<button type="button" class="ord-chip" data-ow="' + i + '">' + esc(q.items[i]) + "</button>").join("") + "</div>";
    } else if (q.t === "match") {
      const used = new Set(Object.values(w.link));
      h += '<div class="mt-cols"><div class="mt-col">' + q.pairs.map((p, i) => '<button type="button" class="mt-item L ' + (w.sel === i ? "sel " : "") + (w.link[i] != null ? "on" : "") + '" data-ml="' + i + '" style="--pc:' + (w.link[i] != null ? PAIR_COL[i % 6] : "transparent") + '">' + esc(p[0]) + "</button>").join("") + '</div><div class="mt-col">' + w.right.map((j) => { const li = Object.keys(w.link).find((k) => w.link[k] === j); return '<button type="button" class="mt-item R ' + (used.has(j) ? "on" : "") + '" data-mr="' + j + '" style="--pc:' + (li != null ? PAIR_COL[li % 6] : "transparent") + '">' + esc(q.pairs[j][1]) + "</button>"; }).join("") + '</div><svg class="mt-lines" id="mt-lines"></svg></div>';
    } else {
      h += '<div class="pc-grid">' + w.cards.map((c, k) => { const m = w.mate[k]; const g = m != null ? Math.min(k, m) : null; const gi = g != null ? Object.keys(w.mate).map(Number).filter((x) => x < w.mate[x]).sort((a, b) => a - b).indexOf(g) : -1; return '<button type="button" class="pc-card ' + (w.sel === k ? "sel " : "") + (m != null ? "on" : "") + '" data-pc="' + k + '" style="--pc:' + (gi >= 0 ? PAIR_COL[gi % 6] : "transparent") + '">' + esc(q.pairs[c[0]][c[1]]) + "</button>"; }).join("") + "</div>";
    }
    box.innerHTML = h;
    if (q.t === "match") drawLinks();
    const ok = $("#work-ok"); if (ok) ok.disabled = !workDone() || Q.answered;
  }
  function drawLinks(result) {
    const svg = $("#mt-lines"), w = Q.work; if (!svg) return; const r0 = svg.getBoundingClientRect(); let h = "";
    for (const [i, j] of Object.entries(w.link)) { const a = $('[data-ml="' + i + '"]').getBoundingClientRect(), b = $('[data-mr="' + j + '"]').getBoundingClientRect(); const col = result ? (+i === j ? "#2fb36a" : "#e5383b") : PAIR_COL[i % 6]; h += '<line x1="' + (a.right - r0.left) + '" y1="' + (a.top + a.height / 2 - r0.top) + '" x2="' + (b.left - r0.left) + '" y2="' + (b.top + b.height / 2 - r0.top) + '" stroke="' + col + '" stroke-width="4" stroke-linecap="round"/>'; }
    svg.innerHTML = h;
  }
  function workClick(t) {
    const q = curList()[Q.i], w = Q.work; if (!w || Q.answered) return false;
    let e;
    if ((e = t.closest("[data-ow]"))) { w.pick.push(+e.dataset.ow); sound("tap"); }
    else if ((e = t.closest("[data-os]"))) { const k = +e.dataset.os; if (w.pick[k] == null) return true; w.pick.splice(k, 1); }
    else if ((e = t.closest("[data-ml]"))) { const i = +e.dataset.ml; if (w.link[i] != null) { delete w.link[i]; w.sel = null; } else w.sel = w.sel === i ? null : i; }
    else if ((e = t.closest("[data-mr]"))) { const j = +e.dataset.mr; const owner = Object.keys(w.link).find((k) => w.link[k] === j); if (owner != null) delete w.link[owner]; else if (w.sel != null) { w.link[w.sel] = j; w.sel = null; sound("tap"); } else { toast("先に左をえらんでね"); return true; } }
    else if ((e = t.closest("[data-pc]"))) { const k = +e.dataset.pc; if (w.mate[k] != null) { const m = w.mate[k]; delete w.mate[k]; delete w.mate[m]; w.sel = null; } else if (w.sel == null) w.sel = k; else if (w.sel === k) w.sel = null; else { w.mate[k] = w.sel; w.mate[w.sel] = k; w.sel = null; sound("tap"); } }
    else return false;
    renderWork(); return true;
  }
  function workResult() {
    const q = curList()[Q.i], w = Q.work;
    if (q.t === "ord") { const text = w.pick.map((i) => q.items[i]).join(" → "); return { ok: text === q.items.join(" → "), text }; }
    if (q.t === "match") { const ok = q.pairs.every((_, i) => w.link[i] === i); return { ok, text: q.pairs.map((p, i) => p[0] + "－" + (w.link[i] != null ? q.pairs[w.link[i]][1] : "？")).join("、") }; }
    const ok = w.cards.every((c, k) => w.cards[w.mate[k]][0] === c[0]); return { ok, text: Object.keys(w.mate).map(Number).filter((k) => k < w.mate[k]).map((k) => q.pairs[w.cards[k][0]][w.cards[k][1]] + "－" + q.pairs[w.cards[w.mate[k]][0]][w.cards[w.mate[k]][1]]).join("、") };
  }
  function workShowResult(q, given) {
    const box = $("#work");
    if (q.t === "tap") { $$("[data-hit]").forEach((el) => { if (el.dataset.hit === q.ans) el.classList.add("hit-ok"); else if (el.dataset.hit === given) el.classList.add("hit-ng"); }); return; }
    if (!box) return; box.classList.add("done");
    if (q.t === "ord") $$(".ord-slot").forEach((el, k) => el.classList.add(q.items[Q.work.pick[k]] === q.items[k] ? "right" : "wrong"));
    if (q.t === "match") { $$(".mt-item.L").forEach((el) => { const i = +el.dataset.ml; el.classList.add(Q.work.link[i] === i ? "right" : "wrong"); }); drawLinks(true); }
    if (q.t === "pair") $$(".pc-card").forEach((el) => { const k = +el.dataset.pc, c = Q.work.cards[k]; el.classList.add(Q.work.cards[Q.work.mate[k]][0] === c[0] ? "right" : "wrong"); });
    const ok = $("#work-ok"); if (ok) ok.hidden = true;
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
    let ok, gtext = given;
    if (q.t === "ch") ok = given === q.a;
    else if (q.t === "tap") { ok = given === q.ans; const hl = (q.hits || []).find((x) => x[0] === given); gtext = hl ? hl[1] : given; }
    else if (given && typeof given === "object") { ok = given.ok; gtext = given.text; }
    else {
      const j = judgeNum(given, q.a);
      if (j.empty) { toast("答えを入れてね"); return; }
      if (j.reduce) { toast("おしい！ 値は同じだよ。答えの形（約分など）を見直してね"); return; }
      ok = j.ok;
    }
    Q.answered = true;
    if (Q.mode !== "retry") Q.results.push({ q, ok, given: gtext });
    else if (Q.mode === "retry") { Q.retryRes.push({ q, ok, given: gtext }); if (ok) Q.retryCorrect++; }
    afterAnswer(q, ok);
    if (typeof onAnswered === "function") onAnswered(q, ok);
    if (ok && Q.mode === "main") Q.baseCorrect++;
    // 画面
    if (q.t === "ch") $$(".opt").forEach((b) => { const v = (q.opts || [q.a].concat(q.o))[+b.dataset.opt]; b.disabled = true; if (v === q.a) b.classList.add("right"); else if (v === given) b.classList.add("wrong"); });
    else if (q.t === "num") { const box = $("#ans-box"); box.classList.add(ok ? "right" : "wrong"); $$(".key").forEach((k) => (k.disabled = true)); }
    else workShowResult(q, given);
    if (ok) { bigMaru(); burstAt(innerWidth / 2, innerHeight * 0.42, 22); sound("pikon"); haptic(15); if (Q.mode === "boss") setTimeout(bossHit, 280); comboFx(); } else { sound("miss"); haptic([20, 40, 20]); }
    const cg = $("#combo"); if (cg) cg.outerHTML = comboHtml();
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
  function burstAt(x, y, n) {
    const cols = ["#ff5fa2", "#ffd43b", "#22d3ee", "#8b5cf6", "#51cf66", "#ff922b"];
    for (let i = 0; i < (n || 18); i++) { const p = document.createElement("span"); p.className = "maru-burst"; const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 110; p.style.left = x + "px"; p.style.top = y + "px"; p.style.background = cols[i % cols.length]; p.style.setProperty("--dx", (Math.cos(a) * r).toFixed(0) + "px"); p.style.setProperty("--dy", (Math.sin(a) * r).toFixed(0) + "px"); document.body.appendChild(p); setTimeout(() => p.remove(), 750); }
  }
  function confetti(n) {
    const cols = ["#ff5fa2", "#ffd43b", "#22d3ee", "#8b5cf6", "#51cf66", "#ff922b"];
    for (let i = 0; i < (n || 60); i++) { const p = document.createElement("span"); p.className = "confetti-p"; p.style.left = Math.random() * 100 + "vw"; p.style.background = cols[i % cols.length]; p.style.animationDuration = (1.6 + Math.random() * 1.4).toFixed(2) + "s"; p.style.animationDelay = (Math.random() * 0.5).toFixed(2) + "s"; p.style.setProperty("--dx", (Math.random() * 120 - 60).toFixed(0) + "px"); p.style.setProperty("--rot", (Math.random() * 900 - 450).toFixed(0) + "deg"); document.body.appendChild(p); setTimeout(() => p.remove(), 3600); }
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
    if (Q.mode === "boss" && Q.hp <= 0) { finishRound(); return; }
    if (Q.i + 1 < list.length) { Q.i++; showQ(); return; }
    finishRound();
  }
  function finishRound() {
    if (Q.mode === "box") return boxSummary();
    if (Q.mode === "boss") return bossSummary();
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
    if (!(Q && Q.starDup)) { confetti(50); burstAt(innerWidth / 2, innerHeight * 0.45, 26); haptic([20, 30, 50]); }
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
  // ---------- v1.2 まとめカード ----------
  const CARD_LINES = ["今日のポイントはこれ！ れいを見てからいこう。", "まずはここをおさえよう。", "れいの考え方をまねすれば大丈夫！", "ポイントを見たら、さっそくチャレンジ！", "ここが分かれば、ぐっと楽になるよ。"];
  function exampleFor(step, qs) {
    try {
      if (typeof step.src === "function") { for (let t = 0; t < 30; t++) { const c = step.src(0.3, 1); if (c && !qs.some((q) => q.q === c.q && q.a === c.a)) return c; } return null; }
      const all = step.src.map((x) => (typeof x === "string" ? HM.parseBankLine(x) : x));
      const unused = all.filter((c) => !qs.some((q) => q.q === c.q && q.a === c.a));
      return (unused.length ? unused : all)[Math.floor(Math.random() * (unused.length || all.length))];
    } catch (e) { return null; }
  }
  function exAnswer(c) {
    if (c.t === "ord") return c.items.join(" → ");
    if (c.t === "match" || c.t === "pair") return c.pairs.map((p) => p[0] + "－" + p[1]).join("、");
    return c.a + (c.unit && c.t !== "ch" ? c.unit : "");
  }
  function showCard() {
    const p = GCArt.charById(state.partner), c = exampleFor(Q.step, Q.qs), sb = subjById(Q.s);
    const pts = (HM.POINTS && (HM.POINTS[Q.unit.n + "/" + Q.step.n] || HM.POINTS[Q.unit.n])) || "";
    let h = '<div class="qz-head"><button type="button" class="qz-x" data-q="quit" aria-label="やめる">✕</button><div class="qz-prog"><i style="width:0%"></i></div><span class="qz-n num">0/' + Q.n + "</span></div>";
    h += '<div class="card-pt" style="--sc:' + sb.c + '"><div class="cp-head">' + HMIcons.icon(Q.s, sb.c, 40) + '<div><small>' + esc(subjName(Q.s, Q.g) + " " + gradeName(Q.g) + " ／ " + Q.unit.n) + "</small><b>" + esc(Q.step.n) + '</b></div></div><div class="cp-tag">💡 今日のポイント</div>';
    if (pts) h += '<p class="cp-pt">' + esc(pts) + "</p>";
    if (c) { const cq = c.t === "tap" ? String(c.q).replace(/data-hit=/g, "data-x=") + (c.svg || "").replace(/data-hit=/g, "data-x=") : c.q; h += '<div class="cp-ex"><div class="cp-k">れい</div><div class="cp-q">' + (c.listen ? esc(c.say || "") : cq) + '</div><div class="cp-a">こたえ：<b>' + esc(exAnswer(c)) + '</b></div><div class="cp-why">' + esc(c.ex || "").replace(/\n/g, "<br>") + "</div></div>"; }
    h += '<div class="cp-char">' + charHtml(p.id, 84, "bob r" + p.rarity) + '<div class="bubble">' + esc(CARD_LINES[Math.floor(Math.random() * CARD_LINES.length)]) + "</div></div>";
    h += '<div class="cp-info">' + Q.n + "問 ・ 約" + STEP_MIN + "分 ・ " + Q.need + "問正解で⭐</div>";
    h += '<button type="button" class="btn primary block big" data-q="card-go">はじめる ▶</button></div>';
    Q.card = true; const el = $("#quiz"); el.innerHTML = h; el.scrollTop = 0;
  }
  // ---------- v1.2 コンボ ----------
  const comboNext = (n) => (n < 3 ? 3 : n < 5 ? 5 : n < 10 ? 10 : (Math.floor(n / 5) + 1) * 5);
  const comboPrev = (n) => (n < 3 ? 0 : n < 5 ? 3 : n < 10 ? 5 : Math.floor(n / 5) * 5);
  function comboHtml() {
    const n = (Q && Q.combo) || 0, a = comboPrev(n), b = comboNext(n), k = Math.round(((n - a) / (b - a)) * 100);
    return '<div class="combo ' + (n >= 10 ? "lv3" : n >= 5 ? "lv2" : n >= 3 ? "lv1" : "") + '" id="combo"><span class="cb-f">🔥</span><span class="cb-g"><i style="width:' + k + '%"></i></span><span class="cb-n num">' + (n ? n + " コンボ" : "コンボ") + "</span></div>";
  }
  function afterAnswer(q, ok) {
    Q.combo = ok ? (Q.combo || 0) + 1 : 0;
    if (Q.combo > (state.bestCombo || 0)) state.bestCombo = Q.combo;
    if (!ok && Q.mode !== "box") boxAdd(q);
    if (ok && (Q.mode === "box" || Q.mode === "retry")) { if (boxRemove(q) && Q.mode === "box") Q.cleared = (Q.cleared || 0) + 1; }
    save();
  }
  function comboFx() {
    const n = Q.combo; if (!(n === 3 || n === 5 || n === 10 || (n > 10 && n % 5 === 0))) return;
    const lv = n >= 10 ? 3 : n >= 5 ? 2 : 1;
    const fx = $("#fx-root"), d = document.createElement("div");
    d.className = "combo-pop lv" + lv; d.innerHTML = "<b>" + n + "</b><span>コンボ！</span>" + (lv >= 2 ? "<i>🔥</i>" : "");
    fx.appendChild(d); setTimeout(() => d.remove(), 1400 + lv * 200);
    setTimeout(() => { sound("r" + Math.min(6, lv + 1)); burstAt(innerWidth / 2, innerHeight * 0.3, 14 + lv * 12); if (lv === 3) confetti(60); haptic(lv === 3 ? [20, 30, 20, 30, 60] : [15, 25, 15]); }, 250);
    if (lv === 3) { document.body.classList.remove("combo-flash"); void document.body.offsetWidth; document.body.classList.add("combo-flash"); setTimeout(() => document.body.classList.remove("combo-flash"), 900); }
  }
  // ---------- v1.2 まちがえた問題ボックス ----------
  const boxKey = (s, g, un, q) => s + "|" + g + "|" + un + "|" + strip(q.q).slice(0, 120) + "|" + q.a;
  function boxAdd(q) {
    const src = q.__src || { s: Q.s, g: Q.g, un: Q.unit.n, sn: Q.step.n };
    const k = q.__k || boxKey(src.s, src.g, src.un, q);
    state.wrongBox = state.wrongBox || [];
    if (state.wrongBox.some((x) => x.k === k)) return;
    const c = Object.assign({}, q); delete c.opts; delete c.__src; delete c.__k;
    state.wrongBox.push({ k, s: src.s, g: src.g, un: src.un, sn: src.sn, q: c, t: now() });
    while (state.wrongBox.length > 150) state.wrongBox.shift();
  }
  function boxRemove(q) {
    const src = q.__src || { s: Q.s, g: Q.g, un: Q.unit ? Q.unit.n : "" };
    const k = q.__k || boxKey(src.s, src.g, src.un, q);
    const i = (state.wrongBox || []).findIndex((x) => x.k === k); if (i < 0) return false;
    state.wrongBox.splice(i, 1); return true;
  }
  function startBox() {
    const b = state.wrongBox || []; if (!b.length) { toast("ボックスはからっぽ！ 全部クリアしてるよ"); return; }
    const pickN = HM.U.shuf(b.slice()).slice(0, 10);
    const qs = pickN.map((x) => Object.assign({}, x.q, { __k: x.k, __src: { s: x.s, g: x.g, un: x.un, sn: x.sn }, opts: x.q.t === "ch" ? HM.U.shuf([x.q.a].concat(x.q.o)) : undefined }));
    Q = { s: pickN[0].s, g: pickN[0].g, ui: null, si: null, key: null, unit: { n: "" }, step: { n: "まちがえた問題ボックス" }, qs, i: 0, mode: "box", results: [], baseCorrect: 0, need: 0, n: qs.length, shownAt: 0, answered: false, passOpen: true, combo: 0, cleared: 0 };
    $("#quiz").hidden = false; document.body.classList.add("in-quiz"); showQ();
  }
  function boxSummary() {
    const p = GCArt.charById(state.partner), cl = Q.cleared || 0, left = (state.wrongBox || []).length;
    state.boxCleared = (state.boxCleared || 0) + cl; save();
    const line = cl === Q.n ? "全部クリア！ にがてを1つずつ消していくの、かっこいい！" : cl ? cl + "問クリア！ 前にまちがえた問題ができるようになったね！" : "いっしょに解説を読んで、またチャレンジしよう！";
    let h = '<div class="sum"><div class="box-hero"><div class="bx-ico">📦</div><div class="bx-t">ボックスから <b class="num">' + cl + "</b> 問クリア</div><div class=\"small muted\">のこり " + left + " 問 ・ これまでのクリア " + state.boxCleared + " 問</div></div>";
    h += '<div class="sum-char">' + charHtml(p.id, 110, "bob r" + p.rarity) + '<div class="bubble">' + esc(line) + "</div></div>";
    h += '<div class="sum-act">' + (left ? '<button type="button" class="btn primary block" data-q="box-again">📦 つづけてボックスの問題</button>' : "") + '<button type="button" class="btn ghost block" data-q="quit">もどる</button></div></div>';
    $("#quiz").innerHTML = h; $("#quiz").scrollTop = 0;
    if (cl) { confetti(cl === Q.n ? 60 : 24); sound(cl === Q.n ? "fanfare" : "soft"); }
  }
  // ---------- v1.2 ボス ----------
  const BOSS_NAMES = ["モヤモヤン", "ナゾナゾドン", "ムズカシーガ", "ウッカリング", "ワスレーヌ", "マチガイーダ", "ハテナゴン", "ヨミトバシー"];
  function bossLook(s, g, ui) { let hsh = 0; const k = s + g + ui; for (let i = 0; i < k.length; i++) hsh = (hsh * 31 + k.charCodeAt(i)) >>> 0; return { hue: hsh % 360, name: BOSS_NAMES[hsh % BOSS_NAMES.length], v: hsh % 3 }; }
  function bossSvg(L, size) {
    const c = "hsl(" + L.hue + ",70%,58%)", d = "hsl(" + L.hue + ",60%,38%)", l = "hsl(" + ((L.hue + 40) % 360) + ",85%,78%)";
    const horns = L.v === 0 ? '<path d="M38 34 L30 8 L50 28Z M82 34 L90 8 L70 28Z" fill="' + l + '" stroke="' + d + '" stroke-width="3" stroke-linejoin="round"/>' : L.v === 1 ? '<circle cx="34" cy="22" r="9" fill="' + l + '" stroke="' + d + '" stroke-width="3"/><circle cx="86" cy="22" r="9" fill="' + l + '" stroke="' + d + '" stroke-width="3"/>' : '<path d="M60 6 L68 28 L52 28Z" fill="' + l + '" stroke="' + d + '" stroke-width="3" stroke-linejoin="round"/>';
    return '<svg viewBox="0 0 120 120" width="' + size + '" height="' + size + '" class="boss-svg">' + horns + '<path d="M18 70 C18 36 40 24 60 24 C80 24 102 36 102 70 C102 98 86 110 60 110 C34 110 18 98 18 70Z" fill="' + c + '" stroke="' + d + '" stroke-width="4"/><path d="M10 74 L22 66 L22 86Z M110 74 L98 66 L98 86Z" fill="' + c + '" stroke="' + d + '" stroke-width="3" stroke-linejoin="round"/><ellipse cx="60" cy="88" rx="26" ry="14" fill="' + l + '" opacity=".55"/><ellipse cx="45" cy="60" rx="10" ry="12" fill="#fff" stroke="' + d + '" stroke-width="2.5"/><ellipse cx="75" cy="60" rx="10" ry="12" fill="#fff" stroke="' + d + '" stroke-width="2.5"/><circle cx="47" cy="62" r="5" fill="#222"/><circle cx="73" cy="62" r="5" fill="#222"/><path d="M36 46 L54 52 M84 46 L66 52" stroke="' + d + '" stroke-width="4" stroke-linecap="round"/><path d="M46 82 Q60 92 74 82" fill="none" stroke="' + d + '" stroke-width="3.5" stroke-linecap="round"/><path d="M52 85 L55 91 L58 86 M62 86 L65 91 L68 85" fill="#fff" stroke="' + d + '" stroke-width="1.5"/></svg>';
  }
  function bossHtml() {
    const L = bossLook(Q.s, Q.g, Q.ui), k = Math.max(0, Q.hp) / Q.maxHp;
    return '<div class="boss-panel ' + (Q.hp <= 0 ? "down" : "") + '" id="boss-panel"><div class="bp-mon" id="bp-mon">' + bossSvg(L, 96) + '</div><div class="bp-r"><b>' + esc(L.name) + '</b><div class="bp-hp"><i id="bp-hp" style="width:' + Math.round(k * 100) + '%"></i></div><small class="num">HP ' + Math.max(0, Q.hp) + " / " + Q.maxHp + "</small></div></div>";
  }
  function bossHit() {
    if (!Q || Q.mode !== "boss") return;
    Q.hp = Math.max(0, Q.hp - 1);
    const mon = $("#bp-mon"), bar = $("#bp-hp"), pn = $("#boss-panel"); if (!mon) return;
    const r = mon.getBoundingClientRect(), fx = $("#fx-root");
    const shot = document.createElement("div"); shot.className = "boss-shot"; shot.textContent = "⭐";
    shot.style.left = innerWidth / 2 + "px"; shot.style.top = innerHeight * 0.62 + "px"; shot.style.setProperty("--tx", (r.left + r.width / 2 - innerWidth / 2) + "px"); shot.style.setProperty("--ty", (r.top + r.height / 2 - innerHeight * 0.62) + "px");
    fx.appendChild(shot); setTimeout(() => shot.remove(), 520);
    setTimeout(() => {
      mon.classList.remove("hit"); void mon.offsetWidth; mon.classList.add("hit");
      if (bar) bar.style.width = Math.round((Q.hp / Q.maxHp) * 100) + "%";
      const sm = $("#boss-panel small"); if (sm) sm.textContent = "HP " + Q.hp + " / " + Q.maxHp;
      const dmg = document.createElement("div"); dmg.className = "boss-dmg"; dmg.textContent = "ヒット！"; dmg.style.left = r.left + r.width / 2 + "px"; dmg.style.top = r.top + "px"; fx.appendChild(dmg); setTimeout(() => dmg.remove(), 900);
      burstAt(r.left + r.width / 2, r.top + r.height / 2, 16); sound("tap"); haptic([10, 20, 30]);
      if (Q.hp <= 0) { pn && pn.classList.add("down"); sound("fanfare"); confetti(70); const nb = $('[data-q="next"]'); if (nb) nb.textContent = "ボスをたおした！ ›"; }
    }, 480);
  }
  function startBoss(s, g, ui) {
    const u = (S()[s] || {})[g] && S()[s][g][ui]; if (!u) return;
    let pool = [];
    u.steps.forEach((st) => { try { const set = HM.makeSet(st); pool.push(...set.slice(-2)); } catch (e) {} });
    if (pool.length < 6) u.steps.forEach((st) => { try { pool.push(...HM.makeSet(st).slice(0, 3)); } catch (e) {} });
    const seen = new Set(); pool = HM.U.shuf(pool).filter((q) => { const k = q.q + "|" + q.a; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 10);
    if (!pool.length) return;
    pool.forEach((q) => { if (q.t === "ch") q.opts = HM.U.shuf([q.a].concat(q.o)); });
    const need = HM.passNeed(pool.length);
    Q = { s, g, ui, si: null, key: "boss|" + s + "|" + g + "|" + u.n, unit: u, step: { n: "ボスバトル" }, qs: pool, i: 0, mode: "boss", results: [], baseCorrect: 0, need, n: pool.length, hp: need, maxHp: need, shownAt: 0, answered: false, passOpen: true, combo: 0 };
    $("#quiz").hidden = false; document.body.classList.add("in-quiz");
    const L = bossLook(s, g, ui);
    $("#quiz").innerHTML = '<div class="boss-intro"><div class="bi-mon">' + bossSvg(L, 150) + '</div><b>' + esc(L.name) + ' があらわれた！</b><small>' + esc(u.n) + ' のまとめ問題 ・ ' + pool.length + '問 ・ ' + need + 'ヒットでたおせる</small><span class="spinner"></span></div>';
    sound("block"); setTimeout(() => { if (Q && Q.mode === "boss" && Q.i === 0 && !Q.answered) showQ(); }, 1100);
  }
  function bossSummary() {
    const p = GCArt.charById(state.partner), L = bossLook(Q.s, Q.g, Q.ui), win = Q.hp <= 0, first = win && !(state.bossWins || {})[Q.key];
    if (win) { state.bossWins = state.bossWins || {}; state.bossWins[Q.key] = state.bossWins[Q.key] || today(); save(); }
    const nw = Object.keys(state.bossWins || {}).length;
    const line = win ? (first ? "やったー！ " + L.name + "をたおしたよ！ この単元、もうバッチリだね！" : "また勝った！ 強すぎる！") : "あと " + Q.hp + " ヒットだった！ 解説を読んで、もう一回いこう！";
    let h = '<div class="sum"><div class="boss-end ' + (win ? "win" : "") + '"><div class="be-mon">' + bossSvg(L, 120) + (win ? '<span class="be-crown">👑</span>' : "") + '</div><div class="be-t">' + (win ? "ボスをたおした！" : L.name + "とのバトル") + "</div>";
    h += '<div class="small muted">' + esc(subjName(Q.s, Q.g) + " " + gradeName(Q.g) + " ／ " + Q.unit.n) + "</div>";
    if (win) h += '<div class="be-prize">🏆 単元マップにかんむりがつきました' + (nw === 1 ? "<br>称号「ボスハンター」がえらべるようになったよ" : nw === 10 ? "<br>称号「ボスマスター」がえらべるようになったよ" : "") + "</div>";
    h += "</div>";
    h += '<div class="sum-char">' + charHtml(p.id, 110, "bob r" + p.rarity) + '<div class="bubble">' + esc(line) + "</div></div>";
    h += '<div class="sum-act"><button type="button" class="btn ' + (win ? "" : "primary") + ' block" data-q="boss-again">👾 もう一度ボスと戦う</button><button type="button" class="btn ghost block" data-q="quit">マップにもどる</button></div>';
    if (Q.results.length) h += '<details class="review"><summary>問題をふりかえる</summary>' + Q.results.map((r, i) => '<div class="rv ' + (r.ok ? "ok" : "ng") + '"><b>' + (i + 1) + ". " + (r.ok ? "⭕" : "✖") + '</b> <span class="rq">' + strip(r.q.q).slice(0, 80) + "</span><br><span class=\"small\">正解：" + esc(r.q.a) + "</span></div>").join("") + "</details>";
    h += "</div>";
    $("#quiz").innerHTML = h; $("#quiz").scrollTop = 0;
    if (win) { confetti(80); sound("fanfare"); }
  }
  function sayText(q) { return q.say || (typeof q.en === "string" && /^[A-Za-z][A-Za-z .,'?!-]*$/.test(q.en) ? q.en : null); }
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
    try { if (canSpeak()) speechSynthesis.cancel(); } catch (e) {}
    if (Q && Q.ui != null) { nav = [{ v: "grades", s: Q.s }, { v: "units", s: Q.s, g: Q.g }, { v: "steps", s: Q.s, g: Q.g, u: Q.ui }]; tab = "study"; navDir = "back"; }
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
    h += '<div class="app-grid">' + GAMES.map((g, i) => '<button type="button" class="app-ic ' + (open ? "" : "locked") + '" data-game="' + g.id + '" style="--i:' + (i % 24) + '"><span class="ai">' + HMIcons.icon(g.id, g.c, 62) + (g.pro ? '<span class="newb">NEW</span>' : "") + (open ? "" : '<span class="lock">🔒</span>') + "</span><span class=\"an\">" + esc(g.n) + "</span></button>").join("") + "</div>";
    h += '<p class="foot">全' + GAMES.length + 'ゲーム</p>';
    return h;
  }
  function openGameMenu(id) {
    const g = GAMES.find((x) => x.id === id); if (!g) return;
    if (!gamesOpen()) { toast("🔒 今日の⭐をあと " + (STARS_TO_UNLOCK - starsToday()) + " こ集めるとひらくよ"); return; }
    const rec = state.games[id] || {};
    openSheet('<div class="gm-head">' + HMIcons.icon(g.id, g.c, 56) + "<h2>" + esc(g.n) + '</h2></div><p class="small muted">' + esc(g.d) + '</p><div class="diff-list">' + DIFFS.map((d) => { const r = rec[d.id] || { plays: 0, wins: 0 }; return '<button type="button" class="diff-btn ' + d.id + '" data-diff="' + d.id + '"><span class="grow"><b>' + d.name + "</b><small>" + DIFF_DESC[d.id] + '</small></span><span class="diff-r num">' + (r.wins || 0) + "勝/" + (r.plays || 0) + "回</span></button>"; }).join("") + "</div>", {
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
    box.innerHTML = '<div class="res-card" role="dialog" aria-label="結果"><div class="res-emoji">' + (o.win ? "🏆" : o.draw ? "🤝" : "🌧️") + "</div><h3>" + esc(o.title) + "</h3><p>" + esc(o.text || "") + '</p><div class="actions two"><button type="button" class="btn" id="res-close">ゲーム一覧へ</button><button type="button" class="btn primary" id="res-retry">もう一回</button></div></div>';
    box.hidden = false;
    $("#res-close").addEventListener("click", closeLayer);
    $("#res-retry").addEventListener("click", () => { box.hidden = true; if (o.onRetry) o.onRetry(); });
    if (o.win) { sound("fanfare"); confetti(70); haptic([30, 40, 60]); }
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
    const p = GCArt.charById(state.partner), nb = Object.keys(state.bossWins || {}).length, nd = Object.values(state.progress).filter((x) => x.passed).length;
    let h = '<div class="me-card">' + charHtml(p.id, 72, "r" + p.rarity) + '<div class="grow"><b class="me-n">' + esc(state.settings.nick || "なまえ未設定") + '</b><span class="chip-t">🏅 ' + esc(titleName()) + "</span></div></div>";
    h += '<div class="me-stats"><div><b class="num">' + state.totalStars + "</b><small>累計⭐</small></div><div><b class=\"num\">" + nd + "</b><small>合格ステップ</small></div><div><b class=\"num\">" + nb + "</b><small>ボス撃破</small></div><div><b class=\"num\">" + (state.bestCombo || 0) + "</b><small>最高コンボ</small></div></div>";
    if ((state.wrongBox || []).length) h += '<button type="button" class="box-card" data-act="box"><span class="bx-i">📦</span><span class="grow"><b>まちがえた問題ボックス</b><small>' + state.wrongBox.length + " 問 ・ これまでのクリア " + (state.boxCleared || 0) + ' 問</small></span><span class="go">▶</span></button>';
    h += '<div class="sec">設定</div>';
    h += '<div class="card set"><label class="sw"><span>🔈 音量</span><input type="range" min="0" max="1" step="0.1" id="vol" value="' + (state.settings.vol == null ? 0.8 : state.settings.vol) + '"></label>';
    h += '<label class="sw"><span>効果音（ピコーンなど）</span><input type="checkbox" data-set="sound" ' + (state.settings.sound ? "checked" : "") + '></label><label class="sw"><span>振動（対応している端末のみ）</span><input type="checkbox" data-set="haptic" ' + (state.settings.haptic ? "checked" : "") + '></label><label class="field"><span>なまえ（マイページとチェスの友だち対戦で表示）</span><input class="input" id="nick" maxlength="12" value="' + esc(state.settings.nick) + '"></label></div>';
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
    if (t.closest("button")) haptic(6);
    if (t.closest("#back-btn")) { nav.pop(); navDir = "back"; render(); window.scrollTo(0, 0); return; }
    if (t.closest("#gl-close")) { closeLayer(); return; }
    // クイズ
    if (t.closest("#quiz")) {
      const o = t.closest("[data-opt]"); if (o && Q) { const q = curList()[Q.i]; answer((q.opts || [q.a].concat(q.o))[+o.dataset.opt]); return; }
      if (Q && Q.card) { const cb = t.closest("[data-q]"); if (cb && cb.dataset.q === "card-go") { Q.card = false; showQ(); } else if (cb && cb.dataset.q === "quit") quitQuiz(); return; }
      if (Q && !Q.answered) { const hit = t.closest("[data-hit]"); if (hit && curList()[Q.i].t === "tap") { answer(hit.dataset.hit); return; } if (workClick(t)) return; }
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
      if (act === "say") { const q = curList()[Q.i]; speak(sayText(q)); a.classList.remove("on"); void a.offsetWidth; a.classList.add("on"); return; }
      if (act === "box-again") { startBox(); return; }
      if (act === "boss-again") { const b = [Q.s, Q.g, Q.ui]; startBoss(...b); return; }
      if (act === "submit") { if (!Q.answered && workDone()) answer(workResult()); }
      else if (act === "next") next();
      else if (act === "ex") { const w = $(".ex-wrap"); w.hidden = !w.hidden; a.textContent = w.hidden ? "💡 解説を見る" : "解説をとじる"; }
      else if (act === "report") reportQ();
      else if (act === "retry") startRetry();
      else if (act === "again") { const s = [Q.s, Q.g, Q.ui, Q.si]; startStep(...s, { noCard: true }); }
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
    const bb = t.closest("[data-boss]"); if (bb) { const top = nav[nav.length - 1]; startBoss(top.s, top.g, top.u); return; }
    const stb = t.closest("[data-step]"); if (stb) { const top = nav[nav.length - 1]; startStep(top.s, top.g, top.u, +stb.dataset.step); return; }
    const gm = t.closest("[data-game]"); if (gm) { openGameMenu(gm.dataset.game); return; }
    const ga = t.closest("[data-g]"); if (ga) { if (ga.dataset.g === "rates") openRates(); else doGacha(+ga.dataset.g); return; }
    const ch = t.closest("[data-char]"); if (ch) { openChar(ch.dataset.char); return; }
    const bg = t.closest("button[data-bg]"); if (bg) { state.look.bg = bg.dataset.bg; save(); render(); return; }
    const mr = t.closest("button[data-maru]"); if (mr) { state.look.maru = mr.dataset.maru; save(); render(); bigMaru(); return; }
    const ti = t.closest("[data-title]"); if (ti) { state.look.title = ti.dataset.title; save(); render(); return; }
    const rd = t.closest("[data-rep-del]"); if (rd) { state.reports.splice(+rd.dataset.repDel, 1); save(); render(); return; }
    const ac = t.closest("[data-act]");
    if (ac) {
      const a = ac.dataset.act;
      if (a === "cont" && state.last) { const L = state.last; startStep(L.s, L.g, L.u, L.st); }
      else if (a === "gacha") { tab = "gacha"; render(); }
      else if (a === "box") startBox();
      else if (a === "rep-copy") copyText(reportText());
      else if (a === "rep-dl") download("hoshimanabi-reports-" + today() + ".json", JSON.stringify({ app: "ほしまなび", version: VERSION, exported: new Date().toISOString(), reports: state.reports }, null, 1));
      else if (a === "backup") download("hoshimanabi-backup-" + today() + ".json", JSON.stringify(state));
      else if (a === "restore") $("#restore-file").click();
      else if (a === "reset") { if (confirm("すべてのデータ（⭐・なかま・記録）を消します。よろしいですか？") && confirm("本当に消しますか？もとに戻せません。")) { state = fresh(); save(); render(); toast("データを消しました"); } }
    }
  });
  document.addEventListener("change", (e) => {
    const s = e.target.closest("[data-set]"); if (s) { state.settings[s.dataset.set] = s.checked; save(); return; }
    if (e.target.id === "vol") { state.settings.vol = +e.target.value; save(); sound("tap"); return; }
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
  const DROPPED = ["stroop", "calcbattle", "highlow", "nim", "hitblow", "memgrid", "pk", "shooter"];
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
  ];
  (() => { const ext = ((window.HMGames && HMGames.list) || []).filter((g) => !DROPPED.includes(g.id)); for (let i = 0; i < GAMES.length; i++) { const r = ext.find((x) => x.id === GAMES[i].id); if (r) GAMES[i] = r; } ext.forEach((x) => { if (!GAMES.some((y) => y.id === x.id)) GAMES.push(x); }); })();
  // スプラッシュ（起動画面）を消す
  (() => { const sp = document.getElementById("splash"); if (!sp) return; const hide = () => { sp.classList.add("out"); setTimeout(() => sp.remove(), 500); }; setTimeout(hide, Math.max(150, 650 - performance.now())); })();
  window.HM_APP = { state: () => state, save, render, today, dkey, setClockOffset: (ms) => { clockOffset = ms; render(); }, GAMES, gachaPull, rates: () => ({ normal: GACHA_RATES.slice(), sr: GACHA_RATES_SR.slice() }), drawRarity, startStep, findStep, judgeNum, passNeed: HM.passNeed, STARS_TO_UNLOCK, READ_MS, starsToday, gamesOpen, pullsLeft, startGame, version: VERSION, quiz: () => Q, startBox, startBoss, speak, canSpeak };

  // テスト用：?clock=+86400000 のように時計をずらせる
  try { const c = new URLSearchParams(location.search).get("clock"); if (c) clockOffset = +c || 0; } catch (e) {}
  render();
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("./sw.js").catch(() => {});
})();
