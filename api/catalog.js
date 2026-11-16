// /api/catalog — the approved pieces from product providers, as a script the pages load after products.js.
// It adds them to window.ARTRA_PRODUCTS, so the collection, showcase and piece pages show them like the others.
import { q } from "./_lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/javascript; charset=utf-8");
  try {
    const rows = await q("SELECT slug, data FROM products WHERE status = 'approved' ORDER BY created_at");
    const list = rows.map((r) => ({ ...r.data, key: "", slug: r.slug }));
    // Kept at the edge for a minute, so pages stay quick; a newly approved piece shows within a minute.
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=600");
    res.end("window.ARTRA_PRODUCTS = (window.ARTRA_PRODUCTS || []).concat(" + JSON.stringify(list).replace(/</g, "\\u003c") + ");\n");
  } catch (e) {
    console.error(e);
    res.setHeader("Cache-Control", "no-store");
    res.end("/* catalog unavailable */\n");
  }
}
