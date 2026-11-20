/* ほしまなび — 起動時のためし生成の結果を事前に計算して q-precalc.js に書き出す
   node tools/build_precalc.js         … 作りなおす
   node tools/build_precalc.js --check … いまの q-precalc.js が最新か確かめる（古いと exit 1） */
"use strict";
const fs = require("fs"), path = require("path"); const ROOT = path.join(__dirname, "..");
global.window = undefined; require(path.join(ROOT, "q-util.js"));
const files = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/q-[a-z0-9-]+\.js/g).filter((f, i, a) => f !== "q-util.js" && f !== "q-precalc.js" && a.indexOf(f) === i);
HM.PRECALC = { r: {} }; // 空のキャッシュで全部計算する
files.forEach((f) => require(path.join(ROOT, f)));
const t0 = Date.now(); HM.finalize(); const ms = Date.now() - t0;
const r = HM.PRECALC_NEW || {}; const keys = Object.keys(r).sort(); const out = {}; keys.forEach((k) => (out[k] = r[k]));
const body = "/* 自動生成：node tools/build_precalc.js（問題を変えたら作りなおす。古いキーは使われず、その場で計算される） */\n(function (root) { const HM = root.HM; HM.PRECALC = { v: " + JSON.stringify("1.5.1") + ", r: " + JSON.stringify(out) + " }; })(typeof window !== \"undefined\" ? window : globalThis);\n";
const file = path.join(ROOT, "q-precalc.js");
if (process.argv.includes("--check")) { const old = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""; const same = old.replace(/v: "[^"]*"/, "") === body.replace(/v: "[^"]*"/, ""); console.log(same ? "precalc OK" : "precalc が古い → node tools/build_precalc.js", keys.length, "keys"); process.exit(same ? 0 : 1); }
fs.writeFileSync(file, body); console.log("wrote q-precalc.js", keys.length, "keys", (body.length / 1024).toFixed(1) + "KB", "finalize(計算あり) " + ms + "ms");
