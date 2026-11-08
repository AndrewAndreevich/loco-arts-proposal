// Tier builder: renders groups of screens from data/tiers.js, option choices per group,
// and a live estimate (screens, hours, price, weeks, monthly services).
(() => {
  const D = window.LOCO_DATA;
  const root = document.getElementById('groups');
  if (!D || !root) return;

  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const tierById = Object.fromEntries(D.tiers.map((t) => [t.id, t]));
  const state = {}; // decisionKey -> choice id
  const key = (g, d) => `${g.id}.${d.id}`;

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

  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const tierDots = (tiers) => tiers.length
    ? tiers.map((t) => `<span class="td td-${t}" title="${tierById[t].name}">${tierById[t].name}</span>`).join('')
    : '<span class="td td-alt">Alternative</span>';

  // ---------- wireframe of a screen (rectangle with structure) ----------
  const WF = {
    home: '<i class=hero></i><i class=row3></i><i class=row3></i><i class=l></i>',
    list: '<i class=bar></i><i class=grid></i><i class=grid></i>',
    detail: '<i class=split></i><i class=l></i><i class=l s></i>',
    form: '<i class=l s></i><i class=field></i><i class=field></i><i class=btn></i>',
    state: '<i class=circle></i><i class=l s></i>',
    viewer: '<i class=stage></i><i class=l s></i>',
    map: '<i class=stage dots></i><i class=l s></i>',
    dash: '<i class=row3></i><i class=row3></i><i class=grid></i>',
    text: '<i class=l></i><i class=l></i><i class=l s></i><i class=l></i>',
  };

  const screenCard = (p, opt) => {
    const c = el('div', 'scr' + (opt ? ' opt' : ''));
    c.dataset.page = p.id;
    const to = (p.to || []).length ? `<span class=to>→ ${p.to.join(' ')}</span>` : '';
    const from = p.from ? `<span class=to>from ${p.from}</span>` : '';
    c.innerHTML = `<div class="wf wf-${p.kind}" aria-hidden=true>${WF[p.kind] || WF.text}</div>
      <span class=id>${p.id}</span><span class=nm>${p.name}</span>${to}${from}
      ${opt ? `<span class=tags>${opt}</span>` : ''}`;
    return c;
  };

  // ---------- render groups ----------
  D.groups.forEach((g, gi) => {
    const sec = el('section', 'grp reveal');
    sec.id = 'g-' + g.id;
    sec.style.setProperty('--gc', `var(--${g.color})`);
    const n = String(gi + 1).padStart(2, '0');
    sec.innerHTML = `<div class=grp-head><span class=grp-n>${n}</span><h3>${g.name}</h3>
      <p class=grp-meta aria-live=polite></p></div>${g.note ? `<p class=grp-note>${g.note}</p>` : ''}`;

    const screens = el('div', 'screens');
    g.pages.forEach((p) => screens.appendChild(screenCard(p)));
    // screens that only come with an option, drawn dashed until chosen
    const seen = new Set();
    g.decisions.forEach((d) => d.choices.forEach((c) => (c.pages || []).forEach((p) => {
      if (seen.has(p.id)) return; seen.add(p.id);
      const tiers = d.choices.filter((x) => (x.pages || []).some((q) => q.id === p.id)).flatMap((x) => x.tiers);
      const card = screenCard(p, tierDots([...new Set(tiers)]));
      screens.appendChild(card);
    })));
    if (screens.children.length) sec.appendChild(screens);
    else sec.appendChild(el('p', 'grp-noscreens', 'No screens of its own: works across all groups.'));

    g.decisions.forEach((d) => {
      const fs = el('fieldset', 'dec');
      fs.innerHTML = `<legend>${d.label}</legend>`;
      const opts = el('div', 'opts');
      d.choices.forEach((c) => {
        const id = `c-${g.id}-${d.id}-${c.id}`;
        const lab = el('label', 'opt');
        lab.htmlFor = id;
        lab.innerHTML = `<input type=radio name="${key(g, d)}" id="${id}" value="${c.id}">
          <span class=opt-top><span class=opt-l>${c.label}</span><span class=opt-h>${c.hours} h</span></span>
          ${c.note ? `<span class=opt-n>${c.note}</span>` : ''}
          <span class=tds>${tierDots(c.tiers)}</span>`;
        opts.appendChild(lab);
      });
      fs.appendChild(opts);
      sec.appendChild(fs);
    });
    root.appendChild(sec);
  });

  // ---------- estimate ----------
  const out = {
    tier: document.getElementById('c-tier'), screens: document.getElementById('c-screens'),
    hours: document.getElementById('c-hours'), price: document.getElementById('c-price'),
    weeks: document.getElementById('c-weeks'), monthly: document.getElementById('c-monthly'),
    services: document.getElementById('services'),
  };
  const switches = [...document.querySelectorAll('[data-tier]')];

  function update() {
    let hours = 0; let screens = 0;
    const svc = new Set();
    D.groups.forEach((g) => {
      let gh = g.hours; let gs = g.pages.length;
      (g.services || []).forEach((s) => svc.add(s));
      const active = new Set();
      g.decisions.forEach((d) => {
        const c = d.choices.find((x) => x.id === state[key(g, d)]);
        gh += c.hours;
        (c.pages || []).forEach((p) => { if (!active.has(p.id)) { active.add(p.id); gs += 1; } });
        (c.services || []).forEach((s) => svc.add(s));
        document.getElementById(`c-${g.id}-${d.id}-${c.id}`).checked = true;
      });
      const sec = document.getElementById('g-' + g.id);
      sec.querySelectorAll('.scr.opt').forEach((card) => card.classList.toggle('on', active.has(card.dataset.page)));
      sec.querySelector('.grp-meta').textContent =
        `${gs} ${gs === 1 ? 'screen' : 'screens'} · ${gh} h · ${money(gh * D.rate)}`;
      hours += gh; screens += gs;
    });
    let lo = 0; let hi = 0;
    const rows = [];
    svc.forEach((s) => {
      const v = D.services[s]; lo += v.min; hi += v.max;
      rows.push(`<li><span>${v.name}</span><span>${v.min === v.max ? money(v.min) : `${money(v.min)}–${money(v.max)}`}</span></li>`);
    });
    const t = matchingTier();
    out.tier.textContent = t ? t.name : 'Custom';
    out.tier.style.color = t ? `var(--${t.color})` : 'var(--pink)';
    out.screens.textContent = screens;
    out.hours.textContent = hours;
    out.price.textContent = money(hours * D.rate);
    out.weeks.textContent = t ? `${t.weeks} weeks` : `≈ ${Math.ceil(hours / D.hoursPerWeek)} weeks`;
    out.monthly.textContent = `${money(lo)}–${money(hi)} / mo`;
    if (out.services) out.services.innerHTML = rows.join('') + `<li class=tot><span>Total</span><span>${money(lo)}–${money(hi)} / month</span></li>`;
    switches.forEach((b) => b.setAttribute('aria-pressed', String(!!t && b.dataset.tier === t.id)));
  }

  function setTier(tid) { Object.assign(state, defaults(tid)); update(); }

  root.addEventListener('change', (e) => {
    if (e.target.type === 'radio') { state[e.target.name] = e.target.value; update(); }
  });
  switches.forEach((b) => b.addEventListener('click', () => setTier(b.dataset.tier)));
  document.getElementById('rate').textContent = money(D.rate);
  setTier('E');
})();
