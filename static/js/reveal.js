(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SELECTORS = [
    '.premier-img', '.premier-text',
    '.section-header-row', '.exhibition-intro-row', '.exhibition-card',
    '.japanese-text', '.japanese-img', '.lives-text', '.img-cinema',
    '.podcast-row',
    '.archive-band', '.archive-side-label', '.archive-cards-panel',
    '.future-teaser-card',
    '.section-sub',
    /* Страница отдельной выставки (exhibition.html) — раньше сюда
       reveal.js вообще не заглядывал, отсюда полное отсутствие анимаций
       на /exhibition/<slug>. */
    '.concept-block', '.artist-block', '.plan-visit-header',
    '.slot-grid', '.interaction-card'
  ];
  var targets = document.querySelectorAll(SELECTORS.join(','));
  if (!targets.length) return;

  var groupCounts = new Map();
  targets.forEach(function (el) {
    el.classList.add('reveal');
    var parent = el.parentElement;
    var siblingIndex = groupCounts.get(parent) || 0;
    groupCounts.set(parent, siblingIndex + 1);
    el.style.transitionDelay = Math.min(siblingIndex * 90, 360) + 'ms';
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(function (el) { observer.observe(el); });
})();
