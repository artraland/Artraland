// /api/auth — GET: who is signed in. POST { action: "signup" | "signin" | "signout", … }.
import { q, one } from "./_lib/db.js";
import { endpoint, body, str, email, fail, LANGS } from "./_lib/http.js";
import { hashPassword, checkPassword, passwordOk, startSession, endSession, currentUser, promoteIfListed, publicUser } from "./_lib/auth.js";

export default endpoint({
  async GET(req) {
    const u = await currentUser(req);
    return { user: u ? publicUser(await promoteIfListed(u)) : null };
  },

  async POST(req, res) {
    const b = await body(req);
    const action = b.action;

    if (action === "signout") { await endSession(req, res); return { user: null }; }

    if (action === "signup") {
      const e = email(b.email);
      const name = str(b.name, 120);
      if (!name) fail(400, "name_required");
      if (!passwordOk(b.password)) fail(400, "weak_password");
      const lang = LANGS.includes(b.lang) ? b.lang : "en";
      if (await one("SELECT 1 FROM users WHERE email = $1", [e])) fail(409, "email_taken");
      // Everyone starts as a client; an admin changes roles later.
      const u = await one(`INSERT INTO users (email, name, lang, password_hash) VALUES ($1, $2, $3, $4)
                           RETURNING id, email, name, phone, country, address, lang, role, created_at`,
        [e, name, lang, await hashPassword(b.password)]);
      await promoteIfListed(u);
      await startSession(res, u.id);
      return { user: publicUser(u) };
    }

    if (action === "signin") {
      const e = email(b.email);
      const u = await one("SELECT * FROM users WHERE email = $1", [e]);
      // The same answer for an unknown address and a wrong password.
      if (!u) { await hashPassword("x".repeat(12)); fail(401, "bad_credentials"); }
      if (u.locked_until && new Date(u.locked_until) > new Date()) fail(429, "locked");
      if (!(await checkPassword(String(b.password || ""), u.password_hash))) {
        // Five wrong passwords lock the account for 15 minutes.
        await q(`UPDATE users SET failed_logins = failed_logins + 1,
                 locked_until = CASE WHEN failed_logins + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END
                 WHERE id = $1`, [u.id]);
        fail(401, "bad_credentials");
      }
      await q("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = $1", [u.id]);
      await promoteIfListed(u);
      await startSession(res, u.id);
      return { user: publicUser(u) };
    }

    fail(400, "bad_action");
  },
});
