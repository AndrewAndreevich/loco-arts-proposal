// PVF Scan: the feature presentation behind "Customize" on the artwork screens.
// What it is (photo vs scan), why it matters, how to shoot, the level, processing and storage, the price.
// It uses the builder's state and tally (window.LOCO_BUILDER), so every choice here changes the totals.
(() => {
  const B = window.LOCO_BUILDER;
  if (!B) return;
  const { D, state, scanCfg, key, money, esc, tierDots, optSvc, sv, range, perWork, equipment, nasUsd, isOff } = B;
  const SC = D.scan;
  const g = D.groups.find((x) => x.id === 'artworks');
  const decs = g.decisions.filter((d) => d.feature === 'scan');
  const dec = (id) => decs.find((d) => d.id === id);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // an option as a card: name, one line of totals (hours, screens, services, one-time), a short note, tiers
  // every option of a decision shows the same slots in the same grid, so the cells line up across cards
  const slotsOf = (c) => {
    const fixed = (c.services || []).filter((x) => x !== 'scanproc');
    let lo = 0; let hi = 0; fixed.forEach((x) => { lo += D.services[x].min; hi += D.services[x].max; });
    const n = (c.pages || []).length;
    return {
      hours: `${c.hours} h`,
      screens: n ? `+${n}` : '—',
      monthly: fixed.length ? range(lo, hi) : '—',
      work: (c.services || []).includes('scanproc') ? `$${SC.hoursPerWork * SC.night + SC.handling}–${SC.hoursPerWork * SC.instant + SC.handling}` : '—',
      once: c.oneTime ? money(equipment()) : '—',
    };
  };
  const SLOT_LABELS = { hours: 'Hours', screens: 'Screens', monthly: 'Monthly', work: 'Per work', once: 'One-time' };
  const slotKeys = (d) => Object.keys(SLOT_LABELS).filter((k) => k === 'hours' || d.choices.some((c) => slotsOf(c)[k] !== '—'));
  const metrics = (d, c) => {
    const v = slotsOf(c);
    return slotKeys(d).map((k) => `<span class="fo-m${v[k] === '—' ? ' none' : ''}"><span class=fo-ml>${SLOT_LABELS[k]}</span><b>${v[k]}</b></span>`).join('');
  };
  const fieldset = (d) => `<fieldset class="dec fs-dec" data-dec="${d.id}"><legend>${esc(d.label)}</legend>
    ${d.dependsOn ? '<p class=fs-off>Pick a PVF Scan level above to set this.</p>' : ''}
    <div class=fo-grid>${d.choices.map((c) => {
      const id = `c-${g.id}-${d.id}-${c.id}`;
      return `<label class=fo for="${id}"><input type=radio name="${key(g, d)}" id="${id}" value="${c.id}">
        <span class=fo-l>${esc(c.label)}</span>
        <span class=fo-ms style="--cols:${slotKeys(d).length === 4 ? 2 : Math.min(slotKeys(d).length, 3)}">${metrics(d, c)}</span>
        ${c.note ? `<span class=fo-n>${esc(c.note)}</span>` : ''}
        <span class=tds>${tierDots(c.tiers)}</span></label>`;
    }).join('')}</div></fieldset>`;

  // tutorial icons: one generated sheet cut into assets/pvf-scan/icon-01..15.png (see design/pvf-scan-prompts.md)
  const icon = (k) => `<img class=fs-ic src="assets/pvf-scan/icon-${String(k).padStart(2, '0')}.png" alt="" width=160 height=100 loading=lazy decoding=async>`;
  const step = (n, ic, h, p) => `<li class=fs-step><span class=fs-sn>${n}</span>${icon(ic)}<h4>${h}</h4><p>${p}</p></li>`;
  const card = (step, title, desc, body, scanOnly) => `<article class=fc-card data-step="${step}"${scanOnly ? ' data-scan' : ''}>
    <p class=fc-k>${step}</p><h4 class=fc-h>${title}</h4>${desc ? `<p class=fc-d>${desc}</p>` : ''}
    ${scanOnly && step !== 'Level' ? '<p class=fc-off>Not needed with the gallery: pick a PVF Scan level in the first step.</p>' : ''}
    <div class=fc-b>${body}</div></article>`;
  const perNight = SC.hoursPerWork * SC.night + SC.handling;
  const perInstant = SC.hoursPerWork * SC.instant + SC.handling;

  const el = document.createElement('div');
  el.className = 'feat';
  el.id = 'feat-scan';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'fs-h');
  el.style.setProperty('--gc', `var(--${g.color})`);
  el.innerHTML = `
  <div class=feat-bar>
    <p class=fb-t>Customize · Artworks</p>
    <div class=fb-tally>
      <span class=c-cell><span class=c-l>Integration</span><span class=c-v data-f=h></span></span>
      <span class=c-cell><span class=c-l>Monthly</span><span class=c-v data-f=m></span></span>
      <span class=c-cell><span class=c-l>One-time</span><span class=c-v data-f=o></span></span>
    </div>
    <button type=button class=feat-x data-close aria-label="Close and go back to the screens">×</button>
  </div>
  <div class=feat-in>
    <section class=fs-sec>
      <p class=kicker>PVF Scan</p>
      <h2 id=fs-h>From a phone photo to a museum-grade scan</h2>
      <p class=big>The same camera LOCO already uses, 10–20 close-up frames instead of one, and our pipeline turns them into one flat image of the work in super resolution, with no perspective and no lens distortion. It appears on the site on its own, ready to zoom into down to the brushstroke.</p>
      <div class=cmp2>
        <figure class=c2-photo>
          <img data-lo alt="The work photographed with an ordinary camera: on the wall, at an angle, in its frame" width=1024 height=1024>
          <figcaption><b>Camera photo</b>At an angle, in its frame, lit from the ceiling: the usual catalogue picture.</figcaption>
        </figure>
        <figure class=c2-scan>
          <img data-hi alt="The same work as a PVF Scan: flat, square, edge to edge" width=2560 height=1920>
          <figcaption><b>PVF Scan · Flat</b>Square, edge to edge, no distortion, true colours, in super resolution.</figcaption>
        </figure>
        <figure class=c2-lp><div class="lp lp-lo"></div><figcaption>Camera photo, zoomed in</figcaption></figure>
        <figure class=c2-lp><div class="lp lp-hi"></div><figcaption>PVF Scan, the same spot</figcaption></figure>
      </div>
    </section>

    <section class=fs-sec>
      <h3>Why it matters</h3>
      <ul class=fs-why>
        <li><h4>Super resolution</h4><p>One frame holds a few megapixels of the work. Ten to twenty close-up frames, stitched, hold hundreds: zoom into the brushstroke and the weave of the canvas.</p></li>
        <li><h4>Flat and true</h4><p>Orthographic projection: no perspective, no lens distortion, square corners. The work looks exactly as it hangs on the wall.</p></li>
        <li><h4>Real size</h4><p>The scan knows the size of the work in centimetres: a scale bar and a "view at real size" button on the artwork page.</p></li>
        <li><h4>Ready everywhere</h4><p>Deep-zoom tiles, catalogue previews and card images are made automatically. Nobody crops or retouches by hand.</p></li>
        <li><h4>Sculpture in 3D</h4><p>Objects are scanned all around: a 3D view on the artwork page and renders for the cards, from one set of photos.</p></li>
        <li><h4>Progress over time</h4><p>Scan the same work again at each stage, and the artwork page shows how it changed on a timeline.</p></li>
      </ul>
    </section>

    <section class=fs-sec>
      <h3>How it works</h3>
      <div class=fs-fmt>
        <div class=fs-fmt-h><p class=fs-tag>2D</p><h4>Flat works</h4><p>Paintings, graphics, photographs, textile: one flat, distortion-free image in super resolution.</p></div>
        <ol class=fs-steps>
          ${step(1, 1, 'Light it evenly', 'Two lights at 45° to the work, no direct sun. Put the colour card next to the work in the first frame.')}
          ${step(2, 2, 'Shoot close, in a grid', 'Camera parallel to the work, 10–20 frames in rows with about 60% overlap, every frame in focus. The camera you already have.')}
          ${step(3, 3, 'Upload', 'In the residence: over Wi-Fi straight to the scan server. From home: in My LOCO, into the inbox.')}
          ${step(4, 4, 'Processing', `Up to about ${SC.hoursPerWork} hour of computer time per work. The night queue (${esc(SC.nightWindow)}) costs less; instant costs more.`)}
          ${step(5, 5, 'On the site', 'Deep zoom on the artwork page, real size in centimetres, previews for cards and the catalogue.')}
        </ol>
      </div>
      <div class=fs-fmt>
        <div class=fs-fmt-h><p class=fs-tag>3D</p><h4>Sculpture and objects</h4><p>Anything with volume: a 3D scan you can turn around, and renders made from it.</p></div>
        <ol class=fs-steps>
          ${step(1, 6, 'Soft light all around', 'No hard shadows. Put the object on a turntable or walk around it.')}
          ${step(2, 7, 'Shoot in rings', '60–100 frames in 2–3 rings at different heights, each frame overlapping the next.')}
          ${step(3, 8, 'Upload', 'The same way as flat works: Wi-Fi in the residence or My LOCO from home.')}
          ${step(4, 9, 'Processing', 'The photos become a 3D scene (Gaussian Splatting); renders are made from it automatically: a turntable and hero angles.')}
          ${step(5, 10, 'On the site', 'A 3D view on the artwork page; the renders go to cards and the catalogue.')}
        </ol>
      </div>
      <div class=fs-fmt>
        <div class=fs-fmt-h><p class=fs-tag>2D + 3D</p><h4>Progress over time</h4><p>For both formats: the same work scanned at every stage.</p></div>
        <ol class="fs-steps fs-steps-3">
          ${step(1, 11, 'Scan again', 'At each stage, scan the same work with the same setup.')}
          ${step(2, 12, 'Aligned for you', 'Each new scan is matched to the previous one automatically, so the work does not jump between stages.')}
          ${step(3, 13, 'Timeline', 'A slider on the artwork page shows how the work changed, with the date of every stage.')}
        </ol>
      </div>
    </section>

    <section class=fs-sec>
      <h3>Set it up</h3>
      <p class=fs-lead>Six short steps. Pick an option and the next step slides in; swipe or use the steps to go back.</p>
      <div class=fc>
        <div class=fc-steps role=tablist aria-label="Steps"></div>
        <div class=fc-track>
          <div class=fc-strip>
            ${card('Level', 'How works look on the site', 'Gallery is what LOCO has today: photos as they are. PVF Scan adds a flat super-resolution image with deep zoom; Flat + Object adds 3D scans of sculpture and objects.', fieldset(dec('scan')), true)}
            ${card('Progress', 'Progress of a work over time', 'Each new scan of the same work becomes a stage on a timeline on the artwork page. Works for flat works and objects.', fieldset(dec('progress')), true)}
            ${card('Who', 'Who scans', 'We train one or two people from the LOCO team. Or open it to the community too: members scan their own works and upload them from My LOCO.', fieldset(dec('who')), true)}
            ${card('Processing', 'Processing and storage', 'Everything in the cloud, or sources and processing on a PC and NAS in the residence with only the results in the cloud.', `${fieldset(dec('proc'))}
              <div class=flows>
                <div class=flow data-flow=cloud>
                  ${icon(14)}<p class=fl-h>Cloud</p>
                  <ol><li>Team or members upload</li><li>Cloud<small>sources · processing · results</small></li><li>Site and members</li></ol>
                </div>
                <div class=flow data-flow=hybrid>
                  ${icon(15)}<p class=fl-h>Hybrid</p>
                  <ol><li>Upload<small>residence Wi-Fi, or the My LOCO inbox</small></li><li>Residence: NAS ${SC.nasTb} TB + PC<small>sources · processing</small></li><li>Cloud<small>results only, through a CDN</small></li><li>Site and members</li></ol>
                </div>
              </div>
              <p class=fs-note>The residence server never serves the site itself: visitors load the scans from the cloud, so the residence connection, power and security stay out of their way.</p>`, true)}
            ${card('Volume', 'Volume and price', 'How many works are scanned a month, and how fast they are processed. The price below follows your choices.', `<div class=vol>
                <label class=vol-l for=fs-n>Works scanned per month <output id=fs-no></output></label>
                <input id=fs-n type=range min=0 max=200 step=5>
                <div class=vol-m role=radiogroup aria-label="Processing">
                  <label><input type=radio name=scanmode value=night> Night queue ${esc(SC.nightWindow)} · $${perNight} per work</label>
                  <label><input type=radio name=scanmode value=instant> Instant · $${perInstant} per work</label>
                  <p class=vol-own>Own PC in the residence: no computer-time fee, only our $${SC.handling} handling per work.</p>
                </div>
              </div>
              <div class=fs-cost></div>`, true)}
            ${card('Total', 'Your choice', '', `<div class=fs-total></div><button type=button class=cta data-close>Done, back to the screens</button>`, false)}
          </div>
        </div>
      </div>
    </section>
  </div>`;
  document.body.appendChild(el);

  // ---------- the comparison images load when the presentation opens ----------
  let painted = false;
  function paint() {
    if (painted) return;
    painted = true;
    el.querySelector('[data-hi]').src = 'assets/pvf-scan/scan.jpg';
    el.querySelector('[data-lo]').src = 'assets/pvf-scan/photo.jpg';
    el.querySelector('.lp-hi').style.backgroundImage = 'url(assets/pvf-scan/scan.jpg)';
    el.querySelector('.lp-lo').style.backgroundImage = 'url(assets/pvf-scan/photo.jpg)';
  }

  // ---------- compare slider ----------

  // ---------- the setup cards: one step at a time, the next one slides in after a pick ----------
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
  function showStep() {
    const bar = el.querySelector('.feat-bar').getBoundingClientRect().bottom;
    const top = stepsNav.getBoundingClientRect().top - bar - 12;
    if (Math.abs(top) > 4) el.scrollBy({ top, behavior: reduce ? 'auto' : 'smooth' });
    const h = cards[cur].querySelector('.fc-h');
    h.tabIndex = -1; h.focus({ preventScroll: true });
  }
  stepsNav.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { go(Number(b.dataset.go)); showStep(); } });
  // a neighbour peeking at the side: tap it to go there
  track.addEventListener('pointerup', (e) => {
    const k = e.target.closest('.fc-card');
    if (k && !k.classList.contains('cur') && !moved) go(cards.indexOf(k));
  });
  // a pick moves on to the next step (with the gallery the scan steps are skipped)
  const nextAfter = (i) => {
    if (cards[i].dataset.step === 'Level' && isOff(g, dec('proc'))) return cards.length - 1;
    return i + 1;
  };
  el.addEventListener('click', (e) => {
    const o = e.target.closest('.fc-card.cur .fo');
    if (!o || e.detail === 0) return;
    const i = cur;
    setTimeout(() => { if (cur === i) { go(nextAfter(i)); showStep(); } }, 380);
  });
  // swipe between steps
  let drag = null; let moved = false;
  track.addEventListener('pointerdown', (e) => { drag = e.target.closest('input[type=range]') ? null : { x: e.clientX, y: e.clientY }; moved = false; }, true);
  track.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x; const dy = e.clientY - drag.y; drag = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { moved = true; go(cur + (dx < 0 ? 1 : -1)); }
  }, true);
  track.addEventListener('pointercancel', () => { drag = null; });
  window.addEventListener('resize', () => { if (!el.hidden) go(cur, false); });

  // ---------- choices: the same state as the page ----------
  const n = el.querySelector('#fs-n');
  let levelPicked = false;
  el.addEventListener('change', (e) => {
    if (e.target.name === 'scanmode') { scanCfg.mode = e.target.value; B.refresh(); return; }
    if (e.target.name === key(g, dec('scan'))) levelPicked = true;
    B.onPick(e);
  });
  n.addEventListener('input', () => { scanCfg.n = Number(n.value); B.refresh(); });

  function refresh() {
    const levelDefault = state[key(g, dec('scan'))] === dec('scan').choices[0].id;
    if (!levelPicked && levelDefault) el.querySelectorAll(`[data-dec=scan] input`).forEach((r) => { r.checked = false; });
    const sel = (id) => dec(id).choices.find((c) => c.id === state[key(g, dec(id))]);
    let h = 0; const svc = new Set(); let once = 0;
    decs.forEach((d) => {
      if (isOff(g, d)) return;
      const c = sel(d.id);
      h += c.hours; (c.services || []).forEach((x) => svc.add(x)); if (c.oneTime) once += equipment();
    });
    let lo = 0; let hi = 0; svc.forEach((x) => { const v = sv(x); lo += v.min; hi += v.max; });
    el.querySelector('[data-f=h]').textContent = `${h} h · ${money(h * D.rate)}`;
    el.querySelector('[data-f=m]').textContent = svc.size ? `${range(lo, hi)} / mo` : '—';
    el.querySelector('[data-f=o]').textContent = once ? money(once) : '—';

    const scanOn = !isOff(g, dec('proc'));
    const own = scanOn && sel('proc').id === 'hybrid';
    n.value = scanCfg.n; el.querySelector('#fs-no').textContent = scanCfg.n;
    el.querySelectorAll('[name=scanmode]').forEach((r) => { r.checked = r.value === scanCfg.mode; r.disabled = own || !scanOn; });
    el.querySelector('.vol').classList.toggle('own', own);
    el.querySelector('.vol').classList.toggle('off', !scanOn);
    el.querySelectorAll('[data-flow]').forEach((f) => f.classList.toggle('on', scanOn && f.dataset.flow === sel('proc').id));

    const rows = [];
    if (scanOn) {
      const per = perWork();
      rows.push([`Per work`, own ? `$${SC.handling} handling (own PC)` : `${SC.hoursPerWork} h × $${scanCfg.mode === 'night' ? SC.night : SC.instant} + $${SC.handling} handling = $${per}`]);
      rows.push(['Processing per month', `${scanCfg.n} × $${per} = ${money(scanCfg.n * per)}`]);
      svc.forEach((x) => { if (x !== 'scanproc') { const v = sv(x); rows.push([v.name, `${range(v.min, v.max)} / mo`]); } });
      if (own) {
        rows.push(['PC: processor, graphics card, network', money(SC.pc)]);
        rows.push([`NAS ${SC.nasTb} TB: ${SC.nasGel.toLocaleString('en-US')} ₾ at about ${SC.gelPerUsd} ₾ per $`, `≈ ${money(nasUsd())}`]);
      }
    } else {
      rows.push(['Gallery', 'LOCO attaches photos as they are; no processing, no extra services']);
    }
    rows.push(['Integration on the site', `${h} h × ${money(D.rate)} = ${money(h * D.rate)}`]);
    el.querySelector('.fs-cost').innerHTML = `<p class=r-h>Price</p>${rows.map(([a, b]) => `<p class=r-row><span>${esc(a)}</span><span>${esc(b)}</span></p>`).join('')}
      ${own ? '<p class=fs-note>Hardware prices and the lari rate are estimates; we confirm them with a quote before ordering.</p>' : ''}`;
    cards.forEach((k) => k.classList.toggle('na', k.hasAttribute('data-scan') && k.dataset.step !== 'Level' && !scanOn));
    if (!el.hidden) requestAnimationFrame(() => { track.style.height = `${cards[cur].offsetHeight}px`; });
    el.querySelector('.fs-total').innerHTML = `<p class=kicker>Your choice</p><h3>${esc(sel('scan').label)}</h3>
      <div class=fs-tot-row>
        <span class=c-cell><span class=c-l>Integration</span><span class=rt-v>${h} h</span></span>
        <span class=c-cell><span class=c-l>Monthly</span><span class=rt-v>${svc.size ? `${range(lo, hi)}` : '—'}</span></span>
        <span class=c-cell><span class=c-l>One-time</span><span class=rt-v>${once ? money(once) : '—'}</span></span>
      </div>`;
  }

  // ---------- open / close ----------
  let opener = null;
  function open(btn) {
    opener = btn;
    paint();
    el.hidden = false;
    document.documentElement.classList.add('feat-open');
    el.scrollTop = 0;
    requestAnimationFrame(() => el.classList.add('in'));
    el.querySelector('.feat-x').focus({ preventScroll: true });
    refresh();
    requestAnimationFrame(() => go(0, false));
  }
  function close() {
    el.classList.remove('in');
    document.documentElement.classList.remove('feat-open');
    const done = () => { el.hidden = true; if (opener) opener.focus({ preventScroll: true }); };
    if (reduce) done(); else setTimeout(done, 250);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-feature=scan]');
    if (b) { open(b); return; }
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

  window.LOCO_FEATURE = { refresh, open: () => open(null) };
  B.refresh();
})();
