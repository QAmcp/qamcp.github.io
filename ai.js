// "Test with your AI": copies a one-line prompt that points a coding agent at /setup.md, and shows
// what to do with it. Nothing is sent anywhere.
(() => {
  const PROMPT = 'Fetch and follow the instructions at https://qamcp.dev/setup.md to test my MCP server.';
  for (const box of document.querySelectorAll('.ai')) {
    const btn = box.querySelector('.ai-btn'), pop = box.querySelector('.ai-pop'), head = pop.querySelector('b');
    const close = () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!pop.hidden) return close();
      let copied = false;
      try { await navigator.clipboard.writeText(PROMPT); copied = true; } catch (err) {}
      head.textContent = copied ? 'Copied. Paste it into Claude Code, Cursor or Codex:' : 'Copy this and paste it into Claude Code, Cursor or Codex:';
      pop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    });
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }
})();
