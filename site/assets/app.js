// Скрипты сайта материалов. Работают из file:// без интернета.
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
