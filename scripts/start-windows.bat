@echo off
REM ============================================================
REM BAM! — Start both backend and frontend on Windows
REM ============================================================
REM Opens two terminals: one for FastAPI, one for Next.js
REM ============================================================

setlocal

set PROJECT_ROOT=%~dp0..
cd /d "%PROJECT_ROOT%"

echo.
echo ==========================================
echo   Starting BAM! - Beat Avoidance Mode
echo ==========================================
echo.

REM Start FastAPI backend in a new window
echo Starting FastAPI backend on port 8001...
start "BAM! Backend (FastAPI)" cmd /k "cd mini-services\bam-api && call venv\Scripts\activate && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start Next.js frontend in a new window
echo Starting Next.js frontend on port 3000...
start "BAM! Frontend (Next.js)" cmd /k "npm run dev"

REM Wait and open browser
timeout /t 5 /nobreak >nul
echo.
echo ==========================================
echo   BAM! is starting up!
echo ==========================================
echo.
echo   Backend:  http://localhost:8001  (FastAPI)
echo   Frontend: http://localhost:3000  (Next.js)
echo.
echo Opening browser to http://localhost:3000 ...
echo.
start http://localhost:3000

echo.
echo Both services are running in separate windows.
echo Close those windows to stop the services.
echo.
pause
