const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/docs/HLSD/continuous_fiber_gcode.md';
let s=fs.readFileSync(P,'latin1');
const EOL=s.indexOf('\r\n')>=0?'\r\n':'\n';
function rep(old,nw,label){const o=old.join(EOL),n=nw.join(EOL);const c=s.split(o).length-1;if(c!==1){console.log('HIT '+label+' = '+c);process.exit(1);}s=s.split(o).join(n);}

rep([
'   > **PENDING OWNER RULING - standby-target clause.** The objective asks for',
'   > "standby targets for both heads" at the plastic->fibre switch. Measured',
'   > against the reference exports on disk, that is not what the vendor does',
'   > and the clause is superseded: in **351 of 351** plastic->fibre blocks the',
'   > outgoing head gets a standby target () and the incoming head',
'   > gets a WORKING-temperature pre-charge () - **zero** blocks',
'   > drop the incoming head to standby on the way into fibre. The same shape',
'   > holds in reverse (358/358 fibre->plastic blocks:  standby +',
'   >  pre-charge). Both heads do receive a temperature target, so',
'   > the intent of the clause is met; only the word "standby" for the incoming',
'   > head is not. Emitting a T0 standby line there would be immediately',
'   > contradicted by the  two lines later and would lengthen the wait.',
'   > Flagged rather than settled.'],
[
'   > **Standby-target clause: IMPLEMENTED, vendor divergence recorded.** The',
'   > objective asks for "standby targets for both heads" at the plastic->fibre',
'   > switch, and the emitted block now carries both: ',
'   > and , followed by the working-temperature',
'   > pre-charge and the blocking wait. The divergence from the vendor is',
'   > measured, not assumed: across 636 M104-bearing reference blocks (315',
'   > plastic->fibre, 321 fibre->plastic) the vendor emits exactly two M104 per',
'   > block and **0/636** give the ACTIVATED head a standby target, so the',
'   > activated head standby line is a **no-op** rather than a behaviour change -',
'   > that head is already parked at that temperature, because the opposite half',
'   > dropped it there when the previous window closed, and M104 does not block.',
'   > It is emitted only inside the readiness gate, where a blocking M109 follows',
'   > to undo it; on the first window of a primed plate, where no M109 is',
'   > emitted, the line is withheld, because parking a head with no way back',
'   > would strand the composite head cold. That single gated exception is the',
'   > only place the clause yields, and it yields to not making the print worse',
'   > than the vendor.'],
'sb');

rep([
'   > **PENDING OWNER RULING - fan clause.** The objective asks for fan outputs',
'   > "routed explicitly per head". That wording is not satisfiable on this',
'   > machine and is superseded by the hardware documentation: P1 -> fan3 is',
'   > part-cooling and P2 -> fan4 is fibre-side (Exploration/HardwareInfo.md',
'   > 7.3 and its fans.cfg remap note), and **neither is documented as a',
'   > per-head output**, so there is no per-head fan output to route a signal',
'   > to. What the code does instead is route by which material is depositing -',
'   > the fibre-side output is driven during a fibre window and the',
'   > part-cooling output during a plastic window, with the unused one',
'   > explicitly zeroed - on both activation and deactivation, so no window',
'   > inherits a fan state from the previous one and the fibre path emits zero',
'   > bare . This is the substance of the clause, not its wording, and',
'   > the divergence is flagged rather than settled.'],
[
'   > **Fan clause: routed per head as far as the hardware allows; PENDING OWNER',
'   > RULING on the wording.** The objective asks for fan outputs "routed',
'   > explicitly per head". Taken literally as one fan per head, that is not',
'   > satisfiable on this machine: P1 -> fan3 is part-cooling and P2 -> fan4 is',
'   > fibre-side (Exploration/HardwareInfo.md 7.3 and its fans.cfg remap note),',
'   > and **neither is documented as a per-head output**, so there is no',
'   > per-head fan output to route a signal to. The emitted bytes now make the',
'   > per-head attribution explicit in the line itself -  and , mirrored on the way out - so each',
'   > head cooling output is attributable at the switch, the output the',
'   > depositing material needs carries the demand, the unused one is explicitly',
'   > zeroed, no window inherits a fan state from the previous one, and the fibre',
'   > path emits zero bare . **One sentence for the ruling: the ports are',
'   > shared, so this is per-head attribution and per-head activation/',
'   > deactivation of a shared output, not a physically separate fan per head -**',
'   > if the owner wants literal per-head fans, that is a firmware/fans.cfg',
'   > question, not an exporter one.'],
'fan');
fs.writeFileSync(P,s,'latin1');
console.log('OK doc  EOL='+JSON.stringify(EOL));
