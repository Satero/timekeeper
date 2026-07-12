import './style.css'
import { renderNav } from './nav.ts'
import { getCategories, saveCategories, getEntries, saveEntries, todayISO, formatDuration } from './storage.ts'
import { escapeHtml, escapeAttr } from './dom.ts'

const app = document.querySelector<HTMLDivElement>('#app')!
const today = todayISO()

function render() {
  const categories = getCategories()
  const entries = getEntries()
  const todayEntry = entries[today] ?? {}

  app.innerHTML = `
    ${renderNav('log')}
    <section id="center">
      <div>
        <h1>Log time</h1>
        <p>How much time did you spend on each category today?</p>
      </div>
      <form id="log-form" class="log-form">
        <div class="category-rows">
          ${categories
            .map((category) => {
              const minutes = todayEntry[category] ?? 0
              const hours = Math.floor(minutes / 60)
              const mins = minutes % 60
              return `
                <div class="category-row" data-category="${escapeAttr(category)}">
                  <span class="category-name">${escapeHtml(category)}</span>
                  <label class="sr-only" for="hours-${escapeAttr(category)}">Hours</label>
                  <input id="hours-${escapeAttr(category)}" class="hours-input" type="number" min="0" max="23" value="${hours}" />
                  <span class="unit">h</span>
                  <label class="sr-only" for="minutes-${escapeAttr(category)}">Minutes</label>
                  <input id="minutes-${escapeAttr(category)}" class="minutes-input" type="number" min="0" max="59" value="${mins}" />
                  <span class="unit">m</span>
                  <button type="button" class="remove-category" data-category="${escapeAttr(category)}" aria-label="Remove ${escapeAttr(category)}">&times;</button>
                </div>
              `
            })
            .join('')}
        </div>

        <div class="add-category">
          <label class="sr-only" for="new-category">New category</label>
          <input id="new-category" type="text" placeholder="Add a category" maxlength="40" />
          <button type="button" id="add-category-btn" class="counter">Add</button>
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

  document.querySelectorAll<HTMLButtonElement>('.remove-category').forEach((button) => {
    button.addEventListener('click', () => removeCategory(button))
  })

  document.querySelector<HTMLButtonElement>('#add-category-btn')!.addEventListener('click', addCategory)
  document.querySelector<HTMLInputElement>('#new-category')!.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addCategory()
    }
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

function removeCategory(button: HTMLButtonElement) {
  const row = button.closest<HTMLElement>('.category-row')!
  const category = categoryNameFromRow(row)
  const categories = getCategories().filter((c) => c !== category)
  saveCategories(categories)
  render()
}

function addCategory() {
  const input = document.querySelector<HTMLInputElement>('#new-category')!
  const name = input.value.trim()
  if (!name) return
  const categories = getCategories()
  if (categories.includes(name)) {
    input.value = ''
    return
  }
  saveCategories([...categories, name])
  render()
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
  entries[today] = todayEntry
  saveEntries(entries)

  const confirmation = document.querySelector<HTMLElement>('#save-confirmation')!
  confirmation.textContent = 'Saved.'
  window.setTimeout(() => {
    confirmation.textContent = ''
  }, 2000)
}

render()
