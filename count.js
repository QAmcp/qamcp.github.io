// Visit counter: tells our own test service which page was opened and which site sent the visitor
// (just its name, like "x.com"). No cookies, nothing stored in the browser, nothing about the person.
(() => {
  if (!/^qamcp\.github\.io$/.test(location.hostname)) return; // not on this computer or in previews
  let ref = '';
  try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
  const from = new URLSearchParams(location.search).get('from') || undefined;
  const body = JSON.stringify({ page: location.pathname, ref, from });
  try {
    // text/plain needs no extra round trip to ask permission first
    navigator.sendBeacon('https://qamcp-production.up.railway.app/api/visits', new Blob([body], { type: 'text/plain' }));
  } catch (e) {}
})();
