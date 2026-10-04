@echo off
REM Cross-tree byte-identity proof: pristine 12205f3623 control build vs the
REM modified tree, each run in its own cwd, twice each.
set BASEEXE=C:\Users\3ricj\.openvibely\repos\288e09695603e28b9fc187875ade9fdf\ctrl1220\buildctrl\tests\libslic3r\Release\libslic3r_tests.exe
set MODEXE=C:\Users\3ricj\.openvibely\repos\288e09695603e28b9fc187875ade9fdf\buildfs\tests\libslic3r\Release\libslic3r_tests.exe
set T=C:\Users\3ricj\.openvibely\repos\b286adc9ffdb76b2fe4314806b97ad0a\.worktrees\task_d71213a54c246e952b54f607dae12df4\tmp\byt
rmdir /s /q "%T%" 2>nul
mkdir "%T%"
mkdir "%T%\b1" "%T%\b2" "%T%\m1" "%T%\m2"

cd /d "%T%\b1"
"%BASEEXE%" [FiberExport] >nul 2>&1
copy /y fs_export_plastic.gcode "%T%\base1.gcode" >nul
cd /d "%T%\b2"
"%BASEEXE%" [FiberExport] >nul 2>&1
copy /y fs_export_plastic.gcode "%T%\base2.gcode" >nul
cd /d "%T%\m1"
"%MODEXE%" [FiberExport] >nul 2>&1
copy /y fs_export_plastic.gcode "%T%\mod1.gcode" >nul
cd /d "%T%\m2"
"%MODEXE%" [FiberExport] >nul 2>&1
copy /y fs_export_plastic.gcode "%T%\mod2.gcode" >nul
echo EXPORTS_DONE
