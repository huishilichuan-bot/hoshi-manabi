require("./q-util.js"); const fs=require("fs");
fs.readFileSync("index.html","utf8").match(/q-[a-z0-9-]+\.js/g).filter(f=>f!=="q-util.js").forEach(f=>require("./"+f));
HM.finalize && HM.finalize();
const only = process.argv[2] ? process.argv[2].split(",") : null;
for (const g of [3,4,5,6,7,8,9]) HM.SUBJECTS.en[g].forEach((u,ui)=>{ if(only && !only.includes(g+"-"+ui)) return; const seen=new Set(); for(let t=0;t<400&&seen.size<14;t++){ const S=u.gen([0.1,0.5,0.9][t%3]); if(S&&!seen.has(S.en)){seen.add(S.en); console.log(g+"-"+ui, S.en, "｜", S.ja);} } });
