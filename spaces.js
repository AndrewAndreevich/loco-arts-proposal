// PVF Scan for spaces, two presentations behind "Customize":
//  - Park and halls (Exhibitions & Open-Air group): the park territory as a 3D map, halls from show to show;
//  - Studios (Artist Studios group): every studio in 3D, from artist to artist.
// Both use the shared scan setup (who scans, cloud or residence processing) from feature-kit.js.
(() => {
  const B = window.LOCO_BUILDER; const K = window.LOCO_FEATURE_KIT;
  if (!B || !K) return;
  const { D, scanCfg, hallCfg, studioCfg, esc, isOff } = B;
  const { step, format } = K;
  const SC = D.scan;
  const ex = D.groups.find((x) => x.id === 'exhibitions');
  const st = D.groups.find((x) => x.id === 'studios');
  const dx = (id) => ex.decisions.find((x) => x.id === id);
  const ds = (id) => st.decisions.find((x) => x.id === id);
  const offShared = 'Not needed yet: pick a 3D option in the steps before.';

  // a room through time: each period (an exhibition, an artist's residency) is one 3D scan of the room,
  // seen from 6 angles; dragging the timeline turns the scan and then moves on to the next period's scan
  const VIEWS = 6;
  // short dates for narrow screens: "Mar–May 26", "Sep 26 – Feb 27"
  const short = (a, b) => {
    const [m1, y1] = a.split(' '); const [m2, y2] = b.split(' ');
    return y1 === y2 ? `${m1}–${m2} ${y2.slice(2)}` : `${m1} ${y1.slice(2)} – ${m2} ${y2.slice(2)}`;
  };
  const timeline = (id, periods) => {
    const steps = periods.length * VIEWS;
    return `<div class=otl data-otl=${id}>
      <div class=otl-view>
        ${periods.map((p) => Array.from({ length: VIEWS }, (_, k) => `<img class=otl-img data-p=${p.set} data-k=${k} src="assets/spaces/orbit/${id}-${p.set}-${k + 1}.jpg" alt="" width=600 height=512 loading=lazy decoding=async>`).join('')).join('')}
        <p class=otl-scan>3D scan · view <b>1</b> / ${VIEWS}</p>
        <button type=button class="otl-nav prev" aria-label="Back in time"><svg viewBox="0 0 10 10" width=10 height=10 aria-hidden=true><path d="M7 1 L2 5 L7 9 Z"/></svg></button>
        <button type=button class="otl-nav next" aria-label="Forward in time"><svg viewBox="0 0 10 10" width=10 height=10 aria-hidden=true><path d="M3 1 L8 5 L3 9 Z"/></svg></button>
      </div>
      <div class=otl-now><b class=otl-who></b><span class=otl-what></span><span class=otl-dates></span><span class=otl-phase></span></div>
      <div class=otl-bar>
        <div class=otl-segs>${periods.map((p) => `<div class=otl-seg style="--c:var(--${p.color})"><span class=otl-name>${esc(p.who)}</span><span class=otl-d>${esc(p.from)} – ${esc(p.to)}</span><span class=otl-ds>${esc(short(p.from, p.to))}</span>
          <span class=otl-phs>${p.phases.map((x) => `<i title="${esc(x)}"></i>`).join('')}</span></div>`).join('')}</div>
        <input class=otl-r type=range min=0 max=${steps - 1} step=1 value=0 aria-label="Move through time">
      </div>
    </div>`;
  };
  const bindTimeline = (el, periods) => {
    const t = el.querySelector('.otl'); const r = t.querySelector('.otl-r');
    const set = () => {
      const i = Number(r.value); const p = periods[Math.floor(i / VIEWS)]; const k = i % VIEWS;
      const phase = p.phases.length ? p.phases[Math.min(p.phases.length - 1, Math.floor(k * p.phases.length / VIEWS))] : '';
      t.querySelectorAll('.otl-img').forEach((img) => img.classList.toggle('on', img.dataset.p === p.set && Number(img.dataset.k) === k));
      t.querySelector('.otl-scan b').textContent = k + 1;
      t.querySelector('.otl-who').textContent = p.who;
      t.querySelector('.otl-what').textContent = p.what;
      t.querySelector('.otl-dates').textContent = `${p.from} – ${p.to}`;
      t.querySelector('.otl-phase').textContent = phase;
      t.querySelector('.otl-phase').hidden = !phase;
      t.style.setProperty('--pc', `var(--${p.color})`);
      t.querySelectorAll('.otl-seg').forEach((sg, j) => sg.classList.toggle('on', j === Math.floor(i / VIEWS)));
      t.querySelector('.prev').disabled = i === 0;
      t.querySelector('.next').disabled = i === Number(r.max);
    };
    r.addEventListener('input', set);
    t.querySelector('.prev').addEventListener('click', () => { r.value = Math.max(0, Number(r.value) - 1); set(); });
    t.querySelector('.next').addEventListener('click', () => { r.value = Math.min(Number(r.max), Number(r.value) + 1); set(); });
    set();
  };
  const volume = (id, label, max) => `<div class=vol>
      <label class=vol-l for=${id}-n>${label} <output id=${id}-no></output></label>
      <input id=${id}-n type=range min=0 max=${max} step=1>
      <div class=vol-m role=radiogroup aria-label="Processing">
        <label><input type=radio name=${id}mode value=night> Night queue ${esc(SC.nightWindow)}</label>
        <label><input type=radio name=${id}mode value=instant> Instant</label>
        <p class=vol-own>Processed on the residence PC: no paid computer time.</p>
      </div>
    </div>
    <div class=fs-cost></div>`;
  const volumeRefresh = (ctx, id, cfg, proc, what) => {
    const el = ctx.el; const own = K.showFlows(el);
    el.querySelector(`#${id}-n`).value = cfg.n; el.querySelector(`#${id}-no`).textContent = cfg.n;
    el.querySelectorAll(`[name=${id}mode]`).forEach((r) => { r.checked = r.value === scanCfg.mode; r.disabled = own; });
    el.querySelector('.vol').classList.toggle('own', own);
    const names = [...ctx.svc].map((x) => (x === proc ? `${what} processing: ${cfg.n} scans a month, ${own ? 'on the residence PC' : scanCfg.mode === 'night' ? 'night queue' : 'instant'}` : D.services[x].name));
    el.querySelector('.fs-cost').innerHTML = names.length ? `<p class=r-h>Adds these services</p>${names.map((x) => `<p class=r-row><span>${esc(x)}</span></p>`).join('')}` : '';
  };
  const labels = (ctx) => ctx.decs.filter(({ g, d }) => d.feature !== 'shared' && !isOff(g, d)).map(({ g, d }) => ctx.sel(g, d)).filter((c, i) => i === 0 || c.hours > 0).map((c) => c.label).join(' · ');

  // ---------- Park and halls ----------
  const HALL = [
    { set: 'a', who: 'Soft Matter', what: 'group show, painting and textile', from: 'Mar 2026', to: 'May 2026', color: 'orange', phases: [] },
    { set: 'b', who: 'Open Signal', what: 'photography and light', from: 'Jun 2026', to: 'Aug 2026', color: 'lime', phases: [] },
    { set: 'c', who: 'Night Garden', what: 'installation and video', from: 'Sep 2026', to: 'Nov 2026', color: 'sky', phases: [] },
  ];
  K.makeFeature({
    id: 'exhibits',
    color: ex.color,
    decisions: [...ex.decisions.filter((x) => x.feature === 'exhibits').map((x) => ({ g: ex, d: x })), K.shared('who'), K.shared('proc')],
    intro: (hid) => `
      <section class=fs-sec>
        <p class=kicker>PVF Scan · Park and halls</p>
        <h2 id=${hid}>The park as a 3D map, and every exhibition kept</h2>
        <p class=big>The same scanning as for the works, at the scale of the place: the whole LOCO Park territory as a 3D map with navigation, and every hall scanned again before each show closes, so the archive becomes a series of halls you can walk.</p>
        <figure class=sp-map><img src="assets/spaces/park-map.jpg" alt="LOCO Park from above as a 3D map with green location pins and a walking route" width=1024 height=1024 loading=lazy decoding=async>
          <figcaption><b>The park territory</b>Made from a satellite photo of 84 David Guramishvili Avenue: the real buildings, paths and green, with pins on buildings and works and a walking route. On the site this is a 3D scan you can fly through.</figcaption></figure>
        <h3 class=sp-h>A hall, from show to show</h3>
        <p class=fs-lead>Drag the timeline or use the arrows: the scan of the hall turns, and with the next exhibition the next scan takes its place.</p>
        ${timeline('hall', HALL)}
        <p class=fs-note>Concept images and example exhibitions. On the site each period is a real 3D scan of the hall that you can walk.</p>
      </section>
      <section class=fs-sec>
        <h3>Why it matters</h3>
        <ul class=fs-why>
          <li><h4>Walk the park</h4><p>The whole territory from drone and ground photos: move between buildings and outdoor works, follow routes for tours, open a work from where it stands.</p></li>
          <li><h4>Every show stays</h4><p>Each exhibition is scanned before it closes. The archive stops being a list of photos and becomes halls you can walk.</p></li>
          <li><h4>One slider</h4><p>Every hall has a timeline: the date and the name of each show, and the same room changing as you drag.</p></li>
          <li><h4>Same pipeline</h4><p>The cameras, the drone and the processing are the ones used for artwork scans; a residence PC, if there is one, processes all of it.</p></li>
        </ul>
      </section>
      <section class=fs-sec>
        <h3>How it works</h3>
        ${format('Outdoor', 'The park territory', 'The open-air part of LOCO Park: paths, buildings and outdoor works.', [
          step(1, 2, 'Fly a grid', 'A drone flies the territory in parallel lines with overlapping photos; one calm, overcast day is ideal.'),
          step(2, 7, 'Ground photos', 'Around buildings and outdoor works, in rings at eye level, to fill what the drone cannot see.'),
          step(3, 3, 'Upload', 'The whole set goes to the scan server from the residence.'),
          step(4, 9, 'Processing', 'The photos become one 3D scan of the park; works and buildings are placed as points.'),
          step(5, 10, 'On the site', 'A 3D map with navigation and routes; the 2D map stays as a fallback on slow devices.')])}
        ${format('Indoor', 'Exhibition halls', 'A hall with the show in it: walls, floor, ceiling and the works.', [
          step(1, 6, 'Even light', 'Gallery lights on, no daylight patches; doors open to the next room if it is part of the visit.'),
          step(2, 7, 'Walk the room', '300–500 photos walking along the walls and through the middle, every surface seen twice.'),
          step(3, 8, 'Upload', 'Over Wi-Fi in the residence, straight to the scan server.'),
          step(4, 4, 'Processing', `About ${SC.hoursPerSpace} hours of computer time per hall, in the night queue or at once.`),
          step(5, 10, 'On the site', 'A 3D visit on the exhibition page, with the works in it as points.')])}
        ${format('Over time', 'From show to show', 'The same hall scanned again before every show closes.', [
          step(1, 11, 'Scan again', 'In the last days of each exhibition, with the same setup.'),
          step(2, 12, 'Aligned for you', 'Each new scan is matched to the previous one, so the hall does not jump between shows.'),
          step(3, 13, 'Timeline', 'A slider on the hall page moves through every show, with its dates and name.')])}
      </section>`,
    steps: [
      { step: 'Park', title: 'The park territory', desc: 'A static map, an interactive 2D map, or a 3D scan of the whole territory you can walk with navigation.', dec: { g: ex, d: dx('park') } },
      { step: 'Halls', title: 'Exhibition halls in 3D', desc: 'Installation photos, or the hall scanned with the show in it and walkable on the exhibition page.', dec: { g: ex, d: dx('ex3d') } },
      { step: 'Halls over time', title: 'Halls from show to show', desc: 'Keep only the current show, or scan every exhibition before it closes and move through them on a timeline.', dec: { g: ex, d: dx('hallhist') }, offText: 'Not needed with photo documentation: pick the 3D visit in the step before.' },
      ...K.sharedSteps(offShared),
      { step: 'Volume', title: 'Volume', desc: 'How many halls are scanned a month. Prices are in the summary at the end.', body: volume('hall', 'Halls scanned per month', 10), offText: 'Nothing is scanned again yet: pick the timeline in the halls step.', na: (ctx) => !ctx.svc.has('hallproc') },
    ],
    totalTitle: labels,
    onChange: (e) => { if (e.target.name !== 'hallmode') return false; scanCfg.mode = e.target.value; return true; },
    bind: (ctx) => {
      const n = ctx.el.querySelector('#hall-n');
      n.addEventListener('input', () => { hallCfg.n = Number(n.value); B.refresh(); });
      bindTimeline(ctx.el, HALL);
    },
    refresh: (ctx) => volumeRefresh(ctx, 'hall', hallCfg, 'hallproc', 'Hall scan'),
  });

  // ---------- Studios ----------
  const STUDIO = [
    { set: 'a', who: 'Studio 4, empty', what: 'between residencies', from: 'Jan 2026', to: 'Feb 2026', color: 'mute', phases: ['Scanned empty', 'Open for applications', 'Visits by applicants'] },
    { set: 'b', who: 'Nino K.', what: 'painter in residence', from: 'Mar 2026', to: 'Aug 2026', color: 'orange', phases: ['Move-in', 'First works', 'Work in progress', 'Preparing the show', 'Open studio', 'Move-out'] },
    { set: 'c', who: 'Luka B.', what: 'sculptor in residence', from: 'Sep 2026', to: 'Feb 2027', color: 'sky', phases: ['Move-in', 'Casting', 'Work in progress', 'Preparing the show', 'Open studio', 'Move-out'] },
  ];
  K.makeFeature({
    id: 'studios',
    color: st.color,
    decisions: [...st.decisions.filter((x) => x.feature === 'studios').map((x) => ({ g: st, d: x })), K.shared('who'), K.shared('proc')],
    intro: (hid) => `
      <section class=fs-sec>
        <p class=kicker>PVF Scan · Studios</p>
        <h2 id=${hid}>Every studio, from artist to artist</h2>
        <p class=big>Each studio scanned empty, so an applicant can walk it before applying, and scanned again when a resident moves in and when they leave. One slider shows how every artist made the same room their own.</p>
        <p class=fs-lead>Drag the timeline or use the arrows: the scan of the studio turns, and with the next resident the next scan takes its place.</p>
        ${timeline('studio', STUDIO)}
        <p class=fs-note>Concept images and example residents. On the site each period is a real 3D scan of the studio that you can walk.</p>
      </section>
      <section class=fs-sec>
        <h3>Why it matters</h3>
        <ul class=fs-why>
          <li><h4>Before you apply</h4><p>An applicant walks an empty studio in 3D: size, light, walls and doors, before sending the application.</p></li>
          <li><h4>From artist to artist</h4><p>Studios are scanned when a resident moves in and when they leave. Each artist's trace in the place is kept.</p></li>
          <li><h4>A residency archive</h4><p>The timeline of a studio becomes part of the residency's history, linked to the artists' pages.</p></li>
          <li><h4>Same pipeline</h4><p>The same cameras and processing as artwork scans; a residence PC, if there is one, processes all of it.</p></li>
        </ul>
      </section>
      <section class=fs-sec>
        <h3>How it works</h3>
        ${format('Indoor', 'A studio', 'One room: walls, floor, ceiling, windows and what is in it.', [
          step(1, 6, 'Even light', 'Daylight from the windows or the studio lights, no hard sun patches.'),
          step(2, 7, 'Walk the room', '300–500 photos along the walls and through the middle, every surface seen twice.'),
          step(3, 8, 'Upload', 'Over Wi-Fi in the residence, straight to the scan server.'),
          step(4, 4, 'Processing', `About ${SC.hoursPerSpace} hours of computer time per studio, in the night queue or at once.`),
          step(5, 10, 'On the site', 'A 3D visit on the studio page, next to the floor plan.')])}
        ${format('Over time', 'From artist to artist', 'The same studio scanned whenever a residency starts and ends.', [
          step(1, 11, 'Scan again', 'When an artist moves in and when they leave, with the same setup.'),
          step(2, 12, 'Aligned for you', 'Each new scan is matched to the previous one, so the room does not jump between residencies.'),
          step(3, 13, 'Timeline', 'A slider on the studio page moves through every residency, with the artist and the dates.')])}
      </section>`,
    steps: [
      { step: 'Studios', title: 'Artist studios in 3D', desc: 'Floor plans only, or every studio scanned empty so applicants can walk it before they apply.', dec: { g: st, d: ds('studio3d') } },
      { step: 'Over time', title: 'Studios from artist to artist', desc: 'One scan per studio, or a scan when each artist moves in and leaves, on a timeline.', dec: { g: st, d: ds('studiohist') }, offText: 'Not needed with floor plans only: pick the 3D scan in the step before.' },
      ...K.sharedSteps(offShared),
      { step: 'Volume', title: 'Volume', desc: 'How many studios are scanned a month. Prices are in the summary at the end.', body: volume('studio', 'Studios scanned per month', 10), offText: 'Nothing is scanned yet: pick the 3D scan in the first step.', na: (ctx) => !ctx.svc.has('studioproc') },
    ],
    totalTitle: labels,
    onChange: (e) => { if (e.target.name !== 'studiomode') return false; scanCfg.mode = e.target.value; return true; },
    bind: (ctx) => {
      const n = ctx.el.querySelector('#studio-n');
      n.addEventListener('input', () => { studioCfg.n = Number(n.value); B.refresh(); });
      bindTimeline(ctx.el, STUDIO);
    },
    refresh: (ctx) => volumeRefresh(ctx, 'studio', studioCfg, 'studioproc', 'Studio scan'),
  });
  B.refresh();
})();
