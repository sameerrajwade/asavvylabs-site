// Runs before first paint (in <head>) so a saved light/dark choice never flashes.
(function () {
  try {
    var t = localStorage.getItem('cl-theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* storage blocked: follow the system theme */ }
})();
