#!/usr/bin/env python3
"""Сборка локального статического сайта материалов.

    python scripts/build_site.py
    python scripts/build_site.py --discipline mdk-04-02

Открывается двойным кликом по site/index.html, интернет не нужен.
Пишет только в site/. Папка site/ пересобирается целиком, поэтому
править HTML вручную нельзя — правки делаются в data/ и docs/.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import loader, paths, site_out


def main() -> int:
    ap = argparse.ArgumentParser(description="Сборка сайта материалов")
    ap.add_argument("--discipline", action="append",
                    help="id дисциплины (можно указать несколько раз); "
                         "по умолчанию — все из data/disciplines")
    args = ap.parse_args()

    ids = args.discipline or loader.list_discipline_ids()
    if not ids:
        raise SystemExit("В data/disciplines нет ни одного конфига дисциплины.")

    print(f"Дисциплин к сборке: {len(ids)} ({', '.join(ids)})")
    result = site_out.build_site(ids)

    print()
    for d, info in result["disciplines"]:
        total = len(d.rows)
        states: dict[str, int] = {}
        for state, _ in info["rows"].values():
            states[state] = states.get(state, 0) + 1
        detail = ", ".join(f"{k}: {v}" for k, v in sorted(states.items()))
        print(f"  {d.code} «{d.title}»: занятий {total} ({detail})")

    print()
    print(f"Создано файлов: {len(result['written'])}")
    print(f"Открыть: {(paths.SITE / 'index.html')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
