// Repair two join/duplication artifacts left in GCode.cpp by an earlier
// whitespace-tolerant edit: a comment line that swallowed the next line, and a
// comment block that got emitted twice. Script form because the file is CRLF.
const fs = require('fs');
const file = process.argv[2];
const NL = '\r\n';
let t = fs.readFileSync(file, 'latin1');

// 1. Split the joined comment line back into two.
const joined = '            // Resolve the plastic head working temperature the way the exporter' +
    String.fromCharCode(39) + 's own            // tool-change handling would (GCode::_change_tool, line 10140): this path';
if (t.indexOf(joined) < 0) { console.error('ABORT: joined comment not found'); process.exit(1); }
const split = '            // Resolve the plastic head working temperature the way the exporter' +
    String.fromCharCode(39) + 's own' + NL +
    '            // tool-change handling would (GCode::_change_tool, line 10140): this path';
t = t.replace(joined, split);

// 2. Collapse the duplicated readiness-wait comment block into one copy.
const four = [
    '            // The plate preamble preheated T0 and the priming line already consumed the',
    '            // blocking wait for the first window: do not stall on a second M109 there.',
    '            // Every later window re-pays the wait, because the standby dwell took the',
    '            // head off its working temperature in between.'
].join(NL);
const dup = four + NL + four.replace('in between.', 'in between. The standby pair is NOT') + NL +
    '            // gated by this: parking the outgoing head is free and is the point.';
if (t.split(dup).length - 1 !== 1) { console.error('ABORT: duplicated block not found/uniquely matched'); process.exit(1); }
const keep = four.replace('in between.', 'in between. The standby pair is NOT') + NL +
    '            // gated by this: parking the outgoing head is free and is the point.';
t = t.replace(dup, keep);

fs.writeFileSync(file, Buffer.from(t, 'latin1'));
const t2 = fs.readFileSync(file, 'latin1');
console.log('OK  CRLF=' + (t2.match(/\r\n/g) || []).length + ' bareLF=' + (t2.match(/(^|[^\r])\n/g) || []).length);
