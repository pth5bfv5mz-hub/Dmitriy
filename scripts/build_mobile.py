#!/usr/bin/env python3
"""Сборка одной самодостаточной страницы для чтения с телефона.

    python scripts/build_mobile.py
    python scripts/build_mobile.py --scale 90 --discipline mdk-04-02

Результат — site/mobile.html: один файл, внутри которого весь текст техкарт
и слайды презентаций в виде картинок. Ничего не подгружается из сети,
поэтому страницу можно открыть с телефона по ссылке или переслать файлом.

Скачивание .docx и .pptx со страницы не предусмотрено: она предназначена
для чтения и вычитки, файлы берутся из output/.

Пишет только в site/.
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import deck_preview, loader, paths, validate

BLOCK_TITLES = {
    "org": "Организационная часть",
    "theory": "Блок 1. Теория",
    "practice": "Блок 2. Практика",
    "final": "Заключительная часть",
}
PRACTICE_KINDS = {"task": "расчётная задача", "case": "разбор кейса",
                  "test": "тест"}


def slide_data_uri(img, max_width: int) -> str:
    if img.width > max_width:
        ratio = max_width / img.width
        img = img.resize((max_width, int(img.height * ratio)))
    buf = io.BytesIO()
    # квантование до 128 цветов: слайды почти плоские, размер падает вдвое
    img.convert("P", palette=1, colors=128).save(buf, format="PNG",
                                                 optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def competency_list(cfg, competencies):
    out = []
    for kind, reg in (("pk", "pk"), ("ok", "ok")):
        for code in (cfg.get("competencies") or {}).get(kind, []) or []:
            entry = (competencies.get(reg) or {}).get(code)
            if not entry:
                out.append({"code": "[ПК-?]" if kind == "pk" else "[ОК-?]",
                            "text": f"код «{code}» не найден в реестре",
                            "flag": True})
                continue
            out.append({
                "code": code,
                "text": entry["text"],
                "flag": entry.get("verified") == "partial",
            })
    return out


def collect(discipline_id: str, scale: int, max_width: int) -> dict:
    d = loader.load_discipline(discipline_id)
    competencies = loader.load_competencies()
    lessons = []
    total_slides = 0

    for row in d.rows:
        item = {
            "n": row.n, "topic": row.topic, "section": row.section,
            "semester": row.semester, "hours": row.hours,
            "theory": row.theory, "task": row.task,
            "checkpoint": row.checkpoint or "",
            "ready": False, "slides": [], "keywords": [],
        }
        if loader.lesson_config_exists(discipline_id, row.n):
            cfg = loader.load_lesson(discipline_id, row.n)
            folder = paths.lesson_dir(d, row.n)
            expected = validate.expected_files(d, row.n)
            item["ready"] = all((folder / n).exists() for n in expected)
            item["files"] = [n for n in expected if (folder / n).exists()]
            item["keywords"] = cfg.get("keywords") or []
            item["lesson_type"] = cfg.get("lesson_type", "")
            item["goals"] = cfg.get("goals") or {}
            item["results"] = cfg.get("results") or {}
            item["equipment"] = cfg.get("equipment") or []
            item["competencies"] = competency_list(cfg, competencies)
            item["stages"] = [
                {"block": s.get("block"),
                 "blockTitle": BLOCK_TITLES.get(s.get("block"), ""),
                 "stage": s.get("stage"), "time": s.get("time"),
                 "teacher": s.get("teacher"), "student": s.get("student")}
                for s in (cfg.get("stages") or [])
            ]
            hw = cfg.get("homework")
            item["homework"] = (hw if isinstance(hw, dict)
                               else {"text": str(hw), "bullets": []})
            item["literature"] = cfg.get("literature") or []
            item["teacherNotes"] = cfg.get("teacher_notes") or []
            practice = cfg.get("practice") or {}
            if practice:
                item["practice"] = {
                    "kind": PRACTICE_KINDS.get(practice.get("kind"),
                                               practice.get("kind", "")),
                    "duration": practice.get("duration", ""),
                    "form": practice.get("form", ""),
                    "goal": practice.get("goal", ""),
                }

            deck = folder / f"Занятие_{row.n:02d}_Презентация.pptx"
            if deck.exists():
                images, _ = deck_preview.render_slides(deck, scale=scale)
                item["slides"] = [slide_data_uri(im, max_width)
                                  for im in images]
                total_slides += len(images)
        lessons.append(item)

    return {
        "discipline": {
            "code": d.code, "title": d.title, "module": d.module,
            "specialty": f"{d.specialty_code} {d.specialty}",
            "group": d.group, "course": d.course, "form": d.form,
            "hoursTotal": d.hours_total,
            "hours1": d.hours_semester_1, "hours2": d.hours_semester_2,
            "assessment": d.assessment,
        },
        "lessons": lessons,
        "totalSlides": total_slides,
        "standard": (competencies.get("standard") or {}),
    }


CSS = """
/* Светлая палитра — полный набор токенов. Цвета курса из data/theme.yaml:
   тёмно-синий 1F3864 и синий 2E75B6. Нейтральные тона смещены в синеву,
   чтобы серый не выглядел случайным. */
