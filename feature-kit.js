// Feature presentations behind "Customize": what a feature is, how it works, then the setup as step cards.
// Each feature (pvf-scan.js, spaces.js) describes its content; this kit builds the window, the step cards
// (a pick slides to the next step), the top bar with hours / screens / services, and wires the choices to
// the builder's state (window.LOCO_BUILDER), so every pick changes the totals on the page.
(() => {
  const B = window.LOCO_BUILDER;
  if (!B) return;
  const { D, state, key, esc, tierDots, isOff } = B;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.LOCO_FEATURES = window.LOCO_FEATURES || [];

  // an option as a card: name, equal cells for hours / screens / services, a short note, tiers
  const SLOT_LABELS = { hours: 'Hours', screens: 'Screens', services: 'Services' };
  const slotsOf = (c) => {
    const n = (c.pages || []).length; const k = (c.services || []).length;
    return { hours: `${c.hours} h`, screens: n ? `+${n}` : '—', services: k ? `+${k}` : '—' };
  };
  const metrics = (c) => {
    const v = slotsOf(c);
    return Object.keys(SLOT_LABELS).map((k) => `<span class="fo-m${v[k] === '—' ? ' none' : ''}"><span class=fo-ml>${SLOT_LABELS[k]}</span><b>${v[k]}</b></span>`).join('');
  };
  // the same decision can sit in several presentations (the shared scan setup): ids carry the feature
  const fieldset = (g, d, offText, fid) => `<fieldset class="dec fs-dec" data-dec="${g.id}.${d.id}"><legend>${esc(d.label)}</legend>
    ${d.dependsOn || d.dependsOnAny ? `<p class=fs-off>${esc(offText || 'Pick a level in the step before to set this.')}</p>` : ''}
    <div class=fo-grid>${d.choices.map((c) => {
      const id = `${fid}-${g.id}-${d.id}-${c.id}`;
      return `<label class=fo for="${id}"><input type=radio name="${key(g, d)}" id="${id}" value="${c.id}">
        <span class=fo-l>${esc(c.label)}</span>
        <span class=fo-ms style="--cols:3">${metrics(c)}</span>
        ${c.note ? `<span class=fo-n>${esc(c.note)}</span>` : ''}
        <span class=tds>${tierDots(c.tiers)}</span></label>`;
    }).join('')}</div></fieldset>`;
  // tutorial icons: one generated sheet cut into assets/pvf-scan/icon-01..15.png (see design/pvf-scan-prompts.md)
  const icon = (k) => `<img class=fs-ic src="assets/pvf-scan/icon-${String(k).padStart(2, '0')}.png" alt="" width=160 height=100 loading=lazy decoding=async>`;
  const step = (n, ic, h, p) => `<li class=fs-step><span class=fs-sn>${n}</span>${icon(ic)}<h4>${h}</h4><p>${p}</p></li>`;
  const format = (tag, title, desc, steps) => `<div class=fs-fmt>
      <div class=fs-fmt-h><p class=fs-tag>${tag}</p><h4>${title}</h4><p>${desc}</p></div>
      <ol class="fs-steps${steps.length === 3 ? ' fs-steps-3' : ''}">${steps.join('')}</ol></div>`;

  function makeFeature(cfg) {
    const decs = cfg.decisions; // [{ g, d }]
    const el = document.createElement('div');
    el.className = 'feat';
    el.id = `feat-${cfg.id}`;
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', `fs-h-${cfg.id}`);
    el.style.setProperty('--gc', `var(--${cfg.color})`);
    const cardHtml = (s, i) => `<article class=fc-card data-i=${i} data-step="${esc(s.step)}"${s.dec ? ` data-dec="${s.dec.g.id}.${s.dec.d.id}"` : ''}>
      <p class=fc-k>${esc(s.step)}</p><h4 class=fc-h>${s.title}</h4>${s.desc ? `<p class=fc-d>${s.desc}</p>` : ''}
      ${s.offText ? `<p class=fc-off>${esc(s.offText)}</p>` : ''}
      <div class=fc-b>${s.dec ? fieldset(s.dec.g, s.dec.d, s.offText, cfg.id) : ''}${s.body || ''}</div></article>`;
    const steps = [...cfg.steps, { step: 'Total', title: 'Your choice', body: `<div class=fs-total></div><button type=button class=cta data-close>Done, back to the screens</button>` }];
    el.innerHTML = `
    <div class=feat-bar>
      <div class=fb-tally>
        <span class=c-cell><span class=c-l>Hours</span><span class=c-v data-f=h></span></span>
        <span class=c-cell><span class=c-l>Screens</span><span class=c-v data-f=s></span></span>
        <span class=c-cell><span class=c-l>Services</span><span class=c-v data-f=m></span></span>
      </div>
      <button type=button class=feat-x data-close aria-label="Close and go back to the screens">×</button>
    </div>
    <div class=feat-in>
      ${cfg.intro(`fs-h-${cfg.id}`)}
      <section class=fs-sec>
        <h3>Set it up</h3>
        <p class=fs-lead>${steps.length} short steps. Pick an option and the next step slides in; swipe or use the numbers to go back.</p>
        <div class=fc>
          <div class=fc-steps role=tablist aria-label="Steps"></div>
          <div class=fc-track><div class=fc-strip>${steps.map(cardHtml).join('')}</div></div>
        </div>
      </section>
    </div>`;
    document.body.appendChild(el);

    // ---------- step cards ----------
    const track = el.querySelector('.fc-track');
    const strip = el.querySelector('.fc-strip');
    const cards = [...el.querySelectorAll('.fc-card')];
    const stepsNav = el.querySelector('.fc-steps');
    stepsNav.innerHTML = cards.map((c, i) => `<button type=button role=tab data-go=${i} aria-label="Step ${i + 1}: ${c.dataset.step}"><span class=st-n>${i + 1}</span><span class=st-l><span>${c.dataset.step}</span></span></button>`).join('');
    let cur = 0;
    function go(i, animate = true) {
      cur = Math.max(0, Math.min(cards.length - 1, i));
      const c = cards[cur];
      const x = track.clientWidth / 2 - (c.offsetLeft + c.offsetWidth / 2);
      strip.style.transition = animate && !reduce ? 'transform .45s cubic-bezier(.2, .75, .2, 1)' : 'none';
      strip.style.transform = `translate3d(${x}px, 0, 0)`;
      track.style.height = `${c.offsetHeight}px`;
      cards.forEach((k, j) => { k.classList.toggle('cur', j === cur); k.inert = j !== cur; });
      stepsNav.querySelectorAll('[data-go]').forEach((b, j) => b.setAttribute('aria-selected', String(j === cur)));
    }
    // bring the step's title and options up under the top bar
    function showStep() {
      const bar = el.querySelector('.feat-bar').getBoundingClientRect().bottom;
      const top = stepsNav.getBoundingClientRect().top - bar - 12;
      if (Math.abs(top) > 4) el.scrollBy({ top, behavior: reduce ? 'auto' : 'smooth' });
      const h = cards[cur].querySelector('.fc-h');
      h.tabIndex = -1; h.focus({ preventScroll: true });
    }
    stepsNav.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { go(Number(b.dataset.go)); showStep(); } });
    // after a pick: the next step that applies (steps that depend on a base option are skipped)
    const nextAfter = (i) => { let j = i + 1; while (j < cards.length - 1 && cards[j].classList.contains('na')) j += 1; return j; };
    el.addEventListener('click', (e) => {
      const o = e.target.closest('.fc-card.cur .fo');
      if (!o || e.detail === 0) return;
      const i = cur;
      setTimeout(() => { if (cur === i) { go(nextAfter(i)); showStep(); } }, 380);
    });
    let drag = null; let moved = false;
    track.addEventListener('pointerdown', (e) => { drag = e.target.closest('input[type=range]') ? null : { x: e.clientX, y: e.clientY }; moved = false; }, true);
    track.addEventListener('pointerup', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x; const dy = e.clientY - drag.y; drag = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { moved = true; go(cur + (dx < 0 ? 1 : -1)); }
    }, true);
    track.addEventListener('pointerup', (e) => { const k = e.target.closest('.fc-card'); if (k && !k.classList.contains('cur') && !moved) go(cards.indexOf(k)); });
    track.addEventListener('pointercancel', () => { drag = null; });
    window.addEventListener('resize', () => { if (!el.hidden) go(cur, false); });

    // ---------- choices ----------
    // the first decision opens with nothing picked: the visitor chooses (the totals keep the default until then)
    const first = decs[0];
    let firstPicked = false;
    el.addEventListener('change', (e) => {
      if (cfg.onChange && cfg.onChange(e)) { B.refresh(); return; }
      if (e.target.name === key(first.g, first.d)) firstPicked = true;
      B.onPick(e);
    });
    const ctx = { el, decs, sel: (g, d) => d.choices.find((c) => c.id === state[key(g, d)]) };

    function refresh() {
      el.querySelectorAll('.fs-dec').forEach((fs) => {
        const [gid, did] = fs.dataset.dec.split('.');
        const g = D.groups.find((x) => x.id === gid); const d = g.decisions.find((x) => x.id === did);
        fs.disabled = isOff(g, d);
        fs.querySelectorAll('input').forEach((r) => { r.checked = state[r.name] === r.value; });
      });
      if (!firstPicked && state[key(first.g, first.d)] === first.d.choices[0].id) el.querySelectorAll(`[data-dec="${first.g.id}.${first.d.id}"] input`).forEach((r) => { r.checked = false; });
      let h = 0; const svc = new Set(); const pages = new Set(); let once = 0;
      decs.forEach(({ g, d }) => {
        if (isOff(g, d)) return;
        const c = ctx.sel(g, d);
        h += c.hours; (c.services || []).forEach((x) => svc.add(x)); (c.pages || []).forEach((p) => pages.add(p.id));
        if (c.oneTime) once += 1;
      });
      Object.assign(ctx, { h, svc, pages, once });
      el.querySelector('[data-f=h]').textContent = `+${h} h`;
      el.querySelector('[data-f=s]').textContent = pages.size ? `+${pages.size}` : '—';
      el.querySelector('[data-f=m]').textContent = svc.size ? `+${svc.size}` : '—';
      cards.forEach((k, i) => {
        const s = steps[i];
        k.classList.toggle('na', s.na ? s.na(ctx) : !!(s.dec && isOff(s.dec.g, s.dec.d)));
      });
      if (cfg.refresh) cfg.refresh(ctx);
      el.querySelector('.fs-total').innerHTML = `<p class=kicker>Your choice</p><h3>${esc(cfg.totalTitle(ctx))}</h3>
        <div class=fs-tot-row>
          <span class=c-cell><span class=c-l>Hours</span><span class=rt-v>+${h} h</span></span>
          <span class=c-cell><span class=c-l>Screens</span><span class=rt-v>${pages.size ? `+${pages.size}` : '—'}</span></span>
          <span class=c-cell><span class=c-l>Services</span><span class=rt-v>${svc.size ? `+${svc.size}` : '—'}</span></span>
        </div>${once ? '<p class=fs-note>Plus equipment for the residence, bought separately: see the summary.</p>' : ''}
        <p class=fs-note>Prices for all of this are in the summary at the end of the page.</p>`;
      if (!el.hidden) requestAnimationFrame(() => { track.style.height = `${cards[cur].offsetHeight}px`; });
    }

    // ---------- open / close ----------
    let opener = null;
    function open(btn) {
      opener = btn;
      if (cfg.onOpen) cfg.onOpen(ctx);
      el.hidden = false;
      document.documentElement.classList.add('feat-open');
      el.scrollTop = 0;
      requestAnimationFrame(() => el.classList.add('in'));
      el.querySelector('.feat-x').focus({ preventScroll: true });
      refresh();
      // opened from a group: start at that group's first step
      const at = btn && btn.dataset.open ? cards.findIndex((k) => k.dataset.dec === btn.dataset.open) : 0;
      requestAnimationFrame(() => { go(Math.max(0, at), false); if (at > 0) showStep(); });
    }
    function close() {
      el.classList.remove('in');
      document.documentElement.classList.remove('feat-open');
      const done = () => { el.hidden = true; if (opener) opener.focus({ preventScroll: true }); };
      if (reduce) done(); else setTimeout(done, 250);
    }
    document.addEventListener('click', (e) => {
      const b = e.target.closest(`[data-feature="${cfg.id}"]`);
      if (b && !el.contains(b)) { open(b); return; }
      if (e.target.closest('[data-close]') && el.contains(e.target)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (el.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // keep focus inside the presentation
        const f = [...el.querySelectorAll('button, input:not(:disabled), [href]')].filter((x) => x.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    if (cfg.bind) cfg.bind(ctx);
    const api = { id: cfg.id, refresh, open: () => open(null), el };
    window.LOCO_FEATURES.push(api);
    return api;
  }

  const delivery = D.groups.find((x) => x.id === 'delivery');
  const shared = (id) => ({ g: delivery, d: delivery.decisions.find((x) => x.id === id) });
  const flows = () => {
    const SC = D.scan;
    return `<div class=flows>
      <div class=flow data-flow=cloud>${icon(14)}<p class=fl-h>Cloud</p>
        <ol><li>Team or members upload</li><li>Cloud<small>sources · processing · results</small></li><li>Site and members</li></ol></div>
      <div class=flow data-flow=hybrid>${icon(15)}<p class=fl-h>Hybrid</p>
        <ol><li>Upload<small>residence Wi-Fi, or the My LOCO inbox</small></li><li>Residence: NAS ${SC.nasTb} TB + PC<small>sources · processing</small></li><li>Cloud<small>results only, through a CDN</small></li><li>Site and members</li></ol></div>
    </div>
    <p class=fs-note>One setup for every scan: works, the park, halls and studios. Change it here and it changes in the other presentations too. The residence server never serves the site itself: visitors load the scans from the cloud.</p>`;
  };
  const sharedSteps = (off) => [
    { step: 'Who', title: 'Who scans', desc: 'We train one or two people from the LOCO team. Or open it to the community too: members scan their own works and upload them from My LOCO. The same for every kind of scan.', dec: shared('who'), offText: off },
    { step: 'Processing', title: 'Processing and storage', desc: 'For every scan: everything in the cloud, or sources and processing on a PC and NAS in the residence with only the results in the cloud.', dec: shared('proc'), body: flows(), offText: off },
  ];
  // the flows show the processing that is chosen
  const showFlows = (el) => {
    const p = shared('proc');
    const on = !isOff(p.g, p.d);
    el.querySelectorAll('[data-flow]').forEach((f) => f.classList.toggle('on', on && f.dataset.flow === state[key(p.g, p.d)]));
    return on && state[key(p.g, p.d)] === 'hybrid';
  };

  window.LOCO_FEATURE_KIT = { makeFeature, fieldset, icon, step, format, shared, sharedSteps, showFlows };
})();
