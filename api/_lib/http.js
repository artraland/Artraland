// Small helpers shared by every endpoint: JSON in and out, errors, input checks.

export class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
export const fail = (status, code) => { throw new HttpError(status, code); };

export function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

export function query(req) { return new URL(req.url, "http://local").searchParams; }

// The JSON body (Vercel parses it into req.body; elsewhere it is read from the stream).
export async function body(req) {
  if (req.body !== undefined && req.body !== null && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body || "{}"); } catch { fail(400, "bad_json"); } }
  const chunks = [];
  let size = 0;
  for await (const c of req) { size += c.length; if (size > 1e6) fail(413, "too_large"); chunks.push(c); }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { fail(400, "bad_json"); }
}

// One endpoint: { GET, POST, PATCH, DELETE } → handler. Anything that changes data must carry the
// X-Artra header, which another site's form or link cannot add (a simple guard against cross-site requests).
export function endpoint(methods) {
  return async function handler(req, res) {
    try {
      const fn = methods[req.method];
      if (!fn) fail(405, "method");
      if (req.method !== "GET" && req.headers["x-artra"] !== "1") fail(403, "csrf");
      const out = await fn(req, res);
      if (!res.writableEnded) send(res, 200, out === undefined ? { ok: true } : out);
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.code });
      console.error(e);
      send(res, 500, { error: "server" });
    }
  };
}

// ---- Input checks ----
export function str(v, max = 200) {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string" && typeof v !== "number") fail(400, "bad_input");
  return String(v).trim().slice(0, max);
}
export function email(v) {
  const e = str(v, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail(400, "bad_email");
  return e;
}
export function oneOf(v, list, code = "bad_input") {
  if (!list.includes(v)) fail(400, code);
  return v;
}
export const LANGS = ["en", "fr", "es", "ar", "fa"];
// Text that may be one string or { en, fr, es, ar, fa }.
export function ml(v, max = 4000) {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const out = {};
    for (const l of LANGS) { const s = str(v[l], max); if (s) out[l] = s; }
    return out;
  }
  return str(v, max);
}
export function uuid(v, code = "bad_id") {
  const s = String(v || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) fail(400, code);
  return s;
}
export function url(v) {
  const s = str(v, 1000);
  if (!s) return "";
  if (s.startsWith("/photos/") || /^https:\/\/[^\s"'<>]+$/.test(s)) return s;
  fail(400, "bad_url");
}
