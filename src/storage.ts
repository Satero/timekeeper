export type Entries = Record<string, Record<string, number>>

const CATEGORIES_KEY = 'timekeeper:categories'
const ENTRIES_KEY = 'timekeeper:entries'
const DEFAULT_CATEGORIES = ['Work', 'Meetings', 'Admin', 'Break', 'Learning']

export function getCategories(): string[] {
  const raw = localStorage.getItem(CATEGORIES_KEY)
  if (!raw) return [...DEFAULT_CATEGORIES]
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.every((c) => typeof c === 'string')
      ? parsed
      : [...DEFAULT_CATEGORIES]
  } catch {
    return [...DEFAULT_CATEGORIES]
  }
}

export function saveCategories(categories: string[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

export function getEntries(): Entries {
  const raw = localStorage.getItem(ENTRIES_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveEntries(entries: Entries): void {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

export function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