:root{
  --paper:#FBFCFD; --raise:#FFFFFF; --surface:#F1F5FA; --edge:#DCE4EF;
  --ink:#131A26; --ink-soft:#4E5A6E; --ink-faint:#76829A;
  --navy:#1F3864; --azure:#2E75B6; --mist:#DDE8F6;
  --bar:#1F3864; --bar-ink:#FFFFFF; --bar-sub:#B9CCE6;
  --on-accent:#FFFFFF;
  --good:#1F6B3A; --good-bg:#E4F0E7; --wait:#8A5200; --wait-bg:#FBEEDA;
  --shadow:0 1px 2px rgba(19,26,38,.06), 0 6px 18px rgba(19,26,38,.05);
  --display:Georgia,"Times New Roman","Noto Serif",serif;
  --body:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans",
    Arial,sans-serif;
  --mono:ui-monospace,"SF Mono",Consolas,"Liberation Mono",monospace;
}
/* Тёмная тема: переопределяются только токены. Условие :not([data-theme="light"])
   нужно, чтобы явно выбранная светлая тема была сильнее тёмной системной. */
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --paper:#0E1520; --raise:#18202D; --surface:#1D2634; --edge:#2C384A;
    --ink:#E7ECF4; --ink-soft:#AEBACB; --ink-faint:#8592A6;
    --navy:#9DBEE6; --azure:#7BAEE0; --mist:#22304A;
    --bar:#152238; --bar-ink:#EAF1FA; --bar-sub:#8FA8C9;
    --on-accent:#0E1520;
    --good:#8CD3A2; --good-bg:#182A1F; --wait:#E9BE7A; --wait-bg:#2C2415;
    --shadow:0 1px 2px rgba(0,0,0,.4), 0 6px 20px rgba(0,0,0,.3);
  }
}
/* Те же токены под явно выбранной тёмной темой. */
:root[data-theme="dark"]{
  --paper:#0E1520; --raise:#18202D; --surface:#1D2634; --edge:#2C384A;
  --ink:#E7ECF4; --ink-soft:#AEBACB; --ink-faint:#8592A6;
  --navy:#9DBEE6; --azure:#7BAEE0; --mist:#22304A;
  --bar:#152238; --bar-ink:#EAF1FA; --bar-sub:#8FA8C9;
  --on-accent:#0E1520;
  --good:#8CD3A2; --good-bg:#182A1F; --wait:#E9BE7A; --wait-bg:#2C2415;
  --shadow:0 1px 2px rgba(0,0,0,.4), 0 6px 20px rgba(0,0,0,.3);
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:var(--body);font-size:16px;line-height:1.55;
  overflow-x:hidden}
h1,h2,h3{font-family:var(--display);text-wrap:balance;
  color:var(--navy);margin:0}
button{font:inherit;color:inherit}
:focus-visible{outline:2px solid var(--azure);outline-offset:2px;
  border-radius:4px}

.bar{position:sticky;top:0;z-index:30;background:var(--bar);
  color:var(--bar-ink);padding:10px 14px;display:flex;align-items:center;
  gap:10px;min-height:52px}
.bar button{background:rgba(255,255,255,.14);border:0;border-radius:8px;
  color:var(--bar-ink);min-width:44px;min-height:38px;cursor:pointer}
