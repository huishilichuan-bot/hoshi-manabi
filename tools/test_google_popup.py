from playwright.sync_api import sync_playwright
import urllib.parse as u
with sync_playwright() as p:
    for name, bt in [("chromium", p.chromium), ("webkit", p.webkit)]:
        try:
            br = bt.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"]) if name == "chromium" else bt.launch()
        except Exception as e:
            print(name, "launch fail", str(e)[:100]); continue
        ctx = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=(name=="chromium"), has_touch=True)
        pg = ctx.new_page(); urls = []
        ctx.on("request", lambda r: urls.append(r.url) if ("accounts.google.com" in r.url or "/__/auth/" in r.url) else None)
        pg.goto("https://huishilichuan-bot.github.io/hoshi-manabi/"); pg.wait_for_timeout(5000)
        try:
            with pg.expect_popup(timeout=15000) as pi: pg.locator('[data-au="google"]').click()
            pop = pi.value; pop.wait_for_timeout(6000)
            print(name, "popup url:", pop.url[:100])
            pop.screenshot(path=f"/workspace/hoshi-manabi/screenshots/v14/live-google-popup-{name}.png")
            body = pop.inner_text("body")[:200].replace("\n", " ")
            print(name, "popup text:", body)
        except Exception as e:
            print(name, "popup err", str(e)[:150])
        for x in urls:
            if "accounts.google.com" in x:
                q = u.parse_qs(u.urlparse(x).query); print(name, "google:", q.get("redirect_uri"), q.get("client_id")); break
        print(name, "helper hits:", sorted(set(x.split("?")[0] for x in urls if "/__/auth/" in x)))
        br.close()
