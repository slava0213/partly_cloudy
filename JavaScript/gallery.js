/* Фрагменты: сетка гифок, фильтры, просмотр с эффектами, избранное, слайд-шоу */
(function () {
  "use strict";
  var PC = window.PC, $ = PC.$, $$ = PC.$$, scenes = PC.content.scenes;
  var MOODS = [["all", "Все"], ["warm", "Тепло"], ["humor", "Юмор"], ["anxiety", "Тревога"], ["climax", "Кульминация"], ["fav", "Любимые"]];
  var MOOD_NAME = { warm: "Тепло", humor: "Юмор", anxiety: "Тревога", climax: "Кульминация" };
  var favs = PC.store.get("partly-cloudy-favs-v2", []), stars = PC.store.get("partly-cloudy-stars-v2", {}), reacts = PC.store.get("partly-cloudy-react-v2", {});
  var mood = "all", cur = -1, playing = true, slide = false, boltT;
  var lb = $("#lightbox"), img = $("#lbImg"), fxBox = $("#lbFx"), opener = null;

  function visible() {
    var r = []; scenes.forEach(function (s, i) { if (mood === "all" || (mood === "fav" ? favs.indexOf(i) > -1 : s.mood === mood)) r.push(i); }); return r;
  }
  /* ---------- сетка ---------- */
  function buildFilters() {
    var box = $("#filters");
    MOODS.forEach(function (m) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = m[1]; b.setAttribute("data-m", m[0]); b.setAttribute("aria-pressed", m[0] === mood ? "true" : "false");
      b.addEventListener("click", function () { mood = m[0]; $$("button", box).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); renderGrid(); });
      box.appendChild(b);
    });
  }
  function renderGrid() {
    var g = $("#grid"); g.innerHTML = ""; var v = visible(); $("#empty").hidden = v.length > 0;
    v.forEach(function (i) {
      var s = scenes[i], li = document.createElement("li"), open = document.createElement("button"), im = new Image(), t = document.createElement("span"), h = document.createElement("button");
      open.type = "button"; open.className = "gcard"; im.src = s.poster; im.alt = ""; im.loading = "lazy"; im.width = 360; im.height = 202;
      t.className = "gcard__t"; t.innerHTML = PC.sanitize(PC.valueFor("scenes." + i + ".title"));
      open.appendChild(im); open.appendChild(t);
      var on = function () { im.src = s.gif; }, off = function () { im.src = s.poster; };
      open.addEventListener("mouseenter", on); open.addEventListener("focus", on); open.addEventListener("mouseleave", off); open.addEventListener("blur", off);
      open.addEventListener("click", function () { opener = open; openLb(i); });
      h.type = "button"; h.className = "gcard__fav"; h.textContent = "♥"; h.setAttribute("aria-label", "В любимые"); h.setAttribute("aria-pressed", favs.indexOf(i) > -1 ? "true" : "false");
      h.addEventListener("click", function () { toggleFav(i); h.setAttribute("aria-pressed", favs.indexOf(i) > -1 ? "true" : "false"); if (mood === "fav") renderGrid(); });
      li.appendChild(open); li.appendChild(h); g.appendChild(li);
    });
  }
  function toggleFav(i) { var k = favs.indexOf(i); if (k > -1) favs.splice(k, 1); else favs.push(i); PC.store.set("partly-cloudy-favs-v2", favs); if (cur === i) syncFav(); }
  function syncFav() { $("#lbFav").setAttribute("aria-pressed", favs.indexOf(cur) > -1 ? "true" : "false"); }

  /* ---------- просмотр ---------- */
  function openLb(i) {
    var first = lb.hidden; cur = i; var s = scenes[i];
    $("#lbTitle").setAttribute("data-key", "scenes." + i + ".title"); $("#lbText").setAttribute("data-key", "scenes." + i + ".text");
    PC.fill($("#lbTitle")); PC.fill($("#lbText"));
    if (document.body.classList.contains("is-editing")) { $("#lbTitle").setAttribute("contenteditable", "true"); $("#lbText").setAttribute("contenteditable", "true"); }
    img.alt = "Фрагмент фильма: " + $("#lbTitle").textContent; img.src = playing ? s.gif : s.poster;
    var v = visible(); $("#lbCount").textContent = "Фрагмент " + (i + 1) + " из " + scenes.length;
    $("#lbTags").innerHTML = ""; [MOOD_NAME[s.mood]].concat(s.fx.map(function (f) { return { rain: "дождь", lightning: "молния", sparks: "искры", glow: "сияние" }[f]; })).forEach(function (t) {
      if (!t) return; var e = document.createElement("span"); e.textContent = t; $("#lbTags").appendChild(e);
    });
    $("#lbPlay").setAttribute("aria-pressed", playing ? "true" : "false"); $("#lbPlay").textContent = playing ? "Пауза" : "Играть"; syncFav();
    buildStars(); buildReact(); buildFx(s.fx);
    if (slide) startSlide();
    lb.hidden = false; document.body.style.overflow = "hidden"; if (first) $("#lbClose").focus();
    history.replaceState(null, "", "#f" + (i + 1));
  }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ""; clearInterval(boltT); stopSlide(); history.replaceState(null, "", location.pathname + location.search); if (opener) opener.focus(); }
  function step(d) { var v = visible(); if (!v.length) return; var k = v.indexOf(cur); k = k < 0 ? 0 : (k + d + v.length) % v.length; openLb(v[k]); }

  function buildStars() {
    var box = $("#lbStars"); box.innerHTML = ""; var n = stars[cur] || 0;
    for (var k = 1; k <= 5; k++) (function (k) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", k === n ? "true" : "false"); b.setAttribute("aria-label", k + " из 5");
      b.textContent = k <= n ? "★" : "☆"; b.addEventListener("click", function () { stars[cur] = k; PC.store.set("partly-cloudy-stars-v2", stars); buildStars(); }); box.appendChild(b);
    })(k);
  }
  function buildReact() {
    var box = $("#lbReact"); box.innerHTML = ""; var r = reacts[cur] = reacts[cur] || {};
    ["☁️", "💗", "😂", "⚡"].forEach(function (e) {
      var b = document.createElement("button"); b.type = "button"; b.innerHTML = e + " <b>" + (r[e] || 0) + "</b>"; b.setAttribute("aria-label", "Реакция " + e);
      b.addEventListener("click", function (ev) { r[e] = (r[e] || 0) + 1; PC.store.set("partly-cloudy-react-v2", reacts); b.lastChild.textContent = r[e]; PC.pop(e, ev.clientX, ev.clientY); });
      box.appendChild(b);
    });
  }
  /* эффекты поверх фрагмента */
  function buildFx(list) {
    fxBox.innerHTML = ""; clearInterval(boltT); fxBox.className = "lightbox__fx";
    if (PC.reduceMotion) return;
    list.forEach(function (f) {
      var i, e;
      if (f === "rain") for (i = 0; i < 70; i++) { e = document.createElement("i"); e.className = "fx-drop"; e.style.cssText = "left:" + (Math.random() * 100) + "%;animation-delay:-" + (Math.random() * 1.2).toFixed(2) + "s;animation-duration:" + (.6 + Math.random() * .5).toFixed(2) + "s"; fxBox.appendChild(e); }
      if (f === "sparks") for (i = 0; i < 28; i++) { e = document.createElement("i"); e.className = "fx-spark"; e.style.cssText = "left:" + (Math.random() * 100) + "%;top:" + (Math.random() * 100) + "%;animation-delay:-" + (Math.random() * 4).toFixed(2) + "s;animation-duration:" + (2 + Math.random() * 3).toFixed(2) + "s"; fxBox.appendChild(e); }
      if (f === "glow") fxBox.classList.add("has-glow");
      if (f === "lightning") boltT = setInterval(function () { fxBox.classList.remove("is-bolt"); void fxBox.offsetWidth; fxBox.classList.add("is-bolt"); }, 3800);
    });
  }
  /* слайд-шоу */
  function startSlide() { var b = $("#lbSlide"); b.classList.remove("is-run"); void b.offsetWidth; b.classList.add("is-run"); }
  function stopSlide() { $("#lbSlide").classList.remove("is-run"); }
  $("#lbSlide").addEventListener("animationend", function () { if (slide) step(1); });
  $("#lbSlideBtn").addEventListener("click", function () { slide = !slide; this.setAttribute("aria-pressed", slide ? "true" : "false"); if (slide) startSlide(); else stopSlide(); });
  $("#lbPlay").addEventListener("click", function () { playing = !playing; openLb(cur); });
  $("#lbFav").addEventListener("click", function () { toggleFav(cur); renderGrid(); });
  $("#lbLink").addEventListener("click", function () {
    var u = location.href.split("#")[0] + "#f" + (cur + 1);
    (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { PC.toast("Ссылка скопирована"); }, function () { PC.toast(u); });
  });
  $("#lbPrev").addEventListener("click", function () { step(-1); }); $("#lbNext").addEventListener("click", function () { step(1); });
  $("#lbClose").addEventListener("click", closeLb); lb.addEventListener("click", function (e) { if (e.target === lb || e.target === fxBox) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden || (e.target.closest && e.target.closest("[contenteditable]"))) return;
    if (e.key === "Escape") closeLb(); else if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === " " && e.target.tagName !== "BUTTON") { e.preventDefault(); $("#lbPlay").click(); }
  });
  PC.on("text", function (k) { if (/^scenes\./.test(k) || k === "*") renderGrid(); });

  PC.initGallery = function () {
    buildFilters(); renderGrid();
    var m = /^#f(\d+)$/.exec(location.hash); if (m && scenes[m[1] - 1]) openLb(m[1] - 1);
  };
})();
