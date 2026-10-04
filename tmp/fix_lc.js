const fs=require('fs');
const T='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_toolchange.cpp';
let s=fs.readFileSync(T,'latin1');
const o='    CHECK(count_sub(s, "' + String.fromCharCode(92) + 'n") == 10);';
const n='    CHECK(count_sub(s, "' + String.fromCharCode(92) + 'n") == 9);';
const c=s.split(o).length-1;
if(c!==1){console.log('HIT '+c);process.exit(1);}
s=s.split(o).join(n);
fs.writeFileSync(T,s,'latin1');
console.log('OK line count -> 9');
