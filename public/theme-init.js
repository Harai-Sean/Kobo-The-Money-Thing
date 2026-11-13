// Runs before the page paints, so a saved Light/Dark choice never flashes the wrong theme.
try {
  var t = localStorage.getItem('kobo-theme')
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t)
} catch {
  // storage unavailable: the device's own setting applies
}
