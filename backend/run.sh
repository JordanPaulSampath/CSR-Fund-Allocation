#!/usr/bin/env bash
# One command to a demo-ready API on http://localhost:8000
set -e
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  python -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/Scripts/activate 2>/dev/null || source .venv/bin/activate

pip install -q -r requirements.txt
python data/generate_synthetic_data.py
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
