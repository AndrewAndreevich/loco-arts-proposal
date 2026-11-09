// PVF Scan for artworks: the presentation behind "Customize" in the Artworks group.
// Camera photo vs scan, why it matters, how to shoot (2D, 3D, progress), then the setup steps.
(() => {
  const B = window.LOCO_BUILDER; const K = window.LOCO_FEATURE_KIT;
  if (!B || !K) return;
  const V = window.ASSET_V || '';
  const { D, state, scanCfg, key, esc, isOff } = B;
  const { icon, step, format } = K;
  const SC = D.scan;
  const g = D.groups.find((x) => x.id === 'artworks');
  const d = (id) => g.decisions.find((x) => x.id === id);
  const off = 'Not needed with the gallery: pick a PVF Scan level in the first step.';

  const intro = (hid) => `
    <section class=fs-sec>
      <p class=kicker>PVF Scan</p>
      <h2 id=${hid}>From a phone photo to a museum-grade scan</h2>
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
      ${format('2D', 'Flat works', 'Paintings, graphics, photographs, textile: one flat, distortion-free image in super resolution.', [
        step(1, 1, 'Light it evenly', 'Two lights at 45° to the work, no direct sun. Put the colour card next to the work in the first frame.'),
        step(2, 2, 'Shoot close, in a grid', 'Camera parallel to the work, 10–20 frames in rows with about 60% overlap, every frame in focus. The camera you already have.'),
        step(3, 3, 'Upload', 'In the residence: over Wi-Fi straight to the scan server. From home: in My LOCO, into the inbox.'),
        step(4, 4, 'Processing', `Up to about ${SC.hoursPerWork} hour of computer time per work. The night queue (${esc(SC.nightWindow)}) costs less; instant costs more.`),
        step(5, 5, 'On the site', 'Deep zoom on the artwork page, real size in centimetres, previews for cards and the catalogue.')])}
      ${format('3D', 'Sculpture and objects', 'Anything with volume: a 3D scan you can turn around, and renders made from it.', [
        step(1, 6, 'Soft light all around', 'No hard shadows. Put the object on a turntable or walk around it.'),
        step(2, 7, 'Shoot in rings', '60–100 frames in 2–3 rings at different heights, each frame overlapping the next.'),
        step(3, 8, 'Upload', 'The same way as flat works: Wi-Fi in the residence or My LOCO from home.'),
        step(4, 9, 'Processing', 'The photos become a 3D scene (Gaussian Splatting); renders are made from it automatically: a turntable and hero angles.'),
        step(5, 10, 'On the site', 'A 3D view on the artwork page; the renders go to cards and the catalogue.')])}
      ${format('2D + 3D', 'Progress over time', 'For both formats: the same work scanned at every stage.', [
        step(1, 11, 'Scan again', 'At each stage, scan the same work with the same setup.'),
        step(2, 12, 'Aligned for you', 'Each new scan is matched to the previous one automatically, so the work does not jump between stages.'),
        step(3, 13, 'Timeline', 'A slider on the artwork page shows how the work changed, with the date of every stage.')])}
    </section>`;

  const volume = `<div class=vol>
      <label class=vol-l for=fs-n>Works scanned per month <output id=fs-no></output></label>
      <input id=fs-n type=range min=0 max=200 step=5>
    </div>
    <div class=fs-cost></div>
    <p class=fs-note>How the scans are processed (cloud or a PC in the residence, night queue or instant) and who scans are set once for every scan in <button type=button class=link-b data-feature=shared>Scan setup</button>, in the Delivery group.</p>`;

  let painted = false;
  K.makeFeature({
    id: 'scan',
    color: g.color,
    decisions: g.decisions.filter((x) => x.feature === 'scan').map((x) => ({ g, d: x })),
    intro,
    steps: [
      { step: 'Level', title: 'How works look on the site', desc: 'Gallery is what LOCO has today: photos as they are. PVF Scan adds a flat super-resolution image with deep zoom; Flat + Object adds 3D scans of sculpture and objects.', dec: { g, d: d('scan') } },
      { step: 'Progress', title: 'Progress of a work over time', desc: 'Each new scan of the same work becomes a stage on a timeline on the artwork page. Works for flat works and objects.', dec: { g, d: d('progress') }, offText: off },
      { step: 'Volume', title: 'Volume', desc: 'How many works are scanned a month. Prices are in the summary at the end.', body: volume, offText: off, na: () => isOff(g, d('progress')) },
    ],
    totalTitle: (ctx) => ctx.sel(g, d('scan')).label,
    onOpen: () => {
      if (painted) return;
      painted = true;
      const el = document.getElementById('feat-scan');
      el.querySelector('[data-hi]').src = `assets/pvf-scan/scan.jpg?v=${V}`;
      el.querySelector('[data-lo]').src = `assets/pvf-scan/photo.jpg?v=${V}`;
      el.querySelector('.lp-hi').style.backgroundImage = `url(assets/pvf-scan/scan.jpg?v=${V})`;
      el.querySelector('.lp-lo').style.backgroundImage = `url(assets/pvf-scan/photo.jpg?v=${V})`;
    },
    bind: (ctx) => { const n = ctx.el.querySelector('#fs-n'); n.addEventListener('input', () => { scanCfg.n = Number(n.value); B.refresh(); }); },
    refresh: (ctx) => {
      const el = ctx.el;
      const scanOn = !isOff(g, d('progress'));
      const own = B.ownPc(B.state);
      el.querySelector('#fs-n').value = scanCfg.n; el.querySelector('#fs-no').textContent = scanCfg.n;
      el.querySelector('.vol').classList.toggle('own', own);
      el.querySelector('.vol').classList.toggle('off', !scanOn);
      const names = [...ctx.svc].map((x) => (x === 'scanproc' ? `PVF Scan processing: ${scanCfg.n} works a month, ${own ? 'on the residence PC' : scanCfg.mode === 'night' ? 'night queue' : 'instant'}` : D.services[x].name));
      el.querySelector('.fs-cost').innerHTML = scanOn ? `<p class=r-h>Adds these services</p>${names.map((x) => `<p class=r-row><span>${esc(x)}</span></p>`).join('')}
        ${own ? `<p class=r-h style="margin-top:16px">Equipment for the residence</p><p class=r-row><span>PC and NAS ${SC.nasTb} TB, bought separately: listed in the summary</span></p>` : ''}` : '';
    },
  });
  B.refresh();
})();
