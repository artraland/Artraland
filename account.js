// ARTRA — the account page (/account): sign in or create an account, then a profile with tabs for each role.
//   Client (everyone):  Profile · Saved pieces · My orders (with tracking) · My enquiries
//   Product provider:   + My pieces (add, edit, send for review)
//   Sales:              + Enquiries desk · Orders desk (record sales, update tracking)
//   Admin:              + Review pieces · People (roles) — and everything above
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
    client: ["orders", "favorites", "enquiries", "profile"],
    provider: ["products", "orders", "favorites", "enquiries", "profile"],
    sales: ["desk_enquiries", "desk_orders", "orders", "favorites", "enquiries", "profile"],
    admin: ["review", "desk_enquiries", "desk_orders", "products", "people", "orders", "favorites", "enquiries", "profile"]
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
      '<g' + flip + '><path d="' + ROAD_D + '" fill="none" stroke="#4a5a75" stroke-width="2" stroke-dasharray="4 7"/>' +
      '<path class="jr-gold" d="' + ROAD_D + '" pathLength="1" fill="none" stroke="url(#jrGold)" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + at + ' 1"/></g>';
    // Positions along the road (measured once the svg is in the page).
    svg._draw = function () {
      var path = svg.querySelector(".jr-gold"), L = path.getTotalLength();
      function pos(f) { var q = path.getPointAtLength(L * f); return { x: rtl ? 1100 - q.x : q.x, y: q.y }; }
      function arch(f, reached) {
        var q = pos(f), c = reached ? "#d4b467" : "#4a5a75";
        return '<path d="M' + (q.x - 18) + " " + (q.y + 20) + " V" + (q.y - 8) + " Q" + (q.x - 18) + " " + (q.y - 22) + " " + q.x + " " + (q.y - 28) + " Q" + (q.x + 18) + " " + (q.y - 22) + " " + (q.x + 18) + " " + (q.y - 8) + " V" + (q.y + 20) + '" fill="' + (reached ? "#162030" : "#111824") + '" stroke="' + c + '" stroke-width="1.6"/>' +
          (reached ? '<circle cx="' + q.x + '" cy="' + (q.y + 2) + '" r="5" fill="#d4b467"/>' : '<circle cx="' + q.x + '" cy="' + (q.y + 2) + '" r="4" fill="none" stroke="#4a5a75" stroke-width="1.5"/>');
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

  // ---- Admin: people and roles ----
  RENDER.people = function (panel, term) {
    term = term || "";
    return api("GET", "/api/users?q=" + encodeURIComponent(term)).then(function (j) {
      var roles = ["client", "provider", "sales", "admin"];
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
