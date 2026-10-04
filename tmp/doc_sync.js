const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/docs/HLSD/continuous_fiber_gcode.md';
let s=fs.readFileSync(P,'latin1');
let bad=[];
function rep(o,n,l){o=o.replace(/\n/g,'\r\n');n=n.replace(/\n/g,'\r\n');const c=s.split(o).length-1;if(c!==1){bad.push('HIT '+c+' '+l);return;}s=s.split(o).join(n);console.log('OK '+l);}

rep(`Plastic -> fibre, in order:

1. Outgoing withdrawal of the plastic channel, at \`retract_length_toolchange\`,
   while T1 is still selected - E is illegal under T0.
2. \`M104 S<fs_t1_standby_temp> T1\` - park the head being put away.
3. \`M104 S<fs_t0_standby_temp> T0\` then \`M109 S<fs_t0_temp> T0\` - charge and
   wait for the incoming head. Skipped only on the first window of a primed
   plate, where the preamble preheat plus the priming line already paid it.`,
`Plastic -> fibre, in order:

1. \`M400\` - planner flush. The vendor leads EVERY tool-change block with it
   (181 occurrences in \`Benchy_renforced_level5.gcode\`; present in 136/136 and
   37/37 blocks across the reference exports), so no queued extrusion is still
   in flight when the temperature lines land. It precedes the withdrawal, so the
   caller emits it rather than the helper.
2. Outgoing withdrawal of the plastic channel, at \`retract_length_toolchange\`,
   while T1 is still selected - E is illegal under T0.
3. \`M104 S<fs_t1_standby_temp> T1\` - park the head being put away.
4. \`M104 S<fs_t0_temp> T0\` then \`M109 S<fs_t0_temp> T0\` - pre-charge and then
   wait for the incoming head. The pre-charge is at WORKING temperature, not
   standby: the vendor sends \`M104 S270 T0\` / \`M109 S270 T0\` on every entry into
   fibre, so the head is already climbing when the blocking wait is reached.
   Skipped only on the first window of a primed plate, where the preamble
   preheat plus the priming line already paid it.`,
'plastic->fibre list');

rep(`4. Brush triple, against the head being put away, while it is still selected.
5. \`M106 P2 S<n>\` / \`M106 P1 S<n>\` - the demand routed to the cooling output
   the depositing material needs (P2 -> fan4, fibre-side; P1 -> fan3
   part-cooling, per Exploration/HardwareInfo.md 7.3), the other output
   explicitly zeroed.
6. \`T0 ; switch extruder type to:FIBER\``,
`5. Brush triple, against the head being put away, while it is still selected.
6. \`M106 P2 S<n>\` / \`M106 P1 S<n>\` - the demand routed to the cooling output
   the depositing material needs (P2 -> fan4, fibre-side; P1 -> fan3
   part-cooling, per Exploration/HardwareInfo.md 7.3), the other output
   explicitly zeroed.
7. \`T0 ; switch extruder type to:FIBER\``,
'brush/fan/T0 renumber');

rep(`T0 is still selected because V is a T0-channel axis), \`M104\` standby on T0,
\`M109\` restoring T1 to its filament working temperature - the incoming head is
brought to temperature with a BLOCKING wait, because the standby dwell that wait
pays for happens on every window - the brush triple, the mirrored fan pair,
\`T1\`, then the E recovery of step 1.`,
`T0 is still selected because V is a T0-channel axis), \`M104\` standby on T0, then
\`M104 S<working> T1\` / \`M109 S<working> T1\` restoring the plastic head - the
incoming head is pre-charged and then brought to temperature with a BLOCKING
wait, because the standby dwell that wait pays for happens on every window - the
brush triple, the mirrored fan pair, \`T1\`, then the recovery of step 2. That
recovery is the exporter's own \`unretract()\`, which is unlift plus unretract, so
the switch is self-contained: the Z hop registered by the outgoing withdrawal is
released at the station rather than being left pending for the next extrusion.
The pristine base emitted neither half at the switch.`,
'return half');

if(bad.length){bad.forEach(b=>console.log('FAIL '+b));process.exit(1);}
fs.writeFileSync(P,s,'latin1');
const t=fs.readFileSync(P,'latin1');
console.log('CRLF='+((t.match(/\r\n/g)||[]).length)+' LF='+((t.match(/(?<!\r)\n/g)||[]).length));
