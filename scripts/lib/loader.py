"""Загрузка конфигов: дисциплины, занятия, компетенции, оформление."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import yaml

from . import paths


def _read_yaml(path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Не найден файл конфигурации: {path}")
    with open(path, encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        raise ValueError(f"Ожидался словарь в {path}, получено {type(data).__name__}")
    return data


@dataclass
class PlanRow:
    """Строка сводки занятий из конфига дисциплины."""
    n: int
    hours: int
    semester: int
    section: str
    topic: str
    theory: str
    task: str
    checkpoint: str | None = None


@dataclass
class Discipline:
    id: str
    code: str
    title: str
    module: str
    specialty_code: str
    specialty: str
    group: str
    group_dir: str
    course: int
    form: str
    plan_file: str
    hours_total: int
    hours_semester_1: int
    hours_semester_2: int
    assessment: str
    pair_hours: int
    notes: list[str] = field(default_factory=list)
    lessons_without_practice: list[int] = field(default_factory=list)
    lessons_without_deck: list[int] = field(default_factory=list)
    rows: list[PlanRow] = field(default_factory=list)

    def row(self, number: int) -> PlanRow:
        for r in self.rows:
            if r.n == number:
                return r
        raise KeyError(f"{self.code}: занятия № {number} нет в сводке дисциплины")

    @property
    def numbers(self) -> list[int]:
        return [r.n for r in self.rows]

    def needs_deck(self, number: int) -> bool:
        return number not in self.lessons_without_deck

    def needs_practice(self, number: int) -> bool:
        return number not in self.lessons_without_practice


def load_discipline(discipline_id: str) -> Discipline:
    raw = _read_yaml(paths.DISCIPLINES / f"{discipline_id}.yaml")
    rows = [PlanRow(**row) for row in raw.pop("lessons", [])]
    rows.sort(key=lambda r: r.n)
    return Discipline(rows=rows, **raw)


def list_discipline_ids() -> list[str]:
    return sorted(p.stem for p in paths.DISCIPLINES.glob("*.yaml"))


def load_lesson(discipline_id: str, number: int) -> dict[str, Any]:
    return _read_yaml(paths.lesson_config_path(discipline_id, number))


def lesson_config_exists(discipline_id: str, number: int) -> bool:
    return paths.lesson_config_path(discipline_id, number).exists()


def available_lesson_numbers(discipline_id: str) -> list[int]:
    folder = paths.LESSONS / discipline_id
    if not folder.exists():
        return []
    numbers = []
    for p in folder.glob("*.yaml"):
        try:
            numbers.append(int(p.stem))
        except ValueError:
            continue
    return sorted(numbers)


def load_competencies() -> dict:
    return _read_yaml(paths.COMPETENCIES)


def load_theme() -> dict:
    return _read_yaml(paths.THEME)
