// /api/products — pieces added by product providers, reviewed by an admin.
// GET: a provider sees their own; an admin sees all (?status=pending). ?id= gives one.
// POST { data, submit }: a provider (or admin) adds a piece, as a draft or sent for review.
// PATCH { id, data, submit } edits it (an approved piece that is edited goes back for review);
// PATCH { id, status: "approved" | "rejected", review_note }: an admin decides.
// DELETE ?id=: the provider removes a piece that is not live yet; an admin removes any.
// Approved pieces appear on the site through /api/catalog.
import { q, one } from "./_lib/db.js";
import { endpoint, body, query, str, ml, url, oneOf, fail } from "./_lib/http.js";
import { requireUser } from "./_lib/auth.js";

const MAKERS = ["provider", "admin"];
// Addresses the site's own pieces already use.
const RESERVED = ["engraved-lidded-vase", "vase", "box", "tray", "lantern", "mirror", "carpet"];

// The fields of the ARTRA Product Detail form.
function clean(d) {
  if (!d || typeof d !== "object") fail(400, "bad_input");
  const out = {
    name: ml(d.name, 200), category: ml(d.category, 120), id: str(d.id, 60),
    photo: url(d.photo), cutout: url(d.cutout), city: /^[a-z-]{0,40}$/.test(str(d.city, 40)) ? str(d.city, 40) : fail(400, "bad_input"),
    artist: ml(d.artist, 200), origin: ml(d.origin, 200),
    history: ml(d.history), description: ml(d.description), medium: ml(d.medium, 300),
    dimensions: ml(d.dimensions, 300), packaging: ml(d.packaging, 300), additional: ml(d.additional),
    care: ml(d.care), returns: ml(d.returns), updated: str(d.updated, 40),
  };
  const en = typeof out.name === "object" ? out.name.en : out.name;
  if (!en) fail(400, "name_required");
  return out;
}
const enName = (d) => (typeof d.name === "object" ? d.name.en : d.name) || "piece";

async function uniqueSlug(name) {
  const base = String(name).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "piece";
  for (let i = 1; i < 100; i++) {
    const s = i === 1 ? base : `${base}-${i}`;
    if (!RESERVED.includes(s) && !(await one("SELECT 1 FROM products WHERE slug = $1", [s]))) return s;
  }
  fail(409, "slug_taken");
}

async function mine(u, id) {
  const p = await one("SELECT * FROM products WHERE id = $1", [Number(id) || 0]);
  if (!p) fail(404, "not_found");
  if (u.role !== "admin" && p.provider_id !== u.id) fail(403, "forbidden");
  return p;
}

export default endpoint({
  async GET(req) {
    const u = await requireUser(req, MAKERS);
    const qs = query(req);
    if (qs.get("id")) return { product: await mine(u, qs.get("id")) };
    const status = qs.get("status");
    const rows = await q(`SELECT p.*, v.name AS provider_name, v.email AS provider_email FROM products p LEFT JOIN users v ON v.id = p.provider_id
                          WHERE ($1 OR p.provider_id = $2) AND ($3::text IS NULL OR p.status = $3)
                          ORDER BY p.updated_at DESC LIMIT 500`,
      [u.role === "admin", u.id, ["draft", "pending", "approved", "rejected"].includes(status) ? status : null]);
    return { products: rows };
  },

  async POST(req) {
    const u = await requireUser(req, MAKERS);
    const b = await body(req);
    const data = clean(b.data);
    const p = await one(`INSERT INTO products (slug, provider_id, status, data) VALUES ($1, $2, $3, $4::jsonb) RETURNING *`,
      [await uniqueSlug(enName(data)), u.id, b.submit ? "pending" : "draft", JSON.stringify(data)]);
    return { product: p };
  },

  async PATCH(req) {
    const u = await requireUser(req, MAKERS);
    const b = await body(req);
    const p = await mine(u, b.id);
    if (b.status === "approved" || b.status === "rejected") {
      if (u.role !== "admin") fail(403, "forbidden");
      return { product: await one("UPDATE products SET status = $2, review_note = $3, updated_at = now() WHERE id = $1 RETURNING *",
        [p.id, oneOf(b.status, ["approved", "rejected"]), str(b.review_note, 1000)]) };
    }
    const data = b.data === undefined ? p.data : clean(b.data);
    // A provider's edit (or submit) sends the piece for review; an admin's edit keeps its status unless submitting.
    let status = p.status;
    if (b.submit) status = u.role === "admin" ? "approved" : "pending";
    else if (u.role !== "admin" && b.data !== undefined && p.status !== "draft") status = "pending";
    return { product: await one("UPDATE products SET data = $2::jsonb, status = $3, updated_at = now() WHERE id = $1 RETURNING *",
      [p.id, JSON.stringify(data), status]) };
  },

  async DELETE(req) {
    const u = await requireUser(req, MAKERS);
    const p = await mine(u, query(req).get("id"));
    if (u.role !== "admin" && p.status === "approved") fail(403, "live");
    await q("DELETE FROM products WHERE id = $1", [p.id]);
    return { ok: true };
  },
});
