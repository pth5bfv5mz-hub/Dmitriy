#!/usr/bin/env python3
"""Служебный просмотр вёрстки презентации без PowerPoint.

Сохраняет каждый слайд собранной колоды в PNG и предупреждает о выходе
текста и фигур за границы слайда.

    python scripts/preview_deck.py --lesson 3
    python scripts/preview_deck.py --lesson 3 --outdir /tmp/preview

Инструмент разработчика: пишет только в указанную папку (по умолчанию —
во временную). Рендер приблизительный (подставляются системные шрифты),
назначение — контроль переполнения и композиции.
"""
from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import deck_preview, loader, paths


def main() -> int:
    ap = argparse.ArgumentParser(description="Просмотр вёрстки презентации")
    ap.add_argument("--lesson", type=int, required=True)
    ap.add_argument("--discipline", default="mdk-04-02")
    ap.add_argument("--outdir")
    ap.add_argument("--scale", type=int, default=110,
                    help="пикселей на дюйм (по умолчанию 110)")
    args = ap.parse_args()

    discipline = loader.load_discipline(args.discipline)
    deck = (paths.lesson_dir(discipline, args.lesson)
            / f"Занятие_{args.lesson:02d}_Презентация.pptx")
    if not deck.exists():
        raise SystemExit(f"Нет файла: {deck}")

    outdir = Path(args.outdir) if args.outdir else Path(
        tempfile.mkdtemp(prefix=f"deck{args.lesson:02d}_"))
    outdir.mkdir(parents=True, exist_ok=True)

    images, warns = deck_preview.render_slides(deck, scale=args.scale)
    for i, img in enumerate(images, 1):
        img.save(outdir / f"slide_{i:02d}.png")
    sheet = deck_preview.contact_sheet(images)
    if sheet:
        sheet.save(outdir / "all_slides.png")

    print(f"Слайдов: {len(images)}. Картинки: {outdir}")
    if warns:
        print(f"\nПредупреждения ({len(warns)}):")
        for w in warns:
            print(f"  {w}")
    else:
        print("Переполнения и выходов за границы не обнаружено.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
