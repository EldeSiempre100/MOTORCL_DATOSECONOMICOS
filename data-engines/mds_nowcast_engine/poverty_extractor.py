"""Boilerplate para conectar fuentes del MDS y estadísticas oficiales CASEN."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from engine_template import EngineTemplate  # noqa: E402

engine = EngineTemplate(source="MDS-CASEN", output_name="mds_nowcast_snapshot.json")


def extract_official_indicators() -> list[dict[str, Any]]:
    """TODO: ingestar releases oficiales y, por separado, un nowcast documentado."""
    raise NotImplementedError("Implemente la ingesta MDS/CASEN y documente ventana y metodología del nowcast.")


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
