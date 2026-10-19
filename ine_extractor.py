"""Boilerplate para conectar series oficiales del INE."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from engine_template import EngineTemplate  # noqa: E402

engine = EngineTemplate()


def extract_official_indicators() -> list[dict[str, Any]]:
    """TODO: conectar fuentes INE para IPC, ENE, IAC e IPI y normalizar sus fechas."""
    raise NotImplementedError("Implemente la adquisición documentada y la revisión de series del INE.")


def main() -> int:
    records = extract_official_indicators()
    output = engine.write_snapshot(records)
    print(f"Wrote {output}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except NotImplementedError as error:
        print(f"Extractor sin implementar: {error}", file=sys.stderr)
        raise SystemExit(2)
