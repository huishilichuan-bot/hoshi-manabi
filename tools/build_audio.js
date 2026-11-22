// ほしまなび v1.6.3 — 英語の声（録音ファイル）のための一覧づくり
//  node tools/build_audio.js            … 文のプール（q-en4-pool.js）と、録音する文の一覧（tools/audio_texts.json）を作る
//  node tools/build_audio.js --manifest … audio/ にあるファイルから一覧（q-en4-audio.js）を作る
//  node tools/build_audio.js --check    … プールの文・会話の文に、すべて録音があるか／種から同じ文が作れるかをたしかめる（CI）
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
global.window = undefined; require(path.join(ROOT, "q-util.js"));
const files = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/q-[a-z0-9-]+\.js/g).filter((f, i, a) => f !== "q-util.js" && a.indexOf(f) === i);
files.forEach((f) => require(path.join(ROOT, f)));
HM.finalize();
const E4 = HM.EN4, A = require(path.join(ROOT, "audio.js"));
const mode = process.argv[2] || "";
const PER = 40, PER_READ = 10;
const toks = (t) => E4.tokens(t).length;
const DLG_SEX = E4.VOICE_SEX || {};

function dialogueLines() {
  const out = [];
  for (const g of Object.keys(E4.DLG || {})) for (const d of E4.DLG[g]) for (const l of d.lines) out.push({ text: l[1], sex: DLG_SEX[l[0]] || "f", src: "dlg" });
  return out;
}
// ステップ k で、聞く・話す の問題が出るか
const usesAudio = (g, k) => ["L", "S"].some((sk) => [0, 1, 2].some((slot) => E4.AUDIO_F[E4.fmt(+g, sk, slot, k)]));
const usesRead = (g, k) => [0, 1, 2].some((slot) => E4.fmt(+g, "R", slot, k) === "rx");

function buildPool() {
  const POOL = {}, texts = new Map();
  const addText = (text, sex, src) => { const k = A.key(text, sex); if (!texts.has(k)) texts.set(k, { key: k, text: A.clean(text), sex, src }); };
  E4.POOL = null;
  for (const [g, us] of Object.entries(HM.SUBJECTS.en)) us.forEach((u, ui) => {
    for (let k = 0; k < 3; k++) {
      const lo = k * 0.34, hi = Math.min(1, lo + 0.5);
      if (usesAudio(g, k)) {
        const seen = new Set(), list = [];
        for (let s = 1; s <= 5000 && list.length < PER; s++) {
          const seed = (+g * 1000003 + ui * 7919 + k * 104729 + s * 2654435761) >>> 0;
          const lv = Math.round((lo + ((s * 0.618034) % 1) * (hi - lo)) * 100) / 100;
          const S = E4.withSeed(seed, () => u.gen(lv));
          if (!S || !S.en || seen.has(S.en)) continue;
          const n = toks(S.en); if (n < 1 || n > 14) continue;
          seen.add(S.en); list.push([seed, lv]); addText(S.en, "f", "s");
        }
        POOL[g + "|" + ui + "|" + k] = list;
      }
      if (u.read && usesRead(g, k)) {
        const seen = new Set(), list = [];
        let any = false;
        for (let s = 1; s <= 400 && list.length < PER_READ; s++) {
          const seed = (+g * 7000003 + ui * 6007 + k * 90001 + s * 2246822519) >>> 0;
          const lv = Math.round((lo + ((s * 0.618034) % 1) * (hi - lo)) * 100) / 100;
          const set = E4.withSeed(seed, () => u.read(lv, k));
          if (!set) continue;
          if (!set.au) break; // 音声のない読みもの（中学の長文など）はプールにしない
          any = true;
          if (seen.has(set.text)) continue;
          seen.add(set.text); list.push([seed, lv]); addText(set.text.replace(/\n\n/g, " "), "f", "p");
        }
        if (any && list.length) POOL["R|" + g + "|" + ui + "|" + k] = list;
      }
    }
  });
  for (const l of dialogueLines()) addText(l.text, l.sex, "d");
  return { POOL, texts: [...texts.values()] };
}

function scanAudio() {
  const dir = path.join(ROOT, "audio"), have = new Set();
  if (!fs.existsSync(dir)) return have;
  for (const d of fs.readdirSync(dir)) { const p = path.join(dir, d); if (!fs.statSync(p).isDirectory()) continue; for (const f of fs.readdirSync(p)) if (f.endsWith(".m4a")) have.add(f.slice(0, -4)); }
  return have;
}

