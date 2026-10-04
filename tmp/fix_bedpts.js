const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/GCode.cpp';
let s=fs.readFileSync(P,'latin1');
const OLD='            const Points& bed_pts = m_config.printable_area.values;\r\n';
const NEW='            const Pointfs& bed_pts = m_config.printable_area.values;\r\n';
let n=s.split(OLD).length-1; if(n!==1){console.log('H1 '+n);process.exit(1);}
s=s.split(OLD).join(NEW);
const OLD2='                for (const Point& p : bed_pts)\r\n                    bed_min = bed_min.cwiseMin(unscaled(p));\r\n';
const NEW2='                for (const Vec2d& p : bed_pts)\r\n                    bed_min = bed_min.cwiseMin(p);\r\n';
n=s.split(OLD2).length-1; if(n!==1){console.log('H2 '+n);process.exit(1);}
s=s.split(OLD2).join(NEW2);
fs.writeFileSync(P,s,'latin1');console.log('OK');
