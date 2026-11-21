/* ほしまなび 英語 v1.6 — 4技能（リスニング・スピーキング・ライティング・リーディング）の共通エンジン
   ・1ステップ12問＝🎧3・🗣3・✏️3・📖3（順番はまぜる）。ステップの中で少しずつ難しくなる
   ・判定（ふつうの文字入力・カード・音声認識）はここにまとめ、画面（en4-ui.js）と検証（tools/verify.js）で同じものを使う */
(function (root) {
  "use strict";
  const HM = root.HM, U = HM.U, { R, pick, shuf } = U;
  const E4 = (HM.EN4 = HM.EN4 || {});
  E4.SKILL = { L: "🎧 リスニング", S: "🗣 スピーキング", W: "✏️ ライティング", R: "📖 リーディング" };

  // ===== 数を英語に（判定用：数字で聞きとられても同じにする） =====
  const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
  const TENS = ",,twenty,thirty,forty,fifty,sixty,seventy,eighty,ninety".split(",");
  function numWords(n) {
    n = Math.floor(n); if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
    if (n < 1000) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + numWords(n % 100) : "");
    if (n < 10000) return numWords(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + numWords(n % 1000) : "");
    return String(n);
  }
  const ORD = "zeroth first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth twentieth".split(" ");
  function ordWords(n) { if (n <= 20) return ORD[n]; if (n % 10 === 0) return TENS[n / 10].replace(/y$/, "ieth"); return TENS[Math.floor(n / 10)] + " " + ORD[n % 10]; }
  E4.numWords = numWords; E4.ordWords = ordWords;

  // ===== 文を「くらべるための単語の列」にする =====
  const PP = /^(been|gone|done|seen|had|made|eaten|written|taken|given|known|read|left|lived|visited|finished|played|studied|watched|bought|lost|met|heard|told|got|gotten|become|come|run|swum|sung|broken|forgotten|spoken|stayed|worked|wanted|tried|used|cleaned|started|already|just|never|ever|not|always)$/;
  const PRON_S = /^(he|she|it|that|what|where|who|there|here|how|when|this)$/;
  const EQUIV = { television: "tv", "t.v.": "tv", mom: "mother", mommy: "mother", dad: "father", daddy: "father", bicycle: "bike", okay: "ok", oclock: "o'clock", "o'clock": "o'clock", cannot: "can not", grandma: "grandmother", grandpa: "grandfather", photo: "picture", photos: "pictures", soccer: "soccer", math: "math", maths: "math", favourite: "favorite", colour: "color", colours: "colors", centre: "center", theatre: "theater" };
  function canon(s) {
    s = String(s == null ? "" : s).replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"').toLowerCase();
    s = s.replace(/(\d+):00\b/g, "$1 o'clock").replace(/(\d+):(\d\d)\b/g, (m, h, mm) => h + " " + (+mm < 10 ? "oh " + +mm : +mm));
    s = s.replace(/(\d),(\d{3})/g, "$1$2");
    s = s.replace(/\b(\d+)(st|nd|rd|th)\b/g, (m, n) => " " + ordWords(+n) + " ");
    s = s.replace(/\b\d+\b/g, (m) => " " + numWords(+m) + " ");
    s = s.replace(/o' ?clock/g, "o'clock").replace(/\bt\.v\./g, "tv");
    s = s.replace(/[^a-z0-9' ]+/g, " ").replace(/(^| )'+|'+( |$)/g, " ");
    const raw = s.split(/\s+/).filter(Boolean), out = [];
    for (let i = 0; i < raw.length; i++) {
      let w = raw[i]; const nx = raw[i + 1] || "";
      if (EQUIV[w]) { out.push(...EQUIV[w].split(" ")); continue; }
      let m;
      if (w === "won't") { out.push("will", "not"); continue; }
      if (w === "can't") { out.push("can", "not"); continue; }
      if (w === "shan't") { out.push("shall", "not"); continue; }
      if (w === "let's") { out.push("let", "us"); continue; }
      if (w === "i'm") { out.push("i", "am"); continue; }
      if ((m = /^(\w+)n't$/.exec(w))) { out.push(m[1], "not"); continue; }
      if ((m = /^(\w+)'re$/.exec(w))) { out.push(m[1], "are"); continue; }
      if ((m = /^(\w+)'ve$/.exec(w))) { out.push(m[1], "have"); continue; }
      if ((m = /^(\w+)'ll$/.exec(w))) { out.push(m[1], "will"); continue; }
      if ((m = /^(\w+)'d$/.exec(w))) { out.push(m[1], PP.test(nx) && nx !== "not" ? "had" : "would"); continue; }
      if ((m = /^(\w+)'s$/.exec(w)) && PRON_S.test(m[1])) { out.push(m[1], PP.test(nx) && !/^(not|always|never|just|already)$/.test(nx) ? "has" : "is"); continue; }
      out.push(w);
    }
    return out;
  }
  E4.canon = canon;
  const ck = (s) => canon(s).join(" ");
  E4.ck = ck;

  // ===== つづりの小さなまちがい（おしい）か、文法のまちがいか =====
  function lev(a, b) {
    const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
    let p = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (i > 1 && false) break; p = c; }
    // となりの文字の入れかえは1つと数える
    if (m === n) { const d = []; for (let i = 0; i < m; i++) if (a[i] !== b[i]) d.push(i); if (d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]]) return 1; }
    return p[n];
  }
  E4.IRR = {};
  const stem = (w) => w.replace(/(ies|ied)$/, "y").replace(/(ing|ed|es|s|d|er|est)$/, "").replace(/e$/, "");
  const CONF = [["a", "an", "the"], ["is", "are", "am", "was", "were", "be", "been"], ["in", "on", "at", "to", "for", "of", "by", "with", "from"], ["he", "she", "it", "they", "his", "her", "him", "them", "their", "its"], ["this", "these", "that", "those", "there", "then", "than"], ["do", "does", "did", "done"], ["have", "has", "had"], ["where", "were", "we're", "wear"], ["their", "there"], ["to", "too", "two"], ["which", "witch"], ["who", "whose", "whom"], ["much", "many", "more", "most"], ["good", "well", "better", "best"], ["can", "could"], ["will", "would"], ["some", "any"]];
  function grammarRelated(t, a) {
    if (t === a) return false;
    if (stem(t) === stem(a)) return true;
    if (E4.IRR[t] && E4.IRR[t] === E4.IRR[a]) return true;
    return CONF.some((g) => g.includes(t) && g.includes(a));
  }
  // 入力した文の判定 → { ok, close(おしい), fix:[[書いた, 正しい]], empty }
  E4.judgeText = function (input, accs) {
    const T = canon(input); if (!T.length) return { empty: true, ok: false };
    const list = accs.map(canon);
    for (const A of list) if (A.join(" ") === T.join(" ")) return { ok: true };
    for (let k = 0; k < list.length; k++) {
      const A = list[k]; if (A.length !== T.length) continue;
      const fix = []; let bad = false;
      for (let i = 0; i < A.length && !bad; i++) {
        if (A[i] === T[i]) continue;
        const a = A[i], t = T[i];
        if (a.length < 4 || grammarRelated(t, a) || lev(t, a) > (a.length >= 8 ? 2 : 1)) bad = true; else fix.push([t, a]);
      }
      if (!bad && fix.length && fix.length <= Math.max(1, Math.floor(A.length / 4))) return { ok: true, close: true, fix, best: accs[k] };
    }
    return { ok: false };
  };
  // 音声認識の判定：単語ごとに合っているか（LCS）。80%以上かつ大事な単語がすべて合えば合格
  E4.PASS_RATE = 0.8;
  function lcsMark(A, B) {
    const m = A.length, n = B.length, L = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const hit = new Array(m).fill(false); let i = 0, j = 0;
    while (i < m && j < n) { if (A[i] === B[j]) { hit[i] = true; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    return hit;
  }
  E4.judgeSpeech = function (alts, target, keys) {
    const words = String(target).split(/\s+/).filter(Boolean);
    const groups = words.map((w) => canon(w)); // 画面の単語 → くらべる単語
    const T = [].concat(...groups), K = (keys || []).map((k) => ck(k)).filter(Boolean);
    let best = null;
    for (const alt of alts || []) {
      const H = canon(alt), hit = lcsMark(T, H), n = hit.filter(Boolean).length;
      const keyOk = K.every((k) => { const ks = k.split(" "); for (let s = 0; s + ks.length <= T.length; s++) if (ks.every((x, q) => T[s + q] === x && hit[s + q])) return true; return false; });
      const rate = T.length ? n / T.length : 0, ok = rate >= E4.PASS_RATE && keyOk;
      let p = 0; const marks = groups.map((g) => { const r = g.length ? g.every((_, q) => hit[p + q]) : true; p += g.length; return r; });
      const r = { ok, rate, keyOk, marks, heard: alt };
      if (!best || (r.ok && !best.ok) || (r.ok === best.ok && r.rate > best.rate)) best = r;
    }
    return best || { ok: false, rate: 0, keyOk: false, marks: words.map(() => false), heard: "" };
  };

  // ===== 文の部品 =====
  const STOP = new Set("a an the is am are was were be been being to of in on at for by with from and or but so i you he she it we they me him her us them my your his its our their this that these those do does did not no yes can will would shall should could may might must have has had there here what who where when how which why whose very too also just please let's".split(" "));
  E4.tokens = (en) => String(en).split(/\s+/).map((w) => w.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, "")).filter(Boolean);
  E4.keysOf = (en) => [...new Set(E4.tokens(en).filter((w) => !STOP.has(w.toLowerCase()) && w.length > 1))];
  // 時を表す語句は文の前に出してもよい
  const TIME_TAIL = /\s((?:every day|every morning|every night|every week|every year|every sunday|every saturday|after school|after dinner|before dinner|yesterday|today|tomorrow|now|right now|last \w+|next \w+|this morning|this afternoon|this evening|this weekend|this year|tonight|on \w+days?|in the morning|in the afternoon|in the evening|at night|then|at that time|at (?:six|seven|eight|nine|ten|five|four|three|two|one|eleven|twelve)(?: o'clock| thirty)?)|(?:\w+ )?(?:years|days|weeks|months|hours) ago)([.!?])$/i;
  function variants(en, alt) {
    const out = [en].concat(alt || []), seen = new Set(out.map(ck));
    for (const s of out.slice()) {
      const m = TIME_TAIL.exec(s);
      if (m && !/\?$/.test(s)) { const head = s.slice(0, m.index); const w0 = head.split(" ")[0], low = /^(You|We|They|He|She|It|My|Our|Your|His|Her|Their|The|This|That|These|Those|There|A|An|Let's|Please)$/.test(w0); const v = m[1].charAt(0).toUpperCase() + m[1].slice(1) + ", " + (low ? head.charAt(0).toLowerCase() : head.charAt(0)) + head.slice(1) + m[2]; const fixd = v.replace(/, i /, ", I ").replace(/, i'/, ", I'"); if (!seen.has(ck(fixd))) { seen.add(ck(fixd)); out.push(fixd); } }
    }
    return out;
  }
  E4.variants = variants;
  const firstUp = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  E4.firstUp = firstUp;
  const art = (w) => (/^(uni|one|use|euro)/i.test(w) ? "a " : /^(hour|honest)/i.test(w) || /^[aeiou]/i.test(w) ? "an " : "a ") + w;
  E4.art = art;

  // ===== 問題を作る =====
  const note = (S, u) => "「" + S.en + "」＝「" + S.ja + "」。" + (S.note || u.note || "");
  // カード用のまぎらわしい語：同じ単元のほかの文から（意味のちがう語）＋語形のちがい
  function distractors(S, u, k, lv) {
    const toks = E4.tokens(S.en), low = new Set(toks.map((w) => w.toLowerCase())), out = [];
    const forms = [];
    for (const w of toks) {
      const lw = w.toLowerCase();
      const f = (E4.FORMS && E4.FORMS[lw]) || [];
      f.forEach((x) => { if (!low.has(x.toLowerCase())) forms.push(x); });
    }
    const others = [];
    for (let t = 0; t < 12 && others.length < 8; t++) { const o = u.gen(lv); if (!o || o.en === S.en) continue; E4.tokens(o.en).forEach((w) => { const lw = w.toLowerCase(); if (!low.has(lw) && !STOP.has(lw) && !others.includes(w) && !forms.includes(w)) others.push(w); }); }
    const pool = shuf(forms).slice(0, Math.ceil(k / 2)).concat(shuf(others));
    for (const w of pool) { if (out.length >= k) break; if (!out.some((x) => x.toLowerCase() === w.toLowerCase())) out.push(w); }
    // まぎらわしい語を入れても、ほかの正しい答えができないように
    const accs = new Set(variants(S.en, S.alt).map(ck));
    return out.filter((x) => toks.every((_, i) => { const t2 = toks.slice(); t2[i] = x; return !accs.has(ck(t2.join(" "))); }));
  }
  function tiles(S, u, opt) {
    const toks = E4.tokens(S.en);
    if (toks.length < 2 || toks.length > 12) return null;
    const ex = distractors(S, u, opt.extra, opt.lv);
    const q = { t: "tl", skill: opt.skill, q: opt.q, pieces: toks, extra: ex, a: toks.join(" "), acc: variants(S.en, S.alt).map((v) => E4.tokens(v).join(" ")), en: S.en, ja: S.ja, ex: note(S, u) };
    if (opt.au) q.au = S.en; else q.jp = S.ja;
    return q;
  }
  const B = {};
  // 🎧 聞いてカードでならべる
  B.lt = (S, u, c) => tiles(S, u, { skill: "L", q: "🔊 を聞いて、聞こえた英語をカードでならべよう", extra: c.g <= 4 ? 1 + (c.lv > 0.5 ? 1 : 0) : 2 + (c.lv > 0.5 ? 1 : 0), lv: c.lv, au: true });
  // 🎧 聞いて書く（書き取り）
  B.ld = (S, u, c) => { const n = E4.tokens(S.en).length; if (n < 2 || n > 12) return null; return { t: "ty", skill: "L", q: "🔊 を聞いて、聞こえた英語を書こう", au: S.en, a: S.en, acc: variants(S.en, S.alt), words: n, ja: S.ja, ex: note(S, u) }; };
  // 🎧 聞いて意味をえらぶ
  B.lm = (S, u, c) => {
    const o = []; for (let t = 0; t < 30 && o.length < 3; t++) { const x = u.gen(c.lv); if (x && x.ja !== S.ja && x.en !== S.en && !o.includes(x.ja) && (!S.kind || x.kind === S.kind)) o.push(x.ja); }
    if (o.length < 2) return null;
    return { t: "mc", skill: "L", q: "🔊 を聞いて、合う意味をえらぼう", au: S.en, a: S.ja, opts: shuf([S.ja].concat(o)), ex: note(S, u) };
  };
  // 🎧 会話を聞いて答える：会話はすべて手書き（dlg/g5〜g9.txt → q-en4-dlg.js）。文をつなぎ合わせて会話を作ることはしない
  B.lg = (S, u, c) => {
    const all = (E4.DLG && E4.DLG[c.g]) || [], list = all.filter((d) => d.u === c.ui);
    if (!list.length) return null;
    const d = pick(list), x = pick(d.qs);
    const lines = d.lines.map((l) => [l[0], l[1], (E4.VOICE_SEX && E4.VOICE_SEX[l[0]]) || "f"]);
    return { t: "mc", skill: "L", q: "🔊 会話を聞こう。" + x[0], dlg: lines, a: x[1], opts: shuf([x[1]].concat(x[2])), did: c.g + "-" + all.indexOf(d), ex: "会話：" + d.lines.map((l) => l[0] + "「" + l[1] + "」").join(" ") + " ／ 答え：" + x[1] };
  };
  // 🗣 声に出して言う
  B.sp = (S, u, c) => { const n = E4.tokens(S.en).length; if (n < 1 || n > 14) return null; return { t: "sp", skill: "S", q: "🎤 英語で言ってみよう", a: S.en, ja: S.ja, key: S.key || E4.keysOf(S.en).slice(0, 4), ex: note(S, u) + " 🔊 でお手本を聞いてから、マイクで話そう。" }; };
  // ✏️ 日本語 → カードで英語に
  B.wt = (S, u, c) => tiles(S, u, { skill: "W", q: "「" + S.ja + "」を英語にしよう", extra: c.g <= 4 ? 1 + (c.lv > 0.5 ? 1 : 0) : 2 + (c.lv > 0.5 ? 1 : 0), lv: c.lv });
  // ✏️ 日本語 → 自分で英文を書く
  B.wy = (S, u, c) => { const n = E4.tokens(S.en).length; if (n < 2 || n > 14) return null; return { t: "ty", skill: "W", q: "「" + S.ja + "」を英語で書こう", jp: S.ja, a: S.en, acc: variants(S.en, S.alt), words: n, ex: note(S, u) }; };
  // ✏️ 1語を書き入れる
  const FILL_OK = /^(am|is|are|was|were|do|does|did|can|will|have|has|been|to|than|must|should|may|could|would|shall|not|never|ever|already|yet|just|for|since|by)$/;
  const SYN = { big: ["large"], large: ["big"], small: ["little"], little: ["small"], start: ["begin"], begin: ["start"], delicious: ["tasty"], tasty: ["delicious"], glad: ["happy"], happy: ["glad"], picture: ["photo"], pictures: ["photos"] };
  B.wf = (S, u, c) => {
    const toks = E4.tokens(S.en); if (toks.length < 3) return null;
    const cand = S.blank != null ? [S.blank] : toks.map((w, i) => i).filter((i) => { const w = toks[i], lw = w.toLowerCase(); if (i === 0) return false; if (FILL_OK.test(lw)) return true; return !STOP.has(lw) && w.length >= 3 && !/^[A-Z]/.test(w) && !/'/.test(w); });
    if (!cand.length) return null;
    const i = pick(cand), w = toks[i];
    const words = String(S.en).split(/\s+/); let cnt = -1, done = false;
    const shown = words.map((x) => { const core = x.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, ""); if (!core) return x; cnt++; if (cnt === i && !done) { done = true; return x.replace(core, "( )"); } return x; }).join(" ");
    if (!done) return null;
    return { t: "ty", skill: "W", fill: true, q: "「" + S.ja + "」<br><b class=\"en-fill\">" + U.esc(shown) + "</b><br>（ ）に入る英語を1語書こう", jp: S.ja, a: w, acc: [w].concat(SYN[w.toLowerCase()] || []), full: S.en, shown, words: 1, hint1: w.charAt(0), ex: "（ ）には「" + w + "」。" + note(S, u) };
  };
  // 📖 英語を読んで絵をえらぶ／絵に合う英語をえらぶ／意味をえらぶ
  B.rp = (S, u, c) => {
    if (!S.pic) return B.rm(S, u, c);
    const o = []; for (let t = 0; t < 40 && o.length < 3; t++) { const x = u.gen(c.lv); if (x && x.pic && x.pic !== S.pic && x.kind === S.kind && !o.includes(x.pic)) o.push(x.pic); }
    if (o.length < 2) return B.rm(S, u, c);
    return { t: "mc", skill: "R", pics: 1, q: "英語を読んで、合う絵をえらぼう", text: S.en, a: S.pic, opts: shuf([S.pic].concat(o)), ex: note(S, u) };
  };
  B.rr = (S, u, c) => {
    if (!S.pic) return B.rm(S, u, c);
    const o = []; for (let t = 0; t < 40 && o.length < 3; t++) { const x = u.gen(c.lv); if (x && x.pic && x.pic !== S.pic && x.kind === S.kind && !o.includes(x.en) && x.en !== S.en) o.push(x.en); }
    if (o.length < 2) return B.rm(S, u, c);
    return { t: "mc", skill: "R", q: "絵に合う英語をえらぼう", pic: S.pic, a: S.en, opts: shuf([S.en].concat(o)), ex: note(S, u) };
  };
  B.rm = (S, u, c) => {
    const o = []; for (let t = 0; t < 30 && o.length < 3; t++) { const x = u.gen(c.lv); if (x && x.ja !== S.ja && x.en !== S.en && !o.includes(x.ja) && (!S.kind || x.kind === S.kind)) o.push(x.ja); }
    if (o.length < 2) return null;
    return { t: "mc", skill: "R", q: "英語を読んで、合う意味をえらぼう", text: S.en, a: S.ja, opts: shuf([S.ja].concat(o)), ex: note(S, u) };
  };
  E4.B = B;

  // ===== ステップ（12問：🎧3・🗣3・✏️3・📖3） =====
  const PLAN = ["L", "W", "R", "S", "L", "R", "W", "S", "R", "S", "L", "W"];
  E4.PLAN = PLAN;
  // 学年ごとの出し方（スキルの何問目か → 形式）
  function fmt(g, skill, slot, k) {
    if (skill === "S") return "sp";
    if (skill === "L") {
      if (g <= 4) return ["lt", "lm", "lt"][slot];
      if (g <= 6) return ["lt", k >= 1 ? "lg" : "lm", "lt"][slot];
      if (g === 7) return ["lt", "lg", k >= 1 ? "ld" : "lt"][slot];
      return [k === 0 ? "lt" : "ld", "lg", "ld"][slot];
    }
    if (skill === "W") {
      if (g <= 4) return "wt";
      if (g <= 6) return ["wt", k >= 1 ? "wf" : "wt", "wt"][slot];
      if (g === 7) return ["wt", "wf", k >= 1 ? "wy" : "wt"][slot];
      return [k === 0 ? "wt" : "wf", "wy", "wy"][slot];
    }
    if (g <= 4) return ["rp", "rm", "rr"][slot];
    return "rx";
  }
  E4.fmt = fmt;
  const SN = ["①", "②", "③"], SNAME = ["はじめよう", "なれよう", "チャレンジ"];
  // 単元：{ n, note, gen(lv) → { en, ja, alt?, key?, pic?, kind?, blank? }, read?(lv, ctx) }
  E4.addGrade = function (g, units) {
    const out = units.map((u0, ui) => {
      const u = u0;
      const steps = [0, 1, 2].map((k) => {
        const ctx = { last: -1, rd: null };
        const src = function (d, i) {
          if (i < ctx.last || i === 0) ctx.rd = null;
          ctx.last = i;
          const skill = PLAN[(i + k * 4) % PLAN.length];
          const slot = PLAN.slice(0, (i + k * 4) % PLAN.length).filter((x) => x === skill).length % 3;
          const lv = Math.min(1, k * 0.34 + d * 0.5);
          const f = fmt(g, skill, slot, k), c = { g, lv, k, slot, ui };
          if (f === "rx") {
            if (!ctx.rd) { const set0 = u.read ? u.read(lv, k) : null; ctx.rd = { set: set0, order: set0 ? shuf(set0.qs) : [], used: [] }; }
            const set = ctx.rd.set; if (!set) return null;
            const left = ctx.rd.order.filter((x) => !ctx.rd.used.includes(x.q)); if (!left.length) return null;
            const x = left[0]; ctx.rd.used.push(x.q);
            return { t: "mc", skill: "R", q: x.q, passage: { title: set.title, text: set.text, au: set.au ? 1 : 0, words: set.text.split(/\s+/).length }, a: x.a, opts: shuf([x.a].concat(x.o)), ex: x.ex, rid: set.id };
          }
          for (let t = 0; t < 6; t++) { const S = u.gen(lv); if (!S) continue; const q = B[f](S, u, c); if (q) return q; }
          return null;
        };
        return { n: SN[k] + " " + SNAME[k], src, cnt: 12, en4: true, example: () => u.gen(0.2) };
      });
      HM.POINTS = HM.POINTS || {}; if (u.note) HM.POINTS[u.n] = u.note;
      return { n: u.n, steps, expanded: true, en4: true, gen: u.gen };
    });
    HM.SUBJECTS.en = HM.SUBJECTS.en || {};
    HM.SUBJECTS.en[g] = out;
  };
  // 以前の英語（単語中心）は、新しい4技能の英語に入れかえる
  E4.reset = function () { HM.SUBJECTS.en = {}; };
  E4.NAMES2 = [["Ken", "ケン"], ["Emma", "エマ"], ["Yumi", "ユミ"], ["Tom", "トム"], ["Mika", "ミカ"], ["Ben", "ベン"], ["Aya", "アヤ"], ["Lucas", "ルーカス"], ["Sara", "サラ"], ["Leo", "レオ"]];
  if (!U.esc) U.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
})(typeof window !== "undefined" ? window : globalThis);
