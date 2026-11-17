// hm-merge.js の単体テスト（node tools/test_merge.js）
const M = require("../hm-merge.js"); let n = 0, f = 0;
const ok = (name, c, info) => { n++; if (!c) f++; console.log((c ? "PASS " : "FAIL ") + name + (c ? "" : " :: " + JSON.stringify(info))); };
const fresh = { totalStars: 0, pulls: 0, pullsUsed: 0, days: { "2026-11-17": { stars: 0, steps: {} } }, progress: {}, chars: { mori: { n: 1 } }, partner: "mori", settings: { nick: "", sound: true }, wrongBox: [], updatedAt: 999 };
const cloud = { totalStars: 12, pulls: 12, pullsUsed: 4, progress: { a: { best: 5, passed: true } }, chars: { mori: { n: 2 }, kitsune: { n: 1 } }, partner: "kitsune", settings: { nick: "テストくん", sound: false }, wrongBox: [{ k: "q" }], updatedAt: 10 };
let m = M.mergeStates(fresh, cloud);
ok("まっさらな端末ではクラウドをそのまま使う", m.settings.nick === "テストくん" && m.partner === "kitsune" && m.settings.sound === false && m.totalStars === 12, m);
const used = Object.assign({}, fresh, { totalStars: 3, pulls: 3, days: { d: { stars: 3, steps: { x: 1, y: 1, z: 1 } } } });
m = M.mergeStates(used, cloud);
ok("両方に記録：⭐は多い方・名前は空でうめる", m.totalStars === 15 || m.totalStars >= 12, m.totalStars);
ok("名前は空なら相手からうめる", m.settings.nick === "テストくん", m.settings);
ok("なかまは両方", m.chars.kitsune && m.chars.mori.n === 2);
ok("ガチャのこりはへらない", m.pulls - m.pullsUsed === 8, [m.pulls, m.pullsUsed]);
ok("ステップの記録は残る", m.progress.a.passed && m.days.d.steps.x);
m = M.mergeStates(used, null); ok("クラウドが空なら端末のまま", m.totalStars === 3);
console.log(`\n${n - f}/${n} passed`); process.exit(f ? 1 : 0);
