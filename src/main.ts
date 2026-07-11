import './style.css'
import { setupTimer } from './timer.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="center">
  <div>
    <h1>Timekeeper</h1>
    <p>Set a duration and start the countdown</p>
  </div>
  <div class="timer">
    <div class="timer-inputs">
      <label>
        Hours
        <input id="hours" type="number" min="0" max="23" value="0" />
      </label>
      <label>
        Minutes
        <input id="minutes" type="number" min="0" max="59" value="0" />
      </label>
    </div>
    <div id="display" class="timer-display">00:00:00</div>
    <div class="timer-controls">
      <button id="start" type="button" class="counter">Start</button>
      <button id="pause" type="button" class="counter">Pause</button>
      <button id="reset" type="button" class="counter">Reset</button>
    </div>
  </div>
</section>
`

setupTimer({
  hoursInput: document.querySelector<HTMLInputElement>('#hours')!,
  minutesInput: document.querySelector<HTMLInputElement>('#minutes')!,
  startButton: document.querySelector<HTMLButtonElement>('#start')!,
  pauseButton: document.querySelector<HTMLButtonElement>('#pause')!,
  resetButton: document.querySelector<HTMLButtonElement>('#reset')!,
  display: document.querySelector<HTMLElement>('#display')!,
})