if (mode === "--manifest") {
  const have = [...scanAudio()].sort();
  fs.writeFileSync(path.join(ROOT, "q-en4-audio.js"), "/* 自動生成：node tools/build_audio.js --manifest（録音のある文のハッシュ一覧。audio/xx/ハッシュ.m4a） */\n(function (root) { const E4 = root.HM.EN4; E4.AUDIO = " + JSON.stringify(have.join(" ")) + "; })(typeof window !== \"undefined\" ? window : globalThis);\n");
  console.log("manifest", have.length);
} else if (mode === "--check") {
  // 1) いまのプールが、作りなおしたプールと同じか（問題の作り方が変わったら作りなおしが必要）
  const cur = (E4.POOL_SRC || null);
  const { POOL, texts } = buildPool();
  const pf = fs.readFileSync(path.join(ROOT, "q-en4-pool.js"), "utf8");
  const saved = JSON.parse(pf.slice(pf.indexOf("E4.POOL = ") + 10, pf.lastIndexOf("; })")));
  let bad = 0;
  if (JSON.stringify(saved) !== JSON.stringify(POOL)) { bad++; console.log("プールが古い：node tools/build_audio.js で作りなおしてください"); }
  // 2) 録音があるか
  const have = scanAudio(); const miss = texts.filter((t) => !have.has(t.key));
  if (miss.length) { bad++; console.log("録音がない文", miss.length, miss.slice(0, 5).map((t) => t.text)); }
  // 3) 一覧（q-en4-audio.js）とファイルが同じか
  const man = new Set((E4.AUDIO || "").split(" ").filter(Boolean));
  if (man.size !== have.size || [...have].some((k) => !man.has(k))) { bad++; console.log("q-en4-audio.js が古い：node tools/build_audio.js --manifest"); }
  // 4) 種から作る文が、ほかの問題を作ったあとでも同じか（決まった文になるか）
  let drift = 0;
  for (const [key, list] of Object.entries(POOL)) { const [a, b, c, d] = key.split("|"); if (a === "R") continue; const u = HM.SUBJECTS.en[a][+b]; for (const e of list.slice(0, 4)) { const x = E4.withSeed(e[0], () => u.gen(e[1])); for (let r = 0; r < 3; r++) u.gen(Math.random()); const y = E4.withSeed(e[0], () => u.gen(e[1])); if (!x || !y || x.en !== y.en) drift++; } }
  if (drift) { bad++; console.log("種から同じ文が作れない", drift); }
  // 5) 実際に問題を作って、声に出す文がすべて録音のある文か（会話・1文・スピーキングのお手本・読みもの）
  E4.POOL = saved; let need = 0, nohave = 0; const ex = [];
  for (const [g, us] of Object.entries(HM.SUBJECTS.en)) for (const u of us) u.steps.forEach((st, k) => {
    for (let s = 0; s < 8; s++) {
      const qs = HM.makeSet(st, 77 + s * 101 + k);
      for (const q of qs.qs || qs) {
        const L = q.dlg ? q.dlg.map((l) => [l[1], DLG_SEX[l[0]] || l[2] || "f"]) : q.passage ? (q.passage.au ? [[q.passage.text.replace(/\n\n/g, " "), "f"]] : []) : q.au ? [[q.au, "f"]] : q.t === "sp" ? [[q.a, "f"]] : [];
        for (const [t, sx] of L) { need++; if (!have.has(A.key(t, sx))) { nohave++; if (ex.length < 5) ex.push(g + " " + u.n + "：" + t); } }
      }
    }
  });
  if (nohave) { bad++; console.log("録音のない文が問題に出る", nohave + "/" + need, ex); } else console.log("問題に出る声の文", need, "件すべて録音あり");
  console.log(bad ? "NG" : "audio OK " + texts.length + " 文・" + Object.keys(POOL).length + " プール");
  process.exit(bad ? 1 : 0);
} else {
  const { POOL, texts } = buildPool();
  fs.writeFileSync(path.join(ROOT, "q-en4-pool.js"), "/* 自動生成：node tools/build_audio.js（声に出す文のプール。[種, lv] で同じ文を作りなおす） */\n(function (root) { const E4 = root.HM.EN4; E4.POOL = " + JSON.stringify(POOL) + "; })(typeof window !== \"undefined\" ? window : globalThis);\n");
  fs.writeFileSync(path.join(ROOT, "tools", "audio_texts.json"), JSON.stringify(texts));
  const by = {}; texts.forEach((t) => (by[t.src + t.sex] = (by[t.src + t.sex] || 0) + 1));
  console.log("pools", Object.keys(POOL).length, "texts", texts.length, by, "chars", texts.reduce((a, t) => a + t.text.length, 0));
}
