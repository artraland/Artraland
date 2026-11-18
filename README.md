# artraland.com

ARTRA — royal handicrafts, made by hand. A static site (no build step) in Royal Ink colours: deep ink blue, ivory
and gold.

- `index.html` — the collection: hero, the pieces, a showcase that turns through them, the craft, and a commission form.
- `piece.html` — one piece's own page, at `artraland.com/piece?p=<slug>`: a full-screen hero, the description lit word
  by word as you scroll, the story (heritage, artist and origin, material) with the piece pinned beside it, a
  full-screen close-up, the specifications sheet, care and returns, other pieces, and an enquiry. A bar with the
  piece's name, its sections and "Enquire" follows the visitor down the page.
- `products.js` — the product details, one entry per piece. Its fields follow the "ARTRA Product Detail" Google Form
  question by question (name, category, ID, photo link, artist, origin, history, description, medium, dimensions,
  packaging dimensions, additional information, care, returns, last update); copy a form response into an entry.
  Empty fields and the sections that depend on them are not shown, and the form's internal fields (document provider,
  creation date) stay off the site. The sample wording there should be replaced with the real responses.
- `art.js` — the six animated drawings used for pieces without a photo (the enamel vase turns, the inlaid casket
  opens, the brass tray's engraving rotates, the filigree lantern swings, the mirror mosaic glints, the silk rug weaves
  itself), and `EMAIL`, the address enquiries and commission requests open in the visitor's email app.
- `royal.css`, `royal.js` — the collection page's styles and motion; `piece.css`, `piece.js` — the piece page's.
- `brand/` — the ARTRA logo as a gold outline on transparent (`logo.webp`, `logo.png`), the tab and home-screen icons (the mirrored ЯTR at its centre), and
  `og-artra.jpg`, the picture shown when artraland.com is shared.

**Languages.** The site is in English, French, Spanish, Arabic and Persian. A visitor's language comes from the
`?lang=` address (`en`, `fr`, `es`, `ar`, `fa`), then the choice they last made in the globe switch at the top of every page
(it opens a list of the languages by their own names; on phones the list is at the foot of the menu), then their browser's language, else English. Arabic and Persian read right to left and use
Noto Naskh Arabic for headings and Vazirmatn for text. All page wording is in `i18n.js`, keyed by name for every
language; elements carry `data-i18n` (text), `data-i18n-html` (text with markup) or `data-i18n-aria` (labels). In
`products.js` a text field can be one text for every language or `{ en, fr, es, ar, fa }`; a missing language shows
the English, so a form response can go in as English first and gain translations later.

**Accounts.** `account.html` (artraland.com/account) is where people sign up and sign in. Everyone signs up as a
**Client**; an **Admin** changes roles in the People tab. What each role sees:

- Client: profile (details, delivery address, language, password), saved pieces (♡ Save on any piece page), their
  orders with a progress bar and tracking history, and their enquiries and commission requests with status.
- Product provider: also *My pieces* — add a piece with the questions of the Product Detail form, a photo (upload or
  link) and a tab per language; send it for review. An approved piece appears on the site within a minute; editing it
  sends it back for review.
