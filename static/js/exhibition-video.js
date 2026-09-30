(function () {
  const modal = document.getElementById('video-modal');
  const player = document.getElementById('video-modal-player');
  const closeBtn = document.getElementById('video-modal-close');
  const errorMsg = document.getElementById('video-modal-error');
  const triggers = document.querySelectorAll('[data-video-play]');
  if (!modal || !player || !closeBtn || !triggers.length) return;

  function showError() {
    player.style.display = 'none';
    errorMsg.style.display = 'block';
  }

  function openModal(src) {
    player.style.display = '';
    errorMsg.style.display = 'none';
    player.src = src;
    modal.classList.add('open');
    document.body.classList.add('video-modal-lock');
    player.play().catch(function () {});
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.classList.remove('video-modal-lock');
    player.pause();
    player.removeAttribute('src');
    player.load();
  }

  player.addEventListener('error', showError);

  triggers.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const src = btn.getAttribute('data-video-src');
      if (!src) {
        showError();
        modal.classList.add('open');
        document.body.classList.add('video-modal-lock');
        return;
      }
      openModal(src);
    });
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();
