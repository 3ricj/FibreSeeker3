@echo off
"C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe" --build "C:\Users\3ricj\.openvibely\repos\288e09695603e28b9fc187875ade9fdf\buildctrl" --config Release --target libslic3r -j 16
echo BUILD_RC=%errorlevel%
