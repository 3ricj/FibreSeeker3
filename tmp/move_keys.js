const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/PrintConfig.hpp';
let s=fs.readFileSync(P,'latin1');
const BLOCK='    ((ConfigOptionInt, fs_t0_standby_temp))\r\n    ((ConfigOptionInt, fs_t1_standby_temp))\r\n    ((ConfigOptionFloat, fs_toolchange_retract_v))\r\n    ((ConfigOptionFloat, fs_toolchange_retract_v_speed))\r\n    ((ConfigOptionBool, fs_brush_on_toolchange))\r\n';
let n=s.split(BLOCK).length-1; if(n!==1){console.log('BLOCK_HIT '+n);process.exit(1);}
s=s.split(BLOCK).join('');
const ANCHOR='    ((ConfigOptionFloatOrPercent,     max_travel_detour_distance))\r\n';
n=s.split(ANCHOR).length-1; if(n!==1){console.log('ANCHOR_HIT '+n);process.exit(1);}
const NOTE='    // FibreSeeker3 composite tool-change keys. Registered here rather than beside the other\r\n' +
'    // fs_* keys in GCodeConfig because PRINT_CONFIG_CLASS_DEFINE expands its sequence with a\r\n' +
'    // recursive BOOST_PP_SEQ_FOR_EACH, and MSVC rejects the GCodeConfig sequence with C1009\r\n' +
'    // "macros nested too deeply" once it passes 227 entries (measured: 226 compiles, 228 does\r\n' +
'    // not). GCodeConfig sits at 226 with the priming keys already in it, so the five new keys go\r\n' +
'    // into PrintConfig, which derives from GCodeConfig: m_config.fs_* access, the printer-preset\r\n' +
'    // membership and the config-dump ban list are all unchanged by the move.\r\n' +
BLOCK;
s=s.split(ANCHOR).join(ANCHOR+NOTE);
fs.writeFileSync(P,s,'latin1');
console.log('OK');
