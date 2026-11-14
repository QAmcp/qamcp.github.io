// "Reserve the founding price": saves the email and the team size on our own service, so we can
// email once when Guard is ready to try. No card, nothing else is kept.
(() => {
  const API = 'https://api.qamcp.dev/api/notify';
  for (const form of document.querySelectorAll('form.wl')) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button'), msg = form.parentElement.querySelector('.wl-msg');
      const email = form.querySelector('[name=email]').value.trim();
      const size = form.querySelector('[name=size]').value;
      btn.disabled = true;
      msg.textContent = 'Saving…';
      try {
        const res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, page: 'guard-' + size }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
        try { window.posthog?.capture('guard_waitlist_joined', { size }); } catch {}
        form.hidden = true;
        msg.textContent = "You're on the list. We'll email you once when Guard is ready to try.";
      } catch (err) {
        msg.textContent = err.message === 'Failed to fetch' ? 'Could not reach QAmcp. Please try again in a minute.' : err.message;
        btn.disabled = false;
      }
    });
  }
})();
