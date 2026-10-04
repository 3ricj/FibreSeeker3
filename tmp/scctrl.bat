@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
set W=C:\Users\3ricj\.openvibely\repos\b286adc9ffdb76b2fe4314806b97ad0a\.worktrees\task_d71213a54c246e952b54f607dae12df4\tmp\ctrl
set D=C:\Users\3ricj\Documents\GitHub\OrcaSlicer\deps\build\OrcaSlicer_dep\usr\local
set S=C:\Users\3ricj\Documents\GitHub\OrcaSlicer\src
set DS=C:\Users\3ricj\Documents\GitHub\OrcaSlicer\deps_src
cl.exe /nologo /c /Zs /EHsc /std:c++17 /utf-8 /MD /bigobj /Zc:lambda /FS ^
 /I"%W%\src\libslic3r" /I"%W%\src" /I"%W%\src\libslic3r\TextureToColor" /I"%W%\build_syntax" ^
 /I"%D%\include" /I"%D%\include\boost-1_84" /I"%D%\include\eigen3" /I"%D%\include\occt" /I"%D%\include\OpenEXR" ^
 /I"%S%\libigl" /I"%DS%\libigl" /I"%DS%\clipper2\Clipper2Lib\include" /I"%DS%\admesh" /I"%DS%\admesh\.." ^
 /I"%DS%\libnest2d\include" /I"%DS%\miniz" /I"%DS%\clipper" /I"%DS%\glu-libtess\include" /I"%DS%\qhull\src" ^
 /I"%DS%\semver" /I"%DS%" ^
 /DWIN32 /D_WINDOWS /DNDEBUG /D_CRT_SECURE_NO_WARNINGS /D_SCL_SECURE_NO_WARNINGS ^
 /D_USE_MATH_DEFINES /D_WIN32 /DNOMINMAX /DWIN32_LEAN_AND_MEAN= /DUNICODE /D_UNICODE ^
 /DBOOST_ALL_NO_LIB /DBOOST_USE_WINAPI_VERSION=0x602 /DBOOST_SYSTEM_USE_UTF8 ^
 /DBBL_RELEASE_TO_PUBLIC=0 /DOPENVDB_ABI_VERSION_NUMBER=8 ^
 %1
echo CL_RC=%errorlevel%
