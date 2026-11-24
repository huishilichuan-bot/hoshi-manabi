/* ほしまなび — 友だち招待（v1.6.4）
   ・ログインした人には、自分だけの6文字の招待コード。
   ・新しく始めた人（アカウントを作って30日以内）が友だちのコードを入れると、ふたりとも ガチャ回数 +3。
   ・コードを使えるのは1人1回だけ。自分のコードは使えない。招待した人のごほうびは10人まで。
   ・記録は Firestore の invites/{code}（持ち主の uid）と redeems/{uid}（使ったコードと招待した人）だけ。送信はしない（共有ボタンは端末の共有シートかコピー）。 */
(() => {
  "use strict";
  const REWARD = 3, MAX_FRIENDS = 10, NEW_DAYS = 30, ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", RE = /^[A-HJ-NP-Z2-9]{6}$/;
  const URL0 = "https://huishilichuan-bot.github.io/hoshi-manabi/", PEND = "hoshimanabi-ref";
  const A = () => window.HM_APP, AU = () => window.HMAuthUI;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const R = () => { const st = A().state(); if (!st.ref || typeof st.ref !== "object") st.ref = {}; const r = st.ref; r.code = r.code || ""; r.by = r.by || ""; if (!Array.isArray(r.claimed)) r.claimed = []; r.n = +r.n || 0; return r; };
  let off = false, busy = false, lastAt = 0, uidSeen = "", msg = "";
  try { const q = new URLSearchParams(location.search).get("ref"); if (q && RE.test(q.toUpperCase())) localStorage.setItem(PEND, q.toUpperCase()); } catch (e) {}
  const pending = () => { try { return localStorage.getItem(PEND) || ""; } catch (e) { return ""; } };
  const user = () => { try { return AU().state().user; } catch (e) { return null; } };
  const canEnter = (inv) => !R().by && Date.now() - (inv.created() || Date.now()) < NEW_DAYS * 864e5;
  const shareText = (code) => "ほしまなび（小1〜中3の無料学習アプリ）で いっしょに勉強しよう！\n招待コード【" + code + "】を入れると、ふたりとも ガチャ回数が " + REWARD + " 回ふえるよ。\n";
  const shareUrl = (code) => URL0 + "?ref=" + code;

  function sectionHtml() {
    const U = AU(); if (!U || !U.enabled || off) return "";
    const inv = U.inv(), r = inv ? R() : null;
    let h = '<div class="ref-card">';
    if (!inv) {
      h += '<div class="ref-hero">🎁</div><p class="ref-lead">ログインすると、自分だけの招待コードがもらえるよ。<br>友だちがコードを入れると、<b>ふたりとも ガチャ回数 +' + REWARD + '</b>！</p>';
      return h + "</div>";
    }
    setTimeout(() => refresh(false), 0);
    h += '<div class="ref-top"><span class="ref-gift">🎁</span><div><b>友だちを招待しよう</b><small>友だちがコードを入れると、ふたりとも ガチャ回数 +' + REWARD + "</small></div></div>";
    h += '<div class="ref-code" aria-label="あなたの招待コード">' + (r.code ? esc(r.code).split("").map((c) => "<i>" + c + "</i>").join("") : '<span class="ref-wait">コードを準備中…</span>') + "</div>";
    if (r.code) h += '<div class="ref-btns"><button type="button" class="btn primary" data-ref="share">📨 招待メッセージを送る</button><button type="button" class="btn" data-ref="copy">コピー</button></div>';
    h += '<p class="ref-stat">招待した友だち <b>' + r.claimed.length + "</b> 人" + (r.claimed.length ? "（ごほうび +" + r.n * REWARD + " 回）" : "") + ' <small>ごほうびは ' + MAX_FRIENDS + " 人まで</small></p>";
    if (canEnter(inv)) {
      h += '<div class="ref-in"><label for="ref-input">友だちの招待コードを入れる</label><div class="ref-row"><input id="ref-input" inputmode="latin" autocapitalize="characters" autocomplete="off" maxlength="6" placeholder="例：ABC234" value="' + esc(pending()) + '"><button type="button" class="btn primary" data-ref="redeem">決定</button></div></div>';
    } else if (r.by) h += '<p class="ref-used">✅ 招待コード「' + esc(r.by) + "」で ガチャ回数 +" + REWARD + " をもらったよ</p>";
    if (msg) h += '<p class="ref-msg">' + esc(msg) + "</p>";
    return h + "</div>";
  }
  function paint() { const el = document.getElementById("ref-sec"); if (el) el.innerHTML = sectionHtml(); }
  async function refresh(force) {
    const U = AU(), inv = U && U.inv(), u = user(); if (!inv || !u || busy) return;
    if (!force && uidSeen === u.uid && Date.now() - lastAt < 60000) return;
    busy = true; uidSeen = u.uid; lastAt = Date.now();
    const r = R(); let changed = false;
    try {
      if (!r.code) {
        for (let i = 0; i < 6 && !r.code; i++) {
          let c = ""; const b = new Uint32Array(6); crypto.getRandomValues(b); for (const x of b) c += ALPH[x % ALPH.length];
          try { await inv.create(c, u.uid); r.code = c; changed = true; } catch (e) { if ((e && e.code) !== "taken") throw e; }
        }
      }
      if (!r.by) { const m = await inv.mine(u.uid); if (m && m.code) { r.by = m.code; changed = true; } }
      const fr = await inv.friends(u.uid), fresh = fr.filter((x) => !r.claimed.includes(x));
      if (fresh.length) {
        const give = Math.max(0, Math.min(fresh.length, MAX_FRIENDS - r.n));
        r.claimed.push(...fresh); r.n += give; changed = true;
        if (give) { A().state().pulls += give * REWARD; A().toast("🎉 友だちが " + fresh.length + " 人参加したよ！ガチャ回数 +" + give * REWARD); try { A().sound("fanfare"); } catch (e) {} }
      }
    } catch (e) {
      if (/permission|denied/i.test((e && (e.code || e.message)) || "")) off = true;
    } finally { busy = false; }
    if (changed) A().save();
    paint();
  }
  async function redeem() {
    const U = AU(), inv = U && U.inv(), u = user(), el = document.getElementById("ref-input"); if (!inv || !u || !el) return;
    const code = String(el.value || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), r = R();
    const say = (t) => { msg = t; paint(); setTimeout(() => { if (msg === t) { msg = ""; } }, 6000); };
    if (!RE.test(code)) return say("6文字のコードを入れてね（例：ABC234）");
    if (code === r.code) return say("自分のコードは使えないよ。友だちのコードを入れてね");
    const b = document.querySelector('[data-ref="redeem"]'); if (b) b.disabled = true;
    try {
      const iv = await inv.get(code);
      if (!iv) return say("そのコードは見つからなかったよ。もう一度たしかめてね");
      if (iv.uid === u.uid) return say("自分のコードは使えないよ。友だちのコードを入れてね");
      await inv.redeem(u.uid, code, iv.uid);
      r.by = code; A().state().pulls += REWARD; A().save();
      try { localStorage.removeItem(PEND); } catch (e) {}
      msg = ""; A().toast("🎉 招待コードOK！ガチャ回数 +" + REWARD); try { A().sound("fanfare"); A().haptic(30); } catch (e) {}
      A().render();
    } catch (e) {
      const m = await inv.mine(u.uid).catch(() => null);
      if (m && m.code) { r.by = m.code; A().save(); say("招待コードは もう使っているよ"); }
      else say("うまくいかなかったよ。少したってから、もう一度ためしてね");
    } finally { if (b) b.disabled = false; }
  }
  async function share() {
    const code = R().code; if (!code) return;
    const text = shareText(code), url = shareUrl(code);
    if (navigator.share) { try { await navigator.share({ title: "ほしまなび", text, url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    copy();
  }
  async function copy() {
    const code = R().code; if (!code) return;
    const all = shareText(code) + shareUrl(code);
    let ok = false;
    try { await navigator.clipboard.writeText(all); ok = true; } catch (e) {
      try { const t = document.createElement("textarea"); t.value = all; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select(); ok = document.execCommand("copy"); t.remove(); } catch (x) {}
    }
    A().toast(ok ? "コピーしたよ。LINE などに はりつけて送ってね" : "コード：" + code);
  }
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest("[data-ref]"); if (!b) return;
    const a = b.dataset.ref; if (a === "share") share(); else if (a === "copy") copy(); else if (a === "redeem") redeem();
  });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && ev.target && ev.target.id === "ref-input") { ev.preventDefault(); redeem(); } });
  window.HMRef = { sectionHtml, refresh, REWARD, MAX_FRIENDS, NEW_DAYS, shareText, shareUrl, _state: () => ({ off, msg }) };
})();
