require("../q-util.js"); const fs=require("fs");
fs.readFileSync(__dirname+"/../index.html","utf8").match(/q-[a-z0-9-]+\.js/g).filter(f=>f!=="q-util.js").forEach(f=>require("../"+f));
const res=[];
for (const [s,gs] of Object.entries(HM.SUBJECTS)) for (const [g,us] of Object.entries(gs)) for (const u of us) for (const st of u.steps) { if (typeof st.src!=="function") continue; let d=0, n=0; const all=new Set(); for (let k=0;k<40;k++){const set=HM.makeSet(st,k*31+5); const seen=new Set(); set.forEach(q=>{n++; const key=q.q+"|"+q.a; all.add(key); if(seen.has(key)) d++; seen.add(key);});} if (d) res.push([d/n, s, g, u.n, st.n, st.cnt, all.size]); }
res.sort((a,b)=>b[0]-a[0]); res.forEach(r=>console.log((r[0]*100).toFixed(0)+"%", r.slice(1).join(" / ")));
