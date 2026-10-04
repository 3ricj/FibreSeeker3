const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/b286adc9ffdb76b2fe4314806b97ad0a/.worktrees/task_d71213a54c246e952b54f607dae12df4/tmp/ctrl/src/libslic3r/PrintConfig.hpp';
let s=fs.readFileSync('/tmp/ctrlpc.bak','latin1');
const N=parseInt(process.argv[2],10);
const ANCHOR='    ((ConfigOptionBool,                support_fast_purge_mode))\r\n';
let add='';
for(let i=0;i<N;i++) add+='    ((ConfigOptionBool,                fs_dummy_'+i+'_x))\r\n';
const n=s.split(ANCHOR).length-1; if(n!==1){console.log('ANCHOR '+n);process.exit(1);}
s=s.split(ANCHOR).join(ANCHOR+add);
fs.writeFileSync(P,s,'latin1');
console.log('N='+N+' count='+(s.split('((ConfigOption').length-1));
