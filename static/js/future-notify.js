// "In Future" teaser cards: "Notify me" reuses the real Subscribe form
// at the bottom of the page instead of duplicating an email-capture flow.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-future-notify]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var emailInput = document.getElementById('subscribe-email');
      if (!emailInput) return;
      emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      emailInput.focus({ preventScroll: true });
    });
  });
});
