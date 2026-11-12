#!/usr/bin/env python3
"""Render the Origen Coco brochure templates from content.json into HTML.

    python3 brochures/build.py            # writes brochures/html/*.html and brochures/index.html
    node brochures/render-pdf.js          # turns them into brochures/pdf/*.pdf + thumbnails

Each design lives in templates/<design>/ (brochure.html.j2 + style.css) and
shares templates/_shared/ (macros, base print CSS, gallery page). All copy comes
from content.json, so a text or spec change is made once and appears in every design.
"""
import json
import pathlib
import sys

from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = pathlib.Path(__file__).resolve().parent

# Order here is the order in the gallery and the next/previous links.
DESIGNS = [
    {"id": "portfolio", "name": "Portfolio", "format": "A4 landscape",
     "desc": "Deep green and light stone pages, photo mosaic cover, spec sheets"},
    {"id": "substrate", "name": "Substrate", "format": "A4 portrait",
     "desc": "Coir-brown headers, product range at a glance, crop tags"},
    {"id": "showcase", "name": "Showcase", "format": "A4 portrait",
     "desc": "Bold condensed product names on dark olive bands"},
    {"id": "angle", "name": "Angle", "format": "A4 portrait",
     "desc": "Diagonal green panels with angled photo frames"},
    {"id": "folio", "name": "Folio", "format": "A5 landscape",
     "desc": "Light type, white space and large photographs"},
    {"id": "orbit", "name": "Orbit", "format": "A4 portrait",
     "desc": "Round photo frames, green arcs and a serif display face"},
]


def main(selected):
    content = json.loads((ROOT / "content.json").read_text(encoding="utf-8"))
    content["by_id"] = {p["id"]: p for p in content["products"]}

    env = Environment(
        loader=FileSystemLoader(str(ROOT / "templates")),
        undefined=StrictUndefined,
        autoescape=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )
    out_dir = ROOT / "html"
    out_dir.mkdir(exist_ok=True)

    for i, d in enumerate(DESIGNS):
        d["num"] = f"{i + 1:02d}"
        d["file"] = f"{d['num']}-{d['id']}"

    for i, d in enumerate(DESIGNS):
        if selected and d["id"] not in selected:
            continue
        nav = {
            "self": d,
            "prev": DESIGNS[i - 1] if i > 0 else None,
            "next": DESIGNS[i + 1] if i + 1 < len(DESIGNS) else None,
        }
        html = env.get_template(f"{d['id']}/brochure.html.j2").render(
            c=content,
            nav=nav,
            img="../../assets/img/",        # the website's photos
            logo="../../assets/logo/",      # the website's logos
            own="../assets/",               # brochure fonts
            tpl=f"../templates/{d['id']}/",  # this design's CSS
            shared="../templates/_shared/",
        )
        path = out_dir / f"{d['file']}.html"
        path.write_text(html, encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT.parent)}")

    gallery = env.get_template("_shared/gallery.html.j2").render(designs=DESIGNS, c=content)
    (ROOT / "index.html").write_text(gallery, encoding="utf-8")
    print("wrote brochures/index.html")


if __name__ == "__main__":
    main(set(sys.argv[1:]))
