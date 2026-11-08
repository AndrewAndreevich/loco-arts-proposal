"""Inspect loco-park.ge (Framer site) in headless Chromium: screenshots + computed styles.

Usage: python tools/inspect_ref.py <out_dir>
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "ref")
OUT.mkdir(parents=True, exist_ok=True)

PAGES = {"en": "https://loco-park.ge/", "ka": "https://loco-park.ge/ka"}
VIEWPORTS = {"desktop": (1440, 900), "mobile": (390, 844)}

JS = r"""
() => {
  const pick = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(), text: (el.innerText || '').trim().slice(0, 60),
      font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight,
      ls: s.letterSpacing, tt: s.textTransform, color: s.color, bg: s.backgroundColor,
      radius: s.borderRadius, border: s.border, padding: s.padding,
      transition: s.transition, w: Math.round(r.width), h: Math.round(r.height),
      x: Math.round(r.x), y: Math.round(r.y + scrollY)
    };
  };
  const all = [...document.querySelectorAll('body *')].filter(e => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
  });
  const count = (f) => { const m = {}; all.forEach(e => { const k = f(e); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 25); };
  const textEls = all.filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  const headings = textEls.filter(e => parseFloat(getComputedStyle(e).fontSize) >= 28).slice(0, 25).map(pick);
  const links = all.filter(e => e.tagName === 'A').slice(0, 40).map(pick);
  const buttons = all.filter(e => e.tagName === 'BUTTON' || /button|btn/i.test(e.className?.toString?.() || '')).slice(0, 20).map(pick);
  const header = document.querySelector('header, nav, [data-framer-name*="Nav" i], [data-framer-name*="Header" i]');
  const fonts = [...document.styleSheets].flatMap(ss => { try { return [...ss.cssRules]; } catch { return []; } })
    .filter(r => r.type === 5).map(r => r.cssText.slice(0, 300));
  const anims = all.filter(e => e.hasAttribute('data-framer-appear-id') || getComputedStyle(e).animationName !== 'none')
    .slice(0, 15).map(e => ({ ...pick(e), anim: getComputedStyle(e).animationName, style: e.getAttribute('style')?.slice(0, 200) }));
  return {
    title: document.title, docH: document.documentElement.scrollHeight,
    body: pick(document.body), html_bg: getComputedStyle(document.documentElement).backgroundColor,
    fontsByCount: count(e => textEls.includes(e) ? getComputedStyle(e).fontFamily : null),
    sizesByCount: count(e => textEls.includes(e) ? getComputedStyle(e).fontSize + ' / ' + getComputedStyle(e).fontWeight : null),
    colorsByCount: count(e => textEls.includes(e) ? getComputedStyle(e).color : null),
    bgByCount: count(e => { const b = getComputedStyle(e).backgroundColor; return b !== 'rgba(0, 0, 0, 0)' ? b : null; }),
    radiusByCount: count(e => { const b = getComputedStyle(e).borderRadius; return b !== '0px' ? b : null; }),
    headings, links, buttons, header: header ? { ...pick(header), position: getComputedStyle(header).position } : null,
    fontFaces: fonts, anims,
  };
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome")
    result = {}
    for lang, url in PAGES.items():
        for vp, (w, h) in VIEWPORTS.items():
            ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
            page = ctx.new_page()
            page.goto(url, wait_until="networkidle", timeout=90000)
            page.wait_for_timeout(2500)
            page.screenshot(path=str(OUT / f"{lang}-{vp}-top.png"))
            # scroll through to trigger appear animations, then full page
            total = page.evaluate("document.documentElement.scrollHeight")
            for y in range(0, total, h // 2):
                page.evaluate(f"window.scrollTo(0,{y})")
                page.wait_for_timeout(150)
            page.evaluate("window.scrollTo(0,600)")
            page.wait_for_timeout(800)
            page.screenshot(path=str(OUT / f"{lang}-{vp}-scrolled.png"))
            hdr_scrolled = page.evaluate("""() => { const h = document.querySelector('header, nav');
              if (!h) return null; const s = getComputedStyle(h);
              return {position: s.position, bg: s.backgroundColor, top: h.getBoundingClientRect().top, backdrop: s.backdropFilter}; }""")
            page.evaluate("window.scrollTo(0,0)")
            page.wait_for_timeout(800)
            data = page.evaluate(JS)
            data["header_after_scroll"] = hdr_scrolled
            result[f"{lang}-{vp}"] = data
            page.screenshot(path=str(OUT / f"{lang}-{vp}-full.png"), full_page=True)
            ctx.close()
    browser.close()

(OUT / "styles.json").write_text(json.dumps(result, indent=1, ensure_ascii=False), encoding="utf-8")
print("done", list(result))
