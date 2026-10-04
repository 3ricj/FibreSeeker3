// Count the tool-change sequence elements in the two real CF exports
// (pristine base vs modified), for the owner-row report.
const fs = require('fs');
function counts(p) {
  const L = fs.readFileSync(p, 'latin1').split(/\r?\n/);
  const c = {};
  const pats = {
    'T0->FIBER switches': /^T0 ; switch extruder type to:FIBER/,
    'T1->PLASTIC switches': /^T1 ; switch extruder type to:PLASTIC/,
    'CLEAN_NOZZLE': /^CLEAN_NOZZLE/,
    'M104 standby lines': /; standby$/,
    'M109 S270 T0 (fibre readiness wait)': /^M109 S270 T0/,
    'M109 S250 T1 (plastic readiness wait)': /^M109 S250 T1/,
    'Toolchange matrix retract (V-4)': /Toolchange matrix retract/,
    'window-end retract (V-1)': /^G1 F600 V-1\.000 ; Retract/,
    'E-10 outgoing withdrawal': /^G1 E-10 /,
    'E10 recovery': /^G1 E10 /,
    'bare M106 (unrouted)': /^M106 S\d+$/,
    'P-routed M106': /^M106 P\d+ S\d+/,
    'fibre windows (M1001)': /^M1001 /,
  };
  for (const line of L)
    for (const k in pats) if (pats[k].test(line)) c[k] = (c[k] || 0) + 1;
  return c;
}
const base = counts('/tmp/fib_base.gcode');
const mod = counts('/tmp/fib_mod.gcode');
const keys = Object.keys(base).concat(Object.keys(mod)).filter((v, i, a) => a.indexOf(v) === i);
console.log('element'.padEnd(42) + 'BASE'.padStart(7) + 'MOD'.padStart(7));
for (const k of keys)
  console.log(k.padEnd(42) + String(base[k] || 0).padStart(7) + String(mod[k] || 0).padStart(7));
