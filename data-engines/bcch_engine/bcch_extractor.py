"""Boilerplate para conectar indicadores oficiales del BCCh."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from engine_template import EngineTemplate  # noqa: E402

engine = EngineTemplate(source="BCCh", output_name="bcch_snapshot.json")


def extract_official_indicators() -> list[dict[str, Any]]:
    """TODO: conectar la API BCCh, revisar metadatos y devolver registros validados."""
    if not os.environ.get("BCCH_API_TOKEN"):
        raise RuntimeError("Configure BCCH_API_TOKEN en el entorno seguro antes de conectar la API oficial.")
    raise NotImplementedError("Implemente la consulta, paginación y normalización de series BCCh.")


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
