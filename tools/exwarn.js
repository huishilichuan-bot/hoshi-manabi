const fs=require("fs"),path=require("path");const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
for(const m of html.matchAll(/src="\.\/(q-[^"]+)"/g)) require(path.join(__dirname,"..",m[1]));
const HM=globalThis.HM;const seen=new Set();
for(const [s,gs] of Object.entries(HM.SUBJECTS))for(const [g,us] of Object.entries(gs))for(const u of us)for(const st of u.steps){
 let lines=Array.isArray(st.src)?st.src:[];
 for(const l of lines){const q=HM.parseBankLine(l);const key=String(q.a).replace(/[（(].*?[)）]/g,"").trim(); if(!q.ex.includes(key)&&!seen.has(l)){seen.add(l);console.log(s+g,"|",q.q.slice(0,50),"=>",q.a,"||",q.ex.slice(0,70));}}}
console.error(seen.size);
