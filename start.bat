@echo off
title IMS - Inventory Management System
color 0A

echo ============================================
echo   INVENTORY MANAGEMENT SYSTEM (IMS)
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Node.js is NOT installed on this PC!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org  (Download LTS version)
    echo.
    echo After installing, double-click this file again.
    pause
    exit
)

echo [OK] Node.js found!
echo.

:: Install server dependencies if needed
echo [1/4] Installing backend dependencies...
cd /d "%~dp0server"
if not exist "node_modules" (
    call npm install
)
echo [OK] Backend ready!
echo.

:: Install client dependencies if needed
echo [2/4] Installing frontend dependencies...
cd /d "%~dp0client"
if not exist "node_modules" (
    call npm install
)
echo [OK] Frontend ready!
echo.

:: Start backend server in a new window
echo [3/4] Starting backend server...
start "IMS Backend Server" cmd /k "cd /d "%~dp0server" && node index.js"
timeout /t 2 /nobreak >nul

:: Start frontend in a new window
echo [4/4] Starting frontend server...
start "IMS Frontend Server" cmd /k "cd /d "%~dp0client" && npm run dev"
timeout /t 3 /nobreak >nul

:: Open browser
echo.
echo ============================================
echo   IMS is RUNNING!
echo ============================================
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo.
echo   Login Email    : admin@ims.com
echo   Login Password : admin123
echo.
echo Opening browser...
start http://localhost:5173

echo.
echo [INFO] Two terminal windows are running in background.
echo [INFO] Close those windows to stop the servers.
echo.
pause
