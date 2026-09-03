#!/usr/bin/env python3
"""One command to run the whole thing on localhost.

    python run.py            # build the UI once, then serve UI + API on :8000
    python run.py --dev      # hot-reload: API on :8000, Vite UI on :5173
    python run.py --build    # force a fresh UI build before serving

Login with:  csr_manager / saarthi2026   (or  demo / demo12345)
The 250-row sample dataset loads automatically on startup.
"""
from __future__ import annotations

import argparse
import os
import shutil
import signal
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
DIST = FRONTEND / "dist"
API_PORT = int(os.getenv("PORT", "8000"))
UI_PORT = 5173

NPM = shutil.which("npm") or shutil.which("npm.cmd")
IS_WINDOWS = os.name == "nt"


def _run(cmd, cwd, **kw):
    print(f"  $ {' '.join(str(c) for c in cmd)}   (in {cwd.name}/)")
    return subprocess.run(cmd, cwd=cwd, check=True, shell=IS_WINDOWS, **kw)


def _popen(cmd, cwd):
    print(f"  $ {' '.join(str(c) for c in cmd)}   (in {cwd.name}/)")
    return subprocess.Popen(cmd, cwd=cwd, shell=IS_WINDOWS)


def ensure_backend_deps() -> None:
    try:
        import fastapi  # noqa: F401
        import uvicorn  # noqa: F401
        import pulp  # noqa: F401
        return
    except ImportError:
        pass
    print("[setup] installing backend dependencies…")
    try:
        _run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], BACKEND)
    except subprocess.CalledProcessError:
        sys.exit(
            "\n[error] Could not install backend deps automatically.\n"
            "        Run this once, then retry:\n"
            f"        cd backend && {sys.executable} -m pip install -r requirements.txt\n"
        )


def ensure_frontend_deps() -> None:
    if (FRONTEND / "node_modules").is_dir():
        return
    if not NPM:
        sys.exit("[error] npm not found on PATH — install Node.js 18+ first.")
    print("[setup] installing frontend dependencies (npm install)…")
    _run([NPM, "install", "--no-audit", "--no-fund"], FRONTEND)


def build_frontend(force: bool = False) -> None:
    if DIST.is_dir() and not force:
        return
    ensure_frontend_deps()
    print("[setup] building the UI (npm run build)…")
    _run([NPM, "run", "build"], FRONTEND)


def serve_bundled() -> None:
    build_frontend()
    ensure_backend_deps()
    url = f"http://localhost:{API_PORT}"
    print(f"\n[ready] UI + API on  {url}\n        API docs on  {url}/docs")
    print("        login: csr_manager / saarthi2026   (or demo / demo12345)\n")
    threading.Timer(2.0, lambda: webbrowser.open(url)).start()
    env = {**os.environ, "PORT": str(API_PORT)}
    subprocess.run(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0",
         "--port", str(API_PORT)],
        cwd=BACKEND, env=env, shell=IS_WINDOWS,
    )


def serve_dev() -> None:
    ensure_backend_deps()
    ensure_frontend_deps()
    procs: list[subprocess.Popen] = []
    print("\n[dev] starting API (:%d, --reload) and Vite UI (:%d)…\n" % (API_PORT, UI_PORT))
    procs.append(_popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--reload",
         "--host", "0.0.0.0", "--port", str(API_PORT)],
        BACKEND,
    ))
    time.sleep(1.5)
    procs.append(_popen([NPM, "run", "dev", "--", "--port", str(UI_PORT)], FRONTEND))

    url = f"http://localhost:{UI_PORT}"
    print(f"\n[ready] open  {url}   (login: csr_manager / saarthi2026)\n")
    threading.Timer(3.0, lambda: webbrowser.open(url)).start()

    def _shutdown(*_):
        for p in procs:
            try:
                p.terminate()
            except Exception:
                pass
        sys.exit(0)

    signal.signal(signal.SIGINT, _shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, _shutdown)
    for p in procs:
        p.wait()


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dev", action="store_true", help="hot-reload dev mode (two servers)")
    ap.add_argument("--build", action="store_true", help="force a fresh UI build")
    args = ap.parse_args()

    if args.build:
        build_frontend(force=True)
    if args.dev:
        serve_dev()
    else:
        serve_bundled()
