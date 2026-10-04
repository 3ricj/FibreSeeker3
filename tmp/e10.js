const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/docs/HLSD/continuous_fiber_gcode.md';
let s=fs.readFileSync(P,'latin1');
const EOL='\r\n';
function rep(old,nw,label){const o=old.join(EOL),n=nw.join(EOL);const c=s.split(o).length-1;if(c!==1){console.log('HIT '+label+' = '+c);process.exit(1);}s=s.split(o).join(n);}
rep([
'3. `M104 S<fs_t1_standby_temp> T1` - park the head being put away.',
'4. `M104 S<fs_t0_temp> T0` then `M109 S<fs_t0_temp> T0` - pre-charge and then',
'   wait for the incoming head. The pre-charge is at WORKING temperature, not',
'   standby: the vendor sends `M104 S270 T0` / `M109 S270 T0` on every entry into',
'   fibre, so the head is already climbing when the blocking wait is reached.',
'   Skipped only on the first window of a primed plate, where the preamble',
'   preheat plus the priming line already paid it.'],
[
'3. `M104 S<fs_t1_standby_temp> T1` - park the head being put away.',
'4. `M104 S<fs_t0_standby_temp> T0` - the standby target for the incoming head,',
'   so the block carries a standby target for BOTH heads as the objective',
'   requires. Measured no-op (the vendor does not send it, 0/636 blocks; the head',
'   is already parked here by the previous window exit) and overridden by step 5.',
'5. `M104 S<fs_t0_temp> T0` then `M109 S<fs_t0_temp> T0` - pre-charge and then',
'   wait for the incoming head. The pre-charge is at WORKING temperature, not',
'   standby: the vendor sends `M104 S270 T0` / `M109 S270 T0` on every entry into',
'   fibre, so the head is already climbing when the blocking wait is reached.',
'   Steps 4 and 5 are skipped together on the first window of a primed plate,',
'   where the preamble preheat plus the priming line already paid the wait, and',
'   where parking the head with no blocking wait to undo it would strand it cold.'],
'step4');
fs.writeFileSync(P,s,'latin1');
console.log('OK steps');
