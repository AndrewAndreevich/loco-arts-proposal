// Tier builder.
// For every group: (1) a map of its screens as nodes with transition lines, (2) a horizontal
// slider with one slide per screen (layout + description + hours) synced with the map,
// (3) option choices per tier. A fixed bar shows the live estimate.
(() => {
  const D = window.LOCO_DATA;
  const DESC = window.LOCO_DESC || {};
  const root = document.getElementById('groups');
  if (!D || !root) return;

  const SVGNS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tierById = Object.fromEntries(D.tiers.map((t) => [t.id, t]));
  const state = {};
  const key = (g, d) => `${g.id}.${d.id}`;

  // every screen in the project, for names of transition targets
  const allPages = {};
  const pageGroup = {};
  D.groups.forEach((g) => {
    g.pages.forEach((p) => { allPages[p.id] = p; pageGroup[p.id] = g.id; });
    g.decisions.forEach((d) => d.choices.forEach((c) => (c.pages || []).forEach((p) => {
      if (!allPages[p.id]) { allPages[p.id] = p; pageGroup[p.id] = g.id; }
    })));
  });

  const defaults = (tid) => {
    const s = {};
    D.groups.forEach((g) => g.decisions.forEach((d) => {
      s[key(g, d)] = (d.choices.find((c) => c.tiers.includes(tid)) || d.choices[0]).id;
    }));
    return s;
  };
  const matchingTier = () => D.tiers.find((t) => {
    const s = defaults(t.id);
    return Object.keys(s).every((k) => s[k] === state[k]);
  });
  function splitParts(text) {
    const out = []; let cur = ''; let depth = 0;
    for (const ch of text.replace(/\.\s*$/, '')) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (!depth && (ch === ',' || ch === ';' || ch === '·')) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out.map((x) => x.trim().replace(/^and\s+/i, '')).filter(Boolean).map((x) => x[0].toUpperCase() + x.slice(1));
  }
  const tierDots = (tiers) => (tiers.length
    ? tiers.map((t) => `<span class="td td-${t}">${tierById[t].name}</span>`).join('')
    : '<span class="td td-alt">Alternative</span>');

  // wireframes on a real grid: rows of equal cells, pill buttons, aligned text lines
  const cells = (n, cls = 'wb') => `<i class="${cls}"></i>`.repeat(n);
  const WF = {
    home: `<i class="wb wacc" style="height:38%"></i><span class="wr wc3" style="height:22%">${cells(3)}</span><span class="wr wc4" style="height:14%">${cells(4)}</span><i class="wl w60"></i>`,
    list: `<i class="wl wacc w30"></i><span class="wr wc4">${cells(4, 'wp')}</span><span class="wr wc4 wg2" style="height:52%">${cells(8)}</span>`,
    detail: `<span class="wr wc2" style="height:52%"><i class="wb wacc"></i><span class=wcol><i class="wl w90"></i><i class="wl w70"></i><i class="wl w80"></i><i class="wl w50"></i><i class="wp wacc w50"></i></span></span><span class="wr wc4" style="height:20%">${cells(4)}</span>`,
    form: `<i class="wl w40"></i><i class=wfld></i><i class=wfld></i><i class=wfld></i><i class="wfld wtall"></i><i class="wp wacc w30"></i>`,
    state: `<span class=wcen><i class="wdot wacc"></i><i class="wl w40"></i><i class="wp w25"></i></span>`,
    viewer: `<i class="wb wstage" style="height:66%"><i class="wdot wacc"></i></i><span class="wr wc5">${cells(5, 'wp')}</span>`,
    map: `<i class="wb wdots" style="height:66%"></i><span class="wr wc4">${cells(4, 'wp')}</span>`,
    dash: `<span class="wr wc3" style="height:24%"><i class="wb wacc"></i><i class=wb></i><i class=wb></i></span><span class="wr wc4 wg2" style="height:44%">${cells(8)}</span>`,
    text: `<i class="wl wacc w40"></i><i class="wl w95"></i><i class="wl w90"></i><i class="wl w95"></i><i class="wl w70"></i><i class="wl w90"></i><i class="wl w60"></i>`,
  };
  const WF_NAV = '<span class="wr wnav"><i class=wlogo></i><i></i><i class=wl></i><i class=wl></i><i class=wl></i><i class="wp wacc"></i></span>';
  const WF_FOOT = `<span class="wr wc4 wfoot">${cells(4, 'wl')}</span>`;
  // ---------- screens of a group: base + option-only, with tiers that bring them ----------
  function groupScreens(g) {
    const list = g.pages.map((p) => ({ ...p, opt: null }));
    const seen = new Set(list.map((p) => p.id));
    g.decisions.forEach((d) => d.choices.forEach((c) => (c.pages || []).forEach((p) => {
      if (seen.has(p.id)) return;
      seen.add(p.id);
      const tiers = [...new Set(d.choices.filter((x) => (x.pages || []).some((q) => q.id === p.id)).flatMap((x) => x.tiers))];
      list.push({ ...p, opt: { decision: d.id, tiers } });
    })));
    return list;
  }

  // ---------- horizontal layout: one row of screens in flow order, a second row for other groups ----------
  function layout(screens) {
    const ids = new Set(screens.map((s) => s.id));
    const order = screens.filter((s) => !s.opt).map((s) => s.id);
    screens.filter((s) => s.opt).forEach((s) => { // option screens sit right after the screen they open from
      let at = order.indexOf(s.from);
      if (at < 0) at = order.length - 1;
      while (at + 1 < order.length && screens.find((x) => x.id === order[at + 1]).opt) at += 1;
      order.splice(at + 1, 0, s.id);
    });
    const edges = []; const exits = []; const entries = [];
    screens.forEach((s) => {
      (s.to || []).forEach((t) => (ids.has(t) ? edges : exits).push([s.id, t]));
      if (s.from) (ids.has(s.from) ? edges : entries).push([s.from, s.id]);
    });
    const pos = {};
    order.forEach((id, i) => { pos[id] = [i, 0]; });
    const taken = new Set();
    const ghost = (gid, want) => {
      let c = want;
      while (taken.has(c)) c += 1;
      taken.add(c);
      pos[gid] = [c, 1];
    };
    [...new Set(entries.map((e) => e[0]))].forEach((src) => ghost('in:' + src, pos[entries.find((e) => e[0] === src)[1]][0]));
    [...new Set(exits.map((e) => e[1]))].forEach((t) => ghost('out:' + t, pos[exits.find((e) => e[1] === t)[0]][0]));
    const cols = Math.max(...Object.values(pos).map((p) => p[0])) + 1;
    const twoRows = entries.length + exits.length > 0;
    // threads that jump over the row: all jumps from one screen in one direction share a lane,
    // so they read as one trunk with branches down to each target
    const jumps = edges.filter(([a, b]) => pos[b][0] - pos[a][0] !== 1);
    const bundles = {};
    jumps.forEach(([a, b]) => {
      const k = `${a}|${pos[b][0] > pos[a][0] ? 'f' : 'b'}`;
      const bd = bundles[k] || (bundles[k] = { lo: pos[a][0], hi: pos[a][0], edges: [] });
      bd.lo = Math.min(bd.lo, pos[b][0]); bd.hi = Math.max(bd.hi, pos[b][0]); bd.edges.push(`${a}>${b}`);
    });
    const lanes = [];
    Object.values(bundles).sort((x, y) => (x.hi - x.lo) - (y.hi - y.lo)).forEach((bd) => {
      let l = 0;
      while (lanes[l] && lanes[l].some((o) => !(bd.hi < o.lo || bd.lo > o.hi))) l += 1;
      (lanes[l] = lanes[l] || []).push(bd);
      bd.lane = l;
    });
    const lane = {};
    const jumpOut = new Set(jumps.map(([a]) => a)); const jumpIn = new Set(jumps.map(([, b]) => b));
    Object.values(bundles).forEach((bd) => bd.edges.forEach((e) => { lane[e] = bd.lane; }));
    return { edges, exits, entries, pos, cols, twoRows, lane, laneCount: lanes.length, jumpOut, jumpIn };
  }

  // small empty pages; ghosts (second row) = screens in other groups
  const NW = 44; const NH = 58; const STEP = 66; const SW = 24; const SH = 33;
  const LANE = 9; const ROW2 = 40;

  function svg(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (parent) parent.appendChild(e);
    return e;
  }
  // orthogonal path through points, square corners
  function ortho(pts, r = 0) {
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i += 1) {
      const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; const [x2, y2] = pts[i + 1];
      const r1 = Math.min(r, Math.hypot(x1 - x0, y1 - y0) / 2, Math.hypot(x2 - x1, y2 - y1) / 2);
      const ax = x1 - Math.sign(x1 - x0) * r1; const ay = y1 - Math.sign(y1 - y0) * r1;
      const bx = x1 + Math.sign(x2 - x1) * r1; const by = y1 + Math.sign(y2 - y1) * r1;
      d += ` L${ax} ${ay} Q${x1} ${y1} ${bx} ${by}`;
    }
    const [lx, ly] = pts[pts.length - 1];
    return `${d} L${lx} ${ly}`;
  }

  function buildMap(g, screens, L) {
    const TOP = L.laneCount ? L.laneCount * LANE + 8 : 4;
    const W = (L.cols - 1) * STEP + NW + 8;
    const rowY2 = TOP + NH + ROW2;
    const H = (L.twoRows ? rowY2 + SH + 4 : TOP + NH + 4);
    const box = document.createElement('div');
    box.className = 'map';
    const s = svg('svg', { viewBox: `-4 0 ${W} ${H}`, width: W, height: H, role: 'group', 'aria-label': `Screen map: ${g.name}` }, box);
    const defs = svg('defs', {}, s);
    ['a', 'b'].forEach((m) => {
      const mk = svg('marker', { id: `ar-${g.id}-${m}`, viewBox: '0 0 6 6', refX: 5, refY: 3, markerWidth: 5, markerHeight: 5, orient: 'auto', markerUnits: 'userSpaceOnUse' }, defs);
      svg('path', { d: 'M0 0 L6 3 L0 6 Z', class: m === 'a' ? 'mk' : 'mk on' }, mk);
    });
    const xy = (id) => {
      const [c, r] = L.pos[id];
      const w = r ? SW : NW; const h = r ? SH : NH;
      return { x: c * STEP + (NW - w) / 2, y: r ? rowY2 : TOP, w, h };
    };
    const gEdges = svg('g', { class: 'edges' }, s);
    const gNodes = svg('g', { class: 'nodes' }, s);
    const addEdge = (a, b, ext, i) => {
      const A = xy(a); const B = xy(b);
      let pts;
      if (L.pos[b][1] === 1) { // down to another group
        const xa = A.x + A.w / 2; const xb = B.x + B.w / 2; const ym = A.y + A.h + ROW2 / 2;
        pts = xa === xb ? [[xa, A.y + A.h + 2], [xb, B.y - 3]] : [[xa, A.y + A.h + 2], [xa, ym], [xb, ym], [xb, B.y - 3]];
      } else if (L.pos[a][1] === 1) { // up from another group
        const xa = A.x + A.w / 2; const xb = B.x + B.w / 2; const ym = B.y + B.h + ROW2 / 2;
        pts = xa === xb ? [[xa, A.y - 2], [xb, B.y + B.h + 3]] : [[xa, A.y - 2], [xa, ym], [xb, ym], [xb, B.y + B.h + 3]];
      } else if (L.pos[b][0] - L.pos[a][0] === 1) { // neighbours: straight thread
        pts = [[A.x + A.w + 2, A.y + A.h / 2], [B.x - 3, B.y + B.h / 2]];
      } else { // jump over the row in its own lane
        const ya = TOP - 8 - L.lane[`${a}>${b}`] * LANE;
        // out of the middle of the top edge, into the middle of the target's top edge;
        // a screen that both sends and receives jumps splits its centre a little
        const both = (id) => L.jumpOut.has(id) && L.jumpIn.has(id);
        const xa = A.x + A.w / 2 - (both(a) ? 5 : 0); const xb = B.x + B.w / 2 + (both(b) ? 5 : 0);
        pts = [[xa, A.y - 1], [xa, ya], [xb, ya], [xb, B.y - 3]];
      }
      const p = svg('path', { d: ortho(pts), class: 'edge' + (ext ? ' ext' : ''), pathLength: 1, 'marker-end': `url(#ar-${g.id}-a)` }, gEdges);
      p.dataset.a = a.replace(/^(in|out):/, ''); p.dataset.b = b.replace(/^(in|out):/, '');
      p.style.setProperty('--i', i);
    };
    let i = 0;
    L.entries.forEach(([src, dst]) => addEdge('in:' + src, dst, true, i++));
    L.edges.forEach(([a, b]) => addEdge(a, b, false, i++));
    L.exits.forEach(([a, t]) => addEdge(a, 'out:' + t, true, i++));

    let n = 0;
    const node = (id, cls, label, title, below) => {
      const P = xy(id);
      const gg = svg('g', { class: 'node ' + cls, transform: `translate(${P.x} ${P.y})`, tabindex: 0, role: 'button', 'aria-label': title }, gNodes);
      gg.style.setProperty('--i', n++);
      svg('title', {}, gg).textContent = title;
      svg('rect', { class: 'pg', width: P.w, height: P.h, rx: 3 }, gg);
      const t = svg('text', { x: P.w / 2, y: P.h / 2 + 3.5, 'text-anchor': 'middle' }, gg);
      t.textContent = label;
      return gg;
    };
    screens.forEach((sc) => {
      node(sc.id, sc.opt ? 'opt' : '', sc.id, `${sc.id} ${sc.name} · ${sc.h} h`, false).dataset.id = sc.id;
    });
    [...new Set(L.entries.map((e) => e[0]))].forEach((src) => {
      node('in:' + src, 'ghost', src, `From ${src} ${allPages[src].name}`, true).dataset.go = src;
    });
    [...new Set(L.exits.map((e) => e[1]))].forEach((t) => {
      node('out:' + t, 'ghost', t, `Go to ${t} ${allPages[t] ? allPages[t].name : ''}`, true).dataset.go = t;
    });
    return box;
  }

  function buildSlider(g, screens) {
    const wrapEl = document.createElement('div');
    wrapEl.className = 'slider';
    const track = document.createElement('div');
    track.className = 'track';
    track.tabIndex = 0;
    track.setAttribute('role', 'region');
    track.setAttribute('aria-label', `Screens of ${g.name}, scroll sideways`);
    screens.forEach((sc, idx) => {
      const sl = document.createElement('article');
      sl.className = 'slide' + (sc.opt ? ' opt' : '');
      sl.dataset.id = sc.id;
      const parts = splitParts(sc.desc || DESC[sc.id] || '');
      const sum = (D.summaries || {})[sc.id] || '';
      sl.innerHTML = `<div class="wf big wf-${sc.kind}" aria-hidden=true>${WF_NAV}<div class=wf-body>${WF[sc.kind] || WF.text}</div>${WF_FOOT}</div>
        <div class=slide-body>
          <p class=s-top><span class=s-id>${sc.id}</span><span class=s-n>${idx + 1} / ${screens.length}</span><span class=s-h>${sc.h} h</span></p>
          <h4>${esc(sc.name)}</h4>
          ${sum ? `<p class=s-sum>${esc(sum)}</p>` : ''}
          ${parts.length ? `<ul class=s-parts>${parts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          ${sc.opt ? `<p class=tds>${tierDots(sc.opt.tiers)}</p>` : ''}
        </div>`;
      track.appendChild(sl);
    });
    const arrow = (d) => `<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="${d}"/></svg>`;
    const prev = Object.assign(document.createElement('button'), { type: 'button', className: 'nav prev', innerHTML: arrow('M7 1 L2 5 L7 9 Z') });
    const next = Object.assign(document.createElement('button'), { type: 'button', className: 'nav next', innerHTML: arrow('M3 1 L8 5 L3 9 Z') });
    prev.setAttribute('aria-label', 'Previous screen');
    next.setAttribute('aria-label', 'Next screen');
    wrapEl.append(track, prev, next);
    return { wrapEl, track, prev, next };
  }

  // ---------- render all groups ----------
  const groups = [];
  D.groups.forEach((g, gi) => {
    const sec = document.createElement('section');
    sec.className = 'grp reveal';
    sec.id = 'g-' + g.id;
    sec.style.setProperty('--gc', `var(--${g.color})`);
    sec.innerHTML = `<div class=grp-head><span class=grp-n>${String(gi + 1).padStart(2, '0')}</span><h3>${esc(g.name)}</h3>
      <p class=grp-meta></p></div>${g.note ? `<p class=grp-note>${esc(g.note)}</p>` : ''}`;
    const screens = groupScreens(g);
    let api = null;
    if (screens.length) {
      const L = layout(screens);
      sec.appendChild(buildMap(g, screens, L));
      const sl = buildSlider(g, screens);
      sec.appendChild(sl.wrapEl);
      api = { sec, screens, ...sl };
    } else {
      sec.appendChild(Object.assign(document.createElement('p'), { className: 'grp-noscreens', textContent: 'No screens of its own: this work runs across all groups.' }));
    }
    g.decisions.forEach((d) => {
      const fs = document.createElement('fieldset');
      fs.className = 'dec';
      fs.innerHTML = `<legend>${esc(d.label)}</legend><div class=opts>${d.choices.map((c) => {
        const id = `c-${g.id}-${d.id}-${c.id}`;
        return `<label class=opt for="${id}"><input type=radio name="${key(g, d)}" id="${id}" value="${c.id}">
          <span class=opt-top><span class=opt-l>${esc(c.label)}</span><span class=opt-h>${c.hours} h</span></span>
          ${c.note ? `<span class=opt-n>${esc(c.note)}</span>` : ''}<span class=tds>${tierDots(c.tiers)}</span></label>`;
      }).join('')}</div>`;
      sec.appendChild(fs);
      if (api) { // on phones the same fieldset moves into a card at the end of the carousel
        const card = document.createElement('article');
        card.className = 'slide dec-card';
        card.dataset.id = 'dec:' + d.id;
        card.hidden = true;
        api.track.appendChild(card);
        (api.decs = api.decs || []).push({ fs, card });
      }
    });
    root.appendChild(sec);
    groups.push({ g, api });
  });

  // ---------- map <-> slider sync ----------
  function setActive(api, id) {
    api.sec.querySelectorAll('.node[data-id]').forEach((n) => n.classList.toggle('on', n.dataset.id === id));
    api.sec.querySelectorAll('.edge').forEach((e) => {
      const hot = e.dataset.a === id || e.dataset.b === id;
      e.classList.toggle('hot', hot);
      e.setAttribute('marker-end', `url(#ar-${api.sec.id.slice(2)}-${hot ? 'b' : 'a'})`);
      if (hot) e.parentNode.appendChild(e);
    });
    api.sec.querySelectorAll('.slide').forEach((s) => s.classList.toggle('cur', s.dataset.id === id));
    api.active = id;
    placeArrows(api);
    // keep the active page in view when the map is wider than the screen
    const box = api.sec.querySelector('.map');
    const node = api.sec.querySelector(`.node[data-id="${id}"]`);
    if (box && node && box.scrollWidth > box.clientWidth) {
      const nb = node.getBoundingClientRect(); const bb = box.getBoundingClientRect();
      box.scrollTo({ left: box.scrollLeft + nb.left - bb.left - (bb.width - nb.width) / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  // small translucent arrows sit on the left and right edge of the current preview
  function placeArrows(api) {
    const cur = api.track.querySelector('.slide.cur');
    if (!cur) return;
    const sb = api.wrapEl.getBoundingClientRect();
    const cs = cur.getBoundingClientRect();
    const w = api.prev.offsetWidth || 30;
    const top = `${cs.top - sb.top + cs.height / 2}px`;
    api.prev.style.top = top; api.next.style.top = top;
    api.prev.style.left = `${cs.left - sb.left - w - 6}px`;
    api.next.style.left = `${cs.right - sb.left + 6}px`;
    const ids = visibleIds(api);
    api.prev.hidden = ids.indexOf(api.active) === 0;
    api.next.hidden = ids.indexOf(api.active) === ids.length - 1;
  }
  const visibleIds = (api) => [...api.track.querySelectorAll('.slide')].filter((x) => !x.hidden).map((x) => x.dataset.id);
  function slideTo(api, id, smooth = true) {
    const sl = api.track.querySelector(`.slide[data-id="${id}"]`);
    if (!sl) return;
    seen(api, id);
    api.track.scrollTo({ left: sl.offsetLeft - (api.track.clientWidth - sl.offsetWidth) / 2, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    setActive(api, id);
  }
  function goTo(id) { // a screen in any group
    const gr = groups.find((x) => x.g.id === pageGroup[id]);
    if (!gr || !gr.api) return;
    gr.api.sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    slideTo(gr.api, id);
  }
  groups.forEach(({ api }) => {
    if (!api) return;
    let raf = 0;
    api.track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = api.track.scrollLeft + api.track.clientWidth / 2;
        let best = null; let dist = Infinity;
        api.track.querySelectorAll('.slide').forEach((s) => {
          if (s.hidden) return;
          const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
          if (d < dist) { dist = d; best = s.dataset.id; }
        });
        if (best && best !== api.active) { seen(api, best); setActive(api, best); } else placeArrows(api);
      });
    }, { passive: true });
    const step = (dir) => {
      const ids = visibleIds(api);
      const i = Math.max(0, Math.min(ids.length - 1, ids.indexOf(api.active) + dir));
      slideTo(api, ids[i]);
    };
    // swipe fallback for browsers that do not scroll the strip natively
    let sx = 0; let sy = 0; let sl = 0;
    api.track.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; sl = api.track.scrollLeft; }, { passive: true });
    api.track.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx; const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) && Math.abs(api.track.scrollLeft - sl) < 5) step(dx < 0 ? 1 : -1);
    }, { passive: true });
    window.addEventListener('resize', () => placeArrows(api));
    api.prev.addEventListener('click', () => step(-1));
    api.next.addEventListener('click', () => step(1));
    api.sec.addEventListener('click', (e) => {
      const node = e.target.closest('.node[data-id]');
      if (node) { slideTo(api, node.dataset.id); return; }
      const go = e.target.closest('[data-go]');
      if (go) {
        const id = go.dataset.go;
        if (api.screens.some((s) => s.id === id)) slideTo(api, id); else goTo(id);
      }
    });
    api.sec.addEventListener('keydown', (e) => {
      const t = e.target.closest('.node');
      if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); t.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
    });
    setActive(api, api.screens[0].id);
  });

  // ---------- phones: options become cards in the carousel ----------
  const phone = window.matchMedia('(max-width: 720px)');
  function placeDecs() {
    groups.forEach(({ api }) => {
      if (!api || !api.decs) return;
      api.decs.forEach(({ fs, card }) => {
        if (phone.matches) { card.appendChild(fs); card.hidden = false; } else { api.sec.appendChild(fs); card.hidden = true; }
      });
      if (!visibleIds(api).includes(api.active)) setActive(api, api.screens[0].id);
      placeArrows(api);
    });
  }
  placeDecs();
  phone.addEventListener('change', placeDecs);

  // ---------- running tally of hours and services ----------
  // Scrolling past a group adds the whole group. Moving through its carousel instead adds only the
  // screens actually viewed, plus options the visitor picks; such a group is never added in bulk later.
  const counted = {}; // group id -> 'all' | Set of viewed screen ids
  const picked = new Set(); // decision keys chosen by the visitor
  const gidOf = (api) => api.sec.id.slice(2);
  function seen(api, id) {
    const gid = gidOf(api);
    if (counted[gid] === 'all' || id.startsWith('dec:')) return;
    if (!counted[gid]) counted[gid] = new Set([api.active]);
    counted[gid].add(id);
    update();
  }

  const out = { hours: document.getElementById('c-hours'), monthly: document.getElementById('c-monthly') };
  const servicesEl = document.getElementById('services');
  const switches = [...document.querySelectorAll('[data-tier]')];
  const pageHours = (pages) => (pages || []).reduce((a, p) => a + (p.h || 0), 0);

  function update() {
    let hours = 0;
    const svc = new Set();
    groups.forEach(({ g, api }) => {
      let gh = g.hours; let gs = g.pages.length;
      const activePages = new Map(g.pages.map((p) => [p.id, p]));
      const choices = g.decisions.map((d) => {
        const c = d.choices.find((x) => x.id === state[key(g, d)]);
        gh += c.hours;
        (c.pages || []).forEach((p) => { if (!activePages.has(p.id)) { activePages.set(p.id, p); gs += 1; } });
        document.getElementById(`c-${g.id}-${d.id}-${c.id}`).checked = true;
        return { d, c };
      });
      if (api) {
        api.sec.querySelectorAll('.node.opt, .slide.opt').forEach((el) => el.classList.toggle('off', !activePages.has(el.dataset.id)));
        api.sec.querySelectorAll('.edge').forEach((e) => {
          const optOff = [e.dataset.a, e.dataset.b].some((id) => allPages[id] && pageGroup[id] === g.id && !activePages.has(id));
          e.classList.toggle('off', optOff);
        });
      }
      document.getElementById('g-' + g.id).querySelector('.grp-meta').textContent =
        `${gs ? `${gs} ${gs === 1 ? 'screen' : 'screens'} · ` : ''}${gh} h`;

      const c = counted[g.id];
      if (c === 'all') {
        hours += gh;
        (g.services || []).forEach((x) => svc.add(x));
        choices.forEach(({ c: ch }) => (ch.services || []).forEach((x) => svc.add(x)));
      } else if (c) {
        let any = false;
        activePages.forEach((p, id) => { if (c.has(id)) { hours += p.h || 0; any = true; } });
        choices.forEach(({ d, c: ch }) => {
          if (!picked.has(key(g, d))) return;
          hours += ch.hours - pageHours(ch.pages); any = true;
          (ch.services || []).forEach((x) => svc.add(x));
        });
        if (any) (g.services || []).forEach((x) => svc.add(x));
      }
    });
    let lo = 0; let hi = 0;
    const rows = [];
    svc.forEach((x) => {
      const v = D.services[x]; lo += v.min; hi += v.max;
      rows.push(`<li><span>${esc(v.name)}</span><span>${v.min === v.max ? money(v.min) : `${money(v.min)}–${money(v.max)}`}</span></li>`);
    });
    out.hours.textContent = hours;
    out.monthly.textContent = svc.size ? `${money(lo)}–${money(hi)} / mo` : '—';
    if (servicesEl) servicesEl.innerHTML = (rows.join('') || '<li><span>Nothing counted yet: scroll or open screens above</span></li>')
      + (svc.size ? `<li class=tot><span>Total</span><span>${money(lo)}–${money(hi)} / month</span></li>` : '');
    const t = matchingTier();
    switches.forEach((b) => b.setAttribute('aria-pressed', String(!!t && b.dataset.tier === t.id)));
  }
  function setTier(tid) { Object.assign(state, defaults(tid)); update(); }

  // scrolling past a group that was not explored screen by screen adds all of it
  let vraf = 0;
  window.addEventListener('scroll', () => {
    cancelAnimationFrame(vraf);
    vraf = requestAnimationFrame(() => {
      let changed = false;
      groups.forEach(({ g }) => {
        if (counted[g.id]) return;
        if (document.getElementById('g-' + g.id).getBoundingClientRect().bottom < window.innerHeight * 0.55) { counted[g.id] = 'all'; changed = true; }
      });
      if (changed) update();
    });
  }, { passive: true });

  root.addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;
    state[e.target.name] = e.target.value;
    const gid = e.target.name.split('.')[0];
    picked.add(e.target.name);
    if (!counted[gid]) {
      const gr = groups.find((x) => x.g.id === gid);
      counted[gid] = new Set(gr && gr.api ? [gr.api.active] : []);
    }
    update();
  });
  switches.forEach((b) => b.addEventListener('click', () => setTier(b.dataset.tier)));
  setTier('E');
})();
