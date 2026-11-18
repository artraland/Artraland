// ARTRA — the account page (/account): sign in or create an account, then a profile with tabs for each role.
//   Client (everyone):  Profile · Saved pieces · My orders (with tracking) · My enquiries
//   Product provider:   + My pieces (add, edit, send for review)
//   Sales:              + Enquiries desk · Orders desk (record sales, update tracking) · Expertise desk
//   Expert:             Expertise desk (the appraisals assigned to them) + the client tabs
//   Admin:              + Review pieces · People (roles) — and everything above
//   Everyone also has My appraisals: their appraisal requests, stage by stage (appraisal code below).
// Every request is checked on the server (api/); this page only shows what the server allows.
(function () {
  "use strict";
  var T = window.ARTRA_I18N, t = T.t, lang = T.lang;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function attr(s) { return esc(s).replace(/"/g, "&quot;"); }

  ARTRA_ART.mount(document);
  $("#year").textContent = new Date().getFullYear();
  var burger = $("#burger"), nav = $("#nav");
  burger.addEventListener("click", function () { var o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
  $("#top").classList.add("scrolled");

  var PRODUCTS = ARTRA_ART.products();
  var BY_SLUG = {};
  PRODUCTS.forEach(function (p) { BY_SLUG[p.slug] = p; });

  // ---- Talking to the server ----
  function api(method, path, data) {
    var isFile = data instanceof Blob;
    var headers = {};
    if (method !== "GET") headers["X-Artra"] = "1";
    if (data !== undefined) headers["Content-Type"] = isFile ? data.type : "application/json";
    return fetch(path, { method: method, headers: headers, credentials: "same-origin", body: data === undefined ? undefined : isFile ? data : JSON.stringify(data) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) { var e = new Error(j.error || "generic"); e.code = j.error || "generic"; e.status = r.status; throw e; }
          return j;
        });
      });
  }
  function errText(e) { var k = "err." + (e && e.code); var s = t(k); return s === k ? t("err.generic") : s; }

  // ---- Formatting ----
  function date(d) { try { return new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(new Date(d)); } catch (e) { return String(d).slice(0, 10); } }
  function dateTime(d) { try { return new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short" }).format(new Date(d)); } catch (e) { return String(d).slice(0, 16); } }
  function money(n, cur) { if (n == null || n === "") return ""; try { return new Intl.NumberFormat(lang, { style: "currency", currency: cur || "EUR" }).format(Number(n)); } catch (e) { return n + " " + cur; } }
  function pill(kind, value) { return '<span class="pill pill-' + attr(value) + '">' + esc(t(kind + "." + value)) + "</span>"; }
  function pieceName(slug) { var p = BY_SLUG[slug]; return p ? p.name : slug || ""; }
  function thumb(slug) {
    var p = BY_SLUG[slug], box = document.createElement("div");
    box.className = "thumb";
    if (!p) return box;
    var art = ARTRA_ART.make(p.key);
    if (art) box.appendChild(art);
    else if (p.cutout || p.photo) { var img = new Image(); img.src = p.cutout || p.photo; img.alt = ""; img.loading = "lazy"; box.appendChild(img); }
    return box;
  }
  function flash(el, text, bad) {
    el.textContent = text; el.className = "note " + (bad ? "bad" : "good");
    clearTimeout(el._t); el._t = setTimeout(function () { el.textContent = ""; el.className = "note"; }, 4000);
  }

  var app = $("#app"), user = null;

  // =====================================================================================================
  // Signed out: sign in / create an account
  // =====================================================================================================
  function renderAuth(mode) {
    mode = mode || "signin";
    app.innerHTML =
      '<section class="acc-auth">' +
        '<p class="eyebrow">' + esc(t("a.title")) + "</p>" +
        "<h1>" + esc(t(mode === "signin" ? "a.signin" : "a.signup")) + "</h1>" +
        '<p class="muted">' + esc(t("a.lede_out")) + "</p>" +
        '<div class="seg" role="tablist">' +
          '<button type="button" role="tab" data-mode="signin" aria-selected="' + (mode === "signin") + '">' + esc(t("a.signin")) + "</button>" +
          '<button type="button" role="tab" data-mode="signup" aria-selected="' + (mode === "signup") + '">' + esc(t("a.signup")) + "</button>" +
        "</div>" +
        '<form class="form acc-form" id="authForm" novalidate>' +
          (mode === "signup" ? '<label><span>' + esc(t("a.name")) + '</span><input name="name" required autocomplete="name"></label>' : "") +
          '<label><span>' + esc(t("a.email")) + '</span><input name="email" type="email" required autocomplete="email" dir="ltr"></label>' +
          '<label><span>' + esc(t("a.password")) + '</span><input name="password" type="password" required minlength="8" autocomplete="' + (mode === "signup" ? "new-password" : "current-password") + '" dir="ltr">' +
            (mode === "signup" ? '<small>' + esc(t("a.password_hint")) + "</small>" : "") + "</label>" +
          '<button class="btn btn-gold" type="submit">' + esc(t(mode === "signin" ? "a.signin_btn" : "a.signup_btn")) + "</button>" +
          '<p class="note" id="authNote" role="status"></p>' +
        "</form>" +
      "</section>";
    $$(".seg button", app).forEach(function (b) { b.addEventListener("click", function () { renderAuth(b.getAttribute("data-mode")); }); });
    $("#authForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = ev.target, note = $("#authNote");
      var payload = { action: mode, email: f.email.value, password: f.password.value, lang: lang };
      if (mode === "signup") payload.name = f.name.value;
      f.querySelector("button").disabled = true;
      api("POST", "/api/auth", payload).then(function (j) {
        user = j.user;
        // Back to the page that sent them here (for example a piece they wanted to save).
        var next = new URLSearchParams(location.search).get("next");
        if (next && /^\/[^\/\\]/.test(next)) { location.assign(next); return; }
        renderDashboard();
      })
        .catch(function (e) { flash(note, errText(e), true); f.querySelector("button").disabled = false; });
    });
  }

  // =====================================================================================================
  // Signed in: the profile with its tabs
  // =====================================================================================================
  var TABS = {
    client: ["orders", "appraisals", "favorites", "enquiries", "profile"],
    provider: ["products", "orders", "appraisals", "favorites", "enquiries", "profile"],
    sales: ["desk_enquiries", "desk_orders", "desk_appraisals", "orders", "appraisals", "favorites", "enquiries", "profile"],
    expert: ["desk_appraisals", "appraisals", "orders", "favorites", "enquiries", "profile"],
    admin: ["review", "desk_enquiries", "desk_orders", "desk_appraisals", "products", "people", "orders", "appraisals", "favorites", "enquiries", "profile"]
  };
  var RENDER = {};

  function renderDashboard() {
    var tabs = TABS[user.role] || TABS.client;
    var want = location.hash.slice(1);
    var tab = tabs.indexOf(want) > -1 ? want : tabs[0];
    app.innerHTML =
      '<section class="acc-head">' +
        '<div><p class="eyebrow">' + esc(t("a.title")) + "</p>" +
        "<h1>" + esc(t("a.welcome", { name: user.name.split(" ")[0] || user.name })) + "</h1>" +
        '<p class="muted"><span class="role role-' + attr(user.role) + '">' + esc(t("role." + user.role)) + "</span> · " + esc(user.email) + "</p></div>" +
        '<button class="btn btn-ghost" id="signout" type="button">' + esc(t("a.signout")) + "</button>" +
      "</section>" +
      '<nav class="acc-tabs" role="tablist">' + tabs.map(function (k) {
        return '<a href="#' + k + '" role="tab" data-tab="' + k + '"' + (k === tab ? ' aria-selected="true" class="on"' : "") + ">" + esc(t("tab." + k)) + "</a>";
      }).join("") + "</nav>" +
      '<section class="acc-panel" id="panel" role="tabpanel"></section>';
    $("#signout").addEventListener("click", function () {
      api("POST", "/api/auth", { action: "signout" }).finally(function () { user = null; history.replaceState(null, "", location.pathname + location.search); renderAuth(); });
    });
    showTab(tab);
  }
  function showTab(tab) {
    $$(".acc-tabs a").forEach(function (a) { var on = a.getAttribute("data-tab") === tab; a.classList.toggle("on", on); a.setAttribute("aria-selected", on); });
    var panel = $("#panel");
    panel.innerHTML = '<p class="muted">' + esc(t("a.loading")) + "</p>";
    Promise.resolve(RENDER[tab](panel)).catch(function (e) {
      if (e && e.status === 401) { user = null; renderAuth(); return; }
      panel.innerHTML = '<p class="note bad">' + esc(errText(e)) + "</p>";
    });
  }
  addEventListener("hashchange", function () {
    if (!user) return;
    var tabs = TABS[user.role] || TABS.client, k = location.hash.slice(1);
    if (tabs.indexOf(k) > -1) showTab(k);
  });

  // ---- Profile ----
  RENDER.profile = function (panel) {
    var langs = T.langs.map(function (l) { return '<option value="' + l + '"' + (l === user.lang ? " selected" : "") + ">" + esc(t("lang." + l)) + "</option>"; }).join("");
    panel.innerHTML =
      '<div class="acc-grid">' +
        '<form class="form acc-form" id="profileForm">' +
          "<h2>" + esc(t("tab.profile")) + "</h2>" +
          '<label><span>' + esc(t("a.name")) + '</span><input name="name" required value="' + attr(user.name) + '"></label>' +
          '<label><span>' + esc(t("a.email")) + '</span><input value="' + attr(user.email) + '" disabled dir="ltr"></label>' +
          '<label><span>' + esc(t("p.phone")) + '</span><input name="phone" type="tel" value="' + attr(user.phone) + '" dir="ltr"></label>' +
          '<label><span>' + esc(t("p.country")) + '</span><input name="country" value="' + attr(user.country) + '"></label>' +
          '<label><span>' + esc(t("p.address")) + '</span><textarea name="address" rows="3">' + esc(user.address) + "</textarea></label>" +
          '<label><span>' + esc(t("p.lang")) + '</span><select name="lang">' + langs + "</select></label>" +
          '<button class="btn btn-gold" type="submit">' + esc(t("p.save")) + "</button><p class=\"note\" id=\"profileNote\" role=\"status\"></p>" +
        "</form>" +
        '<form class="form acc-form" id="pwForm">' +
          "<h2>" + esc(t("p.password_title")) + "</h2>" +
          '<label><span>' + esc(t("p.current")) + '</span><input name="current" type="password" required autocomplete="current-password" dir="ltr"></label>' +
          '<label><span>' + esc(t("p.new")) + '</span><input name="next" type="password" required minlength="8" autocomplete="new-password" dir="ltr"><small>' + esc(t("a.password_hint")) + "</small></label>" +
          '<button class="btn btn-ghost" type="submit">' + esc(t("p.change")) + "</button><p class=\"note\" id=\"pwNote\" role=\"status\"></p>" +
        "</form>" +
      "</div>";
    $("#profileForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = ev.target;
      api("PATCH", "/api/profile", { name: f.name.value, phone: f.phone.value, country: f.country.value, address: f.address.value, lang: f.lang.value })
        .then(function (j) {
          var changedLang = j.user.lang !== user.lang;
          user = j.user;
          flash($("#profileNote"), t("p.saved"));
          if (changedLang && j.user.lang !== lang) {         // show the site in the language they chose
            try { localStorage.setItem("artra-lang", j.user.lang); } catch (e) {}
            var u = new URL(location.href); u.searchParams.set("lang", j.user.lang); location.assign(u.toString());
          }
        })
        .catch(function (e) { flash($("#profileNote"), errText(e), true); });
    });
    $("#pwForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = ev.target;
      api("POST", "/api/profile", { action: "password", current: f.current.value, next: f.next.value })
        .then(function () { f.reset(); flash($("#pwNote"), t("p.changed")); })
        .catch(function (e) { flash($("#pwNote"), errText(e), true); });
    });
  };

  // ---- Saved pieces ----
  RENDER.favorites = function (panel) {
    return api("GET", "/api/favorites").then(function (j) {
      var list = j.favorites.filter(function (s) { return BY_SLUG[s]; });
      if (!list.length) { panel.innerHTML = '<p class="empty">' + esc(t("fav.empty")) + "</p>"; return; }
      panel.innerHTML = '<div class="fav-grid"></div>';
      var grid = $(".fav-grid", panel);
      list.forEach(function (slug) {
        var p = BY_SLUG[slug], card = document.createElement("div");
        card.className = "fav-card";
        card.innerHTML = '<a class="fav-link" href="' + attr(p.url) + '"></a><div class="fav-info"><span>' + esc(p.category) + "</span><b>" + esc(p.name) + '</b></div><button type="button" class="link-btn">' + esc(t("fav.remove")) + "</button>";
        $(".fav-link", card).appendChild(thumb(slug));
        $("button", card).addEventListener("click", function () {
          api("DELETE", "/api/favorites?slug=" + encodeURIComponent(slug)).then(function () { card.remove(); if (!grid.children.length) RENDER.favorites(panel); });
        });
        grid.appendChild(card);
      });
    });
  };

  // ---- Orders (a client's own; tracking history for each) ----
  function timeline(o) {
    return '<ol class="timeline">' + o.events.map(function (e) {
      return '<li class="tl-' + attr(e.status) + '"><b>' + esc(t("os." + e.status)) + "</b><time>" + esc(dateTime(e.created_at)) + "</time>" + (e.note ? "<p>" + esc(e.note) + "</p>" : "") + "</li>";
    }).join("") + "</ol>";
  }
  function trackingBox(o) {
    if (!o.carrier && !o.tracking_number && !o.tracking_url) return "";
    return '<div class="track"><span>' + esc(t("o.tracking")) + "</span> " + esc(o.carrier) + (o.tracking_number ? ' <code dir="ltr">' + esc(o.tracking_number) + "</code>" : "") +
      (o.tracking_url ? ' <a href="' + attr(o.tracking_url) + '" target="_blank" rel="noopener">' + esc(t("o.track_link")) + " ↗</a>" : "") + "</div>";
  }
  // ---- The order as a caravan journey: the atelier → the caravanserai → with the caravan → arrived ----
  var ROAD_D = "M70 128 C 250 78 380 170 560 128 S 860 88 1030 128";
  var AT = { confirmed: 0, in_production: 0.14, shipped: 0.66, delivered: 1 };
  function journey(o, p) {
    if (o.status === "cancelled") return "";
    var rtl = T.rtl, city = p && p.city && window.ARTRA_ROAD ? ARTRA_ROAD.city(p.city) : null;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", o.status === "in_production" || o.status === "shipped" ? "0 0 1100 230" : "0 60 1100 170");
    svg.setAttribute("class", "jr");
    svg.setAttribute("role", "img");
    var at = AT[o.status] || 0;
    svg.setAttribute("aria-label", t("j.aria", { status: t(o.status === "shipped" ? "j.caravan" : "os." + o.status) }));
    var flip = rtl ? ' transform="matrix(-1 0 0 1 1100 0)"' : "";
    svg.innerHTML =
      '<defs><linearGradient id="jrGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d98e"/><stop offset=".5" stop-color="#d4b467"/><stop offset="1" stop-color="#9a7a35"/></linearGradient></defs>' +
      '<g' + flip + '><path d="' + ROAD_D + '" fill="none" stroke="#2e4a86" stroke-width="2" stroke-dasharray="4 7"/>' +
      '<path class="jr-gold" d="' + ROAD_D + '" pathLength="1" fill="none" stroke="url(#jrGold)" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + at + ' 1"/></g>';
    // Positions along the road (measured once the svg is in the page).
    svg._draw = function () {
      var path = svg.querySelector(".jr-gold"), L = path.getTotalLength();
      function pos(f) { var q = path.getPointAtLength(L * f); return { x: rtl ? 1100 - q.x : q.x, y: q.y }; }
      function arch(f, reached) {
        var q = pos(f), c = reached ? "#d4b467" : "#2e4a86";
        return '<path d="M' + (q.x - 18) + " " + (q.y + 20) + " V" + (q.y - 8) + " Q" + (q.x - 18) + " " + (q.y - 22) + " " + q.x + " " + (q.y - 28) + " Q" + (q.x + 18) + " " + (q.y - 22) + " " + (q.x + 18) + " " + (q.y - 8) + " V" + (q.y + 20) + '" fill="' + (reached ? "#081a42" : "#05112f") + '" stroke="' + c + '" stroke-width="1.6"/>' +
          (reached ? '<circle cx="' + q.x + '" cy="' + (q.y + 2) + '" r="5" fill="#d4b467"/>' : '<circle cx="' + q.x + '" cy="' + (q.y + 2) + '" r="4" fill="none" stroke="#2e4a86" stroke-width="1.5"/>');
      }
      function label(f, title, sub, reached, dy) {
        var q = pos(f);
        return '<text x="' + q.x + '" y="' + (q.y + dy) + '" class="jr-t' + (reached ? "" : " off") + '">' + esc(title) + "</text>" +
          (sub ? '<text x="' + q.x + '" y="' + (q.y + dy + 20) + '" class="jr-s" direction="' + (rtl ? "rtl" : "ltr") + '">' + esc(sub) + "</text>" : "");
      }
      var shipped = at >= AT.shipped, delivered = at >= 1, out = "";
      out += arch(0, true) + arch(0.32, shipped) + arch(1, delivered);
      out += label(0, t("j.atelier"), [city ? ARTRA_ROAD.name(city.key) : "", date(o.created_at)].filter(Boolean).join(" · "), true, 50);
      out += label(0.32, t("j.caravanserai"), shipped ? o.carrier : "", shipped, 62);
      out += label(1, t("j.arrived"), user.country || "", delivered, 50);
      // Where the piece is now: a lantern on the road.
      var now = pos(at), nowTitle = o.status === "shipped" ? t("j.caravan") : t("os." + o.status);
      out += '<circle cx="' + now.x + '" cy="' + now.y + '" r="22" fill="#f1d98e" opacity=".18" class="jr-pulse"/>' +
        '<circle cx="' + now.x + '" cy="' + now.y + '" r="7" fill="#f1d98e"/>';
      if (o.status === "confirmed" || o.status === "delivered") {
        // At a stop: the stop's own label is enough; the state shows in the pill.
      } else {
        out += '<text x="' + now.x + '" y="' + (now.y - 44) + '" class="jr-t now">' + esc(nowTitle) + "</text>";
        if (o.status === "shipped" && (o.carrier || o.tracking_number)) out += '<text x="' + now.x + '" y="' + (now.y - 68) + '" class="jr-s" direction="ltr">' + esc([o.carrier, o.tracking_number].filter(Boolean).join(" · ")) + "</text>";
      }
      svg.insertAdjacentHTML("beforeend", out);
    };
    return svg;
  }

  // ---- Where the piece comes from, and its Caravan Pass ----
  function originAndPass(o, p) {
    var box = document.createElement("div");
    box.className = "jr-more";
    var city = p && p.city && window.ARTRA_ROAD ? ARTRA_ROAD.city(p.city) : null;
    if (city) {
      var made = esc(t("j.made_in", { city: "\u0000" })).replace("\u0000", '<span class="tq">' + esc(ARTRA_ROAD.name(city.key)) + "</span>");
      var crafts = (city.crafts || []).map(function (k) { return t("c." + k); }).join(" · ");
      box.insertAdjacentHTML("beforeend",
        '<section class="jr-origin"><p class="eyebrow">' + esc(t("j.origin")) + "</p><h3>" + made + "</h3>" +
        '<p class="muted">' + esc(ARTRA_ROAD.region(city.key)) + (crafts ? " · " + esc(crafts) : "") + "</p>" +
        '<svg class="jr-mini" role="img" aria-label="' + attr(t("j.made_in", { city: ARTRA_ROAD.name(city.key) })) + '"></svg></section>');
      ARTRA_ROAD.draw($(".jr-mini", box), { mini: true, highlight: city.key });
    }
    var rows = [["j.piece", (p && p.name) || o.title], ["j.atelier_l", city ? ARTRA_ROAD.name(city.key) + ", " + ARTRA_ROAD.region(city.key) : ""],
      ["j.master", p && p.artist], ["j.number", (p && p.id) || o.number]].filter(function (r) { return r[1]; });
    box.insertAdjacentHTML("beforeend",
      '<section class="pass"><div class="pass-in">' +
        '<p class="pass-kicker">' + esc(t("j.pass_kicker")) + "</p>" +
        (T.lang === "fa" ? "" : '<p class="pass-fa" lang="fa" dir="rtl">گذرنامهٔ کاروان</p>') +
        "<h3>" + esc(t("j.pass_title")) + "</h3>" +
        '<p class="pass-sub">' + esc(t("j.pass_sub")) + "</p>" +
        "<dl>" + rows.map(function (r) { return "<dt>" + esc(t(r[0])) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" +
        '<svg class="seal" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="#8c2f28"/><circle cx="60" cy="60" r="46" fill="none" stroke="#e8cf8a" stroke-width="1.2" stroke-dasharray="3 3"/>' +
          '<path d="M60 22 L68 50 L96 60 L68 70 L60 98 L52 70 L24 60 L52 50 Z" fill="none" stroke="#e8cf8a" stroke-width="1.6"/>' +
          '<text x="60" y="66" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="16" fill="#f3eee4" letter-spacing="2">ARTRA</text></svg>' +
      "</div></section>");
    return box;
  }
  RENDER.orders = function (panel) {
    return api("GET", "/api/orders").then(function (j) {
      var mine = j.orders.filter(function (o) { return o.client_id === user.id; });
      if (!mine.length) { panel.innerHTML = '<p class="empty">' + esc(t("o.empty")) + "</p>"; return; }
      panel.innerHTML = '<div class="orders"></div>';
      var box = $(".orders", panel);
      mine.forEach(function (o) {
        var el = document.createElement("article");
        el.className = "order";
        el.innerHTML =
          '<div class="order-head"><div class="order-art"></div><div class="order-main">' +
            '<p class="order-no">' + esc(t("o.number")) + ' <span dir="ltr">' + esc(o.number) + "</span> · " + esc(date(o.created_at)) + "</p>" +
            "<h3>" + esc((BY_SLUG[o.product_slug] && BY_SLUG[o.product_slug].name) || o.title) + "</h3>" +
            (o.amount != null ? '<p class="muted">' + esc(money(o.amount, o.currency)) + "</p>" : "") +
          "</div>" + pill("os", o.status) + "</div>" +
          '<div class="jr-slot"></div>' + trackingBox(o) + '<div class="jr-more-slot"></div>' +
          "<details><summary>" + esc(t("o.history")) + "</summary>" + timeline(o) + "</details>";
        $(".order-art", el).appendChild(thumb(o.product_slug));
        var piece = BY_SLUG[o.product_slug], road = journey(o, piece);
        if (road) $(".jr-slot", el).appendChild(road);
        $(".jr-more-slot", el).appendChild(originAndPass(o, piece));
        box.appendChild(el);
        if (road) road._draw();
      });
    });
  };

  // ---- A client's own enquiries ----
  RENDER.enquiries = function (panel) {
    return api("GET", "/api/enquiries").then(function (j) {
      var mine = user.role === "sales" || user.role === "admin" ? j.enquiries.filter(function (e) { return e.user_id === user.id; }) : j.enquiries;
      if (!mine.length) { panel.innerHTML = '<p class="empty">' + esc(t("e.empty")) + "</p>"; return; }
      panel.innerHTML = '<div class="cards">' + mine.map(function (e) {
        return '<article class="card"><div class="card-head"><span>' + esc(t("e.kind_" + e.kind)) + " · " + esc(date(e.created_at)) + "</span>" + pill("es", e.status) + "</div>" +
          (e.product_slug ? "<h3>" + esc(pieceName(e.product_slug)) + "</h3>" : e.craft ? "<h3>" + esc(e.craft) + "</h3>" : "") +
          '<p class="msg">' + esc(e.message) + "</p></article>";
      }).join("") + "</div>";
    });
  };

  // ---- Product providers: their pieces ----
  var ML_FIELDS = [
    ["name", "pf.name", "input", true], ["category", "l.category", "input"], ["artist", "l.artist", "input"], ["origin", "l.origin", "input"],
    ["medium", "l.medium", "input"], ["dimensions", "l.dimensions", "input"], ["packaging", "l.packaging", "input"],
    ["description", "pf.description", "area"], ["history", "pf.history", "area"], ["additional", "l.additional", "area"],
    ["care", "l.care", "area"], ["returns", "l.returns", "area"]
  ];
  function prodName(d) { return (d.name && typeof d.name === "object" ? (d.name[lang] || d.name.en) : d.name) || "—"; }
  function prodPhoto(d) { return d.cutout || d.photo || ""; }

  RENDER.products = function (panel) {
    return api("GET", "/api/products").then(function (j) {
      panel.innerHTML =
        '<div class="bar"><h2>' + esc(t(user.role === "admin" ? "tab.products" : "tab.products")) + '</h2><button class="btn btn-gold" id="addPiece" type="button">' + esc(t("pr.add")) + "</button></div>" +
        (j.products.length ? "" : '<p class="empty">' + esc(t("pr.empty")) + "</p>") +
        '<div class="cards">' + j.products.map(function (p) {
          return '<article class="card prod"><div class="prod-photo">' + (prodPhoto(p.data) ? '<img src="' + attr(prodPhoto(p.data)) + '" alt="" loading="lazy">' : "") + "</div><div>" +
            '<div class="card-head"><span>' + esc(date(p.updated_at)) + (user.role === "admin" && p.provider_name ? " · " + esc(p.provider_name) : "") + "</span>" + pill("ps", p.status) + "</div>" +
            "<h3>" + esc(prodName(p.data)) + "</h3>" +
            (p.review_note ? '<p class="review-note"><b>' + esc(t("pr.review_note")) + ":</b> " + esc(p.review_note) + "</p>" : "") +
            '<div class="row-actions">' +
              (p.status === "approved" ? '<a class="link-btn" href="/piece?p=' + attr(p.slug) + '">' + esc(t("pr.view")) + "</a>" : "") +
              '<button class="link-btn" data-edit="' + p.id + '" type="button">' + esc(t("pr.edit")) + "</button>" +
              (p.status !== "approved" || user.role === "admin" ? '<button class="link-btn danger" data-del="' + p.id + '" type="button">' + esc(t("pr.delete")) + "</button>" : "") +
            "</div></div></article>";
        }).join("") + "</div>";
      $("#addPiece").addEventListener("click", function () { editor(panel, null); });
      $$("[data-edit]", panel).forEach(function (b) {
        b.addEventListener("click", function () { editor(panel, j.products.filter(function (p) { return String(p.id) === b.getAttribute("data-edit"); })[0]); });
      });
      $$("[data-del]", panel).forEach(function (b) {
        b.addEventListener("click", function () {
          if (!confirm(t("pr.confirm_delete"))) return;
          api("DELETE", "/api/products?id=" + b.getAttribute("data-del")).then(function () { RENDER.products(panel); }).catch(function (e) { alert(errText(e)); });
        });
      });
    });
  };

  // The piece form: the questions of the ARTRA Product Detail form, with a tab per language for the texts.
  function editor(panel, product, onDone) {
    var data = JSON.parse(JSON.stringify(product ? product.data : {}));
    ML_FIELDS.forEach(function (f) { var v = data[f[0]]; data[f[0]] = v && typeof v === "object" ? v : v ? { en: v } : {}; });
    var edLang = "en";
    panel.innerHTML =
      '<form class="form acc-form editor" id="pieceForm" novalidate>' +
        '<div class="bar"><h2>' + esc(product ? prodName(product.data) : t("pr.add")) + '</h2><button class="link-btn" type="button" id="edBack">← ' + esc(t("pr.back")) + "</button></div>" +
        (product && product.review_note ? '<p class="review-note"><b>' + esc(t("pr.review_note")) + ":</b> " + esc(product.review_note) + "</p>" : "") +
        '<div class="ed-photo"><div class="ed-preview" id="edPreview"></div><div>' +
          '<label class="btn btn-ghost upload"><input type="file" id="edFile" accept="image/jpeg,image/png,image/webp" hidden>' + esc(t("pr.upload")) + "</label>" +
          '<label><span>' + esc(t("pr.or_link")) + '</span><input name="photo" dir="ltr" placeholder="https://" value="' + attr(data.photo || "") + '"></label>' +
          '<p class="note" id="edPhotoNote" role="status"></p></div></div>' +
        '<label><span>' + esc(t("pf.city")) + '</span><select name="city"><option value="">—</option>' +
          (window.ARTRA_ROAD ? ARTRA_ROAD.cities.map(function (c) { return '<option value="' + c.key + '"' + (c.key === data.city ? " selected" : "") + ">" + esc(ARTRA_ROAD.name(c.key)) + "</option>"; }).join("") : "") +
        "</select></label>" +
        '<div class="ed-row"><label><span>' + esc(t("l.id")) + '</span><input name="id" dir="ltr" value="' + attr(data.id || "") + '"></label>' +
          '<label><span>' + esc(t("l.updated")) + '</span><input name="updated" value="' + attr(data.updated || "") + '"></label></div>' +
        '<p class="muted small">' + esc(t("pr.lang_note")) + "</p>" +
        '<div class="seg ed-langs">' + T.langs.map(function (l) { return '<button type="button" data-l="' + l + '" aria-selected="' + (l === "en") + '">' + esc(t("lang." + l)) + "</button>"; }).join("") + "</div>" +
        '<div id="edFields"></div>' +
        '<div class="row-actions">' +
          '<button class="btn btn-ghost" type="button" id="edDraft">' + esc(t("pr.save_draft")) + "</button>" +
          '<button class="btn btn-gold" type="submit">' + esc(t(user.role === "admin" ? "pr.publish" : "pr.submit")) + "</button>" +
        '</div><p class="note" id="edNote" role="status"></p>' +
      "</form>";
    var form = $("#pieceForm"), fields = $("#edFields");
    function preview() {
      var src = form.photo.value.trim();
      $("#edPreview").innerHTML = /^https:\/\/|^\/photos\//.test(src) ? '<img src="' + attr(src) + '" alt="">' : "";
    }
    function drawFields() {
      var rtl = edLang === "ar" || edLang === "fa";
      fields.innerHTML = ML_FIELDS.map(function (f) {
        var v = data[f[0]][edLang] || "", label = t(f[1]) + (f[3] && edLang === "en" ? " *" : "");
        var dir = ' dir="' + (rtl ? "rtl" : "ltr") + '" lang="' + edLang + '"';
        return "<label><span>" + esc(label) + "</span>" + (f[2] === "area"
          ? '<textarea rows="3" data-f="' + f[0] + '"' + dir + ">" + esc(v) + "</textarea>"
          : '<input data-f="' + f[0] + '"' + dir + ' value="' + attr(v) + '">') +
          (edLang !== "en" && data[f[0]].en ? '<small class="en-hint" dir="ltr">EN: ' + esc(data[f[0]].en.slice(0, 120)) + "</small>" : "") + "</label>";
      }).join("");
    }
    function keep() { $$("[data-f]", fields).forEach(function (el) { var v = el.value.trim(); if (v) data[el.getAttribute("data-f")][edLang] = v; else delete data[el.getAttribute("data-f")][edLang]; }); }
    drawFields(); preview();
    $$(".ed-langs button", form).forEach(function (b) {
      b.addEventListener("click", function () {
        keep(); edLang = b.getAttribute("data-l");
        $$(".ed-langs button", form).forEach(function (x) { x.setAttribute("aria-selected", x === b); });
        drawFields();
      });
    });
    form.photo.addEventListener("input", preview);
    $("#edBack").addEventListener("click", function () { (onDone || RENDER.products)(panel); });
    $("#edFile").addEventListener("change", function (ev) {
      var file = ev.target.files[0], note = $("#edPhotoNote");
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) { flash(note, t("err.too_large"), true); return; }
      note.textContent = t("pr.uploading"); note.className = "note";
      api("POST", "/api/upload", file).then(function (j) { form.photo.value = j.url; data.cutout = ""; preview(); flash(note, t("p.saved")); })
        .catch(function (e) { flash(note, errText(e), true); });
    });
    function save(submit) {
      keep();
      var out = { id: form.id.value, updated: form.updated.value, city: form.city.value, photo: form.photo.value.trim(), cutout: form.photo.value.trim() === (product && product.data.photo) ? (data.cutout || "") : "" };
      ML_FIELDS.forEach(function (f) { out[f[0]] = data[f[0]]; });
      if (!out.name.en) { flash($("#edNote"), t("err.name_required"), true); return; }
      var req = product ? api("PATCH", "/api/products", { id: product.id, data: out, submit: submit }) : api("POST", "/api/products", { data: out, submit: submit });
      req.then(function () { (onDone || RENDER.products)(panel); }).catch(function (e) { flash($("#edNote"), errText(e), true); });
    }
    $("#edDraft").addEventListener("click", function () { save(false); });
    form.addEventListener("submit", function (ev) { ev.preventDefault(); save(true); });
  }

  // ---- Admin: pieces waiting for review ----
  RENDER.review = function (panel) {
    return api("GET", "/api/products?status=pending").then(function (j) {
      if (!j.products.length) { panel.innerHTML = '<p class="empty">' + esc(t("rv.empty")) + "</p>"; return; }
      panel.innerHTML = '<div class="cards"></div>';
      var box = $(".cards", panel);
      j.products.forEach(function (p) {
        var d = p.data, el = document.createElement("article");
        function txt(v) { return v && typeof v === "object" ? (v[lang] || v.en || "") : v || ""; }
        el.className = "card prod";
        el.innerHTML = '<div class="prod-photo">' + (prodPhoto(d) ? '<img src="' + attr(prodPhoto(d)) + '" alt="" loading="lazy">' : "") + "</div><div>" +
          '<div class="card-head"><span>' + esc(t("rv.by")) + " " + esc(p.provider_name || "—") + " · " + esc(date(p.updated_at)) + "</span>" + pill("ps", p.status) + "</div>" +
          "<h3>" + esc(prodName(d)) + "</h3>" +
          '<dl class="mini">' + [["l.category", d.category], ["l.artist", d.artist], ["l.origin", d.origin], ["l.medium", d.medium], ["l.dimensions", d.dimensions]]
            .filter(function (f) { return txt(f[1]); }).map(function (f) { return "<dt>" + esc(t(f[0])) + "</dt><dd>" + esc(txt(f[1])) + "</dd>"; }).join("") + "</dl>" +
          (txt(d.description) ? '<p class="msg">' + esc(txt(d.description)) + "</p>" : "") +
          '<div class="form"><label><span>' + esc(t("rv.note")) + '</span><textarea rows="2" class="rv-note"></textarea></label></div>' +
          '<div class="row-actions"><button class="btn btn-gold" data-ok type="button">' + esc(t("rv.approve")) + '</button><button class="btn btn-ghost" data-no type="button">' + esc(t("rv.reject")) +
          '</button><button class="link-btn" data-ed type="button">' + esc(t("pr.edit")) + "</button></div></div>";
        function decide(status) {
          api("PATCH", "/api/products", { id: p.id, status: status, review_note: $(".rv-note", el).value }).then(function () { RENDER.review(panel); }).catch(function (e) { alert(errText(e)); });
        }
        $("[data-ok]", el).addEventListener("click", function () { decide("approved"); });
        $("[data-no]", el).addEventListener("click", function () { decide("rejected"); });
        $("[data-ed]", el).addEventListener("click", function () { editor(panel, p, RENDER.review); });
        box.appendChild(el);
      });
    });
  };

  // ---- Sales: the enquiries desk ----
  RENDER.desk_enquiries = function (panel, status) {
    status = status || "";
    return Promise.all([api("GET", "/api/enquiries" + (status ? "?status=" + status : "")), api("GET", "/api/users?staff=1")]).then(function (r) {
      var list = r[0].enquiries, staff = r[1].users;
      var opts = ["", "new", "in_progress", "answered", "closed"].map(function (s) { return '<option value="' + s + '"' + (s === status ? " selected" : "") + ">" + esc(s ? t("es." + s) : t("d.all")) + "</option>"; }).join("");
      panel.innerHTML = '<div class="bar"><h2>' + esc(t("tab.desk_enquiries")) + '</h2><label class="inline"><select id="eqFilter">' + opts + "</select></label></div>" +
        (list.length ? "" : '<p class="empty">' + esc(t("e.empty")) + "</p>") + '<div class="cards"></div>';
      $("#eqFilter").addEventListener("change", function (ev) { RENDER.desk_enquiries(panel, ev.target.value); });
      var box = $(".cards", panel);
      list.forEach(function (e) {
        var el = document.createElement("article");
        el.className = "card";
        var who = '<option value="">' + esc(t("d.unassigned")) + "</option>" + staff.map(function (s) { return '<option value="' + attr(s.id) + '"' + (s.id === e.assigned_to ? " selected" : "") + ">" + esc(s.name) + "</option>"; }).join("");
        var sts = ["new", "in_progress", "answered", "closed"].map(function (s) { return '<option value="' + s + '"' + (s === e.status ? " selected" : "") + ">" + esc(t("es." + s)) + "</option>"; }).join("");
        var subject = t("e.kind_" + e.kind) + (e.product_slug ? " — " + pieceName(e.product_slug) : "");
        el.innerHTML = '<div class="card-head"><span>' + esc(t("e.kind_" + e.kind)) + " · " + esc(dateTime(e.created_at)) + " · " + esc((e.lang || "en").toUpperCase()) + "</span>" + pill("es", e.status) + "</div>" +
          "<h3>" + esc(e.name) + ' <a dir="ltr" href="mailto:' + attr(e.email) + "?subject=" + attr(encodeURIComponent(subject)) + '">' + esc(e.email) + "</a></h3>" +
          (e.product_slug ? "<p><b>" + esc(t("d.piece")) + ":</b> " + esc(pieceName(e.product_slug)) + "</p>" : "") +
          (e.craft ? "<p><b>" + esc(t("f.craft")) + ":</b> " + esc(e.craft) + "</p>" : "") +
          '<p class="msg">' + esc(e.message) + "</p>" +
          '<div class="form desk-row"><label><span>' + esc(t("o.status")) + '</span><select class="eq-status">' + sts + "</select></label>" +
          '<label><span>' + esc(t("d.assign")) + '</span><select class="eq-who">' + who + "</select></label></div>" +
          '<div class="form"><label><span>' + esc(t("d.notes")) + '</span><textarea rows="2" class="eq-notes">' + esc(e.notes) + "</textarea></label></div>" +
          '<div class="row-actions"><button class="btn btn-gold" type="button">' + esc(t("d.save")) + '</button><a class="link-btn" href="mailto:' + attr(e.email) + "?subject=" + attr(encodeURIComponent(subject)) + '">' + esc(t("d.reply")) + '</a><span class="note" role="status"></span></div>';
        $("button", el).addEventListener("click", function () {
          api("PATCH", "/api/enquiries", { id: e.id, status: $(".eq-status", el).value, assigned_to: $(".eq-who", el).value || null, notes: $(".eq-notes", el).value })
            .then(function (j) { flash($(".row-actions .note", el), t("p.saved")); $(".card-head .pill", el).outerHTML = pill("es", j.enquiry.status); })
            .catch(function (err) { flash($(".row-actions .note", el), errText(err), true); });
        });
        box.appendChild(el);
      });
    });
  };

  // ---- Sales: the orders desk (record a sale, update tracking) ----
  RENDER.desk_orders = function (panel) {
    return api("GET", "/api/orders").then(function (j) {
      var pieces = '<option value="">—</option>' + PRODUCTS.map(function (p) { return '<option value="' + attr(p.slug) + '">' + esc(p.name) + "</option>"; }).join("");
      panel.innerHTML =
        '<div class="bar"><h2>' + esc(t("tab.desk_orders")) + "</h2></div>" +
        '<details class="new-order"><summary class="btn btn-gold">' + esc(t("d.new_order")) + "</summary>" +
          '<form class="form acc-form" id="newOrder">' +
            '<label><span>' + esc(t("d.client_email")) + '</span><input name="client_email" type="email" required dir="ltr"></label>' +
            '<label><span>' + esc(t("d.piece")) + '</span><select name="product_slug">' + pieces + "</select></label>" +
            '<label><span>' + esc(t("d.title")) + '</span><input name="title" required></label>' +
            '<div class="ed-row"><label><span>' + esc(t("d.amount")) + '</span><input name="amount" type="number" min="0" step="0.01" dir="ltr"></label>' +
            '<label><span>' + esc(t("d.currency")) + '</span><input name="currency" value="EUR" maxlength="3" dir="ltr"></label></div>' +
            '<label><span>' + esc(t("d.note")) + '</span><input name="note"></label>' +
            '<button class="btn btn-gold" type="submit">' + esc(t("d.create")) + '</button><p class="note" id="newOrderNote" role="status"></p>' +
          "</form></details>" +
        (j.orders.length ? "" : '<p class="empty">' + esc(t("o.empty")) + "</p>") + '<div class="orders"></div>';
      var nf = $("#newOrder");
      nf.product_slug.addEventListener("change", function () { if (!nf.title.value && nf.product_slug.value) nf.title.value = pieceName(nf.product_slug.value); });
      nf.addEventListener("submit", function (ev) {
        ev.preventDefault();
        api("POST", "/api/orders", { client_email: nf.client_email.value, product_slug: nf.product_slug.value, title: nf.title.value, amount: nf.amount.value, currency: nf.currency.value, note: nf.note.value })
          .then(function () { RENDER.desk_orders(panel); }).catch(function (e) { flash($("#newOrderNote"), errText(e), true); });
      });
      var box = $(".orders", panel);
      j.orders.forEach(function (o) {
        var el = document.createElement("article");
        el.className = "order";
        var sts = ["confirmed", "in_production", "shipped", "delivered", "cancelled"].map(function (s) { return '<option value="' + s + '"' + (s === o.status ? " selected" : "") + ">" + esc(t("os." + s)) + "</option>"; }).join("");
        el.innerHTML =
          '<div class="order-head"><div class="order-art"></div><div class="order-main">' +
            '<p class="order-no"><span dir="ltr">' + esc(o.number) + "</span> · " + esc(date(o.created_at)) + "</p><h3>" + esc(o.title) + "</h3>" +
            '<p class="muted">' + esc(o.client_name) + ' · <span dir="ltr">' + esc(o.client_email) + "</span>" + (o.amount != null ? " · " + esc(money(o.amount, o.currency)) : "") + "</p>" +
          "</div>" + pill("os", o.status) + "</div>" + trackingBox(o) +
          "<details><summary>" + esc(t("d.update")) + "</summary>" +
            '<form class="form acc-form upd">' +
              '<div class="ed-row"><label><span>' + esc(t("o.status")) + '</span><select name="status">' + sts + "</select></label>" +
              '<label><span>' + esc(t("o.carrier")) + '</span><input name="carrier" value="' + attr(o.carrier) + '"></label></div>' +
              '<div class="ed-row"><label><span>' + esc(t("o.tracking")) + '</span><input name="tracking_number" dir="ltr" value="' + attr(o.tracking_number) + '"></label>' +
              '<label><span>' + esc(t("o.track_link")) + '</span><input name="tracking_url" dir="ltr" placeholder="https://" value="' + attr(o.tracking_url) + '"></label></div>' +
              '<label><span>' + esc(t("d.note")) + '</span><input name="note"></label>' +
              '<button class="btn btn-gold" type="submit">' + esc(t("d.update")) + '</button><p class="note" role="status"></p>' +
            "</form>" + timeline(o) + "</details>";
        $(".order-art", el).appendChild(thumb(o.product_slug));
        $(".upd", el).addEventListener("submit", function (ev) {
          ev.preventDefault();
          var f = ev.target;
          api("PATCH", "/api/orders", { id: o.id, status: f.status.value, carrier: f.carrier.value, tracking_number: f.tracking_number.value, tracking_url: f.tracking_url.value, note: f.note.value })
            .then(function () { RENDER.desk_orders(panel); }).catch(function (e) { flash($(".note", f), errText(e), true); });
        });
        box.appendChild(el);
      });
    });
  };

  // =====================================================================================================
  // Appraisals: a client's own requests (My appraisals) and the Expertise desk (sales, experts, admin).
  // The server decides who may do what (api/appraisals.js); these screens only offer what fits the stage.
  // =====================================================================================================
  var OPEN_ST = ["submitted", "info_needed", "quoted", "accepted", "received", "examination", "peer_review", "ready"];
  function apPill(a, asClient) {
    // A client follows "with the expert" as one stage: the second expert's review is not shown to them.
    var s = asClient && (a.status === "peer_review" || a.status === "ready") ? "examination" : a.status;
    var cls = { info_needed: "new", quoted: "new", declined: "rejected", issued: "approved", returned: "delivered", withdrawn: "closed" }[s] || "in_progress";
    return '<span class="pill pill-' + cls + '">' + esc(t("as." + s)) + "</span>";
  }
  function apDate(a, status) { var e = (a.events || []).filter(function (e) { return e.kind === "status" && e.status === status; })[0]; return e ? date(e.created_at) : ""; }
  function apLast(a, status) { var l = (a.events || []).filter(function (e) { return e.kind === "status" && e.status === status; }); return l.length ? l[l.length - 1] : null; }
  function apPhotos(a) { return (a.photos || []).filter(function (p) { return p.kind !== "document"; }); }
  function apThumb(a) {
    var p = apPhotos(a)[0];
    return '<div class="thumb ap-thumb">' + (p ? '<img src="' + attr(p.url) + '" alt="" loading="lazy">' : "") + "</div>";
  }
  function apMeta(a) {
    return [t("svc." + a.service), a.purpose ? t("purpose." + a.purpose) : "", a.expert_name ? t("ap.expert") + ": " + a.expert_name : ""].filter(Boolean).join(" · ");
  }

  // The stops a client sees. An opinion (from photographs) has no piece to receive or return.
  function apStops(a) {
    var op = a.service === "opinion";
    var keys = op ? ["submitted", "reviewed", "accepted", "expert", "issued_op"] : ["submitted", "reviewed", "accepted", "received", "expert", "issued", "returned"];
    var exp = op ? 3 : 4;
    var at = { submitted: 0, info_needed: 0, quoted: 1, accepted: 2, received: 3, examination: exp, peer_review: exp, ready: exp, issued: exp + 1, returned: 6 }[a.status];
    var when = { submitted: apDate(a, "submitted"), reviewed: apDate(a, "quoted"), accepted: apDate(a, "accepted"), received: apDate(a, "received"),
      expert: apDate(a, "examination"), issued: apDate(a, "issued"), issued_op: apDate(a, "issued"), returned: apDate(a, "returned") };
    return '<ol class="ap-stops" style="--n:' + keys.length + '">' + keys.map(function (k, i) {
      var cls = i < at ? "done" : i === at ? (i === keys.length - 1 ? "done" : "now") : "";
      return '<li class="' + cls + '"><span class="dot" aria-hidden="true">' + (cls === "done" ? "✓" : "") + "</span><b>" + esc(t("stop." + k)) + "</b><small>" + esc(i <= at ? when[k] : "") + "</small></li>";
    }).join("") + "</ol>";
  }
  function apJourney(a) {
    var list = (a.events || []).filter(function (e) { return e.kind === "status"; });
    // After a question, the client's answer brings the request back to "submitted": call it what it is.
    list = list.map(function (e, i) { return { e: e, label: e.status === "submitted" && i > 0 ? "evs.answer" : "evs." + e.status }; }).reverse();
    return '<ul class="ap-events">' + list.map(function (x) {
      var e = x.e;
      return "<li><b>" + esc(t(x.label)) + "</b><time>" + esc(dateTime(e.created_at)) + "</time>" + (e.body ? '<p class="msg">' + esc(e.body) + "</p>" : "") + "</li>";
    }).join("") + "</ul>";
  }
  function apMessages(a) {
    var list = (a.events || []).filter(function (e) { return e.kind === "message" && e.body; });
    return '<div class="ap-msgs">' + list.map(function (e) {
      return '<div class="ap-msg' + (e.by_client ? " mine" : "") + '"><p class="msg">' + esc(e.body) + "</p><small>" + esc(e.by_client ? t("ap.you") : e.by) + " · " + esc(dateTime(e.created_at)) + "</small></div>";
    }).join("") + "</div>";
  }
  function apGallery(a) {
    var list = a.photos || [];
    if (!list.length) return '<p class="muted small">' + esc(t("ap.no_photos")) + "</p>";
    return '<div class="ap-photos">' + list.map(function (p) {
      var isDoc = p.kind === "document" || /\.pdf$/i.test(p.url);
      return '<a href="' + attr(p.url) + '" target="_blank" rel="noopener" title="' + attr(t("shot." + p.kind)) + '">' + (isDoc ? '<span class="doc">PDF</span>' : '<img src="' + attr(p.url) + '" alt="' + attr(t("shot." + p.kind)) + '" loading="lazy">') + "</a>";
    }).join("") + "</div>";
  }
  function apFindings(a) {
    var f = a.findings || {}, rows = [["ap.attribution", f.attribution], ["ap.origin", f.origin && window.ARTRA_ROAD && ARTRA_ROAD.city(f.origin) ? ARTRA_ROAD.name(f.origin) + ", " + ARTRA_ROAD.region(f.origin) : ""],
      ["ap.period", f.period], ["ap.materials", f.materials], ["ap.technique", f.technique], ["ap.marks", f.marks], ["ap.condition", f.condition],
      ["ap.value", f.value != null && a.service === "appraisal" ? money(f.value, f.value_currency) + (a.basis ? " · " + t("basis." + a.basis) : "") : ""], ["ap.summary", f.summary]];
    return "<dl>" + rows.filter(function (r) { return r[1]; }).map(function (r) { return "<dt>" + esc(t(r[0])) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>";
  }
  // The certificate (or, for an opinion, the opinion letter), on ivory like the Caravan Pass.
  function apCertificate(a) {
    var op = a.service === "opinion";
    return '<figure class="cert ap-cert"><div class="cert-in">' +
      '<p class="cert-kicker">' + esc(t(op ? "ap.opinion_kicker" : "ex.cert_kicker")) + "</p>" +
      (op || T.lang === "fa" ? "" : '<p class="cert-fa" lang="fa" dir="rtl">گواهی کارشناسی</p>') +
      '<p class="cert-title">' + esc(a.piece.title) + "</p>" +
      '<p class="cert-place">' + esc(t("svc." + a.service)) + "</p>" +
      apFindings(a) +
      "<dl>" + (a.certificate_no ? "<dt>" + esc(t("ap.registry")) + '</dt><dd dir="ltr">' + esc(a.certificate_no) + "</dd>" : "") +
        "<dt>" + esc(t("ap.issued")) + "</dt><dd>" + esc(date(a.issued_at)) + "</dd>" +
        (a.expert_name ? "<dt>" + esc(t("ex.cert_signed")) + "</dt><dd>" + esc(a.expert_name) + "</dd>" : "") + "</dl>" +
      '<svg class="seal" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="#8c2f28"/><circle cx="60" cy="60" r="46" fill="none" stroke="#e8cf8a" stroke-width="1.2" stroke-dasharray="3 3"/><path d="M60 22 L68 50 L96 60 L68 70 L60 98 L52 70 L24 60 L52 50 Z" fill="none" stroke="#e8cf8a" stroke-width="1.6"/><text x="60" y="66" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="16" fill="#f3eee4" letter-spacing="2">ARTRA</text></svg>' +
      (a.certificate_no ? '<p class="cert-verify" dir="ltr">artraland.com/verify?no=' + esc(a.certificate_no) + "</p>" : "") +
      "</div></figure>";
  }
  function printCard(el) {
    document.body.classList.add("printing"); el.classList.add("print-me");
    var done = function () { document.body.classList.remove("printing"); el.classList.remove("print-me"); removeEventListener("afterprint", done); };
    addEventListener("afterprint", done);
    print();
    setTimeout(done, 1000);
  }
  // Upload a few photographs for an appraisal; resolves with [{ kind, url }].
  function apUpload(files) {
    var list = Array.prototype.slice.call(files || []).slice(0, 8);
    return Promise.all(list.map(function (f) {
      if (f.size > 4 * 1024 * 1024) return Promise.reject({ code: "too_large" });
      return api("POST", "/api/upload?for=appraisal", f).then(function (j) { return { kind: /pdf/.test(f.type) ? "document" : "other", url: j.url }; });
    }));
  }
  function act(a, action, extra) { var b = { id: a.id, action: action }; for (var k in extra || {}) b[k] = extra[k]; return api("PATCH", "/api/appraisals", b); }

  // ---- My appraisals ----
  RENDER.appraisals = function (panel) {
    return api("GET", "/api/appraisals").then(function (j) {
      var mine = j.appraisals.filter(function (a) { return a.client_id === user.id; });
      var head = '<div class="bar"><h2>' + esc(t("tab.appraisals")) + '</h2><a class="btn btn-ghost" href="/request-appraisal">' + esc(t("ap.new")) + "</a></div>";
      if (!mine.length) { panel.innerHTML = head + '<p class="empty">' + esc(t("ap.empty")) + "</p>"; return; }
      panel.innerHTML = head + '<div class="aps"></div>';
      var box = $(".aps", panel);
      // Requests that need the client come first.
      mine.sort(function (x, y) { var w = function (a) { return a.status === "info_needed" || a.status === "quoted" ? 0 : OPEN_ST.indexOf(a.status) > -1 ? 1 : 2; }; return w(x) - w(y); });
      mine.forEach(function (a) { box.appendChild(clientCard(a, panel)); });
    });
  };
  function clientCard(a, panel) {
    var el = document.createElement("article"), open = OPEN_ST.indexOf(a.status) > -1, ended = ["declined", "withdrawn", "closed"].indexOf(a.status) > -1;
    var issued = a.status === "issued" || a.status === "returned";
    el.className = "ap" + (a.status === "info_needed" || a.status === "quoted" ? " ap-act" : "");
    var banner = "";
    if (a.status === "info_needed") {
      var q = apLast(a, "info_needed");
      banner = '<div class="ap-banner"><b>' + esc(t("ap.act_info")) + "</b>" + (q && q.body ? '<p class="msg">“' + esc(q.body) + "”</p>" : "") +
        '<form class="form ap-reply"><label><span class="sr">' + esc(t("ap.reply_ph")) + '</span><textarea name="body" rows="2" placeholder="' + attr(t("ap.reply_ph")) + '"></textarea></label>' +
        '<div class="row-actions"><label class="btn btn-ghost ap-file">' + esc(t("ap.add_photos")) + '<input type="file" name="files" multiple accept="image/jpeg,image/png,image/webp,application/pdf" hidden></label>' +
        '<button class="btn btn-gold" type="submit">' + esc(t("ap.reply")) + '</button><span class="note" role="status"></span></div></form></div>';
    } else if (a.status === "quoted") {
      var qn = apLast(a, "quoted");
      banner = '<div class="ap-banner"><b>' + esc(t("ap.act_quote")) + "</b>" +
        '<dl class="mini"><dt>' + esc(t("ap.fee")) + "</dt><dd>" + esc(money(a.fee, a.currency)) + "</dd>" +
          (a.expert_name ? "<dt>" + esc(t("ap.expert")) + "</dt><dd>" + esc(a.expert_name) + "</dd>" : "") +
          (a.basis ? "<dt>" + esc(t("ap.basis")) + "</dt><dd>" + esc(t("basis." + a.basis)) + "</dd>" : "") + "</dl>" +
        (qn && qn.body ? '<p class="msg">' + esc(qn.body) + "</p>" : "") +
        '<p class="muted small">' + esc(t("ap.pay_note")) + "</p>" +
        '<div class="row-actions"><button class="btn btn-gold" data-act="accept" type="button">' + esc(t("ap.accept")) + '</button><button class="link-btn" data-act="refuse" type="button">' + esc(t("ap.refuse")) + '</button><span class="note" role="status"></span></div></div>';
    } else if (ended) {
      var why = apLast(a, a.status);
      if (why && why.body) banner = '<div class="ap-banner ap-ended"><b>' + esc(t("ap.reason")) + '</b><p class="msg">' + esc(why.body) + "</p></div>";
    }
    el.innerHTML =
      '<div class="order-head">' + apThumb(a) + '<div class="order-main">' +
        '<p class="order-no"><span dir="ltr">' + esc(a.number) + "</span> · " + esc(t("ap.requested", { date: date(a.created_at) })) + "</p>" +
        "<h3>" + esc(a.piece.title) + '</h3><p class="muted">' + esc(apMeta(a)) + "</p>" +
      "</div>" + apPill(a, true) + "</div>" +
      banner +
      (ended ? "" : apStops(a)) +
      (issued ? '<div class="ap-issued">' + apCertificate(a) + '<div class="row-actions"><button class="btn btn-gold" data-print type="button">' + esc(t("ap.print")) + "</button>" +
        (a.certificate_no ? '<a class="link-btn" href="/verify?no=' + attr(encodeURIComponent(a.certificate_no)) + '">' + esc(t("ap.verify_link")) + " ↗</a>" : "") +
        (a.status === "returned" && a.carrier ? '<span class="muted small">' + esc(t("ap.returned_via", { carrier: a.carrier })) + (a.tracking_number ? ' · <code dir="ltr">' + esc(a.tracking_number) + "</code>" : "") + "</span>" : "") +
        "</div></div>" : "") +
      '<div class="ap-cols">' +
        "<section><h4>" + esc(t("ap.journey")) + "</h4>" + apJourney(a) + "</section>" +
        "<section><h4>" + esc(t("ap.photos")) + "</h4>" + apGallery(a) + "</section>" +
        "<section><h4>" + esc(t("ap.messages")) + "</h4>" + apMessages(a) +
          (open ? '<form class="ap-send"><label><span class="sr">' + esc(t("ap.msg_ph")) + '</span><input name="body" placeholder="' + attr(t("ap.msg_ph")) + '"></label><button class="link-btn" type="submit">' + esc(t("ap.send")) + '</button></form><p class="note" role="status"></p>' : "") +
        "</section>" +
      "</div>" +
      (["submitted", "info_needed", "quoted"].indexOf(a.status) > -1 ? '<div class="row-actions"><button class="link-btn danger" data-act="withdraw" type="button">' + esc(t("ap.withdraw")) + "</button></div>" : "");

    function again() { return RENDER.appraisals(panel); }
    function oops(note) { return function (e) { if (note) flash(note, errText(e), true); else alert(errText(e)); }; }
    $$("[data-act]", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-act");
        if (k === "withdraw" && !confirm(t("ap.confirm_withdraw"))) return;
        if (k === "refuse" && !confirm(t("ap.confirm_refuse"))) return;
        b.disabled = true;
        act(a, k).then(again).catch(function (e) { b.disabled = false; alert(errText(e)); });
      });
    });
    var reply = $(".ap-reply", el);
    if (reply) reply.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var note = $(".note", reply), btn = $('button[type="submit"]', reply);
      btn.disabled = true; note.textContent = reply.files.files.length ? t("rq.uploading") : "";
      apUpload(reply.files.files).then(function (ph) { return act(a, "reply", { body: reply.body.value, photos: ph }); })
        .then(again).catch(function (e) { btn.disabled = false; flash(note, errText(e), true); });
    });
    var send = $(".ap-send", el);
    if (send) send.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!send.body.value.trim()) return;
      act(a, "message", { body: send.body.value }).then(again).catch(oops(send.nextElementSibling));
    });
    var pr = $("[data-print]", el);
    if (pr) pr.addEventListener("click", function () { printCard(el); });
    return el;
  }

  // ---- The Expertise desk ----
  var DESK_FILTERS = {
    open: OPEN_ST, screen: ["submitted", "info_needed"], quoted: ["quoted"], piece: ["accepted", "received"],
    exam: ["examination", "peer_review"], ready: ["ready"], done: ["issued", "returned", "declined", "withdrawn", "closed"]
  };
  var deskOpen = {};
  RENDER.desk_appraisals = function (panel, filter) {
    filter = filter || RENDER.desk_appraisals.last || "open";
    RENDER.desk_appraisals.last = filter;
    var staff = user.role === "sales" || user.role === "admin";
    return Promise.all([api("GET", "/api/appraisals"), staff ? api("GET", "/api/users?experts=1") : Promise.resolve({ users: [] })]).then(function (r) {
      var all = r[0].appraisals.filter(function (a) { return a.on_file; }), experts = r[1].users;
      var count = function (k) { return all.filter(function (a) { return DESK_FILTERS[k].indexOf(a.status) > -1; }).length; };
      var list = all.filter(function (a) { return DESK_FILTERS[filter].indexOf(a.status) > -1; });
      panel.innerHTML = '<div class="bar"><h2>' + esc(t("tab.desk_appraisals")) + "</h2></div>" +
        '<div class="ap-filters" role="group">' + Object.keys(DESK_FILTERS).map(function (k) {
          return '<button type="button" data-f="' + k + '" aria-pressed="' + (k === filter) + '">' + esc(t("dk.f_" + k)) + " <span>" + count(k) + "</span></button>";
        }).join("") + "</div>" +
        (list.length ? "" : '<p class="empty">' + esc(t("dk.empty")) + "</p>") + '<div class="aps"></div>';
      $$(".ap-filters button", panel).forEach(function (b) { b.addEventListener("click", function () { RENDER.desk_appraisals(panel, b.getAttribute("data-f")); }); });
      var box = $(".aps", panel);
      list.forEach(function (a) { box.appendChild(deskCard(a, panel, experts)); });
    });
  };
  function deskCard(a, panel, experts) {
    var me = user.id, isAdmin = user.role === "admin", isStaff = isAdmin || user.role === "sales";
    var isExpert = a.expert_id === me, isReviewer = a.reviewer_id === me, op = a.service === "opinion", p = a.piece || {};
    var el = document.createElement("details");
    el.className = "ap ap-desk";
    el.open = !!deskOpen[a.id];
    el.addEventListener("toggle", function () { deskOpen[a.id] = el.open; });
    function sel(name, chosen, blank) {
      return '<select name="' + name + '">' + (blank ? '<option value="">' + esc(t("d.unassigned")) + "</option>" : "") + experts.map(function (x) {
        return '<option value="' + attr(x.id) + '"' + (x.id === chosen ? " selected" : "") + ">" + esc(x.name + " · " + t("role." + x.role)) + "</option>";
      }).join("") + "</select>";
    }
    function field(label, name, value, area) {
      return "<label><span>" + esc(t(label)) + "</span>" + (area ? '<textarea name="' + name + '" rows="2">' + esc(value || "") + "</textarea>" : '<input name="' + name + '" value="' + attr(value || "") + '">') + "</label>";
    }
    var f = a.findings || {}, actions = "";
    // What can be done at this stage, by this person.
    if ((a.status === "submitted" || a.status === "info_needed") && isStaff) {
      actions += '<p class="muted small">' + esc(t("dk.check")) + "</p>" +
        '<form class="form acc-form" data-form="screen"><label><span>' + esc(t("dk.message")) + '</span><textarea name="body" rows="2"></textarea></label><div class="row-actions">' +
        (a.status === "submitted" ? '<button class="btn btn-ghost" data-do="ask" type="button">' + esc(t("dk.ask")) + "</button>" : "") +
        '<button class="link-btn danger" data-do="decline" type="button">' + esc(t("dk.decline")) + '</button><span class="note" role="status"></span></div></form>';
    }
    if (a.status === "submitted" && isAdmin) {
      actions += '<form class="form acc-form" data-form="quote"><h4>' + esc(t("dk.quote")) + "</h4>" +
        '<div class="ed-row"><label><span>' + esc(t("dk.expert")) + "</span>" + sel("expert_id", a.expert_id, true) + "</label><label><span>" + esc(t("dk.reviewer")) + "</span>" + sel("reviewer_id", a.reviewer_id, true) + "</label></div>" +
        '<div class="ed-row"><label><span>' + esc(t("ap.fee")) + '</span><input name="fee" type="number" min="0" step="0.01" dir="ltr" required></label><label><span>' + esc(t("dk.currency")) + '</span><input name="currency" value="EUR" maxlength="3" dir="ltr"></label></div>' +
        (a.service === "appraisal" ? '<label><span>' + esc(t("ap.basis")) + '</span><select name="basis">' + ["insurance", "market", "auction"].map(function (k) { return '<option value="' + k + '"' + (a.purpose === "selling" && k === "market" || a.purpose !== "selling" && k === "insurance" ? " selected" : "") + ">" + esc(t("basis." + k)) + "</option>"; }).join("") + "</select></label>" : "") +
        field("dk.note_client", "body", "", true) +
        '<div class="row-actions"><button class="btn btn-gold" type="submit">' + esc(t("dk.quote")) + '</button><span class="note" role="status"></span></div></form>';
    }
    if (a.status === "accepted" && !op && isStaff) {
      actions += '<form class="form acc-form" data-form="received">' + field("dk.condition", "body", "", true) +
        '<div class="row-actions"><button class="btn btn-gold" type="submit">' + esc(t("dk.received")) + '</button><span class="note" role="status"></span></div></form>';
    }
    if ((a.status === "received" || a.status === "accepted" && op) && (isExpert || isAdmin)) {
      actions += '<div class="row-actions"><button class="btn btn-gold" data-do="start" type="button">' + esc(t("dk.start")) + '</button><span class="note" role="status"></span></div>';
    }
    if (a.status === "examination") {
      if (isExpert || isAdmin) {
        var cities = window.ARTRA_ROAD ? ARTRA_ROAD.cities.map(function (c) { return '<option value="' + c.key + '"' + (c.key === (f.origin || p.city) ? " selected" : "") + ">" + esc(ARTRA_ROAD.name(c.key)) + "</option>"; }).join("") : "";
        actions += '<form class="form acc-form" data-form="findings"><h4>' + esc(t("dk.findings")) + "</h4>" +
          field("ap.attribution", "attribution", f.attribution, true) +
          '<div class="ed-row"><label><span>' + esc(t("ap.origin")) + '</span><select name="origin"><option value="">—</option>' + cities + "</select></label>" + field("ap.period", "period", f.period) + "</div>" +
          '<div class="ed-row">' + field("ap.materials", "materials", f.materials) + field("ap.technique", "technique", f.technique) + "</div>" +
          field("ap.marks", "marks", f.marks) + field("ap.condition", "condition", f.condition, true) +
          (a.service === "appraisal" ? '<div class="ed-row"><label><span>' + esc(t("ap.value")) + '</span><input name="value" type="number" min="0" step="1" dir="ltr" value="' + attr(f.value == null ? "" : f.value) + '"></label><label><span>' + esc(t("dk.currency")) + '</span><input name="value_currency" maxlength="3" dir="ltr" value="' + attr(f.value_currency || a.currency || "EUR") + '"></label></div>' : "") +
          field("ap.summary", "summary", f.summary, true) +
          '<div class="row-actions"><button class="btn btn-ghost" type="submit">' + esc(t("dk.save_findings")) + '</button><button class="btn btn-gold" data-do="to_review" type="button">' + esc(t("dk.to_review")) + '</button><span class="note" role="status"></span></div></form>';
      } else actions += '<p class="muted">' + esc(t("dk.not_yours")) + "</p>";
    }
    if (a.status === "peer_review" || a.status === "ready" || a.status === "issued" || a.status === "returned") actions += '<div class="ap-findings"><h4>' + esc(t("dk.findings")) + "</h4>" + apFindings(a) + "</div>";
    if (a.status === "peer_review") {
      if ((isReviewer || isAdmin) && !isExpert) {
        actions += '<form class="form acc-form" data-form="review">' + field("dk.message", "body", "", true) +
          '<div class="row-actions"><button class="btn btn-gold" data-do="agree" type="button">' + esc(t("dk.agree")) + '</button><button class="btn btn-ghost" data-do="send_back" type="button">' + esc(t("dk.send_back")) + '</button><span class="note" role="status"></span></div></form>';
      } else actions += '<p class="muted">' + esc(t("dk.review_wait")) + "</p>";
    }
    if (a.status === "ready" && isAdmin) actions += '<div class="row-actions"><button class="btn btn-gold" data-do="issue" type="button">' + esc(t("dk.issue")) + '</button><span class="note" role="status"></span></div>';
    if (a.status === "issued" && !op && isStaff) {
      actions += '<form class="form acc-form" data-form="returned"><div class="ed-row">' + field("o.carrier", "carrier", "") + field("o.tracking", "tracking_number", "") + "</div>" +
        '<label><span>' + esc(t("o.track_link")) + '</span><input name="tracking_url" dir="ltr" placeholder="https://"></label>' +
        '<div class="row-actions"><button class="btn btn-gold" type="submit">' + esc(t("dk.returned")) + '</button><span class="note" role="status"></span></div></form>';
    }
    if (OPEN_ST.indexOf(a.status) > -1 && isAdmin && a.status !== "submitted") {
      actions += '<form class="form acc-form" data-form="assign"><div class="ed-row"><label><span>' + esc(t("dk.expert")) + "</span>" + sel("expert_id", a.expert_id, true) + "</label><label><span>" + esc(t("dk.reviewer")) + "</span>" + sel("reviewer_id", a.reviewer_id, true) + "</label></div>" +
        '<div class="row-actions"><button class="btn btn-ghost" type="submit">' + esc(t("dk.assign")) + '</button><span class="note" role="status"></span></div></form>';
    }
    var notes = (a.events || []).filter(function (e) { return e.kind === "note"; });
    el.innerHTML =
      '<summary class="order-head">' + apThumb(a) + '<div class="order-main">' +
        '<p class="order-no"><span dir="ltr">' + esc(a.number) + "</span> · " + esc(date(a.created_at)) + " · " + esc(a.client_name) + ' · <span dir="ltr">' + esc(a.client_email) + "</span></p>" +
        "<h3>" + esc(p.title) + '</h3><p class="muted">' + esc([t("svc." + a.service), t("purpose." + a.purpose), a.expert_name ? t("dk.expert") + ": " + a.expert_name : "", a.reviewer_name ? t("dk.reviewer") + ": " + a.reviewer_name : ""].filter(Boolean).join(" · ")) + "</p>" +
      "</div>" + apPill(a, false) + "</summary>" +
      '<div class="ap-desk-body">' +
        '<div class="ap-cols ap-cols-2"><section><dl class="mini">' + [["rq.craft", p.craft ? t("c." + p.craft) : ""], ["rq.city", p.city && window.ARTRA_ROAD && ARTRA_ROAD.city(p.city) ? ARTRA_ROAD.name(p.city) : ""],
            ["dk.age", p.age ? t("age." + p.age) : ""], ["dk.size", p.size], ["rq.marks", p.marks], ["dk.viewing", op ? "" : t("viewing." + a.viewing)], ["dk.needed", p.needed_by],
            ["ap.fee", a.fee != null ? money(a.fee, a.currency) : ""], ["ap.basis", a.basis ? t("basis." + a.basis) : ""], ["ap.registry", a.certificate_no]]
          .filter(function (r) { return r[1]; }).map(function (r) { return "<dt>" + esc(t(r[0])) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" +
          (p.story ? "<h4>" + esc(t("rq.p2")) + '</h4><p class="msg">' + esc(p.story) + "</p>" : "") + (p.provenance ? "<h4>" + esc(t("dk.prov")) + '</h4><p class="msg">' + esc(p.provenance) + "</p>" : "") +
        "</section><section><h4>" + esc(t("ap.photos")) + "</h4>" + apGallery(a) + "</section></div>" +
        '<div class="ap-actions">' + actions + "</div>" +
        '<div class="ap-cols ap-cols-2"><section><h4>' + esc(t("ap.messages")) + "</h4>" + apMessages(a) +
          (OPEN_ST.indexOf(a.status) > -1 ? '<form class="ap-send" data-form="message"><label><span class="sr">' + esc(t("dk.message")) + '</span><input name="body" placeholder="' + attr(t("dk.message")) + '"></label><button class="link-btn" type="submit">' + esc(t("ap.send")) + "</button></form>" : "") +
          "<h4>" + esc(t("dk.note_label")) + '</h4><ul class="ap-events">' + notes.map(function (e) { return '<li><p class="msg">' + esc(e.body) + "</p><time>" + esc(e.by + " · " + dateTime(e.created_at)) + "</time></li>"; }).join("") + "</ul>" +
          '<form class="ap-send" data-form="note"><label><span class="sr">' + esc(t("dk.internal")) + '</span><input name="body" placeholder="' + attr(t("dk.internal")) + '"></label><button class="link-btn" type="submit">' + esc(t("dk.add_note")) + "</button></form>" +
        "</section><section><h4>" + esc(t("dk.history")) + "</h4>" + apJourney(a) + "</section></div>" +
        (OPEN_ST.indexOf(a.status) > -1 && isAdmin ? '<form class="ap-send ap-cancel" data-form="cancel"><label><span class="sr">' + esc(t("ap.reason")) + '</span><input name="body" placeholder="' + attr(t("ap.reason")) + '"></label><button class="link-btn danger" type="submit">' + esc(t("dk.cancel")) + "</button></form>" : "") +
      "</div>";

    function again() { deskOpen[a.id] = true; return RENDER.desk_appraisals(panel); }
    function run(action, extra, form) {
      var note = form ? $(".note", form) : $(".ap-actions .note", el);
      return act(a, action, extra).then(again).catch(function (e) { if (note) flash(note, errText(e), true); else alert(errText(e)); });
    }
    function val(form, n) { return form[n] ? form[n].value : ""; }
    $$("[data-form]", el).forEach(function (form) {
      var kind = form.getAttribute("data-form");
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        if (kind === "quote") return run("quote", { expert_id: val(form, "expert_id"), reviewer_id: val(form, "reviewer_id") || null, fee: val(form, "fee"), currency: val(form, "currency"), basis: val(form, "basis"), body: val(form, "body") }, form);
        if (kind === "received") return run("received", { body: val(form, "body") }, form);
        if (kind === "returned") return run("returned", { carrier: val(form, "carrier"), tracking_number: val(form, "tracking_number"), tracking_url: val(form, "tracking_url") }, form);
        if (kind === "assign") return run("assign", { expert_id: val(form, "expert_id") || null, reviewer_id: val(form, "reviewer_id") || null }, form);
        if (kind === "findings") return saveFindings(form);
        if (kind === "message" || kind === "note" || kind === "cancel") { if (!val(form, "body").trim()) return; return run(kind, { body: val(form, "body") }, form); }
      });
    });
    function findingsOf(form) {
      var out = {};
      ["attribution", "origin", "period", "materials", "technique", "marks", "condition", "summary", "value", "value_currency"].forEach(function (k) { if (form[k]) out[k] = form[k].value; });
      return out;
    }
    function saveFindings(form) { return act(a, "findings", { findings: findingsOf(form) }).then(function () { flash($(".note", form), t("p.saved")); }).catch(function (e) { flash($(".note", form), errText(e), true); }); }
    $$("[data-do]", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-do"), form = b.closest("form");
        if (k === "to_review") {
          // Save what is written, then send it on.
          return act(a, "findings", { findings: findingsOf(form) }).then(function () { return run("to_review", {}, form); }).catch(function (e) { flash($(".note", form), errText(e), true); });
        }
        run(k, form ? { body: val(form, "body") } : {}, form);
      });
    });
    return el;
  }

  // ---- Admin: people and roles ----
  RENDER.people = function (panel, term) {
    term = term || "";
    return api("GET", "/api/users?q=" + encodeURIComponent(term)).then(function (j) {
      var roles = ["client", "provider", "sales", "expert", "admin"];
      panel.innerHTML = '<div class="bar"><h2>' + esc(t("tab.people")) + '</h2><input id="ppSearch" type="search" placeholder="' + attr(t("pp.search")) + '" value="' + attr(term) + '"></div>' +
        '<div class="table-wrap"><table class="people"><thead><tr><th>' + esc(t("a.name")) + "</th><th>" + esc(t("a.email")) + "</th><th>" + esc(t("pp.role")) + "</th><th>" + esc(t("pp.orders")) + "</th><th>" + esc(t("pp.joined")) + "</th></tr></thead><tbody>" +
        j.users.map(function (u) {
          return "<tr><td>" + esc(u.name) + '</td><td dir="ltr">' + esc(u.email) + '</td><td><select data-id="' + attr(u.id) + '"' + (u.id === user.id ? " disabled" : "") + ">" +
            roles.map(function (r) { return '<option value="' + r + '"' + (r === u.role ? " selected" : "") + ">" + esc(t("role." + r)) + "</option>"; }).join("") +
            '</select> <span class="note" role="status"></span></td><td>' + esc(u.orders) + "</td><td>" + esc(date(u.created_at)) + "</td></tr>";
        }).join("") + "</tbody></table></div>";
      var s = $("#ppSearch"), timer;
      s.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { RENDER.people(panel, s.value).then(function () { var n = $("#ppSearch"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }); }, 350); });
      $$("select[data-id]", panel).forEach(function (sel) {
        var was = sel.value;
        sel.addEventListener("change", function () {
          var note = sel.parentNode.querySelector(".note");
          api("PATCH", "/api/users", { id: sel.getAttribute("data-id"), role: sel.value })
            .then(function () { was = sel.value; flash(note, "✓"); })
            .catch(function (e) { sel.value = was; flash(note, errText(e), true); });
        });
      });
    });
  };

  // ---- Start ----
  api("GET", "/api/auth").then(function (j) {
    user = j.user;
    if (user) renderDashboard();
    else renderAuth(new URLSearchParams(location.search).get("mode") === "signup" ? "signup" : "signin");
  }).catch(function () { app.innerHTML = '<p class="note bad">' + esc(t("err.generic")) + "</p>"; });
})();
