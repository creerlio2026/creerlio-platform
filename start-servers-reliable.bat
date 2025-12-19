@echo off
REM Reliable server startup script for Creerlio Platform
REM This script starts both backend and frontend servers

echo ========================================
echo  Creerlio Platform - Starting Servers
echo ========================================
echo.

REM Start Backend in new window
echo [1/2] Starting Backend Server...
cd /d "%~dp0backend"

if exist "venv\Scripts\activate.bat" (
    start "Creerlio Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && python main.py"
) else (
    echo Warning: Virtual environment not found. Creating it...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q -r ..\requirements.txt
    start "Creerlio Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && python main.py"
)

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start Frontend in new window
echo [2/2] Starting Frontend Server...
cd /d "%~dp0frontend"

if exist "node_modules" (
    start "Creerlio Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
) else (
    echo Installing frontend dependencies...
    call npm install
    start "Creerlio Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
)

echo.
echo ========================================
echo  Servers Starting in Separate Windows
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Keep both windows open!
echo.
pause
