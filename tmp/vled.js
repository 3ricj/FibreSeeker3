const fs=require('fs');
const t=fs.readFileSync('/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_toolchange.cpp','latin1');
const i=t.indexOf('stationary V ledger closes');
console.log(t.slice(i-40,i+1400).replace(/\r/g,''));
