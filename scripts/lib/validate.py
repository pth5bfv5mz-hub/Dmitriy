"""Проверки перед сборкой.

Правило: не проходит — файлы не создаются, расхождения печатаются таблицей.

Проверяется:
  1. сумма часов по занятиям == заявленной по семестрам и всего;
  2. число занятий и сплошная нумерация;
  3. темы, часы, семестр и раздел совпадают с docs/plan.md;
  4. содержимое конфигов занятий (обязательные поля, коды ОК/ПК, лимиты слайдов);
  5. комплектность файлов занятия (проверяется после сборки).
"""
from __future__ import annotations

from dataclasses import dataclass

from . import loader, paths, plan_parser
from .loader import Discipline


@dataclass
class Issue:
    scope: str      # «Часы», «Нумерация», «Тема», «Конфиг», «Комплект»
    where: str      # «Занятие 14», «Семестр 1», …
    expected: str
    actual: str
    detail: str = ""

    def as_row(self) -> list[str]:
        return [self.scope, self.where, self.expected, self.actual, self.detail]


def _table(issues: list[Issue]) -> str:
    header = ["Проверка", "Место", "Ожидалось", "Фактически", "Комментарий"]
    rows = [header] + [i.as_row() for i in issues]
    widths = [max(len(str(r[c])) for r in rows) for c in range(len(header))]
    widths = [min(w, 60) for w in widths]

    def fmt(cells):
        out = []
        for c, w in zip(cells, widths):
            s = str(c)
            if len(s) > w:
                s = s[: w - 1] + "…"
            out.append(s.ljust(w))
        return "  ".join(out).rstrip()

    lines = [fmt(header), "  ".join("-" * w for w in widths)]
    lines += [fmt(i.as_row()) for i in issues]
    return "\n".join(lines)


def report(issues: list[Issue]) -> str:
    if not issues:
        return "Проверки пройдены, расхождений нет."
    return (
        f"Найдено расхождений: {len(issues)}. Файлы не создаются.\n\n"
        + _table(issues)
    )


# --- 1-3. Сверка конфига дисциплины с планом ------------------------------

def check_plan_consistency(discipline: Discipline) -> list[Issue]:
    issues: list[Issue] = []
    plan_path = paths.ROOT / discipline.plan_file
    plan = plan_parser.parse_plan(plan_path)
    plan_by_n = {p.n: p for p in plan}
    cfg_by_n = {r.n: r for r in discipline.rows}

    # Число занятий
    if len(plan) != len(discipline.rows):
        issues.append(Issue(
            "Число занятий", discipline.code,
            f"{len(plan)} (по плану)", f"{len(discipline.rows)} (в конфиге)",
            "план и конфиг дисциплины расходятся",
        ))

    # Сплошная нумерация
    numbers = sorted(cfg_by_n)
    if numbers:
        expected = list(range(1, len(numbers) + 1))
        if numbers != expected:
            missing = sorted(set(expected) - set(numbers))
            extra = sorted(set(numbers) - set(expected))
            issues.append(Issue(
                "Нумерация", discipline.code,
                f"1…{len(numbers)} без пропусков", ", ".join(map(str, numbers[:12])) + "…",
                f"нет: {missing or '—'}; лишние: {extra or '—'}",
            ))

    # Занятия, которых нет в одном из источников
    for n in sorted(set(plan_by_n) - set(cfg_by_n)):
        issues.append(Issue("Тема", f"Занятие {n}", plan_by_n[n].topic,
                            "нет в конфиге дисциплины"))
    for n in sorted(set(cfg_by_n) - set(plan_by_n)):
        issues.append(Issue("Тема", f"Занятие {n}", "нет в docs/plan.md",
                            cfg_by_n[n].topic))

    # Построчная сверка
    norm = plan_parser.normalize
    for n in sorted(set(plan_by_n) & set(cfg_by_n)):
        p, c = plan_by_n[n], cfg_by_n[n]
        if norm(p.topic) != norm(c.topic):
            issues.append(Issue("Тема", f"Занятие {n}", p.topic, c.topic,
                                "тема не совпадает с планом"))
        if p.hours != c.hours:
            issues.append(Issue("Часы", f"Занятие {n}", f"{p.hours} ч", f"{c.hours} ч"))
        if p.semester != c.semester:
            issues.append(Issue("Семестр", f"Занятие {n}",
                                f"{p.semester}", f"{c.semester}"))
        if norm(p.section) != norm(c.section):
            issues.append(Issue("Раздел", f"Занятие {n}", p.section, c.section))
        if norm(p.theory) != norm(c.theory):
            issues.append(Issue("Теорблок", f"Занятие {n}", p.theory, c.theory))
        if norm(p.task) != norm(c.task):
            issues.append(Issue("Задание", f"Занятие {n}", p.task, c.task))

    return issues


