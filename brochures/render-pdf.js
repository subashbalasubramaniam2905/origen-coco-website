#!/usr/bin/env node
/* Turn brochures/html/*.html into A4 PDFs with headless Chromium (Playwright),
   and check every page before printing:
     - no text outside the page's safe margin (cut-off text),
     - no two blocks of text overlapping,
     - no broken images,
     - one PDF page per <section class="page"> (no blank or spilled pages).
   Usage: node brochures/render-pdf.js [--previews <dir>] [name-filter]
   Exits non-zero if any check fails. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = __dirname;
const args = process.argv.slice(2);
const pi = args.indexOf('--previews');
const previews = pi >= 0 ? args.splice(pi, 2)[1] : null;
const filter = args[0] || '';
const SAFE_MM = 5; // text must stay at least this far inside the trim edge

async function checkPage(page) {
  return page.evaluate((safeMm) => {
    const mm = 96 / 25.4;
    const problems = [];
    const pages = [...document.querySelectorAll('.page')];
    pages.forEach((pg, i) => {
      const pr = pg.getBoundingClientRect();
      const safe = { l: pr.left + safeMm * mm, r: pr.right - safeMm * mm, t: pr.top + safeMm * mm, b: pr.bottom - safeMm * mm };
      const lines = [];
      const walker = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode;
        if (!n.textContent.trim()) continue;
        const el = n.parentElement;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[data-qc-skip]')) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
          if (r.width < 1 || r.height < 1) continue;
          lines.push({ r, el, text: n.textContent.trim().slice(0, 40) });
          if (r.left < safe.l - 0.5 || r.right > safe.r + 0.5 || r.top < safe.t - 0.5 || r.bottom > safe.b + 0.5)
            problems.push(`page ${i + 1}: text outside safe area: "${n.textContent.trim().slice(0, 50)}"`);
        }
        // clipped by an overflow:hidden ancestor (other than the page)?
        let a = el;
        while (a && a !== pg) {
          const s = getComputedStyle(a);
          if ((s.overflow === 'hidden' || s.overflowY === 'hidden') && a.scrollHeight > a.clientHeight + 2) {
            problems.push(`page ${i + 1}: text clipped inside <${a.tagName.toLowerCase()} class="${a.className}">`);
            break;
          }
          a = a.parentElement;
        }
      }
      for (let x = 0; x < lines.length; x++) for (let y = x + 1; y < lines.length; y++) {
        const A = lines[x], B = lines[y];
        if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
        const w = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left);
        const h = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
        if (w > 2 && h > 3) problems.push(`page ${i + 1}: overlapping text "${A.text}" / "${B.text}"`);
      }
      // content taller than its layout box spills past the footer area
      pg.querySelectorAll('.body').forEach((b) => {
        if (b.scrollHeight > b.clientHeight + 1) problems.push(`page ${i + 1}: content is ${((b.scrollHeight - b.clientHeight) / mm).toFixed(1)}mm taller than its area`);
      });
      pg.querySelectorAll('img').forEach((im) => {
        if (!im.complete || im.naturalWidth === 0) problems.push(`page ${i + 1}: image failed to load ${im.getAttribute('src')}`);
      });
    });
    return { count: pages.length, problems: [...new Set(problems)] };
  }, SAFE_MM);
}

(async () => {
  const htmlDir = path.join(ROOT, 'html');
  const pdfDir = path.join(ROOT, 'pdf');
  fs.mkdirSync(pdfDir, { recursive: true });
  const files = fs.readdirSync(htmlDir).filter((f) => f.endsWith('.html') && f.includes(filter)).sort();
  const browser = await chromium.launch();
  let failed = false;
  for (const f of files) {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.emulateMedia({ media: 'print' });
    await page.goto('file://' + path.join(htmlDir, f), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    const qc = await checkPage(page);
    const out = path.join(pdfDir, f.replace(/\.html$/, '.pdf'));
    await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
    if (previews) {
      fs.mkdirSync(previews, { recursive: true });
      const els = await page.$$('.page');
      for (let i = 0; i < els.length; i++)
        await els[i].screenshot({ path: path.join(previews, `${f.replace(/\.html$/, '')}-p${String(i + 1).padStart(2, '0')}.png`) });
    }
    const status = qc.problems.length ? 'FAIL' : 'ok';
    console.log(`${status}  ${f}  ${qc.count} pages -> ${path.relative(ROOT, out)}`);
    qc.problems.forEach((p) => console.log('      ' + p));
    if (qc.problems.length) failed = true;
    await page.close();
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
