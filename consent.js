/* ほしまなび — はじめて使う前のプライバシーポリシー同意画面。
   同意するまでアプリの上をおおう。同意した版と日時は端末（localStorage「hoshimanabi:consent」）にだけ保存する。
   ポリシーの内容を大きく変えたら POLICY_V を上げると、もう一度同意画面が出る。 */
(function () {
  "use strict";
  var POLICY_V = "2026-11-20", KEY = "hoshimanabi:consent";
  var cur = null; try { cur = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  window.HM_CONSENT = { version: POLICY_V, ok: !!(cur && cur.v === POLICY_V), get: function () { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } } };
  if (window.HM_CONSENT.ok) return;
  var again = !!cur;
  var el = document.createElement("div");
  el.id = "consent"; el.className = "consent"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "プライバシーポリシーへの同意");
  el.innerHTML =
    '<div class="cs-card">' +
    '<div class="cs-logo">⭐</div><h2>ほしまなびへようこそ</h2>' +
    '<p class="cs-lead">' + (again ? "プライバシーポリシーを新しくしました。" : "はじめる前に、") + 'データのあつかいを<b>おうちの人といっしょに</b>読んでね。</p>' +
    '<ul class="cs-list">' +
    '<li><span>📱</span><div><b>ログインしないとき</b>：勉強の記録は、この端末の中（ブラウザ）だけに保存されます。外には送りません。</div></li>' +
    '<li><span>☁️</span><div><b>ログインしたとき</b>：メールアドレスと勉強の記録を、Google の Firebase に保存して、ほかの端末と同期します。</div></li>' +
    '<li><span>✍️</span><div><b>漢字の手書き</b>：書いた線はこの端末の中で判定するだけで、保存も送信もしません。</div></li>' +
    '<li><span>🚫</span><div><b>広告・課金・アクセス解析はありません。</b>情報を売ったり、ほかの会社にわたしたりしません。</div></li>' +
    '<li><span>🗑️</span><div>記録やアカウントは、マイページからいつでも消せます。</div></li>' +
    "</ul>" +
    '<p class="cs-links"><a href="./privacy.html">プライバシーポリシー（全文）</a> ・ <a href="./terms.html">利用規約</a></p>' +
    '<label class="cs-check"><input type="checkbox" id="cs-agree"><span>プライバシーポリシーと利用規約を読んで、同意します（小学生・中学生の人は、おうちの人に確認してもらってね）</span></label>' +
    '<button type="button" class="cs-btn" id="cs-ok" disabled>同意してはじめる</button>' +
    "</div>";
  function mount() {
    document.body.appendChild(el); document.documentElement.classList.add("consent-open");
    var cb = el.querySelector("#cs-agree"), ok = el.querySelector("#cs-ok");
    cb.addEventListener("change", function () { ok.disabled = !cb.checked; });
    ok.addEventListener("click", function () {
      if (!cb.checked) return;
      try { localStorage.setItem(KEY, JSON.stringify({ v: POLICY_V, t: Date.now() })); } catch (e) {}
      window.HM_CONSENT.ok = true; el.classList.add("out"); document.documentElement.classList.remove("consent-open");
      setTimeout(function () { el.remove(); }, 350);
      try { window.dispatchEvent(new Event("hm-consent")); } catch (e) {}
    });
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
