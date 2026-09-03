@echo off
REM One-click launcher for Windows. Builds the UI, then serves UI + API on :8000.
REM   run.bat          -> bundled mode (http://localhost:8000)
REM   run.bat --dev    -> hot-reload dev mode (http://localhost:5173)
cd /d "%~dp0"
where py >nul 2>nul && (py run.py %*) || (python run.py %*)
pause
