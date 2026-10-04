@echo off
"C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe" --build "C:\Users\3ricj\.openvibely\repos\288e09695603e28b9fc187875ade9fdf\buildctrl" --config Release --target libslic3r_tests -j 16
echo CTRL_RC=%errorlevel%
"C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe" --build "C:\Users\3ricj\.openvibely\repos\288e09695603e28b9fc187875ade9fdf\buildfs" --config Release --target libslic3r_tests -j 16
echo MINE_RC=%errorlevel%
