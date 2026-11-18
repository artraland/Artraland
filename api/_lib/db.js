// The database (Neon Postgres, connected to the Vercel project as DATABASE_URL).
// Tables are created on first use, so a fresh database needs no manual setup.
import { neon } from "@neondatabase/serverless";

let adapter = null;

// Tests can swap in another Postgres client with the same two methods.
export function setAdapter(a) { adapter = a; ready = null; }

function db() {
  if (!adapter) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    const sql = neon(process.env.DATABASE_URL);
    adapter = {
      query: (text, params) => sql.query(text, params || []),
      // Several statements in one transaction.
      tx: (list) => sql.transaction(list.map(([text, params]) => sql.query(text, params || []))),
    };
  }
  return adapter;
}

const SCHEMA = [
  // One lock so two cold starts never build the tables at the same moment.
  ["SELECT pg_advisory_xact_lock(424242)"],
  [`CREATE TABLE IF NOT EXISTS users (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     email text NOT NULL UNIQUE,
     name text NOT NULL DEFAULT '',
     phone text NOT NULL DEFAULT '',
     country text NOT NULL DEFAULT '',
     address text NOT NULL DEFAULT '',
     lang text NOT NULL DEFAULT 'en',
     role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'provider', 'sales', 'admin')),
     password_hash text NOT NULL,
     failed_logins int NOT NULL DEFAULT 0,
     locked_until timestamptz,
     created_at timestamptz NOT NULL DEFAULT now())`],
  [`CREATE TABLE IF NOT EXISTS sessions (
     token_hash text PRIMARY KEY,
     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at timestamptz NOT NULL DEFAULT now(),
     expires_at timestamptz NOT NULL)`],
  ["CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id)"],
  [`CREATE TABLE IF NOT EXISTS favorites (
     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     product_slug text NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (user_id, product_slug))`],
  [`CREATE TABLE IF NOT EXISTS enquiries (
     id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     user_id uuid REFERENCES users(id) ON DELETE SET NULL,
     kind text NOT NULL CHECK (kind IN ('enquiry', 'commission')),
     name text NOT NULL,
     email text NOT NULL,
     product_slug text NOT NULL DEFAULT '',
     craft text NOT NULL DEFAULT '',
     message text NOT NULL DEFAULT '',
     lang text NOT NULL DEFAULT 'en',
     status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'answered', 'closed')),
     assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
     notes text NOT NULL DEFAULT '',
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now())`],
  ["CREATE INDEX IF NOT EXISTS enquiries_user ON enquiries(user_id)"],
  [`CREATE TABLE IF NOT EXISTS orders (
     id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     client_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
     product_slug text NOT NULL DEFAULT '',
     title text NOT NULL,
     amount numeric(12, 2),
     currency text NOT NULL DEFAULT 'EUR',
     status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')),
     carrier text NOT NULL DEFAULT '',
     tracking_number text NOT NULL DEFAULT '',
     tracking_url text NOT NULL DEFAULT '',
     created_by uuid REFERENCES users(id) ON DELETE SET NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now())`],
  ["CREATE INDEX IF NOT EXISTS orders_client ON orders(client_id)"],
  [`CREATE TABLE IF NOT EXISTS order_events (
     id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     status text NOT NULL,
     note text NOT NULL DEFAULT '',
     created_by uuid REFERENCES users(id) ON DELETE SET NULL,
     created_at timestamptz NOT NULL DEFAULT now())`],
  ["CREATE INDEX IF NOT EXISTS order_events_order ON order_events(order_id)"],
  [`CREATE TABLE IF NOT EXISTS products (
     id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     slug text NOT NULL UNIQUE,
     provider_id uuid REFERENCES users(id) ON DELETE SET NULL,
     status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
     data jsonb NOT NULL DEFAULT '{}'::jsonb,
     review_note text NOT NULL DEFAULT '',
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now())`],
  ["CREATE INDEX IF NOT EXISTS products_provider ON products(provider_id)"],
  ["CREATE INDEX IF NOT EXISTS products_status ON products(status)"],
  // The Expert role (appraisals) joined later: widen the list of roles on databases made before it.
  ["ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check"],
  ["ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'provider', 'sales', 'expert', 'admin'))"],
  // Appraisal requests. The piece's details and the expert's findings are kept as JSON (their fields are checked
  // in api/appraisals.js); the stage, the people and the certificate number are columns, for the desk's lists.
  [`CREATE TABLE IF NOT EXISTS appraisals (
     id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     client_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
     service text NOT NULL CHECK (service IN ('opinion', 'appraisal', 'authentication')),
     purpose text NOT NULL DEFAULT '',
     viewing text NOT NULL DEFAULT 'ship' CHECK (viewing IN ('ship', 'visit')),
     piece jsonb NOT NULL DEFAULT '{}'::jsonb,
     photos jsonb NOT NULL DEFAULT '[]'::jsonb,
     status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'info_needed', 'quoted', 'accepted', 'received',
       'examination', 'peer_review', 'ready', 'issued', 'returned', 'declined', 'withdrawn', 'closed')),
     expert_id uuid REFERENCES users(id) ON DELETE SET NULL,
     reviewer_id uuid REFERENCES users(id) ON DELETE SET NULL,
     fee numeric(12, 2),
     currency text NOT NULL DEFAULT 'EUR',
     basis text NOT NULL DEFAULT '',
     findings jsonb NOT NULL DEFAULT '{}'::jsonb,
     certificate_no text UNIQUE,
     issued_at timestamptz,
     carrier text NOT NULL DEFAULT '',
     tracking_number text NOT NULL DEFAULT '',
     tracking_url text NOT NULL DEFAULT '',
     lang text NOT NULL DEFAULT 'en',
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now())`],
  ["CREATE INDEX IF NOT EXISTS appraisals_client ON appraisals(client_id)"],
  ["CREATE INDEX IF NOT EXISTS appraisals_status ON appraisals(status)"],
  // Every step, message and internal note on an appraisal. Internal notes are never shown to the client.
  [`CREATE TABLE IF NOT EXISTS appraisal_events (
     id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     appraisal_id bigint NOT NULL REFERENCES appraisals(id) ON DELETE CASCADE,
     kind text NOT NULL CHECK (kind IN ('status', 'message', 'note')),
     status text NOT NULL DEFAULT '',
     body text NOT NULL DEFAULT '',
     created_by uuid REFERENCES users(id) ON DELETE SET NULL,
     created_at timestamptz NOT NULL DEFAULT now())`],
  ["CREATE INDEX IF NOT EXISTS appraisal_events_a ON appraisal_events(appraisal_id)"],
];

let ready = null;
function migrate() { return db().tx(SCHEMA); }

// Run one query; returns the rows.
export async function q(text, params) {
  if (!ready) ready = migrate().catch((e) => { ready = null; throw e; });
  await ready;
  return db().query(text, params);
}
export async function one(text, params) { return (await q(text, params))[0] || null; }

// Several statements in one transaction; returns each statement's rows.
export async function tx(list) {
  if (!ready) ready = migrate().catch((e) => { ready = null; throw e; });
  await ready;
  return db().tx(list);
}
