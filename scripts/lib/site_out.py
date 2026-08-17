"""Сборка локального статического сайта (чистый HTML + CSS, без сборщиков).

Сайт открывается двойным кликом по site/index.html и работает без интернета.
Поэтому поисковый индекс подключается через <script src>, а не fetch:
из file:// запросы fetch браузер блокирует, а подключение скрипта работает.

HTML вручную не правится — файлы полностью пересобираются из data/.
"""
from __future__ import annotations

import html
import json
import shutil
from pathlib import Path
from urllib.parse import quote

from . import loader, paths, validate

BLOCK_TITLES = {
    "org": "Организационная часть",
    "theory": "Блок 1. Теория",
    "practice": "Блок 2. Практика",
    "final": "Заключительная часть",
}


def esc(text) -> str:
    return html.escape(str(text), quote=True)


def rel_path(from_file: Path, target: Path) -> str:
    """Относительная ссылка с процентным кодированием (кириллица в путях)."""
    import os
    rel = os.path.relpath(target, from_file.parent)
    return quote(rel.replace(os.sep, "/"))


# --- шаблон страницы ------------------------------------------------------

def page(title: str, body: str, *, depth: int, active: str = "") -> str:
    up = "../" * depth
    nav = [
        ("Дисциплины", f"{up}index.html", "home"),
        ("Поиск", f"{up}search.html", "search"),
    ]
    nav_html = "".join(
        '<a href="{}"{}>{}</a>'.format(
            h, ' class="on"' if key == active else "", esc(t))
        for t, h, key in nav
    )
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<link rel="stylesheet" href="{up}assets/style.css">
</head>
<body>
<header class="top">
  <div class="wrap">
    <a class="brand" href="{up}index.html">Поурочные материалы</a>
    <nav>{nav_html}</nav>
  </div>
</header>
<main class="wrap">
{body}
</main>
<footer class="bottom"><div class="wrap">
  Локальный сайт материалов. Пересобирается командой
  <code>python scripts/build_site.py</code> — правки в HTML будут потеряны.
