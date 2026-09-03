@echo off
REM One command to a demo-ready API on http://localhost:8000
cd /d "%~dp0"

if not exist .venv (
  python -m venv .venv
)
call .venv\Scripts\activate.bat

pip install -q -r requirements.txt
python data\generate_synthetic_data.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
