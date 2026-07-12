import './style.css'
import { renderNav } from './nav.ts'
import { resetApp } from './storage.ts'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  ${renderNav('settings')}
  <section id="settings-page">
    <h1>Settings</h1>
    <p class="settings-description">Reset the app to its initial state. All categories and logged time will be permanently deleted.</p>
    <button type="button" id="reset-btn" class="counter reset-btn">Reset app</button>
    <p id="reset-confirmation" class="save-confirmation" role="status"></p>
  </section>
  <div id="reset-dialog" class="modal-overlay" hidden>
    <div class="modal-dialog" role="dialog" aria-labelledby="reset-dialog-title" aria-modal="true">
      <p id="reset-dialog-title" class="modal-message">Are you sure?</p>
      <div class="modal-actions">
        <button type="button" id="reset-yes" class="counter">Yes</button>
        <button type="button" id="reset-no" class="counter modal-cancel">No</button>
      </div>
    </div>
  </div>
`

const dialog = document.querySelector<HTMLDivElement>('#reset-dialog')!
const resetBtn = document.querySelector<HTMLButtonElement>('#reset-btn')!
const yesBtn = document.querySelector<HTMLButtonElement>('#reset-yes')!
const noBtn = document.querySelector<HTMLButtonElement>('#reset-no')!
const confirmation = document.querySelector<HTMLElement>('#reset-confirmation')!

function openDialog() {
  dialog.hidden = false
  yesBtn.focus()
}

function closeDialog() {
  dialog.hidden = true
  resetBtn.focus()
}

resetBtn.addEventListener('click', openDialog)
noBtn.addEventListener('click', closeDialog)

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) closeDialog()
})

document.addEventListener('keydown', (event) => {
  if (dialog.hidden) return
  if (event.key === 'Escape') closeDialog()
})

yesBtn.addEventListener('click', () => {
  resetApp()
  closeDialog()
  confirmation.textContent = 'App reset to defaults.'
  window.setTimeout(() => {
    confirmation.textContent = ''
  }, 3000)
})
