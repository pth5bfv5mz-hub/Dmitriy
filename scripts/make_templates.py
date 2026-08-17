#!/usr/bin/env python3
"""Создаёт базовые шаблоны templates/base_deck.pptx и templates/base_doc.docx.

Запускается один раз (и повторно — если поменялся data/theme.yaml):

    python scripts/make_templates.py

Единственный скрипт, который пишет в templates/. Генераторы занятий
(build.py, build_site.py) пишут только в output/ и site/.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from pptx import Presentation
from pptx.util import Inches

from lib import loader, paths


def build_deck_template(theme: dict) -> Path:
    """Пустая презентация 16:9 — база для всех колод курса."""
    prs = Presentation()
    prs.slide_width = Inches(theme["pptx"]["slide_width_in"])
    prs.slide_height = Inches(theme["pptx"]["slide_height_in"])

    # В базе слайдов быть не должно — все слайды создаёт генератор.
    xml_slides = prs.slides._sldIdLst
    for sld in list(xml_slides):
        xml_slides.remove(sld)

    paths.TEMPLATES.mkdir(parents=True, exist_ok=True)
    prs.save(paths.DECK_TEMPLATE)
    return paths.DECK_TEMPLATE


def _set_style_font(style, name: str, size_pt: float, *, bold=False,
                    color: str | None = None):
    font = style.font
    font.name = name
    font.size = Pt(size_pt)
    font.bold = bold
    if color:
        font.color.rgb = RGBColor.from_string(color)
    # Кириллица в docx требует явного east-asian/cs-шрифта
    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = rpr.makeelement(qn("w:rFonts"), {})
        rpr.append(rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rfonts.set(qn(attr), name)


def build_doc_template(theme: dict) -> Path:
    """Базовый .docx: страница, поля, стили под документы СПО."""
    doc = Document()
    cfg = theme["docx"]
    palette = theme["palette"]

    section = doc.sections[0]
    section.orientation = WD_ORIENT.PORTRAIT
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    margins = cfg["page"]["margins_cm"]
    section.top_margin = Cm(margins["top"])
    section.bottom_margin = Cm(margins["bottom"])
    section.left_margin = Cm(margins["left"])
    section.right_margin = Cm(margins["right"])

    font_name = cfg["font"]

    normal = doc.styles["Normal"]
    _set_style_font(normal, font_name, cfg["font_size"])
    normal.paragraph_format.line_spacing = cfg["line_spacing"]
    normal.paragraph_format.space_after = Pt(4)

    for level, size in ((1, cfg["heading_size"] + 1), (2, cfg["heading_size"]),
                        (3, cfg["font_size"] + 1)):
        style = doc.styles[f"Heading {level}"]
        _set_style_font(style, font_name, size, bold=True,
                        color=palette["primary"])
        style.paragraph_format.space_before = Pt(10 if level == 1 else 8)
        style.paragraph_format.space_after = Pt(6)
        style.paragraph_format.keep_with_next = True

    # Свои стили курса
    specs = [
        ("Курс Титул", cfg["heading_size"] + 4, True, palette["primary"],
         WD_ALIGN_PARAGRAPH.CENTER),
        ("Курс Подзаголовок", cfg["font_size"] + 1, False, palette["muted"],
         WD_ALIGN_PARAGRAPH.CENTER),
        ("Курс Подпись", cfg["font_size_small"], False, palette["muted"],
         WD_ALIGN_PARAGRAPH.LEFT),
        ("Курс Формула", cfg["font_size"] + 1, True, palette["primary"],
         WD_ALIGN_PARAGRAPH.CENTER),
        ("Курс Ответ", cfg["font_size"], True, palette["ok_green"],
         WD_ALIGN_PARAGRAPH.LEFT),
    ]
    for name, size, bold, color, align in specs:
        style = doc.styles.add_style(name, 1)  # 1 = WD_STYLE_TYPE.PARAGRAPH
        style.base_style = doc.styles["Normal"]
        _set_style_font(style, font_name, size, bold=bold, color=color)
        style.paragraph_format.alignment = align
        style.paragraph_format.space_after = Pt(6)

    paths.TEMPLATES.mkdir(parents=True, exist_ok=True)
    doc.save(paths.DOC_TEMPLATE)
    return paths.DOC_TEMPLATE


def main() -> int:
    theme = loader.load_theme()
    deck = build_deck_template(theme)
    doc = build_doc_template(theme)
    for path in (deck, doc):
        print(f"создан шаблон: {path.relative_to(paths.ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
