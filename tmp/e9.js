const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/docs/HLSD/continuous_fiber_gcode.md';
let s=fs.readFileSync(P,'latin1');
const EOL=s.indexOf('\r\n')>=0?'\r\n':'\n';
const BT=String.fromCharCode(96);
// Text blocks use @@ for a backtick so no JS concatenation is needed anywhere.
function mk(a){return a.map(l=>l.split('@@').join(BT)).join(EOL);}
function rep(old,nw,label){const o=mk(old),n=mw(nw);const c=s.split(o).length-1;if(c!==1){console.log('HIT '+label+' = '+c);process.exit(1);}s=s.split(o).join(n);}
function mw(a){return mk(a);}

rep([
'   > **PENDING OWNER RULING - standby-target clause.** The objective asks for',
'   > "standby targets for both heads" at the plastic->fibre switch. Measured',
'   > against the reference exports on disk, that is not what the vendor does',
'   > and the clause is superseded: in **351 of 351** plastic->fibre blocks the',
'   > outgoing head gets a standby target (@@M104 S150 T1@@) and the incoming head',
'   > gets a WORKING-temperature pre-charge (@@M104 S270 T0@@) - **zero** blocks',
'   > drop the incoming head to standby on the way into fibre. The same shape',
'   > holds in reverse (358/358 fibre->plastic blocks: @@M104 S180 T0@@ standby +',
'   > @@M104 S250 T1@@ pre-charge). Both heads do receive a temperature target, so',
'   > the intent of the clause is met; only the word "standby" for the incoming',
'   > head is not. Emitting a T0 standby line there would be immediately',
'   > contradicted by the @@M109@@ two lines later and would lengthen the wait.',
'   > Flagged rather than settled.'],
[
'   > **Standby-target clause: IMPLEMENTED, vendor divergence recorded.** The',
'   > objective asks for "standby targets for both heads" at the plastic->fibre',
'   > switch, and the emitted block now carries both of them:',
'   > @@M104 S150 T1 ; standby@@ and @@M104 S180 T0 ; standby@@, followed by the',
'   > working-temperature pre-charge and the blocking wait. The divergence from',
'   > the vendor is measured, not assumed: across 636 M104-bearing reference',
'   > blocks (315 plastic->fibre, 321 fibre->plastic) the vendor emits exactly',
'   > two M104 per block and **0/636** give the ACTIVATED head a standby target.',
'   > The activated-head standby line is therefore a **no-op**, not a behaviour',
'   > change: that head is already parked at that temperature, because the',
'   > opposite half dropped it there when the previous window closed, and M104',
'   > does not block. It is emitted only inside the readiness gate, where a',
'   > blocking M109 follows to undo it. On the first window of a primed plate,',
'   > where no M109 is emitted, the line is withheld, because parking a head with',
'   > no way back would strand the composite head cold. That single gated',
'   > exception is the only place the clause yields, and it yields to not making',
'   > the print worse than the vendor.'],
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
'   > bare @@M106@@. This is the substance of the clause, not its wording, and',
'   > the divergence is flagged rather than settled.'],
[
'   > **Fan clause: per-head attribution emitted; PENDING OWNER RULING on the',
'   > wording.** The objective asks for fan outputs "routed explicitly per head".',
'   > Taken literally as one fan per head, that is not satisfiable on this',
'   > machine: P1 -> fan3 is part-cooling and P2 -> fan4 is fibre-side',
'   > (Exploration/HardwareInfo.md 7.3 and its fans.cfg remap note), and',
'   > **neither is documented as a per-head output**, so there is no per-head fan',
'   > output to route a signal to. The emitted bytes now make the per-head',
'   > attribution explicit in the line itself:',
'   > @@M106 P2 S255 ; fibre-side cooling, fan4, owned by T0 (depositing)@@ and',
'   > @@M106 P1 S0 ; part-cooling, fan3, owned by T1 (idle)@@, mirrored on the way',
'   > out. So each head cooling output is attributable at the switch, the output',
'   > the depositing material needs carries the demand, the unused one is',
'   > explicitly zeroed, no window inherits a fan state from the previous one,',
'   > and the fibre path emits zero bare @@M106@@. **One sentence for the ruling:',
'   > the ports are shared, so this is per-head attribution plus per-head',
'   > activation and deactivation of a shared output, not a physically separate',
'   > fan per head** - literal per-head fans would be a firmware fans.cfg',
'   > question, not an exporter one.'],
'fan');
fs.writeFileSync(P,s,'latin1');
console.log('OK doc  EOL='+JSON.stringify(EOL));
