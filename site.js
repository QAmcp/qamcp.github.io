// Shared by the inner pages: the command box (type your link, copy a ready command),
// and copy buttons for code blocks.
const EXAMPLE = 'https://your-server.com/mcp';
for (const b of document.querySelectorAll('.copy[data-copy-from]')) {
  b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(document.getElementById(b.dataset.copyFrom).textContent + '\n'); } catch { return; }
    b.textContent = 'Copied'; b.dataset.done = '';
    setTimeout(() => { b.textContent = 'Copy'; delete b.dataset.done; }, 1800);
  });
}
for (const b of document.querySelectorAll('.copy[data-for]')) {
  b.addEventListener('click', async () => {
    const link = document.getElementById(b.dataset.for).value.trim() || EXAMPLE;
    const extra = b.dataset.extra ? ' ' + b.dataset.extra : '';
    try { await navigator.clipboard.writeText('npx qamcp-cli ' + link + extra); } catch { return; }
    b.textContent = 'Copied'; b.dataset.done = '';
    setTimeout(() => { b.textContent = 'Copy'; delete b.dataset.done; }, 1800);
  });
}
