const fs=require('fs');
let s=fs.readFileSync('e5.js','latin1');
const lines=s.split('\n');
const bad=lines.findIndex(l=>l.indexOf('c1-count')>=0);
if(bad<0){console.log('NO LINE');process.exit(1);}
const BS=String.fromCharCode(92);
lines[bad]='rep(["    CHECK(count_sub(s, \"'+BS+BS+'n'+BS+BS+'") == 9);"],["    CHECK(count_sub(s, \"'+BS+BS+'n'+BS+BS+'") == 10);"],\x27c1-count\x27);';
fs.writeFileSync('e5.js',lines.join('\n'),'latin1');
console.log('LINE '+bad+': '+lines[bad]);
