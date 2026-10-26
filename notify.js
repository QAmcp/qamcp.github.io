// "Notify me when Monitor opens": sends the email (and optional server link) to our own test service.
// Nothing else is collected; the address is used once, to say Monitor is open.
(() => {
  const API = 'https://qamcp-production.up.railway.app/api/notify';
  for (const form of document.querySelectorAll('form.notify')) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button'), msg = form.parentElement.querySelector('.notify-msg');
      const email = form.querySelector('[name=email]').value.trim();
      const server = form.querySelector('[name=server]')?.value.trim() || undefined;
      btn.disabled = true;
      msg.textContent = 'Saving…';
      try {
        const res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, server, page: location.pathname }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
        form.hidden = true;
        msg.textContent = "You're on the list. We'll email you once, when Monitor opens.";
        msg.classList.add('ok');
      } catch (err) {
        msg.textContent = err.message === 'Failed to fetch' ? 'Could not reach QAmcp. Please try again in a minute.' : err.message;
        btn.disabled = false;
      }
    });
  }
})();
