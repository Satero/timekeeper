export function renderNav(active: 'log' | 'stats' | 'categories' | 'settings'): string {
  return `
    <nav class="site-nav">
      <a href="/index.html" ${active === 'log' ? 'aria-current="page"' : ''}>Log time</a>
      <a href="/stats.html" ${active === 'stats' ? 'aria-current="page"' : ''}>Stats</a>
      <a href="/categories.html" ${active === 'categories' ? 'aria-current="page"' : ''}>Categories</a>
      <a href="/settings.html" ${active === 'settings' ? 'aria-current="page"' : ''}>Settings</a>
    </nav>
  `
}
