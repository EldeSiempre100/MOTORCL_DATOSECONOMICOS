"""INE snapshot template; see README.md for the output contract."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ENGINE_DIR = Path(__file__).resolve().parent
DATA_ENGINES = ENGINE_DIR.parent
ROOT = DATA_ENGINES.parent
sys.path.insert(0, str(DATA_ENGINES))
from schema_validator import validate_snapshot  # noqa: E402


class EngineTemplate:
    source = "INE"
    output_name = "ine_snapshot.json"

    def build_snapshot(self, indicators: list[dict[str, Any]]) -> dict[str, Any]:
        return {"schemaVersion": 1, "source": self.source, "generatedAt": datetime.now(timezone.utc).isoformat(), "indicators": indicators}

    def write_snapshot(self, indicators: list[dict[str, Any]], output_dir: Path | None = None) -> Path:
        destination = output_dir or (ROOT / "public" / "mock-data")
        destination.mkdir(parents=True, exist_ok=True)
        payload = self.build_snapshot(indicators)
        validate_snapshot(payload)
        target = destination / self.output_name
        temporary = target.with_suffix(target.suffix + ".tmp")
        temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temporary.replace(target)
        return target
