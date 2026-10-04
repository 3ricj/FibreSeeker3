// Normalise bare-LF lines to CRLF in the files this task touched, so the edits
// match the CRLF line endings the rest of each file already carries. Only lines
// that end in a bare LF are rewritten; nothing else changes.
const fs = require('fs');
const files = process.argv.slice(2);
files.forEach(function (f) {
    const buf = fs.readFileSync(f);
    const txt = buf.toString('latin1');
    let out = '';
    let converted = 0;
    let i = 0;
    while (i < txt.length) {
        const nl = txt.indexOf('\n', i);
        if (nl === -1) { out += txt.slice(i); break; }
        const line = txt.slice(i, nl);
        if (line.length > 0 && line[line.length - 1] === '\r') {
            out += line + '\n';                 // already CRLF
        } else {
            out += line + '\r\n';               // bare LF -> CRLF
            converted++;
        }
        i = nl + 1;
    }
    fs.writeFileSync(f, Buffer.from(out, 'latin1'));
    console.log(f + ': ' + converted + ' bare-LF lines converted to CRLF');
});
