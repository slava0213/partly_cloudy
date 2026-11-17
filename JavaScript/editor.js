/* Редактор текста прямо на странице + экспорт content.js */
(function () {
  "use strict";
  var PC = window.PC, $ = PC.$, $$ = PC.$$;
  var bar = $("#toolbar"), tgl = $("#editToggle");

  function setEditing(on) {
    document.body.classList.toggle("is-editing", on);
    tgl.setAttribute("aria-pressed", on ? "true" : "false");
    tgl.textContent = on ? "Закрыть редактор" : "Править текст";
    bar.hidden = !on;
    $$("[data-key]").forEach(function (el) { if (on) el.setAttribute("contenteditable", "true"); else el.removeAttribute("contenteditable"); });
    if (on) PC.toast("Нажмите на любой текст и редактируйте");
  }
  function onInput(e) {
    var el = e.target.closest && e.target.closest("[data-key]");
    if (!el) return;
    PC.edits[el.getAttribute("data-key")] = PC.sanitize(el.innerHTML);
    PC.saveEdits();
    PC.emit("text", el.getAttribute("data-key"));
  }
  function merged() {
    var c = JSON.parse(JSON.stringify(PC.content));
    Object.keys(c).forEach(function (k) { if (typeof c[k] === "string") c[k] = PC.valueFor(k); });
    c.reasons = c.reasons.map(function (_, i) { return PC.valueFor("reasons." + i); });
    c.scenes.forEach(function (s, i) { s.title = PC.valueFor("scenes." + i + ".title"); s.text = PC.valueFor("scenes." + i + ".text"); });
    return c;
  }
  function importText(txt) {
    var i = txt.indexOf("{"), j = txt.lastIndexOf("}"), obj;
    if (i < 0 || j < i) throw new Error("no object");
    var src = txt.slice(i, j + 1);
    try { obj = JSON.parse(src); } catch (e) { obj = new Function("return (" + src + ");")(); }
    var next = {};
    Object.keys(obj).forEach(function (k) { if (typeof obj[k] === "string") next[k] = obj[k]; });
    (obj.reasons || []).forEach(function (v, n) { next["reasons." + n] = String(v); });
    (obj.scenes || []).forEach(function (sc, n) { next["scenes." + n + ".title"] = String(sc.title || ""); next["scenes." + n + ".text"] = String(sc.text || ""); });
    PC.edits = next; PC.saveEdits(); PC.fillAll(); PC.emit("text", "*");
  }
  document.addEventListener("input", onInput);
  document.addEventListener("paste", function (e) {
    if (!document.body.classList.contains("is-editing") || !(e.target.closest && e.target.closest("[data-key]"))) return;
    e.preventDefault();
    document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain"));
  });
  tgl.addEventListener("click", function () { setEditing(!document.body.classList.contains("is-editing")); });
  $("#tbDone").addEventListener("click", function () { setEditing(false); PC.toast(PC.saveEdits() ? "Сохранено в этом браузере" : "Не удалось сохранить"); });
  bar.addEventListener("mousedown", function (e) { if (e.target.tagName !== "SELECT" && e.target.tagName !== "INPUT") e.preventDefault(); });
  $$("[data-cmd]", bar).forEach(function (b) {
    b.addEventListener("click", function () {
      document.execCommand(b.getAttribute("data-cmd"), false, null);
      var a = document.activeElement; if (a && a.closest && a.closest("[data-key]")) onInput({ target: a });
    });
  });
  $("#tbSize").addEventListener("change", function (e) { if (e.target.value) document.execCommand("fontSize", false, e.target.value); e.target.value = ""; });
  $("#tbColor").addEventListener("input", function (e) { document.execCommand("foreColor", false, e.target.value); });
  $("#tbImport").addEventListener("click", function () { $("#tbFile").click(); });
  $("#tbFile").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () { try { importText(String(r.result)); PC.toast("Тексты загружены из файла"); } catch (err) { PC.toast("Не получилось прочитать файл"); } };
    r.readAsText(f, "utf-8"); e.target.value = "";
  });
  $("#tbExport").addEventListener("click", function () {
    var txt = "/* Тексты сайта. Положите этот файл в папку JavaScript вместо старого content.js */\nwindow.SITE_CONTENT = " + JSON.stringify(merged(), null, 2) + ";\n";
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/javascript;charset=utf-8" })); a.download = "content.js";
    document.body.appendChild(a); a.click(); a.remove(); PC.toast("Файл content.js скачан");
  });
  $("#tbReset").addEventListener("click", function () {
    if (!confirm("Вернуть все тексты к значениям из content.js?")) return;
    PC.edits = {}; try { localStorage.removeItem("partly-cloudy-edits-v1"); } catch (e) {}
    PC.fillAll(); PC.emit("text", "*"); PC.toast("Тексты сброшены");
  });
})();
