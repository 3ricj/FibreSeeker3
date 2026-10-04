// Apply one exact-string replacement to a CRLF file, byte-exact, and report
// whether it landed. Used instead of the edit tool because that tool's
// whitespace-tolerant matching joins CRLF lines in this repo.
const fs = require('fs');
const file = process.argv[2];
const oldB64 = process.argv[3];
const newB64 = process.argv[4];
const oldText = Buffer.from(oldB64, 'base64').toString('latin1');
const newText = Buffer.from(newB64, 'base64').toString('latin1');
const txt = fs.readFileSync(file, 'latin1');
const hits = txt.split(oldText).length - 1;
if (hits !== 1) {
    console.error('ABORT: pattern occurs ' + hits + ' times (need exactly 1) in ' + file);
    process.exit(1);
}
fs.writeFileSync(file, Buffer.from(txt.replace(oldText, newText), 'latin1'));
const t2 = fs.readFileSync(file, 'latin1');
console.log('OK ' + file + '  CRLF=' + (t2.match(/\r\n/g) || []).length + ' bareLF=' + (t2.match(/(^|[^\r])\n/g) || []).length);