.bar .back{padding:0 12px;font-size:15px;display:none}
.bar .back.on{display:block}
.bar .name{font-family:var(--display);font-size:16px;font-weight:700;
  line-height:1.25;color:var(--bar-ink);flex:1;min-width:0}
.bar .name small{display:block;font-family:var(--body);font-weight:400;
  font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;
  color:var(--bar-sub)}
.bar .go{font-size:17px}

.page{max-width:640px;margin:0 auto;padding:18px 14px 56px}
.hero h1{font-size:25px;line-height:1.2}
.hero p.sub{color:var(--ink-soft);font-size:14.5px;margin:8px 0 0}
.facts{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;
  margin:16px 0 4px}
.fact{background:var(--surface);border:1px solid var(--edge);
  border-radius:10px;padding:10px 12px}
.fact b{display:block;font-family:var(--display);font-size:19px;
  color:var(--navy);font-variant-numeric:tabular-nums}
.fact span{font-size:12px;color:var(--ink-faint);
  letter-spacing:.04em;text-transform:uppercase}

.note{background:var(--surface);border-left:3px solid var(--azure);
  border-radius:0 10px 10px 0;padding:12px 14px;margin:18px 0;
  font-size:14px;color:var(--ink-soft)}
.note b{color:var(--ink)}

.seek{display:flex;gap:8px;margin:18px 0 6px}
.seek input{flex:1;min-width:0;font:inherit;font-size:16px;padding:11px 13px;
  border:1px solid var(--edge);border-radius:10px;background:var(--raise);
  color:var(--ink)}
.seek input::placeholder{color:var(--ink-faint)}
.chips{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;
  -webkit-overflow-scrolling:touch;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chips button{white-space:nowrap;background:var(--raise);
  border:1px solid var(--edge);border-radius:999px;padding:7px 14px;
  font-size:13.5px;color:var(--ink-soft);cursor:pointer;min-height:36px}
.chips button.on{background:var(--navy);border-color:var(--navy);
  color:var(--on-accent)}
.tally{font-size:13px;color:var(--ink-faint);margin:2px 0 12px;
  font-variant-numeric:tabular-nums}

.sect{font-family:var(--body);font-size:11.5px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--ink-faint);
  margin:20px 0 8px;padding-bottom:6px;border-bottom:1px solid var(--edge)}
.list{display:flex;flex-direction:column;gap:8px}
.row{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:left;
  background:var(--raise);border:1px solid var(--edge);border-radius:12px;
  padding:12px 13px;cursor:pointer;box-shadow:var(--shadow)}
.row[disabled]{cursor:default;opacity:.72;box-shadow:none;
  background:transparent}
.row .num{display:block;font-family:var(--display);font-size:17px;
  font-weight:700;color:var(--azure);min-width:26px;
  font-variant-numeric:tabular-nums;padding-top:1px}
.row .body{display:block;flex:1;min-width:0}
.row .t{display:block;font-size:15.5px;font-weight:600;line-height:1.35;
  color:var(--ink)}
.row .m{display:block;font-size:12.5px;color:var(--ink-faint);margin-top:4px}
.tag{display:inline-block;font-size:11.5px;padding:2px 8px;border-radius:999px;
  margin:6px 6px 0 0;font-weight:600}
.tag.ok{background:var(--good-bg);color:var(--good)}
.tag.wait{background:var(--wait-bg);color:var(--wait)}
.tag.kt{background:var(--mist);color:var(--navy)}

.lead{color:var(--ink-soft);font-size:14px;margin:8px 0 0}
h2.head{font-size:19px;margin:26px 0 10px;padding-bottom:7px;
  border-bottom:2px solid var(--mist)}
h3.sub{font-size:15.5px;margin:18px 0 6px}
dl.kv{margin:8px 0 0}
dl.kv dt{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink-faint);margin-top:12px}
dl.kv dd{margin:3px 0 0;font-size:15px}
ul.tidy{margin:8px 0 0;padding-left:20px}
ul.tidy li{margin:5px 0;font-size:15px}
ol.tidy{margin:8px 0 0;padding-left:22px;font-size:14px;color:var(--ink-soft)}
ol.tidy li{margin:6px 0}

