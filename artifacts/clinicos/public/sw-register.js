// Registers the MERUNA service worker. Kept as an external file (not inline
// in index.html) so the CSP can stay script-src 'self' without unsafe-inline.
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
