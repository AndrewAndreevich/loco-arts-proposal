/* Tier builder data. Edit numbers here; the page recalculates everything.
 *
 * rate      – USD per hour. Tier prices = hours of the tier's default choices × rate.
 * groups    – each group = a set of screens + base hours + decisions.
 *   pages   – screens always in scope (id, name, kind = wireframe type, h = hours, to = transitions).
 *             Page hours of a group add up to the group's base hours; option-only work (e.g. import) sits in the choice.
 *   hours   – base hours for the group regardless of options.
 *   services– monthly third-party costs the group always needs.
 *   decisions[].choices[] – alternatives; `tiers` lists which tiers use that choice by default
 *             (empty = possible alternative, not part of any tier); `pages` = extra screens it adds.
 * Check: Essential 400 h, Signature 636 h, Flagship 884 h.
 */
window.LOCO_DATA = {
  rate: 30,
  hoursPerWeek: 70,
  supportMonths: 6, // support after launch: a pool of hours used over these months
  tiers: [
    { id: 'E', name: 'Essential', price: 12000, weeks: 6, color: 'lime' },
    { id: 'S', name: 'Signature', price: 18000, weeks: 8, color: 'sky' },
    { id: 'F', name: 'Flagship', price: 24000, weeks: 12, color: 'orange' },
  ],
  services: {
    hosting: { name: 'Hosting + CDN', min: 30, max: 60 },
    storage: { name: 'Media storage', min: 5, max: 20 },
    mux: { name: 'Mux video', min: 10, max: 30 },
    email: { name: 'Transactional e-mail', min: 15, max: 15 },
    newsletter: { name: 'Newsletter', min: 0, max: 50 },
    ai: { name: 'AI translation', min: 5, max: 20 },
    splat: { name: '3D scenes on CDN (estimate)', min: 5, max: 20 },
    scanstore: { name: 'PVF Scan results + CDN (Cloudflare R2)', min: 2, max: 15 },
    scansrc: { name: 'PVF Scan sources in the cloud (Backblaze B2)', min: 5, max: 20 },
    scanbackup: { name: 'Cold backup of scan sources (Backblaze B2)', min: 5, max: 20 },
    scanproc: { name: 'PVF Scan processing', min: 0, max: 0 }, // worked out from the volume and the processing mode
    hallproc: { name: 'Hall scan processing', min: 0, max: 0 }, // worked out from the volume, like artwork scans
    studioproc: { name: 'Studio scan processing', min: 0, max: 0 },
  },
  features: {
    scan: { title: 'Artwork viewer · PVF Scan' },
    exhibits: { title: 'Park and halls · PVF Scan' },
    studios: { title: 'Studios over time · PVF Scan' },
    shared: { title: 'Scan setup · PVF Scan' },
  },
  // PVF Scan pricing: up to ~1 h of computer time per work, plus our handling (checks, publishing, tiles, previews)
  scan: {
    hoursPerWork: 1, night: 2, instant: 3, handling: 1, perMonth: 20,
    hoursPerSpace: 3, hallsPerMonth: 2, studiosPerMonth: 2,
    nightWindow: '3:00–9:00',
    pc: 2000, nasGel: 3500, gelPerUsd: 2.7, nasTb: 16,
    resultGb: [0.5, 1], sourceGb: [1, 2],
  },
  groups: [
    {
      id: 'home', name: 'Homepage', color: 'pink', hours: 12,
      pages: [{ id: 'P01', name: 'Home', kind: 'home', h: 12, to: ['P02', 'P04', 'P07', 'P12', 'P22', 'P25'] }],
      decisions: [],
    },
    {
      id: 'artists', name: 'Artists', color: 'orange', hours: 16,
      pages: [
        { id: 'P02', name: 'Artists — directory', kind: 'list', h: 8, to: ['P03'] },
        { id: 'P03', name: 'Artist profile', kind: 'detail', h: 8, to: ['P05', 'P22'] },
      ],
      decisions: [],
    },
    {
      id: 'artworks', name: 'Artworks', color: 'green', hours: 12, services: ['storage'],
      pages: [
        { id: 'P04', name: 'Artworks — catalogue', kind: 'list', h: 6, to: ['P05'] },
        { id: 'P05', name: 'Artwork detail', kind: 'detail', h: 3, to: ['P06'] },
        { id: 'P06', name: 'Artwork inquiry', kind: 'form', h: 3, to: ['P37'] },
      ],
      decisions: [
        {
          id: 'aa', label: 'Artwork Archive data',
          choices: [
            { id: 'embed', label: 'Embed widget', hours: 4, tiers: [], note: 'Artwork Archive’s own look; no LOCO filters, search or EN / GE' },
            { id: 'import', label: 'Scheduled import into CMS', hours: 20, tiers: ['E', 'S', 'F'], note: 'LOCO keeps entering data only in Artwork Archive; CSV as fallback' },
            { id: 'api', label: 'Direct API', hours: 26, tiers: [], note: 'Only if Artwork Archive grants API access' },
          ],
        },
        // PVF Scan: how artworks look on the site. Shown on the page as one feature with its own presentation
        // (Customize); the decisions below only count when a scan level is chosen.
        {
          id: 'scan', feature: 'scan', label: 'How artworks look on the site',
          choices: [
            { id: 'gallery', label: 'Gallery: photos as they are', hours: 2, tiers: ['E'], note: 'LOCO photographs a work and attaches the photos; swipe gallery with a full-screen lightbox' },
            { id: 'flat', label: 'PVF Scan · Flat', hours: 30, tiers: ['S'], services: ['scanstore', 'scanproc'], note: '10–20 close-up frames stitched into one flat, distortion-free image in super resolution; deep zoom down to the brushstroke, real size in cm', pages: [{ id: 'S02', name: 'Deep-zoom viewer', kind: 'viewer', h: 24, desc: 'Full-screen PVF Scan of the work: deep zoom into the super-resolution image, real size, scale bar; opens from the artwork detail.', from: 'P05' }] },
            { id: 'object', label: 'PVF Scan · Flat + Object', hours: 78, tiers: ['F'], services: ['scanstore', 'scanproc'], note: 'Everything in Flat, plus 3D scans of sculptures and objects: a 3D view on the artwork page and automatic renders for cards', pages: [{ id: 'S02', name: 'Deep-zoom viewer', kind: 'viewer', h: 24, desc: 'Full-screen PVF Scan of the work: deep zoom into the super-resolution image, real size, scale bar; opens from the artwork detail.', from: 'P05' }, { id: 'F04', name: 'Artwork 3D view', kind: 'viewer', h: 32, desc: '3D scan of a sculpture or object (Gaussian Splatting): orbit, zoom, renders; opens from the artwork detail.', from: 'P05' }] },
          ],
        },
        {
          id: 'progress', feature: 'scan', dependsOn: 'scan', label: 'Progress of a work over time',
          choices: [
            { id: 'single', label: 'One scan per work', hours: 0, tiers: ['E'], note: 'Nothing extra to build: each work shows its latest scan' },
            { id: 'timeline', label: 'Progress timeline', hours: 20, tiers: ['S', 'F'], note: 'The same work scanned again over time; a slider on the artwork page shows how it changed. For flat works and objects' },
          ],
        },
      ],
    },
    {
      id: 'exhibitions', name: 'Exhibitions & Open-Air Gallery', color: 'lime', hours: 20,
      pages: [
        { id: 'P07', name: 'Exhibitions — overview', kind: 'list', h: 5, to: ['P08', 'P09', 'P10'] },
        { id: 'P08', name: 'Exhibition detail', kind: 'detail', h: 4, to: ['P05', 'P14'] },
        { id: 'P09', name: 'Past exhibitions archive', kind: 'list', h: 3, to: ['P08'] },
        { id: 'P10', name: 'Open-Air Gallery — overview', kind: 'list', h: 4, to: ['P11'] },
        { id: 'P11', name: 'Open-Air work detail', kind: 'detail', h: 4, to: ['P03'] },
      ],
      decisions: [
        {
          id: 'park', feature: 'exhibits', label: 'Park map: the outdoor territory',
          choices: [
            { id: 'static', label: 'Static masterplan image', hours: 2, tiers: ['E'] },
            { id: '2d', label: 'Interactive 2D masterplan', hours: 42, tiers: ['S'], pages: [{ id: 'S01', name: 'LOCO Park masterplan', kind: 'map', h: 42, desc: 'Interactive 2D LOCO Park masterplan: buildings and art objects linked to exhibitions, works and programs.', from: 'P10' }] },
            {
              id: '3d', label: '2D map + 3D scan of the park with navigation', hours: 152, tiers: ['F'], services: ['splat'],
              note: 'Drone and ground photos become a 3D scan of the park: walk it, routes, works and buildings as points, the 2D map as a fallback',
              pages: [
                { id: 'S01', name: 'LOCO Park masterplan', kind: 'map', h: 42, desc: 'Interactive 2D LOCO Park masterplan: buildings and art objects linked to exhibitions, works and programs.', from: 'P10' },
                { id: 'F01', name: 'LOCO Park in 3D', kind: 'viewer', h: 110, desc: 'Photoreal 3D LOCO Park (Gaussian Splatting) from drone and ground capture, with hotspots to works, artists and programs; 2D fallback on low-end devices.', from: 'S01' },
              ],
            },
          ],
        },
        {
          id: 'ex3d', feature: 'exhibits', label: 'Exhibition halls in 3D',
          choices: [
            { id: 'no', label: 'Photo documentation', hours: 2, tiers: ['E', 'S'], note: 'Installation photos on the exhibition page' },
            { id: 'yes', label: '3D visit of the current exhibition', hours: 26, tiers: ['F'], services: ['scanstore'], note: 'The hall scanned with the show in it; visitors walk it on the exhibition page', pages: [{ id: 'F02', name: 'Exhibition 3D visit', kind: 'viewer', h: 24, desc: '3D visit of one Hall 11 exhibition, linked from the exhibition page.', from: 'P08' }] },
          ],
        },
        {
          id: 'hallhist', feature: 'exhibits', dependsOn: 'ex3d', label: 'Halls over time',
          choices: [
            { id: 'latest', label: 'The current exhibition only', hours: 0, tiers: ['E', 'S', 'F'], note: 'Nothing extra to build: the hall shows the show that is on now' },
            { id: 'timeline', label: 'Every exhibition, on a timeline', hours: 24, tiers: [], services: ['scanstore', 'hallproc'], note: 'Each show is scanned before it closes; a slider in the hall moves from exhibition to exhibition, and the archive becomes walkable' },
          ],
        },
        {
          id: 'qr', label: 'Outdoor works',
          choices: [
            { id: 'no', label: 'No QR codes', hours: 0, tiers: ['E', 'S'], note: 'Nothing extra to build: outdoor works have their pages, wall labels carry no codes' },
            { id: 'qr', label: 'QR code for every work from the CMS', hours: 16, tiers: ['F'] },
          ],
        },
      ],
    },
    {
      id: 'programs', name: 'Programs', color: 'sky', hours: 20,
      pages: [
        { id: 'P12', name: 'Programs — overview', kind: 'list', h: 4, to: ['P13', 'P16'] },
        { id: 'P13', name: 'Programs — full calendar', kind: 'list', h: 5, to: ['P14'] },
        { id: 'P14', name: 'Program detail', kind: 'detail', h: 4, to: ['P15', 'M10'] },
        { id: 'P15', name: 'Program registration', kind: 'form', h: 5, to: ['P37'] },
        { id: 'P16', name: 'Past programs archive', kind: 'list', h: 2, to: ['P14'] },
      ],
      decisions: [],
    },
    {
      id: 'calls', name: 'Open Calls', color: 'yellow', hours: 22,
      pages: [
        { id: 'P17', name: 'Open Calls — active call', kind: 'home', h: 5, to: ['P19', 'P21'] },
        { id: 'P18', name: 'Open Calls — no active call', kind: 'state', h: 1, to: [] },
        { id: 'P19', name: 'Open Call detail', kind: 'detail', h: 4, to: ['P20'] },
        { id: 'P20', name: 'Open Call application', kind: 'form', h: 9, to: ['P37'] },
        { id: 'P21', name: 'Open Calls archive', kind: 'list', h: 3, to: [] },
      ],
      decisions: [],
    },
    {
      id: 'studios', name: 'Artist Studios', color: 'pink', hours: 16,
      pages: [
        { id: 'P22', name: 'Apply for a Studio', kind: 'detail', h: 6, to: ['P23', 'P24', 'P25'] },
        { id: 'P23', name: 'Floor plans viewer', kind: 'viewer', h: 4, to: [] },
        { id: 'P24', name: 'Studio application', kind: 'form', h: 6, to: ['P37'] },
      ],
decisions: [
        {
          id: 'studio3d', feature: 'studios', label: 'Studios in 3D',
          choices: [
            { id: 'plans', label: 'Floor plans only', hours: 0, tiers: ['E', 'S', 'F'], note: 'Nothing extra to build: the floor plans viewer is already one of the screens' },
            { id: 'scan', label: '3D scan of every studio', hours: 34, tiers: [], services: ['scanstore', 'studioproc'], note: 'Each studio scanned empty, so applicants can walk it before they apply', pages: [{ id: 'F05', name: 'Studio 3D view', kind: 'viewer', h: 24, desc: 'Walk an empty studio in 3D: size, light, walls, doors; opens from the studio page.', from: 'P22' }] },
          ],
        },
        {
          id: 'studiohist', feature: 'studios', dependsOn: 'studio3d', label: 'Studios over time',
          choices: [
            { id: 'latest', label: 'The empty studio only', hours: 0, tiers: ['E', 'S', 'F'], note: 'Nothing extra to build: one scan per studio' },
            { id: 'timeline', label: 'From artist to artist, on a timeline', hours: 16, tiers: [], services: ['studioproc'], note: 'The studio is scanned when an artist moves in and when they leave; a slider shows how each resident made it their own' },
          ],
        },
      ],
    },
    {
      id: 'membership', name: 'Membership & payments', color: 'orange', hours: 32,
      note: 'Online payment via Bank of Georgia or TBC; access codes for studio residents and partners. Bank fees per LOCO’s merchant agreement.',
      pages: [
        { id: 'P25', name: 'Membership', kind: 'detail', h: 5, to: ['P26', 'P27'] },
        { id: 'P26', name: 'Join membership / checkout', kind: 'form', h: 11, to: ['P28'] },
        { id: 'P27', name: 'Activate access code', kind: 'form', h: 12, to: ['M04'] },
        { id: 'P28', name: 'Payment result', kind: 'state', h: 4, to: ['M04'] },
      ],
      decisions: [
        {
          id: 'billing', label: 'Membership billing',
          choices: [
            { id: 'once', label: 'One-time payment + expiry reminders', hours: 6, tiers: ['E', 'S'], note: 'Member renews manually' },
            { id: 'recurring', label: 'Recurring auto-renewal', hours: 30, tiers: ['F'], note: 'Retries, card change', pages: [{ id: 'F03', name: 'Manage subscription', kind: 'form', h: 24, desc: 'Recurring membership: auto-renewal, retries and card change in the member account.', from: 'M11' }] },
          ],
        },
      ],
    },
    {
      id: 'tours', name: 'Art Tours', color: 'green', hours: 6,
      pages: [
        { id: 'P29', name: 'Art Tours', kind: 'detail', h: 3, to: ['P30'] },
        { id: 'P30', name: 'Request a Tour', kind: 'form', h: 3, to: ['P37'] },
      ],
      decisions: [],
    },
    {
      id: 'about', name: 'About, Partners & Sponsors', color: 'lime', hours: 6,
      pages: [
        { id: 'P31', name: 'About', kind: 'text', h: 3, to: ['P32'] },
        { id: 'P32', name: 'Partners & Sponsors', kind: 'list', h: 3, to: ['P33'] },
      ],
      decisions: [],
    },
    {
      id: 'utility', name: 'Search, contact & utility pages', color: 'sky', hours: 16, services: ['email', 'newsletter'],
      pages: [
        { id: 'P33', name: 'Collaborate / Contact', kind: 'form', h: 6, to: ['P37'] },
        { id: 'P34', name: 'Search results', kind: 'list', h: 4, to: [] },
        { id: 'P35', name: 'Legal page template', kind: 'text', h: 2, to: [] },
        { id: 'P36', name: '404 / error', kind: 'state', h: 1, to: ['P01'] },
        { id: 'P37', name: 'Form confirmation', kind: 'state', h: 3, to: [] },
      ],
      decisions: [
        {
          id: 'search', label: 'Search engine',
          choices: [
            { id: 'basic', label: 'CMS database search', hours: 4, tiers: [], note: 'No typo tolerance, no instant results' },
            { id: 'meili', label: 'Meilisearch, EN + GE indexes', hours: 12, tiers: ['E', 'S', 'F'], note: 'Self-hosted on the same server' },
          ],
        },
      ],
    },
    {
      id: 'myloco', name: 'My LOCO — member area', color: 'yellow', hours: 22,
      pages: [
        { id: 'M01', name: 'Sign in', kind: 'form', h: 3, to: ['M04'] },
        { id: 'M02', name: 'Create account', kind: 'form', h: 3, to: ['M04'] },
        { id: 'M03', name: 'Password reset', kind: 'form', h: 2, to: ['M01'] },
        { id: 'M04', name: 'My LOCO — dashboard', kind: 'dash', h: 4, to: ['M05', 'M06', 'M07', 'M09', 'M11'] },
        { id: 'M05', name: 'Registrations & applications', kind: 'list', h: 2, to: [] },
        { id: 'M06', name: 'Benefits & discounts', kind: 'list', h: 1, to: [] },
        { id: 'M07', name: 'Opportunities database', kind: 'list', h: 2, to: ['M08'] },
        { id: 'M08', name: 'Opportunity detail', kind: 'detail', h: 1, to: [] },
        { id: 'M09', name: 'Video archive', kind: 'list', h: 1, to: ['M10'] },
        { id: 'M10', name: 'Video page', kind: 'viewer', h: 1, to: [] },
        { id: 'M11', name: 'Account & membership', kind: 'form', h: 1, to: [] },
        { id: 'M12', name: 'Locked content gate', kind: 'state', h: 1, to: ['P26'] },
      ],
      decisions: [
        {
          id: 'video', label: 'Video hosting',
          choices: [
            { id: 'yt', label: 'Unlisted YouTube', hours: 4, tiers: [], note: 'Links can be shared; no member-only protection' },
            { id: 'mux', label: 'Mux with signed playback', hours: 12, tiers: ['E', 'S', 'F'], services: ['mux'], note: 'Playback only for active members' },
          ],
        },
      ],
    },
    {
      id: 'cms', name: 'CMS & administration', color: 'pink', hours: 28,
      note: 'Payload CMS on PostgreSQL: structured templates, roles, drafts, scheduled publishing, version history.',
      pages: [],
      decisions: [
        {
          id: 'reporting', label: 'Reporting',
          choices: [
            { id: 'no', label: 'CSV exports', hours: 6, tiers: ['E'], note: 'Members, payments and submissions exported from the CMS' },
            { id: 'dash', label: 'Admin reporting dashboard', hours: 34, tiers: ['S', 'F'] },
          ],
        },
      ],
    },
    {
      id: 'lang', name: 'Languages', color: 'orange', hours: 0, services: ['ai'],
      pages: [],
      decisions: [
        {
          id: 'translation', label: 'EN / GE translation',
          choices: [
            { id: 'ai', label: 'AI draft + manual override', hours: 14, tiers: ['E'] },
            { id: 'review', label: 'AI draft → in review → approved', hours: 34, tiers: ['S', 'F'] },
          ],
        },
      ],
    },
    {
      id: 'design', name: 'Design & motion', color: 'green', hours: 0,
      pages: [],
      decisions: [
        {
          id: 'concepts', label: 'Visual design',
          choices: [
            { id: 'one', label: '1 concept + UI kit', hours: 32, tiers: ['E'] },
            { id: 'many', label: '2–3 concepts + documented design system', hours: 76, tiers: ['S', 'F'] },
          ],
        },
        {
          id: 'motion', label: 'Motion',
          choices: [
            { id: 'base', label: 'Base motion', hours: 8, tiers: ['E'] },
            { id: 'micro', label: 'Micro-interactions', hours: 32, tiers: ['S'] },
            { id: 'premium', label: 'Premium: card-to-detail, kinetic logo, custom cursor, scroll hero', hours: 48, tiers: ['F'] },
          ],
        },
      ],
    },
    {
      id: 'delivery', name: 'Delivery & support', color: 'lime', hours: 46, services: ['hosting'],
      note: 'Repository, CI, staging, hosting, SEO, analytics, cookie consent, QA, accessibility, documentation, CMS training.',
      pages: [],
      decisions: [
        {
          id: 'who', feature: 'shared', dependsOnAny: ['artworks.scan', 'exhibitions.ex3d', 'exhibitions.park=3d', 'studios.studio3d'], label: 'Who scans',
          choices: [
            { id: 'team', label: 'LOCO team', hours: 6, tiers: ['E', 'S', 'F'], note: 'We train 1–2 people from the LOCO team: preparing the session, a full run-through on their works, a demo of the result on the site' },
            { id: 'members', label: 'Team + community members', hours: 20, tiers: [], note: 'The team training, plus a membership feature: members scan their own works and upload them from My LOCO, within a monthly quota or at a price per scan' },
          ],
        },
        {
          id: 'proc', feature: 'shared', dependsOnAny: ['artworks.scan', 'exhibitions.ex3d', 'exhibitions.park=3d', 'studios.studio3d'], label: 'Processing and storage',
          choices: [
            { id: 'cloud', label: 'Cloud', hours: 6, tiers: ['E', 'S', 'F'], services: ['scansrc'], note: 'Storage buckets, the processing queue, the CDN and private links set up in the cloud; pay per processed work' },
            { id: 'hybrid', label: 'Hybrid: PC + NAS in the residence, results in the cloud', hours: 40, tiers: [], oneTime: true, services: ['scanbackup'], note: 'Sources and processing for every scan (works, park, halls, studios) stay in the residence; only the results go to the cloud for the site and members' },
          ],
        },
        {
          id: 'support', label: 'Support after launch',
          choices: [
            { id: '30', label: '10 h over 6 months', hours: 10, tiers: ['E'] },
            { id: '60', label: '30 h over 6 months', hours: 30, tiers: ['S'] },
            { id: '90', label: '40 h over 6 months', hours: 40, tiers: ['F'] },
          ],
        },
      ],
    },
  ],
};

