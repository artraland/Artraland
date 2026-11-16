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
