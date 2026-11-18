// ARTRA — motion and interaction.
(function () {
  "use strict";

  // Where commission requests are sent (the site has no server, so the form opens the visitor's email app).
  var ATELIER_EMAIL = ARTRA_ART.email; // set in art.js

  var NS = "http://www.w3.org/2000/svg";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var T = window.ARTRA_I18N, t = T.t;

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // ---- Ornament built in code: hero medallion rings, tray engraving, mirror shards ----
  function buildMedallion() {
    var dots = $("#ringDots"), petals = $("#ringPetals"), arcs = $("#ringArcs");
    if (!dots) return;
    for (var i = 0; i < 72; i++) {
      var a = (i / 72) * Math.PI * 2;
      el("circle", { cx: (Math.cos(a) * 180).toFixed(2), cy: (Math.sin(a) * 180).toFixed(2), r: i % 6 === 0 ? 3.2 : 1.4, fill: "url(#gGold)" }, dots);
    }
    for (var j = 0; j < 24; j++) {
      el("path", { d: "M0 -164 C10 -150 10 -134 0 -124 C-10 -134 -10 -150 0 -164 Z", fill: j % 2 ? "none" : "url(#gGold)",
        stroke: "url(#gGold)", "stroke-width": 1, transform: "rotate(" + j * 15 + ")", opacity: j % 2 ? 1 : .85 }, petals);
    }
    for (var k = 0; k < 16; k++) {
      el("path", { d: "M-18 -108 Q0 -86 18 -108", fill: "none", stroke: "url(#gGold)", "stroke-width": 1.4, transform: "rotate(" + k * 22.5 + ")" }, arcs);
      el("circle", { cx: 0, cy: -100, r: 2, fill: "url(#gGold)", transform: "rotate(" + (k * 22.5 + 11.25) + ")" }, arcs);
    }
  }

  ARTRA_ART.mount(document);
  buildMedallion();

  // ---- Header ----
  var top = $("#top"), burger = $("#burger"), nav = $("#nav");
  function onScroll() { top.classList.toggle("scrolled", scrollY > 30); }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  $$("#nav a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }); });

  // ---- Reveal on scroll, staggered within each group ----
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      revealIO.unobserve(e.target);
      var c = e.target.querySelector("[data-count]") ? e.target : null;
      if (c) countUp(c);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach(function (n) {
    var sibs = $$(".reveal", n.parentElement).filter(function (s) { return s.parentElement === n.parentElement; });
    n.style.setProperty("--delay", (sibs.indexOf(n) * 0.09).toFixed(2) + "s");
    revealIO.observe(n);
  });

  function countUp(scope) {
    $$("[data-count]", scope).forEach(function (n) {
      var end = +n.getAttribute("data-count"), t0 = null, dur = 1800;
      if (reduced) { n.textContent = end.toLocaleString(T.lang); return; }
      requestAnimationFrame(function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
        n.textContent = Math.round(end * eased).toLocaleString(T.lang);
        if (p < 1) requestAnimationFrame(step);
      });
    });
  }

  // ---- Pause looping SVG motion while off screen ----
  var pauseIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.target.classList.toggle("paused", !e.isIntersecting); });
  });
  $$(".art, .medallion").forEach(function (n) { pauseIO.observe(n); });

  // ---- 3D tilt and light that follow the pointer on each piece ----
  if (!reduced && matchMedia("(hover: hover)").matches) {
    $$(".piece").forEach(function (card) {
      card.addEventListener("pointermove", function (ev) {
        var r = card.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        card.style.setProperty("--ry", ((x - 0.5) * 10).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  // ---- Products (from products.js, which mirrors the ARTRA Product Detail form) ----
  var PRODUCTS = ARTRA_ART.products();
  var grid = $("#grid");
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  // An old #piece-<slug> link opens that piece's page.
  var old = location.hash.match(/^#piece-(.+)$/);
  if (old) location.replace("/piece?p=" + old[1]);

  // Fill each drawn card from its product, and add a photo card for any product without a drawing.
  PRODUCTS.forEach(function (p) {
    var card = $('.piece[data-piece="' + p.key + '"]');
    if (!card) {
      card = document.createElement("a");
      card.className = "piece reveal in";
      card.innerHTML = '<div class="piece-art piece-photo"></div><div class="piece-info"><span class="piece-craft"></span><h3></h3><span class="piece-meta"></span></div>';
      if (p.cutout || p.photo) {
        var img = new Image(); img.src = p.cutout || p.photo; if (p.cutout) $(".piece-art", card).classList.add("cutout"); img.alt = p.name; img.loading = "lazy";
        $(".piece-art", card).appendChild(img);
      }
      grid.appendChild(card);
    }
    card.setAttribute("data-piece", p.slug);
    card.href = p.url;
    $(".piece-craft", card).textContent = p.category || "";
    $("h3", card).textContent = p.name || "";
    $(".piece-meta", card).textContent = p.medium || "";
    p.card = card;
  });
  $$(".piece").forEach(function (c) { if (!PRODUCTS.some(function (p) { return p.card === c; })) c.hidden = true; });
  // Cards follow the order of products.js.
  PRODUCTS.forEach(function (p) { grid.appendChild(p.card); });

  // ---- The Road: the Silk Road map; choosing a city filters the collection ----
  (function road() {
    var R = window.ARTRA_ROAD, svg = $("#roadSvg");
    if (!R || !svg) return;
    var counts = {}, crafts = {};
    PRODUCTS.forEach(function (p) {
      if (!p.city) return;
      counts[p.city] = (counts[p.city] || 0) + 1;
      if (p.category) crafts[p.category] = 1;
    });
    var nCities = R.cities.length, nCrafts = Object.keys(crafts).length;
    $("#roadCount").textContent = t("road.count", { cities: nCities.toLocaleString(T.lang), crafts: nCrafts.toLocaleString(T.lang) });

    var card = $("#roadCard"), chips = $("#roadChips"), picked = null, drawn = false;
    function render() { R.draw(svg, { highlight: picked, counts: counts, onPick: pick, animate: !reduced && drawn }); }

    var pan = $("#roadPan");
    function pick(key) {
      picked = key;
      render();
      // Phones: slide the larger map so the chosen city sits in the middle.
      var at = R.at(key);
      if (pan && at && pan.scrollWidth > pan.clientWidth + 1) pan.scrollTo({ left: at.x * svg.clientWidth - pan.clientWidth / 2, behavior: reduced ? "auto" : "smooth" });
      var c = R.city(key), n = counts[key] || 0;
      var craftNames = (c.crafts || []).map(function (k) { return t("c." + k); }).join(" · ");
      card.innerHTML =
        '<p class="rc-region">' + esc(R.name(key)) + " · " + esc(R.region(key)) + "</p>" +
        '<p class="rc-crafts">' + esc(craftNames || t("road.on_route")) + "</p>" +
        (n ? '<button type="button" class="link-btn rc-go">' + esc(t(n === 1 ? "road.pieces_one" : "road.pieces", { n: n.toLocaleString(T.lang) })) + " →</button>"
           : '<p class="rc-none">' + esc(t("road.none")) + "</p>");
      card.hidden = false;
      if (n) $(".rc-go", card).addEventListener("click", function () { filter(key); });
      $$("button", chips).forEach(function (b) {
        var on = b.getAttribute("data-city") === key;
        b.setAttribute("aria-pressed", on);
        // Slide the line so the chosen city is in view.
        if (on) chips.scrollTo({ left: b.offsetLeft - chips.clientWidth / 2 + b.offsetWidth / 2, behavior: reduced ? "auto" : "smooth" });
      });
    }

    // The collection, showing only one city's pieces.
    function filter(key) {
      var shown = 0;
      PRODUCTS.forEach(function (p) { var on = !key || p.city === key; p.card.hidden = !on; if (on) shown++; });
      $("#roadFilter").hidden = !key;
      if (key) $("#roadFilterText").textContent = t("road.showing", { city: R.name(key) });
      if (key) $("#collection").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    }
    $("#roadFilterAll").addEventListener("click", function () { filter(null); });

    // A button per city (for phones and keyboards), with how many pieces come from there.
    R.cities.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (counts[c.key] ? " has" : "");
      b.setAttribute("data-city", c.key);
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = esc(R.name(c.key)) + (counts[c.key] ? '<span class="chip-n">' + esc(counts[c.key].toLocaleString(T.lang)) + "</span>" : "");
      if (counts[c.key]) b.setAttribute("aria-label", R.name(c.key) + ", " + t(counts[c.key] === 1 ? "road.pieces_one" : "road.pieces", { n: counts[c.key].toLocaleString(T.lang) }));
      b.addEventListener("click", function () { pick(c.key); });
      chips.appendChild(b);
    });

    // With a mouse, the line can also be dragged sideways; a drag is not taken as a click on a city.
    var drag = null, dragged = false;
    chips.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse") { drag = { x: e.clientX, left: chips.scrollLeft }; dragged = false; } });
    addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) { dragged = true; chips.classList.add("dragging"); }
      if (dragged) chips.scrollLeft = drag.left - dx;
    });
    addEventListener("pointerup", function () { drag = null; chips.classList.remove("dragging"); });
    chips.addEventListener("click", function (e) { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);

    render();
    // The route draws itself, and the caravan sets off, when the map comes into view.
    new IntersectionObserver(function (es, io) {
      if (!es[0].isIntersecting) return;
      io.disconnect(); drawn = true; render();
      if (!picked) { var first = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0]; if (first) pick(first); }
    }, { threshold: 0.3 }).observe(svg);
  })();

  // ---- Showcase ----
  var current = 0, stageArt = $("#stageArt"), copy = $(".stage-copy");

  function show(i) {
    if (!PRODUCTS.length) return;
    current = (i + PRODUCTS.length) % PRODUCTS.length;
    var p = PRODUCTS[current], art = ARTRA_ART.make(p.key);
    stageArt.innerHTML = "";
    if (art) stageArt.appendChild(art);
    else if (p.cutout || p.photo) { var img = new Image(); img.src = p.cutout || p.photo; img.alt = p.name; img.className = p.cutout ? "photo cutout" : "photo"; stageArt.appendChild(img); }
    stageArt.classList.remove("swap"); void stageArt.offsetWidth; stageArt.classList.add("swap");

    $("#sCraft").textContent = p.category || "";
    $("#sName").textContent = p.name || "";
    $("#sStory").textContent = p.description || "";
    var specs = [[t("l.medium"), p.medium], [t("l.origin"), p.origin], [t("l.dimensions"), p.dimensions], [t("l.id"), p.id]]
      .filter(function (f) { return f[1]; }).slice(0, 3);
    $("#sSpecs").innerHTML = specs.map(function (f) { return "<div><dt>" + f[0] + "</dt><dd>" + esc(f[1]) + "</dd></div>"; }).join("");
    $("#sSpecs").hidden = !specs.length;
    $("#sMore").href = p.url;
    $("#sCount").textContent = String(current + 1).padStart(2, "0") + " / " + String(PRODUCTS.length).padStart(2, "0");
    copy.classList.remove("fade"); void copy.offsetWidth; copy.classList.add("fade");
  }

  function preselect(craft) {
    var sel = $('#form select[name="craft"]');
    $$("option", sel).forEach(function (o, i) { if (o.textContent === craft) sel.selectedIndex = i; });
  }

  $("#prev").addEventListener("click", function () { show(current - 1); });
  $("#next").addEventListener("click", function () { show(current + 1); });
  $("#sAsk").addEventListener("click", function () { preselect(PRODUCTS[current].category); });
  show(0);

  // Turn through the pieces by themselves while the showcase is in view and idle.
  var auto = null, stage = $("#stage");
  new IntersectionObserver(function (entries) {
    clearInterval(auto);
    if (entries[0].isIntersecting && !reduced) auto = setInterval(function () { show(current + 1); }, 7000);
  }, { threshold: 0.4 }).observe(stage);
  $$("#prev, #next").forEach(function (b) { b.addEventListener("click", function () { clearInterval(auto); }); });

  // ---- Commission form ----
  $("#form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = ev.target, btn = f.querySelector("button[type=submit]");
    var craft = f.craft.options[f.craft.selectedIndex].text;
    function byEmail() {
      var body = t("f.name") + ": " + f.name.value + "\n" + t("f.email") + ": " + f.email.value + "\n" + t("f.craft") + ": " + craft + "\n\n" + f.idea.value;
      location.href = "mailto:" + ATELIER_EMAIL + "?subject=" + encodeURIComponent(t("mail.commission", { craft: craft })) + "&body=" + encodeURIComponent(body);
    }
    btn.disabled = true;
    fetch("/api/enquiries", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Artra": "1" },
      body: JSON.stringify({ kind: "commission", name: f.name.value, email: f.email.value, craft: craft, message: f.idea.value, lang: T.lang, website: f.website ? f.website.value : "" })
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      f.reset();
      $("#formNote").textContent = t("f.thanks");
    }).catch(function () { byEmail(); $("#formNote").textContent = t("enq.error"); })
      .finally(function () { btn.disabled = false; });
  });

  $("#year").textContent = new Date().getFullYear();

  // ---- Gold dust drifting across the page ----
  var cv = $("#dust");
  if (cv && !reduced) {
    var ctx = cv.getContext("2d"), W, H, dpr, motes = [];
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
      var n = Math.round(Math.min(70, innerWidth / 18));
      motes = [];
      for (var i = 0; i < n; i++) motes.push(mote(true));
    }
    function mote(any) {
      return { x: Math.random() * W, y: any ? Math.random() * H : H + 10, r: (Math.random() * 1.6 + 0.4) * dpr,
        vy: -(Math.random() * 0.25 + 0.08) * dpr, vx: (Math.random() - 0.5) * 0.15 * dpr, ph: Math.random() * 6.28, tw: Math.random() * 0.02 + 0.005 };
    }
    var running = true;
    document.addEventListener("visibilitychange", function () { running = !document.hidden; if (running) requestAnimationFrame(frame); });
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx + Math.sin(m.ph) * 0.12 * dpr; m.y += m.vy; m.ph += m.tw;
        if (m.y < -10) motes[i] = m = mote(false);
        var a = 0.25 + Math.abs(Math.sin(m.ph)) * 0.55;
        ctx.beginPath();
        ctx.fillStyle = "rgba(230, 201, 122," + a.toFixed(3) + ")";
        ctx.shadowColor = "rgba(230, 190, 100, .8)"; ctx.shadowBlur = 6 * dpr;
        ctx.arc(m.x, m.y, m.r, 0, 6.283);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    addEventListener("resize", size);
    size();
    requestAnimationFrame(frame);
  }
})();
