/* Ядро: общий объект PC, тексты из content.js и правки пользователя */
(function () {
  "use strict";
  var PC = window.PC = {};
  PC.content = window.SITE_CONTENT;
  PC.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  PC.$ = function (s, r) { return (r || document).querySelector(s); };
  PC.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  PC.rand = function (a, b) { return a + Math.random() * (b - a); };
  PC.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  PC.store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  var handlers = {};
  PC.on = function (n, f) { (handlers[n] = handlers[n] || []).push(f); };
  PC.emit = function (n, d) { (handlers[n] || []).forEach(function (f) { f(d); }); };

  var EKEY = "partly-cloudy-edits-v1";
  PC.edits = PC.store.get(EKEY, {});
  PC.saveEdits = function () { return PC.store.set(EKEY, PC.edits); };
  PC.defaultFor = function (key) {
    var node = PC.content, p = key.split(".");
    for (var i = 0; i < p.length; i++) { if (node == null) return ""; node = node[p[i]]; }
    return node == null ? "" : String(node);
  };
  PC.valueFor = function (key) { return Object.prototype.hasOwnProperty.call(PC.edits, key) ? PC.edits[key] : PC.defaultFor(key); };
  PC.plain = function (key) { var d = document.createElement("div"); d.innerHTML = PC.sanitize(PC.valueFor(key)); return d.textContent.trim(); };

  var OK = { B: 1, I: 1, U: 1, STRONG: 1, EM: 1, BR: 1, FONT: 1, SPAN: 1, DIV: 1, P: 1 };
  PC.sanitize = function (html) {
    var doc = new DOMParser().parseFromString("<body>" + html + "</body>", "text/html");
    (function clean(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) return;
        if (c.nodeType !== 1 || !OK[c.tagName]) { n.removeChild(c); return; }
        Array.prototype.slice.call(c.attributes).forEach(function (a) {
          var nm = a.name.toLowerCase();
          if (nm === "style") c.setAttribute("style", a.value.split(";").filter(function (r) { return /^\s*(text-align|color)\s*:\s*[#\w(),.\s%-]+$/i.test(r); }).join(";"));
          else if (!(c.tagName === "FONT" && (nm === "color" || nm === "size"))) c.removeAttribute(a.name);
        });
        clean(c);
      });
    })(doc.body);
    return doc.body.innerHTML;
  };
  PC.fill = function (el) { el.innerHTML = PC.sanitize(PC.valueFor(el.getAttribute("data-key"))); };
  PC.fillAll = function () {
    PC.$$("[data-key]").forEach(function (el) { if (!/^scene(Title|Text)$/.test(el.getAttribute("data-key"))) PC.fill(el); });
  };
  var tt;
  PC.toast = function (m) {
    var t = PC.$("#toast"); t.textContent = m; t.classList.add("is-on");
    clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("is-on"); }, 2200);
  };
  PC.pop = function (txt, x, y) {
    var e = document.createElement("span"); e.className = "pop"; e.textContent = txt;
    e.style.left = x + "px"; e.style.top = y + "px"; document.body.appendChild(e);
    var a = e.animate([{ transform: "translate(-50%,0) scale(.6)", opacity: 1 }, { transform: "translate(-50%,-70px) scale(1.2)", opacity: 0 }], { duration: 1100, easing: "ease-out" });
    a.onfinish = function () { e.remove(); };
  };
})();
