"""Inspect keys and shapes in a NumPy embedding archive without changing it."""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np


def unwrap(value: object) -> dict[str, object] | None:
    if isinstance(value, dict):
        return value
    if isinstance(value, np.ndarray) and value.shape == () and value.dtype == object:
        item = value.item()
        return item if isinstance(item, dict) else None
    return None


def inspect(path: Path) -> None:
    with np.load(path, allow_pickle=True) as archive:
        print(f"{path}: {len(archive.files)} arrays")
        for key in archive.files:
            value = archive[key]
            payload = unwrap(value)
            if payload is not None:
                print(f"- {key}: object payload with keys={list(payload)}")
                for nested_key, nested_value in payload.items():
                    nested_array = np.asarray(nested_value)
                    print(f"  - {nested_key}: shape={nested_array.shape}, dtype={nested_array.dtype}")
                    if nested_array.ndim == 1 and nested_array.size:
                        print(f"    sample={nested_array[:3]!r}")
            else:
                print(f"- {key}: shape={value.shape}, dtype={value.dtype}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    inspect(args.archive)
