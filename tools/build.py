"""Build index.html from the original proposal HTML: new head/header/hero, external CSS/JS,
photos as files in assets/. Content (text) is kept as is; check with tools/check_text.py.

Usage: python tools/build.py <original.html>
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = Path(sys.argv[1]).read_text(encoding="utf-8")
# the paste may carry chat text around the document
src = src[src.lower().index("<!doctype"):src.lower().rindex("</html>") + len("</html>")]

# --- head: fonts + stylesheet instead of the inline <style>
src = re.sub(
    r'<link href="https://fonts.googleapis.com/css2[^"]+" rel="stylesheet">',
    '<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500&display=swap" rel="stylesheet">',
    src,
)
src = re.sub(r"<style>.*?</style>", '<link rel="stylesheet" href="styles.css">\n<meta name="theme-color" content="#000000">', src, flags=re.S)
src = src.replace(
    '<link rel="icon" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>🎨</text></svg>">',
    '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%2756%27 y=%2722%27 rx=%2728%27 fill=%27%23FF54A6%27/%3E%3C/svg%3E">',
)

# --- header: centred text wordmark + floating pill nav
header_old = re.search(r"<header class=bar>.*?</header>", src, flags=re.S).group(0)
nav_links = re.search(r'<nav class=nav aria-label="Sections">(.*?)</nav>', header_old, flags=re.S).group(1)
items = "".join(f"<li>{a}</li>" for a in re.findall(r"<a [^>]+>[^<]+</a>", nav_links))
header_new = (
    '<a class=skip href="#main">Skip to content</a>\n'
    '<header class=site-head><a class=logo href="#top">LOCO <span>ARTS</span></a></header>\n'
    f'<nav class=pillnav aria-label="Sections"><ul>{items}</ul></nav>'
)
src = src.replace(header_old, header_new)

# --- hero: drop the colour strip, add capsule marquee, meta as colour columns
src = src.replace("<main id=top>\n<div class=wrap>\n<div class=hero>", "<main id=main>\n<div class=wrap id=top>\n<div class=hero>")
src = src.replace("<p class=lede>", "<p class=lede data-split>")
# one-line wordmark on desktop hides the <br>; keep a real space so it still reads "LOCO ARTS"
src = src.replace("<h1>LOCO<br><span class=arts>", "<h1>LOCO<br> <span class=arts>")
strip = re.search(r"<div class=strip aria-hidden=true>.*?</div>", src, flags=re.S).group(0)
palette = ["var(--orange)", "var(--green)", "var(--pink)", "var(--lime)", "var(--blue)", "var(--yellow)", "var(--brown)", "var(--sky)", "var(--olive)"]
widths = [3.0, 2.0, 2.0, 3.6, 2.0, 2.0, 3.0, 2.0, 2.6]


def row(offset: int) -> str:
    pills = []
    for k in range(9):
        c = palette[(k + offset * 3) % len(palette)]
        w = widths[(k + offset * 2) % len(widths)]
        pills.append(f'<i style="background:{c};width:calc({w} * clamp(56px,7.4vw,106px))"></i>')
    once = "".join(pills)
    return f'<div class=row>{once}{once}</div>'


marquee = '<div class=marquee aria-hidden=true>' + "".join(row(r) for r in range(3)) + "</div>"
src = src.replace(strip, "")
# put the marquee after the hero's first block (title + lede)
src = src.replace("</p>\n</div>\n<div>\n\n<div class=meta>", "</p>\n</div>\n<div>\n<div class=meta>", 1)
src = re.sub(r"(<p class=lede data-split>.*?</p>\n</div>)", r"\1\n" + marquee.replace("\\", "\\\\"), src, count=1, flags=re.S)

# --- section headings: word reveal; blocks: fade-up
src = re.sub(r"<h2>([^<]+)</h2>", r"<h2 data-split>\1</h2>", src)
for cls in ["grid3", "accs", "tw", "weeks", "timeline", "prices", "team", "note", "opener"]:
    src = re.sub(rf'class={cls}(?=[ >])', f'class="{cls} reveal"', src)
    src = src.replace(f'class="{cls}"', f'class="{cls} reveal"')

# --- inline layout styles -> classes (inline styles beat media queries on mobile)
src = src.replace('<div class="grid3 reveal" style="margin-top:0;grid-template-columns:2fr 1fr">', '<div class="grid3 reveal mt0 wide-first">')
src = src.replace('<div class="grid3 reveal" style="margin-top:0">', '<div class="grid3 reveal mt0">')
src = src.replace('<h3 style="margin-top:0">', '<h3 class=mt0>')
src = src.replace('<p class=big style="margin:0">', '<p class=big>')

# --- photos: base64 -> files
names = {"Lena Shkolnaya": "lena-shkolnaya", "Andrei Aranovich": "andrei-aranovich", "Kirill Pavliashik": "kirill-pavliashik"}
for alt, slug in names.items():
    src = re.sub(
        rf'<img src="(data:image/jpeg;base64,[^"]+|assets/{slug}\.jpg)" alt="{alt}" loading=lazy>',
        f'<img src="assets/{slug}.jpg" alt="{alt}" width=700 height=700 loading=lazy decoding=async>',
        src,
    )
assert "base64" not in src, "a photo was not replaced"

# --- footer outside main with grid; script
src = src.replace("<footer><div class=wrap>", "<footer>").replace("</span></div></footer>", "</span></footer>")
src = src.replace("</body></html>", '<script src="main.js" defer></script>\n</body>\n</html>\n')

(ROOT / "index.html").write_text(src, encoding="utf-8")
print("index.html", len(src))
