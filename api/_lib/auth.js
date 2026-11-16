// Accounts: passwords (scrypt hashes), sessions (a random token in an HttpOnly cookie; only its hash is stored),
// and role checks. Roles: client (everyone on sign-up), provider, sales, admin. Only an admin changes roles.
// The addresses in the ADMIN_EMAILS setting (comma-separated) become admins when they sign up or sign in.
import { scrypt as scryptCb, randomBytes, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { q, one } from "./db.js";
import { fail } from "./http.js";

const scrypt = promisify(scryptCb);
const COOKIE = "artra_session";
const DAYS = 30;

export async function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}
export async function checkPassword(pw, stored) {
  const [alg, N, r, p, salt, hash] = String(stored).split("$");
  if (alg !== "scrypt") return false;
  const want = Buffer.from(hash, "base64");
  const got = await scrypt(pw, Buffer.from(salt, "base64"), want.length, { N: +N, r: +r, p: +p });
  return got.length === want.length && timingSafeEqual(got, want);
}
export function passwordOk(pw) { return typeof pw === "string" && pw.length >= 8 && pw.length <= 200; }

const sha = (s) => createHash("sha256").update(s).digest("hex");

function cookie(value, maxAge) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
function readToken(req) {
  const m = String(req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]{20,100})`));
  return m ? m[1] : null;
}

export async function startSession(res, userId) {
  const token = randomBytes(32).toString("base64url");
  await q("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '30 days')", [sha(token), userId]);
  // Tidy up expired sessions now and then.
  if (Math.random() < 0.05) await q("DELETE FROM sessions WHERE expires_at < now()");
  res.setHeader("Set-Cookie", cookie(token, DAYS * 86400));
}
export async function endSession(req, res) {
  const t = readToken(req);
  if (t) await q("DELETE FROM sessions WHERE token_hash = $1", [sha(t)]);
  res.setHeader("Set-Cookie", cookie("", 0));
}

const USER_COLS = "u.id, u.email, u.name, u.phone, u.country, u.address, u.lang, u.role, u.created_at";
export async function currentUser(req) {
  const t = readToken(req);
  if (!t) return null;
  return one(`SELECT ${USER_COLS} FROM sessions s JOIN users u ON u.id = s.user_id
              WHERE s.token_hash = $1 AND s.expires_at > now()`, [sha(t)]);
}
export async function requireUser(req, roles) {
  const u = await currentUser(req);
  if (!u) fail(401, "signin");
  if (roles && !roles.includes(u.role)) fail(403, "forbidden");
  return u;
}

export function adminEmails() {
  return String(process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}
export async function promoteIfListed(user) {
  if (user.role !== "admin" && adminEmails().includes(user.email)) {
    await q("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
    user.role = "admin";
  }
  return user;
}
export function publicUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name, phone: u.phone, country: u.country, address: u.address, lang: u.lang, role: u.role, created_at: u.created_at };
}
