@echo off
REM PixelFlow — local dev launcher for Windows (no Docker, uses SQLite)
REM Usage:  double-click start.bat  OR  run from terminal
REM Stop:   close the windows that open for backend and frontend

setlocal EnableDelayedExpansion
set ROOT=%~dp0
set ROOT=%ROOT:~0,-1%

echo.
echo  ╔══════════════════════════════════════╗
echo  ║      PixelFlow  —  Dev Launcher      ║
echo  ╚══════════════════════════════════════╝
echo.

REM ── locate virtual environment ─────────────────────────────────────────────
REM Check common venv locations in order:
REM   <root>\env   <root>\.venv   <root>\venv   <root>\backend\env   <root>\backend\.venv
set VENV_ACTIVATE=

if exist "%ROOT%\env\Scripts\activate.bat"         set VENV_ACTIVATE=%ROOT%\env\Scripts\activate.bat
if "%VENV_ACTIVATE%"=="" if exist "%ROOT%\.venv\Scripts\activate.bat"   set VENV_ACTIVATE=%ROOT%\.venv\Scripts\activate.bat
if "%VENV_ACTIVATE%"=="" if exist "%ROOT%\venv\Scripts\activate.bat"    set VENV_ACTIVATE=%ROOT%\venv\Scripts\activate.bat
if "%VENV_ACTIVATE%"=="" if exist "%ROOT%\backend\env\Scripts\activate.bat"    set VENV_ACTIVATE=%ROOT%\backend\env\Scripts\activate.bat
if "%VENV_ACTIVATE%"=="" if exist "%ROOT%\backend\.venv\Scripts\activate.bat"  set VENV_ACTIVATE=%ROOT%\backend\.venv\Scripts\activate.bat

if "%VENV_ACTIVATE%"=="" (
    echo [pixelflow] No virtual environment found. Creating one at %ROOT%\env ...
    python -m venv "%ROOT%\env"
    if errorlevel 1 (
        echo [ERROR] python not found. Install Python 3.11+ and add it to PATH.
        pause & exit /b 1
    )
    set VENV_ACTIVATE=%ROOT%\env\Scripts\activate.bat
)

echo [pixelflow] Using venv: %VENV_ACTIVATE%

REM ── install / verify backend dependencies ─────────────────────────────────
call "%VENV_ACTIVATE%"
pip install -q -r "%ROOT%\backend\requirements.txt"
if errorlevel 1 (
    echo [ERROR] pip install failed. Check requirements.txt and your internet connection.
    pause & exit /b 1
)

REM ── start backend ──────────────────────────────────────────────────────────
echo [pixelflow] Starting backend on http://localhost:8000  (SQLite, hot-reload)
start "PixelFlow Backend" cmd /k "call "%VENV_ACTIVATE%" && cd /d "%ROOT%\backend" && set USE_SQLITE=True&& set DEBUG=True&& uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

REM ── frontend ───────────────────────────────────────────────────────────────
echo [pixelflow] Checking frontend dependencies...
cd /d "%ROOT%\frontend"

if not exist "node_modules" (
    echo [pixelflow] node_modules missing — running npm install...
    npm install --silent
    if errorlevel 1 (
        echo [ERROR] npm not found. Install Node.js 18+ from https://nodejs.org
        pause & exit /b 1
    )
)

if not exist ".env.local" (
    echo REACT_APP_API_URL=http://localhost:8000/api > .env.local
    echo [pixelflow] Created frontend\.env.local
)

echo [pixelflow] Starting frontend on http://localhost:3000
start "PixelFlow Frontend" cmd /k "cd /d "%ROOT%\frontend" && npm start"

REM ── done ───────────────────────────────────────────────────────────────────
echo.
echo  [pixelflow] Both services are starting up — this takes ~10 seconds.
echo.
echo    Frontend : http://localhost:3000
echo    Backend  : http://localhost:8000
echo    API docs : http://localhost:8000/docs
echo.
echo  Close the backend/frontend windows to stop the servers.
echo.
pause
