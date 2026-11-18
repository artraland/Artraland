// ARTRA — /carpet: the making of a carpet, told as you scroll.
// The visitor chooses one of three carpets; each is a grid of knots (one cell = one knot) drawn by a small pattern
// function. As the page scrolls, the same carpet is spun, dyed, charted, knotted, sheared and laid down on the canvas.
// Chapters: 0 choose · 1 spin · 2 dye · 3 chart · 4 knot · 5 shear & wash · 6 finished.
(function () {
  "use strict";
  var T = window.ARTRA_I18N, t = T.t, rtl = T.rtl;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.title = t("cp.meta_title");
  var md = $('meta[name="description"]'); if (md) md.content = t("cp.meta_desc");
  $("#year").textContent = new Date().getFullYear();
  var burger = $("#burger"), nav = $("#nav");
  burger.addEventListener("click", function () { var o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });

  // ---------------------------------------------------------------------------------------------------------------
  // The carpets. Each has a palette (with the plant each colour comes from) and a pattern: f(x, y) → palette index.
  // ---------------------------------------------------------------------------------------------------------------
  var W = 60, H = 90;
  function edge(x, y) { return Math.min(x, y, W - 1 - x, H - 1 - y); }
  // Position along the border band (so motifs repeat around the carpet) and depth into it.
  function along(x, y) { var b = edge(x, y); return (b === y || b === H - 1 - y) ? x : y; }

  // The frame shared by all three: outline, guard stripe, main border with rosettes, guard, then the field.
  function frame(x, y, P) {
    var b = edge(x, y);
    if (b < 1 || b === 3 || b === 10 || b === 12) return P.line;
    if (b < 3 || b === 11) return P.guard;
    if (b < 10) {
      var s = (along(x, y) + 400) % 10 - 5, d = b - 6.5;
      var r = Math.abs(s) + Math.abs(d);
      if (r < 1.2) return P.guard;
      if (r < 2.6) return P.rose;
      if (Math.abs(d) < .6 && Math.abs(s) > 3) return P.guard;  // the vine between the rosettes
      return P.band;
    }
    return -1;   // inside the field
  }
  var DESIGNS = [
    { key: "throne", city: "kashan", fibre: "sp.silk", knots: "sp.knots1", total: 1200000, link: "/piece?p=carpet", cta: "cp.enquire",
      colors: [["#8e1f26", "madder"], ["#1d2c62", "indigo"], ["#c9a24a", "pomegranate"], ["#efe5cb", "ivory"], ["#4a2e1f", "walnut"], ["#5f86c4", "larkspur"]],
      P: { field: 0, band: 1, guard: 2, rose: 0, line: 4 },
      field: function (x, y) {
        var cx = (W - 1) / 2, cy = (H - 1) / 2, u = Math.abs(x - cx), v = Math.abs(y - cy), m = u / 15 + v / 22;
        if (m < 1) {                                   // the medallion
          if (m < .16) return 2;
          if (m < .34) return 3;
          if (m < .62) return (Math.abs(u - v * .7) < 1.2) ? 2 : 1;
          if (m < .7) return 2;
          if (m < .9) return (((x + y) % 4) === 0) ? 2 : 3;
          return 4;
        }
        if (u < 2.6 && v >= 21 && v < 27) return v < 23 ? 4 : 2;   // the pendants above and below
        var xx = Math.min(x - 13, W - 14 - x), yy = Math.min(y - 13, H - 14 - y), q = xx / 15 + yy / 21;
        if (q < 1) return q > .86 ? 2 : (q < .4 ? 5 : 1);           // the corner spandrels
        var a = (x + 300) % 6 - 3, c = (y + 300) % 6 - 3;
        if (a === 0 && c === 0) return 3;
        if (Math.abs(a) + Math.abs(c) === 1) return 2;
        return 0;
      } },
    { key: "garden", city: "isfahan", fibre: "sp.woolsilk", knots: "sp.knots_o", link: "/#commission", cta: "cp.commission",
      colors: [["#ebe0c4", "ivory"], ["#2b4f8c", "indigo"], ["#c79a3e", "weld"], ["#4f6b3a", "vine"], ["#a6403a", "madder"], ["#3b2a1e", "walnut"]],
      P: { field: 0, band: 1, guard: 2, rose: 4, line: 5 },
      field: function (x, y) {
        var fx = x - 13, fy = y - 13, S = 11, i = Math.floor(fx / S), j = Math.floor(fy / S), px = fx - i * S, py = fy - j * S;
        if (px === 0 || py === 0) return 5;                          // the panel lines
        var dark = (i + j) % 2 === 0, bg = dark ? 1 : 0, cx = S / 2, cyy = S / 2;
        if ((i + j) % 2 === 0) {                                     // a cypress
          var top = 2, h = py - top;
          if (h >= 0 && py < S - 2 && Math.abs(px - cx) < h * .34 + .5) return 3;
          if (py >= S - 2 && Math.abs(px - cx) < .8) return 5;
          return bg;
        }
        var r = Math.abs(px - cx) + Math.abs(py - cyy);               // a flower
        if (r < 1.3) return 2;
        if (r < 3.2) return 4;
        if (r < 3.9 && (px === Math.round(cx) || py === Math.round(cyy))) return 3;
        return bg;
      } },
    { key: "herati", city: "tabriz", fibre: "sp.wool", knots: "sp.knots_o", link: "/#commission", cta: "cp.commission",
      colors: [["#1c2654", "indigo"], ["#e9dfc4", "ivory"], ["#b0564f", "madder"], ["#c49a46", "pomegranate"], ["#6b8cc1", "larkspur"], ["#352419", "walnut"]],
      P: { field: 0, band: 2, guard: 3, rose: 1, line: 5 },
      field: function (x, y) {
        var p = 10, dx = ((x - 13) % p + p) % p - p / 2, dy = ((y - 13) % p + p) % p - p / 2, ax = Math.abs(dx), ay = Math.abs(dy), r = ax + ay;
        if (r === 5 || r === 4.5) return 3;                          // the lattice
        if (r < 1.1) return 1;                                       // the rosette
        if (r < 2.2) return 2;
        if (ax === ay && ax > 2 && ax < 4.5) return 4;               // the leaves
        return 0;
      } }
  ];

  // Build a carpet: its knots, a woven texture (4 px a knot, lit from above), and a small thumbnail.
  var KS = 4;
  function build(d) {
    var grid = new Uint8Array(W * H);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var f = frame(x, y, d.P);
      grid[y * W + x] = f >= 0 ? f : d.field(x, y);
    }
    var rgb = d.colors.map(function (c) { var n = parseInt(c[0].slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; });
    var tex = document.createElement("canvas"); tex.width = W * KS; tex.height = H * KS;
    var tc = tex.getContext("2d"), img = tc.createImageData(tex.width, tex.height), D = img.data;
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var yy = 0; yy < tex.height; yy++) for (var xx = 0; xx < tex.width; xx++) {
      var c = rgb[grid[(yy / KS | 0) * W + (xx / KS | 0)]], ky = yy % KS, kx = xx % KS;
      var k = 1 + (ky === 0 ? .1 : ky === KS - 1 ? -.16 : 0) + (kx === KS - 1 ? -.07 : 0) + (rnd() - .5) * .06;
      var o = (yy * tex.width + xx) * 4;
      D[o] = Math.min(255, c[0] * k); D[o + 1] = Math.min(255, c[1] * k); D[o + 2] = Math.min(255, c[2] * k); D[o + 3] = 255;
    }
    tc.putImageData(img, 0, 0);
    // The un-sheared pile: short random hairs over the surface.
    var fuzz = document.createElement("canvas"); fuzz.width = tex.width; fuzz.height = tex.height;
    var fc = fuzz.getContext("2d");
    for (var i = 0; i < 2600; i++) {
      var fx = rnd() * fuzz.width, fy = rnd() * fuzz.height, col = rgb[grid[(fy / KS | 0) * W + (fx / KS | 0)]];
      fc.strokeStyle = "rgba(" + (col[0] + 40) + "," + (col[1] + 40) + "," + (col[2] + 40) + ",.75)";
      fc.lineWidth = 1; fc.beginPath(); fc.moveTo(fx, fy); fc.lineTo(fx + (rnd() - .5) * 7, fy - rnd() * 7); fc.stroke();
    }
    var th = document.createElement("canvas"); th.width = W; th.height = H;
    th.getContext("2d").drawImage(tex, 0, 0, W, H);
    return { d: d, grid: grid, tex: tex, fuzz: fuzz, thumb: th.toDataURL() };
  }
  var BUILT = DESIGNS.map(build), cur = BUILT[0];

  // ---------------------------------------------------------------------------------------------------------------
  // The picker and the chapters
  // ---------------------------------------------------------------------------------------------------------------
  var pick = $("#cpPick");
  BUILT.forEach(function (b, i) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-pressed", i === 0);
    btn.innerHTML = '<img src="' + b.thumb + '" alt=""><span>' + esc(t("cp.d" + (i + 1))) + "<small>" + esc(t("cp.d" + (i + 1) + "_s")) + "</small></span>";
    btn.addEventListener("click", function () {
      cur = b;
      $$("button", pick).forEach(function (x) { x.setAttribute("aria-pressed", x === btn); });
      details(); frame0();
    });
    pick.appendChild(btn);
  });
  function cityName(k) { return window.ARTRA_ROAD && ARTRA_ROAD.city(k) ? ARTRA_ROAD.name(k) : k; }
  function details() {
    var d = cur.d, dyes = d.colors.map(function (c) { return t("dye." + c[1]); }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    $("#cpSpecs").innerHTML = [["sp.city", cityName(d.city)], ["sp.fibre", t(d.fibre)], ["sp.knots", t(d.knots)], ["sp.dyes", dyes.join(" · ")]]
      .map(function (r) { return "<div><dt>" + esc(t(r[0])) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");
    $("#cpCta").innerHTML = '<a class="btn btn-gold" href="' + d.link + '">' + esc(t(d.cta)) + "</a>";
  }
  details();

  var chs = $$(".cp-ch"), dots = $$(".cp-dots li"), story = $("#story");
  var cv = $("#cpCanvas"), ctx = cv.getContext("2d"), vw = 0, vh = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = cv.clientWidth; vh = cv.clientHeight;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    frame0();
  }
  // How far through the story we are: 0 at the start, 6 at the end (one unit a chapter).
  function progress() {
    var r = story.getBoundingClientRect(), span = story.offsetHeight - innerHeight;
    return Math.max(0, Math.min(6, (-r.top / Math.max(1, span)) * 6.4 - .2));
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(v) { return v < .5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2; }
  // Each chapter's own progress, 0 → 1, across the scroll that belongs to it.
  function local(c, i) { return clamp(c - i + .5, 0, 1); }
  function weight(c, i) { return clamp(1 - Math.abs(c - i) * 1.7, 0, 1); }

  // Where the carpet sits: beside the words on wide screens, below them on phones.
  function rect() {
    var wide = vw > 900, h, w, cx, cy;
    if (wide) { h = vh * .7; w = h * W / H; cx = rtl ? vw * .3 : vw * .68; cy = vh * .5; }
    else { h = Math.min(vh * .44, (vw * .62) * H / W); w = h * W / H; cx = vw / 2; cy = vh * .63; }
    return { x: cx - w / 2, y: cy - h / 2, w: w, h: h, cx: cx, cy: cy, wide: wide };
  }

  // ---------------------------------------------------------------------------------------------------------------
  // The scenes
  // ---------------------------------------------------------------------------------------------------------------
  var time = 0;
  function carpetAt(R, alpha, opts) {
    opts = opts || {};
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 24;
    ctx.drawImage(cur.tex, R.x, R.y, R.w, R.h);
    ctx.shadowColor = "transparent";
    if (opts.fuzz) { ctx.globalAlpha = alpha * opts.fuzz; ctx.drawImage(cur.fuzz, R.x, R.y, R.w, R.h); }
    ctx.restore();
  }
  function fringe(R, alpha, len) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = "#e9dfc4"; ctx.lineWidth = Math.max(1, R.w / W * .45);
    for (var i = 0; i <= W; i += 1.5) {
      var x = R.x + i / W * R.w, wob = Math.sin(i * 1.7) * len * .15;
      ctx.beginPath(); ctx.moveTo(x, R.y); ctx.lineTo(x + wob, R.y - len); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, R.y + R.h); ctx.lineTo(x - wob, R.y + R.h + len); ctx.stroke();
    }
    ctx.restore();
  }

  // 0 · the chosen carpet, hanging, slowly breathing
  function scene0(R, a) {
    var lift = reduced ? 0 : Math.sin(time / 1300) * 6;
    var r2 = { x: R.x, y: R.y + lift, w: R.w, h: R.h };
    fringe(r2, a * .9, R.h * .035); carpetAt(r2, a);
  }

  // 1 · threads falling and twisting into a spun skein, with a turning spindle
  function scene1(R, a, p) {
    ctx.save(); ctx.globalAlpha = a;
    // On phones the threads start below the words.
    var N = 34, top = R.wide ? -20 : R.y - R.h * .18, bottom = R.y + R.h * .78, len = bottom - top, cx = R.cx, spin = reduced ? 0 : time / 900;
    var drawn = top + len * (.4 + .6 * ease(clamp(p * 1.5, 0, 1)));
    for (var i = 0; i < N; i++) {
      var off = (i - N / 2) / N;
      ctx.beginPath();
      for (var y = top; y <= drawn; y += 6) {
        var k = clamp((y - top) / len, 0, 1);                   // 0 at the top: loose; 1 at the skein: tight
        var spread = (1 - ease(k)) * R.w * .9, twist = Math.sin(k * 14 + i * .7 + spin) * (4 + 10 * (1 - k));
        var x = cx + off * spread + twist + Math.sin(i * 2.3 + y * .012) * 6 * (1 - k);
        if (y === top) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      var shade = 210 + (i % 5) * 9;
      ctx.strokeStyle = "rgba(" + shade + "," + (shade - 8) + "," + (shade - 26) + ",.85)";
      ctx.lineWidth = 1.1; ctx.stroke();
    }
    // The twisted thread below the skein, and the spindle
    var sy = bottom;
    ctx.strokeStyle = "#efe5cb"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, sy - 30); ctx.lineTo(cx, sy + R.h * .12); ctx.stroke();
    var wy = sy + R.h * .12, rx = R.w * .16, ry = rx * .32;
    ctx.fillStyle = "#6b4a2c"; ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(cx, wy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(201,162,74,.8)";
    for (var s = 0; s < 4; s++) { var ang = spin * 3 + s * Math.PI / 2; ctx.beginPath(); ctx.moveTo(cx, wy); ctx.lineTo(cx + Math.cos(ang) * rx, wy + Math.sin(ang) * ry); ctx.stroke(); }
    ctx.strokeStyle = "#8a6238"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx, wy - 6); ctx.lineTo(cx, wy + R.h * .14); ctx.stroke();
    ctx.restore();
  }

  // 2 · skeins on a pole, each taking its dye from the pot below; drops fall back into the bath
  function scene2(R, a, p) {
    ctx.save(); ctx.globalAlpha = a;
    var cols = cur.d.colors, n = cols.length, span = Math.min(vw * .9, R.w * (R.wide ? 1.5 : 1.35)), x0 = R.cx - span / 2, gap = span / n;
    var poleY = R.y + R.h * .02, skeinH = R.h * .52, potY = poleY + skeinH + R.h * .2;
    ctx.strokeStyle = "#8a6238"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x0 - 10, poleY); ctx.lineTo(x0 + span + 10, poleY); ctx.stroke();
    var level = ease(clamp(p * 1.25, 0, 1));
    for (var i = 0; i < n; i++) {
      var cx = x0 + gap * (i + .5), sw = gap * .42, col = cols[i][0];
      var dyeTop = poleY + skeinH * (1 - clamp(level * 1.1 - i * .04, 0, 1));
      // The skein: many fine loops of thread
      for (var s = -6; s <= 6; s++) {
        var x = cx + s / 6 * sw * .5;
        var grad = ctx.createLinearGradient(0, poleY, 0, poleY + skeinH);
        var f = clamp((dyeTop - poleY) / skeinH, 0, 1);
        grad.addColorStop(0, "#efe5cb"); grad.addColorStop(Math.max(0, f - .02), "#efe5cb"); grad.addColorStop(Math.min(1, f + .02), col); grad.addColorStop(1, col);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(cx, poleY);
        ctx.bezierCurveTo(x - sw * .2, poleY + skeinH * .3, x + Math.sin(s + time / 1500) * 2, poleY + skeinH * .8, cx + s * .6, poleY + skeinH);
        ctx.stroke();
      }
      // The pot and its bath
      var pw = gap * .66, ph = pw * .55;
      ctx.fillStyle = "#7a4a2a";
      ctx.beginPath(); ctx.moveTo(cx - pw / 2, potY); ctx.quadraticCurveTo(cx - pw * .55, potY + ph, cx, potY + ph); ctx.quadraticCurveTo(cx + pw * .55, potY + ph, cx + pw / 2, potY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, potY, pw / 2, pw * .12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 1.2; ctx.stroke();
      // Drops
      if (!reduced && level > .15) for (var dI = 0; dI < 2; dI++) {
        var ph2 = ((time / 1100 + i * .37 + dI * .5) % 1), dy = poleY + skeinH + ph2 * (potY - poleY - skeinH);
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx + (dI - .5) * 4, dy, 2.2, 3.2, 0, 0, Math.PI * 2); ctx.fill();
      }
      // The plant the colour comes from
      ctx.fillStyle = "rgba(201,195,181,.95)"; ctx.font = "400 " + (R.wide ? 13 : 11) + "px Jost, Vazirmatn, sans-serif"; ctx.textAlign = "center";
      ctx.direction = rtl ? "rtl" : "ltr";
      ctx.fillText(t("dye." + cols[i][1]), cx, potY + ph + 22);
    }
    ctx.restore();
  }

  // 3 · the chart: graph paper, the design appearing square by square from the centre
  function scene3(R, a, p) {
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = "#efe7d2"; ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 18;
    ctx.fillRect(R.x, R.y, R.w, R.h); ctx.shadowColor = "transparent";
    var rad = ease(clamp(p * 1.2, 0, 1)) * Math.hypot(R.w, R.h) * .56;
    ctx.save(); ctx.beginPath(); ctx.arc(R.cx, R.cy, rad, 0, Math.PI * 2); ctx.clip();
    ctx.imageSmoothingEnabled = false; ctx.globalAlpha = a * .92; ctx.drawImage(cur.tex, R.x, R.y, R.w, R.h);
    ctx.restore();
    var cw = R.w / W;
    ctx.lineWidth = 1;
    for (var x = 0; x <= W; x++) { ctx.strokeStyle = x % 10 === 0 ? "rgba(60,50,40,.45)" : "rgba(60,50,40,.14)"; ctx.beginPath(); ctx.moveTo(R.x + x * cw, R.y); ctx.lineTo(R.x + x * cw, R.y + R.h); ctx.stroke(); }
    for (var y = 0; y <= H; y++) { ctx.strokeStyle = y % 10 === 0 ? "rgba(60,50,40,.45)" : "rgba(60,50,40,.14)"; ctx.beginPath(); ctx.moveTo(R.x, R.y + y * cw); ctx.lineTo(R.x + R.w, R.y + y * cw); ctx.stroke(); }
    ctx.restore();
  }

  // 4 · the loom: warps, the woven rows climbing up, the weaver's thread crossing the current row
  var countEl = $("#cpCount");
  function scene4(R, a, p) {
    ctx.save(); ctx.globalAlpha = a;
    var rows = Math.round(ease(clamp(p * 1.15, 0, 1)) * H), cw = R.w / W, beam = Math.max(8, R.h * .03);
    // Bobbins of every colour, hanging above the loom
    var cols = cur.d.colors;
    for (var b = 0; b < cols.length; b++) {
      var bx = R.x + R.w * (b + .5) / cols.length, by = R.y - beam - R.h * .1;
      ctx.strokeStyle = cols[b][0]; ctx.lineWidth = 1; ctx.globalAlpha = a * .7;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(R.x + R.w * ((b * 7) % 11) / 11, R.y + R.h - rows * cw); ctx.stroke();
      ctx.globalAlpha = a; ctx.fillStyle = cols[b][0]; ctx.beginPath(); ctx.arc(bx, by, Math.max(5, R.w * .03), 0, Math.PI * 2); ctx.fill();
    }
    // The beams
    ctx.fillStyle = "#6b4a2c";
    ctx.fillRect(R.x - cw * 4, R.y - beam, R.w + cw * 8, beam);
    ctx.fillRect(R.x - cw * 4, R.y + R.h, R.w + cw * 8, beam);
    // The warps
    ctx.strokeStyle = "rgba(239,229,203,.55)"; ctx.lineWidth = Math.max(.6, cw * .18);
    for (var x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(R.x + (x + .5) * cw, R.y); ctx.lineTo(R.x + (x + .5) * cw, R.y + R.h); ctx.stroke(); }
    // The woven part
    if (rows > 0) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cur.tex, 0, (H - rows) * KS, W * KS, rows * KS, R.x, R.y + R.h - rows * cw, R.w, rows * cw);
    }
    // The row being knotted, and the comb
    if (rows < H) {
      var ry = R.y + R.h - rows * cw, kx = reduced ? .5 : ((time / 1600) % 1);
      ctx.fillStyle = "rgba(232,207,138,.85)";
      ctx.fillRect(R.x, ry - cw, R.w * kx, cw);
      ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(R.x - cw * 3, ry - cw * 1.6); ctx.lineTo(R.x + R.w + cw * 3, ry - cw * 1.6); ctx.stroke();
    }
    ctx.restore();
    if (cur.d.total) countEl.textContent = t("cp.knots", { n: Math.round(cur.d.total * rows / H).toLocaleString(T.lang) });
    else countEl.textContent = "";
  }

  // 5 · shearing: the loose pile falls away; then washing: a sheen of water passes over it
  function scene5(R, a, p) {
    var shear = clamp(p * 1.6, 0, 1), wash = clamp((p - .35) / .65, 0, 1);
    fringe(R, a, R.h * .035);
    carpetAt(R, a, { fuzz: 1 - ease(shear) });
    if (wash > 0 && wash < 1) {
      ctx.save(); ctx.globalAlpha = a * Math.sin(wash * Math.PI) * .55;
      var gx = R.x - R.w + wash * R.w * 3, g = ctx.createLinearGradient(gx, R.y, gx + R.w * .7, R.y + R.h);
      g.addColorStop(0, "rgba(160,200,255,0)"); g.addColorStop(.5, "rgba(210,230,255,.9)"); g.addColorStop(1, "rgba(160,200,255,0)");
      ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
    }
  }

  // 6 · the carpet laid down on the floor of a house
  function scene6(R, a, p) {
    var k = ease(clamp(p * 1.3, 0, 1));
    ctx.save(); ctx.globalAlpha = a;
    // On phones the details take the top of the screen: the carpet lies smaller, lower, and less turned.
    if (!R.wide) { var sc = 1 - .28 * k; R = { x: R.cx - R.w * sc / 2, y: R.cy - R.h * sc / 2 + R.h * .2 * k, w: R.w * sc, h: R.h * sc, cx: R.cx, cy: R.cy + R.h * .2 * k, wide: false }; }
    var tilt = R.wide ? .55 : .32, sy = 1 - .52 * k, sk = (rtl ? tilt : -tilt) * k, cx = R.cx, cy = R.cy + R.h * .06 * k;
    ctx.translate(cx, cy); ctx.transform(1, 0, sk, sy, 0, 0); ctx.translate(-cx, -R.cy);
    var r2 = { x: R.x, y: R.y, w: R.w, h: R.h };
    // A soft shadow on the floor
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.filter = "blur(18px)"; ctx.fillRect(R.x + 10, R.y + 24, R.w, R.h); ctx.filter = "none";
    fringe(r2, 1, R.h * .04);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(cur.tex, R.x, R.y, R.w, R.h);
    // A little light across the silk
    var g = ctx.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h);
    g.addColorStop(0, "rgba(255,255,255,.12)"); g.addColorStop(.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.18)");
    ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
    ctx.restore();
  }

  var SCENES = [scene0, scene1, scene2, scene3, scene4, scene5, scene6];
  var c = 0;
  function frame0() {
    if (!vw) return;
    c = progress();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    var R = rect();
    for (var i = 0; i < SCENES.length; i++) { var w = weight(c, i); if (w > 0.01) SCENES[i](R, w, local(c, i)); }
    // The words: one chapter at a time, rising into place
    chs.forEach(function (el, i) {
      var w = clamp(1 - Math.abs(c - i) * 2.4, 0, 1), dy = (i - c) * 40;
      el.style.opacity = w.toFixed(3);
      el.style.transform = (R.wide ? "translateY(calc(-50% + " : "translateY(calc(0px + ") + dy.toFixed(1) + "px))";
      el.classList.toggle("live", w > .5);
    });
    var on = Math.round(c);
    dots.forEach(function (d, i) { d.classList.toggle("on", i === on); });
  }

  // Redraw as the page scrolls, and keep the threads, the spindle and the drops moving while the story is on screen.
  var visible = true, raf = 0;
  function tick(now) { time = now || 0; frame0(); raf = visible && !reduced ? requestAnimationFrame(tick) : 0; }
  addEventListener("scroll", function () { if (!raf) requestAnimationFrame(function (n) { time = n; frame0(); }); }, { passive: true });
  addEventListener("resize", resize);
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !raf && !reduced) raf = requestAnimationFrame(tick); }).observe(story);
  resize();
  if (!reduced) raf = requestAnimationFrame(tick);
})();