// One-line summary of what each screen is for (slide headline under the name).
window.LOCO_DATA.summaries = {
  P01: 'Front door of LOCO Arts: what is on now and where to go next.',
  P02: 'Find any LOCO artist by name or category.',
  P03: 'Everything about one artist in one place.',
  P04: 'Browse and filter all artworks from Artwork Archive.',
  P05: 'One artwork with its details and a way to ask about it.',
  P06: 'Short inquiry form for an artwork.',
  P07: 'What is on now, what is coming and what has been.',
  P08: 'One exhibition with its artists, works and programs.',
  P09: 'All past exhibitions, filterable.',
  P10: 'The Open-Air Gallery in the park.',
  P11: 'One outdoor work; target of its QR code.',
  P12: 'All program types and what is coming up.',
  P13: 'Date-led calendar of every program.',
  P14: 'One program with everything needed to sign up.',
  P15: 'Registration with live availability.',
  P16: 'Archive of past programs.',
  P17: 'The current open call, front and centre.',
  P18: 'What visitors see when no call is open.',
  P19: 'Full terms of one open call.',
  P20: 'Application with document uploads.',
  P21: 'Previous calls and their results.',
  P22: 'Why and how to rent a studio at LOCO.',
  P23: 'Studio floor plans with zoom and download.',
  P24: 'Step-by-step studio application.',
  P25: 'What membership gives and how to join.',
  P26: 'Create an account and pay online.',
  P27: 'Join with a code from a studio or partner.',
  P28: 'Payment succeeded or failed.',
  P29: 'Guided tours of LOCO Park and its art.',
  P30: 'Request a tour for a group.',
  P31: 'Who LOCO Arts is and what it does.',
  P32: 'Partners and sponsors, grouped.',
  P33: 'Ways to work with LOCO and get in touch.',
  P34: 'Results from one search across the whole site.',
  P35: 'Template for every legal page.',
  P36: 'Branded error page.',
  P37: 'Thank-you state after any form.',
  M01: 'Sign in to My LOCO.',
  M02: 'Create a member account.',
  M03: 'Reset a forgotten password.',
  M04: 'Member home: status, plans and news.',
  M05: 'Everything the member has signed up for.',
  M06: 'Perks that come with membership.',
  M07: 'Members-only opportunities from outside LOCO.',
  M08: 'One opportunity in full.',
  M09: 'Library of recorded talks and programs.',
  M10: 'Watch one recording.',
  M11: 'Profile, membership period and payments.',
  M12: 'Teaser for non-members with a way to join.',
  S01: 'Interactive map of the park.',
  S02: 'Zoom deep into an artwork image.',
  F01: 'Walk the park in photoreal 3D.',
  F02: 'Walk one Hall 11 exhibition in 3D.',
  F03: 'Manage a recurring membership.',
};
