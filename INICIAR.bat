@echo off
echo.
echo  ============================================================
echo    RINCONCITO DE LA COSTENA - Sistema de Pedidos
echo  ============================================================
echo.

echo  [1/2] Iniciando servidor backend (puerto 3001)...
start "Backend - Rinconcito" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 3 /nobreak > nul

echo  [2/2] Iniciando servidor frontend (puerto 5173)...
start "Frontend - Rinconcito" cmd /k "cd /d %~dp0frontend && npx vite"
timeout /t 4 /nobreak > nul

echo.
echo  ============================================================
echo   RUTAS POR DISPOSITIVO (reemplaza X.X.X.X con tu IP LAN)
echo  ============================================================
echo.
echo   Ver tu IP LAN: abre cmd y escribe  ipconfig
echo.
echo   Mesero (tablet)    ->  http://X.X.X.X:5173/pedidos
echo   Cocina (TV)        ->  http://X.X.X.X:5173/cocina
echo   Historial          ->  http://X.X.X.X:5173/historial
echo   Dashboard (admin)  ->  http://X.X.X.X:5173/dashboard
echo   Admin menu         ->  http://X.X.X.X:5173/admin
echo.
echo   El backend imprime las URLs exactas en su ventana.
echo  ============================================================
echo.
pause
