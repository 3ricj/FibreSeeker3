@echo off
cd /d C:\Users\3ricj\.openvibely\repos\288e09695603e28b9fc187875ade9fdf\ctrl1220
set CMAKE=C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe
"%CMAKE%" -S . -B buildctrl -G "Visual Studio 18 2026" -A x64 -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH="C:/Users/3ricj/Documents/GitHub/OrcaSlicer/deps/build/OrcaSlicer_dep/usr/local" -DSLIC3R_GUI=ON -DSLIC3R_CAD=ON -DBUILD_TESTS=ON -DSLIC3R_PCH=ON -DOPENCV_DO_NOT_USE=OFF > C:\Users\3ricj\.openvibely\repos\b286adc9ffdb76b2fe4314806b97ad0a\.worktrees\task_d71213a54c246e952b54f607dae12df4\tmp\cfgctrl.log 2>&1
echo CFG_RC=%ERRORLEVEL%
