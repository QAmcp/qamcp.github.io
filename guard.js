// "Reserve the founding price": saves the email and the team size on our own service, so we can
// email once when Guard is ready to try. No card. After joining, one optional question asks what
// they need most; the answer is saved next to the email, only to decide what to build.
(() => {
  const API = 'https://api.qamcp.dev/api/notify';
  const join = document.getElementById('join'), ask = document.getElementById('ask');
  if (!join) return;
  const msg = join.parentElement.querySelector('.wl-msg'), askMsg = join.parentElement.querySelector('.ask-msg');
  let who; // the email and team size they joined with, so the answer lands on the same entry

  const save = async (body) => {
    const res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  };
  const plain = (err) => (err.message === 'Failed to fetch' ? 'Could not reach QAmcp. Please try again in a minute.' : err.message);

  join.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = join.querySelector('button');
    const email = join.querySelector('[name=email]').value.trim();
    const size = join.querySelector('[name=size]').value;
    btn.disabled = true;
    msg.textContent = 'Saving…';
    try {
      await save({ email, page: 'guard-' + size });
      try { window.posthog?.capture('guard_waitlist_joined', { size }); } catch {}
      who = { email, page: 'guard-' + size };
      join.hidden = true;
      msg.textContent = "You're on the list. We'll email you once when Guard is ready to try.";
      if (ask) ask.hidden = false;
    } catch (err) {
      msg.textContent = plain(err);
      btn.disabled = false;
    }
  });

  ask?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = ask.querySelector('button');
    const needs = [...ask.querySelectorAll('[name=needs]:checked')].map((b) => b.value);
    const note = ask.querySelector('[name=note]').value.trim();
    if (!needs.length && !note) { askMsg.textContent = 'Tick a box or write a line first.'; return; }
    btn.disabled = true;
    askMsg.textContent = 'Saving…';
    try {
      await save({ ...who, needs, note });
      try { window.posthog?.capture('guard_waitlist_answered', { needs: needs.join(','), wrote: !!note }); } catch {}
      ask.hidden = true;
      askMsg.textContent = 'Thank you. That helps us build the right thing.';
    } catch (err) {
      askMsg.textContent = plain(err);
      btn.disabled = false;
    }
  });
})();
