const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/GCode.cpp';
let s=fs.readFileSync(P,'latin1');
const OLD='                // Recovery of the outgoing withdrawal, emitted after T1 is selected\r\n' +
'                // because E is the active-extruder axis. Only the E half is issued here:\r\n' +
'                // the Z lift stays registered with the writer, so the normal path\r\n' +
'                // releases it on the next plastic extrusion instead of driving Z at the\r\n' +
'                // switch station. Guarded on the filament being tracked, exactly as\r\n' +
'                // GCode::retract() is, so an export without a writer filament is a\r\n' +
'                // no-op rather than a null dereference.\r\n';
const NEW='                // Full recovery of the outgoing withdrawal, emitted after T1 is\r\n' +
'                // selected because E is the active-extruder axis. GCode::unretract()\r\n' +
'                // is unlift() + unretract(), so BOTH halves of the pairing come out of\r\n' +
'                // the window: the Z hop registered by the eager_lift() above is released\r\n' +
'                // here rather than being left pending for the next plastic extrusion,\r\n' +
'                // and the filament is re-primed at deretraction_speed. On the shipped\r\n' +
'                // profile z_hop is 0 so eager_lift() recorded no lift and unlift() is a\r\n' +
'                // no-op; with a non-zero z_hop the switch is still self-contained.\r\n' +
'                // Guarded on the filament being tracked, exactly as GCode::retract()\r\n' +
'                // is, so an export without a writer filament is a no-op rather than a\r\n' +
'                // null dereference.\r\n';
const n=s.split(OLD).length-1;
if(n!==1){console.log('HITCOUNT_FAIL '+n);process.exit(1);}
fs.writeFileSync(P,s.split(OLD).join(NEW),'latin1');
console.log('OK');
