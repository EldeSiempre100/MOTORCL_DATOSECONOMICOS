"""Boilerplate para conectar publicaciones fiscales oficiales de DIPRES."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from engine_template import EngineTemplate  # noqa: E402

engine = EngineTemplate(source="DIPRES", output_name="dipres_snapshot.json")


def extract_official_indicators() -> list[dict[str, Any]]:
    """TODO: leer publicaciones/ficheros oficiales, preservar unidades y normalizar trimestres."""
    raise NotImplementedError("Implemente la extracción documentada de series DIPRES.")


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
