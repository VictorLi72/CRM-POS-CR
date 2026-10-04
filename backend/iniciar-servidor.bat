@echo off
title CRM Super CR - Servidor

echo ===========================================
echo   CRM Super CR - Servidor Central
echo ===========================================
echo.

REM ── Configura estos valores antes de correr por primera vez ──
set DB_URL=jdbc:mysql://localhost:3306/crm_super_pos?useSSL=false^&allowPublicKeyRetrieval=true^&serverTimezone=UTC
set DB_USER=crm_super
set DB_PASS=CAMBIA-ESTA-CONTRASENA
set JWT_SECRET=cambia-este-secreto-en-produccion

echo Iniciando servidor en el puerto 4000...
echo Para detenerlo cierra esta ventana o presiona Ctrl+C
echo.

java -jar crm-backend.jar ^
  --spring.datasource.url="%DB_URL%" ^
  --spring.datasource.username="%DB_USER%" ^
  --spring.datasource.password="%DB_PASS%" ^
  --app.jwt.secret="%JWT_SECRET%"

echo.
echo El servidor se detuvo.
pause
