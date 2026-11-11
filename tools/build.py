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
    '<link rel="preload" href="https://framerusercontent.com/assets/5uijHrcLgMOtvBU399PIdv0X2Yo.woff2" as="font" type="font/woff2" crossorigin>',
    src,
)
src = src.replace(
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="preconnect" href="https://framerusercontent.com" crossorigin>',
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
LOGO = (ROOT / "assets" / "loco-park-logo.svg").read_text(encoding="utf-8").strip()
LOGO = LOGO.replace("<svg ", '<svg role="img" aria-label="LOCO Park" ', 1)
header_new = (
    '<a class=skip href="#groups">Skip to the tier builder</a>\n'
    f'<header class=top><a class=logo href="#top" aria-label="LOCO Park — top">{LOGO}</a></header>\n'
    '<div class=tswitch role=group aria-label="Jump through the page">'
    '<button type=button data-jump=top aria-label="To the top"><svg viewBox="0 0 12 12" width=12 height=12 aria-hidden=true><path d="M6 1 L11 5.5 H1 Z M6 6 L11 10.5 H1 Z"/></svg></button>'
    '<button type=button data-jump=prev aria-label="Previous section"><svg viewBox="0 0 12 12" width=12 height=12 aria-hidden=true><path d="M6 3 L11 8.5 H1 Z"/></svg></button>'
    '<button type=button data-jump=next aria-label="Next section"><svg viewBox="0 0 12 12" width=12 height=12 aria-hidden=true><path d="M6 9 L11 3.5 H1 Z"/></svg></button>'
    '<button type=button data-jump=bottom aria-label="To the bottom"><svg viewBox="0 0 12 12" width=12 height=12 aria-hidden=true><path d="M6 6 L11 1.5 H1 Z M6 11 L11 6.5 H1 Z"/></svg></button></div>'
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


marquee = '<div class=marquee aria-hidden=true>' + "".join(
    f'<div class=row><img src="assets/loco-row-{r}.png" alt="" width=5862 height=205>'
    f'<img src="assets/loco-row-{r}.png" alt="" width=5862 height=205></div>' for r in (1, 2, 3)
) + "</div>"

BUILDER = """
<section id=builder class=builder aria-labelledby=builder-h><div class=wrap>
<p class=kicker>Tier builder</p>
<h2 id=builder-h data-split>Every group of screens, and how each tier changes it</h2>
<p class=big>Each group is a set of screens with their transitions, and options showing which tier uses which solution. Each group ends with a line showing what it adds; when the bar at the bottom of the screen reaches that line, the group's hours and monthly services are added, and the options you pick change them. Arrows top-right jump section to section.</p>
<div class=legend aria-hidden=true><span class="td td-E">Essential</span><span class="td td-S">Signature</span><span class="td td-F">Flagship</span><span class="td td-alt">Alternative</span><span class=legend-dash>dashed screen = optional: its hours count only when the option that brings it is chosen</span></div>
<div id=groups></div>
</div></section>
<section id=report class=report aria-label="Cost summary"></section>
<section class=builder-2><div class=wrap>
<div id=plan></div>
<div class=export id=export><p class=kicker>Export</p><p class=big>Your selection first, then the three tiers side by side and a sheet for each: prices, hours, screens, options, services and weeks.</p>
<div class=exp-row><button type=button class=cta data-exp=xlsx>Download Excel (.xlsx)</button><button type=button class="cta cta-2" data-exp=csv>Download CSV</button></div>
<div class=exp-ai><button type=button class="cta cta-3" data-exp=md>Download Markdown (.md)</button><p>Share this with your AI agent: the same summary as plain text it can read and work with.</p></div></div>
<noscript><p class=big>The tier builder needs JavaScript. The full proposal follows below.</p></noscript>
</div></section>
<div class=calc role=region aria-label="Running tally"><div class=calc-in>
<span class=c-cell><span class=c-l>Hours</span><span id=c-hours class=c-v aria-live=polite>0</span></span>
<span class=c-cell><span class=c-l>Screens</span><span id=c-screens class=c-v>0</span></span>
<span class=c-cell><span class=c-l>Services</span><span id=c-monthly class=c-v>—</span></span>
<span class=c-set id=c-set aria-live=polite></span>
</div></div>
"""
src = src.replace(strip, "")
src = src.replace('<a class=cta href="#prices">Choose a tier</a>', "")
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
# Kirill is not on this team; the closing logo sits under the team
src, n = re.subn(r'<div class=mem><img src="assets/kirill-pavliashik\.jpg".*?</div>\n?', '', src, flags=re.S)
assert n == 1, "Kirill's card not found"
src = src.replace('<div class="team reveal">', '<div class="team team-2 reveal">', 1)
# Andrei does the frontend too
assert src.count('<p class=role>Tech lead · full-stack · backend</p>') == 1, "Andrei's role not found"
src = src.replace('<p class=role>Tech lead · full-stack · backend</p>', '<p class=role>Tech lead · full-stack · frontend · backend</p>')
# rate $35/h instead of $30/h: the tier prices go up by the same 7/6
for old, new in (('$12,000', '$14,000'), ('$18,000', '$21,000'), ('$24,000', '$28,000')):
    assert src.count(f'<div class=amt>{old}</div>') == 1, f'price {old} not found'
for old, new in (('$24,000', '$28,000'), ('$18,000', '$21,000'), ('$12,000', '$14,000')):
    src = src.replace(f'<div class=amt>{old}</div>', f'<div class=amt>{new}</div>')
src = src.replace("</div></section>\n</main>", "</div></section>\n<div class=end-logo aria-hidden=true>" + LOGO + "</div>\n</main>", 1)
assert "end-logo" in src

# --- footer outside main with grid; script
src = src.replace("<footer><div class=wrap>", "<footer>").replace("</span></div></footer>", "</span></footer>")
src = src.replace("</body></html>", '<script src="data/tiers.js" defer></script>\n<script src="builder.js" defer></script>\n<script src="feature-kit.js" defer></script>\n<script src="pvf-scan.js" defer></script>\n<script src="spaces.js" defer></script>\n<script src="setup.js" defer></script>\n<script src="main.js" defer></script>\n</body>\n</html>\n')

# builder goes right after the hero, before the proposal text
src = src.replace("\n<section id=approach>", BUILDER + "\n<section id=approach>", 1)

# screen descriptions for the builder slides, taken from the proposal tables (single source)
import html as _html
import json as _json
desc = {}
for sid, cell in re.findall(r"<tr><td class=id>([PM]\d\d)</td><td><b>[^<]*</b></td><td>(.*?)</td></tr>", src):
    desc[sid] = _html.unescape(re.sub(r"<[^>]+>", "", cell)).strip()
assert len(desc) == 49, len(desc)
(ROOT / "data" / "pages-desc.js").write_text(
    "// Generated by tools/build.py from the proposal tables. Do not edit by hand.\nwindow.LOCO_DESC = "
    + _json.dumps(desc, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
src = src.replace('<script src="data/tiers.js" defer></script>', '<script src="data/tiers.js" defer></script>\n<script src="data/pages-desc.js" defer></script>')

# proposal sections fold into dropdowns (details); Team stays open
FOLD = [
    ("approach", "How we read the brief", "One platform, three levels of ambition"),
    ("essential", "Tier 1", "Essential — 6 weeks · 49 screens"),
    ("signature", "Tier 2", "Signature — 8 weeks · 51 screens"),
    ("flagship", "Tier 3", "Flagship — 12 weeks · 54 screens"),
    ("compare", "Side by side", "Tier comparison"),
    ("prices", "Investment", "Prices"),
]
for sid, kick, title in FOLD:
    m = re.search(rf'<section id={sid}(?: class=(?:"[^"]*"|\S+))?><div class=wrap>.*?</div></section>', src, flags=re.S)
    assert m, sid
    sec = m.group(0)
    cls = re.search(r'class=("[^"]*"|\S+)>', sec.split("<div", 1)[0])
    tier = cls.group(1).strip('"') if cls else ""
    wrapped = (f'<details class="prop {tier}" id=d-{sid}><summary class=prop-sum><span class=wrap><span class=prop-k>{kick}</span>'
               f'<span class=prop-t>{title}</span><span class=prop-pl aria-hidden=true></span></span></summary>\n{sec}\n</details>')
    src = src.replace(sec, wrapped)

# cache-busting: GitHub Pages caches files for 10 min, so a new page with an old stylesheet looks broken
import hashlib
for asset in ["styles.css", "main.js", "builder.js", "feature-kit.js", "pvf-scan.js", "spaces.js", "setup.js", "data/tiers.js", "data/pages-desc.js"]:
    v = hashlib.sha1((ROOT / asset).read_bytes()).hexdigest()[:8]
    src = src.replace(f'"{asset}"', f'"{asset}?v={v}"')

# images loaded by the scripts carry a version too, so a new cut replaces the cached one at once
h = hashlib.sha1()
for f in sorted((ROOT / "assets").rglob("*")):
    if f.is_file() and f.suffix in (".jpg", ".png"):
        h.update(f.name.encode()); h.update(f.read_bytes())
src = src.replace('<script src="data/tiers.js', f'<script>window.ASSET_V="{h.hexdigest()[:8]}"</script>\n<script src="data/tiers.js', 1)
(ROOT / "index.html").write_text(src, encoding="utf-8")
print("index.html", len(src))
