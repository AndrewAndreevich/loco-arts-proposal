// Reveal motion (word-by-word headings, fade-up blocks) and active section in the nav.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = 'IntersectionObserver' in window;

  if (!reduce && io) {
    document.documentElement.classList.add('js');

    // Split plain-text headings into word spans (spaces stay as text nodes, so the text reads the same).
    document.querySelectorAll('[data-split]').forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach((w, i) => {
        const s = document.createElement('span');
        s.className = 'w';
        s.style.setProperty('--i', i);
        s.textContent = w;
        el.append(s, i < words.length - 1 ? ' ' : '');
      });
    });

    const show = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); show.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal, [data-split]').forEach((el) => show.observe(el));
  }

  // Highlight the current section in the pill nav.
  if (io) {
    const links = [...document.querySelectorAll('.pillnav a')];
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => { a.classList.remove('on'); a.removeAttribute('aria-current'); });
        const a = byId.get(e.target.id);
        if (a) {
          a.classList.add('on'); a.setAttribute('aria-current', 'true');
          const ul = a.closest('ul'); // keep the active pill visible when the nav scrolls sideways
          if (ul.scrollWidth > ul.clientWidth) {
            ul.scrollTo({ left: a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
          }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
    // sections without a nav link (hero, approach) clear the highlight
    document.querySelectorAll('.hero, #approach').forEach((s) => spy.observe(s));
  }
})();
