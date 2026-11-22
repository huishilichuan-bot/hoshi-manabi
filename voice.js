/* ほしまなび 英語の声（v1.6.1）
   ・iPhone / iPad / Mac / Android / Windows の声から、自然な en-US の声を名前で選ぶ
   ・おもしろ声（Albert・Bad News・Bubbles・Zarvox など）と日本語の声は使わない
   ・会話は女の子（Sara など）と男の子（Ken など）で別の声。話と話の間に少し間をあける
   ・読むのは英文だけ（日本語・絵文字・「Ken:」のような名前は読まない） */
(function (root) {
  "use strict";
  const ok = () => typeof root.speechSynthesis !== "undefined" && typeof root.SpeechSynthesisUtterance !== "undefined";
  const NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|fred|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley|hysterical|deranged|pipe organ)\b/i;
  // 名前 → [点数, 性別]
  const GOOD = {
    samantha: [100, "f"], ava: [96, "f"], allison: [92, "f"], susan: [88, "f"], zoe: [88, "f"], nicky: [84, "f"], joelle: [80, "f"], noelle: [80, "f"], evelyn: [78, "f"],
    tom: [94, "m"], evan: [92, "m"], aaron: [90, "m"], nathan: [90, "m"], alex: [86, "m"], nathaniel: [80, "m"],
    aria: [90, "f"], jenny: [90, "f"], michelle: [80, "f"], guy: [88, "m"], christopher: [84, "m"], eric: [80, "m"], davis: [80, "m"], zira: [70, "f"], david: [68, "m"], mark: [66, "m"],
    karen: [60, "f"], moira: [55, "f"], tessa: [55, "f"], serena: [58, "f"], kate: [58, "f"], fiona: [52, "f"], victoria: [56, "f"], daniel: [58, "m"], oliver: [56, "m"], arthur: [56, "m"], gordon: [54, "m"], lee: [52, "m"], rishi: [50, "m"],
  };
  const FEMALE_HINT = /female|woman|女性/i, MALE_HINT = /\bmale\b|\bman\b|男性/i;
  function info(v) {
    const name = String(v.name || ""), low = name.toLowerCase(), lang = String(v.lang || "").replace("_", "-");
    if (!/^en(-|$)/i.test(lang) || NOVELTY.test(low)) return null;
    let score = /^en-US$/i.test(lang) ? 40 : 5, sex = "";
    const first = (low.match(/[a-z]+/g) || []);
    for (const w of first) if (GOOD[w]) { score += GOOD[w][0]; sex = GOOD[w][1]; break; }
    if (/google us english/i.test(name)) { score += 80; sex = sex || "f"; }
    if (/enhanced|premium|拡張|高音質|neural|natural|online/i.test(name)) score += 30;
    if (/compact/i.test(name)) score -= 10;
    if (!sex) sex = FEMALE_HINT.test(name) ? "f" : MALE_HINT.test(name) ? "m" : "";
    return { v, score, sex, name };
  }
  let cache = [];
  function load() { if (!ok()) return []; try { cache = (speechSynthesis.getVoices() || []).map(info).filter(Boolean).sort((a, b) => b.score - a.score); } catch (e) { cache = []; } return cache; }
  if (ok()) { load(); try { speechSynthesis.addEventListener ? speechSynthesis.addEventListener("voiceschanged", load) : (speechSynthesis.onvoiceschanged = load); } catch (e) {} }
  // 性別に合う、いちばん自然な声（なければ自然な声のどれか）。avoid とちがう声を優先
  function pick(sex, avoid) {
    const list = cache.length ? cache : load();
    if (!list.length) return null;
    const same = list.filter((x) => x.sex === sex && x.v !== avoid);
    if (same.length) return same[0].v;
    const other = list.filter((x) => x.v !== avoid && x.score >= 60);
    return (other[0] || list[0]).v;
  }
  // 読み上げる文を英語だけにする
  function clean(t) {
    return String(t || "").replace(/(^|\s)(?:(?:Mr|Ms|Mrs)\.\s)?[A-Z][a-z]+:\s+/g, "$1").replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
  }
  let token = 0;
  // lines：文字列 または [[話し手, 英文, "f"|"m"], ...]。opt：{ slow, vol, onEnd }
  function speak(lines, opt) {
    if (!ok()) return false;
    opt = opt || {};
    const list = (typeof lines === "string" ? [[null, lines, "f"]] : lines).map((l) => [l[0], clean(l[1]), l[2] || "f"]).filter((l) => l[1]);
    if (!list.length) return false;
    const my = ++token;
    try { speechSynthesis.cancel(); } catch (e) {}
    const go = () => {
      if (my !== token) return;
      const vf = pick("f"), vm = pick("m", vf);
      let i = 0;
      const next = () => {
        if (my !== token) return;
        if (i >= list.length) { if (opt.onEnd) opt.onEnd(); return; }
        if (opt.onLine) { try { opt.onLine(i); } catch (e) {} }
        const [, text, sex] = list[i++];
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US"; u.rate = opt.slow ? 0.6 : 0.9; u.pitch = 1; u.volume = opt.vol == null ? 0.8 : opt.vol;
        const v = sex === "m" ? vm : vf; if (v) { u.voice = v; u.lang = v.lang; }
        let done = false;
        const fin = () => { if (done) return; done = true; clearTimeout(safety); setTimeout(next, i < list.length ? 450 : 0); };
        // iOS で onend が来ないときの保険
        const safety = setTimeout(fin, 1500 + text.length * (opt.slow ? 140 : 90));
        u.onend = fin; u.onerror = fin;
        speechSynthesis.speak(u);
      };
      next();
    };
    if (cache.length || load().length) go();
    else {
      // 声の一覧がまだのとき：無音で読み上げを準備して（iOS はタップの中で始める必要がある）、一覧が届いたら話す
      try { const p = new SpeechSynthesisUtterance(" "); p.volume = 0; p.lang = "en-US"; speechSynthesis.speak(p); } catch (e) {}
      let started = false;
      const start = () => { if (started) return; started = true; load(); go(); };
      try { speechSynthesis.addEventListener("voiceschanged", start, { once: true }); } catch (e) {}
      setTimeout(start, 1200);
    }
    return true;
  }
  root.HMVoice = { ok, pick, speak, clean, list: () => (cache.length ? cache : load()).map((x) => ({ name: x.name, lang: x.v.lang, sex: x.sex, score: x.score })), stop: () => { token++; try { speechSynthesis.cancel(); } catch (e) {} } };
})(typeof window !== "undefined" ? window : globalThis);
