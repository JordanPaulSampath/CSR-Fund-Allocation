#!/usr/bin/env bash
# One-command launcher (macOS / Linux / Git Bash).
#   ./run.sh          -> bundled mode  (http://localhost:8000)
#   ./run.sh --dev    -> hot-reload    (http://localhost:5173)
cd "$(dirname "$0")" || exit 1
exec python3 run.py "$@"