def check_hours(discipline: Discipline) -> list[Issue]:
    issues: list[Issue] = []
    expected = {1: discipline.hours_semester_1, 2: discipline.hours_semester_2}
    for semester, want in expected.items():
        got = sum(r.hours for r in discipline.rows if r.semester == semester)
        if got != want:
            issues.append(Issue(
                "Часы", f"Семестр {semester}", f"{want} ч", f"{got} ч",
                "сумма часов по занятиям не совпадает",
            ))
    total = sum(r.hours for r in discipline.rows)
    if total != discipline.hours_total:
        issues.append(Issue(
            "Часы", "Всего", f"{discipline.hours_total} ч", f"{total} ч",
            "сумма часов по занятиям не совпадает",
        ))
    return issues


# --- 4. Проверка конфигов занятий -----------------------------------------

_REQUIRED_LESSON_KEYS = ["goals", "lesson_type", "equipment", "stages", "homework"]
_REQUIRED_GOALS = ["teaching", "developing", "upbringing"]


def check_lesson_config(discipline: Discipline, number: int,
                        competencies: dict, theme: dict) -> list[Issue]:
    issues: list[Issue] = []
    where = f"Занятие {number}"

    if not loader.lesson_config_exists(discipline.id, number):
        issues.append(Issue("Конфиг", where, "файл конфигурации занятия",
                            "нет файла",
                            str(paths.lesson_config_path(discipline.id, number)
                                .relative_to(paths.ROOT))))
        return issues

    cfg = loader.load_lesson(discipline.id, number)

    for key in _REQUIRED_LESSON_KEYS:
        if not cfg.get(key):
            issues.append(Issue("Конфиг", where, f"поле «{key}» заполнено",
                                "пусто или отсутствует"))

    goals = cfg.get("goals") or {}
    for key in _REQUIRED_GOALS:
        if not goals.get(key):
            issues.append(Issue("Конфиг", where, f"цель «{key}»",
                                "пусто или отсутствует"))

    # Коды компетенций — только из реестра
    known_ok = set(competencies.get("ok", {}))
    known_pk = set(competencies.get("pk", {}))
    comp = cfg.get("competencies") or {}
    for code in comp.get("ok", []) or []:
        if code not in known_ok:
            issues.append(Issue("Компетенции", where, "код из data/competencies.yaml",
                                code, "неизвестный код ОК"))
    for code in comp.get("pk", []) or []:
        if code not in known_pk:
            issues.append(Issue("Компетенции", where, "код из data/competencies.yaml",
                                code, "неизвестный код ПК"))

    # Ход занятия: блоки и время
    stages = cfg.get("stages") or []
    allowed_blocks = {"org", "theory", "practice", "final"}
    for i, st in enumerate(stages, 1):
        block = st.get("block")
        if block not in allowed_blocks:
            issues.append(Issue("Конфиг", where,
                                "block из " + "/".join(sorted(allowed_blocks)),
                                str(block), f"этап {i}"))
        for field in ("stage", "teacher", "student", "time"):
            if not st.get(field):
                issues.append(Issue("Конфиг", where, f"этап {i}: поле «{field}»",
                                    "пусто"))
    total_min = sum(int(st.get("minutes", 0) or 0) for st in stages)
    row = discipline.row(number)
    want_min = 45 * row.hours
    if total_min and total_min != want_min:
        issues.append(Issue("Время", where, f"{want_min} мин ({row.hours} ак. ч)",
                            f"{total_min} мин", "сумма минут по этапам"))

    # Презентация
    limits = dict(theme["pptx"]["limits"], _theme=theme)
    slides = cfg.get("slides") or []
    if discipline.needs_deck(number):
        # Занятие на 1 ак. ч может иметь свой лимит слайдов
        override = cfg.get("slide_count_override")
        if override:
            min_slides, max_slides = int(override[0]), int(override[1])
        else:
            min_slides, max_slides = limits["min_slides"], limits["max_slides"]
        if not (min_slides <= len(slides) <= max_slides):
            issues.append(Issue("Слайды", where,
                                f"{min_slides}–{max_slides} слайдов",
                                f"{len(slides)}"))
        issues += _check_slide_limits(slides, where, limits)
        issues += _check_required_slides(slides, where)
    elif slides:
        issues.append(Issue("Слайды", where, "презентация не предусмотрена",
                            f"{len(slides)} слайдов в конфиге",
                            "занятие в lessons_without_deck"))

    # Практическая часть
    practice = cfg.get("practice")
    if discipline.needs_practice(number):
        if not practice:
            issues.append(Issue("Практика", where, "раздел practice", "отсутствует"))
        else:
            issues += _check_practice(practice, where)
    return issues


