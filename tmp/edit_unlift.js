const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/GCode.cpp';
let s=fs.readFileSync(P,'latin1');
const OLD='                if (m_writer.filament() != nullptr)\r\n                    gcode += m_writer.unretract();\r\n';
const NEW='                if (m_writer.filament() != nullptr)\r\n                    gcode += this->unretract();\r\n';
const n=s.split(OLD).length-1;
if(n!==1){console.log('HITCOUNT_FAIL '+n);process.exit(1);}
s=s.split(OLD).join(NEW);
fs.writeFileSync(P,s,'latin1');
console.log('OK');
