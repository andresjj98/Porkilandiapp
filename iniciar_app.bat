@echo off
REM ===================================================
REM  Script para instalar dependencias y arrancar
REM  la app PorkiApp (black-end + front-end)
REM ===================================================
echo ----------------------------------------------
echo        🚀 INICIANDO PORKIAPP
echo ----------------------------------------------

REM ============= BLACK-END =========================
echo.
echo ==============================================
echo 🔄  Preparando black-end
echo ==============================================
cd black-end

IF NOT EXIST node_modules (
    echo ➜ Instalando dependencias del back-end...
    npm install
) ELSE (
    echo ➜ Dependencias del back-end ya instaladas.
)
echo ➜ Arrancando servidor back-end en nueva ventana...
start cmd /k "npm start"
cd ..

REM ============= FRONT-END =========================
echo.
echo ==============================================
echo 🔄  Preparando front-end
echo ==============================================
cd front-end

IF NOT EXIST node_modules (
    echo ➜ Instalando dependencias del front-end...
    npm install
) ELSE (
    echo ➜ Dependencias del front-end ya instaladas.
)
echo ➜ Arrancando servidor front-end en nueva ventana...
start cmd /k "npm start"
cd ..

REM ============= FIN ================================
echo.
echo ----------------------------------------------
echo ✅ TODOS LOS SERVIDORES SE HAN INICIADO
echo    ✔️  Black-end corriendo en puerto 4000
echo    ✔️  Front-end en localhost:3000 (por defecto)
echo ----------------------------------------------
pause
