"""Carousel centring check in Chromium and WebKit (Safari engine).

For every carousel: step through all cards with the arrow and drop the strip at random
positions; after it settles, the current card must sit in the centre of the strip.

Usage: python tools/check_centre.py
"""
import random
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = (Path(__file__).resolve().parent.parent / "index.html").as_uri()
SECTIONS = ["g-artworks", "g-exhibitions", "g-myloco", "g-plan"]

OFFSET_JS = """(sec) => {
  const t = document.querySelector('#' + sec + ' .track');
  const tr = t.getBoundingClientRect();
  const mid = (tr.left + tr.right) / 2;
  let best = 1e9;
  t.querySelectorAll('.slide').forEach((s) => {
    if (s.hidden) return;
    const r = s.getBoundingClientRect();
    const d = (r.left + r.right) / 2 - mid;
    if (Math.abs(d) < Math.abs(best)) best = d;
  });
  return Math.round(best);
}"""

with sync_playwright() as p:
    for name, bt in (("chromium", p.chromium), ("webkit", p.webkit)):
        b = bt.launch()
        for w in (390, 1440):
            pg = b.new_page(viewport={"width": w, "height": 844})
            pg.goto(URL)
            pg.wait_for_load_state("networkidle")
            for sec in SECTIONS:
                pg.evaluate(f"document.querySelector('#{sec} .track').scrollIntoView({{block:'center'}})")
                pg.wait_for_timeout(300)
                n = pg.evaluate(f"[...document.querySelectorAll('#{sec} .slide')].filter(s=>!s.hidden).length")
                steps = []
                for _ in range(n - 1):
                    pg.click(f"#{sec} .slider .next")
                    pg.wait_for_timeout(700)
                    steps.append(pg.evaluate(OFFSET_JS, sec))
                drops = []
                box = pg.evaluate(f"(()=>{{const r=document.querySelector('#{sec} .track').getBoundingClientRect();return [r.left+r.width/2, r.top+80]}})()")
                for dx, ms in ((-160, 12), (160, 12), (-60, 2), (-40, 30), (90, 30), (-220, 6)):
                    pg.mouse.move(box[0], box[1]); pg.mouse.down()
                    for k in range(1, 9):
                        pg.mouse.move(box[0] + dx * k / 8, box[1]); pg.wait_for_timeout(ms)
                    pg.mouse.up(); pg.wait_for_timeout(700)
                    drops.append(pg.evaluate(OFFSET_JS, sec))
                bad = [v for v in steps + drops if abs(v) > 1]
                print(f"{name:8} {w:4} {sec:14} cards={n:2} arrow={steps} drags={drops} {'OK' if not bad else 'OFF'}")
            pg.close()
        b.close()