- Sales: also the *Enquiries desk* (every enquiry and commission request: status, assignee, internal notes, reply by
  email) and the *Orders desk* (record a sale against a client's account, then update its status, carrier and tracking).
- Expert: the *Expertise desk*, showing only the appraisals assigned to them, plus the client tabs.
- Admin: everything above, plus *Review pieces* and *People*.

Everyone also has *My appraisals* (below), and Sales and Admin have the *Expertise desk*.

**Appraisal and expertise.** `expertise.html` (/expertise) presents the three services: an *opinion* from
photographs (an opinion letter), a *full appraisal* (report and Certificate of Expertise with a value), and
*authentication* (certificate without a value). It also has the certificate check. `request-appraisal.html` is
the request form; it needs a signed-in account. `verify.html` (/verify?no=ARX-…) is the public check that a
certificate's QR or link opens; it shows the piece, the service and the date, never the owner or the value.
A request moves through these stages (`api/appraisals.js`):
submitted → (info_needed ↔ submitted) → quoted → accepted → received → examination → peer_review → ready → issued → returned.
- Screening (asking the client a question, or declining with a reason): Sales and Admin.
- The quote (expert, second expert, fee, basis of value): Admin.
- Accepting the quote: the client.
- Recording the piece's arrival and its return: Sales.
- The examination and findings: the assigned expert.
- Agreeing or sending back: the second expert, who can never be the examining expert.
- Signing: Admin, which issues the certificate number.

An opinion skips receiving and returning the piece. The client never sees internal notes or the second expert's
review, and sees the findings and value only once the certificate is issued. Pages and stages are in five
languages (`i18n-expertise.js`). Photos for requests use the same Blob store as provider uploads. Without
it, the form says that the team will ask for photographs. Payment and emails are not automated yet: after a
quote is accepted, Sales send the payment details.

The account server is in `api/` (Vercel Functions, Node): `auth` (sign up, sign in, sign out), `profile`, `favorites`,
`enquiries`, `orders`, `products`, `users`, `upload`, `appraisals`, `verify` and `catalog` (approved pieces, added to the pages after
`products.js`). Data lives in Neon Postgres (`DATABASE_URL`, connected in Vercel → Storage); the tables are created
on first use (`api/_lib/db.js`). Passwords are stored as scrypt hashes; sign-in sets an HttpOnly, Secure cookie whose
token is stored only as a hash; five wrong passwords lock an account for 15 minutes; every change needs the `X-Artra`
header (a guard against cross-site requests); every endpoint checks the role on the server.

Settings in Vercel (project → Settings → Environment Variables): `DATABASE_URL` (added by the Neon connection);
`ADMIN_EMAILS` — comma-separated addresses that become Admin when they sign up or sign in (the way to get the first
admin); `BLOB_READ_WRITE_TOKEN` — added by connecting a Blob store (Storage → Blob), needed for photo uploads (without
it, providers paste a photo link). The commission form and the enquiry form on piece pages now send straight to the
Enquiries desk; if that fails, they fall back to the visitor's email app.

**The Silk Road.** `silkroad.js` holds the caravan cities from Venice to Xi'an (names and regions in five languages,
the crafts each is known for, and their place on a simple chart, spread evenly west to east, not to scale). The home
page's *The Road* section draws the route with a travelling caravan over a faint antique-style chart (seas,
mountains, deserts, rivers and old Latin names, drawn to match the city layout); tapping a city (or its button below the map)
shows its crafts and how many pieces come from there, and can filter the collection to them. Each product names its
city with `city` in `products.js` (product providers choose it in their piece form). In a client's orders, each
order is drawn as a caravan journey (the atelier → the caravanserai → with the caravan → arrived), with the piece's
origin on a small map and its certificate of making as a *Caravan Pass*.

**Photos.** Photos of pieces live in `photos/` (strip location metadata before adding one). A piece with a `cutout`
(its photo with the background removed, as a transparent WebP or PNG) shows the cut-out everywhere and keeps the full
photo for the close-up. Otherwise a piece with a photo link shows its photo (Google Drive links work if the file is
shared with "Anyone with the link"); a new entry without a `key` uses its photo everywhere and gets its own card.
Animations stop off screen and are switched off for visitors who prefer reduced motion. After changing a CSS or JS
file, raise its `?v=` number where the pages load it.

**Hosting.** Pushing to `main` deploys to the Vercel project `artraland` in the artedelara account (`.github/workflows/deploy.yml`); it needs an
`ARTRALAND` repository secret holding a Vercel token for that account (account scope, not a single project).
`artraland.com` and `www.artraland.com` are attached to the project; `www` redirects to `artraland.com`.

**DNS** (at ParsPack, where the domain's nameservers are): an `A` record for `artraland.com` to `216.150.1.1` (and a
second to `216.150.16.1`), and a `CNAME` for `www` to `f3251a0e70c11f0d.vercel-dns-016.com`.
