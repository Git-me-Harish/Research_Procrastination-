@echo off
REM ============================================================
REM BAM! — Beat Avoidance Mode: Windows Setup Script
REM ============================================================
REM This script sets up the BAM! project on Windows.
REM Run it from the project root directory.
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo   BAM! - Beat Avoidance Mode - Setup
echo ==========================================
echo.

REM Check Python
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo   ERROR: Python not found. Install from https://python.org
    echo   Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version') do set PYVER=%%i
echo   Python %PYVER% found.

REM Check Node.js
echo.
echo [2/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo   ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
for /f %%i in ('node --version') do set NODEVER=%%i
echo   Node.js %NODEVER% found.

REM Set up Python virtual environment
echo.
echo [3/5] Setting up Python backend...
cd mini-services\bam-api

if not exist venv (
    echo   Creating Python virtual environment...
    python -m venv venv
)

echo   Activating virtual environment...
call venv\Scripts\activate.bat

echo   Installing Python dependencies...
pip install -r requirements.txt --quiet

echo   Initializing database...
python -c "from database import init_db; init_db()"

cd ..\..

REM Install Node.js dependencies
echo.
echo [4/5] Installing Node.js dependencies...
call npm install --silent
if errorlevel 1 (
    echo   ERROR: npm install failed.
    pause
    exit /b 1
)

REM Done
echo.
echo [5/5] Setup complete!
echo.
echo ==========================================
echo   BAM! Setup Complete! POW!
echo ==========================================
echo.
echo To start the app, run:
echo.
echo   1. Start the backend (in one terminal):
echo      cd mini-services\bam-api
echo      venv\Scripts\activate
echo      python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
echo.
echo   2. Start the frontend (in another terminal):
echo      npm run dev
echo.
echo   3. Open http://localhost:3000 in your browser
echo.
echo Let's beat procrastination together! BAM!
echo.
pause