.comp{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.comp div{background:var(--surface);border-radius:10px;padding:10px 12px;
  font-size:14px}
.comp b{font-family:var(--mono);font-size:13px;color:var(--navy);
  display:block;margin-bottom:3px}
.comp em{color:var(--wait);font-style:normal;font-size:12.5px}

.stage{background:var(--raise);border:1px solid var(--edge);
  border-left:3px solid var(--azure);border-radius:0 12px 12px 0;
  padding:12px 14px;margin-top:8px;box-shadow:var(--shadow)}
.stage.theory{border-left-color:var(--navy)}
.stage.practice{border-left-color:var(--azure)}
.stage.org,.stage.final{border-left-color:var(--ink-faint)}
.stage .hd{display:flex;justify-content:space-between;gap:10px;
  align-items:baseline;margin-bottom:8px}
.stage .hd b{font-size:14.5px;color:var(--ink)}
.stage .hd span{font-family:var(--mono);font-size:12.5px;
  color:var(--ink-faint);white-space:nowrap;font-variant-numeric:tabular-nums}
.stage p{margin:6px 0 0;font-size:14px;color:var(--ink-soft)}
.stage p b{color:var(--ink);font-weight:600}

.deck{margin-top:10px}
.strip{display:flex;gap:10px;overflow-x:auto;padding:2px 0 10px;
  scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.strip figure{margin:0;flex:0 0 82%;scroll-snap-align:center}
.strip img{width:100%;height:auto;display:block;border:1px solid var(--edge);
  border-radius:10px;background:#fff;cursor:zoom-in}
.strip figcaption{font-size:12px;color:var(--ink-faint);margin-top:5px;
  font-variant-numeric:tabular-nums}

.zoom{position:fixed;inset:0;z-index:60;background:rgba(9,14,22,.94);
  display:none;flex-direction:column}
.zoom.on{display:flex}
.zoom .z-top{display:flex;justify-content:space-between;align-items:center;
  padding:10px 14px;color:#fff;font-size:14px;
  font-variant-numeric:tabular-nums}
.zoom .z-top button{background:rgba(255,255,255,.16);border:0;color:#fff;
  border-radius:8px;min-width:44px;min-height:38px;cursor:pointer;
  font-size:16px}
.zoom .z-body{flex:1;display:flex;align-items:center;justify-content:center;
  padding:0 8px 8px;overflow:auto}
.zoom img{max-width:100%;max-height:100%;border-radius:8px;background:#fff}
.zoom .z-nav{display:flex;gap:10px;justify-content:center;padding:10px 14px 20px}
.zoom .z-nav button{flex:1;max-width:170px;background:rgba(255,255,255,.16);
  border:0;color:#fff;border-radius:10px;min-height:46px;cursor:pointer;
  font-size:15px}

textarea{width:100%;min-height:130px;font:inherit;font-size:15px;padding:12px;
  border:1px solid var(--edge);border-radius:10px;background:var(--raise);
  color:var(--ink);resize:vertical}
.saveline{display:flex;gap:10px;align-items:center;margin-top:8px;
  font-size:13px;color:var(--ink-faint);flex-wrap:wrap}
.saveline button{background:var(--raise);border:1px solid var(--edge);
  border-radius:8px;padding:9px 14px;cursor:pointer;min-height:40px;
  font-size:13.5px}
.saveline .done{color:var(--good)}

.hit{background:var(--raise);border:1px solid var(--edge);border-radius:12px;
  padding:12px 13px;margin-bottom:8px;width:100%;text-align:left;
  cursor:pointer;box-shadow:var(--shadow)}
.hit .t{font-size:15px;font-weight:600;color:var(--ink);line-height:1.35}
.hit .m{font-size:12.5px;color:var(--ink-faint);margin-top:4px}
.hit .w{font-size:13.5px;color:var(--ink-soft);margin-top:6px}
mark{background:var(--mist);color:var(--ink);padding:0 2px;border-radius:3px}
.blank{color:var(--ink-faint);font-size:14.5px;padding:18px 0}

.foot{border-top:1px solid var(--edge);margin-top:34px;padding-top:14px;
  font-size:12.5px;color:var(--ink-faint)}
.foot code{font-family:var(--mono);font-size:12px;background:var(--surface);
  padding:1px 5px;border-radius:4px}
@media (min-width:560px){
  .strip figure{flex:0 0 62%}
  .facts{grid-template-columns:repeat(4,1fr)}
}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
"""


JS = r"""
var D = window.COURSE;
var view = document.getElementById("view");
var back = document.getElementById("back");
var barName = document.getElementById("bar-name");
var state = { sem: "", q: "" };

function esc(s){ return String(s == null ? "" : s)
  .replace(/[&<>"]/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

function mark(text, terms){
  var out = esc(text);
  (terms || []).forEach(function(t){
    if (t.length < 2) return;
    out = out.replace(new RegExp("(" +
      t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>");
  });
  return out;
}

function go(hash){ location.hash = hash; }

/* --- список занятий --- */
function renderCourse(){
  var d = D.discipline;
  var ready = D.lessons.filter(function(l){ return l.ready; }).length;
  var h = '<div class="hero"><h1>' + esc(d.code) + " «" + esc(d.title) +
    '»</h1><p class="sub">' + esc(d.specialty) + " · группа " + esc(d.group) +
    ", " + d.course + " курс, " + esc(d.form) + " форма · " +
    esc(d.assessment) + "</p></div>";

  h += '<div class="facts">' +
    '<div class="fact"><b>' + d.hoursTotal + "</b><span>часов</span></div>" +
    '<div class="fact"><b>' + D.lessons.length + "</b><span>занятий</span></div>" +
    '<div class="fact"><b>' + d.hours1 + " / " + d.hours2 +
      "</b><span>по семестрам</span></div>" +
    '<div class="fact"><b>' + ready + "</b><span>комплектов</span></div></div>";

  h += '<div class="note"><b>Готово ' + ready + " из " + D.lessons.length +
    ".</b> Открывайте занятие — техкарта и слайды читаются прямо здесь. " +
    "Файлы .docx и .pptx лежат в проекте, со страницы они не скачиваются.</div>";

  h += '<div class="seek"><input type="search" id="q" ' +
    'placeholder="Поиск: оборачиваемость, ABC, OTIF" value="' +
    esc(state.q) + '"></div>';
  h += '<div class="chips">' +
    ['', '1', '2'].map(function(s){
      var label = s === "" ? "Все семестры" : "Семестр " + s;
      return '<button data-sem="' + s + '"' +
        (state.sem === s ? ' class="on"' : "") + ">" + label + "</button>";
    }).join("") + "</div>";
  h += '<p class="tally" id="tally"></p><div id="rows"></div>';

  h += '<div class="foot">Страница собирается командой ' +
    "<code>python scripts/build_mobile.py</code> из файлов проекта. " +
    "Формулировки компетенций — по ФГОС СПО " + esc(D.standard.code || "") +
    " (" + esc(D.standard.order || "") + ").</div>";

  view.innerHTML = h;
  barName.innerHTML = "Материалы МДК.04.02<small>" + esc(d.group) + "</small>";
  back.classList.remove("on");

  var input = document.getElementById("q");
  input.addEventListener("input", function(){
    state.q = input.value; paintRows();
  });
  Array.prototype.forEach.call(view.querySelectorAll(".chips button"),
    function(b){
      b.addEventListener("click", function(){
        state.sem = b.dataset.sem;
        Array.prototype.forEach.call(view.querySelectorAll(".chips button"),
          function(x){ x.classList.toggle("on", x === b); });
        paintRows();
      });
    });
  paintRows();
}

function paintRows(){
  var box = document.getElementById("rows");
  var tally = document.getElementById("tally");
  if (!box) return;
  var q = state.q.toLowerCase().trim();
  var terms = q ? q.split(/\s+/) : [];
  var list = D.lessons.filter(function(l){
    if (state.sem && String(l.semester) !== state.sem) return false;
    if (!q) return true;
    var hay = [l.topic, l.section, l.theory, l.task,
      (l.keywords || []).join(" "), String(l.n)].join(" ").toLowerCase();
    return terms.every(function(t){ return hay.indexOf(t) !== -1; });
  });

  tally.textContent = "Показано занятий: " + list.length + " из " +
    D.lessons.length;

  if (!list.length){
    box.innerHTML = '<p class="blank">Ничего не найдено. ' +
      "Попробуйте другое слово — например «запасы» или «склад».</p>";
    return;
  }

  var h = "", section = null;
  list.forEach(function(l){
    if (l.section !== section){
      section = l.section;
      h += '<p class="sect">' + esc(section) + "</p><div class='list'>";
    }
    var tags = (l.ready ? '<span class="tag ok">комплект готов</span>'
                        : '<span class="tag wait">не собрано</span>') +
      (l.checkpoint ? '<span class="tag kt">' + esc(l.checkpoint) +
        "</span>" : "");
    h += "<button class='row'" + (l.ready ? "" : " disabled") +
      " data-n='" + l.n + "'>" +
      "<span class='num'>" + l.n + "</span><span class='body'>" +
      "<span class='t'>" + mark(l.topic, terms) + "</span>" +
      "<span class='m'>семестр " + l.semester + " · " + l.hours + " ч" +
      (l.slides && l.slides.length ? " · слайдов " + l.slides.length : "") +
      "</span>" + tags + "</span></button>";
    h += "";
  });
  box.innerHTML = h + "</div>";

  Array.prototype.forEach.call(box.querySelectorAll(".row:not([disabled])"),
    function(b){
      b.addEventListener("click", function(){ go("#/lesson/" + b.dataset.n); });
    });
}

/* --- занятие --- */
function renderLesson(n){
  var l = D.lessons.filter(function(x){ return x.n === n; })[0];
  if (!l || !l.ready){ go("#/course"); return; }

  var h = '<div class="hero"><h1>Занятие ' + l.n + ". " + esc(l.topic) +
    '</h1><p class="sub">' + esc(l.section) + " · семестр " + l.semester +
    " · " + l.hours + " ак. ч (" + (l.hours * 45) + " мин)" +
    (l.checkpoint ? " · " + esc(l.checkpoint) : "") + "</p></div>";

  if (l.slides && l.slides.length){
    h += '<h2 class="head">Презентация · ' + l.slides.length + " слайдов</h2>";
    h += '<p class="lead">Листайте в сторону, коснитесь слайда — откроется ' +
      "во весь экран. Это предпросмотр вёрстки: шрифты подставлены " +
      "системные, в PowerPoint переносы строк могут отличаться.</p>";
    h += '<div class="deck"><div class="strip">';
    l.slides.forEach(function(src, i){
      h += "<figure><img src='" + src + "' alt='Слайд " + (i + 1) +
        "' data-i='" + i + "' loading='lazy'>" +
        "<figcaption>Слайд " + (i + 1) + " из " + l.slides.length +
        "</figcaption></figure>";
    });
    h += "</div></div>";
  }

  h += '<h2 class="head">Технологическая карта</h2>';
  h += '<dl class="kv"><dt>Тип занятия</dt><dd>' + esc(l.lesson_type) +
    "</dd>";
  if (l.goals){
    h += "<dt>Обучающая цель</dt><dd>" + esc(l.goals.teaching) + "</dd>" +
      "<dt>Развивающая цель</dt><dd>" + esc(l.goals.developing) + "</dd>" +
      "<dt>Воспитательная цель</dt><dd>" + esc(l.goals.upbringing) + "</dd>";
  }
  if (l.results && (l.results.know || l.results.can)){
    h += "<dt>Знать</dt><dd>" + esc(l.results.know) + "</dd>" +
      "<dt>Уметь</dt><dd>" + esc(l.results.can) + "</dd>";
  }
  h += "</dl>";

  if (l.competencies && l.competencies.length){
    h += '<h3 class="sub">Формируемые компетенции</h3><div class="comp">';
    l.competencies.forEach(function(c){
      h += "<div><b>" + esc(c.code) + "</b>" + esc(c.text) +
        (c.flag ? ' <em>· сверить формулировку с РП</em>' : "") + "</div>";
    });
    h += "</div>";
  }

  if (l.equipment && l.equipment.length){
    h += '<h3 class="sub">Оснащение</h3><ul class="tidy">' +
      l.equipment.map(function(e){ return "<li>" + esc(e) + "</li>"; })
        .join("") + "</ul>";
  }

  if (l.stages && l.stages.length){
    h += '<h2 class="head">Ход занятия</h2>';
    h += '<p class="lead">Теория 40–50 минут, далее практика по теории ' +
      "этого же занятия. Всего " + (l.hours * 45) + " мин.</p>";
    var blk = null;
    l.stages.forEach(function(s){
      if (s.blockTitle !== blk){
        blk = s.blockTitle;
        h += '<p class="sect">' + esc(blk) + "</p>";
      }
      h += '<div class="stage ' + esc(s.block) + '"><div class="hd"><b>' +
        esc(s.stage) + "</b><span>" + esc(s.time) + "</span></div>" +
        "<p><b>Преподаватель.</b> " + esc(s.teacher) + "</p>" +
        "<p><b>Студенты.</b> " + esc(s.student) + "</p></div>";
    });
  }

  if (l.homework){
    h += '<h2 class="head">Домашнее задание</h2><p class="lead">' +
      esc(l.homework.text) + "</p>";
    if (l.homework.bullets && l.homework.bullets.length){
      h += '<ul class="tidy">' + l.homework.bullets.map(function(b){
        return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>";
    }
  }

  if (l.practice){
    h += '<h2 class="head">Практическая часть</h2><dl class="kv">' +
      "<dt>Формат</dt><dd>" + esc(l.practice.kind) + "</dd>" +
      "<dt>Время</dt><dd>" + esc(l.practice.duration) + "</dd>" +
      "<dt>Форма работы</dt><dd>" + esc(l.practice.form) + "</dd>" +
      "<dt>Цель</dt><dd>" + esc(l.practice.goal) + "</dd></dl>" +
      '<div class="note">Условие с цифрами, порядок выполнения, критерии ' +
      "оценки и эталон решения — в файле практики. Эталон вынесен " +
      "отдельным разделом на последнюю страницу.</div>";
  }

  if (l.keywords && l.keywords.length){
    h += '<h2 class="head">Ключевые понятия</h2><p>' +
      l.keywords.map(function(k){
        return '<span class="tag kt">' + esc(k) + "</span>"; }).join("") +
      "</p>";
  }

  if (l.literature && l.literature.length){
    h += '<h2 class="head">Литература</h2><ol class="tidy">' +
      l.literature.map(function(x){ return "<li>" + esc(x) + "</li>"; })
        .join("") + "</ol>";
  }

  if (l.teacherNotes && l.teacherNotes.length){
    h += '<h2 class="head">Примечания преподавателю</h2><ul class="tidy">' +
      l.teacherNotes.map(function(x){ return "<li>" + esc(x) + "</li>"; })
        .join("") + "</ul>";
  }

  h += '<h2 class="head">Мои заметки</h2><p class="lead">Сохраняются ' +
    "в этом браузере на телефоне. В файлы проекта не попадают.</p>" +
    "<textarea id='notes' placeholder='Что сработало, что переделать, " +
    "сколько времени реально ушло…'></textarea>" +
    "<div class='saveline'><button type='button' id='wipe'>Очистить</button>" +
    "<span id='saved'></span></div>";

  if (l.files && l.files.length){
    h += '<div class="foot">Файлы комплекта в проекте: ' +
      l.files.map(function(f){ return "<code>" + esc(f) + "</code>"; })
        .join(", ") + "</div>";
  }

  view.innerHTML = h;
  barName.innerHTML = "Занятие " + l.n + "<small>" + esc(D.discipline.code) +
    "</small>";
  back.classList.add("on");
  window.scrollTo(0, 0);

  bindZoom(l);
  bindNotes(l.n);
}

/* --- слайд во весь экран --- */
function bindZoom(l){
  var zoom = document.getElementById("zoom");
  var zImg = document.getElementById("z-img");
  var zNum = document.getElementById("z-num");
  var i = 0;

  function show(k){
    i = (k + l.slides.length) % l.slides.length;
    zImg.src = l.slides[i];
    zNum.textContent = "Слайд " + (i + 1) + " из " + l.slides.length;
  }
  function open(k){ show(k); zoom.classList.add("on");
    document.body.style.overflow = "hidden"; }
  function close(){ zoom.classList.remove("on");
    document.body.style.overflow = ""; }

  Array.prototype.forEach.call(view.querySelectorAll(".strip img"),
    function(img){
      img.addEventListener("click", function(){ open(+img.dataset.i); });
    });
  document.getElementById("z-close").onclick = close;
  document.getElementById("z-prev").onclick = function(){ show(i - 1); };
  document.getElementById("z-next").onclick = function(){ show(i + 1); };
  zoom.onkeydown = null;
  document.onkeydown = function(e){
    if (!zoom.classList.contains("on")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(i - 1);
    if (e.key === "ArrowRight") show(i + 1);
  };
  var x0 = null;
  zoom.ontouchstart = function(e){ x0 = e.touches[0].clientX; };
  zoom.ontouchend = function(e){
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) show(dx < 0 ? i + 1 : i - 1);
    x0 = null;
  };
}

/* --- заметки --- */
function bindNotes(n){
  var area = document.getElementById("notes");
  var saved = document.getElementById("saved");
  var key = "mdk0402-notes-" + n;
  try { area.value = localStorage.getItem(key) || ""; } catch (e) {}
  var timer = null;
  function put(){
    try {
      localStorage.setItem(key, area.value);
      saved.textContent = "сохранено " +
        new Date().toLocaleTimeString("ru-RU");
      saved.className = "done";
    } catch (e) {
      saved.textContent = "браузер запретил сохранение на этой странице";
      saved.className = "";
    }
  }
  area.addEventListener("input", function(){
    saved.textContent = "…"; saved.className = "";
    clearTimeout(timer); timer = setTimeout(put, 500);
  });
  document.getElementById("wipe").addEventListener("click", function(){
    if (!confirm("Удалить заметки по этому занятию?")) return;
    area.value = ""; put();
  });
}

/* --- маршрутизация --- */
function route(){
  var m = /^#\/lesson\/(\d+)$/.exec(location.hash);
  if (m) renderLesson(+m[1]); else renderCourse();
}
back.addEventListener("click", function(){ go("#/course"); });
document.getElementById("top").addEventListener("click", function(){
  window.scrollTo({ top: 0, behavior: "smooth" });
});
window.addEventListener("hashchange", route);
route();
"""


def build_html(data: dict) -> str:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    d = data["discipline"]
    return f"""<title>Материалы МДК.04.02</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<style>{CSS}</style>

<header class="bar">
  <button class="back" id="back" aria-label="Назад к списку занятий">←</button>
  <div class="name" id="bar-name">Материалы {d['code']}</div>
  <button class="go" id="top" aria-label="Наверх">↑</button>
</header>

<main class="page" id="view"></main>

<div class="zoom" id="zoom" role="dialog" aria-label="Слайд во весь экран">
  <div class="z-top">
    <span id="z-num"></span>
    <button id="z-close" aria-label="Закрыть">✕</button>
  </div>
  <div class="z-body"><img id="z-img" alt="Слайд презентации"></div>
  <div class="z-nav">
    <button id="z-prev">← Назад</button>
    <button id="z-next">Вперёд →</button>
  </div>
</div>

<script>window.COURSE = {payload};</script>
<script>{JS}</script>
"""


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Сборка страницы материалов для телефона")
    ap.add_argument("--discipline", default="mdk-04-02")
    ap.add_argument("--scale", type=int, default=100,
                    help="плотность рендера слайдов, пикселей на дюйм")
    ap.add_argument("--max-width", type=int, default=1100,
                    help="максимальная ширина картинки слайда, пикселей")
    args = ap.parse_args()

    print(f"Дисциплина: {args.discipline}. Рендер слайдов…")
    data = collect(args.discipline, args.scale, args.max_width)
    html = build_html(data)

    paths.SITE.mkdir(parents=True, exist_ok=True)
    out = paths.SITE / "mobile.html"
    out.write_text(html, encoding="utf-8")

    size_mb = out.stat().st_size / 1024 / 1024
    ready = sum(1 for l in data["lessons"] if l["ready"])
    print(f"Занятий в плане: {len(data['lessons'])}, комплектов готово: {ready}")
    print(f"Слайдов встроено: {data['totalSlides']}")
    print(f"Файл: {out} ({size_mb:.2f} МБ)")
    if size_mb > 15:
        print("ВНИМАНИЕ: файл больше 15 МБ — уменьшите --scale или --max-width.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
