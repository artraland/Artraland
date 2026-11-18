// /api/upload — a product provider uploads a photo of a piece (JPEG, PNG or WebP, up to 4 MB).
// /api/upload?for=appraisal — anyone signed in uploads a photo (or a PDF document) for an appraisal request.
// The file is stored in Vercel Blob (BLOB_READ_WRITE_TOKEN) under a random name, and its address is returned.
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { endpoint, query, fail } from "./_lib/http.js";
import { requireUser } from "./_lib/auth.js";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const DOCS = { ...TYPES, "application/pdf": "pdf" };
const MAX = 4 * 1024 * 1024;

export default endpoint({
  async POST(req) {
    const forAppraisal = query(req).get("for") === "appraisal";
    await requireUser(req, forAppraisal ? null : ["provider", "admin"]);
    if (!process.env.BLOB_READ_WRITE_TOKEN) fail(503, "uploads_off");
    const type = String(req.headers["content-type"] || "").split(";")[0].trim();
    const ext = (forAppraisal ? DOCS : TYPES)[type];
    if (!ext) fail(415, "bad_type");
    const chunks = [];
    let size = 0;
    for await (const c of req) { size += c.length; if (size > MAX) fail(413, "too_large"); chunks.push(c); }
    if (!size) fail(400, "empty");
    const blob = await put(`${forAppraisal ? "appraisals" : "products"}/${randomUUID()}.${ext}`, Buffer.concat(chunks), { access: "public", contentType: type });
    return { url: blob.url };
  },
});
