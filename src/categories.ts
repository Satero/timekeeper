import './style.css'
import { renderNav } from './nav.ts'
import { getCategories, saveCategories } from './storage.ts'
import { escapeHtml, escapeAttr } from './dom.ts'

const app = document.querySelector<HTMLDivElement>('#app')!

function render() {
  const categories = getCategories()

  app.innerHTML = `
    ${renderNav('categories')}
    <section id="categories-page">
      <div>
        <h1>Categories</h1>
        <p>Add or remove the categories you log time against.</p>
      </div>
      <div class="category-list">
        ${categories
          .map(
            (category) => `
              <div class="category-list-row" data-category="${escapeAttr(category)}">
                <span class="category-name">${escapeHtml(category)}</span>
                <button type="button" class="remove-category" data-category="${escapeAttr(category)}" aria-label="Remove ${escapeAttr(category)}">&times;</button>
              </div>
            `
          )
          .join('')}
      </div>

      <div class="add-category">
        <label class="sr-only" for="new-category">New category</label>
        <input id="new-category" type="text" placeholder="Add a category" maxlength="40" />
        <button type="button" id="add-category-btn" class="counter">Add</button>
      </div>
    </section>
  `

  wireUp()
}

function wireUp() {
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
}

function removeCategory(button: HTMLButtonElement) {
  const row = button.closest<HTMLElement>('.category-list-row')!
  const category = row.querySelector('.category-name')!.textContent ?? ''
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

render()
