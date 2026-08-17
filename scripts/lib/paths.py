"""Пути проекта. Единственное место, где они заданы."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

DOCS = ROOT / "docs"
DATA = ROOT / "data"
DISCIPLINES = DATA / "disciplines"
LESSONS = DATA / "lessons"
TEMPLATES = ROOT / "templates"
OUTPUT = ROOT / "output"
SITE = ROOT / "site"
REPORTS = OUTPUT / "_отчёты"

DECK_TEMPLATE = TEMPLATES / "base_deck.pptx"
DOC_TEMPLATE = TEMPLATES / "base_doc.docx"

COMPETENCIES = DATA / "competencies.yaml"
THEME = DATA / "theme.yaml"


def lesson_dir(discipline, number: int) -> Path:
    """output/<Группа>/<МДК>/Занятие_NN/"""
    return OUTPUT / discipline.group_dir / discipline.code / f"Занятие_{number:02d}"


def lesson_config_path(discipline_id: str, number: int) -> Path:
    return LESSONS / discipline_id / f"{number:02d}.yaml"
