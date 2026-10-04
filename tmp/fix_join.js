const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/PrintConfig.hpp';
let s=fs.readFileSync(P,'latin1');
const OLD='    ((ConfigOptionFloat, fs_fiber_nozzle_diameter))    ((ConfigOptionFloat, fs_fill_min_wall_width))\r\n';
const NEW='    ((ConfigOptionFloat, fs_fiber_nozzle_diameter))\r\n    ((ConfigOptionFloat, fs_fill_min_wall_width))\r\n';
const n=s.split(OLD).length-1; if(n!==1){console.log('HIT '+n);process.exit(1);}
fs.writeFileSync(P,s.split(OLD).join(NEW),'latin1');console.log('OK');
