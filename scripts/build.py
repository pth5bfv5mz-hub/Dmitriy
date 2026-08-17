#!/usr/bin/env python3
"""Сборка комплектов занятий.

    python scripts/build.py --lesson 5
    python scripts/build.py --range 1-10
    python scripts/build.py --all
    python scripts/build.py --all --check-only     # только проверки
    python scripts/build.py --lesson 5 --force     # перезаписать без вопроса

Пишет только в output/. Перед записью выполняет проверки: не проходят —
файлы не создаются, расхождения печатаются таблицей.
Существующий файл не перезаписывается без подтверждения.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import docx_out, loader, paths, pptx_out, validate

DEFAULT_DISCIPLINE = "mdk-04-02"


def parse_numbers(args, discipline) -> list[int]:
    if args.all:
        return list(discipline.numbers)
    if args.lesson:
        return [args.lesson]
    if args.range:
        raw = args.range.replace("—", "-").replace("–", "-")
        try:
            start, end = (int(x) for x in raw.split("-", 1))
        except ValueError:
            raise SystemExit(f"Не разобран диапазон: «{args.range}». "
                             f"Ожидается вид 1-10.")
        if start > end:
            start, end = end, start
        return list(range(start, end + 1))
    raise SystemExit("Укажите --lesson N, --range A-B или --all")


def ask_overwrite(path: Path, state: dict) -> bool:
    """Спрашивает подтверждение на перезапись существующего файла."""
    if state["force"]:
        return True
    if state["skip_all"]:
        return False
    rel = path.relative_to(paths.ROOT)
    if not sys.stdin.isatty():
        print(f"  ПРОПУЩЕН (файл существует): {rel}")
        print("    Запустите с --force, чтобы перезаписать, "
              "или удалите файл вручную.")
        return False
    while True:
        answer = input(f"  Файл существует: {rel}\n"
                       f"    Перезаписать? [д]а / [н]ет / [в]се / "
                       f"[п]ропустить все: ").strip().lower()
        if answer in ("д", "да", "y", "yes"):
            return True
        if answer in ("н", "нет", "n", "no"):
            return False
        if answer in ("в", "все", "a", "all"):
            state["force"] = True
            return True
        if answer in ("п", "пропустить", "s", "skip"):
            state["skip_all"] = True
            return False


def build_lesson(discipline, number, theme, competencies, state) -> dict:
    row = discipline.row(number)
    cfg = loader.load_lesson(discipline.id, number)
    folder = paths.lesson_dir(discipline, number)
    written, skipped = [], []
    unresolved: list[str] = []

    def target(name):
        return folder / f"Занятие_{number:02d}_{name}"

    # 1. Техкарта
    path = target("Техкарта.docx")
    if path.exists() and not ask_overwrite(path, state):
        skipped.append(path)
    else:
        _, unres = docx_out.build_tech_card(theme, discipline, row, cfg,
                                           competencies, path)
        unresolved += unres
        written.append(path)

    # 2. Презентация
    if discipline.needs_deck(number):
        path = target("Презентация.pptx")
        if path.exists() and not ask_overwrite(path, state):
            skipped.append(path)
        else:
            pptx_out.build_deck(theme, discipline, number, row.topic,
                                cfg["slides"], path)
            written.append(path)

    # 3. Практическая часть или доп. материалы
    if discipline.needs_practice(number):
        path = target("Практика.docx")
        if path.exists() and not ask_overwrite(path, state):
            skipped.append(path)
        else:
            _, unres = docx_out.build_practice(theme, discipline, row, cfg,
                                              competencies, path)
            unresolved += unres
            written.append(path)
    else:
        path = target("Материалы.docx")
        if path.exists() and not ask_overwrite(path, state):
            skipped.append(path)
        else:
            _, unres = docx_out.build_materials(theme, discipline, row, cfg,
                                               competencies, path)
            unresolved += unres
            written.append(path)

    return {"written": written, "skipped": skipped, "unresolved": unresolved}


def write_gap_report(discipline, gaps: dict[int, list[str]]):
    """Отчёт о местах, где код компетенции не проставлен."""
    paths.REPORTS.mkdir(parents=True, exist_ok=True)
    path = paths.REPORTS / f"{discipline.code}_непроставленные_компетенции.md"
    lines = [
        f"# Непроставленные коды компетенций — {discipline.code}",
        "",
        "Файл пересобирается автоматически при каждой сборке.",
        "Причины и порядок действий — docs/research.md, раздел 6.",
        "",
    ]
    if not gaps:
        lines.append("На момент последней сборки таких мест нет: все коды "
                     "разрешены через `data/competencies.yaml`.")
    else:
        lines += ["| Занятие | Код в конфиге | Что подставлено |",
                  "|---------|---------------|-----------------|"]
        for number in sorted(gaps):
            for code in gaps[number]:
                lines.append(f"| {number} | {code} | `[ОК-?]` / `[ПК-?]` |")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Сборка комплектов занятий (техкарта, презентация, практика)")
    group = ap.add_mutually_exclusive_group()
    group.add_argument("--lesson", type=int, help="номер одного занятия")
    group.add_argument("--range", help="диапазон занятий, например 1-10")
    group.add_argument("--all", action="store_true", help="все занятия дисциплины")
    ap.add_argument("--discipline", default=DEFAULT_DISCIPLINE,
                    help=f"id дисциплины из data/disciplines (по умолчанию "
                         f"{DEFAULT_DISCIPLINE})")
    ap.add_argument("--force", action="store_true",
                    help="перезаписывать существующие файлы без вопроса")
    ap.add_argument("--check-only", action="store_true",
                    help="выполнить только проверки, ничего не создавать")
    args = ap.parse_args()

    discipline = loader.load_discipline(args.discipline)
    theme = loader.load_theme()
    competencies = loader.load_competencies()
    numbers = parse_numbers(args, discipline)

    unknown = [n for n in numbers if n not in discipline.numbers]
    if unknown:
        raise SystemExit(f"Нет таких занятий в плане: "
                         f"{', '.join(map(str, unknown))}")

    print(f"{discipline.code} «{discipline.title}» — {discipline.group}")
    print(f"Занятия к сборке: {', '.join(map(str, numbers))}")
    print()

    # --- проверки до записи ---
    print("Проверки перед сборкой…")
    issues = validate.preflight(discipline, numbers)
    if issues:
        print()
        print(validate.report(issues))
        return 1
    print("  сумма часов по семестрам — сходится")
    print(f"  занятий в плане: {len(discipline.rows)}, нумерация сплошная")
    print("  темы совпадают с docs/plan.md")
    print("  конфиги занятий заполнены")
    print()

    if args.check_only:
        print("Режим --check-only: файлы не создавались.")
        return 0

    # --- сборка ---
    state = {"force": args.force, "skip_all": False}
    total_written, total_skipped = [], []
    gaps: dict[int, list[str]] = {}

    for number in numbers:
        row = discipline.row(number)
        print(f"Занятие {number:02d}. {row.topic}")
        result = build_lesson(discipline, number, theme, competencies, state)
        for path in result["written"]:
            print(f"  создан: {path.relative_to(paths.ROOT)}")
        total_written += result["written"]
        total_skipped += result["skipped"]
        if result["unresolved"]:
            gaps[number] = sorted(set(result["unresolved"]))

    # --- проверка комплектности после записи ---
    print()
    kit_issues: list[validate.Issue] = []
    for number in numbers:
        kit_issues += validate.check_kit(discipline, number)
    if kit_issues:
        print("Комплектность файлов:")
        print(validate.report(kit_issues))
    else:
        print("Комплектность файлов: у каждого занятия есть все файлы комплекта.")

    report_path = write_gap_report(discipline, gaps)
    print(f"Отчёт по компетенциям: {report_path.relative_to(paths.ROOT)}")

    print()
    print(f"Итого: создано файлов {len(total_written)}, "
          f"пропущено {len(total_skipped)}.")
    if total_skipped:
        print("Пропущенные файлы (уже существовали):")
        for path in total_skipped:
            print(f"  {path.relative_to(paths.ROOT)}")
    return 1 if kit_issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
