export function renderNav(active: 'log' | 'stats'): string {
  return `
    <nav class="site-nav">
      <a href="/index.html" ${active === 'log' ? 'aria-current="page"' : ''}>Log time</a>
      <a href="/stats.html" ${active === 'stats' ? 'aria-current="page"' : ''}>Stats</a>
    </nav>
  `
}
