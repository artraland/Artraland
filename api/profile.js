// /api/profile — the signed-in person's own details.
// PATCH { name, phone, country, address, lang } · POST { action: "password", current, next }
import { q, one } from "./_lib/db.js";
import { endpoint, body, str, fail, LANGS } from "./_lib/http.js";
import { requireUser, publicUser, checkPassword, hashPassword, passwordOk } from "./_lib/auth.js";

export default endpoint({
  async GET(req) { return { user: publicUser(await requireUser(req)) }; },

  async PATCH(req) {
    const u = await requireUser(req);
    const b = await body(req);
    const name = str(b.name, 120);
    if (!name) fail(400, "name_required");
    const lang = LANGS.includes(b.lang) ? b.lang : u.lang;
    const row = await one(`UPDATE users SET name = $2, phone = $3, country = $4, address = $5, lang = $6 WHERE id = $1
                           RETURNING id, email, name, phone, country, address, lang, role, created_at`,
      [u.id, name, str(b.phone, 40), str(b.country, 80), str(b.address, 500), lang]);
    return { user: publicUser(row) };
  },

  async POST(req) {
    const u = await requireUser(req);
    const b = await body(req);
    if (b.action !== "password") fail(400, "bad_action");
    const row = await one("SELECT password_hash FROM users WHERE id = $1", [u.id]);
    if (!(await checkPassword(String(b.current || ""), row.password_hash))) fail(401, "bad_credentials");
    if (!passwordOk(b.next)) fail(400, "weak_password");
    await q("UPDATE users SET password_hash = $2 WHERE id = $1", [u.id, await hashPassword(b.next)]);
    return { ok: true };
  },
});
