@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
set W=C:\Users\3ricj\.openvibely\repos\288e09695603e28b9fc187875ade9fdf
set D=C:\Users\3ricj\Documents\GitHub\OrcaSlicer\deps\build\OrcaSlicer_dep\usr\local
set S=C:\Users\3ricj\Documents\GitHub\OrcaSlicer\src
set DS=C:\Users\3ricj\Documents\GitHub\OrcaSlicer\deps_src
cl.exe /nologo /c /Zs /EHsc /std:c++17 /utf-8 /MD /bigobj /Zc:lambda /external:I"%DS%" /FS ^
 /I"%W%\src\libslic3r" /I"%W%\src" /I"%W%\src\libslic3r\TextureToColor" /I"%W%\build_syntax" ^
 /I"%D%\include" /I"%D%\include\boost-1_84" /I"%D%\include\eigen3" /I"%D%\include\occt" /I"%D%\include\OpenEXR" ^
 /I"%S%\libigl" /I"%DS%\clipper2\Clipper2Lib\include" /I"%DS%\admesh" /I"%DS%\libnest2d\include" ^
 /I"%DS%\miniz" /I"%DS%\clipper" /I"%DS%\glu-libtess\include" /I"%DS%\qhull\src" /I"%DS%\semver" ^
 /DWIN32 /D_WINDOWS /DNDEBUG /D_CRT_SECURE_NO_WARNINGS /D_SCL_SECURE_NO_WARNINGS ^
 /D_USE_MATH_DEFINES /D_WIN32 /DNOMINMAX /DWIN32_LEAN_AND_MEAN= /DUNICODE /D_UNICODE ^
 /DBOOST_ALL_NO_LIB /DBOOST_USE_WINAPI_VERSION=0x602 /DBOOST_SYSTEM_USE_UTF8 ^
 /DBBL_RELEASE_TO_PUBLIC=0 /DOPENVDB_ABI_VERSION_NUMBER=8 ^
 %1
echo CL_RC=%errorlevel%
