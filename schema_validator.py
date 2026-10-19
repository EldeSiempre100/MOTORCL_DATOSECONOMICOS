#!/usr/bin/env python3
"""Validate source-specific JSON snapshots against the shared Monitor Chile contract."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = Path(__file__).with_name("engine_snapshot.schema.json")


def validate_snapshot(payload: object) -> None:
    """Raise jsonschema.ValidationError when a source snapshot is malformed."""
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = sorted(validator.iter_errors(payload), key=lambda error: list(error.absolute_path))
    if errors:
        details = "\n".join(
            f"- {'/'.join(map(str, error.absolute_path)) or '$'}: {error.message}"
            for error in errors
        )
        raise ValueError(f"Invalid source snapshot:\n{details}")


def validate_file(path: Path) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    validate_snapshot(payload)
    print(f"OK  {path}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="Snapshot files to validate. Defaults to *_snapshot.json in public/mock-data.",
    )
    args = parser.parse_args()
    targets = args.paths or sorted((ROOT / "public" / "mock-data").glob("*_snapshot.json"))
    if not targets:
        print("No source snapshots found; engines have not written any output yet.", file=sys.stderr)
        return 2

    failed = False
    for path in targets:
        try:
            validate_file(path)
        except (OSError, json.JSONDecodeError, ValueError) as error:
            failed = True
            print(f"INVALID  {path}: {error}", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
