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

  const fieldset = (d) => `<fieldset class="dec fs-dec" data-dec="${d.id}"><legend>${esc(d.label)}</legend>
    ${d.dependsOn ? '<p class=fs-off>Pick a PVF Scan level above to set this.</p>' : ''}
    <div class=opts>${d.choices.map((c) => {
      const id = `c-${g.id}-${d.id}-${c.id}`;
      return `<label class=opt for="${id}"><input type=radio name="${key(g, d)}" id="${id}" value="${c.id}">
        <span class=opt-top><span class=opt-l>${esc(c.label)}</span><span class=opt-h>${c.hours} h</span></span>
        ${c.note ? `<span class=opt-n>${esc(c.note)}</span>` : ''}${optSvc(c)}<span class=tds>${tierDots(c.tiers)}</span></label>`;
    }).join('')}</div></fieldset>`;

  // small line drawings for the tutorial
  const I = {
    light: '<rect x="22" y="14" width="36" height="28" rx="1"/><path d="M6 6 L14 14 M74 6 L66 14"/><path d="M2 2 h8 l-2 8 z M78 2 h-8 l2 8 z"/><rect x="60" y="34" width="10" height="7"/>',
    grid: '<rect x="8" y="6" width="64" height="40" rx="1"/><g stroke-dasharray="2 2"><rect x="10" y="8" width="24" height="18"/><rect x="26" y="8" width="24" height="18"/><rect x="42" y="8" width="24" height="18"/><rect x="10" y="22" width="24" height="18"/><rect x="26" y="22" width="24" height="18"/><rect x="42" y="22" width="24" height="18"/></g>',
    upload: '<rect x="10" y="30" width="60" height="16" rx="2"/><path d="M40 4 v22 M32 12 l8 -8 l8 8"/><circle cx="62" cy="38" r="2"/>',
    night: '<path d="M46 8 a16 16 0 1 0 16 22 a13 13 0 0 1 -16 -22 z"/><path d="M12 44 h56"/>',
    page: '<rect x="12" y="4" width="44" height="42" rx="2"/><rect x="18" y="12" width="32" height="20"/><circle cx="58" cy="36" r="9"/><path d="M64 42 l8 8"/>',
    rings: '<ellipse cx="40" cy="38" rx="32" ry="8"/><ellipse cx="40" cy="24" rx="26" ry="6"/><path d="M34 40 v-26 q6 -8 12 0 v26 z"/><circle cx="8" cy="38" r="1.5"/><circle cx="72" cy="38" r="1.5"/><circle cx="14" cy="24" r="1.5"/><circle cx="66" cy="24" r="1.5"/>',
    cube: '<path d="M40 6 L66 18 L66 40 L40 50 L14 40 L14 18 Z M14 18 L40 30 L66 18 M40 30 V50"/>',
    layers: '<rect x="14" y="20" width="40" height="26"/><rect x="20" y="13" width="40" height="26"/><rect x="26" y="6" width="40" height="26"/>',
    slider: '<rect x="10" y="10" width="60" height="26" rx="1"/><path d="M10 44 h60"/><circle cx="46" cy="44" r="4"/>',
  };
  const svg = (k) => `<svg viewBox="0 0 80 52" width=80 height=52 aria-hidden=true class=fs-ic>${I[k]}</svg>`;
  const step = (n, ic, h, p) => `<li class=fs-step><span class=fs-sn>${n}</span>${svg(ic)}<h4>${h}</h4><p>${p}</p></li>`;
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
      <div class=cmp style="--x:50%">
        <div class=cmp-scan><img data-hi alt="The work as a PVF Scan: flat and sharp"></div>
        <div class=cmp-photo><div class=cmp-wall><img data-lo alt="The same work as a phone photo: at an angle, soft, with glare"><i class=cmp-glare></i></div></div>
        <i class=cmp-line aria-hidden=true></i>
        <span class="cmp-tag l">Phone photo</span><span class="cmp-tag r">PVF Scan · Flat</span>
        <input class=cmp-r type=range min=0 max=100 value=50 aria-label="Move to compare the phone photo and the PVF Scan">
      </div>
      <div class=loupes>
        <figure><div class="lp lp-lo"></div><figcaption>Phone photo, zoomed in</figcaption></figure>
        <figure><div class="lp lp-hi"></div><figcaption>PVF Scan, the same spot</figcaption></figure>
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
        <div class=fs-fmt-h><span class=fs-tag>2D</span><h4>Flat works</h4><p>Paintings, graphics, photographs, textile: one flat, distortion-free image in super resolution.</p></div>
        <ol class=fs-steps>
          ${step(1, 'light', 'Light it evenly', 'Two lights at 45° to the work, no direct sun. Put the colour card next to the work in the first frame.')}
          ${step(2, 'grid', 'Shoot close, in a grid', 'Camera parallel to the work, 10–20 frames in rows with about 60% overlap, every frame in focus. The camera you already have.')}
          ${step(3, 'upload', 'Upload', 'In the residence: over Wi-Fi straight to the scan server. From home: in My LOCO, into the inbox.')}
          ${step(4, 'night', 'Processing', `Up to about ${SC.hoursPerWork} hour of computer time per work. The night queue (${esc(SC.nightWindow)}) costs less; instant costs more.`)}
          ${step(5, 'page', 'On the site', 'Deep zoom on the artwork page, real size in centimetres, previews for cards and the catalogue.')}
        </ol>
      </div>
      <div class=fs-fmt>
        <div class=fs-fmt-h><span class=fs-tag>3D</span><h4>Sculpture and objects</h4><p>Anything with volume: a 3D scan you can turn around, and renders made from it.</p></div>
        <ol class=fs-steps>
          ${step(1, 'light', 'Soft light all around', 'No hard shadows. Put the object on a turntable or walk around it.')}
          ${step(2, 'rings', 'Shoot in rings', '60–100 frames in 2–3 rings at different heights, each frame overlapping the next.')}
          ${step(3, 'upload', 'Upload', 'The same way as flat works: Wi-Fi in the residence or My LOCO from home.')}
          ${step(4, 'cube', 'Processing', 'The photos become a 3D scene (Gaussian Splatting); renders are made from it automatically: a turntable and hero angles.')}
          ${step(5, 'page', 'On the site', 'A 3D view on the artwork page; the renders go to cards and the catalogue.')}
        </ol>
      </div>
      <div class=fs-fmt>
        <div class=fs-fmt-h><span class=fs-tag>2D + 3D</span><h4>Progress over time</h4><p>For both formats: the same work scanned at every stage.</p></div>
        <ol class="fs-steps fs-steps-3">
          ${step(1, 'layers', 'Scan again', 'At each stage, scan the same work with the same setup.')}
          ${step(2, 'grid', 'Aligned for you', 'Each new scan is matched to the previous one automatically, so the work does not jump between stages.')}
          ${step(3, 'slider', 'Timeline', 'A slider on the artwork page shows how the work changed, with the date of every stage.')}
        </ol>
      </div>
    </section>

    <section class=fs-sec>
      <h3>Choose the level</h3>
      ${fieldset(dec('scan'))}
      ${fieldset(dec('progress'))}
      ${fieldset(dec('who'))}
    </section>

    <section class=fs-sec>
      <h3>Processing and storage</h3>
      ${fieldset(dec('proc'))}
      <div class=flows>
        <div class=flow data-flow=cloud>
          <p class=fl-h>Cloud</p>
          <ol><li>Team or members upload</li><li>Cloud<small>sources · processing · results</small></li><li>Site and members</li></ol>
        </div>
        <div class=flow data-flow=hybrid>
          <p class=fl-h>Hybrid</p>
          <ol><li>Upload<small>residence Wi-Fi, or the My LOCO inbox</small></li><li>Residence: NAS ${SC.nasTb} TB + PC<small>sources · processing</small></li><li>Cloud<small>results only, through a CDN</small></li><li>Site and members</li></ol>
        </div>
      </div>
      <p class=fs-note>The residence server never serves the site itself: visitors load the scans from the cloud, so the residence connection, power and security stay out of their way.</p>
      <div class=vol>
        <label class=vol-l for=fs-n>Works scanned per month <output id=fs-no></output></label>
        <input id=fs-n type=range min=0 max=200 step=5>
        <div class=vol-m role=radiogroup aria-label="Processing">
          <label><input type=radio name=scanmode value=night> Night queue ${esc(SC.nightWindow)} · $${perNight} per work</label>
          <label><input type=radio name=scanmode value=instant> Instant · $${perInstant} per work</label>
          <p class=vol-own>Own PC in the residence: no computer-time fee, only our $${SC.handling} handling per work.</p>
        </div>
      </div>
      <div class=fs-cost></div>
    </section>

    <section class="fs-sec fs-end">
      <div class=fs-total></div>
      <button type=button class=cta data-close>Done, back to the screens</button>
    </section>
  </div>`;
  document.body.appendChild(el);

  // ---------- the demo painting: drawn once, sharp for the scan, small and soft for the photo ----------
  let painted = false;
  function paint() {
    if (painted) return;
    painted = true;
    let seed = 7;
    const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const W = 1600; const H = 1200;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const pal = ['#1d3b6e', '#d94f2b', '#f2c14e', '#2f7d5b', '#e9e1cf', '#161616', '#c2185b', '#6a8caf', '#8a5a2b'];
    const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#e8d9b8'); bg.addColorStop(1, '#c9a36b');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i += 1) {
      x.save(); x.translate(rnd() * W, rnd() * H); x.rotate(rnd() * Math.PI);
      x.globalAlpha = 0.75 + rnd() * 0.2; x.fillStyle = pal[Math.floor(rnd() * pal.length)];
      x.beginPath(); x.ellipse(0, 0, 80 + rnd() * 320, 40 + rnd() * 180, 0, 0, Math.PI * 2); x.fill(); x.restore();
    }
    // brushstrokes: the detail a phone photo loses
    x.lineCap = 'round';
    const img = x.getImageData(0, 0, W, H).data; // one read: stroke colours come from the shapes underneath
    for (let i = 0; i < 9000; i += 1) {
      const px = rnd() * W; const py = rnd() * H;
      const a = Math.sin(px / 180) + Math.cos(py / 140);
      const len = 6 + rnd() * 26;
      const o = ((Math.min(H - 1, py | 0) * W) + Math.min(W - 1, px | 0)) * 4;
      const base = [img[o], img[o + 1], img[o + 2]];
      const j = (v) => Math.max(0, Math.min(255, v + (rnd() - 0.5) * 70));
      x.strokeStyle = `rgba(${j(base[0])},${j(base[1])},${j(base[2])},0.55)`;
      x.lineWidth = 1.2 + rnd() * 4;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); x.stroke();
    }
    // canvas weave and fine cracks
    x.globalAlpha = 0.05; x.strokeStyle = '#000'; x.lineWidth = 1;
    for (let i = 0; i < W; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
    for (let i = 0; i < H; i += 3) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
    x.globalAlpha = 0.22; x.lineWidth = 0.7;
    for (let k = 0; k < 40; k += 1) {
      let cx = rnd() * W; let cy = rnd() * H; x.beginPath(); x.moveTo(cx, cy);
      for (let s = 0; s < 8; s += 1) { cx += (rnd() - 0.5) * 60; cy += (rnd() - 0.5) * 60; x.lineTo(cx, cy); }
      x.stroke();
    }
    x.globalAlpha = 1;
    const hi = c.toDataURL('image/jpeg', 0.9);
    const s = document.createElement('canvas'); s.width = 240; s.height = 180;
    s.getContext('2d').drawImage(c, 0, 0, 240, 180);
    const lo = s.toDataURL('image/jpeg', 0.7);
    el.querySelector('[data-hi]').src = hi;
    el.querySelector('[data-lo]').src = lo;
    el.querySelector('.lp-hi').style.backgroundImage = `url(${hi})`;
    el.querySelector('.lp-lo').style.backgroundImage = `url(${lo})`;
  }

  // ---------- compare slider and tutorial tabs ----------
  const cmp = el.querySelector('.cmp');
  el.querySelector('.cmp-r').addEventListener('input', (e) => cmp.style.setProperty('--x', `${e.target.value}%`));

  // ---------- choices: the same state as the page ----------
  const n = el.querySelector('#fs-n');
  el.addEventListener('change', (e) => {
    if (e.target.name === 'scanmode') { scanCfg.mode = e.target.value; B.refresh(); return; }
    B.onPick(e);
  });
  n.addEventListener('input', () => { scanCfg.n = Number(n.value); B.refresh(); });

  function refresh() {
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
