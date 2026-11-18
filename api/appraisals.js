// /api/appraisals — appraisal and expertise requests, from the client's request to the signed certificate.
//
// The stages (status), and who moves a request from one to the next (PATCH { id, action, ... }):
//   submitted    → info_needed  "ask"        sales, admin  (a question for the client; body required)
//   info_needed  → submitted    "reply"      the client    (an answer, and more photos if asked)
//   submitted    → declined     "decline"    sales, admin  (the reason is shown to the client; body required)
//   submitted    → quoted       "quote"      admin         (expert, second expert, fee, basis of value)
//   quoted       → accepted     "accept"     the client    (or "refuse" → closed)
//   accepted     → received     "received"   sales, admin  (the piece is at the atelier; a condition note)
//   received     → examination  "start"      the expert, admin  (an opinion from photographs starts from accepted)
//   examination  → peer_review  "to_review"  the expert, admin  (the findings must be written first: "findings")
//   peer_review  → ready        "agree"      the second expert, admin (never the expert who examined it)
//   peer_review  → examination  "send_back"  the second expert, admin (body required)
//   ready        → issued       "issue"      admin         (a certificate number, except for an opinion)
//   issued       → returned     "returned"   sales, admin  (carrier and tracking; not for an opinion)
// Also: "withdraw" (the client, before accepting), "cancel" (admin, any open request), "assign" (admin: the
// expert and second expert), "message" (client and the people on the file), "note" (internal, staff only),
// "add_photos" (the client, while the file is open).
// GET: a client sees their own; sales and admin see all; an expert sees those assigned to them. ?id= gives one.
// The client never sees internal notes, and sees the findings only once the certificate is issued.
import { q, one } from "./_lib/db.js";
import { endpoint, body, query, str, oneOf, uuid, url, fail, LANGS } from "./_lib/http.js";
import { requireUser } from "./_lib/auth.js";

const SERVICES = ["opinion", "appraisal", "authentication"];
const PURPOSES = ["insurance", "selling", "estate", "donation", "knowledge", "other"];
const AGES = ["", "unsure", "under50", "50to100", "over100"];
const BASES = ["", "insurance", "market", "auction"];
const SHOTS = ["front", "back", "base", "marks", "detail", "damage", "document", "other"];
const OPEN = ["submitted", "info_needed", "quoted", "accepted", "received", "examination", "peer_review", "ready"];
const STAFF = ["sales", "admin"];
const MAX_PHOTOS = 24;

const number = (id) => "APR-" + (1000 + Number(id));
const city = (v) => { const s = str(v, 40); if (s && !/^[a-z-]+$/.test(s)) fail(400, "bad_input"); return s; };

// The piece as the client describes it.
function piece(b) {
  const title = str(b.title, 200);
  if (!title) fail(400, "piece_required");
  const needed = str(b.needed_by, 10);
  if (needed && !/^\d{4}-\d{2}-\d{2}$/.test(needed)) fail(400, "bad_input");
  return {
    title, craft: str(b.craft, 60), city: city(b.city), age: oneOf(str(b.age, 20), AGES),
    size: str(b.size, 200), marks: str(b.marks, 1000), story: str(b.story, 4000), provenance: str(b.provenance, 4000), needed_by: needed,
  };
}
function photos(list) {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list) || list.length > MAX_PHOTOS) fail(400, "bad_input");
  return list.map((p) => ({ kind: oneOf(str(p && p.kind, 20) || "other", SHOTS), url: url(p && p.url) || fail(400, "bad_url") }));
}
// What the expert writes. The value is only for a full appraisal.
function findings(b, service) {
  const f = {};
  for (const k of ["attribution", "period", "materials", "technique", "marks", "condition", "summary"]) f[k] = str(b[k], 4000);
  f.origin = city(b.origin);
  if (service === "appraisal") {
    const v = b.value === "" || b.value == null ? null : Number(b.value);
    if (v !== null && !(v >= 0 && v < 1e12)) fail(400, "bad_amount");
    f.value = v;
    f.value_currency = (str(b.value_currency, 3) || "EUR").toUpperCase();
  }
  return f;
}

const COLS = `a.*, c.name AS client_name, c.email AS client_email, c.country AS client_country,
              e.name AS expert_name, r.name AS reviewer_name`;
const FROM = `appraisals a JOIN users c ON c.id = a.client_id
              LEFT JOIN users e ON e.id = a.expert_id LEFT JOIN users r ON r.id = a.reviewer_id`;

