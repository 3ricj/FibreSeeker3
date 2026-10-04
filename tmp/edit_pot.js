// Add the five new option label/tooltip strings to the translation template,
// matching the entries the priming commit added. Script form: CRLF file.
const fs = require('fs');
const file = process.argv[2];
const NL = '\r\n';
let txt = fs.readFileSync(file, 'latin1');

const anchor = 'msgid "XY length of the sacrificial composite priming line, mm. It must exceed the fiber cut tail, because a composite window deposits a body before the cut as well as the severed tail after it; a line no longer than the tail is refused rather than shortened."' + NL + 'msgstr ""' + NL;
if (txt.split(anchor).length - 1 !== 1) { console.error('ABORT: anchor not unique'); process.exit(1); }

const entries = [
    ['Composite nozzle standby temperature',
     'Nozzle temperature (degrees) the composite (T0) extruder is dropped to when a fiber window closes, and charged back from when the next window opens. Keeps the hotend ready without cooking matrix in the nozzle during the plastic pass. Emitted only when Composite nozzle temperature is set.'],
    ['Plastic nozzle standby temperature',
     'Nozzle temperature (degrees) the plastic (T1) extruder is dropped to while a fiber window runs, and restored from when the window closes. 0 leaves the plastic head on its working temperature through the fiber pass. Emitted only when Composite nozzle temperature is set.'],
    ['Matrix retract at tool change',
     'Stationary matrix (axis V) withdrawal issued when a fiber window hands the tool back to plastic, mm, in addition to the per-run matrix retract. The vendor machine issues one on every switch and never recovers it, which is what keeps the net commanded stationary V per fiber cycle negative. 0 disables it and leaves the cycle net positive by this amount.'],
    ['Matrix retract at tool change speed',
     'Feedrate of the tool-change matrix withdrawal, mm/min.'],
    ['Brush clean at fiber tool changes',
     'Visit the brush station at every fiber tool change, cleaning against the head being put away. The vendor machine cleans at every switch; the macros own the motion, so this only names the station. Requires Tool-wrap fiber windows.']
];

const block = entries.map(function (e) {
    return NL + 'msgid "' + e[0] + '"' + NL + 'msgstr ""' + NL + NL + 'msgid "' + e[1] + '"' + NL + 'msgstr ""' + NL;
}).join(NL);

txt = txt.replace(anchor, anchor + block);
fs.writeFileSync(file, Buffer.from(txt, 'latin1'));
const t2 = fs.readFileSync(file, 'latin1');
console.log('added; new msgids present: ' + ['Composite nozzle standby temperature', 'Plastic nozzle standby temperature',
    'Matrix retract at tool change', 'Matrix retract at tool change speed', 'Brush clean at fiber tool changes']
    .map(function (k) { return k + '=' + (t2.indexOf('msgid "' + k + '"') >= 0); }).join(' '));
console.log('CRLF=' + (t2.match(/\r\n/g) || []).length + ' bareLF=' + (t2.match(/(^|[^\r])\n/g) || []).length);
