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
    // The real carpet: its knots are read from /photos/carpet-knots.png, a flat view made from the photograph
    // (straightened, then mirrored, as the carpet is symmetric), one pixel a knot. The story ends on the photograph.
    { key: "real", W: 72, H: 110, image: "/photos/carpet-knots.png", photo: "/photos/carpet-hall-xl.jpg", link: "/piece?p=carpet", cta: "cp.enquire",
      colors: [["#2f8466", "green"], ["#8a1e2b", "madder"], ["#c4473f", "madder_light"], ["#ece0c2", "ivory"], ["#c99a52", "pomegranate"], ["#2a2420", "walnut"]],
      specs: [["sp.field", "spv.field"], ["sp.medallion", "spv.medallion"], ["sp.corners", "spv.corners"], ["sp.border", "spv.border"]] },
    { key: "garden", W: 60, H: 90, city: "isfahan", fibre: "sp.woolsilk", knots: "sp.knots_o", link: "/#commission", cta: "cp.commission",
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
    { key: "herati", W: 60, H: 90, city: "tabriz", fibre: "sp.wool", knots: "sp.knots_o", link: "/#commission", cta: "cp.commission",
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
  function hex(c) { var n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  // A drawn carpet: each knot's colour comes from its pattern.
  function fromPattern(d) {
    W = d.W; H = d.H;
    var pal = d.colors.map(function (c) { return hex(c[0]); }), cells = [];
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var f = frame(x, y, d.P); cells.push(pal[f >= 0 ? f : d.field(x, y)]); }
    return build(d, cells);
  }
  // The real carpet: each knot's colour comes from one pixel of its flat view.
  function fromImage(d) {
    return new Promise(function (ok, no) {
      var im = new Image();
      im.onload = function () {
        var c = document.createElement("canvas"); c.width = d.W; c.height = d.H;
        var g = c.getContext("2d"); g.drawImage(im, 0, 0);
        var px = g.getImageData(0, 0, d.W, d.H).data, cells = [];
        for (var i = 0; i < d.W * d.H; i++) cells.push([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]);
        W = d.W; H = d.H; ok(build(d, cells));
      };
      im.onerror = no; im.src = d.image;
    });
  }
  function build(d, cells) {
    var tex = document.createElement("canvas"); tex.width = W * KS; tex.height = H * KS;
    var tc = tex.getContext("2d"), img = tc.createImageData(tex.width, tex.height), D = img.data;
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var yy = 0; yy < tex.height; yy++) for (var xx = 0; xx < tex.width; xx++) {
      var c = cells[(yy / KS | 0) * W + (xx / KS | 0)], ky = yy % KS, kx = xx % KS;
      var k = 1 + (ky === 0 ? .1 : ky === KS - 1 ? -.16 : 0) + (kx === KS - 1 ? -.07 : 0) + (rnd() - .5) * .06;
      var o = (yy * tex.width + xx) * 4;
      D[o] = Math.min(255, c[0] * k); D[o + 1] = Math.min(255, c[1] * k); D[o + 2] = Math.min(255, c[2] * k); D[o + 3] = 255;
    }
    tc.putImageData(img, 0, 0);
    // The un-sheared pile: short random hairs over the surface.
    var fuzz = document.createElement("canvas"); fuzz.width = tex.width; fuzz.height = tex.height;
    var fc = fuzz.getContext("2d");
    for (var i = 0; i < 2600; i++) {
      var fx = rnd() * fuzz.width, fy = rnd() * fuzz.height, col = cells[(fy / KS | 0) * W + (fx / KS | 0)];
      fc.strokeStyle = "rgba(" + (col[0] + 40) + "," + (col[1] + 40) + "," + (col[2] + 40) + ",.75)";
      fc.lineWidth = 1; fc.beginPath(); fc.moveTo(fx, fy); fc.lineTo(fx + (rnd() - .5) * 7, fy - rnd() * 7); fc.stroke();
    }
    var th = document.createElement("canvas"); th.width = W; th.height = H;
    th.getContext("2d").drawImage(tex, 0, 0, W, H);
    var out = { d: d, tex: tex, fuzz: fuzz, thumb: th.toDataURL() };
    if (d.photo) { out.photo = new Image(); out.photo.src = d.photo; }
    return out;
  }
  var BUILT, cur = null;
  function use(b) { cur = b; W = b.d.W; H = b.d.H; }

  // ---------------------------------------------------------------------------------------------------------------
  // The picker and the chapters
  // ---------------------------------------------------------------------------------------------------------------
  var pick = $("#cpPick");
  function makePicker() { BUILT.forEach(function (b, i) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-pressed", i === 0);
    btn.innerHTML = '<img src="' + b.thumb + '" alt=""><span>' + esc(t("cp.d" + (i + 1))) + "<small>" + esc(t("cp.d" + (i + 1) + "_s")) + "</small></span>";
    btn.addEventListener("click", function () {
      use(b);
      $$("button", pick).forEach(function (x) { x.setAttribute("aria-pressed", x === btn); });
      details(); frame0();
    });
    pick.appendChild(btn);
  }); }
  function cityName(k) { return window.ARTRA_ROAD && ARTRA_ROAD.city(k) ? ARTRA_ROAD.name(k) : k; }
  function details() {
    var d = cur.d, dyes = d.colors.map(function (c) { return t("dye." + c[1]); }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    // The real carpet is described by what the photograph shows; the drawn ones by their making.
    var rows = d.specs ? d.specs.map(function (r) { return [r[0], t(r[1])]; })
      : [["sp.city", cityName(d.city)], ["sp.fibre", t(d.fibre)], ["sp.knots", t(d.knots)], ["sp.dyes", dyes.join(" · ")]];
    $("#cpSpecs").innerHTML = rows
      .map(function (r) { return "<div><dt>" + esc(t(r[0])) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");
    $("#cpCta").innerHTML = '<a class="btn btn-gold" href="' + d.link + '">' + esc(t(d.cta)) + "</a>";
  }

  var chs = $$(".cp-ch"), dots = $$(".cp-dots li"), story = $("#story");
  var cv = $("#cpCanvas"), ctx = cv.getContext("2d"), vw = 0, vh = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = cv.clientWidth; vh = cv.clientHeight;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    frame0();
  }
  // How far through the story we are: 0 at the start, 6 at the end (one unit a chapter).
  // The story's scroll, in chapters: 0 → 6, then TAIL more after the last chapter has arrived, so its clip (the
  // carpet unrolled in the hall) plays slowly and then holds. The page is 125vh of scroll a chapter (carpet.css).
  var TAIL = 1.6, cRaw = 0;
  function progress() {
    var r = story.getBoundingClientRect(), span = story.offsetHeight - innerHeight;
    cRaw = Math.max(0, Math.min(6 + TAIL, (-r.top / Math.max(1, span)) * (6.4 + TAIL) - .2));
    return Math.min(6, cRaw);
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
    countEl.textContent = t("cp.rows", { r: rows.toLocaleString(T.lang), n: H.toLocaleString(T.lang) });
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
    // The real carpet: the drawing gives way to the photograph, framed in gold.
    var ph = cur.photo, f = clamp((p - .18) / .3, 0, 1);
    if (ph && ph.complete && ph.naturalWidth && f > 0) {
      // Beside the words on wide screens (never over them), below them on phones.
      var textEdge = Math.max(32, (vw - 1180) / 2) + Math.min(470, vw * .4) + 40;
      var fw = R.wide ? Math.min(vw - textEdge - 70, 900) : vw - 32, fh = fw / (R.wide ? 1.6 : 1.45);
      if (R.wide && fh > vh * .62) { fh = vh * .62; fw = fh * 1.6; }
      if (!R.wide) fh = Math.min(fh, vh * .34);
      var fx = R.wide ? (rtl ? vw - textEdge - fw : textEdge + (vw - textEdge - 70 - fw) / 2) : 16, fy = R.wide ? vh * .5 - fh / 2 : vh * .66 - fh / 2;
      // Fill the frame with the middle of the photograph, where the carpet is.
      var sr = fw / fh, sw = ph.naturalWidth, sh = ph.naturalHeight, cw2 = Math.min(sw, sh * sr), ch2 = cw2 / sr;
      ctx.save(); ctx.globalAlpha = a * ease(f);
      ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
      ctx.fillStyle = "#081a42"; ctx.fillRect(fx - 6, fy - 6, fw + 12, fh + 12); ctx.shadowColor = "transparent";
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(ph, (sw - cw2) / 2, Math.max(0, sh - ch2), cw2, ch2, fx, fy, fw, fh);
      ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 1.2; ctx.strokeRect(fx - 6, fy - 6, fw + 12, fh + 12);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Real imagery. The real carpet's photograph opens the story (a slow camera drift) and gives the close-up for
  // shearing and washing. Filmed or generated clips, when there are any, replace a chapter's drawing: list them in
  // CLIPS by chapter (0–6), encoded with a keyframe on every frame so they can be scrubbed both ways:
  //   ffmpeg -i in.mp4 -an -vf "scale=1920:-2,fps=30" -c:v libx264 -g 1 -crf 23 -pix_fmt yuv420p -movflags +faststart carpet-N.mp4
  // ---------------------------------------------------------------------------------------------------------------
  // fx: where the subject sits across the frame (0 left, 1 right), kept in view when a narrow screen crops the clip.
  var CLIPS = {
    1: { src: "/photos/carpet-1c.mp4", fx: .72, dz: .72 },     // spinning: wool drawn into thread onto the spindle (made with Gemini)
    2: { src: "/photos/carpet-2c.mp4", fx: .7, dz: .72 },      // dyeing: skeins dipped in copper vats, then hung dripping (made with Gemini)
    4: { src: "/photos/carpet-4c.mp4", fx: .8, dz: .72 },  // the loom: a knot tied and cut, then the row beaten down with the comb (two Gemini clips)
    5: { src: "/photos/carpet-5d.mp4", fx: .7, dz: .72 },  // the finish: the fringe trimmed with shears, then water poured across the carpet (made with Gemini)
    6: { src: "/photos/carpet-6d.mp4", fx: .6, dz: .72, band: true, hold: .25 },  // laid down: the carpet unrolled across a marble hall (made with Gemini); beside the words on computers, below them on phones; ends early to hold on the hall
    3: { src: "/photos/carpet-3c.mp4", fx: .66, dz: .58 }  // the chart: the design painted on graph paper (made with Gemini); shown smaller on wide screens to keep the bright paper clear of the words
  };
  var VIDS = {};
  Object.keys(CLIPS).forEach(function (k) {
    var v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.preload = "auto"; v.src = CLIPS[k].src; v.fx = CLIPS[k].fx; v.dz = CLIPS[k].dz || 1; v.band = !!CLIPS[k].band; v.hold = CLIPS[k].hold || 0;
    v.addEventListener("loadeddata", function () { v.ready = true; frame0(); });
    v.addEventListener("seeked", function () { frame0(); });
    v.load();
    VIDS[k] = v;
  });
  // Some phones only decode a video's frames once it has been played: play and pause each clip at the first touch or scroll.
  function prime() {
    Object.keys(VIDS).forEach(function (k) { var v = VIDS[k], pr = v.play(); if (pr && pr.then) pr.then(function () { v.pause(); }).catch(function () {}); });
    removeEventListener("touchstart", prime); removeEventListener("scroll", prime);
  }
  addEventListener("touchstart", prime, { passive: true }); addEventListener("scroll", prime, { passive: true });
  // Fill the stage with an image or video frame, framed by a focus point and zoom; darken the side the words are on.
  function cover(src, sw, sh, zoom, fx, fy, a, clear) {
    var s = Math.max(vw / sw, vh / sh) * zoom, w = sw * s, h = sh * s;
    var x = vw / 2 - fx * w + (fx - .5) * vw * .0, y = vh / 2 - fy * h;
    x = Math.min(0, Math.max(vw - w, x)); y = Math.min(0, Math.max(vh - h, y));
    ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(src, x, y, w, h);
    if (clear) { ctx.restore(); return; }                             // the picture as it is, no shading
    var wide = vw > 900, g = wide ? ctx.createLinearGradient(rtl ? vw : 0, 0, rtl ? 0 : vw, 0) : ctx.createLinearGradient(0, 0, 0, vh);
    // Shaded only behind the words (more on an ivory ground); the picture keeps its colour on the far side.
    g.addColorStop(0, shade(.88 + .08 * warm)); g.addColorStop(wide ? .36 : .34, shade(.5 + .38 * warm)); g.addColorStop(wide ? .58 : .55, shade(0)); g.addColorStop(1, shade(0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
    ctx.restore();
  }
  // A clip shown smaller than the screen: against the side away from the words, its edges melting into the ground.
  function inset(src, sw, sh, zoom, a) {
    // The clips come from small previews: never enlarge one past 1.6 times its own size.
    var s = Math.min(Math.max(vw / sw, vh / sh) * zoom, 1.6), w = sw * s, h = sh * s, x = rtl ? 0 : vw - w, y = (vh - h) / 2;
    // Only the part clear of the words is shown, in its own colours (no wash over it): it begins where the words end.
    var textEdge = Math.max(32, (vw - 1180) / 2) + Math.min(470, vw * .4) + 40;
    var x0 = rtl ? x : Math.max(x, textEdge), x1 = rtl ? Math.min(x + w, vw - textEdge) : x + w, vwid = x1 - x0;
    if (vwid <= 0) return;
    var b = layer(vwid, h); b.drawImage(src, (x0 - x) / s, 0, vwid / s, sh, 0, 0, vwid, h);
    // Soft edges only: a short fade at the top, the bottom and the side towards the words
    var m = b.createLinearGradient(0, 0, 0, h);
    m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(.16, "rgba(0,0,0,1)"); m.addColorStop(.84, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)");
    b.globalCompositeOperation = "destination-in"; b.fillStyle = m; b.fillRect(0, 0, vwid, h);
    var f = Math.min(60, vwid * .08), mx = rtl ? b.createLinearGradient(vwid, 0, vwid - f, 0) : b.createLinearGradient(0, 0, f, 0);
    mx.addColorStop(0, "rgba(0,0,0,0)"); mx.addColorStop(1, "rgba(0,0,0,1)");
    b.fillStyle = mx; b.fillRect(0, 0, vwid, h); b.globalCompositeOperation = "source-over";
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(bandC, 0, 0, Math.ceil(vwid * dpr), Math.ceil(h * dpr), x0, y, vwid, h); ctx.restore();
  }
  // Three versions of the page's colours; THEME picks the one the site shows:
  //   "navy":  the whole story in navy;
  //   "mixed": navy, with the chapters whose footage is light (III, the chart; VI, the hall) on ivory;
  //   "beige": the whole story on ivory, the dark clips shown smaller and further from the words.
  // Any version can be previewed with ?theme=navy, ?theme=mixed or ?theme=beige in the address.
  var THEMES = { navy: [], mixed: [3, 6], beige: [0, 1, 2, 3, 4, 5, 6] };
  var THEME = "beige";
  var asked = (new URLSearchParams(location.search).get("theme") || "").toLowerCase();
  var IVORY = THEMES[THEMES.hasOwnProperty(asked) ? asked : THEME];
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var warm = 0, stageEl = document.querySelector(".cp-stage");
  function shade(o) {                // the ground colour behind the words: navy, or ivory in the chapters told on ivory
    var r = Math.round(3 + (241 - 3) * warm), g = Math.round(12 + (233 - 12) * warm), b = Math.round(39 + (219 - 39) * warm);
    return "rgba(" + r + "," + g + "," + b + "," + o + ")";
  }
  var bandC = document.createElement("canvas"), bandX = bandC.getContext("2d");
  function layer(w, h) {
    var bw = Math.ceil(w * dpr), bh = Math.ceil(h * dpr);
    if (bandC.width < bw || bandC.height < bh) { bandC.width = Math.max(bandC.width, bw); bandC.height = Math.max(bandC.height, bh); }
    var b = bandX; b.setTransform(dpr, 0, 0, dpr, 0, 0); b.globalCompositeOperation = "source-over"; b.clearRect(0, 0, w + 2, h + 2);
    b.imageSmoothingEnabled = true; return b;
  }
  function band(src, sw, sh, fx, a) {
    var wide = vw > 900, s = wide ? Math.min(Math.max(vw / sw, vh * .5 / sh), 1.7) : vh * .36 / sh, w = sw * s, h = sh * s;
    var x = Math.min(0, Math.max(vw - w, vw * .5 - fx * w)), y = wide ? (vh - h) / 2 : vh * .7 - h / 2;
    // Drawn on its own layer, then faded out at the top and bottom, so the band melts into the page behind it.
    var b = layer(vw, h), bw = Math.ceil(vw * dpr), bh = Math.ceil(h * dpr); b.drawImage(src, x, 0, w, h);
    if (wide) {
      // Darker behind the words and the carpet's details
      var g = b.createLinearGradient(rtl ? vw : 0, 0, rtl ? 0 : vw, 0);
      g.addColorStop(0, shade(.94)); g.addColorStop(.36, shade(.86)); g.addColorStop(.56, shade(.25)); g.addColorStop(.7, shade(0));
      b.fillStyle = g; b.fillRect(0, 0, vw, h);
    }
    var m = b.createLinearGradient(0, 0, 0, h);
    m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(.24, "rgba(0,0,0,1)"); m.addColorStop(.76, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)");
    b.globalCompositeOperation = "destination-in"; b.fillStyle = m; b.fillRect(0, 0, vw, h); b.globalCompositeOperation = "source-over";
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(bandC, 0, 0, bw, bh, 0, y, vw, h); ctx.restore();
  }
  function clipScene(i) {
    return function (R, a, p) {
      var v = VIDS[i];
      if (!v.ready || !v.duration) return baseScene(i)(R, a, p);      // until the clip has loaded
      if (i === SCENES.length - 1) p = clamp((cRaw - 5.5) / (.5 + TAIL), 0, 1);   // the last clip runs on through the tail
      var tt = clamp(p / (1 - v.hold), 0, 1) * (v.duration - .05);
      if (Math.abs(v.currentTime - tt) > .03 && !v.seeking) v.currentTime = tt;
      if (vw <= 900) cover(v, v.videoWidth, v.videoHeight, 1, v.fx, .5, a, true);   // on phones, the whole screen, the words on top
      else if (v.dz < 1) inset(v, v.videoWidth, v.videoHeight, v.dz - .12 * warm * (v.dz > .6), a);   // a little smaller on ivory
      else cover(v, v.videoWidth, v.videoHeight, 1, vw > 900 ? .6 : v.fx, .5, a);
    };
  }
  function photoReady() { var ph = cur.photo; return ph && ph.complete && ph.naturalWidth ? ph : null; }
  // 0 · the real carpet in its hall: a slow drift towards the medallion
  function photo0(R, a, p) {
    var ph = photoReady(); if (!ph) return scene0(R, a, p);
    var drift = reduced ? 0 : Math.sin(time / 6000) * .01;
    cover(ph, ph.naturalWidth, ph.naturalHeight, 1.08 + p * .18 + drift, .5 + drift, .45 - p * .1, a);
  }
  // 5 · close on the real pile and border; the shears' work is done, then a sheen of water passes
  function photo5(R, a, p) {
    var ph = photoReady(); if (!ph) return scene5(R, a, p);
    cover(ph, ph.naturalWidth, ph.naturalHeight, 1.7 - p * .35, .4 + p * .12, .84 - p * .08, a);
    var wash = clamp((p - .2) / .8, 0, 1);
    if (wash > 0 && wash < 1) {
      ctx.save(); ctx.globalAlpha = a * Math.sin(wash * Math.PI) * .22;
      var gx = -vw * .6 + wash * vw * 2.2, g = ctx.createLinearGradient(gx, 0, gx + vw * .5, vh);
      g.addColorStop(0, "rgba(190,215,255,0)"); g.addColorStop(.5, "rgba(225,238,255,.85)"); g.addColorStop(1, "rgba(190,215,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh); ctx.restore();
    }
  }
  // ---------------------------------------------------------------------------------------------------------------
  // 3 · for the real carpet: the design drawn in ink, stroke by stroke, then filled with its colours.
  // The drawing follows the carpet's layout as measured on the photograph (on a 600 × 920 plan): the bands of the
  // border, the eight-pointed medallion (radius 97), the pendants on the long axis, the ivory corners and the flowers.
  // Strokes are made for one quarter and drawn four times at once, mirrored, as the carpet is symmetric.
  // ---------------------------------------------------------------------------------------------------------------
  var PW = 600, PH = 920, MX = 300, MY = 460, INK = null;
  function makeInk() {
    var S = [];                                   // [{ g: group, p: [x0, y0, x1, y1, ...] }]
    function add(g, pts) { if (pts.length >= 4) S.push({ g: g, p: pts }); }
    function poly(g, f, n) { var a = []; for (var i = 0; i <= n; i++) { var q = f(i / n); a.push(q[0], q[1]); } add(g, a); }
    // A path along the border: from the middle of the top edge to the corner, then down to the middle of the side.
    function along(ox, oy) {
      var top = MX - ox, side = MY - oy, L = top + side;
      return { L: L, at: function (s) {
        if (s < top) return { x: MX - s, y: oy, nx: 0, ny: 1 };
        return { x: ox, y: oy + (s - top), nx: 1, ny: 0 };
      } };
    }
    function frameL(ox, oy) { add(1, [MX, oy, ox, oy, ox, MY]); }
    // 1 · the frame: guard lines and the edges of the border
    [[4, 8], [18, 28], [66, 82], [88, 100]].forEach(function (o) { frameL(o[0], o[1]); });
    // 2 · the guards: a running wave outside, a chain of small rosettes inside
    (function () {
      var a = along(11, 18), pts = [];
      for (var s = 0; s <= a.L; s += 2) { var q = a.at(s), w = Math.sin(s / 5) * 3; pts.push(q.x + q.nx * w, q.y + q.ny * w); }
      add(2, pts);
      var b = along(77, 91);
      for (var t = 6; t < b.L; t += 15) { var c = b.at(t); poly(2, function (u) { var A = u * Math.PI * 2; return [c.x + Math.cos(A) * 3.2, c.y + Math.sin(A) * 3.2]; }, 12); }
    })();
    // 3 · the border: a vine along the middle of the band, with palmettes on alternate sides and rosettes between
    (function () {
      var a = along(42, 55), vine = [], P = 64;
      for (var s = 0; s <= a.L; s += 2) { var q = a.at(s), w = Math.sin(s / P * Math.PI * 2) * 11; vine.push(q.x + q.nx * w, q.y + q.ny * w); }
      add(3, vine);
      for (var k = 0, s2 = P / 4; s2 < a.L; s2 += P / 2, k++) {
        var q2 = a.at(s2), side = k % 2 ? 1 : -1, bx = q2.x + q2.nx * 11 * side, by = q2.y + q2.ny * 11 * side;
        var dx = q2.nx * side, dy = q2.ny * side, tx = -q2.ny, ty = q2.nx;
        // a palmette: a teardrop leaning off the vine, with an inner line
        [[1, 1], [.62, .58]].forEach(function (m) {
          poly(4, function (u) {
            var A = u * Math.PI * 2, len = 19 * m[0], wid = 9 * m[1];
            var along2 = (1 - Math.cos(A)) / 2 * len, across = Math.sin(A) * wid * (1 - (1 - Math.cos(A)) / 2 * .55);
            return [bx + dx * along2 * .9 + tx * across, by + dy * along2 * .9 + ty * across];
          }, 26);
        });
        // a small rosette on the far side
        var rx = q2.x - q2.nx * 9 * side, ry = q2.y - q2.ny * 9 * side;
        poly(4, function (u) { var A = u * Math.PI * 2, r = 5.5 * Math.abs(Math.cos(A * 3)); return [rx + Math.cos(A) * (r + 1.4), ry + Math.sin(A) * (r + 1.4)]; }, 40);
      }
    })();
    // 4 · the ivory corners: a scalloped arabesque reaching along the top and down the side, with scrolls inside
    (function () {
      var ox = 92, oy = 102;
      [[1, 9, 1], [.72, 7, .7]].forEach(function (m) {
        poly(5, function (u) {
          var A = u * Math.PI / 2, rx = 150 * m[0], ry = 168 * m[0], sc = Math.sin(u * Math.PI * m[1]) * 7 * m[2];
          return [ox + Math.cos(A) * (rx + sc), oy + Math.sin(A) * (ry + sc)];
        }, 120);
      });
      [[150, 140, 15, 1], [118, 200, 13, -1], [196, 120, 12, -1], [126, 132, 9, 1]].forEach(function (c) {
        poly(5, function (u) { var A = u * Math.PI * 4 * c[3], r = c[2] * (1 - u * .82); return [c[0] + Math.cos(A) * r, c[1] + Math.sin(A) * r]; }, 70);
      });
    })();
    // 5 · the medallion: an eight-pointed star, a second star inside, a ring and a rosette (one quarter, mirrored)
    (function () {
      function star(R1, R2, n) {
        poly(6, function (u) {
          var A = Math.PI + u * Math.PI / 2, k = (A - Math.PI) / (Math.PI / 2) * n, f = Math.abs((k % 1) - .5) * 2;
          var r = R2 + (R1 - R2) * f; return [MX + Math.cos(A) * r, MY + Math.sin(A) * r];
        }, 80);
      }
      star(104, 76, 2); star(97, 66, 2); star(64, 44, 2);
      poly(6, function (u) { var A = Math.PI + u * Math.PI / 2; return [MX + Math.cos(A) * 34, MY + Math.sin(A) * 34]; }, 30);
      poly(6, function (u) { var A = Math.PI + u * Math.PI / 2, r = 24 * Math.abs(Math.cos(A * 4)) + 4; return [MX + Math.cos(A) * r, MY + Math.sin(A) * r]; }, 60);
      for (var i = 0; i < 3; i++) { var A = Math.PI + (i + .5) * Math.PI / 6, x = MX + Math.cos(A) * 82, y = MY + Math.sin(A) * 82;
        poly(6, function (u) { var B = u * Math.PI * 2; return [x + Math.cos(B) * 5, y + Math.sin(B) * 5]; }, 14); }
    })();
    // 6 · the pendants on the long axis: a lozenge flower, then a spearhead finial (left halves, mirrored)
    (function () {
      poly(7, function (u) { var y = 210 + u * 58, w = Math.sin(u * Math.PI) * 24 * (1 - u * .25); return [MX - w, y]; }, 40);
      poly(7, function (u) { var y = 222 + u * 34, w = Math.sin(u * Math.PI) * 13; return [MX - w, y]; }, 30);
      poly(7, function (u) { var y = 268 + u * 30; return [MX - 3, y]; }, 4);
      poly(7, function (u) { var y = 128 + u * 52, w = Math.pow(Math.sin(u * Math.PI * .5), .6) * 12 * (1 - u * .1); return [MX - w * (u < .85 ? 1 : (1 - u) / .15), y]; }, 30);
      poly(7, function (u) { var A = Math.PI / 2 + u * Math.PI; return [MX + Math.cos(A) * 6, 300 + Math.sin(A) * 6]; }, 14);
    })();
    // 7 · the flowers of the field, and the vines that join them
    var F = [[150, 383, 17], [205, 205, 15], [226, 318, 14], [150, 262, 13], [252, 140, 11], [128, 455, 12], [210, 425, 11], [160, 160, 9], [255, 395, 10]];
    F.forEach(function (f) {
      poly(8, function (u) { var A = u * Math.PI * 2, r = f[2] * (.55 + .45 * Math.abs(Math.cos(A * 4))); return [f[0] + Math.cos(A) * r, f[1] + Math.sin(A) * r]; }, 64);
      poly(8, function (u) { var A = u * Math.PI * 2; return [f[0] + Math.cos(A) * f[2] * .3, f[1] + Math.sin(A) * f[2] * .3]; }, 16);
    });
    [[0, 3], [3, 1], [1, 4], [1, 2], [2, 8], [0, 6], [0, 5], [3, 7], [6, 8]].forEach(function (e, i) {
      var a = F[e[0]], b = F[e[1]], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1, bend = (i % 2 ? 1 : -1) * 18;
      poly(9, function (u) { var w = 4 * u * (1 - u) * bend; return [a[0] + (b[0] - a[0]) * u + nx / l * w, a[1] + (b[1] - a[1]) * u + ny / l * w]; }, 30);
      var sx = mx + nx / l * bend * .9, sy = my + ny / l * bend * .9;
      poly(9, function (u) { var A = u * Math.PI * 3, r = 7 * (1 - u * .8); return [sx + Math.cos(A) * r, sy + Math.sin(A) * r]; }, 30);
    });
    // Order: group by group, and inside a group from the frame inwards; measure each stroke for drawing.
    S.forEach(function (st) { var L = 0, P2 = st.p; for (var i = 2; i < P2.length; i += 2) L += Math.hypot(P2[i] - P2[i - 2], P2[i + 1] - P2[i - 1]); st.L = L; });
    S.sort(function (a, b) { return a.g - b.g; });
    var total = 0; S.forEach(function (st) { st.from = total; total += st.L; });
    return { strokes: S, total: total };
  }
  function inkMap(R, a, p) {
    if (!INK) INK = makeInk();
    // The paper stays solid while the pen works: the drawing runs from 15% to 72% of the chapter, the colour after.
    a = clamp(a * 2.2, 0, 1);
    var draw = ease(clamp((p - .15) / .57, 0, 1)) * INK.total, colour = clamp((p - .74) / .24, 0, 1);
    var sx = R.w / PW, sy = R.h / PH;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = "#f1ead8"; ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 18;
    ctx.fillRect(R.x, R.y, R.w, R.h); ctx.shadowColor = "transparent";
    // The knot grid, faint, as on a designer's chart
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(60,50,40,.07)";
    for (var gx = 0; gx <= W; gx++) { ctx.beginPath(); ctx.moveTo(R.x + gx * R.w / W, R.y); ctx.lineTo(R.x + gx * R.w / W, R.y + R.h); ctx.stroke(); }
    for (var gy = 0; gy <= H; gy++) { ctx.beginPath(); ctx.moveTo(R.x, R.y + gy * R.h / H); ctx.lineTo(R.x + R.w, R.y + gy * R.h / H); ctx.stroke(); }
    // Colour comes in under the drawing at the end, knot by knot
    if (colour > 0) { ctx.globalAlpha = a * ease(colour) * .9; ctx.imageSmoothingEnabled = false; ctx.drawImage(cur.tex, R.x, R.y, R.w, R.h); ctx.globalAlpha = a; }
    ctx.strokeStyle = colour > .5 ? "rgba(28,34,53," + (1 - (colour - .5) * 1.2) + ")" : "#1c2235";
    ctx.lineWidth = Math.max(.8, R.w / 520); ctx.lineCap = "round"; ctx.lineJoin = "round";
    var tip = null;
    INK.strokes.forEach(function (st) {
      if (st.from >= draw) return;
      var left = draw - st.from, P2 = st.p;
      for (var m = 0; m < 4; m++) {
        var fx = m & 1 ? -1 : 1, fy = m & 2 ? -1 : 1;
        ctx.beginPath();
        var acc = 0, x0 = P2[0], y0 = P2[1];
        ctx.moveTo(R.x + (MX + (x0 - MX) * fx) * sx, R.y + (MY + (y0 - MY) * fy) * sy);
        for (var i = 2; i < P2.length; i += 2) {
          var x1 = P2[i], y1 = P2[i + 1], d = Math.hypot(x1 - x0, y1 - y0);
          if (acc + d > left) { var f = (left - acc) / d; x1 = x0 + (x1 - x0) * f; y1 = y0 + (y1 - y0) * f; ctx.lineTo(R.x + (MX + (x1 - MX) * fx) * sx, R.y + (MY + (y1 - MY) * fy) * sy); if (m === 0) tip = [x1, y1]; break; }
          acc += d; ctx.lineTo(R.x + (MX + (x1 - MX) * fx) * sx, R.y + (MY + (y1 - MY) * fy) * sy); x0 = x1; y0 = y1;
        }
        ctx.stroke();
      }
    });
    // The pen's nib, where the line is being drawn
    if (tip && draw < INK.total) { ctx.fillStyle = "#c9a24a"; ctx.beginPath(); ctx.arc(R.x + tip[0] * sx, R.y + tip[1] * sy, Math.max(2, R.w / 180), 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  var DRAWN = [scene0, scene1, scene2, scene3, scene4, scene5, scene6];
  // Which scene each chapter shows: a clip if there is one, else the real photograph (real carpet), else the drawing.
  function sceneFor(i) { return VIDS[i] && cur.d.photo ? clipScene(i) : baseScene(i); }
  function baseScene(i) {
    if (cur.d.photo && i === 0) return photo0;
    if (cur.d.photo && i === 5) return photo5;
    if (cur.d.photo && i === 3) return inkMap;
    return DRAWN[i];
  }
  var SCENES = { length: 7 };
  var c = 0;
  function frame0() {
    if (!vw || !cur) return;
    c = progress();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    var R = rect();
        // Light footage (the chart on paper, the hall) is told on ivory; the rest of the story stays in the navy night.
    warm = 0;
    if (IVORY.length >= SCENES.length) warm = 1;                    // every chapter on ivory
    else IVORY.forEach(function (k) {
      warm = Math.max(warm, k === SCENES.length - 1 ? ease(clamp((c - 5.45) / .4, 0, 1)) : ease(clamp((.62 - Math.abs(c - k) ) / .3, 0, 1)));
    });
    stageEl.style.setProperty("--warm", warm.toFixed(3)); stageEl.classList.toggle("is-warm", warm > .5); var ivory = warm > .5 && IVORY.length >= SCENES.length;   // the menu bar, footer and browser bar turn ivory only when the whole story is
    if (ivory !== document.body.classList.contains("cp-warm")) {
      document.body.classList.toggle("cp-warm", ivory);
      if (themeMeta) themeMeta.setAttribute("content", ivory ? "#f8f3e9" : "#05112f");   // the browser's own bar, on phones
    }
    for (var i = 0; i < SCENES.length; i++) { var w = weight(c, i); if (w > 0.01) sceneFor(i)(R, w, local(c, i)); }
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
  // The drawn carpets are made at once; the real one waits for its image. It comes first.
  var drawn = DESIGNS.filter(function (d) { return !d.image; }).map(fromPattern);
  var real = DESIGNS.filter(function (d) { return d.image; });
  Promise.all(real.map(function (d) { return fromImage(d).catch(function () { return null; }); })).then(function (r) {
    BUILT = r.filter(Boolean).concat(drawn);
    use(BUILT[0]); makePicker(); details(); frame0();
    if (!reduced) raf = requestAnimationFrame(tick);
  });
})();
