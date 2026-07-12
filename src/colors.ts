const CATEGORICAL_SLOTS = 8

export function seriesColorVar(index: number): string {
  return index < CATEGORICAL_SLOTS ? `var(--series-${index + 1})` : 'var(--series-other)'
}

export interface Series {
  name: string
  minutes: number
  colorVar: string
}

export function buildSeries(categories: string[], dayMinutes: Record<string, number>): Series[] {
  const series: Series[] = categories.slice(0, CATEGORICAL_SLOTS).map((name, index) => ({
    name,
    minutes: dayMinutes[name] ?? 0,
    colorVar: seriesColorVar(index),
  }))

  const overflow = categories.slice(CATEGORICAL_SLOTS)
  if (overflow.length > 0) {
    const otherMinutes = overflow.reduce((sum, name) => sum + (dayMinutes[name] ?? 0), 0)
    series.push({ name: 'Other', minutes: otherMinutes, colorVar: 'var(--series-other)' })
  }

  return series
}
