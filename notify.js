// "Start monitoring free": sends the email and the server link to our own test service, which emails a
// link to confirm. Nothing runs until that link is clicked.
(() => {
  const API = 'https://api.qamcp.dev/api/monitors';
  for (const form of document.querySelectorAll('form.notify')) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button'), msg = form.parentElement.querySelector('.notify-msg');
      const email = form.querySelector('[name=email]').value.trim();
      const server = form.querySelector('[name=server]')?.value.trim() || undefined;
      if (!server) { msg.textContent = 'Add your server link, like https://your-server.com/mcp'; return; }
      btn.disabled = true;
      msg.textContent = 'Starting…';
      try {
        const res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, server }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { try { window.posthog?.capture('monitor_signup_failed'); } catch {} throw new Error(data.error || 'Something went wrong. Please try again.'); }
        try { window.posthog?.capture('monitor_signup_submitted'); } catch {}
        form.hidden = true;
        msg.textContent = 'Check your email: click the link and monitoring starts.';
        msg.classList.add('ok');
      } catch (err) {
        try { window.posthog?.capture('monitor_signup_failed'); } catch {}
        msg.textContent = err.message === 'Failed to fetch' ? 'Could not reach QAmcp. Please try again in a minute.' : err.message;
        btn.disabled = false;
      }
    });
  }
})();
