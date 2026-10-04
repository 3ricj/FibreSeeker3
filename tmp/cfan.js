// Measured before/after from the two real CF exports, plus the V ledger and the
// new standby / fan-owner lines.
const fs = require('fs');
const TMP = '/tmp/fsfib2';
function load(f) { return fs.readFileSync(f, 'latin1').split(/\r?\n/); }
const T = { base: load(TMP + '/fiber_base.gcode'), mod: load(TMP + '/fiber_mod.gcode') };

const PATS = {
  'fibre windows (M1001)':       /^M1001/,
  'T0 -> FIBER switch':          /^T0 ; switch extruder type to:FIBER/,
  'T1 -> PLASTIC switch':        /^T1 ; switch extruder type to:PLASTIC/,
  'E withdrawal (E-10)':         /^G1 E-10\b/,
  'E recovery (E10)':            /^G1 E10\b/,
  'M400 planner flush':          /^M400/,
  'M104 standby lines':          /^M104 S\d+ T\d ; standby/,
  'M104 pre-charge lines':       /^M104 S\d+ T\d ; pre-charge/,
  'M109 S270 T0 (fibre ready)':  /^M109 S270 T0/,
  'M109 S250 T1 (plastic ready)':/^M109 S250 T1/,
  'CLEAN_NOZZLE':                /^CLEAN_NOZZLE/,
  'V-4 toolchange withdrawal':   /^G1 F600 V-4\.000/,
  'P-word M106':                 /^M106 P\d/,
  'bare M106':                   /^M106 S/,
  'M106 P2 owned by T0':         /^M106 P2 S\d+ ; fibre-side cooling, fan4, owned by T0/,
  'M106 P1 owned by T1':         /^M106 P1 S\d+ ; part-cooling, fan3, owned by T1/
};
console.log('element'.padEnd(34) + 'BASE'.padStart(8) + 'MOD'.padStart(8));
for (const k in PATS) {
  const b = T.base.filter(l => PATS[k].test(l)).length;
  const m = T.mod.filter(l => PATS[k].test(l)).length;
  console.log(k.padEnd(34) + String(b).padStart(8) + String(m).padStart(8));
}

// V ledger, measured from the emitted V words only.
function vledger(L) {
  let pos = 0, neg = 0, n_pos = 0, n_neg = 0;
  for (const l of L) {
    const m = l.match(/^G1 F\d+ V(-?[0-9.]+)/);
    if (!m) continue;
    const v = parseFloat(m[1]);
    if (v > 0) { pos += v; n_pos++; } else if (v < 0) { neg += v; n_neg++; }
  }
  return { pos: pos, neg: neg, net: pos + neg, n_pos: n_pos, n_neg: n_neg };
}
for (const t of ['base', 'mod']) {
  const v = vledger(T[t]);
  const win = T[t].filter(l => /^M1001/.test(l)).length;
  console.log('\nV ledger ' + t + ': +V=' + v.pos.toFixed(3) + ' (' + v.n_pos + ' lines)  -V=' + v.neg.toFixed(3) +
    ' (' + v.n_neg + ' lines)  NET=' + v.net.toFixed(3) + '  windows=' + win + '  net/window=' + (v.net / win).toFixed(3));
}

// One plastic->fibre and one fibre->plastic block from each tree, by context.
function block(L, toolRe, back, fwd, label) {
  for (let i = 0; i < L.length; i++) {
    if (toolRe.test(L[i]) && i > 4000) {
      console.log('--- ' + label + ' (line ' + (i + 1) + ') ---');
      for (let j = Math.max(0, i - back); j < Math.min(L.length, i + fwd); j++)
        if (L[j].trim() !== '') console.log('    ' + L[j].trim());
      return;
    }
  }
  console.log('--- ' + label + ': NOT FOUND ---');
}
console.log('');
block(T.base, /^T0 ; switch extruder type to:FIBER/, 14, 2, 'BASE  plastic -> fibre');
block(T.mod,  /^T0 ; switch extruder type to:FIBER/, 14, 2, 'MOD   plastic -> fibre');
console.log('');
block(T.base, /^T1 ; switch extruder type to:PLASTIC/, 12, 4, 'BASE  fibre -> plastic');
block(T.mod,  /^T1 ; switch extruder type to:PLASTIC/, 14, 4, 'MOD   fibre -> plastic');
