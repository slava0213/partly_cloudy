/* Небо: темы, облака (двигаются и реагируют на курсор), покадровые аисты, Пик, Гас, дождь, гроза */
(function () {
  "use strict";
  var PC = window.PC, $ = PC.$, $$ = PC.$$, rand = PC.rand;
  var body = document.body, hero = $("#hero");
  var S = PC.store.get("partly-cloudy-sky-v3", { theme: "auto", wind: 1, storks: 6, rain: false, storm: false, trail: false, sound: false });
  function save() { PC.store.set("partly-cloudy-sky-v3", S); }
  var anims = [];                      // все дрейфующие элементы (для скорости ветра)

  /* ---------- тема ---------- */
  function themeNow() {
    if (S.theme !== "auto") return S.theme;
    var h = new Date().getHours();
    return h < 6 ? "night" : h < 11 ? "morning" : h < 17 ? "day" : h < 21 ? "sunset" : "night";
  }
  function applyTheme() {
    body.setAttribute("data-theme", themeNow());
    $$("#themeSeg button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-theme") === S.theme ? "true" : "false"); });
  }

  /* ---------- дрейф через Web Animations ---------- */
  function drift(el, dur, from, to) {
    var a = el.animate([{ transform: "translateX(" + from + "px)" }, { transform: "translateX(" + to + "px)" }],
      { duration: dur * 1000, iterations: Infinity, delay: -rand(0, dur) * 1000 });
    if (PC.reduceMotion) a.pause();
    a.playbackRate = S.wind; anims.push(a); return a;
  }
  function setWind(v) { S.wind = v; anims.forEach(function (a) { a.playbackRate = v; }); save(); }

  /* ---------- облака ---------- */
  var clouds = [];
  function makeCloud(layer, cls, o) {
    var vw = innerWidth, small = vw < 700;
    var w = Math.max(small ? 200 : 260, vw * rand(o.w[0], o.w[1]) / 100 * (small ? 1.5 : 1));
    var el = document.createElement("div");
    el.className = "cloud " + cls;
    el.style[o.bottom ? "bottom" : "top"] = rand(o.pos[0], o.pos[1]).toFixed(1) + "%";
    el.style.width = w.toFixed(0) + "px";
    var img = new Image(); img.alt = ""; img.draggable = false;
    img.src = "../images/clouds/cloud" + (1 + Math.floor(Math.random() * 6)) + ".png";
    if (Math.random() < .5) img.style.scale = "-1 1";
    el.appendChild(img); layer.appendChild(el);
    drift(el, rand(o.dur[0], o.dur[1]), -w, vw + 40);
    clouds.push({ el: el, img: img, x: 0, y: 0, push: o.push });
  }
  function buildClouds() {
    var i;
    for (i = 0; i < 5; i++) makeCloud($("#layerBack"), "cloud--back", { w: [16, 26], pos: [0, 55], dur: [220, 340], push: 10 });
    for (i = 0; i < 4; i++) makeCloud($("#layerMid"), "cloud--mid", { w: [20, 32], pos: [8, 66], dur: [150, 240], push: 24 });
    for (i = 0; i < 5; i++) makeCloud($("#layerFront"), "", { w: [28, 44], pos: [-14, -2], dur: [110, 190], bottom: true, push: 44 });
  }

  /* ---------- аисты: покадровый спрайт из 9 кадров ---------- */
  function stork(w, flap, far) {
    var s = document.createElement("div");
    s.className = "stork" + (far ? " stork--far" : "");
    s.style.cssText = "--w:" + w.toFixed(0) + "px;--flap:" + flap.toFixed(2) + "s;animation-delay:-" + rand(0, flap).toFixed(2) + "s;";
    var kid = new Image(); kid.className = "baby"; kid.alt = ""; kid.src = "../images/sprites/baby.png"; kid.style.animationDelay = "-" + rand(0, 2.4).toFixed(1) + "s"; s.appendChild(kid);
    return s;
  }
  var flocks = [];
  function buildStorks() {
    flocks.forEach(function (f) { f.remove(); }); flocks = [];
    anims = anims.filter(function (a) { return a.effect && a.effect.target && a.effect.target.isConnected; });
    var n = S.storks, i, k;
    for (i = 0; i < n; i++) {
      var far = i % 3 !== 2, size = far ? rand(70, 110) : rand(150, 220), cnt = far ? 2 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
      var fly = document.createElement("div"); fly.style.cssText = "position:absolute;left:0;top:" + rand(6, 56).toFixed(1) + "%;" + (far ? "opacity:.65;filter:blur(1px)" : "");
      var bob = document.createElement("div"); bob.style.animation = "bob " + rand(2.8, 4.6).toFixed(1) + "s ease-in-out infinite alternate";
      var flap = rand(.75, 1.05);
      for (k = 0; k < cnt; k++) {
        var st = stork(size * (1 - k * .06), flap * rand(.92, 1.08), far);
        if (k) { st.style.left = (-k * size * .6).toFixed(0) + "px"; st.style.top = ((k % 2 ? 1 : -1) * Math.ceil(k / 2) * size * .26).toFixed(0) + "px"; }
        bob.appendChild(st);
      }
      fly.appendChild(bob); $("#layerBirds").appendChild(fly); flocks.push(fly);
      drift(fly, far ? rand(70, 110) : rand(46, 72), -size * 2.5, innerWidth + size);
    }
  }
  var PECK = '<svg class="peck__svg" viewBox="0 0 340 240" aria-hidden="true">  <defs>    <linearGradient id="pw" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4e3f78"/><stop offset=".5" stop-color="#8a7bb0"/><stop offset="1" stop-color="#d6cfe6"/></linearGradient>    <linearGradient id="pb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf7fa"/><stop offset="1" stop-color="#c7bfd6"/></linearGradient>  </defs>  <g class="peck__legs" fill="none" stroke="#f08a3c" stroke-linecap="round"><path d="M92 150 L30 205 M100 153 L46 214" stroke-width="5"/><path d="M30 205 l-14 4 M30 205 l-6 10 M46 214 l-14 5 M46 214 l-5 9" stroke-width="3.5"/></g>  <g class="peck__wing peck__wing--back" opacity=".85"><path d="M150 108 C120 60 90 20 50 8 L60 30 L40 32 L64 52 L48 60 L78 78 L70 92 C100 100 130 110 150 108Z" fill="url(#pw)"/></g>  <path d="M64 118 L8 126 L14 138 L4 148 L68 142Z" fill="#4e3f78"/>  <ellipse cx="135" cy="128" rx="78" ry="32" transform="rotate(-8 135 128)" fill="url(#pb)"/>  <g class="peck__head">    <path d="M190 114 C222 106 236 86 240 66" stroke="#f3eef6" stroke-width="20" fill="none" stroke-linecap="round"/>    <circle cx="246" cy="60" r="21" fill="#f6f1f7"/>    <path d="M236 42 L232 26 M244 40 L246 22 M252 41 L260 26" stroke="#e8dfef" stroke-width="4" stroke-linecap="round"/>    <path d="M262 56 L334 92 L262 74Z" fill="#f08a3c"/><path d="M262 68 L334 92 L262 74Z" fill="#d9682a"/>    <circle cx="254" cy="54" r="10" fill="#fff" stroke="#6b5a7a" stroke-width="1.5"/><circle cx="257" cy="56" r="4.5" fill="#222"/>  </g>  <g class="peck__wing peck__wing--front"><path d="M150 118 C126 64 100 22 56 4 L70 28 L46 28 L72 50 L56 58 L84 76 L78 92 C108 104 134 116 150 118Z" fill="url(#pw)"/><path d="M56 4 L70 28 L46 28 L72 50 L56 58 L84 76 L78 92 L60 70 Z" fill="#3d2f63" opacity=".5"/></g></svg><img class="baby" src="../images/sprites/baby.png" alt="">';
  function buildPeck() {
    var layer = $("#layerPeck"), w = Math.max(220, Math.min(340, innerWidth * .24));
    var fly = document.createElement("div"); fly.style.cssText = "position:absolute;left:0;top:16%;";
    var st = document.createElement("div"); st.className = "peck"; st.style.setProperty("--w", w + "px"); st.innerHTML = PECK;
    st.setAttribute("role", "button"); st.setAttribute("tabindex", "0"); st.setAttribute("aria-label", "Пик, аист-курьер. Нажмите, чтобы он уронил малыша");
    function poke() {
      if (st.classList.contains("is-excited")) return;
      var b = $(".baby", st); st.classList.add("is-excited"); b.classList.add("is-falling");
      var r = st.getBoundingClientRect(); ["💗", "☁️", "⚡"].forEach(function (e, i) { setTimeout(function () { PC.pop(e, r.left + r.width * .95, r.top + r.height * .5); }, i * 160); });
      setTimeout(function () { b.classList.remove("is-falling"); st.classList.remove("is-excited"); }, 3200);
    }
    st.addEventListener("click", poke); st.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); poke(); } });
    var bob = document.createElement("div"); bob.style.animation = "bob 3.4s ease-in-out infinite alternate";
    bob.appendChild(st); fly.appendChild(bob); layer.appendChild(fly);
    PC.peckAnim = drift(fly, 60, -w * 1.6, innerWidth + w * .4);
  }

  /* ---------- звёзды ---------- */
  function buildStars() {
    var box = $("#stars"), f = document.createDocumentFragment();
    for (var i = 0; i < 90; i++) {
      var s = document.createElement("i"); s.className = "star";
      s.style.cssText = "left:" + rand(0, 100).toFixed(1) + "%;top:" + rand(0, 70).toFixed(1) + "%;--t:" + rand(2, 5).toFixed(1) + "s;--d:-" + rand(0, 5).toFixed(1) + "s;transform:scale(" + rand(.5, 1.2).toFixed(2) + ")";
      f.appendChild(s);
    }
    box.appendChild(f);
  }

  /* ---------- параллакс + отталкивание облаков курсором ---------- */
  var mx = 0, my = 0, px = innerWidth / 2, py = innerHeight / 2, cx = 0, cy = 0, layers = $$(".layer[data-depth]");
  addEventListener("pointermove", function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; px = e.clientX; py = e.clientY; }, { passive: true });
  function loop() {
    cx += (mx - cx) * .06; cy += (my - cy) * .06;
    var sy = scrollY;
    layers.forEach(function (l) {
      var d = +l.getAttribute("data-depth");
      l.style.transform = "translate3d(" + (-cx * d).toFixed(1) + "px," + (-cy * d * .6 - sy * d / 3600).toFixed(1) + "px,0)";
    });
    if (!PC.reduceMotion && sy < innerHeight * 1.2) clouds.forEach(function (c) {
      var r = c.el.getBoundingClientRect(), dx = r.left + r.width / 2 - px, dy = r.top + r.height / 2 - py, d = Math.hypot(dx, dy) || 1, R = 340;
      var f = d < R ? (1 - d / R) : 0, tx = dx / d * f * c.push * 2.4, ty = dy / d * f * c.push * 1.2;
      c.x += (tx - c.x) * .08; c.y += (ty - c.y) * .08;
      c.img.style.translate = c.x.toFixed(1) + "px " + c.y.toFixed(1) + "px";
    });
    requestAnimationFrame(loop);
  }

  /* ---------- Гас ---------- */
  var gus = $("#gus"), bubble = $("#gusBubble"), SAY = ["Эй, только не щекотать!", "Опять аист без жалоб…", "Лепить малышей — это искусство.", "Осторожно: зубы!", "Пик, ты где?", "Я не злюсь. Я набираю грозу."];
  function say(t) { bubble.textContent = t; bubble.classList.add("is-on"); clearTimeout(say.t); say.t = setTimeout(function () { bubble.classList.remove("is-on"); }, 2600); }
  gus.addEventListener("click", function () {
    gus.classList.add("is-angry"); say(SAY[Math.floor(Math.random() * SAY.length)]);
    setTimeout(function () { gus.classList.remove("is-angry"); }, 1500);
    if (Math.random() < .5) lightning();
    var r = gus.getBoundingClientRect(); PC.pop("☁️", r.left + r.width / 2, r.top);
  });
  var pup = $$(".pupil", gus);
  addEventListener("pointermove", function (e) {
    var r = gus.getBoundingClientRect(), a = Math.atan2(e.clientY - (r.top + r.height * .35), e.clientX - (r.left + r.width / 2)), d = 4;
    pup.forEach(function (p) { p.setAttribute("cx", (+p.getAttribute("data-cx") + Math.cos(a) * d).toFixed(1)); p.setAttribute("cy", (+p.getAttribute("data-cy") + Math.sin(a) * d).toFixed(1)); });
  }, { passive: true });
  setInterval(function () { gus.classList.add("is-blink"); setTimeout(function () { gus.classList.remove("is-blink"); }, 140); }, 3600);

  /* ---------- дождь и молния ---------- */
  var cv = $("#rain"), ctx = cv.getContext("2d"), drops = [], rafR = 0;
  function sizeRain() { cv.width = hero.clientWidth; cv.height = hero.clientHeight; }
  function rainLoop() {
    ctx.clearRect(0, 0, cv.width, cv.height); ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.2; ctx.beginPath();
    drops.forEach(function (d) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 4, d.y + d.l); d.y += d.v; d.x -= 1.2; if (d.y > cv.height) { d.y = -20; d.x = rand(0, cv.width + 40); } });
    ctx.stroke(); rafR = requestAnimationFrame(rainLoop);
  }
  function setRain() {
    var on = S.rain || S.storm; cv.classList.toggle("is-on", on); cancelAnimationFrame(rafR);
    if (on) { sizeRain(); drops = []; for (var i = 0; i < (S.storm ? 220 : 120); i++) drops.push({ x: rand(0, cv.width), y: rand(0, cv.height), l: rand(10, 22), v: rand(11, 20) }); rainLoop(); }
  }
  function lightning() {
    var f = $("#flash"), x = 100, y = 0, d = "M100 0";
    while (y < 400) { y += rand(30, 60); x += rand(-30, 30); d += " L" + x.toFixed(0) + " " + y.toFixed(0); }
    $("#bolt").setAttribute("d", d); f.style.justifyContent = ["flex-start", "center", "flex-end"][Math.floor(Math.random() * 3)];
    f.classList.remove("is-on"); void f.offsetWidth; f.classList.add("is-on"); thunder();
  }
  PC.lightning = lightning;
  var stormT;
  function setStorm() {
    body.classList.toggle("is-storm", S.storm); clearTimeout(stormT);
    (function next() { if (!S.storm) return; stormT = setTimeout(function () { lightning(); next(); }, rand(4000, 9000)); })();
    setRain();
  }

  /* ---------- звук: шум дождя и гром ---------- */
  var ac, noise, gain;
  function audio() {
    if (ac) return ac; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ac = new AC(); var len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noise = ac.createBufferSource(); noise.buffer = buf; noise.loop = true;
    var f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1400; gain = ac.createGain(); gain.gain.value = 0;
    noise.connect(f); f.connect(gain); gain.connect(ac.destination); noise.start(); return ac;
  }
  function setSound() { if (S.sound && audio()) { ac.resume(); gain.gain.setTargetAtTime((S.rain || S.storm) ? .12 : .03, ac.currentTime, .4); } else if (gain) gain.gain.setTargetAtTime(0, ac.currentTime, .2); }
  function thunder() {
    if (!S.sound || !audio()) return; var o = ac.createBufferSource(); o.buffer = noise.buffer; var f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 220;
    var g = ac.createGain(); g.gain.setValueAtTime(.5, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + 2.6); o.connect(f); f.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 2.7);
  }

  /* ---------- облачный след ---------- */
  var last = 0;
  addEventListener("pointermove", function (e) {
    if (!S.trail || PC.reduceMotion || e.pointerType === "touch") return;
    var t = performance.now(); if (t - last < 60) return; last = t; PC.pop(Math.random() < .5 ? "☁️" : "✦", e.clientX + rand(-8, 8), e.clientY);
  }, { passive: true });

  /* ---------- панель, прогресс, «наверх» ---------- */
  function bindDock() {
    var btn = $("#dockBtn"), panel = $("#dockPanel");
    btn.addEventListener("click", function () { var o = panel.hidden; panel.hidden = !o; btn.setAttribute("aria-expanded", o ? "true" : "false"); });
    $$("#themeSeg button").forEach(function (b) { b.addEventListener("click", function () { S.theme = b.getAttribute("data-theme"); save(); applyTheme(); }); });
    var w = $("#fxWind"), s = $("#fxStorks"), chk = { fxRain: "rain", fxStorm: "storm", fxTrail: "trail", fxSound: "sound" };
    w.value = S.wind; s.value = S.storks;
    w.addEventListener("input", function () { setWind(+w.value); });
    s.addEventListener("change", function () { S.storks = +s.value; save(); buildStorks(); });
    Object.keys(chk).forEach(function (id) {
      var el = $("#" + id); el.checked = !!S[chk[id]];
      el.addEventListener("change", function () { S[chk[id]] = el.checked; save(); if (chk[id] === "storm") setStorm(); else if (chk[id] === "rain") setRain(); setSound(); });
    });
    $("#fxGust").addEventListener("click", function () {
      anims.forEach(function (a) { a.playbackRate = 10; }); setTimeout(function () { anims.forEach(function (a) { a.playbackRate = S.wind; }); }, 2200);
    });
  }
  var prog = $("#progress"), top = $("#toTop");
  addEventListener("scroll", function () {
    var m = document.documentElement.scrollHeight - innerHeight; prog.style.width = (m > 0 ? scrollY / m * 100 : 0) + "%"; top.hidden = scrollY < innerHeight * .8;
  }, { passive: true });
  top.addEventListener("click", function () { scrollTo({ top: 0, behavior: PC.reduceMotion ? "auto" : "smooth" }); });
  addEventListener("resize", function () { if (S.rain || S.storm) sizeRain(); });

  PC.initWorld = function () {
    applyTheme(); buildStars(); buildClouds(); buildStorks(); buildPeck(); bindDock(); setStorm(); setSound(); loop();
    $("#sceneCount") && ($("#sceneCount").textContent = PC.content.scenes.length);
  };
})();
