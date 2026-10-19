"""Shared snapshot writer for the source-specific data engines."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ENGINE_DIR = Path(__file__).resolve().parent
ROOT = ENGINE_DIR.parent
sys.path.insert(0, str(ENGINE_DIR))
from schema_validator import validate_snapshot  # noqa: E402


class EngineTemplate:
    def __init__(self, source: str, output_name: str) -> None:
        self.source = source
        self.output_name = output_name

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
