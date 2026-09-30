(function () {
  const audio = document.querySelector('[data-podcast-audio]');
  const playBtn = document.querySelector('[data-podcast-play]');
  const seekBar = document.querySelector('[data-podcast-seek]');
  const progress = document.querySelector('[data-podcast-progress]');
  const timeLabel = document.querySelector('[data-podcast-time]');
  if (!audio || !playBtn || !seekBar || !progress || !timeLabel) return;

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function updateProgress() {
    const fraction = audio.duration ? audio.currentTime / audio.duration : 0;
    const hiddenRight = (1 - fraction) * 100;
    progress.style.clipPath = 'inset(0 ' + hiddenRight + '% 0 0)';
    timeLabel.textContent = formatTime(audio.currentTime > 0 ? audio.currentTime : audio.duration);
  }

  audio.addEventListener('loadedmetadata', updateProgress);
  audio.addEventListener('timeupdate', updateProgress);

  audio.addEventListener('play', function () {
    playBtn.innerHTML = '&#10074;&#10074;';
    playBtn.setAttribute('aria-label', 'Pause');
  });
  audio.addEventListener('pause', function () {
    playBtn.innerHTML = '&#9654;';
    playBtn.setAttribute('aria-label', 'Play');
  });
  audio.addEventListener('ended', function () {
    progress.style.width = '0%';
    audio.currentTime = 0;
    updateProgress();
  });

  playBtn.addEventListener('click', function () {
    if (audio.paused) {
      audio.play().catch(function (err) { console.error('podcast play failed', err); });
    } else {
      audio.pause();
    }
  });

  seekBar.addEventListener('click', function (e) {
    if (!audio.duration) return;
    const rect = seekBar.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = fraction * audio.duration;
    updateProgress();
  });
})();
