import './style.css'
import { renderNav } from './nav.ts'
import { getCategories, getEntries, todayISO, formatDuration } from './storage.ts'
import { buildSeries, seriesColorVar, type Series } from './colors.ts'
import { escapeHtml, escapeAttr } from './dom.ts'

const HISTORY_DAYS = 14
const STACK_HEIGHT_PX = 200

interface HistoryDay {
  date: string
  series: Series[]
}

function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function legendItems(categories: string[]): { name: string; colorVar: string }[] {
  const items = categories.slice(0, 8).map((name, index) => ({ name, colorVar: seriesColorVar(index) }))
  if (categories.length > 8) items.push({ name: 'Other', colorVar: 'var(--series-other)' })
  return items
}

function renderLegend(categories: string[]) {
  const legend = document.querySelector<HTMLElement>('#legend')!
  legend.innerHTML = legendItems(categories)
    .map(
      (item) =>
        `<span class="legend-item"><span class="legend-swatch" style="background:${item.colorVar}"></span>${escapeHtml(item.name)}</span>`,
    )
    .join('')
}

function wireTooltips(elements: NodeListOf<Element>, textFor: (el: HTMLElement) => string) {
  const tooltip = document.querySelector<HTMLElement>('#tooltip')!
  elements.forEach((element) => {
    const el = element as HTMLElement
    const show = () => {
      tooltip.textContent = textFor(el)
      tooltip.hidden = false
      const rect = el.getBoundingClientRect()
      tooltip.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`
      tooltip.style.top = `${rect.top + window.scrollY - 8}px`
    }
    const hide = () => {
      tooltip.hidden = true
    }
    el.addEventListener('pointerenter', show)
    el.addEventListener('pointerleave', hide)
    el.addEventListener('focus', show)
    el.addEventListener('blur', hide)
  })
}

function renderTodayChart(series: Series[]) {
  const container = document.querySelector<HTMLElement>('#today-chart')!
  const emptyState = document.querySelector<HTMLElement>('#today-empty')!
  const total = series.reduce((sum, s) => sum + s.minutes, 0)

  if (total === 0) {
    container.hidden = true
    emptyState.hidden = false
    return
  }
  container.hidden = false
  emptyState.hidden = true

  const max = Math.max(...series.map((s) => s.minutes), 1)
  container.innerHTML = series
    .map((s) => {
      const pct = Math.round((s.minutes / max) * 100)
      return `
        <div class="hbar-row" tabindex="0" data-name="${escapeAttr(s.name)}" data-minutes="${s.minutes}">
          <span class="hbar-label">${escapeHtml(s.name)}</span>
          <div class="hbar-track">
            <div class="hbar-fill" style="width:${pct}%; background:${s.colorVar}"></div>
          </div>
          <span class="hbar-value">${formatDuration(s.minutes)}</span>
        </div>
      `
    })
    .join('')

  wireTooltips(container.querySelectorAll('.hbar-row'), (el) => `${el.dataset.name}: ${formatDuration(Number(el.dataset.minutes))}`)
}

function renderTodayTable(series: Series[]) {
  const table = document.querySelector<HTMLElement>('#today-table')!
  table.innerHTML = `
    <thead><tr><th>Category</th><th>Time</th></tr></thead>
    <tbody>
      ${series.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${formatDuration(s.minutes)}</td></tr>`).join('')}
    </tbody>
  `
}

function renderHistoryChart(days: HistoryDay[]) {
  const container = document.querySelector<HTMLElement>('#history-chart')!
  const emptyState = document.querySelector<HTMLElement>('#history-empty')!

  if (days.length === 0) {
    container.hidden = true
    emptyState.hidden = false
    return
  }
  container.hidden = false
  emptyState.hidden = true

  const dayTotals = days.map((day) => day.series.reduce((sum, s) => sum + s.minutes, 0))
  const max = Math.max(...dayTotals, 1)

  container.innerHTML = days
    .map((day) => {
      const segments = day.series
        .filter((s) => s.minutes > 0)
        .map((s) => {
          const heightPx = Math.round((s.minutes / max) * STACK_HEIGHT_PX)
          return `<div class="vbar-segment" style="height:${heightPx}px; background:${s.colorVar}" tabindex="0" data-name="${escapeAttr(s.name)}" data-minutes="${s.minutes}" data-date="${day.date}"></div>`
        })
        .join('')
      return `
        <div class="vbar-day">
          <div class="vbar-stack" style="height:${STACK_HEIGHT_PX}px">${segments}</div>
          <span class="vbar-date">${formatShortDate(day.date)}</span>
        </div>
      `
    })
    .join('')

  wireTooltips(
    container.querySelectorAll('.vbar-segment'),
    (el) => `${formatShortDate(el.dataset.date!)} · ${el.dataset.name}: ${formatDuration(Number(el.dataset.minutes))}`,
  )
}

function renderHistoryTable(days: HistoryDay[], categories: string[]) {
  const table = document.querySelector<HTMLElement>('#history-table')!
  const names = legendItems(categories).map((item) => item.name)
  table.innerHTML = `
    <thead><tr><th>Date</th>${names.map((n) => `<th>${escapeHtml(n)}</th>`).join('')}</tr></thead>
    <tbody>
      ${days
        .map((day) => {
          const byName = Object.fromEntries(day.series.map((s) => [s.name, s.minutes]))
          return `<tr><td>${formatShortDate(day.date)}</td>${names.map((n) => `<td>${formatDuration(byName[n] ?? 0)}</td>`).join('')}</tr>`
        })
        .join('')}
    </tbody>
  `
}

function wireTableToggles() {
  document.querySelectorAll<HTMLButtonElement>('.table-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.target!)!
      const willShow = target.hidden
      target.hidden = !willShow
      button.textContent = willShow ? 'Hide table' : 'Show table'
    })
  })
}

const app = document.querySelector<HTMLDivElement>('#app')!
const categories = getCategories()
const entries = getEntries()

app.innerHTML = `
  ${renderNav('stats')}
  <section id="stats-page">
    <h1>Stats</h1>

    <div class="chart-card">
      <div class="chart-card-header">
        <h2>Today's breakdown</h2>
        <button type="button" class="table-toggle" data-target="today-table">Show table</button>
      </div>
      <div id="today-chart" class="hbar-chart"></div>
      <p id="today-empty" class="empty-state" hidden>No time logged yet today — head to Log time to add some.</p>
      <table id="today-table" class="data-table" hidden></table>
    </div>

    <div class="chart-card">
      <div class="chart-card-header">
        <h2>History (last ${HISTORY_DAYS} days)</h2>
        <button type="button" class="table-toggle" data-target="history-table">Show table</button>
      </div>
      <div id="history-chart" class="vbar-chart"></div>
      <p id="history-empty" class="empty-state" hidden>No history yet.</p>
      <table id="history-table" class="data-table" hidden></table>
    </div>

    <div id="legend" class="legend"></div>
  </section>
  <div id="tooltip" class="chart-tooltip" role="tooltip" hidden></div>
`

const todaySeries = buildSeries(categories, entries[todayISO()] ?? {})
const historyDays: HistoryDay[] = Object.keys(entries)
  .filter((date) => Object.values(entries[date]).some((minutes) => minutes > 0))
  .sort()
  .slice(-HISTORY_DAYS)
  .map((date) => ({ date, series: buildSeries(categories, entries[date]) }))

renderLegend(categories)
renderTodayChart(todaySeries)
renderTodayTable(todaySeries)
renderHistoryChart(historyDays)
renderHistoryTable(historyDays, categories)
wireTableToggles()
