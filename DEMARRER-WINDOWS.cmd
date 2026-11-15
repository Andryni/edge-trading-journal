@echo off
cd /d "%~dp0"
call npm ci
if errorlevel 1 goto erreur
call npm run setup
if errorlevel 1 goto erreur
call npm run dev
goto fin
:erreur
echo Une etape a echoue. Verifie Node.js 22.12 ou superieur et les messages ci-dessus.
pause
:fin
