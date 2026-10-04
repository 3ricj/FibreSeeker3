const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_toolchange.cpp';
let s=fs.readFileSync(P,'latin1');
const EOL='\r\n';
function rep(old,nw,label){const o=old.join(EOL),n=nw.join(EOL);const c=s.split(o).length-1;if(c!==1){console.log('HIT '+label+' = '+c);process.exit(1);}s=s.split(o).join(n);}
rep([
'    // Both heads are targeted on both halves: the head being put away is always',
'    // dropped to standby, and the head being activated is brought to temperature',
'    // (M104 pre-charge + M109 wait going in, M109 wait coming back).',
'    CHECK(count_sub(in, "M104") == 2);',
'    CHECK(count_sub(in, "M109") == 1);',
'    CHECK(count_sub(out, "M104") == 2);',
'    CHECK(count_sub(out, "M109") == 1);'],
[
'    // Both heads are targeted on both halves: the head being put away is always',
'    // dropped to standby, and the head being activated is brought to temperature',
'    // (M104 pre-charge + M109 wait going in, M109 wait coming back).',
'    //',
'    // The counts are deliberately asymmetric. Going INTO fibre the block carries',
'    // a standby target for BOTH heads, which is the clause the owner objective',
'    // states literally for this half, so three M104: T1 standby, T0 standby, then',
'    // the T0 working-temperature pre-charge. Coming OUT of fibre the objective',
'    // asks only for the second matrix withdrawal and the recovery, so two M104:',
'    // T0 standby plus the T1 pre-charge. Adding a T1 standby on the return half',
'    // would be a third no-op line for a clause nobody asked about, so it is not',
'    // emitted.',
'    CHECK(count_sub(in, "M104") == 3);',
'    CHECK(count_sub(in, "M109") == 1);',
'    CHECK(count_sub(out, "M104") == 2);',
'    CHECK(count_sub(out, "M109") == 1);'],'pair');
fs.writeFileSync(P,s,'latin1');
console.log('OK pair golden');
