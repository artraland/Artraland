// /api/users — people and roles.
// GET (admin): everyone, ?q= to search by name or email. GET ?staff=1 (sales, admin): the sales team and admins,
// for assigning enquiries. GET ?experts=1 (sales, admin): experts and admins, for assigning appraisals. PATCH { id, role } (admin): change someone's role.
import { q, one } from "./_lib/db.js";
import { endpoint, body, query, str, oneOf, uuid, fail } from "./_lib/http.js";
import { requireUser } from "./_lib/auth.js";

const ROLES = ["client", "provider", "sales", "expert", "admin"];

export default endpoint({
  async GET(req) {
    const qs = query(req);
    if (qs.get("experts")) {
      // The people an appraisal can be assigned to.
      await requireUser(req, ["sales", "admin"]);
      return { users: await q("SELECT id, name, email, role FROM users WHERE role IN ('expert', 'admin') ORDER BY name") };
    }
    if (qs.get("staff")) {
      await requireUser(req, ["sales", "admin"]);
      return { users: await q("SELECT id, name, email, role FROM users WHERE role IN ('sales', 'admin') ORDER BY name") };
    }
    await requireUser(req, ["admin"]);
    const term = str(qs.get("q"), 100);
    const rows = await q(`SELECT u.id, u.name, u.email, u.role, u.country, u.created_at,
                            (SELECT count(*) FROM orders o WHERE o.client_id = u.id)::int AS orders
                          FROM users u
                          WHERE $1 = '' OR u.email ILIKE '%' || $1 || '%' OR u.name ILIKE '%' || $1 || '%'
                          ORDER BY u.created_at DESC LIMIT 500`, [term]);
    return { users: rows };
  },

  async PATCH(req) {
    const me = await requireUser(req, ["admin"]);
    const b = await body(req);
    const id = uuid(b.id);
    const role = oneOf(b.role, ROLES);
    // An admin cannot take away their own admin role (so there is always someone who can manage roles).
    if (id === me.id && role !== "admin") fail(400, "self_demote");
    const u = await one("UPDATE users SET role = $2 WHERE id = $1 RETURNING id, name, email, role", [id, role]);
    if (!u) fail(404, "not_found");
    return { user: u };
  },
});
