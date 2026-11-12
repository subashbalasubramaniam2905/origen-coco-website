# Origen Coco brochures

Three A4 company profile and product brochure designs, built from the same content.

| Design | PDF | HTML |
| --- | --- | --- |
| 1. Corporate Professional (15 pages) | `pdf/01-corporate-professional.pdf` | `html/01-corporate-professional.html` |
| 2. Modern Product Catalogue (16 pages) | `pdf/02-modern-product-catalogue.pdf` | `html/02-modern-product-catalogue.html` |
| 3. Premium Company Brochure (16 pages) | `pdf/03-premium-company-brochure.pdf` | `html/03-premium-company-brochure.html` |

## How it fits together

```
brochures/
  content.json                 all copy, product data and spec tables (single source)
  build.py                     content.json + templates  ->  html/*.html   (Python 3, Jinja2)
  render-pdf.js                html/*.html  ->  pdf/*.pdf + page checks     (Node, Playwright)
  templates/_shared/           macros (icons, spec tables, contact block) and base print CSS
  templates/<design>/          brochure.html.j2 + style.css for each design
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
   python3 brochures/build.py
   node brochures/render-pdf.js
   ```

`render-pdf.js` checks every page before printing and fails if text runs outside the safe
margin, text overlaps, content is taller than its page area, an image fails to load, or the
page count is off. Add `--previews <folder>` to also save a PNG of each page.

Each page is a fixed A4 sheet (`<section class="page">`), so nothing flows from one page to
the next. If new content makes a page too full, the check will say which page and by how
many millimetres.

## Content rules

All copy comes from "Origen Coco – Website Content BR.docx" (including its client comments
and the suggested wording changes), as used on the website templates. Do not add copy that
is not in that document.
