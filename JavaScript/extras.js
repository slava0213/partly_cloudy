/* Итог: кольцо оценки, опрос, открытка с цитатой, отзывы посетителей */
(function () {
  "use strict";
  var PC = window.PC, $ = PC.$, $$ = PC.$$;
  var C = 2 * Math.PI * 52;

  /* ---------- кольцо оценки ---------- */
  function ring() {
    var v = parseFloat(PC.plain("rating").replace(",", ".")) || 0, fg = $("#ringFg");
    fg.style.strokeDasharray = C.toFixed(1);
    fg.style.strokeDashoffset = (C * (1 - PC.clamp(v, 0, 10) / 10)).toFixed(1);
  }
  function watchRing() {
    var fg = $("#ringFg"); fg.style.strokeDasharray = C.toFixed(1); fg.style.strokeDashoffset = C.toFixed(1);
    if (!("IntersectionObserver" in window)) { ring(); return; }
    new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { ring(); ob.disconnect(); } }, { threshold: .4 }).observe($("#ring"));
  }

  /* ---------- опрос ---------- */
  var VOTES = "partly-cloudy-poll-v2", NAMES = { yes: "Да", part: "Частично", no: "Нет" };
  function renderPoll() {
    var d = PC.store.get(VOTES, { yes: 0, part: 0, no: 0, mine: null }), tot = d.yes + d.part + d.no, box = $("#pollBars"); box.innerHTML = "";
    ["yes", "part", "no"].forEach(function (k) {
      var p = tot ? Math.round(d[k] / tot * 100) : 0, row = document.createElement("div");
      row.className = "bar" + (d.mine === k ? " is-mine" : ""); row.innerHTML = "<span>" + NAMES[k] + "</span><i><b style='width:" + p + "%'></b></i><em>" + p + "%</em>";
      box.appendChild(row);
    });
    $$("[data-vote]").forEach(function (b) { b.setAttribute("aria-pressed", d.mine === b.getAttribute("data-vote") ? "true" : "false"); });
  }
  $$("[data-vote]").forEach(function (b) {
    b.addEventListener("click", function () {
      var d = PC.store.get(VOTES, { yes: 0, part: 0, no: 0, mine: null }), k = b.getAttribute("data-vote");
      if (d.mine) d[d.mine]--; d.mine = k; d[k]++; PC.store.set(VOTES, d); renderPoll();
    });
  });

  /* ---------- открытка с цитатой ---------- */
  var cv = $("#cardCanvas"), g = cv.getContext("2d"), style = "day";
  var PAL = { day: ["#cfdce8", "#e6e3e4", "#f2dfd0", "#3f566b"], sunset: ["#5f4c9c", "#ea8f7d", "#fbd9a2", "#fff7ef"], night: ["#1f2670", "#4a4aa8", "#c48cb6", "#ffffff"] };
  function wrap(t, w) {
    var words = t.split(/\s+/), lines = [], l = "";
    words.forEach(function (x) { var n = l ? l + " " + x : x; if (g.measureText(n).width > w && l) { lines.push(l); l = x; } else l = n; });
    if (l) lines.push(l); return lines;
  }
  function card() {
    var p = PAL[style], W = 1080, gr = g.createLinearGradient(0, 0, 0, W);
    gr.addColorStop(0, p[0]); gr.addColorStop(.6, p[1]); gr.addColorStop(1, p[2]); g.fillStyle = gr; g.fillRect(0, 0, W, W);
    g.fillStyle = "rgba(255,255,255,.35)"; [[170, 880, 120], [300, 900, 160], [520, 920, 190], [780, 890, 150], [930, 910, 110]].forEach(function (c) { g.beginPath(); g.arc(c[0], c[1], c[2], 0, 7); g.fill(); });
    g.fillStyle = p[3]; g.textAlign = "left"; g.textBaseline = "alphabetic";
    var q = PC.plain("quote"), size = q.length > 140 ? 46 : q.length > 90 ? 54 : 64, lines;
    do { g.font = "400 " + size + "px Comfortaa, Montserrat, Arial, sans-serif"; lines = wrap("«" + q + "»", 860); size -= 2; } while (lines.length * size * 1.35 > 600 && size > 28);
    var lh = size * 1.4, y = 140; lines.forEach(function (ln) { y += lh; g.fillText(ln, 110, y); });
    g.font = "500 34px Montserrat, Arial, sans-serif"; g.fillText(PC.plain("author"), 110, Math.min(y + 90, 760));
    g.font = "300 28px Montserrat, Arial, sans-serif"; g.globalAlpha = .7; g.fillText("Переменная облачность · моё мнение", 110, 1010); g.globalAlpha = 1;
  }
  $$("#cardStyles button").forEach(function (b) {
    b.addEventListener("click", function () { style = b.getAttribute("data-style"); $$("#cardStyles button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); card(); });
  });
  $("#cardSave").addEventListener("click", function () {
    cv.toBlob(function (bl) { var a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "moya-citata.png"; document.body.appendChild(a); a.click(); a.remove(); PC.toast("Открытка сохранена"); });
  });
  $("#copyQuote").addEventListener("click", function () {
    var t = "«" + PC.plain("quote") + "» — " + PC.plain("author");
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { PC.toast("Цитата скопирована"); }, function () { PC.toast("Скопируйте вручную: выделите текст"); });
  });

  /* ---------- отзывы посетителей ---------- */
  var TK = "partly-cloudy-talk-v2", mood = "☁️";
  function renderTalk() {
    var list = PC.store.get(TK, []), box = $("#talkList"); box.innerHTML = "";
    if (!list.length) { var e = document.createElement("li"); e.className = "talk__empty"; e.textContent = "Пока пусто. Напишите первый отзыв — он появится здесь облачком."; box.appendChild(e); return; }
    list.slice().reverse().forEach(function (r, n) {
      var li = document.createElement("li"), id = list.length - 1 - n; li.style.setProperty("--d", (n % 5) * .6 + "s");
      var m = document.createElement("span"); m.className = "talk__mood"; m.textContent = r.mood;
      var p = document.createElement("p"); p.textContent = r.text; var nm = document.createElement("strong"); nm.textContent = r.name;
      var x = document.createElement("button"); x.type = "button"; x.className = "link-btn"; x.textContent = "Удалить"; x.addEventListener("click", function () { list.splice(id, 1); PC.store.set(TK, list); renderTalk(); });
      li.appendChild(m); li.appendChild(p); li.appendChild(nm); li.appendChild(x); box.appendChild(li);
    });
  }
  $$("#moods button").forEach(function (b) {
    b.addEventListener("click", function () { mood = b.getAttribute("data-mood"); $$("#moods button").forEach(function (x) { x.setAttribute("aria-checked", x === b ? "true" : "false"); }); });
  });
  $("#talkForm").addEventListener("submit", function (e) {
    e.preventDefault(); var n = $("#talkName").value.trim(), t = $("#talkText").value.trim(); if (!n || !t) return;
    var list = PC.store.get(TK, []); list.push({ name: n, text: t, mood: mood }); PC.store.set(TK, list.slice(-50));
    $("#talkText").value = ""; renderTalk(); PC.toast("Отзыв добавлен"); PC.pop(mood, innerWidth / 2, innerHeight / 2);
  });

  PC.on("text", function (k) { if (k === "*" || k === "rating") ring(); if (k === "*" || k === "quote" || k === "author") card(); });
  PC.initExtras = function () { watchRing(); renderPoll(); card(); renderTalk(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(card); };
})();
