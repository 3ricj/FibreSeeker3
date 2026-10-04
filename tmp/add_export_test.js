const fs=require('fs');
const files=[
 '/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/CMakeLists.txt',
 '/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/ctrl1220/tests/libslic3r/CMakeLists.txt'
];
const ANCHOR='    test_fiber_strand.cpp\r\n';
const ADD='    test_fiber_export_identity.cpp\r\n';
for(const f of files){
  let s=fs.readFileSync(f,'latin1');
  if(s.indexOf(ADD)>=0){console.log('already '+f);continue;}
  const n=s.split(ANCHOR).length-1;
  if(n!==1){console.log('HIT '+n+' in '+f);continue;}
  fs.writeFileSync(f,s.split(ANCHOR).join(ANCHOR+ADD),'latin1');
  console.log('OK '+f);
}
