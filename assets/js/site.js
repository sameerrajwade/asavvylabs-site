// Chore League site — the only runtime script: the light/dark toggle.
(function () {
  var btn = document.getElementById('themeToggle');
  if (!btn) return;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function effective() {
    var t = document.documentElement.getAttribute('data-theme');
    return t || (mq.matches ? 'dark' : 'light');
  }
  function render() {
    var mode = effective();
    btn.dataset.mode = mode;
    btn.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
  }
  render();
  mq.addEventListener && mq.addEventListener('change', render);
  btn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('cl-theme', next); } catch (e) { /* ignore */ }
    render();
  });
})();
