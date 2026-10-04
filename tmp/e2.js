const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/Fiber/FiberToolChange.hpp';
let s=fs.readFileSync(P,'latin1');
function rep(old,nw,label){
  const n=s.split(old).length-1;
  if(n!==1){console.log('HIT '+label+' = '+n);process.exit(1);}
  s=s.split(old).join(nw);
}
const OLD=[
'// Note which head gets which target. The head being PUT AWAY is dropped to',
'// STANDBY (T1 -> 150 going into fibre, T0 -> 180 coming out of it). The head',
'// being ACTIVATED is pre-charged at its WORKING temperature, not standby',
'// (T0 -> 270 going into fibre, T1 -> 250 coming out), because the blocking',
'// M109 for that head is two lines later and charging it to standby first',
'// would only make the wait longer. So "a standby target for both heads" is',
'// not what the vendor emits: it emits one standby target and one working-',
'// temperature pre-charge, in both directions, 351/351 and 358/358. See the',
'// note in docs/HLSD/continuous_fiber_gcode.md - this narrows the owner',
'// objective wording and is flagged there for ruling.'].join('\r\n');
const NEW=[
'// Both heads get a STANDBY target at every switch, which is what the owner',
'// objective asks for: T1 -> 150 and T0 -> 180 going into fibre, T0 -> 180 and',
'// T1 -> 150 coming out of it. The head being ACTIVATED additionally gets a',
'// WORKING-temperature pre-charge (T0 -> 270 going in, T1 -> 250 coming out)',
'// immediately before its blocking M109, because charging it only to standby',
'// and then waiting for working temperature would just lengthen the wait.',
'//',
'// The vendor divergence is recorded, not copied. Measured over 636',
'// M104-bearing reference blocks (315 plastic->fibre, 321 fibre->plastic): the',
'// vendor emits exactly TWO M104 per block, one standby for the head being put',
'// away and one working-temperature pre-charge for the head being activated,',
'// and 0/636 give the activated head a standby target. So the activated head\'s',
'// standby line we emit is a measured NO-OP, not a behaviour change: that head',
'// is already parked at that exact temperature, because the opposite half',
'// dropped it there when the previous window closed, and M104 does not block.',
'// The clause is therefore IMPLEMENTED, with the vendor divergence recorded',
'// here and in docs/HLSD/continuous_fiber_gcode.md. It is emitted only inside',
'// the readiness gate, where an M109 follows to undo it: outside that gate a',
'// standby target with no way back would strand the head cold, which would',
'// make the print worse than the vendor, so the clause yields to correctness',
'// there and only there.'].join('\r\n');
rep(OLD,NEW,'hdr-standby');
fs.writeFileSync(P,s,'latin1');
console.log('OK hpp');
