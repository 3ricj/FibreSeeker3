const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/docs/HLSD/continuous_fiber_gcode.md';
let s=fs.readFileSync(P,'latin1');
const EOL='\r\n';
function rep(old,nw,label){const o=old.join(EOL),n=nw.join(EOL);const c=s.split(o).length-1;if(c!==1){console.log('HIT '+label+' = '+c);process.exit(1);}s=s.split(o).join(n);}
rep(['5. Brush triple, against the head being put away, while it is still selected.'],
    ['6. Brush triple, against the head being put away, while it is still selected.'],'n6');
rep(['6. `M106 P2 S<n>` / `M106 P1 S<n>` - the demand routed to the cooling output'],
    ['7. `M106 P2 S<n>` / `M106 P1 S<n>` - the demand routed to the cooling output'],'n7');
rep(['7. `T0 ; switch extruder type to:FIBER`'],
    ['8. `T0 ; switch extruder type to:FIBER`'],'n8');
fs.writeFileSync(P,s,'latin1');
console.log('OK renumber');
