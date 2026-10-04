const fs=require('fs');
const R='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/';

// --- 1. PrintConfig.cpp defaults -------------------------------------------
const PC=R+'src/libslic3r/PrintConfig.cpp';
let p=fs.readFileSync(PC,'latin1');
function repP(old,nw,label){
  if(!old.includes('\r\n')) old=old.replace(/\n/g,'\r\n');
  if(!nw.includes('\r\n')) nw=nw.replace(/\n/g,'\r\n');
  const n=p.split(old).length-1;
  if(n!==1){console.log('HIT '+n+' '+label);process.exit(1);}
  p=p.split(old).join(nw); console.log('OK '+label);
}
const s=fs.readFileSync(R+'src/libslic3r/PrintConfig.cpp','latin1');
const i0=s.indexOf('def = this->add("fs_t0_standby_temp", coInt);');
const i1=s.indexOf('def = this->add("fs_t1_standby_temp", coInt);');
console.log('--- current t0_standby block ---');
console.log(s.slice(i0,i1).replace(/\r/g,''));
console.log('--- current t1_standby block (to next add) ---');
const i2=s.indexOf('def = this->add(',i1+10);
console.log(s.slice(i1,i2).replace(/\r/g,''));
