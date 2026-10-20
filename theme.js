// Theme toggle: follows the visitor's system until they pick one.
(() => {
  const btn = document.getElementById('theme');
  const sysLight = matchMedia('(prefers-color-scheme: light)');
  const current = () => document.documentElement.dataset.theme || (sysLight.matches ? 'light' : 'dark');
  const paint = () => { btn.textContent = current() === 'light' ? 'Dark' : 'Light'; btn.setAttribute('aria-label', 'Switch to ' + btn.textContent.toLowerCase() + ' theme'); };
  btn.onclick = () => { const next = current() === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = next; try { localStorage.setItem('qamcp-theme', next); } catch (e) {} paint(); };
  sysLight.addEventListener('change', paint); paint();
})();
