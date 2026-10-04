@echo off
cd /d C:\Users\3ricj\.openvibely\repos\288e09695603e28b9fc187875ade9fdf
"C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\bin\Shared\MSBuild\Current\Bin\MSBuild.exe" buildfs\tests\libslic3r\libslic3r_tests.vcxproj /p:Configuration=Release /p:Platform=x64 /m:2 /v:minimal /nologo > C:\Users\3ricj\.openvibely\repos\b286adc9ffdb76b2fe4314806b97ad0a\.worktrees\task_d71213a54c246e952b54f607dae12df4\tmp\bt.log 2>&1
echo BUILD_RC=%ERRORLEVEL%
