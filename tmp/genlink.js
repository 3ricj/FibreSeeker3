const fs=require('fs');
const ROOTS={mine:'C:/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/buildfs',ctrl:'C:/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/buildctrl'};
const s=fs.readFileSync(ROOTS.mine+'/tests/libslic3r/libslic3r_tests.vcxproj','latin1');
const m=[...s.matchAll(/<AdditionalDependencies>([\s\S]*?)<\/AdditionalDependencies>/g)].map(x=>x[1]);
const rel=m.find(b=>/Release/.test(b));
let libs=rel.split(';').map(x=>x.trim()).filter(x=>x&&x!=='%(AdditionalDependencies)');
libs=libs.filter(l=>!/Catch2/i.test(l));
const seen=new Set(); libs=libs.filter(l=>{const k=l.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
const DEFS='/DWIN32 /D_WINDOWS /DNDEBUG /D_CRT_SECURE_NO_WARNINGS /D_SCL_SECURE_NO_WARNINGS /D_USE_MATH_DEFINES /D_WIN32 /DNOMINMAX /DWIN32_LEAN_AND_MEAN= /DUNICODE /D_UNICODE /DBOOST_ALL_NO_LIB /DBOOST_USE_WINAPI_VERSION=0x602 /DBOOST_SYSTEM_USE_UTF8 /DBBL_RELEASE_TO_PUBLIC=0 /DOPENVDB_ABI_VERSION_NUMBER=8 /DSLIC3R_STATIC /DUSE_TBB /DTBB_USE_CAPTURED_EXCEPTION=0';
const D='C:/Users/3ricj/Documents/GitHub/OrcaSlicer/deps/build/OrcaSlicer_dep/usr/local';
const S='C:/Users/3ricj/Documents/GitHub/OrcaSlicer/src';
const DS='C:/Users/3ricj/Documents/GitHub/OrcaSlicer/deps_src';
const T='C:/Users/3ricj/.openvibely/repos/b286adc9ffdb76b2fe4314806b97ad0a/.worktrees/task_d71213a54c246e952b54f607dae12df4/tmp';
for (const [tag,root] of Object.entries(ROOTS)) {
  const W = tag==='mine' ? 'C:/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf' : 'C:/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/ctrl1220';
  const bl = libs.map(l=>l.replace(/^(\.\.[\/])+/, root.replace(/\//g,'\')+'\').replace(/\/g,'\\'));
  const inc = ['/I"'+W+'\src\libslic3r"','/I"'+W+'\src"','/I"'+W+'\build_syntax"','/I"'+D.replace(/\//g,'\')+'\include"','/I"'+D.replace(/\//g,'\')+'\include\boost-1_84"','/I"'+D.replace(/\//g,'\')+'\include\eigen3"','/I"'+D.replace(/\//g,'\')+'\include\occt"','/I"'+D.replace(/\//g,'\')+'\include\OpenEXR"','/I"'+S.replace(/\//g,'\')+'\libigl"','/I"'+DS.replace(/\//g,'\')+'\libigl"','/I"'+DS.replace(/\//g,'\')+'\clipper2\Clipper2Lib\include"','/I"'+DS.replace(/\//g,'\')+'\admesh"','/I"'+DS.replace(/\//g,'\')+'\libnest2d\include"','/I"'+DS.replace(/\//g,'\')+'\miniz"','/I"'+DS.replace(/\//g,'\')+'\clipper"','/I"'+DS.replace(/\//g,'\')+'\glu-libtess\include"','/I"'+DS.replace(/\//g,'\')+'\qhull\src"','/I"'+DS.replace(/\//g,'\')+'\semver"','/I"'+DS.replace(/\//g,'\')+'"'].join(' ');
  const out = '@echo off\r\n'
    +'call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1\r\n'
    +'cd /d "'+T+'\dump_'+tag+'"\r\n'
    +'cl.exe /nologo /c /EHsc /std:c++17 /utf-8 /MD /O2 /bigobj /Zc:lambda '+DEFS+' '+inc+' "'+T.replace(/\//g,'\')+'\fs_export_dump.cpp"\r\n'
    +'if errorlevel 1 (echo COMPILE_RC=1 & exit /b 1)\r\n'
    +'link.exe /nologo /OUT:fs_export_dump.exe fs_export_dump.obj '+bl.join(' ')+' kernel32.lib user32.lib gdi32.lib winspool.lib shell32.lib ole32.lib oleaut32.lib uuid.lib comdlg32.lib advapi32.lib ws2_32.lib wsock32.lib secur32.lib mswsock.lib advapi32.lib winmm.lib opengl32.lib bcrypt.lib psapi.lib\r\n'
    +'echo LINK_RC=%errorlevel%\r\n';
  fs.writeFileSync(T+'/link_'+tag+'.bat', out, 'latin1');
  console.log(tag+' libs='+libs.length);
}
