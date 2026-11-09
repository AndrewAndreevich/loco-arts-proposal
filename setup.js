// Scan setup: who scans and where every scan is processed (cloud, or a PC and NAS in the residence).
// One card in the Delivery group, shown once any scan is picked; set here once for artworks, the park,
// halls and studios, and counted once in the totals.
(() => {
  const B = window.LOCO_BUILDER; const K = window.LOCO_FEATURE_KIT;
  if (!B || !K) return;
  const { D, state, scanCfg, hallCfg, studioCfg, esc, isOff } = B;
  const SC = D.scan;
  const g = (id) => D.groups.find((x) => x.id === id);
  const dec = (gid, did) => g(gid).decisions.find((x) => x.id === did);
  const NIGHT_HOURS = 6 * 30; // the 3:00–9:00 window, a month

  // computer time a month for everything that is scanned
  const load = () => {
    const rows = [];
    if (!isOff(g('artworks'), dec('artworks', 'progress'))) rows.push(['Artworks', scanCfg.n, SC.hoursPerWork]);
    if (state['exhibitions.hallhist'] === 'timeline') rows.push(['Halls', hallCfg.n, SC.hoursPerSpace]);
    if (state['studios.studio3d'] === 'scan') rows.push(['Studios', studioCfg.n, SC.hoursPerSpace]);
    return rows;
  };

  K.makeFeature({
    id: 'shared',
    color: g('delivery').color,
    keepFirst: true,
    decisions: [K.shared('who'), K.shared('proc')],
    intro: (hid) => `
      <section class=fs-sec>
        <p class=kicker>PVF Scan · Setup</p>
        <h2 id=${hid}>One setup for every scan</h2>
        <p class=big>Artworks, the park, the halls and the studios are all scanned with the same pipeline. Who scans, and where the scans are processed, is decided here once and counted once in the totals.</p>
      </section>
      <section class=fs-sec>
        <h3>Why one place</h3>
        <ul class=fs-why>
          <li><h4>Counted once</h4><p>Training, the cloud setup or the residence PC are paid for once, however many kinds of scan are switched on.</p></li>
          <li><h4>Cloud or residence</h4><p>Pay per processed scan in the cloud, or process everything on a PC in the residence and keep only the results in the cloud.</p></li>
          <li><h4>Night or instant</h4><p>The night queue (${esc(SC.nightWindow)}) is cheaper; instant processing costs more. The residence PC works through the night for free.</p></li>
          <li><h4>Load in view</h4><p>The last step adds up the computer time a month from the volumes set in each presentation.</p></li>
        </ul>
      </section>`,
    steps: [
      { step: 'Who', title: 'Who scans', desc: 'We train one or two people from the LOCO team. Or open it to the community too: members scan their own works and upload them from My LOCO.', dec: K.shared('who') },
      { step: 'Processing', title: 'Processing and storage', desc: 'Everything in the cloud, or sources and processing on a PC and NAS in the residence with only the results in the cloud.', dec: K.shared('proc'), body: K.flowsHtml() },
      { step: 'Load', title: 'Processing load', desc: 'Computer time a month from the volumes set for artworks, halls and studios.', body: `<div class=vol-m role=radiogroup aria-label="When to process">
          <label><input type=radio name=setupmode value=night> Night queue ${esc(SC.nightWindow)}</label>
          <label><input type=radio name=setupmode value=instant> Instant</label></div>
        <div class=fs-cost></div>` },
    ],
    totalTitle: (ctx) => `${ctx.sel(K.shared('who').g, K.shared('who').d).label} · ${ctx.sel(K.shared('proc').g, K.shared('proc').d).label}`,
    onChange: (e) => { if (e.target.name !== 'setupmode') return false; scanCfg.mode = e.target.value; return true; },
    refresh: (ctx) => {
      const el = ctx.el;
      const own = K.showFlows(el);
      el.querySelectorAll('[name=setupmode]').forEach((r) => { r.checked = r.value === scanCfg.mode; r.disabled = own; });
      const rows = load();
      const total = rows.reduce((a, [, n, h]) => a + n * h, 0);
      const pct = Math.min(100, Math.round((total / NIGHT_HOURS) * 100));
      el.querySelector('.fs-cost').innerHTML = `<p class=r-h>Computer time a month</p>
        ${rows.length ? rows.map(([what, n, h]) => `<p class=r-row><span>${what}: ${n} × ${h} h</span><span>${n * h} h</span></p>`).join('') : '<p class=r-row><span>No scans set to repeat yet</span><span>—</span></p>'}
        <p class="r-row r-tot"><span>Total</span><span>${total} h</span></p>
        <div class="cap${total > NIGHT_HOURS ? ' over' : ''}"><div class=cap-bar><i style="width:${pct}%"></i></div>
          <p class="fs-note cap-t">${own
            ? (total > NIGHT_HOURS ? `More than one residence PC can do in the night window (about ${NIGHT_HOURS} h a month): plan a second PC or send part to the cloud.` : `${pct}% of what one residence PC can do in the night window (about ${NIGHT_HOURS} h a month).`)
            : `${scanCfg.mode === 'night' ? 'Processed in the night queue' : 'Processed at once'} in the cloud; prices are in the summary at the end.`}</p></div>
        <p class=fs-note>Volumes are set in each presentation: <button type=button class=link-b data-feature=scan>Artworks</button>, <button type=button class=link-b data-feature=exhibits>Park and halls</button>, <button type=button class=link-b data-feature=studios>Studios</button>.</p>`;
    },
  });
  B.refresh();
})();