def _check_slide_limits(slides, where, limits) -> list[Issue]:
    from .pptx_out import DeckBuilder

    issues: list[Issue] = []
    for i, slide in enumerate(slides, 1):
        # слайд-пример: содержимое должно физически поместиться на слайде
        if slide.get("type") == "example":
            need = DeckBuilder.example_height_in(slide)
            have = DeckBuilder.example_available_in(limits["_theme"])
            if need > have:
                issues.append(Issue(
                    "Слайды", where, f"содержимое до {have:.2f} дюйма",
                    f"{need:.2f} дюйма",
                    f"слайд {i}: пример не вмещается — убрать строку «Дано» "
                    f"или объединить шаги"))
        bullets = slide.get("bullets") or []
        if len(bullets) > limits["max_bullets"]:
            issues.append(Issue("Слайды", where,
                                f"не более {limits['max_bullets']} буллетов",
                                f"{len(bullets)}", f"слайд {i}"))
        for b in bullets:
            words = len(str(b).split())
            if words > limits["max_words_per_bullet"]:
                issues.append(Issue("Слайды", where,
                                    f"не более {limits['max_words_per_bullet']} слов",
                                    f"{words} слов", f"слайд {i}: {str(b)[:40]}…"))
    return issues


def _check_required_slides(slides, where) -> list[Issue]:
    issues: list[Issue] = []
    kinds = [s.get("type") for s in slides]
    required = {
        "title": "слайд темы и цели",
        "question": "слайд-вопрос в начале",
        "check": "слайд «Закрепление»",
        "summary": "слайд «Итог»",
        "homework": "слайд «Домашнее задание»",
    }
    for kind, label in required.items():
        if kind not in kinds:
            issues.append(Issue("Слайды", where, label, "нет слайда такого типа"))
    example_count = kinds.count("example")
    if example_count < 2:
        issues.append(Issue("Слайды", where, "2–3 слайда разобранного примера",
                            f"{example_count}", "тип example"))
    if kinds and kinds[0] != "title":
        issues.append(Issue("Слайды", where, "первый слайд — title",
                            str(kinds[0])))
    return issues


def _check_practice(practice, where) -> list[Issue]:
    issues: list[Issue] = []
    kind = practice.get("kind")
    if kind not in {"task", "test", "case"}:
        issues.append(Issue("Практика", where, "kind: task / test / case", str(kind)))
        return issues

    if not practice.get("criteria"):
        issues.append(Issue("Практика", where, "критерии оценки", "отсутствуют"))

    if kind == "test":
        questions = practice.get("questions") or []
        closed = [q for q in questions if q.get("options")]
        open_q = [q for q in questions if not q.get("options")]
        if len(questions) != 10:
            issues.append(Issue("Практика", where, "10 вопросов",
                                f"{len(questions)}", "тест"))
        if len(closed) != 8:
            issues.append(Issue("Практика", where, "8 закрытых вопросов",
                                f"{len(closed)}", "тест"))
        if len(open_q) != 2:
            issues.append(Issue("Практика", where, "2 открытых вопроса",
                                f"{len(open_q)}", "тест"))
        for i, q in enumerate(questions, 1):
            if q.get("answer") in (None, ""):
                issues.append(Issue("Практика", where, f"вопрос {i}: ключ",
                                    "не задан"))
    else:
        if not practice.get("steps"):
            issues.append(Issue("Практика", where, "порядок выполнения",
                                "отсутствует"))
        if not practice.get("solution"):
            issues.append(Issue("Практика", where, "эталон решения",
                                "отсутствует"))
    return issues


# --- 5. Комплектность файлов ----------------------------------------------

def expected_files(discipline: Discipline, number: int) -> list[str]:
    files = [f"Занятие_{number:02d}_Техкарта.docx"]
    if discipline.needs_deck(number):
        files.append(f"Занятие_{number:02d}_Презентация.pptx")
    if discipline.needs_practice(number):
        files.append(f"Занятие_{number:02d}_Практика.docx")
    else:
        files.append(f"Занятие_{number:02d}_Материалы.docx")
    return files


def check_kit(discipline: Discipline, number: int) -> list[Issue]:
    folder = paths.lesson_dir(discipline, number)
    issues: list[Issue] = []
    for name in expected_files(discipline, number):
        if not (folder / name).exists():
            issues.append(Issue("Комплект", f"Занятие {number}", name, "файла нет"))
    return issues


# --- Сводная проверка -----------------------------------------------------

def preflight(discipline: Discipline, numbers: list[int]) -> list[Issue]:
    """Все проверки, которые обязаны пройти до записи файлов."""
    competencies = loader.load_competencies()
    theme = loader.load_theme()
    issues = check_hours(discipline) + check_plan_consistency(discipline)
    for n in numbers:
        issues += check_lesson_config(discipline, n, competencies, theme)
    return issues
