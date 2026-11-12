# Origen Coco brochures

Eight company profile and product brochure designs, built from the same content. Open
`brochures/index.html` to browse them like the homepage templates: each card opens the
brochure in the browser (with previous/next and a PDF download link at the bottom) or
downloads the print-ready PDF. Products on every cover, and in the range pages, link to
their product pages, in the browser and in the PDF.

| # | Design | Format | Fonts | Style |
| --- | --- | --- | --- | --- |
| 01 | Portfolio | A4 landscape, 15 pages | Schibsted Grotesk | Deep green and stone pages, photo mosaic cover |
| 02 | Substrate | A4 portrait, 14 pages | Poppins | Coir-brown header bands, range at a glance |
| 03 | Showcase | A4 portrait, 15 pages | Big Shoulders Display, Public Sans | Bold condensed names on dark olive bands |
| 04 | Angle | A4 portrait, 14 pages | Funnel Display, Funnel Sans | Diagonal green panels, angled photo frames |
| 05 | Folio | A5 landscape, 24 pages | Onest | Light type, white space, large photographs |
| 06 | Orbit | A4 portrait, 14 pages | DM Serif Display, DM Sans | Round photo frames, green arcs and bars |
| 07 | Harvest | A4 portrait, 16 pages | Young Serif, Manrope | Earlier design on the Harvest website template |
| 08 | Flagship | A4 portrait, 15 pages | Archivo | Earlier design on the Flagship website template |

Files are `html/<nn>-<design>.html` and `pdf/<nn>-<design>.pdf`; `thumbs/` holds the cover
images used by the gallery.

## How it fits together

```
brochures/
  content.json                 all copy, product data and spec tables (single source)
  build.py                     content.json + templates  ->  html/*.html   (Python 3, Jinja2)
  render-pdf.js                html/*.html  ->  pdf/*.pdf + page checks     (Node, Playwright)
  templates/_shared/           macros (icons, spec tables, contact block) and base print CSS
  templates/<design>/          brochure.html.j2 + style.css for each design
  templates/_shared/gallery.html.j2   the browser gallery (index.html)
  assets/fonts/                the fonts, stored locally so PDFs render the same everywhere
```

Photos and logos come straight from the website's `assets/` folder, so a new photo there
can be used by the brochures too.

## Updating

1. Edit `content.json`. To fill in a specification, replace `null` with the value exactly as
   it should print, for example `"value": "< 1.0 mS/cm"`. Empty values print as
   "To be confirmed".
2. Rebuild:

   ```
   pip install jinja2          # once
   npm install playwright      # once, if Playwright is not already installed
   python3 brochures/build.py            # all designs + gallery (or name designs: build.py angle orbit)
   node brochures/render-pdf.js          # PDFs + cover thumbnails
   ```

To add a design, create `templates/<id>/` with `brochure.html.j2` and `style.css`, add it to
`DESIGNS` in `build.py`, and rebuild. Landscape or A5 designs set `@page` and
`--page-w`/`--page-h` at the top of their `style.css`.

`render-pdf.js` checks every page before printing and fails if text runs outside the safe
margin, text overlaps, content is taller than its page area, an image fails to load, or the
page count is off. Add `--previews <folder>` to also save a PNG of each page.

Each page is a fixed sheet (`<section class="page">`), so nothing flows from one page to
the next. If new content makes a page too full, the check will say which page and by how
many millimetres.

## Content rules

All copy comes from "Origen Coco – Website Content BR.docx" (including its client comments
and the suggested wording changes), as used on the website templates. Do not add copy that
is not in that document.
