@echo off
rem Build the FibreSeeker3 tool-change unit test against the REAL Catch2 library
rem from the owner's warm build tree. FiberToolChange.cpp is dependency-free, so
rem this links without libslic3r and runs under real Catch2, not a shim.
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
set W=C:\Users\3ricj\.openvibely\repos\288e09695603e28b9fc187875ade9fdf
set O=C:\Users\3ricj\Documents\GitHub\OrcaSlicer
set T=C:\Users\3ricj\.openvibely\repos\b286adc9ffdb76b2fe4314806b97ad0a\.worktrees\task_d71213a54c246e952b54f607dae12df4\tmp
set OUT=%T%\catchreal
if not exist "%OUT%" mkdir "%OUT%"
cd /d "%OUT%"
copy /Y "%T%\fs_catch_main.cpp" . >nul
cl.exe /nologo /c /EHsc /std:c++17 /utf-8 /MD /O1 /bigobj ^
 /I"%W%\src" /I"%O%\tests\catch2\src" /I"%O%\build\tests\catch2\generated-includes" ^
 "%W%\tests\libslic3r\test_fiber_toolchange.cpp" "%W%\src\libslic3r\Fiber\FiberToolChange.cpp" fs_catch_main.cpp
if errorlevel 1 (echo COMPILE_RC=1 & exit /b 1)
link.exe /nologo /OUT:fs_tc_real.exe test_fiber_toolchange.obj FiberToolChange.obj fs_catch_main.obj ^
 "%O%\build\tests\catch2\src\Release\Catch2.lib" ^
 kernel32.lib user32.lib gdi32.lib winspool.lib shell32.lib ole32.lib oleaut32.lib uuid.lib comdlg32.lib advapi32.lib
echo LINK_RC=%errorlevel%
