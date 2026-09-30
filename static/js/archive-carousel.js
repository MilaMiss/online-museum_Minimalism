(function () {
  const track = document.querySelector('[data-archive-track]');
  const prevBtn = document.querySelector('[data-archive-prev]');
  const nextBtn = document.querySelector('[data-archive-next]');
  if (!track || !prevBtn || !nextBtn) return;

  function step() {
    const card = track.querySelector('.archive-card');
    if (!card) return track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap || 0);
    return card.getBoundingClientRect().width + gap;
  }

  function maxScroll() {
    return track.scrollWidth - track.clientWidth;
  }

  // Прокрутка по кругу: у конца ленты "next" переносит в начало, у начала
  // "prev" переносит в конец, вместо того чтобы просто упираться в край.
  nextBtn.addEventListener('click', function () {
    if (track.scrollLeft >= maxScroll() - 2) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: step(), behavior: 'smooth' });
    }
  });
  prevBtn.addEventListener('click', function () {
    if (track.scrollLeft <= 2) {
      track.scrollTo({ left: maxScroll(), behavior: 'smooth' });
    } else {
      track.scrollBy({ left: -step(), behavior: 'smooth' });
    }
  });
})();
