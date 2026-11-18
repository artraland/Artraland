// /api/verify?no=ARX-2026-0001 — the public check of a Certificate of Expertise.
// Anyone may ask; the answer shows the piece, the service and the date only — never the owner or the value.
import { one } from "./_lib/db.js";
import { endpoint, query, str } from "./_lib/http.js";

export default endpoint({
  async GET(req) {
    const no = str(query(req).get("no"), 40).toUpperCase().replace(/\s+/g, "");
    if (!/^ARX-\d{4}-\d{4,}$/.test(no)) return { found: false };
    const a = await one(`SELECT certificate_no, service, piece, findings, issued_at FROM appraisals
                         WHERE certificate_no = $1 AND status IN ('issued', 'returned')`, [no]);
    if (!a) return { found: false };
    const p = a.piece || {}, f = a.findings || {};
    return { found: true, certificate: { no: a.certificate_no, service: a.service, title: p.title || "", craft: p.craft || "",
      city: f.origin || p.city || "", period: f.period || "", issued_at: a.issued_at } };
  },
});
