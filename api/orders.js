// /api/orders — purchases and their tracking.
// GET: a client sees their own; sales and admin see all. ?id= gives one order with its tracking history.
// POST { client_email, title, product_slug, amount, currency, note }: sales or admin record a sale.
// PATCH { id, status, carrier, tracking_number, tracking_url, note }: sales or admin update it; each status
// change or note becomes a step in the client's tracking history.
import { q, one } from "./_lib/db.js";
import { endpoint, body, query, str, email, oneOf, url, fail } from "./_lib/http.js";
import { requireUser } from "./_lib/auth.js";

const STATUSES = ["confirmed", "in_production", "shipped", "delivered", "cancelled"];
const STAFF = ["sales", "admin"];
const number = (id) => "ART-" + (1000 + Number(id));
const withNumber = (o) => o && { ...o, number: number(o.id) };

export default endpoint({
  async GET(req) {
    const u = await requireUser(req);
    const staff = STAFF.includes(u.role);
    const id = query(req).get("id");
    if (id) {
      const o = await one(`SELECT o.*, c.name AS client_name, c.email AS client_email FROM orders o JOIN users c ON c.id = o.client_id
                           WHERE o.id = $1 AND ($2 OR o.client_id = $3)`, [Number(id) || 0, staff, u.id]);
      if (!o) fail(404, "not_found");
      const events = await q("SELECT status, note, created_at FROM order_events WHERE order_id = $1 ORDER BY created_at, id", [o.id]);
      return { order: withNumber(o), events };
    }
    const rows = await q(`SELECT o.*, c.name AS client_name, c.email AS client_email FROM orders o JOIN users c ON c.id = o.client_id
                          WHERE $1 OR o.client_id = $2 ORDER BY o.created_at DESC LIMIT 500`, [staff, u.id]);
    // Each order's tracking history, in one go.
    const ids = rows.map((r) => r.id);
    const events = ids.length ? await q("SELECT order_id, status, note, created_at FROM order_events WHERE order_id = ANY($1::bigint[]) ORDER BY created_at, id", [ids]) : [];
    return { orders: rows.map((o) => ({ ...withNumber(o), events: events.filter((e) => String(e.order_id) === String(o.id)) })) };
  },

  async POST(req) {
    const u = await requireUser(req, STAFF);
    const b = await body(req);
    const client = await one("SELECT id FROM users WHERE email = $1", [email(b.client_email)]);
    if (!client) fail(404, "client_not_found");
    const title = str(b.title, 200);
    if (!title) fail(400, "title_required");
    const amount = b.amount === "" || b.amount == null ? null : Number(b.amount);
    if (amount !== null && !(amount >= 0 && amount < 1e10)) fail(400, "bad_amount");
    const currency = (str(b.currency, 3) || "EUR").toUpperCase();
    const o = await one(`INSERT INTO orders (client_id, product_slug, title, amount, currency, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [client.id, str(b.product_slug, 120), title, amount, currency, u.id]);
    await q("INSERT INTO order_events (order_id, status, note, created_by) VALUES ($1, 'confirmed', $2, $3)", [o.id, str(b.note, 1000), u.id]);
    return { order: withNumber(o) };
  },

  async PATCH(req) {
    const u = await requireUser(req, STAFF);
    const b = await body(req);
    const id = Number(b.id);
    const cur = Number.isInteger(id) ? await one("SELECT * FROM orders WHERE id = $1", [id]) : null;
    if (!cur) fail(404, "not_found");
    const status = b.status === undefined ? cur.status : oneOf(b.status, STATUSES);
    const carrier = b.carrier === undefined ? cur.carrier : str(b.carrier, 80);
    const trackingNumber = b.tracking_number === undefined ? cur.tracking_number : str(b.tracking_number, 120);
    const trackingUrl = b.tracking_url === undefined ? cur.tracking_url : url(b.tracking_url);
    const note = str(b.note, 1000);
    const o = await one(`UPDATE orders SET status = $2, carrier = $3, tracking_number = $4, tracking_url = $5, updated_at = now()
                         WHERE id = $1 RETURNING *`, [id, status, carrier, trackingNumber, trackingUrl]);
    if (status !== cur.status || note) {
      await q("INSERT INTO order_events (order_id, status, note, created_by) VALUES ($1, $2, $3, $4)", [id, status, note, u.id]);
    }
    return { order: withNumber(o) };
  },
});
