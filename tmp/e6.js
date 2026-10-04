// Line-count golden: bump the plastic->fibre line count 9 -> 10 (one standby line
// added). Done by line scan so no backslash escaping is needed in this script.
const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_toolchange.cpp';
const raw=fs.readFileSync(P,'latin1');
const EOL=raw.indexOf('\r\n')>=0?'\r\n':'\n';
const L=raw.split(EOL);
let hits=0;
for(let i=0;i<L.length;i++){
  if(L[i].indexOf('count_sub(s,')>=0 && L[i].indexOf('== 9);')>=0 && L[i].indexOf('CHECK')>=0){
    // must be inside the plastic->fibre case: verify by scanning back for the TEST_CASE
    let tc=-1;
    for(let j=i;j>=0;j--) if(L[j].indexOf('TEST_CASE(')==0){tc=j;break;}
    if(tc>=0 && L[tc].indexOf('plastic -> fibre')>=0){ L[i]=L[i].replace('== 9);','== 10);'); hits++; }
  }
}
if(hits!==1){console.log('LINECOUNT HITS '+hits);process.exit(1);}
fs.writeFileSync(P,L.join(EOL),'latin1');
console.log('OK linecount');
