// /api/favorites — the signed-in person's saved pieces. GET · POST { slug } · DELETE ?slug=
import { q } from "./_lib/db.js";
import { endpoint, body, query, str, fail } from "./_lib/http.js";
import { requireUser } from "./_lib/auth.js";

const slugOf = (v) => { const s = str(v, 120); if (!/^[a-z0-9-]+$/.test(s)) fail(400, "bad_slug"); return s; };

export default endpoint({
  async GET(req) {
    const u = await requireUser(req);
    const rows = await q("SELECT product_slug, created_at FROM favorites WHERE user_id = $1 ORDER BY created_at DESC", [u.id]);
    return { favorites: rows.map((r) => r.product_slug) };
  },
  async POST(req) {
    const u = await requireUser(req);
    const slug = slugOf((await body(req)).slug);
    await q("INSERT INTO favorites (user_id, product_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING", [u.id, slug]);
    return { ok: true };
  },
  async DELETE(req) {
    const u = await requireUser(req);
    await q("DELETE FROM favorites WHERE user_id = $1 AND product_slug = $2", [u.id, slugOf(query(req).get("slug"))]);
    return { ok: true };
  },
});
