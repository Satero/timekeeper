export interface TimerElements {
  hoursInput: HTMLInputElement
  minutesInput: HTMLInputElement
  startButton: HTMLButtonElement
  pauseButton: HTMLButtonElement
  resetButton: HTMLButtonElement
  display: HTMLElement
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':')
}

export function setupTimer(elements: TimerElements) {
  const { hoursInput, minutesInput, startButton, pauseButton, resetButton, display } = elements

  let remainingSeconds = 0
  let intervalId: number | undefined

  function render() {
    display.textContent = formatTime(remainingSeconds)
  }

  function tick() {
    if (remainingSeconds <= 0) {
      stop()
      return
    }
    remainingSeconds -= 1
    render()
  }

  function stop() {
    if (intervalId !== undefined) {
      clearInterval(intervalId)
      intervalId = undefined
    }
    startButton.disabled = false
    pauseButton.disabled = true
  }

  function start() {
    if (intervalId !== undefined) return

    if (remainingSeconds <= 0) {
      const hours = Math.min(23, Math.max(0, Number(hoursInput.value) || 0))
      const minutes = Math.min(59, Math.max(0, Number(minutesInput.value) || 0))
      remainingSeconds = hours * 3600 + minutes * 60
      if (remainingSeconds <= 0) return
    }

    hoursInput.disabled = true
    minutesInput.disabled = true
    startButton.disabled = true
    pauseButton.disabled = false
    render()
    intervalId = window.setInterval(tick, 1000)
  }

  function reset() {
    stop()
    remainingSeconds = 0
    hoursInput.disabled = false
    minutesInput.disabled = false
    pauseButton.disabled = true
    render()
  }

  hoursInput.addEventListener('input', () => {
    hoursInput.value = String(Math.min(23, Math.max(0, Number(hoursInput.value) || 0)))
  })
  minutesInput.addEventListener('input', () => {
    minutesInput.value = String(Math.min(59, Math.max(0, Number(minutesInput.value) || 0)))
  })

  startButton.addEventListener('click', start)
  pauseButton.addEventListener('click', stop)
  resetButton.addEventListener('click', reset)

  pauseButton.disabled = true
  render()
}
