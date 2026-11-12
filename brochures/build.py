#!/usr/bin/env python3
"""Render the Origen Coco brochures from content.json into HTML.

    python3 brochures/build.py            # writes brochures/html/*.html
    node brochures/render-pdf.js          # turns them into brochures/pdf/*.pdf

Each design lives in templates/<design>/ (brochure.html.j2 + style.css) and
shares templates/_shared/ (macros, base print CSS). All copy comes from
content.json, so a text or spec change is made once and appears in every design.
"""
import json
import pathlib
import sys

from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = pathlib.Path(__file__).resolve().parent
DESIGNS = {
    "corporate": "01-corporate-professional",
    "catalogue": "02-modern-product-catalogue",
    "premium": "03-premium-company-brochure",
}


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

    for design, out_name in DESIGNS.items():
        if selected and design not in selected:
            continue
        html = env.get_template(f"{design}/brochure.html.j2").render(
            c=content,
            design=design,
            img="../../assets/img/",       # the website's photos
            logo="../../assets/logo/",     # the website's logos
            own="../assets/",              # brochure fonts
            tpl=f"../templates/{design}/",  # this design's CSS
            shared="../templates/_shared/",
        )
        path = out_dir / f"{out_name}.html"
        path.write_text(html, encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main(set(sys.argv[1:]))
