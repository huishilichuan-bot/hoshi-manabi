/* ほしまなび 英語 v1.6 — 4技能の問題の画面（ほしまなびオリジナルのデザイン）
   tl：カードをならべる（タップ・ドラッグ） ty：自分で書く sp：声に出して言う（マイク） mc：えらぶ（聞く・読む・長文） */
(function (root) {
  "use strict";
  if (!root.HMQ || !root.HM || !root.HM.EN4) return;
  const F = root.HMQ.fmt, E4 = root.HM.EN4;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const shuf = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  // ---- 英語の音声（en-US）。iOS はタップの中で読む ----
  const TTS = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
  const vol = () => { try { const v = root.HM_APP && root.HM_APP.state().settings.vol; return Math.max(0.2, v == null ? 0.8 : +v); } catch (e) { return 0.8; } };
  // 声えらびと読み上げは voice.js（HMVoice）：自然な en-US の声・会話は女の子と男の子で別の声
  // 録音した声（audio.js / HMAudio）があればそれを使い、なければ端末の読み上げ（voice.js / HMVoice）
  function say(lines, slow, onEnd, onLine) {
    const list = typeof lines === "string" ? lines : lines.map((l) => [l[0], l[1], l[2]]);
    if (root.HMAudio && root.HMAudio.speak(list, { slow, vol: vol(), onEnd, onLine })) return true;
    if (!TTS || !root.HMVoice) return false;
    return root.HMVoice.speak(list, { slow, vol: vol(), onEnd, onLine });
  }
  const canSay = () => TTS || !!(root.HMAudio && root.HMAudio.ok());
  E4.say = say;
  const audioBar = (big, txt) => !canSay() ? (typeof txt === "string" && txt ? '<div class="e4-au-txt say-text" lang="en">' + esc(txt) + "</div>" : "") : '<div class="e4-au' + (big ? " big" : "") + '"><button type="button" class="e4-play" data-e4="play"><span class="e4-wave"><i></i><i></i><i></i></span><b>聞く</b></button><button type="button" class="e4-slow" data-e4="slow" aria-label="ゆっくり聞く">🐢 ゆっくり</button></div>';
  function wireAudio(el, getLines) {
    try { if (root.HMAudio) root.HMAudio.prefetch(getLines()); } catch (e) {}
    const bubs = () => el.querySelectorAll(".e4-bub");
    const mark = (i) => bubs().forEach((x, k) => x.classList.toggle("say", k === i));
    el.querySelectorAll("[data-e4=play],[data-e4=slow]").forEach((b) => b.addEventListener("click", () => {
      const slow = b.dataset.e4 === "slow"; el.querySelectorAll("[data-e4]").forEach((x) => x.classList.remove("on")); b.classList.add("on");
      say(getLines(), slow, () => { b.classList.remove("on"); mark(-1); }, mark); setTimeout(() => b.classList.remove("on"), 30000);
    }));
    // 会話：ふきだしをタップすると、その文だけもう一度
    el.querySelectorAll(".e4-bub[data-line]").forEach((b) => b.addEventListener("click", () => {
      const all = getLines(), i = +b.dataset.line; if (!Array.isArray(all) || !all[i]) return;
      el.querySelectorAll("[data-e4]").forEach((x) => x.classList.remove("on")); mark(i);
      say([all[i]], false, () => mark(-1));
    }));
  }
  const stopTTS = () => { try { if (root.HMAudio) root.HMAudio.stop(); } catch (e) {} try { if (root.HMVoice) root.HMVoice.stop(); else if (TTS) speechSynthesis.cancel(); } catch (e) {} };
  const SK = { L: "🎧 リスニング", S: "🗣 スピーキング", W: "✏️ ライティング", R: "📖 リーディング" };
  root.HMQ.skillBadge = (q) => (q && q.skill && SK[q.skill] ? '<span class="e4-skill sk-' + q.skill + '">' + SK[q.skill] + "</span>" : "");
  const same = (a, b) => E4.ck(a) === E4.ck(b);

  // ===== tl：カードをならべて英文を作る（タップでも、ドラッグでも） =====
  F.tl = {
    init: (q) => { const all = q.pieces.concat(q.extra || []); return { all, order: shuf(all.map((_, i) => i)), pick: [] }; },
    html: (q) => (q.au ? audioBar(true, q.au) : "") + '<div class="e4-tl" id="e4tl"></div>',
    render(q, w, el) {
      const box = el.querySelector("#e4tl");
      const line = '<div class="e4-line" data-zone="line">' + (w.pick.length ? w.pick.map((i, k) => '<button type="button" class="e4-tile on" data-tp="' + k + '">' + esc(w.all[i]) + "</button>").join("") : '<span class="e4-ph">カードをタップ、またはここへドラッグ</span>') + "</div>";
      const pool = '<div class="e4-pool" data-zone="pool">' + w.order.map((i) => (w.pick.includes(i) ? '<span class="e4-tile ghost">' + esc(w.all[i]) + "</span>" : '<button type="button" class="e4-tile" data-tw="' + i + '">' + esc(w.all[i]) + "</button>")).join("") + "</div>";
      box.innerHTML = line + pool;
    },
    mount(q, w, el, api) {
      if (q.au) wireAudio(el, () => q.au);
      const box = el.querySelector("#e4tl"), re = () => { F.tl.render(q, w, el); api.ready(w.pick.length > 0); };
      re();
      let drag = null;
      const at = (x, y) => { const z = document.elementFromPoint(x, y); return z && z.closest("[data-zone]") ? z.closest("[data-zone]").dataset.zone : null; };
      const insertAt = (x, y) => { const ts = [...box.querySelectorAll(".e4-line .e4-tile")]; let k = ts.length; for (let j = 0; j < ts.length; j++) { const r = ts[j].getBoundingClientRect(); if (y < r.bottom && (y < r.top || x < r.left + r.width / 2)) { k = j; break; } } return k; };
      box.addEventListener("pointerdown", (e) => {
        if (w.done) return; const t = e.target.closest("[data-tw],[data-tp]"); if (!t) return;
        drag = { t, x: e.clientX, y: e.clientY, moved: false, ghost: null, from: t.dataset.tw != null ? "pool" : "line", idx: t.dataset.tw != null ? +t.dataset.tw : w.pick[+t.dataset.tp], k: t.dataset.tp != null ? +t.dataset.tp : -1 };
      });
      const mv = (e) => {
        if (!drag) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
        if (!drag.moved) { drag.moved = true; const g = drag.t.cloneNode(true); g.className = "e4-tile e4-ghost"; document.body.appendChild(g); drag.ghost = g; drag.t.classList.add("lift"); }
        e.preventDefault(); drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px";
        const z = at(e.clientX, e.clientY); box.querySelector(".e4-line").classList.toggle("over", z === "line");
      };
      const up = (e) => {
        if (!drag) return; const d = drag; drag = null;
        if (!d.moved) { // タップ
          if (d.from === "pool") w.pick.push(d.idx); else w.pick.splice(d.k, 1);
          api.sound("tap"); re(); return;
        }
        d.ghost.remove(); const z = at(e.clientX, e.clientY);
        if (z === "line") { if (d.from === "line") w.pick.splice(d.k, 1); const k = insertAt(e.clientX, e.clientY); w.pick.splice(Math.min(k, w.pick.length), 0, d.idx); api.sound("tap"); }
        else if (z === "pool" && d.from === "line") w.pick.splice(d.k, 1);
        re();
      };
      const cancel = () => { if (drag && drag.ghost) drag.ghost.remove(); drag = null; re(); };
      window.addEventListener("pointermove", mv, { passive: false }); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", cancel);
      w.cleanup = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); document.querySelectorAll(".e4-ghost").forEach((g) => g.remove()); stopTTS(); };
    },
    result(q, w) { const text = w.pick.map((i) => w.all[i]).join(" "); const ok = (q.acc || [q.a]).some((a) => a.toLowerCase() === text.toLowerCase()) || same(text, q.a); return { ok, text }; },
    show(q, w, el) {
      const ok = F.tl.result(q, w).ok;
      el.querySelectorAll(".e4-line [data-tp]").forEach((b, k) => b.classList.add(ok || (w.all[w.pick[k]] || "").toLowerCase() === (q.pieces[k] || "").toLowerCase() ? "right" : "wrong"));
      el.querySelectorAll(".e4-tile").forEach((b) => (b.disabled = true));
      const box = el.querySelector("#e4tl"); box.insertAdjacentHTML("beforeend", '<div class="e4-model"><span>' + (q.au ? "聞こえた英語" : "英語") + '</span><b>' + esc(q.en || q.a) + "</b>" + (q.au && q.ja ? "<small>" + esc(q.ja) + "</small>" : "") + "</div>");
      stopTTS();
    },
  };

  // ===== ty：自分で英語を書く（書き取り・和文英訳・1語の書き入れ） =====
  F.ty = {
    init: () => ({ v: "" }),
    html: (q) => (q.au ? audioBar(true, q.au) : "") + '<div class="e4-ty">' + (q.fill ? '<input class="e4-in one" id="e4in" type="text" inputmode="latin" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" lang="en" enterkeyhint="done" placeholder="1語で書こう">' : '<textarea class="e4-in" id="e4in" rows="2" autocomplete="off" autocapitalize="sentences" autocorrect="off" spellcheck="false" lang="en" enterkeyhint="done" placeholder="ここに英語で書こう"></textarea>') + '<div class="e4-meta"><span>' + (q.fill ? "1語" : q.words + "語の文") + '</span><span id="e4cnt">0語</span></div></div>',
    mount(q, w, el, api) {
      if (q.au) wireAudio(el, () => q.au);
      const inp = el.querySelector("#e4in"), cnt = el.querySelector("#e4cnt");
      const upd = () => { w.v = inp.value; const n = E4.tokens(w.v).length; cnt.textContent = n + "語"; api.ready(w.v.trim().length > 0); };
      inp.addEventListener("input", upd);
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); const b = document.getElementById("work-ok"); if (b && !b.disabled) b.click(); } });
      w.cleanup = stopTTS;
    },
    result(q, w) {
      const r = E4.judgeText(w.v, q.acc || [q.a]); w.r = r;
      if (r.close) return { ok: true, text: w.v.trim() + "（おしい！ 正しいつづり：" + r.fix.map((f) => f[1]).join(", ") + "）" };
      return { ok: !!r.ok, text: w.v.trim() || "（空らん）" };
    },
    show(q, w, el) {
      const inp = el.querySelector("#e4in"); inp.disabled = true; const r = w.r || {};
      inp.classList.add(r.ok ? (r.close ? "close" : "right") : "wrong");
      let h = '<div class="e4-model">';
      if (r.close) h += '<span class="e4-close">おしい！ つづりを確認しよう</span><b>' + r.fix.map((f) => esc(f[0]) + " → " + esc(f[1])).join("　") + "</b>";
      h += "<span>" + (q.fill ? "正しい文" : "英語") + "</span><b>" + esc(q.fill ? q.full : r.close && r.best ? r.best : q.a) + "</b>" + (q.au && q.ja ? "<small>" + esc(q.ja) + "</small>" : "") + "</div>";
      el.querySelector(".e4-ty").insertAdjacentHTML("beforeend", h); stopTTS();
    },
  };

  // ===== sp：声に出して言う（マイクで判定。80%以上の単語と大事な語が合えば合格） =====
  const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const MAX_TRY = 3;
  F.sp = {
    noSubmit: true,
    init: () => ({ tries: 0, rec: null, listening: false }),
    html(q) {
      const words = String(q.a).split(/\s+/);
      return '<div class="e4-sp"><div class="e4-say" id="e4say">' + words.map((x, i) => '<span class="e4-w" data-w="' + i + '">' + esc(x) + "</span>").join(" ") + '</div><div class="e4-ja">' + esc(q.ja) + "</div>" + audioBar(false) +
        (SR() ? '<button type="button" class="e4-mic" id="e4mic"><span class="e4-mic-i">🎤</span><b>タップして話す</b><small>話し終わると自動で判定するよ</small></button><div class="e4-heard" id="e4heard"></div>' :
          '<div class="e4-alt" id="e4alt"><p class="e4-tip">声に出して言ってから、カードでならべて答えよう</p><div class="e4-tl" id="e4tl"></div><button type="button" class="btn primary block" id="e4altok" disabled>こたえる</button></div>') +
        '<div class="e4-sp-foot"><button type="button" class="e4-later" id="e4later">あとで話す ›</button></div></div>';
    },
    mount(q, w, el, api) {
      wireAudio(el, () => q.a);
      el.querySelector("#e4later").addEventListener("click", () => { if (w.done) return; stopRec(); api.answer({ skip: true, text: "あとで話す" }); });
      const heard = el.querySelector("#e4heard");
      const mark = (marks) => el.querySelectorAll(".e4-w").forEach((s, i) => { s.classList.remove("hit", "miss"); if (marks) s.classList.add(marks[i] ? "hit" : "miss"); });
      function stopRec() { if (w.rec) { try { w.rec.abort(); } catch (e) {} w.rec = null; } w.listening = false; const b = el.querySelector("#e4mic"); if (b) b.classList.remove("rec"); }
      w.cleanup = () => { stopRec(); stopTTS(); };
      const C = SR();
      if (!C) { // マイクの判定ができないときは、カードでならべる
        const tq = { pieces: E4.tokens(q.a), extra: [], acc: [E4.tokens(q.a).join(" ")], a: E4.tokens(q.a).join(" ") }; const tw = F.tl.init(tq); w.alt = { tq, tw };
        const box = el.querySelector("#e4alt"), ok = el.querySelector("#e4altok");
        F.tl.mount(tq, tw, box, { ready: (on) => (ok.disabled = !on), sound: api.sound, toast: api.toast, answer: () => {} });
        const c0 = tw.cleanup; w.cleanup = () => { c0 && c0(); stopTTS(); };
        ok.addEventListener("click", () => { const r = F.tl.result(tq, tw); api.answer({ ok: r.ok, text: r.text }); });
        return;
      }
      const mic = el.querySelector("#e4mic");
      mic.addEventListener("click", () => {
        if (w.done) return;
        if (w.listening) { try { w.rec.stop(); } catch (e) {} return; }
        stopTTS();
        const rec = new C(); w.rec = rec; rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 5; rec.continuous = false;
        const alts = []; let gotAny = false;
        rec.onresult = (e) => { let interim = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) { for (let k = 0; k < r.length; k++) alts.push(r[k].transcript); } else interim += r[0].transcript; } gotAny = true; heard.innerHTML = '<span class="e4-live">' + esc(interim || alts[0] || "") + "</span>"; };
        rec.onerror = (e) => { w.err = e.error; };
        rec.onend = () => {
          const err = w.err; w.err = null; stopRec();
          if (w.done) return;
          if (err === "not-allowed" || err === "service-not-allowed") { heard.innerHTML = '<p class="e4-tip">マイクをオンにすると、声で判定できるよ（設定 → Safari → マイク）。今は「あとで話す」で次へ進もう</p>'; el.querySelector("#e4later").classList.add("glow"); return; }
          if (!alts.length && !gotAny) { heard.innerHTML = '<p class="e4-tip">声がとどかなかったみたい。🎤 をタップして、もう一度話してね</p>'; return; }
          const r = E4.judgeSpeech(alts.length ? alts : [heard.textContent], q.a, q.key);
          mark(r.marks); w.tries++;
          const pct = Math.round(r.rate * 100);
          if (r.ok) { heard.innerHTML = '<p class="e4-res ok">聞きとれた：「' + esc(r.heard) + "」<br>" + pct + "% 一致！</p>"; api.answer({ ok: true, text: r.heard + "（" + pct + "%）" }); return; }
          const left = MAX_TRY - w.tries;
          const why = !r.keyOk ? "大事な語（" + q.key.join(", ") + "）をはっきり言おう" : "赤い単語をもう一度ていねいに";
          heard.innerHTML = '<p class="e4-res">聞きとれた：「' + esc(r.heard) + "」 " + pct + "%<br>" + why + "</p>" + (left > 0 ? '<p class="e4-tip">あと ' + left + " 回チャレンジできるよ。🔊 でお手本を聞いてみよう</p>" : "");
          if (left <= 0) api.answer({ ok: false, text: r.heard + "（" + pct + "%）" });
        };
        try { rec.start(); w.listening = true; mic.classList.add("rec"); mic.querySelector("b").textContent = "聞いているよ…"; mic.querySelector("small").textContent = "話し終わったら、もう一度タップでもOK"; heard.innerHTML = ""; }
        catch (e) { heard.innerHTML = '<p class="e4-tip">もう一度 🎤 をタップしてね</p>'; }
        rec.addEventListener && rec.addEventListener("end", () => { const b = el.querySelector("#e4mic"); if (b) { b.querySelector("b").textContent = "タップして話す"; b.querySelector("small").textContent = "話し終わると自動で判定するよ"; } });
      });
    },
    result: (q, w) => ({ ok: false, text: "" }),
    show(q, w, el) {
      const m = el.querySelector("#e4mic"); if (m) m.disabled = true; const l = el.querySelector("#e4later"); if (l) l.remove();
      if (w.alt) { F.tl.show(w.alt.tq, w.alt.tw, el.querySelector("#e4alt")); const b = el.querySelector("#e4altok"); if (b) b.remove(); }
      if (w.cleanup) w.cleanup();
    },
  };

  // ===== mc：えらぶ（聞いて意味・会話・英文を読んで絵や意味・長文読解） =====
  F.mc = {
    noSubmit: true,
    init: () => ({}),
    html(q) {
      let h = "";
      if (q.passage) {
        const P = q.passage, paras = String(P.text).split(/\n\n/);
        h += '<div class="e4-pass"><div class="e4-pass-h"><b>' + esc(P.title) + '</b><span>' + P.words + " 語</span></div>" + (P.au ? audioBar(false) : "") + '<div class="e4-pass-t' + (P.words > 250 ? " long" : "") + '">' + paras.map((x) => "<p>" + esc(x).replace(/^([A-Z][a-zA-Z.]*): /, "<b>$1:</b> ").replace(/ ([A-Z][a-z]+(?: [A-Z][a-z]+)?): /g, "<br><b>$1:</b> ") + "</p>").join("") + "</div></div>";
      } else if (q.dlg) {
        // 会話の英文は、はじめから全部見せる（聞きながら読める）。ふきだしをタップすると、その文だけ聞ける
        h += '<div class="e4-dlg">' + audioBar(true) + '<div class="e4-dlg-l" id="e4dlg">' + q.dlg.map((l, i) => '<button type="button" class="e4-bub ' + (i % 2 ? "r" : "l") + '" data-line="' + i + '" lang="en"><b>' + esc(l[0]) + "</b><span>" + esc(l[1]) + '</span>' + (canSay() ? '<i class="e4-bub-ic" aria-hidden="true">🔊</i>' : "") + "</button>").join("") + "</div></div>";
      } else if (q.au) h += audioBar(true) + '<div class="e4-trans" id="e4tr"' + (canSay() ? " hidden" : "") + '>' + esc(q.au) + "</div>";
      else if (q.text) h += '<div class="e4-read">' + esc(q.text) + "</div>";
      if (q.pic) h += '<div class="e4-pic">' + esc(q.pic) + "</div>";
      h += '<div class="e4-opts' + (q.pics ? " pics" : "") + '">' + q.opts.map((o, i) => '<button type="button" class="e4-opt" data-mo="' + i + '">' + esc(o) + "</button>").join("") + "</div>";
      return h;
    },
    mount(q, w, el, api) {
      if (q.passage && q.passage.au) wireAudio(el, () => q.passage.text.replace(/\n\n/g, " "));
      else if (q.dlg) wireAudio(el, () => q.dlg.map((l) => [l[0], l[1], l[2] || "f"]));
      else if (q.au) wireAudio(el, () => q.au);
      el.querySelectorAll("[data-mo]").forEach((b) => b.addEventListener("click", () => { if (w.done) return; const o = q.opts[+b.dataset.mo]; w.given = o; api.answer({ ok: o === q.a, text: o }); }));
      w.cleanup = stopTTS;
    },
    result: (q, w) => ({ ok: w.given === q.a, text: w.given || "" }),
    show(q, w, el) {
      el.querySelectorAll("[data-mo]").forEach((b) => { const o = q.opts[+b.dataset.mo]; b.disabled = true; if (o === q.a) b.classList.add("right"); else if (o === w.given) b.classList.add("wrong"); });
      const d = el.querySelector("#e4dlg"); if (d) d.hidden = false; const t = el.querySelector("#e4tr"); if (t) t.hidden = false;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
