import './style.css'
import { renderNav } from './nav.ts'
import { getCategories, saveCategories, getEntries, saveEntries, todayISO, formatDuration } from './storage.ts'
import { escapeHtml, escapeAttr } from './dom.ts'

const app = document.querySelector<HTMLDivElement>('#app')!
let currentDate = todayISO()

type FormValues = Record<string, { hours: number; minutes: number }>

function getFormValues(): FormValues {
  const values: FormValues = {}
  document.querySelectorAll<HTMLElement>('.category-row').forEach((row) => {
    const category = categoryNameFromRow(row)
    values[category] = {
      hours: Number((row.querySelector('.hours-input') as HTMLInputElement).value) || 0,
      minutes: Number((row.querySelector('.minutes-input') as HTMLInputElement).value) || 0,
    }
  })
  return values
}

function render(preservedValues?: FormValues) {
  const categories = getCategories()
  const entries = getEntries()
  const todayEntry = entries[currentDate] ?? {}

  app.innerHTML = `
    ${renderNav('log')}
    <section id="center">
      <div>
        <h1>Timekeeper</h1>
        <p>How much time did you spend on each category today?</p>
      </div>
      <form id="log-form" class="log-form">
        <div class="category-rows">
          ${categories
            .map((category, index) => {
              const preserved = preservedValues?.[category]
              const minutes = preserved
                ? preserved.hours * 60 + preserved.minutes
                : (todayEntry[category] ?? 0)
              const hours = Math.floor(minutes / 60)
              const mins = minutes % 60
              return `
                <div class="category-row" data-category="${escapeAttr(category)}">
                  <div class="reorder-controls">
                    <button type="button" class="move-category up" data-category="${escapeAttr(category)}" aria-label="Move ${escapeAttr(category)} up" ${index === 0 ? 'disabled' : ''}>&uarr;</button>
                    <button type="button" class="move-category down" data-category="${escapeAttr(category)}" aria-label="Move ${escapeAttr(category)} down" ${index === categories.length - 1 ? 'disabled' : ''}>&darr;</button>
                  </div>
                  <span class="category-name">${escapeHtml(category)}</span>
                  <label class="sr-only" for="hours-${escapeAttr(category)}">Hours</label>
                  <input id="hours-${escapeAttr(category)}" class="hours-input" type="number" min="0" max="23" value="${hours}" />
                  <span class="unit">h</span>
                  <label class="sr-only" for="minutes-${escapeAttr(category)}">Minutes</label>
                  <input id="minutes-${escapeAttr(category)}" class="minutes-input" type="number" min="0" max="59" value="${mins}" />
                  <span class="unit">m</span>
                </div>
              `
            })
            .join('')}
        </div>

        <div class="log-total">
          Total: <span id="total-display">0h 0m</span>
        </div>

        <button type="submit" class="counter save-btn">Save</button>
        <p id="save-confirmation" class="save-confirmation" role="status"></p>
      </form>
    </section>
  `

  wireUp()
  updateTotal()
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

function updateTotal() {
  let totalMinutes = 0
  document.querySelectorAll<HTMLElement>('.category-row').forEach((row) => {
    const hours = Number((row.querySelector('.hours-input') as HTMLInputElement).value) || 0
    const minutes = Number((row.querySelector('.minutes-input') as HTMLInputElement).value) || 0
    totalMinutes += hours * 60 + minutes
  })
  const display = document.querySelector<HTMLElement>('#total-display')!
  display.textContent = formatDuration(totalMinutes)
}

function wireUp() {
  document.querySelectorAll<HTMLInputElement>('.hours-input').forEach((input) => {
    input.addEventListener('input', () => {
      input.value = String(clamp(Number(input.value), 0, 23))
      updateTotal()
    })
  })
  document.querySelectorAll<HTMLInputElement>('.minutes-input').forEach((input) => {
    input.addEventListener('input', () => {
      input.value = String(clamp(Number(input.value), 0, 59))
      updateTotal()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('.move-category').forEach((button) => {
    button.addEventListener('click', () => moveCategory(button))
  })

  document.querySelector<HTMLFormElement>('#log-form')!.addEventListener('submit', (event) => {
    event.preventDefault()
    saveToday()
  })
}

function categoryNameFromRow(row: HTMLElement): string {
  const nameEl = row.querySelector('.category-name')!
  return nameEl.textContent ?? ''
}

function moveCategory(button: HTMLButtonElement) {
  const category = button.dataset.category!
  const direction = button.classList.contains('up') ? -1 : 1
  const categories = getCategories()
  const index = categories.indexOf(category)
  const newIndex = index + direction
  if (index < 0 || newIndex < 0 || newIndex >= categories.length) return

  const reordered = [...categories]
  ;[reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]]
  saveCategories(reordered)
  render(getFormValues())
}

function saveToday() {
  const entries = getEntries()
  const todayEntry: Record<string, number> = {}
  document.querySelectorAll<HTMLElement>('.category-row').forEach((row) => {
    const category = categoryNameFromRow(row)
    const hours = Number((row.querySelector('.hours-input') as HTMLInputElement).value) || 0
    const minutes = Number((row.querySelector('.minutes-input') as HTMLInputElement).value) || 0
    const totalMinutes = hours * 60 + minutes
    if (totalMinutes > 0) todayEntry[category] = totalMinutes
  })
  entries[currentDate] = todayEntry
  saveEntries(entries)

  const confirmation = document.querySelector<HTMLElement>('#save-confirmation')!
  confirmation.textContent = 'Saved.'
  window.setTimeout(() => {
    confirmation.textContent = ''
  }, 2000)
}

function scheduleMidnightRollover() {
  const now = new Date()
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  const msUntilMidnight = nextMidnight.getTime() - now.getTime()
  window.setTimeout(() => {
    currentDate = todayISO()
    render()
    scheduleMidnightRollover()
  }, msUntilMidnight)
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayISO() !== currentDate) {
    currentDate = todayISO()
    render()
  }
})

render()
scheduleMidnightRollover()
