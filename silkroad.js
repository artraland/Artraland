// ARTRA — the Silk Road map: the caravan cities from Venice to Xi'an on a simple chart (spread evenly from west to
// east, not to scale), the route through them, and the crafts each city is known for.
// Used by the home page (The Road: tap a city, see its pieces) and the account page (a piece's origin).
// A product names its city with `city` in products.js (the keys below, e.g. "isfahan").
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  // name: per language; region: per language; crafts: keys of the craft names in i18n.js (c.*);
  // label: where the name sits [dx, dy, anchor]; route: on the main road (else a workshop city off it).
  var R = {
    italy: { en: "Italy", fr: "Italie", es: "Italia", ar: "إيطاليا", fa: "ایتالیا" },
    anatolia: { en: "Anatolia", fr: "Anatolie", es: "Anatolia", ar: "الأناضول", fa: "آناتولی" },
    levant: { en: "The Levant", fr: "Levant", es: "Levante", ar: "بلاد الشام", fa: "شام" },
    mesopotamia: { en: "Mesopotamia", fr: "Mésopotamie", es: "Mesopotamia", ar: "بلاد الرافدين", fa: "میان‌رودان" },
    persia: { en: "Persia", fr: "Perse", es: "Persia", ar: "بلاد فارس", fa: "ایران" },
    khorasan: { en: "Khorasan", fr: "Khorassan", es: "Jorasán", ar: "خراسان", fa: "خراسان" },
    transoxiana: { en: "Transoxiana", fr: "Transoxiane", es: "Transoxiana", ar: "ما وراء النهر", fa: "فرارود" },
    turkestan: { en: "Turkestan", fr: "Turkestan", es: "Turquestán", ar: "تركستان", fa: "ترکستان" },
    china: { en: "China", fr: "Chine", es: "China", ar: "الصين", fa: "چین" }
  };
  var CITIES = [
    { key: "venice", x: 60, y: 105, route: 1, region: R.italy, label: [0, -18, "middle"], name: { en: "Venice", fr: "Venise", es: "Venecia", ar: "البندقية", fa: "ونیز" } },
    { key: "constantinople", x: 180, y: 155, route: 1, region: R.anatolia, label: [0, -18, "middle"], name: { en: "Constantinople", fr: "Constantinople", es: "Constantinopla", ar: "القسطنطينية", fa: "قسطنطنیه" } },
    { key: "damascus", x: 270, y: 255, route: 1, region: R.levant, label: [0, 32, "middle"], name: { en: "Damascus", fr: "Damas", es: "Damasco", ar: "دمشق", fa: "دمشق" } },
    { key: "baghdad", x: 370, y: 245, route: 1, region: R.mesopotamia, label: [0, 32, "middle"], name: { en: "Baghdad", fr: "Bagdad", es: "Bagdad", ar: "بغداد", fa: "بغداد" } },
    { key: "tabriz", x: 430, y: 165, route: 1, region: R.persia, label: [0, -18, "middle"], name: { en: "Tabriz", fr: "Tabriz", es: "Tabriz", ar: "تبريز", fa: "تبریز" } },
    { key: "zanjan", x: 478, y: 123, route: 0, region: R.persia, crafts: ["filigree"], label: [10, -8, "start"], name: { en: "Zanjan", fr: "Zanjan", es: "Zanyán", ar: "زنجان", fa: "زنجان" } },
    { key: "kashan", x: 548, y: 201, route: 0, region: R.persia, crafts: ["silk"], label: [12, 4, "start"], name: { en: "Kashan", fr: "Kachan", es: "Kashán", ar: "كاشان", fa: "کاشان" } },
    { key: "isfahan", x: 520, y: 255, route: 1, region: R.persia, crafts: ["metal", "enamel", "brass"], label: [0, 40, "middle"], name: { en: "Isfahan", fr: "Ispahan", es: "Isfahán", ar: "أصفهان", fa: "اصفهان" } },
    { key: "shiraz", x: 598, y: 317, route: 0, region: R.persia, crafts: ["khatam", "mirror"], label: [12, 6, "start"], name: { en: "Shiraz", fr: "Chiraz", es: "Shiraz", ar: "شيراز", fa: "شیراز" } },
    { key: "nishapur", x: 630, y: 185, route: 1, region: R.khorasan, label: [0, -18, "middle"], name: { en: "Nishapur", fr: "Nichapour", es: "Nishapur", ar: "نيسابور", fa: "نیشابور" } },
    { key: "merv", x: 720, y: 205, route: 1, region: R.khorasan, label: [0, 32, "middle"], name: { en: "Merv", fr: "Merv", es: "Merv", ar: "مرو", fa: "مرو" } },
    { key: "bukhara", x: 800, y: 165, route: 1, region: R.transoxiana, label: [-4, 32, "middle"], name: { en: "Bukhara", fr: "Boukhara", es: "Bujará", ar: "بخارى", fa: "بخارا" } },
    { key: "samarkand", x: 860, y: 145, route: 1, region: R.transoxiana, label: [8, -18, "middle"], name: { en: "Samarkand", fr: "Samarcande", es: "Samarcanda", ar: "سمرقند", fa: "سمرقند" } },
    { key: "kashgar", x: 980, y: 155, route: 1, region: R.turkestan, label: [0, -18, "middle"], name: { en: "Kashgar", fr: "Kachgar", es: "Kasgar", ar: "كاشغر", fa: "کاشغر" } },
    { key: "xian", x: 1130, y: 205, route: 1, region: R.china, label: [0, -18, "middle"], name: { en: "Xi'an", fr: "Xi'an", es: "Xi'an", ar: "شيان", fa: "شی‌آن" } }
  ];
  // Workshop cities off the main road join it here.
  var SPURS = { zanjan: "tabriz", kashan: "isfahan", shiraz: "isfahan" };

  var W = 1200, H = 520;
  var BY = {};
  CITIES.forEach(function (c) { BY[c.key] = c; });
  var ROUTE = CITIES.filter(function (c) { return c.route; });

  // A smooth line through the route cities (Catmull-Rom as cubic curves).
  function smooth(pts) {
    var d = "M" + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += " C" + (p1.x + (p2.x - p0.x) / 6).toFixed(1) + " " + (p1.y + (p2.y - p0.y) / 6).toFixed(1) + " " +
        (p2.x - (p3.x - p1.x) / 6).toFixed(1) + " " + (p2.y - (p3.y - p1.y) / 6).toFixed(1) + " " + p2.x.toFixed(1) + " " + p2.y.toFixed(1);
    }
    return d;
  }
  var ROUTE_D = smooth(ROUTE);


  // An old engraved chart behind the road, drawn to match the city layout above (not a real map):
  // seas with engraved water lines, mountain ranges, deserts, rivers, compass lines and old Latin names,
  // on parchment grain. Shown faintly (see .sr-old in royal.css).
  var OLD_MAP =
    '<defs>' +
      '<pattern id="srWater" width="8" height="5" patternUnits="userSpaceOnUse"><path d="M0 2.5 Q2 1.5 4 2.5 T8 2.5" fill="none" stroke="#c9a56a" stroke-width=".6"/></pattern>' +
      '<pattern id="srSand" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#c9a56a"/><circle cx="6.5" cy="6" r=".55" fill="#c9a56a"/></pattern>' +
      '<radialGradient id="srVellum" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#d9c08a" stop-opacity=".22"/><stop offset=".7" stop-color="#b8935a" stop-opacity=".14"/><stop offset="1" stop-color="#6b4f25" stop-opacity=".35"/></radialGradient>' +
      '<filter id="srGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/>' +
        '<feColorMatrix values="0 0 0 0 .80  0 0 0 0 .66  0 0 0 0 .40  0 0 0 .5 -.12"/></filter>' +
    '</defs>' +
    // Parchment.
    '<rect width="1200" height="520" fill="url(#srVellum)"/>' +
    '<rect width="1200" height="520" filter="url(#srGrain)" opacity=".55"/>' +
    // Compass lines, as on a portolan chart, from two roses.
    '<g stroke="#c9a56a" stroke-width=".5" opacity=".6">' + rhumbs(180, 330) + rhumbs(1110, 440) + '</g>' +
    // Seas: Mediterranean (with the Adriatic up to Venice), Black Sea, Caspian, Aral, Persian Gulf, Arabian Sea.
    '<g fill="url(#srWater)" stroke="#c9a56a" stroke-width="1.2">' +
      '<path d="M0 232 C34 206 52 166 66 124 C78 150 96 182 140 196 C180 206 214 198 236 214 C252 236 254 266 246 300 C240 340 204 362 150 372 C92 382 40 362 0 372 Z"/>' +
      '<path d="M192 140 C204 104 258 88 318 96 C350 102 346 126 320 136 C280 146 232 150 192 140 Z"/>' +
      '<path d="M522 0 C548 22 522 60 536 92 C548 120 562 140 590 150 C612 150 602 110 592 80 C576 40 592 16 578 0 Z"/>' +
      '<path d="M736 70 C736 54 762 46 784 52 C804 58 800 82 782 88 C760 94 736 86 736 70 Z"/>' +
      '<path d="M410 300 C452 312 502 340 560 360 C602 372 642 384 682 420 C660 440 612 424 570 406 C520 386 460 362 410 322 Z"/>' +
      '<path d="M640 520 C660 470 720 456 800 468 C862 478 902 498 924 520 Z"/>' +
    '</g>' +
    // Coastlines a second time, finer, a little out from the shore: the engraver's double line.
    '<g fill="none" stroke="#c9a56a" stroke-width=".5" opacity=".7" transform="translate(0 4)">' +
      '<path d="M0 232 C34 206 52 166 66 124 C78 150 96 182 140 196 C180 206 214 198 236 214 C252 236 254 266 246 300"/>' +
      '<path d="M410 300 C452 312 502 340 560 360 C602 372 642 384 682 420"/>' +
    '</g>' +
    // Rivers: Tigris and Euphrates, the Oxus to the Aral, the Yellow River.
    '<g fill="none" stroke="#c9a56a" stroke-width="1.1" stroke-linecap="round">' +
      '<path d="M330 172 C350 210 372 250 392 278 S 404 296 410 304"/>' +
      '<path d="M352 168 C380 196 386 236 402 262 S 412 292 412 302"/>' +
      '<path d="M906 214 C870 210 846 196 826 172 C808 150 796 110 780 88"/>' +
      '<path d="M1040 92 C1090 74 1150 116 1120 156 C1098 186 1160 192 1200 168"/>' +
    '</g>' +
    // Mountain ranges: Caucasus, Zagros, Elburz, Hindu Kush, Pamir and Tian Shan, Kunlun.
    '<g fill="none" stroke="#c9a56a" stroke-width=".9">' +
      peaks([[322, 118], [346, 112], [370, 108], [394, 112], [418, 110]]) +
      peaks([[438, 214], [454, 230], [470, 248], [486, 266], [502, 284], [522, 302], [544, 318]]) +
      peaks([[498, 150], [522, 160], [600, 160], [624, 164]]) +
      peaks([[748, 252], [772, 256], [798, 252], [822, 246], [848, 240]]) +
      peaks([[888, 186], [904, 168], [922, 150], [940, 134], [960, 120]]) +
      peaks([[1000, 244], [1026, 252], [1052, 256], [1078, 258], [1104, 262]]) +
    '</g>' +
    // Deserts.
    '<g fill="url(#srSand)" opacity=".9">' +
      '<ellipse cx="1040" cy="214" rx="58" ry="22"/><ellipse cx="740" cy="150" rx="40" ry="14"/><ellipse cx="596" cy="236" rx="34" ry="14"/><ellipse cx="300" cy="380" rx="70" ry="30"/>' +
    '</g>' +
    // Old names.
    '<g font-family="Cormorant Garamond, serif" font-style="italic" fill="#d9c08a" text-anchor="middle">' +
      '<text x="120" y="300" font-size="17" letter-spacing="4">MARE MEDITERRANEUM</text>' +
      '<text x="262" y="122" font-size="11" letter-spacing="2">PONTUS EUXINUS</text>' +
      '<text x="556" y="60" font-size="11" letter-spacing="3" transform="rotate(78 556 60)">MARE CASPIUM</text>' +
      '<text x="548" y="384" font-size="12" letter-spacing="3" transform="rotate(24 548 384)">SINUS PERSICUS</text>' +
      '<text x="790" y="500" font-size="14" letter-spacing="4">MARE ERYTHRAEUM</text>' +
      '<text x="1040" y="246" font-size="11" letter-spacing="3">TAKLAMAKAN</text>' +
      '<text x="836" y="186" font-size="10" letter-spacing="2" transform="rotate(42 836 186)">OXUS</text>' +
      '<text x="330" y="440" font-size="22" letter-spacing="10">ARABIA</text>' +
      '<text x="700" y="300" font-size="24" letter-spacing="12">PERSIA</text>' +
      '<text x="660" y="44" font-size="22" letter-spacing="12">SCYTHIA</text>' +
      '<text x="1080" y="96" font-size="24" letter-spacing="12">SERICA</text>' +
      '<text x="900" y="380" font-size="22" letter-spacing="12">INDIA</text>' +
    '</g>' +
    // A dark, worn edge.
    '<rect x="6" y="6" width="1188" height="508" fill="none" stroke="#c9a56a" stroke-width="1" opacity=".7"/>' +
    '<rect x="12" y="12" width="1176" height="496" fill="none" stroke="#c9a56a" stroke-width=".5" opacity=".6"/>';

  // Sixteen compass lines out from a point, to the edges of the chart.
  function rhumbs(cx, cy) {
    var d = "";
    for (var i = 0; i < 16; i++) {
      var a = i * Math.PI / 8;
      d += "M" + cx + " " + cy + " L" + (cx + Math.cos(a) * 1400).toFixed(0) + " " + (cy + Math.sin(a) * 1400).toFixed(0) + " ";
    }
    return '<path d="' + d + '"/>';
  }
  // A range of small engraved peaks, each shaded on one side.
  function peaks(pts) {
    return pts.map(function (p) {
      var x = p[0], y = p[1];
      return '<path d="M' + (x - 9) + " " + (y + 6) + " L" + x + " " + (y - 8) + " L" + (x + 9) + " " + (y + 6) + '"/>' +
        '<path d="M' + (x + 2) + " " + (y - 4) + " L" + (x + 6) + " " + (y + 5) + " M" + (x + 4) + " " + (y - 1) + " L" + (x + 7) + " " + (y + 5) + '" stroke-width=".5"/>';
    }).join("");
  }

  function lang() { return (window.ARTRA_I18N && window.ARTRA_I18N.lang) || "en"; }
  function pick(o) { return o ? o[lang()] || o.en : ""; }
  function el(name, attrs, parent, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }

  // Draw the map into an <svg>. opts: { mini: bool, highlight: key, counts: {key: n}, onPick: fn(key), animate: bool }
  function draw(svg, opts) {
    opts = opts || {};
    var mini = !!opts.mini;
    svg.setAttribute("viewBox", mini ? "20 65 1170 300" : "0 0 " + W + " " + H);
    svg.setAttribute("direction", "ltr");
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    el("defs", {}, svg).innerHTML =
      '<linearGradient id="srGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d98e"/><stop offset=".5" stop-color="#d4b467"/><stop offset="1" stop-color="#9a7a35"/></linearGradient>';

    if (!mini) {
      // The old map, faint, behind everything.
      el("g", { "class": "sr-old", "aria-hidden": "true" }, svg).innerHTML = OLD_MAP;
      // An old chart: lines of latitude and longitude, and a compass rose.
      var grid = el("g", { stroke: "#4a5a75", "stroke-width": ".6", "stroke-dasharray": "2 8", opacity: ".55" }, svg);
      [100, 200, 300, 400].forEach(function (y) { el("path", { d: "M0 " + y + " H" + W }, grid); });
      [200, 400, 600, 800, 1000].forEach(function (x) { el("path", { d: "M" + x + " 0 V" + H }, grid); });
      var rose = el("g", { transform: "translate(1110 440)", opacity: ".75" }, svg);
      el("circle", { r: 36, fill: "none", stroke: "#d4b467", "stroke-width": ".8" }, rose);
      el("path", { d: "M0 -44 L6 -6 L44 0 L6 6 L0 44 L-6 6 L-44 0 L-6 -6 Z", fill: "none", stroke: "#d4b467", "stroke-width": "1" }, rose);
      el("path", { d: "M0 -44 L6 -6 L0 0 Z M44 0 L6 6 L0 0 Z M0 44 L-6 6 L0 0 Z M-44 0 L-6 -6 L0 0 Z", fill: "#d4b467", opacity: ".55" }, rose);
      el("text", { y: -52, "text-anchor": "middle", "font-family": "Jost, sans-serif", "font-size": 11, fill: "#d4b467", "letter-spacing": 2 }, rose, "N");
    }

    // Spurs to the workshop cities, the route, and the gold route drawing itself.
    Object.keys(SPURS).forEach(function (k) {
      var a = BY[k], b = BY[SPURS[k]];
      el("path", { d: "M" + a.x + " " + a.y + " L" + b.x + " " + b.y, stroke: "#6e84a8", "stroke-width": mini ? 1.5 : 1, "stroke-dasharray": "3 4", fill: "none" }, svg);
    });
    el("path", { d: ROUTE_D, fill: "none", stroke: "#4a5a75", "stroke-width": mini ? 2 : 1 }, svg);
    var gold = el("path", { d: ROUTE_D, fill: "none", stroke: "url(#srGold)", "stroke-width": mini ? 3 : 2.4, "stroke-linecap": "round", pathLength: 1, "class": "sr-route" + (opts.animate ? " sr-anim" : "") }, svg);
    if (mini) gold.setAttribute("opacity", ".55");

    // The caravan, travelling west along the road.
    if (!mini && opts.animate) {
      [[5, 1, 0], [3, .6, -.5], [2, .35, -1]].forEach(function (c) {
        var dot = el("circle", { r: c[0], fill: "#f1d98e", opacity: c[1] }, svg);
        el("animateMotion", { dur: "18s", begin: c[2] + "s", repeatCount: "indefinite", keyPoints: "1;0", keyTimes: "0;1", calcMode: "linear", path: ROUTE_D }, dot);
      });
    }

    // The cities.
    var counts = opts.counts || {};
    CITIES.forEach(function (c) {
      var on = c.key === opts.highlight, has = counts[c.key] > 0;
      var g = el("g", { "class": "sr-city" + (on ? " on" : "") + (has ? " has" : ""), "data-city": c.key }, svg);
      if (on) {
        el("circle", { cx: c.x, cy: c.y, r: mini ? 26 : 22, fill: "#4cc3b9", opacity: ".2", "class": "sr-pulse" }, g);
        el("circle", { cx: c.x, cy: c.y, r: mini ? 10 : 8, fill: "#4cc3b9", stroke: "#f3eee4", "stroke-width": 1.5 }, g);
      } else {
        el("circle", { cx: c.x, cy: c.y, r: (c.route ? 5 : 4) * (mini ? 1.6 : 1), fill: has ? "#d4b467" : "#0d1420", stroke: c.route ? "#d4b467" : "#9fb6e0", "stroke-width": 1.5 }, g);
      }
      if (!mini || on || c.route) {
        var dx = c.label[0], dy = c.label[1];
        var t = el("text", { x: c.x + dx, y: c.y + dy, "text-anchor": c.label[2], "font-family": "Cormorant Garamond, Noto Naskh Arabic, Vazirmatn, serif",
          "font-size": (on ? 23 : c.route ? 18 : 15) * (mini ? 1.5 : 1), fill: on ? "#4cc3b9" : c.route ? "#f3eee4" : "#c9c3b5" }, g, pick(c.name));
        if (mini && !on) t.setAttribute("fill", "#a9a497");
      }
      if (opts.onPick) {
        // A wide, invisible hit area makes small cities easy to tap.
        var hit = el("circle", { cx: c.x, cy: c.y, r: 20, fill: "transparent", "class": "sr-hit" }, g);
        hit.addEventListener("click", function () { opts.onPick(c.key); });
      }
    });
  }

  // Where a city sits on the map, as fractions of its width and height (for placing an HTML card over it).
  function at(key) { var c = BY[key]; return c ? { x: c.x / W, y: c.y / H } : null; }

  window.ARTRA_ROAD = {
    cities: CITIES, city: function (k) { return BY[k] || null; }, name: function (k) { return BY[k] ? pick(BY[k].name) : ""; },
    region: function (k) { return BY[k] ? pick(BY[k].region) : ""; }, draw: draw, at: at
  };
})();