// What this person may see of a request.
function shape(a, u, events) {
  const onFile = STAFF.includes(u.role) || a.expert_id === u.id || a.reviewer_id === u.id;
  const out = { ...a, number: number(a.id), on_file: onFile };
  if (!onFile) {
    // The client: no internal notes, no second expert's name, and the findings only once issued.
    delete out.reviewer_id; delete out.reviewer_name;
    if (!["issued", "returned"].includes(a.status)) out.findings = {};
  }
  let seenExam = false;
  out.events = events.filter((e) => String(e.appraisal_id) === String(a.id)).filter((e) => {
    if (onFile) return true;
    if (e.kind === "note") return false;
    // The client follows "with the expert" as one stage: the second expert's review is not shown.
    if (e.kind === "status" && (e.status === "peer_review" || e.status === "ready")) return false;
    if (e.kind === "status" && e.status === "examination") { if (seenExam) return false; seenExam = true; }
    return true;
  })
    .map((e) => ({ kind: e.kind, status: e.status, body: e.body, created_at: e.created_at, by: e.by_name || "", by_client: e.created_by === a.client_id }));
  return out;
}
async function eventsFor(ids) {
  if (!ids.length) return [];
  return q(`SELECT ev.*, u.name AS by_name FROM appraisal_events ev LEFT JOIN users u ON u.id = ev.created_by
            WHERE ev.appraisal_id = ANY($1::bigint[]) ORDER BY ev.created_at, ev.id`, [ids]);
}
const log = (id, kind, status, text, by) =>
  q("INSERT INTO appraisal_events (appraisal_id, kind, status, body, created_by) VALUES ($1, $2, $3, $4, $5)", [id, kind, status, text, by]);

