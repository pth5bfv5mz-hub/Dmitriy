"""Разбор docs/plan.md — источник истины по темам, часам и порядку занятий.

Конфиг дисциплины сверяется с этим файлом при каждой сборке. Если они
расходятся, сборка останавливается и печатает таблицу расхождений.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from . import paths

_SECTION_RE = re.compile(r"^##\s+(Раздел\s+\d+\..+?)\s*$")
_SEMESTER_RE = re.compile(r"^#\s+СЕМЕСТР\s+(\d+)")
_ROW_RE = re.compile(r"^\|\s*(\d+)\s*\|(.+)\|\s*$")


@dataclass
class PlanLesson:
    n: int
    hours: int
    semester: int
    section: str
    topic: str
    theory: str
    task: str


def _clean(cell: str) -> str:
    """Убирает markdown-разметку и нормализует пробелы."""
    text = cell.strip()
    text = text.replace("**", "").replace("`", "")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize(text: str) -> str:
    """Форма для сравнения: без регистра, без разметки, дефисы и тире едины."""
    text = _clean(text).lower()
    text = text.replace("ё", "е")
    text = re.sub(r"[«»\"']", "", text)
    text = re.sub(r"[—–−]", "-", text)
    text = re.sub(r"\s*-\s*", "-", text)
    return text


def parse_plan(plan_path=None) -> list[PlanLesson]:
    path = plan_path or (paths.ROOT / "docs" / "plan.md")
    if not path.exists():
        raise FileNotFoundError(f"Не найден план: {path}")

    lessons: list[PlanLesson] = []
    semester = 1
    section = ""
    seen: set[int] = set()

    for line in path.read_text(encoding="utf-8").splitlines():
        m = _SEMESTER_RE.match(line)
        if m:
            semester = int(m.group(1))
            continue

        m = _SECTION_RE.match(line)
        if m:
            # «Раздел 1. Логистическая система как объект оценки (11 ч)»
            # → сравниваем без указания часов в скобках
            section = re.sub(r"\s*\(\s*\d+\s*ч\.?\s*\)\s*$", "",
                             _clean(m.group(1)))
            continue

        m = _ROW_RE.match(line)
        if not m:
            continue

        number = int(m.group(1))
        cells = [_clean(c) for c in m.group(2).split("|")]
        # ждём: Ч | Тема | Теоретический блок | Задание
        if len(cells) < 4:
            continue
        hours_cell = cells[0]
        if not hours_cell.isdigit():
            continue  # это не строка занятия (например, сводка часов)
        if number in seen:
            continue  # сводные таблицы в конце плана не перечитываем
        seen.add(number)

        lessons.append(
            PlanLesson(
                n=number,
                hours=int(hours_cell),
                semester=semester,
                section=section,
                topic=cells[1],
                theory=cells[2],
                task=cells[3],
            )
        )

    lessons.sort(key=lambda x: x.n)
    return lessons
