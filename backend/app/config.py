"""Runtime configuration + scoring-weight loading.

The scoring weights live in ``data/scoring_weights.yaml`` so Non-Tech #2 can
own them without touching Python. We load them lazily and expose a reload
hook so the weights can be changed *live* during the demo (great judge moment:
"watch the allocation change when our domain expert re-weights impact").
"""
from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import Any, Dict

import yaml

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
WEIGHTS_PATH = Path(os.getenv("SAARTHI_WEIGHTS", DATA_DIR / "scoring_weights.yaml"))
SAMPLE_CSV_PATH = Path(os.getenv("SAARTHI_SAMPLE_CSV", DATA_DIR / "sample_proposals.csv"))

# Demo auth — a single hardcoded CSR Manager login. Do NOT build real
# multi-tenant auth for a hackathon (see the plan, section 3.1).
DEMO_USERNAME = os.getenv("SAARTHI_USER", "csr_manager")
DEMO_PASSWORD = os.getenv("SAARTHI_PASSWORD", "saarthi2026")
AUTH_SECRET = os.getenv("SAARTHI_SECRET", "saarthi-hackathon-demo-secret-key")
TOKEN_TTL_SECONDS = int(os.getenv("SAARTHI_TOKEN_TTL", "86400"))
# If set to "0"/"false", the API skips auth entirely. Handy if the demo
# laptop misbehaves and you just need endpoints to answer.
AUTH_ENABLED = os.getenv("SAARTHI_AUTH_ENABLED", "1").lower() not in {"0", "false", "no"}

DEFAULT_WEIGHTS: Dict[str, float] = {
    "impact": 0.5,
    "cost_efficiency": 0.3,
    "feasibility": 0.2,
}

_lock = threading.Lock()
_weights_cache: Dict[str, float] | None = None


def _normalise(weights: Dict[str, Any]) -> Dict[str, float]:
    clean: Dict[str, float] = {}
    for key in DEFAULT_WEIGHTS:
        try:
            clean[key] = float(weights.get(key, DEFAULT_WEIGHTS[key]))
        except (TypeError, ValueError):
            clean[key] = DEFAULT_WEIGHTS[key]
    total = sum(clean.values()) or 1.0
    # keep raw values but also expose the normalised split for the UI
    return clean if abs(total - 1.0) < 1e-6 else {k: round(v, 4) for k, v in clean.items()}


def load_weights(force: bool = False) -> Dict[str, float]:
    global _weights_cache
    with _lock:
        if _weights_cache is not None and not force:
            return dict(_weights_cache)
        data: Dict[str, Any] = {}
        if WEIGHTS_PATH.exists():
            try:
                data = yaml.safe_load(WEIGHTS_PATH.read_text(encoding="utf-8")) or {}
            except yaml.YAMLError:
                data = {}
        _weights_cache = _normalise(data)
        return dict(_weights_cache)


def save_weights(new_weights: Dict[str, Any]) -> Dict[str, float]:
    """Persist a new weight config to disk and refresh the cache."""
    global _weights_cache
    merged = load_weights()
    for key in DEFAULT_WEIGHTS:
        if key in new_weights and new_weights[key] is not None:
            merged[key] = float(new_weights[key])
    with _lock:
        WEIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)
        header = (
            "# scoring_weights.yaml - this file IS the differentiation story.\n"
            "# A CSR domain expert on the team set these weights based on how real\n"
            "# CSR committees evaluate proposals (Schedule VII, CSR-2 impact metrics).\n"
        )
        body = yaml.safe_dump(merged, sort_keys=True)
        WEIGHTS_PATH.write_text(header + body, encoding="utf-8")
        _weights_cache = _normalise(merged)
        return dict(_weights_cache)
