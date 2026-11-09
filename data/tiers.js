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
 * Check: Essential 400 h / 49 screens, Signature 600 h / 51, Flagship 800 h / 54.
 */
window.LOCO_DATA = {
  rate: 30,
  hoursPerWeek: 70,
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
      id: 'artworks', name: 'Artworks', color: 'green', hours: 14, services: ['storage'],
      pages: [
        { id: 'P04', name: 'Artworks — catalogue', kind: 'list', h: 6, to: ['P05'] },
        { id: 'P05', name: 'Artwork detail', kind: 'detail', h: 5, to: ['P06'] },
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
        {
          id: 'viewer', label: 'Artwork viewer',
          choices: [
            { id: 'std', label: 'Image gallery', hours: 0, tiers: ['E'] },
            { id: 'zoom', label: 'Deep-zoom viewer', hours: 24, tiers: ['S', 'F'], pages: [{ id: 'S02', name: 'Deep-zoom viewer', kind: 'viewer', h: 24, desc: 'Full-screen artwork view with deep zoom into high-resolution images; opens from the artwork detail.', from: 'P05' }] },
          ],
        },
      ],
    },
    {
      id: 'exhibitions', name: 'Exhibitions & Open-Air Gallery', color: 'lime', hours: 22,
      pages: [
        { id: 'P07', name: 'Exhibitions — overview', kind: 'list', h: 5, to: ['P08', 'P09', 'P10'] },
        { id: 'P08', name: 'Exhibition detail', kind: 'detail', h: 6, to: ['P05', 'P14'] },
        { id: 'P09', name: 'Past exhibitions archive', kind: 'list', h: 3, to: ['P08'] },
        { id: 'P10', name: 'Open-Air Gallery — overview', kind: 'list', h: 4, to: ['P11'] },
        { id: 'P11', name: 'Open-Air work detail', kind: 'detail', h: 4, to: ['P03'] },
      ],
      decisions: [
        {
          id: 'park', label: 'LOCO Park map',
          choices: [
            { id: 'static', label: 'Static masterplan image', hours: 2, tiers: ['E'] },
            { id: '2d', label: 'Interactive 2D masterplan', hours: 42, tiers: ['S'], pages: [{ id: 'S01', name: 'LOCO Park masterplan', kind: 'map', h: 42, desc: 'Interactive 2D LOCO Park masterplan: buildings and art objects linked to exhibitions, works and programs.', from: 'P10' }] },
            {
              id: '3d', label: '2D masterplan + 3D park (Gaussian Splatting)', hours: 152, tiers: ['F'], services: ['splat'],
              note: 'Drone and ground capture, processing, web viewer, hotspots, 2D fallback',
              pages: [
                { id: 'S01', name: 'LOCO Park masterplan', kind: 'map', h: 42, desc: 'Interactive 2D LOCO Park masterplan: buildings and art objects linked to exhibitions, works and programs.', from: 'P10' },
                { id: 'F01', name: 'LOCO Park in 3D', kind: 'viewer', h: 110, desc: 'Photoreal 3D LOCO Park (Gaussian Splatting) from drone and ground capture, with hotspots to works, artists and programs; 2D fallback on low-end devices.', from: 'S01' },
              ],
            },
          ],
        },
        {
          id: 'ex3d', label: 'Hall 11 exhibition in 3D',
          choices: [
            { id: 'no', label: 'Photo documentation', hours: 0, tiers: ['E', 'S'] },
            { id: 'yes', label: '3D visit of one exhibition', hours: 24, tiers: ['F'], pages: [{ id: 'F02', name: 'Exhibition 3D visit', kind: 'viewer', h: 24, desc: '3D visit of one Hall 11 exhibition, linked from the exhibition page.', from: 'P08' }] },
          ],
        },
        {
          id: 'qr', label: 'Outdoor works',
          choices: [
            { id: 'no', label: 'Work pages only', hours: 0, tiers: ['E', 'S'] },
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
      decisions: [],
    },
    {
      id: 'membership', name: 'Membership & payments', color: 'orange', hours: 38,
      note: 'Online payment via Bank of Georgia or TBC; access codes for studio residents and partners. Bank fees per LOCO’s merchant agreement.',
      pages: [
        { id: 'P25', name: 'Membership', kind: 'detail', h: 5, to: ['P26', 'P27'] },
        { id: 'P26', name: 'Join membership / checkout', kind: 'form', h: 17, to: ['P28'] },
        { id: 'P27', name: 'Activate access code', kind: 'form', h: 12, to: ['M04'] },
        { id: 'P28', name: 'Payment result', kind: 'state', h: 4, to: ['M04'] },
      ],
      decisions: [
        {
          id: 'billing', label: 'Membership billing',
          choices: [
            { id: 'once', label: 'One-time payment + expiry reminders', hours: 0, tiers: ['E', 'S'], note: 'Member renews manually' },
            { id: 'recurring', label: 'Recurring auto-renewal', hours: 24, tiers: ['F'], note: 'Retries, card change', pages: [{ id: 'F03', name: 'Manage subscription', kind: 'form', h: 24, desc: 'Recurring membership: auto-renewal, retries and card change in the member account.', from: 'M11' }] },
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
      id: 'cms', name: 'CMS & administration', color: 'pink', hours: 34,
      note: 'Payload CMS on PostgreSQL: structured templates, roles, drafts, scheduled publishing, version history.',
      pages: [],
      decisions: [
        {
          id: 'reporting', label: 'Reporting',
          choices: [
            { id: 'no', label: 'CSV exports', hours: 0, tiers: ['E'] },
            { id: 'dash', label: 'Admin reporting dashboard', hours: 28, tiers: ['S', 'F'] },
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
          id: 'support', label: 'Support after launch',
          choices: [
            { id: '30', label: '30 days', hours: 10, tiers: ['E'] },
            { id: '60', label: '60 days', hours: 30, tiers: ['S'] },
            { id: '90', label: '90 days', hours: 40, tiers: ['F'] },
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