export default endpoint({
  async GET(req) {
    const u = await requireUser(req);
    const id = query(req).get("id");
    const staff = STAFF.includes(u.role);
    const where = staff ? "TRUE" : "(a.client_id = $1 OR a.expert_id = $1 OR a.reviewer_id = $1)";
    const params = staff ? [] : [u.id];
    if (id) {
      params.push(Number(id) || 0);
      const a = await one(`SELECT ${COLS} FROM ${FROM} WHERE ${where} AND a.id = $${params.length}`, params);
      if (!a) fail(404, "not_found");
      return { appraisal: shape(a, u, await eventsFor([a.id])) };
    }
    const rows = await q(`SELECT ${COLS} FROM ${FROM} WHERE ${where} ORDER BY a.updated_at DESC LIMIT 500`, params);
    const events = await eventsFor(rows.map((r) => r.id));
    return { appraisals: rows.map((a) => shape(a, u, events)) };
  },

  // A new request, from a signed-in person.
  async POST(req) {
    const u = await requireUser(req);
    const b = await body(req);
    if (b.website) return { ok: true };                 // a field people never see: only bots fill it in
    if (!b.owner) fail(400, "owner_required");          // "I own this piece, or I am authorised by its owner"
    const p = piece(b);
    const a = await one(`INSERT INTO appraisals (client_id, service, purpose, viewing, piece, photos, lang)
                         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [u.id, oneOf(b.service, SERVICES), oneOf(b.purpose, PURPOSES), oneOf(b.viewing || "ship", ["ship", "visit"]),
       JSON.stringify(p), JSON.stringify(photos(b.photos)), LANGS.includes(b.lang) ? b.lang : "en"]);
    await log(a.id, "status", "submitted", str(b.message, 4000), u.id);
    return { appraisal: { id: a.id, number: number(a.id), status: a.status } };
  },

  async PATCH(req) {
    const u = await requireUser(req);
    const b = await body(req);
    const id = Number(b.id);
    const a = Number.isInteger(id) ? await one("SELECT * FROM appraisals WHERE id = $1", [id]) : null;
    if (!a) fail(404, "not_found");
    const isClient = a.client_id === u.id, isAdmin = u.role === "admin", isStaff = STAFF.includes(u.role);
    const isExpert = a.expert_id === u.id, isReviewer = a.reviewer_id === u.id;
    if (!isClient && !isStaff && !isExpert && !isReviewer) fail(404, "not_found");
    const action = str(b.action, 20), text = str(b.body, 4000);
    const allow = (ok) => { if (!ok) fail(403, "forbidden"); };
    const from = (...list) => { if (!list.includes(a.status)) fail(409, "wrong_stage"); };
    const need = (v, code) => { if (!v) fail(400, code); return v; };

    // Move to a new stage, only if nobody else moved it meanwhile.
    async function move(to, extra = {}, note = text) {
      const sets = ["status = $3", "updated_at = now()"], vals = [id, a.status, to];
      for (const [k, v] of Object.entries(extra)) { vals.push(v); sets.push(`${k} = $${vals.length}`); }
      const row = await one(`UPDATE appraisals SET ${sets.join(", ")} WHERE id = $1 AND status = $2 RETURNING *`, vals);
      if (!row) fail(409, "wrong_stage");
      await log(id, "status", to, note, u.id);
      return row;
    }
    async function person(v, code) {
      if (!v) return null;
      const pid = uuid(v, code);
      if (!(await one("SELECT 1 FROM users WHERE id = $1 AND role IN ('expert', 'admin')", [pid]))) fail(400, code);
      return pid;
    }

    switch (action) {
      case "message":
        need(text, "message_required");
        await log(id, "message", "", text, u.id);
        await q("UPDATE appraisals SET updated_at = now() WHERE id = $1", [id]);
        return { ok: true };
      case "note":
        allow(isStaff || isExpert || isReviewer);
        need(text, "message_required");
        await log(id, "note", "", text, u.id);
        return { ok: true };
      case "add_photos": {
        allow(isClient); from(...OPEN);
        const add = photos(b.photos), all = (a.photos || []).concat(add);
        if (all.length > MAX_PHOTOS) fail(400, "too_many_photos");
        await q("UPDATE appraisals SET photos = $2, updated_at = now() WHERE id = $1", [id, JSON.stringify(all)]);
        await log(id, "message", "", text || "", u.id);
        return { ok: true };
      }

      // Screening
      case "ask": allow(isStaff); from("submitted"); need(text, "message_required"); return { appraisal: await move("info_needed") };
      case "reply": {
        allow(isClient); from("info_needed");
        const add = photos(b.photos), all = (a.photos || []).concat(add);
        if (all.length > MAX_PHOTOS) fail(400, "too_many_photos");
        return { appraisal: await move("submitted", { photos: JSON.stringify(all) }) };
      }
      case "decline": allow(isStaff); from("submitted", "info_needed"); need(text, "reason_required"); return { appraisal: await move("declined") };
      case "withdraw": allow(isClient); from("submitted", "info_needed", "quoted"); return { appraisal: await move("withdrawn") };

      // The quote
      case "assign": {
        allow(isAdmin); from(...OPEN);
        const expert = await person(b.expert_id, "bad_expert"), reviewer = await person(b.reviewer_id, "bad_expert");
        if (expert && expert === reviewer) fail(400, "same_expert");
        if (expert === a.client_id || reviewer === a.client_id) fail(400, "conflict");
        await q("UPDATE appraisals SET expert_id = $2, reviewer_id = $3, updated_at = now() WHERE id = $1", [id, expert, reviewer]);
        await log(id, "note", "", text || "Experts assigned.", u.id);
        return { ok: true };
      }
      case "quote": {
        allow(isAdmin); from("submitted");
        const expert = need(await person(b.expert_id, "bad_expert"), "expert_required");
        const reviewer = await person(b.reviewer_id, "bad_expert");
        if (expert === reviewer) fail(400, "same_expert");
        if (expert === a.client_id || reviewer === a.client_id) fail(400, "conflict");
        const fee = Number(b.fee);
        if (b.fee === "" || b.fee == null || !(fee >= 0 && fee < 1e10)) fail(400, "bad_amount");
        const basis = a.service === "appraisal" ? oneOf(str(b.basis, 20), BASES.slice(1), "basis_required") : "";
        return { appraisal: await move("quoted", { expert_id: expert, reviewer_id: reviewer, fee, currency: (str(b.currency, 3) || "EUR").toUpperCase(), basis }) };
      }
      case "accept": allow(isClient); from("quoted"); return { appraisal: await move("accepted") };
      case "refuse": allow(isClient); from("quoted"); return { appraisal: await move("closed") };

      // The piece, the examination and the second opinion
      case "received": allow(isStaff); from("accepted"); if (a.service === "opinion") fail(409, "wrong_stage"); return { appraisal: await move("received") };
      case "start":
        allow(isExpert || isAdmin);
        if (a.service === "opinion") from("accepted"); else from("received");
        return { appraisal: await move("examination") };
      case "findings": {
        allow(isExpert || isAdmin); from("examination");
        const f = findings(b.findings || {}, a.service);
        const row = await one("UPDATE appraisals SET findings = $2, updated_at = now() WHERE id = $1 RETURNING *", [id, JSON.stringify(f)]);
        return { appraisal: row };
      }
      case "to_review": {
        allow(isExpert || isAdmin); from("examination");
        const f = a.findings || {};
        if (!f.attribution && !f.summary) fail(400, "findings_required");
        if (a.service === "appraisal" && f.value == null) fail(400, "value_required");
        return { appraisal: await move("peer_review") };
      }
      case "agree": allow((isReviewer || isAdmin) && !isExpert); from("peer_review"); return { appraisal: await move("ready") };
      case "send_back": allow((isReviewer || isAdmin) && !isExpert); from("peer_review"); need(text, "message_required"); return { appraisal: await move("examination") };

      // The certificate and the return
      case "issue": {
        allow(isAdmin); from("ready");
        const year = new Date().getUTCFullYear();
        const no = a.service === "opinion" ? null : `ARX-${year}-${String(id).padStart(4, "0")}`;
        return { appraisal: await move("issued", { certificate_no: no, issued_at: new Date().toISOString() }) };
      }
      case "returned":
        allow(isStaff); from("issued");
        if (a.service === "opinion") fail(409, "wrong_stage");
        return { appraisal: await move("returned", { carrier: str(b.carrier, 80), tracking_number: str(b.tracking_number, 120), tracking_url: url(b.tracking_url) }) };
      case "cancel": allow(isAdmin); from(...OPEN); need(text, "reason_required"); return { appraisal: await move("closed") };
      default: fail(400, "bad_action");
    }
  },
});
