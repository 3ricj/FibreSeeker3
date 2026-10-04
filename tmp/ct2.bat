@echo off
cd /d C:\Users\3ricj\.openvibely\repos\288e09695603e28b9fc187875ade9fdf\buildfs
"C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\ctest.exe" -N
echo CTEST_RC=%ERRORLEVEL%