</div></footer>
<script src="{up}assets/app.js"></script>
</body>
</html>
"""


# --- CSS ------------------------------------------------------------------

CSS = """:root{
  --primary:#1F3864; --accent:#2E75B6; --accent-soft:#D6E2F2;
  --surface:#F2F5FA; --line:#D9E0EA; --text:#1A1A1A; --muted:#5A6472;
  --bg:#FFFFFF; --ok:#2E7D32; --warn:#B24A00;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);
  font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
a{color:var(--accent)}
code{background:var(--surface);padding:1px 5px;border-radius:3px;font-size:.9em}

.top{background:var(--primary);color:#fff}
.top .wrap{display:flex;align-items:center;justify-content:space-between;
  gap:16px;min-height:56px;flex-wrap:wrap}
.brand{color:#fff;font-weight:700;text-decoration:none;font-size:17px}
.top nav{display:flex;gap:6px}
.top nav a{color:#C9D6EA;text-decoration:none;padding:6px 12px;border-radius:4px;
  font-size:14px}
.top nav a:hover{background:rgba(255,255,255,.12);color:#fff}
.top nav a.on{background:rgba(255,255,255,.18);color:#fff}

.bottom{margin-top:48px;padding:18px 0;border-top:1px solid var(--line);
  color:var(--muted);font-size:13px}

h1{font-size:26px;color:var(--primary);margin:26px 0 6px;line-height:1.25}
h2{font-size:19px;color:var(--primary);margin:28px 0 10px;
  padding-bottom:6px;border-bottom:2px solid var(--accent-soft)}
h3{font-size:16px;color:var(--primary);margin:18px 0 6px}
.lead{color:var(--muted);margin:0 0 18px}
.crumbs{font-size:13px;color:var(--muted);margin:18px 0 0}
.crumbs a{color:var(--muted)}

table{border-collapse:collapse;width:100%;margin:10px 0 16px;font-size:14px}
th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;
  vertical-align:top}
th{background:var(--primary);color:#fff;font-weight:600}
tbody tr:nth-child(even){background:var(--surface)}
.scroll{overflow-x:auto}

.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
  gap:16px;margin:18px 0}
.card{border:1px solid var(--line);border-radius:8px;padding:16px 18px;
  background:#fff}
.card h3{margin:0 0 4px}
.card h3 a{text-decoration:none}
.card .meta{color:var(--muted);font-size:13px;margin:0 0 12px}
.bar{height:8px;background:var(--surface);border-radius:4px;overflow:hidden;
  margin:10px 0 6px}
.bar span{display:block;height:100%;background:var(--accent)}
.bar-label{font-size:13px;color:var(--muted)}
.stats{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;color:var(--muted);
  margin:6px 0 0}
.stats b{color:var(--text);font-weight:600}

.tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;
  margin:14px 0 6px;padding:14px;background:var(--surface);
  border-radius:8px;border:1px solid var(--line)}
.tools label{font-size:13px;color:var(--muted)}
input[type=text],input[type=search],select{font:inherit;font-size:14px;
  padding:7px 10px;border:1px solid var(--line);border-radius:5px;background:#fff}
input[type=search]{min-width:260px;flex:1}
.count{font-size:13px;color:var(--muted);margin:0 0 10px}

.chip{display:inline-block;font-size:12px;padding:2px 8px;border-radius:10px;
  background:var(--accent-soft);color:var(--primary);margin:0 4px 4px 0}
.chip.warn{background:#FBE9DD;color:var(--warn)}
.chip.ok{background:#E3F0E4;color:var(--ok)}

.dl{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 4px}
.dl a{display:inline-block;text-decoration:none;font-size:14px;font-weight:600;
  padding:10px 16px;border-radius:6px;background:var(--primary);color:#fff}
.dl a.alt{background:#fff;color:var(--primary);
  border:1px solid var(--primary)}
.dl a:hover{opacity:.9}
.dl .missing{padding:10px 16px;font-size:14px;color:var(--muted);
  border:1px dashed var(--line);border-radius:6px}

.box{border-left:4px solid var(--accent);background:var(--surface);
  padding:12px 16px;border-radius:0 6px 6px 0;margin:12px 0}
.box.note{border-left-color:var(--muted)}
dl.kv{margin:8px 0 16px}
dl.kv dt{font-weight:600;color:var(--primary);margin-top:10px;font-size:14px}
dl.kv dd{margin:2px 0 0;padding:0}
ul.tight{margin:6px 0 14px;padding-left:22px}
ul.tight li{margin:3px 0}

textarea{width:100%;min-height:150px;font:inherit;font-size:14px;padding:12px;
  border:1px solid var(--line);border-radius:6px;resize:vertical;background:#fff}
.notes-bar{display:flex;gap:12px;align-items:center;margin-top:8px;
  font-size:13px;color:var(--muted);flex-wrap:wrap}
.notes-bar button{font:inherit;font-size:13px;padding:6px 12px;
  border:1px solid var(--line);background:#fff;border-radius:5px;cursor:pointer}
.notes-bar button:hover{background:var(--surface)}
.saved{color:var(--ok)}

.hit{border:1px solid var(--line);border-radius:8px;padding:14px 16px;
  margin:12px 0}
.hit h3{margin:0 0 2px}
.hit h3 a{text-decoration:none}
.hit .where{font-size:13px;color:var(--muted);margin:0 0 8px}
.hit .why{font-size:14px;margin:0}
mark{background:#FFF0BF;padding:0 2px}
.empty{color:var(--muted);padding:20px 0}
.pager{display:flex;justify-content:space-between;gap:12px;margin:32px 0 0;
  padding-top:16px;border-top:1px solid var(--line);font-size:14px}

@media (max-width:640px){
  h1{font-size:22px}
  input[type=search]{min-width:100%}
  .cards{grid-template-columns:1fr}
}
@media print{
  .top,.bottom,.dl,.notes,.pager,.tools{display:none}
  body{font-size:12pt}
  a{color:inherit;text-decoration:none}
}
"""


# --- JS -------------------------------------------------------------------

JS = r"""// Скрипты сайта материалов. Работают из file:// без интернета.
(function () {
  "use strict";

  // --- Заметки преподавателя: сохранение в localStorage ---
  var area = document.getElementById("notes");
  if (area) {
    var key = "notes:" + area.dataset.key;
    var status = document.getElementById("notes-status");
    var clear = document.getElementById("notes-clear");
    try { area.value = localStorage.getItem(key) || ""; } catch (e) {}

    var timer = null;
    function save() {
      try {
        localStorage.setItem(key, area.value);
        if (status) {
          status.textContent = "сохранено " + new Date()
            .toLocaleTimeString("ru-RU");
          status.className = "saved";
        }
      } catch (e) {
        if (status) status.textContent =
          "не удалось сохранить: браузер запретил локальное хранилище";
      }
    }
    area.addEventListener("input", function () {
      if (status) { status.textContent = "…"; status.className = ""; }
      clearTimeout(timer);
      timer = setTimeout(save, 500);
    });
    if (clear) clear.addEventListener("click", function () {
      if (!confirm("Удалить заметки по этому занятию?")) return;
      area.value = "";
      save();
    });
  }

  // --- Фильтр таблицы занятий на странице дисциплины ---
  var table = document.getElementById("lessons");
  if (table) {
    var q = document.getElementById("f-text");
    var sem = document.getElementById("f-sem");
    var sect = document.getElementById("f-section");
    var counter = document.getElementById("f-count");
    var rows = Array.prototype.slice.call(
      table.tBodies[0].getElementsByTagName("tr"));

    function apply() {
      var text = (q.value || "").toLowerCase().trim();
      var s = sem.value, sc = sect.value, shown = 0;
      rows.forEach(function (tr) {
        var ok = true;
        if (s && tr.dataset.sem !== s) ok = false;
        if (ok && sc && tr.dataset.section !== sc) ok = false;
        if (ok && text && tr.dataset.find.indexOf(text) === -1) ok = false;
        tr.style.display = ok ? "" : "none";
        if (ok) shown++;
      });
      if (counter) counter.textContent = "Показано занятий: " + shown +
        " из " + rows.length;
    }
    [q, sem, sect].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", apply);
      el.addEventListener("change", apply);
    });
    apply();
  }

  // --- Поиск по темам и ключевым понятиям ---
  var form = document.getElementById("search-form");
  if (form && window.SEARCH_INDEX) {
    var input = document.getElementById("s-q");
    var out = document.getElementById("s-out");
    var info = document.getElementById("s-info");

    function escapeHtml(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    }
    function highlight(text, terms) {
      var res = escapeHtml(text);
      terms.forEach(function (t) {
        if (t.length < 2) return;
        var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
          ")", "gi");
        res = res.replace(re, "<mark>$1</mark>");
      });
      return res;
    }

    function run() {
      var raw = (input.value || "").toLowerCase().trim();
      out.innerHTML = "";
      if (raw.length < 2) {
        info.textContent = "Введите не менее двух символов.";
        return;
      }
      var terms = raw.split(/\s+/);
      var hits = [];
      window.SEARCH_INDEX.forEach(function (item) {
        var score = 0, why = [];
        terms.forEach(function (t) {
          if (item.topic.toLowerCase().indexOf(t) !== -1) score += 10;
          if (item.section.toLowerCase().indexOf(t) !== -1) score += 3;
          var kw = item.keywords.filter(function (k) {
            return k.toLowerCase().indexOf(t) !== -1;
          });
          if (kw.length) { score += 6; why = why.concat(kw); }
          if (item.text.indexOf(t) !== -1) score += 1;
        });
        if (score > 0) hits.push({ item: item, score: score, why: why });
      });
      hits.sort(function (a, b) {
        return b.score - a.score || a.item.n - b.item.n;
      });
      info.textContent = hits.length
        ? "Найдено занятий: " + hits.length
        : "Ничего не найдено. Попробуйте другое слово, например «оборачиваемость».";
      hits.forEach(function (h) {
        var it = h.item;
        var uniq = h.why.filter(function (v, i, a) { return a.indexOf(v) === i; });
        var div = document.createElement("div");
        div.className = "hit";
        div.innerHTML =
          '<h3><a href="' + it.url + '">Занятие ' + it.n + ". " +
          highlight(it.topic, terms) + "</a>" +
          (it.ready ? "" : ' <span class="chip warn">комплект не собран</span>') +
          "</h3>" +
          '<p class="where">' + escapeHtml(it.discipline) + " · " +
          escapeHtml(it.section) + " · семестр " + it.semester +
          " · " + it.hours + " ч</p>" +
          (uniq.length
            ? '<p class="why">Ключевые понятия: ' +
              highlight(uniq.join(", "), terms) + "</p>"
            : '<p class="why">' + highlight(it.theory, terms) + "</p>");
        out.appendChild(div);
      });
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    input.addEventListener("input", run);
    input.focus();
    run();
  }
})();
"""


# --- сборка страниц -------------------------------------------------------

def _readiness(discipline, number: int) -> tuple[str, list[str]]:
    """Готовность занятия: есть конфиг и все файлы комплекта."""
    if not loader.lesson_config_exists(discipline.id, number):
        return "нет", []
    folder = paths.lesson_dir(discipline, number)
    expected = validate.expected_files(discipline, number)
    present = [n for n in expected if (folder / n).exists()]
    if len(present) == len(expected):
        return "готово", present
    if present:
        return "частично", present
    return "конфиг", present


def build_index(disciplines) -> str:
    cards = []
    for d, info in disciplines:
        done = info["ready"]
        total = len(d.rows)
        pct = round(done / total * 100) if total else 0
        cards.append(f"""
    <div class="card">
      <h3><a href="{esc(d.id)}/index.html">{esc(d.code)} «{esc(d.title)}»</a></h3>
      <p class="meta">{esc(d.specialty_code)} {esc(d.specialty)} · группа
        {esc(d.group)} · {d.course} курс</p>
      <div class="bar"><span style="width:{pct}%"></span></div>
      <p class="bar-label">Готово комплектов: {done} из {total} ({pct} %)</p>
      <p class="stats">
        <span>Занятий: <b>{total}</b></span>
        <span>Часов: <b>{d.hours_total}</b></span>
        <span>1 сем.: <b>{d.hours_semester_1} ч</b></span>
        <span>2 сем.: <b>{d.hours_semester_2} ч</b></span>
        <span>Аттестация: <b>{esc(d.assessment)}</b></span>
      </p>
    </div>""")

    total_lessons = sum(len(d.rows) for d, _ in disciplines)
    total_ready = sum(i["ready"] for _, i in disciplines)
    body = f"""
  <h1>Поурочные материалы</h1>
  <p class="lead">Локальная база техкарт, презентаций и практических заданий.
    Дисциплин: {len(disciplines)}, занятий: {total_lessons},
    готовых комплектов: {total_ready}.</p>
  <div class="cards">{''.join(cards)}</div>
  <div class="box note">
    <p><b>Как обновить.</b> Материалы занятия собираются командой
    <code>python scripts/build.py --lesson N</code>, сайт —
    <code>python scripts/build_site.py</code>. Все тексты берутся из
    <code>data/</code>, HTML-файлы не редактируются вручную.</p>
  </div>"""
    return page("Поурочные материалы", body, depth=0, active="home")


def build_discipline(discipline, rows_info) -> str:
    sections = []
    for r in discipline.rows:
        if r.section not in sections:
            sections.append(r.section)
    opts = "".join(f'<option value="{esc(s)}">{esc(s)}</option>'
                   for s in sections)

    trs = []
    for r in discipline.rows:
        state, _ = rows_info[r.n]
        chip = {
            "готово": '<span class="chip ok">готово</span>',
            "частично": '<span class="chip warn">частично</span>',
            "конфиг": '<span class="chip warn">нет файлов</span>',
            "нет": '<span class="chip">не собрано</span>',
        }[state]
        find = " ".join([str(r.n), r.topic, r.theory, r.task, r.section]).lower()
        link = (f'<a href="lesson-{r.n:02d}.html">{esc(r.topic)}</a>'
                if state != "нет" else esc(r.topic))
        kt = f' <span class="chip">{esc(r.checkpoint)}</span>' if r.checkpoint else ""
        trs.append(f"""      <tr data-sem="{r.semester}"
          data-section="{esc(r.section)}" data-find="{esc(find)}">
        <td>{r.n}</td><td>{link}{kt}</td>
        <td>{esc(r.section)}</td><td>{r.semester}</td>
        <td>{r.hours}</td><td>{chip}</td></tr>""")

    body = f"""
  <p class="crumbs"><a href="../index.html">Дисциплины</a> → {esc(discipline.code)}</p>
  <h1>{esc(discipline.code)} «{esc(discipline.title)}»</h1>
  <p class="lead">{esc(discipline.specialty_code)} {esc(discipline.specialty)} ·
    группа {esc(discipline.group)}, {discipline.course} курс,
    {esc(discipline.form)} форма · {discipline.hours_total} ч
    ({discipline.hours_semester_1} + {discipline.hours_semester_2}) ·
    {esc(discipline.assessment)}</p>

  <div class="tools">
    <label for="f-text">Поиск по теме</label>
    <input type="search" id="f-text" placeholder="например: оборачиваемость">
    <label for="f-sem">Семестр</label>
    <select id="f-sem"><option value="">все</option>
      <option value="1">1</option><option value="2">2</option></select>
    <label for="f-section">Раздел</label>
    <select id="f-section"><option value="">все</option>{opts}</select>
  </div>
  <p class="count" id="f-count"></p>

  <div class="scroll">
  <table id="lessons">
    <thead><tr><th>№</th><th>Тема</th><th>Раздел</th><th>Сем.</th>
      <th>Ч</th><th>Комплект</th></tr></thead>
    <tbody>
{chr(10).join(trs)}
    </tbody>
  </table>
  </div>"""
    return page(f"{discipline.code} — занятия", body, depth=1)


def _stages_html(cfg) -> str:
    stages = cfg.get("stages") or []
    out = []
    for block in ("org", "theory", "practice", "final"):
        rows = [s for s in stages if s.get("block") == block]
        if not rows:
            continue
        trs = "".join(
            f"<tr><td>{esc(s['stage'])}<br><small>{esc(s['time'])}</small></td>"
            f"<td>{esc(s['teacher'])}</td><td>{esc(s['student'])}</td></tr>"
            for s in rows)
        out.append(f"""
  <h3>{esc(BLOCK_TITLES[block])}</h3>
  <div class="scroll"><table>
    <thead><tr><th style="width:20%">Этап и время</th>
      <th style="width:40%">Деятельность преподавателя</th>
      <th style="width:40%">Деятельность студентов</th></tr></thead>
    <tbody>{trs}</tbody></table></div>""")
    return "".join(out)


def build_lesson(discipline, row, cfg, competencies, state, files,
                 prev_n, next_n, out_path: Path) -> str:
    goals = cfg["goals"]

    comp_rows = []
    for kind, reg in (("pk", "pk"), ("ok", "ok")):
        for code in (cfg.get("competencies") or {}).get(kind, []) or []:
            entry = (competencies.get(reg) or {}).get(code)
            if not entry:
                comp_rows.append(("[ПК-?]" if kind == "pk" else "[ОК-?]",
                                  f"код «{code}» не найден в реестре"))
                continue
            text = entry["text"]
            if entry.get("verified") == "partial":
                text += " [сверить формулировку с РП]"
            comp_rows.append((code, text))
    comp_html = "".join(f"<tr><td><b>{esc(c)}</b></td><td>{esc(t)}</td></tr>"
                        for c, t in comp_rows)

    # кнопки скачивания — относительные ссылки на файлы в output/
    folder = paths.lesson_dir(discipline, row.n)
    buttons = []
    labels = {"Презентация.pptx": ("Скачать презентацию (.pptx)", ""),
              "Техкарта.docx": ("Скачать техкарту (.docx)", "alt"),
              "Практика.docx": ("Скачать практику (.docx)", "alt"),
              "Материалы.docx": ("Скачать материалы (.docx)", "alt")}
    for name in validate.expected_files(discipline, row.n):
        suffix = name.split("_", 2)[-1]
        label, cls = labels.get(suffix, (name, "alt"))
        target = folder / name
        if target.exists():
            href = rel_path(out_path, target)
            buttons.append(f'<a class="{cls}" href="{href}" download>'
                           f'{esc(label)}</a>')
        else:
            buttons.append(f'<span class="missing">{esc(label)} — не собран</span>')

    hw = cfg["homework"]
    if isinstance(hw, dict):
        hw_html = f"<p>{esc(hw.get('text', ''))}</p>"
        if hw.get("bullets"):
            hw_html += ("<ul class='tight'>"
                        + "".join(f"<li>{esc(b)}</li>" for b in hw["bullets"])
                        + "</ul>")
        if hw.get("source"):
            hw_html += f"<p><small>{esc(hw['source'])}</small></p>"
    else:
        hw_html = f"<p>{esc(hw)}</p>"

    results = cfg.get("results") or {}
    results_html = ""
    if results:
        results_html = f"""
  <h2>Планируемые результаты</h2>
  <dl class="kv">
    <dt>Знать</dt><dd>{esc(results.get('know', '—'))}</dd>
    <dt>Уметь</dt><dd>{esc(results.get('can', '—'))}</dd>
  </dl>"""

    practice = cfg.get("practice") or {}
    practice_html = ""
    if practice:
        kind = {"task": "расчётная задача", "case": "разбор кейса",
                "test": "тест"}.get(practice.get("kind"), practice.get("kind"))
        practice_html = f"""
  <h2>Практическая часть</h2>
  <dl class="kv">
    <dt>Формат</dt><dd>{esc(kind)}</dd>
    <dt>Время</dt><dd>{esc(practice.get('duration', '—'))}</dd>
    <dt>Форма работы</dt><dd>{esc(practice.get('form', '—'))}</dd>
    <dt>Цель</dt><dd>{esc(practice.get('goal', '—'))}</dd>
  </dl>
  <p class="box note">Условие, порядок выполнения, критерии оценки и эталон
    решения — в файле практики. Эталон вынесен отдельным разделом
    на последнюю страницу.</p>"""

    lit = cfg.get("literature") or []
    lit_html = ("<ol class='tight'>"
                + "".join(f"<li>{esc(x)}</li>" for x in lit) + "</ol>"
                ) if lit else "<p>—</p>"

    notes_teacher = cfg.get("teacher_notes") or []
    notes_teacher_html = ""
    if notes_teacher:
        notes_teacher_html = (
            "<h2>Примечания преподавателю</h2><ul class='tight'>"
            + "".join(f"<li>{esc(x)}</li>" for x in notes_teacher) + "</ul>")

    kw = cfg.get("keywords") or []
    kw_html = "".join(f'<span class="chip">{esc(k)}</span>' for k in kw)

    prev_html = (f'<a href="lesson-{prev_n:02d}.html">← Занятие {prev_n}</a>'
                 if prev_n else "<span></span>")
    next_html = (f'<a href="lesson-{next_n:02d}.html">Занятие {next_n} →</a>'
                 if next_n else "<span></span>")

    body = f"""
  <p class="crumbs"><a href="../index.html">Дисциплины</a> →
    <a href="index.html">{esc(discipline.code)}</a> → Занятие {row.n}</p>
  <h1>Занятие {row.n}. {esc(row.topic)}</h1>
  <p class="lead">{esc(row.section)} · семестр {row.semester} ·
    {row.hours} ак. ч ({45 * row.hours} мин) ·
    {esc(cfg['lesson_type'])}{f" · {esc(row.checkpoint)}" if row.checkpoint else ""}</p>

  <div class="dl">{''.join(buttons)}</div>

  <h2>Технологическая карта</h2>
  <h3>Цели занятия</h3>
  <dl class="kv">
    <dt>Обучающая</dt><dd>{esc(goals['teaching'])}</dd>
    <dt>Развивающая</dt><dd>{esc(goals['developing'])}</dd>
    <dt>Воспитательная</dt><dd>{esc(goals['upbringing'])}</dd>
  </dl>

  <h3>Формируемые компетенции</h3>
  <div class="scroll"><table>
    <thead><tr><th style="width:14%">Код</th><th>Формулировка</th></tr></thead>
    <tbody>{comp_html}</tbody></table></div>

  <h3>Оснащение</h3>
  <ul class="tight">{''.join(f'<li>{esc(x)}</li>' for x in cfg['equipment'])}</ul>
{results_html}

  <h2>Ход занятия</h2>
  <p class="lead">Теория 40–50 минут, далее практика по теории этого же
    занятия. Всего {45 * row.hours} мин.</p>
{_stages_html(cfg)}

  <h2>Домашнее задание</h2>
  {hw_html}
{practice_html}

  <h2>Ключевые понятия</h2>
  <p>{kw_html or '—'}</p>

  <h2>Литература</h2>
  {lit_html}
{notes_teacher_html}

  <div class="notes">
    <h2>Мои заметки</h2>
    <p class="lead">Сохраняются в этом браузере (localStorage), в файлы
      проекта не попадают и при пересборке сайта не теряются.</p>
    <textarea id="notes" data-key="{esc(discipline.id)}-{row.n:02d}"
      placeholder="Что сработало, что переделать, сколько времени реально ушло…"></textarea>
    <div class="notes-bar">
      <button type="button" id="notes-clear">Очистить</button>
      <span id="notes-status"></span>
    </div>
  </div>

  <div class="pager">{prev_html}{next_html}</div>"""
    return page(f"Занятие {row.n}. {row.topic}", body, depth=1)


def build_search(disciplines) -> str:
    body = """
  <h1>Поиск по материалам</h1>
  <p class="lead">Ищет по темам занятий, разделам, ключевым понятиям
    и текстам теоретических блоков всех дисциплин.</p>
  <form id="search-form" class="tools" autocomplete="off">
    <label for="s-q">Запрос</label>
    <input type="search" id="s-q"
      placeholder="оборачиваемость, ABC, OTIF, грузооборот, издержки">
  </form>
  <p class="count" id="s-info"></p>
  <div id="s-out"></div>"""
    return page("Поиск по материалам", body, depth=0, active="search")


def build_search_index(disciplines) -> str:
    items = []
    for d, info in disciplines:
        for r in d.rows:
            cfg = (loader.load_lesson(d.id, r.n)
                   if loader.lesson_config_exists(d.id, r.n) else {})
            keywords = cfg.get("keywords") or []
            haystack = " ".join([
                r.topic, r.section, r.theory, r.task,
                " ".join(keywords),
                (cfg.get("goals") or {}).get("teaching", ""),
            ]).lower()
            state, _ = _readiness(d, r.n)
            url = (f"{d.id}/lesson-{r.n:02d}.html" if state != "нет"
                   else f"{d.id}/index.html")
            items.append({
                "n": r.n, "topic": r.topic, "section": r.section,
                "theory": r.theory, "task": r.task, "semester": r.semester,
                "hours": r.hours, "keywords": keywords,
                "discipline": f"{d.code} «{d.title}»",
                "url": url, "text": haystack,
                "ready": state == "готово",
            })
    payload = json.dumps(items, ensure_ascii=False, indent=0)
    return ("// Файл создаётся автоматически: python scripts/build_site.py\n"
            "// Подключается через <script src>, чтобы поиск работал "
            "из file:// без интернета.\n"
            f"window.SEARCH_INDEX = {payload};\n")


def build_site(discipline_ids: list[str]) -> dict:
    competencies = loader.load_competencies()
    disciplines = []
    for did in discipline_ids:
        d = loader.load_discipline(did)
        rows_info = {r.n: _readiness(d, r.n) for r in d.rows}
        ready = sum(1 for st, _ in rows_info.values() if st == "готово")
        disciplines.append((d, {"rows": rows_info, "ready": ready}))

    if paths.SITE.exists():
        shutil.rmtree(paths.SITE)
    (paths.SITE / "assets").mkdir(parents=True, exist_ok=True)

    written = []

    def write(path: Path, text: str):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        written.append(path)

    write(paths.SITE / "assets" / "style.css", CSS)
    write(paths.SITE / "assets" / "app.js", JS)
    write(paths.SITE / "assets" / "search-index.js",
          build_search_index(disciplines))
    write(paths.SITE / "index.html", build_index(disciplines))

    # страница поиска подключает индекс дополнительно
    search_html = build_search(disciplines).replace(
        '<script src="assets/app.js"></script>',
        '<script src="assets/search-index.js"></script>\n'
        '<script src="assets/app.js"></script>')
    write(paths.SITE / "search.html", search_html)

    for d, info in disciplines:
        write(paths.SITE / d.id / "index.html",
              build_discipline(d, info["rows"]))
        numbers = [r.n for r in d.rows]
        for idx, r in enumerate(d.rows):
            state, files = info["rows"][r.n]
            if state == "нет":
                continue
            cfg = loader.load_lesson(d.id, r.n)
            out_path = paths.SITE / d.id / f"lesson-{r.n:02d}.html"
            prev_n = next((numbers[i] for i in range(idx - 1, -1, -1)
                           if info["rows"][numbers[i]][0] != "нет"), None)
            next_n = next((numbers[i] for i in range(idx + 1, len(numbers))
                           if info["rows"][numbers[i]][0] != "нет"), None)
            write(out_path, build_lesson(d, r, cfg, competencies, state,
                                         files, prev_n, next_n, out_path))

    return {"written": written, "disciplines": disciplines}
