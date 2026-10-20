// "Test your server": starts a test on the QAmcp test service and fills in the certificate live.
// Everything shown from the server under test goes in as text, never as HTML.
(() => {
  const $ = (id) => document.getElementById(id);
  const configured = document.querySelector('meta[name="qamcp-api"]')?.content;
  const API = (configured || 'http://localhost:8787').replace(/\/+$/, '');
  // Until the test service is online, the live site shows the one-line command instead of a form
  // that can't work (on this computer it still talks to a local service for trying it out).
  if (!configured && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    const url = document.getElementById('url');
    for (const el of document.querySelectorAll('#form fieldset, #go, #msg')) el.style.display = 'none';
    document.querySelector('#form > p').textContent = 'Paste its link to get the command. Free, and the same checks the website will run.';
    const foot = document.querySelector('.foot');
    if (foot) foot.innerHTML = 'Testing a program on your own computer? Use <code>npx qamcp-cli --stdio "your command"</code>.';
    document.getElementById('soon').hidden = false;
    const cmd = document.getElementById('soon-cmd');
    url.addEventListener('input', () => { cmd.textContent = `npx qamcp-cli ${url.value.trim() || 'https://your-server.com/mcp'}`; });
    document.getElementById('soon-copy').onclick = async (e) => {
      try { await navigator.clipboard.writeText(cmd.textContent); e.target.textContent = 'Copied'; } catch { e.target.textContent = 'Select the command above'; }
      setTimeout(() => (e.target.textContent = 'Copy the command'), 1800);
    };
    document.getElementById('form').addEventListener('submit', (e) => e.preventDefault());
    document.getElementById('rows').replaceChildren();
    return;
  }
  const CHECKS = [
    ['connect', 'Connects'], ['protocol', 'Ready for the newest MCP version'], ['tools', 'Lists its tools'],
    ['descriptions', 'Every tool is described'], ['labels', 'Tools are labeled safe or dangerous'], ['hidden', 'No hidden instructions'],
    ['respond', 'Tools work with good inputs'], ['bad-input', 'Bad inputs give a clean error'], ['chains', 'Tools work together'],
    ['speed', 'Fast enough'], ['leaks', 'No secrets leaked'],
  ];
  const NOT_PUBLIC = new Set(['ai', 'multistep']); // AI checks the free tool doesn't run
  const MARK = { pass: '✓', warn: '!', fail: '✕', skip: '–' };
  const WORD = { pass: 'pass', warn: 'note', fail: 'fail', skip: 'not tested' };
  let busy = false;
  let owner = null; // { url, token } once ownership is proven, for this page visit only

  const say = (text, err) => { $('msg').textContent = text; $('msg').className = err ? 'msg err' : 'msg'; };
  const hostOf = (u) => { try { return new URL(u).host; } catch { return u; } };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function call(path, body) {
    let res;
    try {
      res = await fetch(API + path, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    } catch {
      throw new Error('We could not reach the QAmcp test service. Please try again in a minute.');
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `The test service answered ${res.status}.`);
    return json;
  }

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function resetCert(url) {
    $('state').textContent = 'QAmcp test · starting';
    $('name').textContent = hostOf(url);
    $('host').textContent = url;
    $('num').className = 'n wait'; $('num').innerHTML = '··<small> / 100</small>';
    $('stamp').className = 'stamp wait'; $('stamp').textContent = 'TESTING';
    $('now').textContent = '';
    $('after').hidden = true; $('after').replaceChildren();
    $('rows').replaceChildren(...CHECKS.map(([id, title]) => row(id, title)));
  }

  function row(id, title) {
    const li = el('li', 'wait'); li.dataset.id = id;
    li.append(el('span', 'm', '○'), el('span', '', title), el('span', 't', ''));
    return li;
  }

  function showCheck(e) {
    if (NOT_PUBLIC.has(e.id)) return;
    let li = $('rows').querySelector(`li[data-id="${CSS.escape(e.id)}"]`);
    if (!li) { li = row(e.id, e.title); $('rows').append(li); }
    li.className = e.status === 'skip' ? 'off' : e.status;
    li.children[0].textContent = MARK[e.status] ?? '•';
    li.children[1].textContent = e.title;
    li.children[2].textContent = e.status === 'pass' ? (e.summary === 'All good' ? 'pass' : e.summary) : WORD[e.status] ?? e.status;
  }

  function verdict(r) {
    const cs = r.checks.filter((c) => !NOT_PUBLIC.has(c.id));
    if (r.notScored) return ['NOT SCORED', 'none'];
    if (cs.some((c) => c.status === 'fail')) return ['FAIL', 'fail'];
    if (cs.some((c) => c.status === 'warn')) return ['PASS · WITH NOTES', 'mid'];
    return ['PASS', 'pass'];
  }

  function showResult(r, reportId) {
    const login = /login/i.test(r.notScored || '');
    // Behind a login, "could not connect" is the server asking for a login, not a failure.
    for (const c of r.checks) showCheck(login && c.id === 'connect' && c.status === 'fail' ? { ...c, status: 'skip', title: 'Asks for a login first', summary: '' } : c);
    if (login) { const li = $('rows').querySelector('li[data-id="connect"]'); if (li) li.children[2].textContent = 'needs login'; }
    // Checks that never ran (e.g. behind a login) stay as "not tested".
    for (const li of $('rows').querySelectorAll('li.wait')) { li.className = 'off'; li.children[0].textContent = MARK.skip; li.children[2].textContent = WORD.skip; }
    const [word, cls] = verdict(r);
    $('state').textContent = `QAmcp test · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (r.server?.name) $('name').textContent = r.server.name;
    if (r.notScored) { $('num').className = 'n login'; $('num').textContent = login ? 'needs login' : 'not scored'; }
    else { $('num').className = 'n'; $('num').replaceChildren(String(r.score), el('small', '', ' / 100')); }
    $('stamp').className = `stamp ${cls}`; $('stamp').textContent = word;
    $('now').textContent = r.notScored
      ? (login ? 'It asks for a login first. Choose "It needs a login" and test again to check everything behind it.' : `Not scored: ${r.notScored}. Try again in a minute.`)
      : `${r.coverage.toolsRun} of ${r.coverage.toolsTotal} tools tried, in ${r.testedAs?.safety === 'labeled' ? 'safe' : 'owner'} mode.`;
    const page = `${API}/report/${encodeURIComponent(reportId)}`;
    const open = el('a', 'p', 'Open the full report'); open.href = page; open.target = '_blank'; open.rel = 'noopener';
    const copy = el('button', 's', 'Copy the report link'); copy.type = 'button';
    copy.onclick = async () => { try { await navigator.clipboard.writeText(page); copy.textContent = 'Copied'; } catch { copy.textContent = page; } };
    const again = el('button', 's', 'Test another server'); again.type = 'button';
    again.onclick = () => { $('url').value = ''; $('url').focus(); };
    $('after').replaceChildren(open, copy, again); $('after').hidden = false;
  }

  // Start a test and follow it live until it ends.
  async function runTest(body) {
    resetCert(body.url);
    const { id } = await call('/api/tests', body);
    const st = await call(`/api/tests/${id}`);
    if (st.state === 'queued' && st.position > 1) $('now').textContent = `Waiting in line: ${st.position - 1} test${st.position > 2 ? 's' : ''} ahead of yours.`;
    const end = await new Promise((resolve) => {
      const es = new EventSource(`${API}/api/tests/${id}/events`);
      es.addEventListener('progress', (m) => {
        const e = JSON.parse(m.data);
        $('state').textContent = 'QAmcp test · in progress';
        if (e.kind === 'working') $('now').textContent = e.message + '…';
        else showCheck(e);
      });
      es.addEventListener('end', (m) => { es.close(); resolve(JSON.parse(m.data)); });
      es.onerror = () => { es.close(); resolve(null); };
    });
    const final = end ?? (await call(`/api/tests/${id}`));
    if (final.state !== 'done' || !final.reportId) throw new Error(final.error || 'The test stopped unexpectedly. Please try again.');
    showResult(await call(`/api/reports/${final.reportId}`), final.reportId);
    say('');
  }

  // Login: open the service's sign-in in a new window, wait until it's done, then test.
  async function loginThenTest(url) {
    const win = window.open('', 'qamcp-login', 'width=520,height=720');
    say('Starting the sign-in…');
    let login;
    try { login = await call('/api/logins', { url }); } catch (err) { win?.close(); throw err; }
    if (win) win.location.href = login.loginUrl; else window.open(login.loginUrl, '_blank', 'noopener');
    say('Sign in with your account in the new window. This page continues by itself when you are done.');
    for (let i = 0; i < 150; i++) {
      await sleep(2000);
      const s = await call(`/api/logins/${login.id}`);
      if (s.state === 'ready') { win?.close(); say('Signed in. Testing…'); return runTest({ url, loginId: login.id }); }
      if (s.state === 'failed') { win?.close(); throw new Error(s.reason || 'The sign-in did not complete. Please try again.'); }
    }
    throw new Error('The sign-in took too long. Please try again.');
  }

  // Owner: show the file to put on their site, check it, then test with every tool allowed.
  async function ownerThenTest(url) {
    if (owner?.url === url) return runTest({ url, ownerToken: owner.token, safety: 'owner' });
    const c = await call('/api/owner/challenges', { url });
    const step = $('step');
    step.replaceChildren(
      el('b', '', 'Prove you own it'), el('br'),
      document.createTextNode('Put a file at this address:'), el('code', '', c.fileUrl),
      document.createTextNode('containing exactly:'), el('code', '', c.code),
      document.createTextNode(`Or add a DNS TXT record on ${c.dnsName} with that value.`), el('br'),
    );
    const check = el('button', '', 'I added it, check now'); check.type = 'button';
    step.append(check); step.hidden = false;
    say('');
    return new Promise((resolve, reject) => {
      check.onclick = async () => {
        check.disabled = true; check.textContent = 'Checking…';
        try {
          const v = await call(`/api/owner/challenges/${c.id}/verify`, {});
          if (!v.verified) { check.disabled = false; check.textContent = 'Check again'; say(v.reason || 'We could not find it yet.', true); return; }
          owner = { url, token: v.ownerToken };
          step.hidden = true;
          resolve(runTest({ url, ownerToken: v.ownerToken, safety: 'owner' }));
        } catch (err) { reject(err); }
      };
    });
  }

  $('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (busy) return;
    const url = $('url').value.trim();
    let ok = false;
    try { ok = /^https?:$/.test(new URL(url).protocol); } catch {}
    if (!ok) { say('Paste the full server link, starting with https://', true); $('url').focus(); return; }
    const mode = new FormData($('form')).get('mode');
    busy = true; $('go').disabled = true; $('go').textContent = 'Testing…'; $('step').hidden = true; say('');
    try {
      if (mode === 'login') await loginThenTest(url);
      else if (mode === 'owner') await ownerThenTest(url);
      else await runTest({ url });
    } catch (err) {
      say(err.message, true);
      $('state').textContent = 'QAmcp test · stopped';
      $('stamp').className = 'stamp wait'; $('stamp').textContent = 'NOT TESTED';
    } finally {
      busy = false; $('go').disabled = false; $('go').textContent = 'Test it';
    }
  });

  // Before any test: show the checks that will run.
  $('rows').replaceChildren(...CHECKS.map(([id, title]) => row(id, title)));
  const fromLink = new URLSearchParams(location.search).get('url');
  if (fromLink) $('url').value = fromLink;
})();
