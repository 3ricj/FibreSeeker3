@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
set W=C:\Users\3ricj\.openvibely\repos\288e09695603e28b9fc187875ade9fdf
set T=C:\Users\3ricj\.openvibely\repos\b286adc9ffdb76b2fe4314806b97ad0a\.worktrees\task_d71213a54c246e952b54f607dae12df4\tmp
if not exist "%T%\dumpexe" mkdir "%T%\dumpexe"
cd /d "%T%\dumpexe"
cl.exe /nologo /c /EHsc /std:c++17 /utf-8 /MD /O1 /I"%W%\src" "%T%\fs_dump.cpp" "%W%\src\libslic3r\Fiber\FiberToolChange.cpp"
if errorlevel 1 (echo COMPILE_RC=1 & exit /b 1)
link.exe /nologo /OUT:fs_dump.exe fs_dump.obj FiberToolChange.obj
echo LINK_RC=%errorlevel%
fs_dump.exe > "%T%\emission.txt"
echo DUMP_RC=%errorlevel%
