const fs = require('fs');
const OLD = '    // Explicit rather than left at the registered default, so the proof does\r\n' +
            '    // not silently become a fibre test if that default ever changes.\r\n' +
            '    config.set_key_value("fs_fiber_enabled", new ConfigOptionBool(false));\r\n';
const NEW = '    // Explicit rather than left at the registered default, so the proof does\r\n' +
            '    // not silently become a fibre test if that default ever changes.\r\n' +
            '    config.set_key_value("fs_fiber_enabled", new ConfigOptionBool(false));\r\n' +
            '    // The shipped P2 preset ships the fan off, which would leave the cooling\r\n' +
            '    // path - the one place the new fan routing could plausibly leak into a\r\n' +
            '    // plastic print - unexercised. Turn it on so the byte comparison covers the\r\n' +
            '    // cooling block and every fan line the exporter writes.\r\n' +
            '    config.set_key_value("enable_fan", new ConfigOptionBool(true));\r\n' +
            '    config.set_key_value("min_fan_speed", new ConfigOptionIntsGeneric(std::vector<int>{65}));\r\n' +
            '    config.set_key_value("max_fan_speed", new ConfigOptionIntsGeneric(std::vector<int>{100}));\r\n' +
            '    config.set_key_value("slowdown_below_cooling_time", new ConfigOptionBool(false));\r\n';
const files = [
  '/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_export_identity.cpp',
  '/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/ctrl1220/tests/libslic3r/test_fiber_export_identity.cpp'
];
for (const p of files) {
  let s = fs.readFileSync(p, 'latin1');
  const n = s.split(OLD).length - 1;
  if (n !== 1) { console.log('HIT ' + n + ' ' + p); continue; }
  fs.writeFileSync(p, s.split(OLD).join(NEW), 'latin1');
  console.log('OK ' + p);
}
