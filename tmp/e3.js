const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/fibreseeker/fixtures/good_toolchange_pair.gcode';
let s=fs.readFileSync(P,'latin1');
const EOL = s.indexOf('\r\n')>=0 ? '\r\n' : '\n';
function rep(old,nw,label){
  const o=old.join(EOL), n=nw.join(EOL);
  const c=s.split(o).length-1;
  if(c!==1){console.log('HIT '+label+' = '+c);process.exit(1);}
  s=s.split(o).join(n);
}
// 1. header prose: both heads now get a standby target
rep([
'; Temperature handling is asymmetric on purpose, and the asymmetry is measured',
'; rather than assumed. The head being PUT AWAY is dropped to STANDBY with a',
'; non-blocking M104. The head being ACTIVATED is pre-charged at WORKING',
'; temperature with a non-blocking M104 and then waited on with a blocking M109:',
'; the vendor sends M104 S270 T0 / M109 S270 T0 going into fibre and',
'; M104 S250 T1 / M109 S250 T1 coming out, so the incoming head is already',
'; climbing by the time the wait is reached.'],
[
'; Temperature handling: BOTH heads get a standby target at every switch, which',
'; is what the owner objective asks for, and the head being ACTIVATED then also',
'; gets a WORKING-temperature pre-charge immediately before its blocking M109,',
'; so it is already climbing by the time the wait is reached (M104 S270 T0 /',
'; M109 S270 T0 going into fibre, M104 S250 T1 / M109 S250 T1 coming out).',
';',
'; The vendor divergence is recorded, not copied. Measured over 636 M104-bearing',
'; blocks in the six reference exports (315 plastic->fibre, 321 fibre->plastic),',
'; the vendor emits exactly two M104 per block and 0/636 give the ACTIVATED head',
'; a standby target. The activated head standby line below is therefore a',
'; measured NO-OP: that head is already parked at that temperature, because the',
'; opposite half dropped it there when the previous window closed, and M104 does',
'; not block. It is emitted inside the readiness gate only, where an M109 follows',
'; to undo it.'],
'hdr');
// 2. to-fiber block: add the T0 standby before the pre-charge
rep([
'M104 S150 T1 ; standby',
'M104 S270 T0 ; pre-charge'],
[
'M104 S150 T1 ; standby',
'M104 S180 T0 ; standby',
'M104 S270 T0 ; pre-charge'],'in-standby');
// 3. fan comments: name the owning head
rep([
'M106 P2 S255 ; fibre-side cooling, fan4',
'M106 P1 S0 ; part-cooling, fan3'],
[
'M106 P2 S255 ; fibre-side cooling, fan4, owned by T0 (depositing)',
'M106 P1 S0 ; part-cooling, fan3, owned by T1 (idle)'],'fan-in');
rep([
'M106 P2 S0 ; fibre-side cooling, fan4',
'M106 P1 S255 ; part-cooling, fan3'],
[
'M106 P2 S0 ; fibre-side cooling, fan4, owned by T0 (idle)',
'M106 P1 S255 ; part-cooling, fan3, owned by T1 (depositing)'],'fan-out');
fs.writeFileSync(P,s,'latin1');
console.log('OK fixture  EOL='+JSON.stringify(EOL));
