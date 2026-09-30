(function () {
  var form = document.getElementById('subscribe-form');
  if (!form) return;

  var input = document.getElementById('subscribe-email');
  var msg = document.getElementById('subscribe-msg');
  var button = form.querySelector('button[type="submit"]');

  function setMessage(text, isError) {
    msg.textContent = text;
    msg.classList.toggle('ok', !isError && !!text);
    msg.classList.toggle('err', !!isError);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setMessage('', false);

    var email = input.value.trim();
    if (!email) {
      setMessage('Please enter your email.', true);
      return;
    }

    button.disabled = true;
    var originalLabel = button.textContent;
    button.textContent = '…';

    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (result.data && result.data.ok) {
          if (result.data.alreadySubscribed) {
            setMessage('You are already subscribed.', false);
          } else {
            setMessage('Thanks! You are subscribed.', false);
            input.value = '';
          }
        } else {
          setMessage((result.data && result.data.error) || 'Something went wrong.', true);
        }
      })
      .catch(function () {
        setMessage('Network error. Please try again.', true);
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = originalLabel;
      });
  });
})();
