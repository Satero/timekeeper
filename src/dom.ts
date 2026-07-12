export function escapeHtml(value: string): string {
  const div = document.createElement('div')
  div.textContent = value
  return div.innerHTML
}

export function escapeAttr(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, (c) => `_${c.charCodeAt(0)}_`)
}
