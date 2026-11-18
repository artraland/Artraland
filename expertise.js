// ARTRA — the appraisal & expertise pages: /expertise (the service), /request-appraisal (the request form) and
// /verify (the public check of a certificate number). The account page shows each request's stages.
(function () {
  "use strict";
  var T = window.ARTRA_I18N, t = T.t, lang = T.lang;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function attr(s) { return esc(s).replace(/"/g, "&quot;"); }
  function date(d) { try { return new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(new Date(d)); } catch (e) { return String(d).slice(0, 10); } }
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The page's own title and description, in the visitor's language.
  document.title = t(document.body.getAttribute("data-title"));
  var md = $('meta[name="description"]');
  if (md) md.content = t(document.body.getAttribute("data-desc"));

  // Header: the menu on phones, and the bar darkening once the page scrolls.
  $("#year").textContent = new Date().getFullYear();
  var burger = $("#burger"), nav = $("#nav"), top = $("#top");
  burger.addEventListener("click", function () { var o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }); });
  function onScroll() { top.classList.toggle("scrolled", scrollY > 30); }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Sections rise into view.
  function reveal(root) {
    var els = $$(".reveal", root || document);
    if (!("IntersectionObserver" in window) || reduced) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }
  reveal();

  function api(method, path, data) {
    var isFile = data instanceof Blob, headers = {};
    if (method !== "GET") headers["X-Artra"] = "1";
    if (data !== undefined) headers["Content-Type"] = isFile ? (data.type || "application/octet-stream") : "application/json";
    return fetch(path, { method: method, headers: headers, credentials: "same-origin", body: data === undefined ? undefined : isFile ? data : JSON.stringify(data) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) { var e = new Error(j.error || "generic"); e.code = j.error || "generic"; e.status = r.status; throw e; }
          return j;
        });
      });
  }
  function errText(e) { var k = "err." + (e && e.code); var s = t(k); return s === k ? t("err.generic") : s; }
  function cityName(k) { return k && window.ARTRA_ROAD && ARTRA_ROAD.city(k) ? ARTRA_ROAD.name(k) : ""; }

  // ---- The certificate check (on /expertise and /verify) ----
  var vf = $("#verifyForm");
  if (vf) {
    var out = $("#verifyOut");
    function check(no) {
      no = String(no || "").trim();
      if (!no) return;
      api("GET", "/api/verify?no=" + encodeURIComponent(no)).then(function (j) {
        if (!j.found) { out.innerHTML = '<p class="vf-no">' + esc(t("ex.verify_not")) + "</p>"; return; }
        var c = j.certificate, place = [cityName(c.city), c.period].filter(Boolean).join(" · ");
        out.innerHTML = '<div class="vf-ok"><b>✓ ' + esc(t("ex.verify_found")) + '</b><span class="t">' + esc(c.title) + "</span>" +
          (place ? "<span>" + esc(place) + "</span>" : "") +
          '<span class="muted">' + esc(t("svc." + c.service)) + " · " + esc(t("ex.verify_issued", { date: date(c.issued_at) })) + ' · <span dir="ltr">' + esc(c.no) + "</span></span></div>";
      }).catch(function (e) { out.innerHTML = '<p class="vf-no">' + esc(errText(e)) + "</p>"; });
    }
    vf.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var no = vf.no.value.trim();
      if (document.body.classList.contains("vf-page")) history.replaceState(null, "", "/verify?no=" + encodeURIComponent(no));
      check(no);
    });
    // A certificate's QR code opens /verify?no=…
    var given = new URLSearchParams(location.search).get("no");
    if (given) { vf.no.value = given; check(given); }
  }

  // ---- The request form ----
  var app = $("#rqApp");
  if (!app) return;
  var SHOTS = ["front", "back", "base", "marks", "detail", "damage"];
  var CRAFTS = ["metal", "enamel", "khatam", "brass", "filigree", "mirror", "silk"];
  var photos = {}, docs = [], uploadsOn = true;

  api("GET", "/api/auth").then(function (j) {
    if (!j.user) {
      app.innerHTML = '<div class="rq-signin"><p class="lede">' + esc(t("rq.signin")) + '</p><a class="btn btn-gold" href="/account?mode=signup&amp;next=' + encodeURIComponent("/request-appraisal" + location.search) + '">' + esc(t("rq.signin_btn")) + "</a></div>";
      return;
    }
    form();
    // Is photo upload switched on? (An empty upload is refused either way; the reason tells.)
    api("POST", "/api/upload?for=appraisal", new Blob([], { type: "text/plain" })).catch(function (e) {
      if (e.code === "uploads_off") { uploadsOn = false; $("#rqOff").hidden = false; $$(".shot-box input, #docFile", app).forEach(function (i) { i.disabled = true; }); }
    });
  }).catch(function (e) { app.innerHTML = '<p class="note bad">' + esc(errText(e)) + "</p>"; });

  function opt(v, label, sel) { return '<option value="' + attr(v) + '"' + (v === sel ? " selected" : "") + ">" + esc(label) + "</option>"; }

  function form() {
    var want = new URLSearchParams(location.search).get("service");
    var service = ["opinion", "appraisal", "authentication"].indexOf(want) > -1 ? want : "appraisal";
    var cities = window.ARTRA_ROAD ? ARTRA_ROAD.cities.map(function (c) { return opt(c.key, ARTRA_ROAD.name(c.key) + " · " + ARTRA_ROAD.region(c.key)); }).join("") : "";
    app.innerHTML =
      '<div class="rq-grid"><form class="rq-form" id="rqForm" novalidate>' +
        '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<fieldset data-part="1"><legend><i>i.</i>' + esc(t("rq.p1")) + "</legend>" +
          '<label>' + esc(t("rq.name")) + ' *<input name="title" required maxlength="200" placeholder="' + attr(t("rq.name_ph")) + '"></label>' +
          '<div class="rq-two">' +
            '<label>' + esc(t("rq.craft")) + '<select name="craft">' + opt("", "—") + CRAFTS.map(function (k) { return opt(k, t("c." + k)); }).join("") + opt("unsure", t("c.unsure")) + "</select></label>" +
            '<label>' + esc(t("rq.city")) + '<select name="city">' + opt("", t("rq.unsure")) + cities + "</select></label>" +
            '<label>' + esc(t("rq.age")) + '<select name="age">' + ["unsure", "under50", "50to100", "over100"].map(function (k) { return opt(k, t("age." + k)); }).join("") + "</select></label>" +
            '<label>' + esc(t("rq.size")) + '<input name="size" maxlength="200" placeholder="' + attr(t("rq.size_ph")) + '"></label>' +
          "</div>" +
          '<label>' + esc(t("rq.marks")) + '<input name="marks" maxlength="1000" placeholder="' + attr(t("rq.marks_ph")) + '"></label>' +
        "</fieldset>" +
        '<fieldset data-part="2"><legend><i>ii.</i>' + esc(t("rq.p2")) + "</legend>" +
          '<label>' + esc(t("rq.story")) + '<textarea name="story" rows="3" maxlength="4000" placeholder="' + attr(t("rq.story_ph")) + '"></textarea></label>' +
          '<label>' + esc(t("rq.prov")) + '<textarea name="provenance" rows="2" maxlength="4000"></textarea></label>' +
          '<div class="rq-docs"><span>' + esc(t("rq.docs")) + '</span><label class="btn btn-ghost" style="cursor:pointer">' + esc(t("rq.add_doc")) +
            '<input type="file" id="docFile" accept="image/jpeg,image/png,image/webp,application/pdf" hidden></label><div class="doc-list" id="docList"></div></div>' +
        "</fieldset>" +
        '<fieldset data-part="3"><legend><i>iii.</i>' + esc(t("rq.p3")) + "</legend>" +
          '<p class="muted" style="margin:0">' + esc(t("rq.photos_lede")) + "</p>" +
          '<p class="rq-off" id="rqOff" hidden>' + esc(t("rq.uploads_off")) + "</p>" +
          '<div class="rq-shots">' + SHOTS.map(function (k) {
            return '<div class="shot"><label class="shot-box" data-shot="' + k + '"><span aria-hidden="true">+</span><span class="sr">' + esc(t("rq.add") + ": " + t("shot." + k)) + '</span>' +
              '<input type="file" accept="image/jpeg,image/png,image/webp"></label><span>' + esc(t("shot." + k)) + "</span></div>";
          }).join("") + "</div>" +
          '<p class="note" id="shotNote" role="status"></p>' +
        "</fieldset>" +
        '<fieldset data-part="4"><legend><i>iv.</i>' + esc(t("rq.p4")) + "</legend>" +
          '<p class="muted" style="margin:0">' + esc(t("rq.purpose")) + "</p>" +
          '<div class="chips">' + ["insurance", "selling", "estate", "donation", "knowledge", "other"].map(function (k, i) {
            return '<label><input type="radio" name="purpose" value="' + k + '"' + (i === 0 ? " checked" : "") + ">" + esc(t("purpose." + k)) + "</label>";
          }).join("") + "</div>" +
          '<p class="muted" style="margin:8px 0 0">' + esc(t("rq.service")) + "</p>" +
          '<div class="svc-pick">' + ["opinion", "appraisal", "authentication"].map(function (k) {
            return '<label><b><input type="radio" name="service" value="' + k + '"' + (k === service ? " checked" : "") + ">" + esc(t("svc." + k)) + "</b><span>" + esc(t("svc." + k + "_out")) + "</span></label>";
          }).join("") + "</div>" +
          '<div class="rq-two">' +
            '<label id="viewingL">' + esc(t("rq.viewing")) + '<select name="viewing">' + opt("ship", t("viewing.ship")) + opt("visit", t("viewing.visit")) + "</select></label>" +
            '<label>' + esc(t("rq.needed")) + '<input type="date" name="needed_by"></label>' +
          "</div>" +
          '<label>' + esc(t("rq.message")) + '<textarea name="message" rows="2" maxlength="4000"></textarea></label>' +
        "</fieldset>" +
        '<fieldset data-part="5"><legend><i>v.</i>' + esc(t("rq.p5")) + "</legend>" +
          '<label class="rq-check"><input type="checkbox" name="owner">' + esc(t("rq.owner")) + "</label>" +
          '<label class="rq-check"><input type="checkbox" name="terms">' + esc(t("rq.terms")) + "</label>" +
          '<div class="rq-send"><button class="btn btn-gold" type="submit">' + esc(t("rq.send")) + '</button><p class="note" id="rqNote" role="status"></p></div>' +
        "</fieldset>" +
      "</form>" +
      '<aside class="rq-aside"><h2>' + esc(t("rq.next_title")) + "</h2><ol><li>" + esc(t("rq.next1")) + "</li><li>" + esc(t("rq.next2")) + "</li><li>" + esc(t("rq.next3")) + "</li><li>" + esc(t("rq.next4")) + "</li></ol>" +
        "<p>" + esc(t("rq.private")) + "</p></aside></div>";

    var f = $("#rqForm");
    // An opinion is from photographs: no need to say how the expert sees the piece.
    function svcChanged() { $("#viewingL").hidden = f.service.value === "opinion"; }
    $$('input[name="service"]', f).forEach(function (r) { r.addEventListener("change", svcChanged); });
    svcChanged();

    // The part of the form in view is lit in the row of parts above.
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) $$(".rq-parts li").forEach(function (li) { li.classList.toggle("on", li.getAttribute("data-part") === e.target.getAttribute("data-part")); }); });
      }, { rootMargin: "-40% 0px -55% 0px" });
      $$("fieldset", f).forEach(function (fs) { io.observe(fs); });
    }

    // Photographs: each box uploads its own.
    var note = $("#shotNote");
    function upload(file) {
      if (file.size > 4 * 1024 * 1024) return Promise.reject({ code: "too_large" });
      return api("POST", "/api/upload?for=appraisal", file);
    }
    $$(".shot-box", f).forEach(function (box) {
      var k = box.getAttribute("data-shot"), input = $("input", box);
      input.addEventListener("change", function () {
        var file = input.files[0];
        if (!file) return;
        note.textContent = t("rq.uploading"); note.className = "note";
        upload(file).then(function (j) {
          photos[k] = j.url;
          box.classList.add("has");
          var img = $("img", box) || box.insertBefore(new Image(), box.firstChild);
          img.src = j.url; img.alt = "";
          note.textContent = "";
        }).catch(function (e) { note.textContent = errText(e); note.className = "note bad"; })
          .then(function () { input.value = ""; });
      });
    });
    var docFile = $("#docFile"), docList = $("#docList");
    docFile.addEventListener("change", function () {
      var file = docFile.files[0];
      if (!file) return;
      note.textContent = t("rq.uploading");
      upload(file).then(function (j) {
        docs.push(j.url);
        docList.insertAdjacentHTML("beforeend", '<a href="' + attr(j.url) + '" target="_blank" rel="noopener">' + esc(file.name.slice(0, 60)) + "</a>");
        note.textContent = "";
      }).catch(function (e) { note.textContent = errText(e); note.className = "note bad"; }).then(function () { docFile.value = ""; });
    });

    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var n = $("#rqNote");
      function bad(code, el) { n.textContent = t(code); n.className = "note bad"; if (el) el.focus(); }
      if (!f.title.value.trim()) return bad("err.piece_required", f.title);
      if (!f.owner.checked) return bad("err.owner_required", f.owner);
      if (!f.terms.checked) return bad("err.terms", f.terms);
      var list = SHOTS.filter(function (k) { return photos[k]; }).map(function (k) { return { kind: k, url: photos[k] }; })
        .concat(docs.map(function (u) { return { kind: "document", url: u }; }));
      var payload = {
        website: f.website.value, title: f.title.value, craft: f.craft.value, city: f.city.value, age: f.age.value, size: f.size.value, marks: f.marks.value,
        story: f.story.value, provenance: f.provenance.value, purpose: f.purpose.value, service: f.service.value,
        viewing: f.service.value === "opinion" ? "ship" : f.viewing.value, needed_by: f.needed_by.value, message: f.message.value,
        owner: true, photos: list, lang: lang
      };
      var btn = $('button[type="submit"]', f);
      btn.disabled = true;
      api("POST", "/api/appraisals", payload).then(function (j) {
        $(".rq-parts").hidden = true;
        app.innerHTML = '<div class="rq-done"><p class="eyebrow">' + esc(t("rq.eyebrow")) + "</p><h2>" + esc(t("rq.sent_title", { no: (j.appraisal && j.appraisal.number) || "" })) + "</h2>" +
          '<p class="lede">' + esc(t("rq.sent_lede")) + '</p><a class="btn btn-gold" href="/account#appraisals">' + esc(t("rq.to_account")) + "</a></div>";
        scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      }).catch(function (e) { btn.disabled = false; n.textContent = errText(e); n.className = "note bad"; });
    });
  }
})();
