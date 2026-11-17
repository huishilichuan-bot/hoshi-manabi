const fs=require("fs"),path=require("path");const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
for(const m of html.matchAll(/src="\.\/(q-[^"]+)"/g)) require(path.join(__dirname,"..",m[1]));
const HM=globalThis.HM;const res={};
for(const [s,gs] of Object.entries(HM.SUBJECTS))for(const [g,us] of Object.entries(gs))for(const u of us)for(const st of u.steps){if(typeof st.src!=="function")continue;let mn=99;for(let k=0;k<40;k++)mn=Math.min(mn,HM.makeSet(st,k*7919+13).length);if(mn<st.cnt)console.log(s,g,u.n,st.n,mn+"/"+st.cnt);}
