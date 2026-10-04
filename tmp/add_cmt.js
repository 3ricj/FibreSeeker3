const fs=require('fs');
const G='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/GCode.cpp';
let g=fs.readFileSync(G,'latin1');
const o='                // Planner flush ahead of everything, matching the vendor, whose\r\n                // tool-change blocks all lead with M400. It has to precede the\r\n                // withdrawal below, so it is emitted here rather than by the helper.\r\n';
const n='                // Planner flush ahead of everything, matching the vendor, whose\r\n                // tool-change blocks all lead with M400. It has to precede the\r\n                // withdrawal below, so it is emitted here rather than by the helper.\r\n' +
'                //\r\n' +
'                // MEASURED SIDE EFFECT, accepted deliberately: this block and its\r\n' +
'                // partner below are emitted into the layer body BEFORE that body is\r\n' +
'                // fed through CoolingBuffer::process_layer, so CoolingBuffer\'s per-line\r\n' +
'                // time model now sees the withdrawal, the lift and the feedrate words\r\n' +
'                // that a paired switch adds. On layers carrying fibre it therefore\r\n' +
'                // computes a slightly LOWER part-cooling demand (measured on a 200-window\r\n' +
'                // composite export: bare M106 lines 71 -> 78, mean value -14.9, every one\r\n' +
'                // of the 79 changed Z groups inside a fibre window and none outside, and\r\n' +
'                // all 8614 real extrusion lines byte-identical). That is the correct sign:\r\n' +
'                // the switch really does spend wall-clock at the part, so the part really\r\n' +
'                // does cool more and needs less fan. Left as-is rather than hidden from\r\n' +
'                // the buffer, because suppressing it would make the cooling model less\r\n' +
'                // truthful, not more. Note the model is still incomplete in the other\r\n' +
'                // direction: the blocking M109 in the block is real time CoolingBuffer\r\n' +
'                // cannot see, as it only times G1 moves.\r\n';
const c=g.split(o).length-1;
if(c!==1){console.log('HIT '+c);process.exit(1);}
g=g.split(o).join(n);
fs.writeFileSync(G,g,'latin1');
const t=fs.readFileSync(G,'latin1');
console.log('OK comment; CRLF='+((t.match(/\r\n/g)||[]).length)+' LF='+((t.match(/(?<!\r)\n/g)||[]).length));
