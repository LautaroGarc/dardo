@echo off
echo ========================================
echo    INICIANDO DEPLOY Y SERVIDOR DEV
echo ========================================

echo.
echo [1/2] Ejecutando deploy-commands.js...
node deploy-commands.js

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Fallo en deploy-commands.js
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Iniciando servidor de desarrollo...
echo ========================================
npm run dev

pause