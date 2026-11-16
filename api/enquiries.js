// /api/enquiries — enquiries about a piece and commission requests.
// POST: anyone sends one (linked to their account when signed in).
// GET: a client sees their own; sales and admin see all (?status=).
// PATCH { id, status, assigned_to, notes }: sales and admin manage them.
import { q, one } from "./_lib/db.js";
import { endpoint, body, query, str, email, oneOf, uuid, fail, LANGS } from "./_lib/http.js";
import { currentUser, requireUser } from "./_lib/auth.js";

const STATUSES = ["new", "in_progress", "answered", "closed"];
const STAFF = ["sales", "admin"];

export default endpoint({
  async POST(req) {
    const b = await body(req);
    if (b.website) return { ok: true };            // a field people never see: only bots fill it in
    const u = await currentUser(req);
    const kind = oneOf(b.kind, ["enquiry", "commission"]);
    const name = str(b.name, 120) || (u && u.name) || "";
    const mail = b.email ? email(b.email) : u ? u.email : fail(400, "bad_email");
    if (!name) fail(400, "name_required");
    const message = str(b.message, 4000);
    if (!message) fail(400, "message_required");
    const row = await one(`INSERT INTO enquiries (user_id, kind, name, email, product_slug, craft, message, lang)
                           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at`,
      [u ? u.id : null, kind, name, mail, str(b.product_slug, 120), str(b.craft, 120), message, LANGS.includes(b.lang) ? b.lang : "en"]);
    return { enquiry: row };
  },

  async GET(req) {
    const u = await requireUser(req);
    const status = query(req).get("status");
    if (STAFF.includes(u.role)) {
      const rows = await q(`SELECT e.*, a.name AS assigned_name FROM enquiries e LEFT JOIN users a ON a.id = e.assigned_to
                            WHERE ($1::text IS NULL OR e.status = $1) ORDER BY e.created_at DESC LIMIT 500`,
        [STATUSES.includes(status) ? status : null]);
      return { enquiries: rows };
    }
    const rows = await q(`SELECT id, kind, product_slug, craft, message, status, created_at, updated_at
                          FROM enquiries WHERE user_id = $1 ORDER BY created_at DESC`, [u.id]);
    return { enquiries: rows };
  },

  async PATCH(req) {
    await requireUser(req, STAFF);
    const b = await body(req);
    const id = Number(b.id);
    if (!Number.isInteger(id)) fail(400, "bad_id");
    const cur = await one("SELECT * FROM enquiries WHERE id = $1", [id]);
    if (!cur) fail(404, "not_found");
    const status = b.status === undefined ? cur.status : oneOf(b.status, STATUSES);
    let assigned = cur.assigned_to;
    if (b.assigned_to !== undefined) {
      assigned = b.assigned_to ? uuid(b.assigned_to, "bad_assignee") : null;
      if (assigned && !(await one("SELECT 1 FROM users WHERE id = $1 AND role IN ('sales', 'admin')", [assigned]))) fail(400, "bad_assignee");
    }
    const notes = b.notes === undefined ? cur.notes : str(b.notes, 4000);
    const row = await one(`UPDATE enquiries SET status = $2, assigned_to = $3, notes = $4, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, status, assigned, notes]);
    return { enquiry: row };
  },
});
