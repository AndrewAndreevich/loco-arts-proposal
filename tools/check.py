"""Render pages in Chrome: compare text with the original, check overflow, take screenshots.

Usage: python tools/check.py <original.html> <out_dir>
"""
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
orig = Path(sys.argv[1]).resolve().as_uri()
OUT = Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
new = (ROOT / "index.html").as_uri()

TEXT_JS = """() => { document.querySelectorAll('details').forEach(d => d.open = true);
  document.querySelectorAll('#builder, .calc').forEach(e => e.remove());
  return [...document.querySelectorAll('main, footer')].map(e => e.innerText).join('\\n'); }"""


def norm(t: str) -> list[str]:
    return [w for w in re.split(r"\s+", t) if w]


with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    pg = b.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    pg.goto(orig); a = norm(pg.evaluate(TEXT_JS))
    pg.goto(new); pg.wait_for_load_state("networkidle"); c = norm(pg.evaluate(TEXT_JS))
    print("words original/new:", len(a), len(c), "IDENTICAL" if a == c else "DIFFERENT")
    if a != c:
        import difflib
        for line in list(difflib.unified_diff(a, c, lineterm="", n=2))[:40]:
            print(line)
    for name, w, h in [("desktop", 1440, 900), ("mobile", 390, 844), ("m360", 360, 740)]:
        ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
        pg = ctx.new_page(); pg.goto(new); pg.wait_for_load_state("networkidle")
        total = pg.evaluate("document.documentElement.scrollHeight")
        for y in range(0, total, h // 2):
            pg.evaluate(f"scrollTo(0,{y})"); pg.wait_for_timeout(60)
        pg.wait_for_timeout(900); pg.evaluate("scrollTo(0,0)"); pg.wait_for_timeout(1200)
        sw = pg.evaluate("[document.documentElement.scrollWidth, innerWidth]")
        wide = pg.evaluate("""() => [...document.querySelectorAll('body *')].filter(e => {
            if (e.closest('.marquee, .tw, .map, .track')) return false;
            const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; })
            .slice(0, 8).map(e => e.tagName + '.' + e.className)""")
        print(name, "scrollWidth/innerWidth", sw, "overflowing:", wide)
        pg.screenshot(path=str(OUT / f"new-{name}-top.png"))
        pg.screenshot(path=str(OUT / f"new-{name}-full.png"), full_page=True)
        for sec in ["builder", "g-studios", "g-exhibitions", "g-myloco", "g-membership", "g-design", "team"]:
            pg.evaluate(f"document.getElementById('{sec}').scrollIntoView()"); pg.wait_for_timeout(700)
            pg.screenshot(path=str(OUT / f"new-{name}-{sec}.png"))
        ctx.close()
    b.close()
