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
    home: `<i class="wb wacc" style="flex:38 1 0"></i><span class="wr wc3" style="flex:22 1 0">${cells(3)}</span><span class="wr wc4" style="flex:14 1 0">${cells(4)}</span><i class="wl w60"></i>`,
    list: `<i class="wl wacc w30"></i><span class="wr wc4">${cells(4, 'wp')}</span><span class="wr wc4 wg2" style="flex:52 1 0">${cells(8)}</span>`,
    detail: `<span class="wr wc2" style="flex:52 1 0"><i class="wb wacc"></i><span class=wcol><i class="wl w90"></i><i class="wl w70"></i><i class="wl w80"></i><i class="wl w50"></i><i class="wp wacc w50"></i></span></span><span class="wr wc4" style="flex:20 1 0">${cells(4)}</span>`,
    form: `<i class="wl w40"></i><i class=wfld></i><i class=wfld></i><i class=wfld></i><i class="wfld wtall"></i><i class="wp wacc w30"></i>`,
    state: `<span class=wcen><i class="wdot wacc"></i><i class="wl w40"></i><i class="wp w25"></i></span>`,
    viewer: `<i class="wb wstage" style="flex:66 1 0"><i class="wdot wacc"></i></i><span class="wr wc5">${cells(5, 'wp')}</span>`,
    map: `<i class="wb wdots" style="flex:66 1 0"></i><span class="wr wc4">${cells(4, 'wp')}</span>`,
    dash: `<span class="wr wc3" style="flex:24 1 0"><i class="wb wacc"></i><i class=wb></i><i class=wb></i></span><span class="wr wc4 wg2" style="flex:44 1 0">${cells(8)}</span>`,
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
    // transitions that jump over the row: screens linked to each other share ONE line above the row,
    // and every screen has a single stub up to it (as drawn: one path, branches to each card)
    const jumps = edges.filter(([a, b]) => pos[b][0] - pos[a][0] !== 1);
    const parent = {};
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    jumps.forEach(([a, b]) => { parent[a] = parent[a] || a; parent[b] = parent[b] || b; parent[find(a)] = find(b); });
    const compMap = {};
    jumps.forEach(([a, b]) => {
      const r = find(a);
      const c = compMap[r] || (compMap[r] = { nodes: new Set(), edges: [], lo: Infinity, hi: -Infinity });
      [a, b].forEach((n) => { c.nodes.add(n); c.lo = Math.min(c.lo, pos[n][0]); c.hi = Math.max(c.hi, pos[n][0]); });
      c.edges.push([a, b]);
    });
    const comps = Object.values(compMap);
    const lanes = [];
    comps.sort((x, y) => (x.hi - x.lo) - (y.hi - y.lo)).forEach((c) => {
      let l = 0;
      while (lanes[l] && lanes[l].some((o) => !(c.hi < o.lo || c.lo > o.hi))) l += 1;
      (lanes[l] = lanes[l] || []).push(c);
      c.lane = l;
    });
    return { edges, exits, entries, pos, cols, twoRows, comps, laneCount: lanes.length };
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
    const ek = (a, b) => `${a.replace(/^(in|out):/, '')}>${b.replace(/^(in|out):/, '')}`;
    const path = (pts, keys, cls, i, arrow) => {
      const p = svg('path', { d: ortho(pts), class: 'edge' + (cls ? ' ' + cls : ''), pathLength: 1 }, gEdges);
      if (arrow) p.setAttribute('marker-end', `url(#ar-${g.id}-a)`);
      p.dataset.e = keys.join(' ');
      p.style.setProperty('--i', i);
    };
    let i = 0;
    // other groups: one stub down from the screen, branching to each target below
    L.entries.forEach(([src, dst]) => {
      const A = xy('in:' + src); const B = xy(dst);
      const xa = A.x + A.w / 2; const xb = B.x + B.w / 2; const ym = B.y + B.h + ROW2 / 2;
      path(xa === xb ? [[xa, A.y - 2], [xb, B.y + B.h + 3]] : [[xa, A.y - 2], [xa, ym], [xb, ym], [xb, B.y + B.h + 3]], [ek(src, dst)], 'ext', i++, true);
    });
    L.exits.forEach(([src, t]) => {
      const A = xy(src); const B = xy('out:' + t);
      const xa = A.x + A.w / 2; const xb = B.x + B.w / 2; const ym = A.y + A.h + ROW2 / 2;
      path(xa === xb ? [[xa, A.y + A.h + 2], [xb, B.y - 3]] : [[xa, A.y + A.h + 2], [xa, ym], [xb, ym], [xb, B.y - 3]], [ek(src, t)], 'ext', i++, true);
    });
    // neighbours: straight thread
    L.edges.filter(([a, b]) => L.pos[b][0] - L.pos[a][0] === 1).forEach(([a, b]) => {
      const A = xy(a); const B = xy(b);
      path([[A.x + A.w + 2, A.y + A.h / 2], [B.x - 3, B.y + B.h / 2]], [ek(a, b)], '', i++, true);
    });
    // linked screens: one shared line above the row, one stub per screen, arrow into every target
    L.comps.forEach((c) => {
      const y = TOP - 8 - c.lane * LANE;
      const keys = c.edges.map(([a, b]) => ek(a, b));
      const xs = [...c.nodes].map((n) => ({ n, x: xy(n).x + NW / 2 })).sort((u, v) => u.x - v.x);
      xs.forEach(({ n, x }) => {
        const touching = c.edges.filter(([a, b]) => a === n || b === n).map(([a, b]) => ek(a, b));
        const target = c.edges.some(([, b]) => b === n);
        const top = xy(n).y;
        if (target) path([[x, y], [x, top - 3]], touching, '', i++, true);
        else path([[x, top - 1], [x, y]], touching, '', i++, false);
      });
      for (let k = 0; k < xs.length - 1; k += 1) {
        const x0 = xs[k].x; const x1 = xs[k + 1].x;
        const over = c.edges.filter(([a, b]) => {
          const lo = Math.min(xy(a).x, xy(b).x) + NW / 2; const hi = Math.max(xy(a).x, xy(b).x) + NW / 2;
          return lo <= x0 && hi >= x1;
        }).map(([a, b]) => ek(a, b));
        path([[x0, y], [x1, y]], over, '', i++, false);
      }
    });

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
      node(sc.id, sc.opt ? 'xopt' : '', sc.id, `${sc.id} ${sc.name} · ${sc.h} h`, false).dataset.id = sc.id;
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
    track.setAttribute('aria-label', `Screens of ${g.name}, swipe sideways`);
    const strip = document.createElement('div');
    strip.className = 'strip';
    track.appendChild(strip);
    screens.forEach((sc, idx) => {
      const sl = document.createElement('article');
      sl.className = 'slide' + (sc.opt ? ' xopt' : '');
      sl.dataset.id = sc.id;
      const parts = splitParts(sc.desc || DESC[sc.id] || '');
      const sum = (D.summaries || {})[sc.id] || '';
      sl.innerHTML = `<div class=s-head>
          <p class=s-top><span class=s-kind>Page</span><span class=s-id>${sc.id}</span><span class=s-n>${idx + 1} / ${screens.length}</span><span class=s-h>${sc.h} h</span></p>
          <h4>${esc(sc.name)}</h4>
        </div>
        <div class="wf big wf-${sc.kind}" aria-hidden=true>${WF_NAV}<div class=wf-body>${WF[sc.kind] || WF.text}</div>${WF_FOOT}</div>
        <div class=slide-body>
          ${sum ? `<p class=s-sum>${esc(sum)}</p>` : ''}
          ${parts.length ? `<ul class=s-parts>${parts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          ${sc.opt ? `<p class=tds>${tierDots(sc.opt.tiers)}</p>` : ''}
        </div>`;
      strip.appendChild(sl);
    });
    const arrow = (d) => `<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="${d}"/></svg>`;
    const prev = Object.assign(document.createElement('button'), { type: 'button', className: 'nav prev', innerHTML: arrow('M7 1 L2 5 L7 9 Z') });
    const next = Object.assign(document.createElement('button'), { type: 'button', className: 'nav next', innerHTML: arrow('M3 1 L8 5 L3 9 Z') });
    prev.setAttribute('aria-label', 'Previous screen');
    next.setAttribute('aria-label', 'Next screen');
    wrapEl.append(track, prev, next);
    return { wrapEl, track, strip, prev, next };
  }

  // ---------- render all groups ----------
  const groups = [];
  D.groups.forEach((g, gi) => {
    const sec = document.createElement('section');
    sec.className = 'grp reveal';
    sec.id = 'g-' + g.id;
    sec.style.setProperty('--gc', `var(--${g.color})`);
    sec.innerHTML = `<div class=grp-head><span class=grp-n>${String(gi + 1).padStart(2, '0')}</span><h3>${esc(g.name)}</h3></div>${g.note ? `<p class=grp-note>${esc(g.note)}</p>` : ''}`;
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
        api.strip.appendChild(card);
        (api.decs = api.decs || []).push({ fs, card });
      }
    });
    root.appendChild(sec);
    const foot = document.createElement('div');
    foot.className = 'grp-foot';
    foot.innerHTML = `<span class=gf-s></span><span class=gf-v><span class=gf-h></span><span class=gf-m></span></span>`;
    sec.appendChild(foot);
    groups.push({ g, api });
  });

  // ---------- map <-> slider sync ----------
  function setActive(api, id) {
    api.sec.querySelectorAll('.node[data-id]').forEach((n) => n.classList.toggle('on', n.dataset.id === id));
    api.sec.querySelectorAll('.edge').forEach((e) => {
      const hot = (e.dataset.e || '').split(' ').some((k) => k.split('>').includes(id));
      e.classList.toggle('hot', hot);
      if (e.hasAttribute('marker-end')) e.setAttribute('marker-end', `url(#ar-${api.sec.id.slice(2)}-${hot ? 'b' : 'a'})`);
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
    const cur = api.strip.querySelector('.slide.cur');
    if (!cur) return;
    const sb = api.wrapEl.getBoundingClientRect();
    const tr = api.track.getBoundingClientRect();
    const w = api.prev.offsetWidth || 30;
    const cw = cur.offsetWidth;
    const left = tr.left - sb.left + api.track.clientWidth / 2 - cw / 2;
    const top = `${tr.top - sb.top + api.strip.offsetTop + api.strip.offsetHeight / 2}px`;
    api.prev.style.top = top; api.next.style.top = top;
    api.prev.style.left = `${left - w - 6}px`;
    api.next.style.left = `${left + cw + 6}px`;
    const ids = visibleIds(api);
    api.prev.hidden = ids.indexOf(api.active) === 0;
    api.next.hidden = ids.indexOf(api.active) === ids.length - 1;
  }
  const visibleIds = (api) => [...api.strip.querySelectorAll('.slide')].filter((x) => !x.hidden).map((x) => x.dataset.id);
  // the strip moves with a transform, so the card lands exactly in the centre on every device
  function centreX(api, sl) { return api.track.clientWidth / 2 - (sl.offsetLeft + sl.offsetWidth / 2); }
  function moveStrip(api, x, animate) {
    api.x = x;
    api.strip.style.transition = animate && !reduce ? 'transform .42s cubic-bezier(.2, .75, .2, 1)' : 'none';
    api.strip.style.transform = `translate3d(${x}px, 0, 0)`;
  }
  function slideTo(api, id, smooth = true) {
    const sl = api.strip.querySelector(`.slide[data-id="${id}"]`);
    if (!sl || sl.hidden) return;
    moveStrip(api, centreX(api, sl), smooth);
    const changed = id !== api.active;
    setActive(api, id);
  }
  function goTo(id) { // a screen in any group
    const gr = groups.find((x) => x.g.id === pageGroup[id]);
    if (!gr || !gr.api) return;
    gr.api.sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    slideTo(gr.api, id);
  }
  function wire(api) {
    const step = (dir) => {
      const ids = visibleIds(api);
      const i = Math.max(0, Math.min(ids.length - 1, ids.indexOf(api.active) + dir));
      slideTo(api, ids[i]);
    };
    // drag with a finger or the mouse; vertical page scrolling stays with the browser (touch-action: pan-y)
    let drag = null; let moved = false;
    api.track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('button, a')) return;
      drag = { x0: e.clientX, y0: e.clientY, t0: performance.now(), base: api.x || 0, dir: null, id: e.pointerId, dx: 0 };
      moved = false;
    });
    api.track.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0; const dy = e.clientY - drag.y0;
      if (!drag.dir) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        drag.dir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.dir === 'x') { try { api.track.setPointerCapture(drag.id); } catch (err) { /* ignore */ } }
      }
      if (drag.dir !== 'x') return;
      moved = true;
      const ids = visibleIds(api);
      const first = api.strip.querySelector(`.slide[data-id="${ids[0]}"]`);
      const last = api.strip.querySelector(`.slide[data-id="${ids[ids.length - 1]}"]`);
      let x = drag.base + dx;
      const max = centreX(api, first); const min = centreX(api, last);
      if (x > max) x = max + (x - max) * 0.3;
      if (x < min) x = min + (x - min) * 0.3;
      drag.dx = dx;
      moveStrip(api, x, false);
    });
    const end = (e) => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      if (drag.dir === 'x') {
        const dt = Math.max(1, performance.now() - drag.t0);
        const v = drag.dx / dt;
        const cur = api.strip.querySelector('.slide.cur');
        const w = cur ? cur.offsetWidth : 300;
        let dir = 0;
        if (drag.dx < -w * 0.18 || v < -0.35) dir = 1;
        else if (drag.dx > w * 0.18 || v > 0.35) dir = -1;
        if (dir) step(dir); else slideTo(api, api.active);
      }
      drag = null;
    };
    api.track.addEventListener('pointerup', end);
    api.track.addEventListener('pointercancel', end);
    api.track.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    let wheelLock = 0;
    api.track.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 8) return;
      e.preventDefault();
      const now = performance.now();
      if (now < wheelLock) return;
      wheelLock = now + 450;
      step(e.deltaX > 0 ? 1 : -1);
    }, { passive: false });
    api.track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });
    window.addEventListener('resize', () => {
      const c = api.strip.querySelector(`.slide[data-id="${api.active}"]`);
      if (c) moveStrip(api, centreX(api, c), false);
    });
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
    slideTo(api, api.screens[0].id, false);
  }
  groups.forEach(({ api }) => { if (api) wire(api); });

  // ---------- phones: options become cards in the carousel ----------
  const phone = window.matchMedia('(max-width: 720px)');
  function placeDecs() {
    groups.forEach(({ api }) => {
      if (!api || !api.decs) return;
      api.decs.forEach(({ fs, card }) => {
        if (phone.matches) { card.appendChild(fs); card.hidden = false; } else { api.sec.insertBefore(fs, api.sec.querySelector('.grp-foot')); card.hidden = true; }
      });
      if (!visibleIds(api).includes(api.active)) setActive(api, api.screens[0].id);
      slideTo(api, api.active, false);
      placeArrows(api);
    });
  }
  placeDecs();
  phone.addEventListener('change', placeDecs);

  // ---------- work plan: base screens + the options selected above, packed into weeks ----------
  // Same visual language as the groups: a calendar row of weeks (the map) and a carousel of week cards.
  const planRoot = document.getElementById('plan');
  let planSig = '';
  const KICKOFF = 12; // hours of the delivery group spent on kick-off and setup in week 1

  function planPackages() {
    const G = Object.fromEntries(D.groups.map((g) => [g.id, g]));
    const pick = (gid, did) => {
      const g = G[gid]; const d = g.decisions.find((x) => x.id === did);
      return d.choices.find((c) => c.id === state[key(g, d)]);
    };
    const pk = [];
    const add = (gid, label, hours) => { if (hours > 0) pk.push({ gid, color: G[gid].color, label, hours }); };
    add('delivery', 'Kick-off, content model, repository, staging, hosting', KICKOFF);
    const concepts = pick('design', 'concepts'); add('design', `Design: ${concepts.label}`, concepts.hours);
    add('cms', 'CMS: collections, roles, drafts, versions', G.cms.hours);
    const lang = pick('lang', 'translation'); add('lang', `EN / GE: ${lang.label}`, lang.hours);
    ['home', 'artists', 'artworks', 'exhibitions', 'programs', 'calls', 'studios', 'tours', 'about', 'utility', 'membership', 'myloco'].forEach((gid) => {
      const g = G[gid];
      const active = new Map(g.pages.map((p) => [p.id, p]));
      const extra = [];
      g.decisions.forEach((d) => {
        const c = d.choices.find((x) => x.id === state[key(g, d)]);
        (c.pages || []).forEach((p) => active.set(p.id, p));
        const rest = c.hours - pageHours(c.pages);
        if (rest > 0) extra.push([c.label, rest]);
      });
      const ph = [...active.values()].reduce((a, p) => a + (p.h || 0), 0);
      add(gid, `${g.name}: ${active.size} ${active.size === 1 ? 'screen' : 'screens'}`, ph);
      extra.forEach(([label, h]) => add(gid, `${g.name}: ${label}`, h));
    });
    const reporting = pick('cms', 'reporting'); add('cms', `CMS: ${reporting.label}`, reporting.hours);
    const motion = pick('design', 'motion'); add('design', `Motion: ${motion.label}`, motion.hours);
    add('delivery', 'QA on real devices, accessibility, performance, SEO, CMS training', G.delivery.hours - KICKOFF);
    return { pk, support: pick('delivery', 'support') };
  }

  function planWeeks(pk, cap) {
    const weeks = [[]]; let used = 0;
    pk.forEach((p) => {
      let rem = p.hours;
      while (rem > 0) {
        if (used >= cap) { weeks.push([]); used = 0; }
        const take = Math.min(rem, cap - used);
        weeks[weeks.length - 1].push({ ...p, hours: take, split: take < p.hours });
        used += take; rem -= take;
      }
    });
    return weeks;
  }

  function planSpan(total) {
    const t = matchingTier();
    if (t) return t.weeks;
    const pts = D.tiers.map((tt) => {
      const st = defaults(tt.id);
      let h = 0;
      D.groups.forEach((g) => { h += g.hours; g.decisions.forEach((d) => { if (d.id !== 'support') h += d.choices.find((c) => c.id === st[key(g, d)]).hours; }); });
      return [h, tt.weeks];
    }).sort((a, b) => a[0] - b[0]);
    if (total <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i += 1) {
      const [h0, w0] = pts[i - 1]; const [h1, w1] = pts[i];
      if (total <= h1) return Math.ceil(w0 + (w1 - w0) * (total - h0) / (h1 - h0));
    }
    const [hl, wl] = pts[pts.length - 1];
    return Math.ceil(wl * total / hl);
  }

  function renderPlan() {
    if (!planRoot) return;
    const sig = JSON.stringify(state);
    if (sig === planSig) return;
    planSig = sig;
    const { pk, support } = planPackages();
    const total = pk.reduce((a, p) => a + p.hours, 0);
    const span = planSpan(total);
    const cap = Math.ceil(total / span);
    const weeks = planWeeks(pk, cap);
    planRoot.innerHTML = '';

    const sec = document.createElement('section');
    sec.className = 'grp plan in';
    sec.id = 'g-plan';
    sec.style.setProperty('--gc', 'var(--yellow)');
    sec.innerHTML = `<p class=kicker>Summary · 2 of 2</p><div class=grp-head><span class=grp-n>W</span><h3>Time, week by week</h3></div>
      <div class=sum-rows>
        <p class=r-row><span>Timeline</span><span><b>${weeks.length} weeks</b></span></p>
        <p class=r-row><span>Pace</span><span>≈ ${cap} h of work per week</span></p>
        <p class=r-row><span>Launch</span><span>end of week ${weeks.length}</span></p>
        <p class=r-row><span>After launch</span><span>${esc(support.label)} support · ${support.hours} h</span></p></div>
      <p class=grp-note>Built from the screens and the options selected above. A tier selection keeps its proposal timeline; change an option and the plan rebuilds.</p>`;

    // calendar map: one cell per week, a colour bar showing which groups the week works on
    const CW = 52; const CH = 56; const GAP = 14; const SUPW = 64;
    const W = weeks.length * (CW + GAP) + SUPW + 4;
    const box = document.createElement('div');
    box.className = 'map';
    const s = svg('svg', { viewBox: `-2 -2 ${W} ${CH + 6}`, width: W, height: CH + 6, role: 'group', 'aria-label': 'Work plan calendar' }, box);
    const gEdges = svg('g', { class: 'edges' }, s);
    const gNodes = svg('g', { class: 'nodes' }, s);
    const cell = (id, x, w, label, title, items, dashed) => {
      const gg = svg('g', { class: 'node week' + (dashed ? ' ghost' : ''), transform: `translate(${x} 0)`, tabindex: 0, role: 'button', 'aria-label': title }, gNodes);
      gg.dataset.id = id;
      svg('title', {}, gg).textContent = title;
      svg('rect', { class: 'pg', width: w, height: CH, rx: 4 }, gg);
      const t = svg('text', { x: 7, y: 17 }, gg); t.textContent = label;
      let bx = 6; const bw = w - 12;
      (items || []).forEach((it) => {
        const seg = Math.max(1.5, (it.hours / cap) * bw);
        svg('rect', { class: 'seg', x: bx, y: CH - 14, width: seg, height: 7, rx: 1.5, style: `fill:var(--${it.color})` }, gg);
        bx += seg;
      });
    };
    weeks.forEach((items, i) => {
      const x = i * (CW + GAP);
      if (i) svg('path', { d: `M${x - GAP + 1} ${CH / 2} L${x - 3} ${CH / 2}`, class: 'edge', 'data-e': `w${i}>w${i + 1}` }, gEdges);
      const hours = items.reduce((a, it) => a + it.hours, 0);
      cell(`w${i + 1}`, x, CW, `W${i + 1}`, `Week ${i + 1} · ${hours} h`, items, false);
    });
    const sx = weeks.length * (CW + GAP);
    svg('path', { d: `M${sx - GAP + 1} ${CH / 2} L${sx - 3} ${CH / 2}`, class: 'edge ext' }, gEdges);
    cell('sup', sx, SUPW, `+${support.label.replace(' days', 'd')}`, `After launch: ${support.label} support`, null, true);
    sec.appendChild(box);

    // week cards
    const wrapEl = document.createElement('div'); wrapEl.className = 'slider';
    const track = document.createElement('div');
    track.className = 'track'; track.tabIndex = 0;
    track.setAttribute('role', 'region'); track.setAttribute('aria-label', 'Weeks of the work plan, swipe sideways');
    const strip = document.createElement('div'); strip.className = 'strip'; track.appendChild(strip);
    const n = weeks.length + 1;
    weeks.forEach((items, i) => {
      const hours = items.reduce((a, it) => a + it.hours, 0);
      const last = i === weeks.length - 1;
      const groupsIn = [...new Set(items.map((it) => D.groups.find((g) => g.id === it.gid).name))];
      const sl = document.createElement('article');
      sl.className = 'slide week-card';
      sl.dataset.id = `w${i + 1}`;
      sl.innerHTML = `<div class=s-head><p class=s-top><span class=s-kind>Week</span><span class=s-id>W${i + 1}</span><span class=s-n>${i + 1} / ${n}</span><span class=s-h>${hours} h</span></p>
        <h4>${last ? 'Final QA and launch' : esc(groupsIn.slice(0, 2).join(' · ') + (groupsIn.length > 2 ? ' +' + (groupsIn.length - 2) : ''))}</h4></div>
        <ul class=plan-items>${items.map((it) => `<li style="--ic:var(--${it.color})"><span class=pi-l>${esc(it.label)}${it.split ? ' <em>(part)</em>' : ''}</span><span class=pi-h>${it.hours} h</span></li>`).join('')}</ul>
        <div class=plan-bar aria-hidden=true>${items.map((it) => `<i style="flex:${it.hours};background:var(--${it.color})"></i>`).join('')}${hours < cap ? `<i class=free style="flex:${cap - hours}"></i>` : ''}</div>`;
      strip.appendChild(sl);
    });
    const sup = document.createElement('article');
    sup.className = 'slide week-card';
    sup.dataset.id = 'sup';
    sup.innerHTML = `<div class=s-head><p class=s-top><span class=s-kind>After launch</span><span class=s-n>${n} / ${n}</span><span class=s-h>${support.hours} h</span></p>
      <h4>${esc(support.label)} support</h4></div>
      <ul class=plan-items><li style="--ic:var(--lime)"><span class=pi-l>Fixes, small changes and questions from the LOCO team</span><span class=pi-h>${support.hours} h</span></li></ul>`;
    strip.appendChild(sup);
    const arrow = (d) => `<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="${d}"/></svg>`;
    const prev = Object.assign(document.createElement('button'), { type: 'button', className: 'nav prev', innerHTML: arrow('M7 1 L2 5 L7 9 Z') });
    const next = Object.assign(document.createElement('button'), { type: 'button', className: 'nav next', innerHTML: arrow('M3 1 L8 5 L3 9 Z') });
    prev.setAttribute('aria-label', 'Previous week'); next.setAttribute('aria-label', 'Next week');
    wrapEl.append(track, prev, next);
    sec.appendChild(wrapEl);
    planRoot.appendChild(sec);
    const ids = [...weeks.map((_, i) => `w${i + 1}`), 'sup'];
    wire({ sec, track, strip, prev, next, wrapEl, screens: ids.map((id) => ({ id })) });
  }

  // ---------- running tally of hours and services ----------
  // Every group shows its hours and services on the line at its bottom. When the bar at the bottom of
  // the screen reaches that line the group is added; scroll back above it and it is taken off again.
  const out = { hours: document.getElementById('c-hours'), monthly: document.getElementById('c-monthly') };
  const servicesEl = document.getElementById('services');
  const reportEl = document.getElementById('report');
  const switches = [...document.querySelectorAll('[data-tier]')];
  const pageHours = (pages) => (pages || []).reduce((a, p) => a + (p.h || 0), 0);
  const range = (a, b) => (a === b ? money(a) : `${money(a)}–${money(b)}`);
  const svcRange = (set) => { let lo = 0; let hi = 0; set.forEach((x) => { lo += D.services[x].min; hi += D.services[x].max; }); return [lo, hi]; };

  // numbers in the bar change with a vertical slide: up when growing, down when shrinking
  const lastVal = new Map();
  function roll(el, text, num) {
    const prev = lastVal.get(el);
    if (prev && prev.text === text) return;
    lastVal.set(el, { text, num });
    if (!prev || reduce) { el.textContent = text; return; }
    const dir = num >= prev.num ? 1 : -1;
    el.querySelectorAll('.roll-out').forEach((x) => x.remove());
    const old = el.querySelector('.roll-in') || Object.assign(document.createElement('span'), { textContent: el.textContent });
    if (!old.parentNode) { el.textContent = ''; el.appendChild(old); }
    old.className = 'roll-out';
    old.style.setProperty('--d', dir);
    const nw = Object.assign(document.createElement('span'), { className: 'roll-in', textContent: text });
    nw.style.setProperty('--d', dir);
    el.appendChild(nw);
    setTimeout(() => old.remove(), 400);
  }

  // what one group costs with the options chosen now
  function groupTotal(g) {
    let h = g.hours;
    const active = new Map(g.pages.map((p) => [p.id, p]));
    const svc = new Set(g.services || []);
    const choices = g.decisions.map((d) => {
      const c = d.choices.find((x) => x.id === state[key(g, d)]);
      h += c.hours;
      (c.pages || []).forEach((p) => active.set(p.id, p));
      (c.services || []).forEach((x) => svc.add(x));
      return { d, c };
    });
    return { h, screens: active.size, active, svc, choices };
  }

  function renderReport(all) {
    if (!reportEl) return;
    let hours = 0; let screens = 0;
    const svc = new Set();
    const rows = all.map(({ g, t }, i) => {
      hours += t.h; screens += t.screens; t.svc.forEach((x) => svc.add(x));
      return `<tr style="--gc:var(--${g.color})"><td class=rn>${String(i + 1).padStart(2, '0')}</td><td>${esc(g.name)}</td>
        <td class=rs>${t.screens || '—'}</td><td class=rh>${t.h} h</td><td class=rd>${money(t.h * D.rate)}</td></tr>`;
    }).join('');
    const [lo, hi] = svcRange(svc);
    const dev = hours * D.rate;
    const svcRows = [...svc].map((x) => { const v = D.services[x]; return `<p class=r-row><span>${esc(v.name)}</span><span>${range(v.min, v.max)} / mo</span></p>`; }).join('');
    reportEl.innerHTML = `<div class=wrap>
      <p class=kicker>Summary · 1 of 2</p>
      <h2 class=rep-h>Cost</h2>
      <div class=rep-big>
        <div><p class=rb-l>Design, development and support</p><p class=rb-v>${money(dev)}</p><p class=rb-s>${hours} h × ${money(D.rate)} · ${screens} screens</p></div>
        <div><p class=rb-l>Services</p><p class=rb-v>${range(lo, hi)}<small> / mo</small></p><p class=rb-s>${range(lo * 12, hi * 12)} for the first year</p></div>
        <div class=rb-tot><p class=rb-l>Total for the first year</p><p class=rb-v>${range(dev + lo * 12, dev + hi * 12)}</p><p class=rb-s>work plus twelve months of services</p></div>
      </div>
      <div class=rep-cols>
        <div><p class=r-h>By group</p><table class=rep-t><thead><tr><th></th><th>Group</th><th class=rs>Screens</th><th class=rh>Hours</th><th class=rd>Cost</th></tr></thead>
          <tbody>${rows}</tbody><tfoot><tr><td></td><td>Total</td><td class=rs>${screens}</td><td class=rh>${hours} h</td><td class=rd>${money(dev)}</td></tr></tfoot></table></div>
        <div><p class=r-h>Services, per month</p>${svcRows || '<p class=r-row><span>No paid services</span><span>—</span></p>'}
          <p class="r-row r-tot"><span>Total</span><span>${range(lo, hi)} / mo</span></p></div>
      </div></div>`;
  }

  let reportSig = '';
  function update() {
    let hours = 0;
    const svc = new Set();
    const all = groups.map(({ g, api }) => {
      const t = groupTotal(g);
      t.choices.forEach(({ d, c }) => { document.getElementById(`c-${g.id}-${d.id}-${c.id}`).checked = true; });
      if (api) {
        api.sec.querySelectorAll('.node.xopt, .slide.xopt').forEach((el) => el.classList.toggle('off', !t.active.has(el.dataset.id)));
        api.sec.querySelectorAll('.edge').forEach((e) => {
          const keys = (e.dataset.e || '').split(' ').filter(Boolean);
          const optOff = keys.length > 0 && keys.every((k) => k.split('>').some((id) => allPages[id] && pageGroup[id] === g.id && !t.active.has(id)));
          e.classList.toggle('off', optOff);
        });
      }
      const sec = document.getElementById('g-' + g.id);
      const [slo, shi] = svcRange(t.svc);
      sec.querySelector('.gf-s').textContent = t.screens ? `${t.screens} ${t.screens === 1 ? 'screen' : 'screens'}` : 'No screens of its own';
      sec.querySelector('.gf-h').textContent = `+${t.h} h`;
      sec.querySelector('.gf-m').textContent = t.svc.size ? `+${range(slo, shi)} / mo services` : '+$0 services';
      sec.querySelector('.grp-foot').classList.toggle('on', !!passed[g.id]);
      if (passed[g.id]) { hours += t.h; t.svc.forEach((x) => svc.add(x)); }
      return { g, t };
    });
    const [lo, hi] = svcRange(svc);
    roll(out.hours, String(hours), hours);
    roll(out.monthly, svc.size ? `${range(lo, hi)} / mo` : '—', lo);
    if (servicesEl) {
      const rows = [...svc].map((x) => { const v = D.services[x]; return `<li><span>${esc(v.name)}</span><span>${range(v.min, v.max)}</span></li>`; });
      servicesEl.innerHTML = (rows.join('') || '<li><span>Nothing counted yet: scroll down through the groups</span></li>')
        + (svc.size ? `<li class=tot><span>Total</span><span>${range(lo, hi)} / month</span></li>` : '');
    }
    const sig = JSON.stringify(state);
    if (sig !== reportSig) { reportSig = sig; renderReport(all); }
    const t = matchingTier();
    switches.forEach((b) => b.setAttribute('aria-pressed', String(!!t && b.dataset.tier === t.id)));
    renderPlan();
  }
  function setTier(tid) { Object.assign(state, defaults(tid)); update(); }

  // a group counts once the top of the bar reaches the line at the bottom of that group
  const passed = {};
  const calcBar = document.querySelector('.calc');
  const barTop = () => (calcBar ? calcBar.getBoundingClientRect().top : window.innerHeight);
  function measure() {
    let changed = false;
    const line = barTop();
    groups.forEach(({ g }) => {
      const r = document.getElementById('g-' + g.id).querySelector('.grp-foot').getBoundingClientRect();
      const pa = r.bottom <= line;
      if (pa !== !!passed[g.id]) { passed[g.id] = pa; changed = true; }
    });
    // the summary page takes over from the bar: the bar slides away once the summary reaches it
    if (calcBar && reportEl) calcBar.classList.toggle('docked', reportEl.getBoundingClientRect().top < window.innerHeight - 40);
    return changed;
  }
  let vraf = 0;
  const onMove = () => { cancelAnimationFrame(vraf); vraf = requestAnimationFrame(() => { if (measure()) update(); }); };
  window.addEventListener('scroll', onMove, { passive: true });
  window.addEventListener('resize', onMove);

  root.addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;
    state[e.target.name] = e.target.value;
    update();
    measure();
  });
  switches.forEach((b) => b.addEventListener('click', () => setTier(b.dataset.tier)));
  D.groups.forEach((g) => g.decisions.forEach((d) => { state[key(g, d)] = d.choices[0].id; }));
  update();
  measure();
  update();

  // ---------- jump arrows top-right: section to section, or straight to the top / bottom ----------
  const jumpTargets = () => [document.getElementById('top'), document.getElementById('builder'),
    ...document.querySelectorAll('#groups > .grp, #report, #g-plan, .services-box, details.prop, #team')].filter(Boolean);
  const scrollToEl = (el) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 12, behavior: reduce ? 'auto' : 'smooth' });
  document.querySelectorAll('[data-jump]').forEach((btn) => btn.addEventListener('click', () => {
    const k = btn.dataset.jump;
    if (k === 'top') { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
    if (k === 'bottom') { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }); return; }
    const list = jumpTargets();
    if (k === 'next') { const el = list.find((x) => x.getBoundingClientRect().top > 20); if (el) scrollToEl(el); else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }); }
    if (k === 'prev') { const el = [...list].reverse().find((x) => x.getBoundingClientRect().top < -20); if (el) scrollToEl(el); else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
  }));
})();
