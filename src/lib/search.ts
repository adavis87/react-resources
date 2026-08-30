import type { Entry } from '../content/types'

export function matches(entry: Entry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = [entry.title, entry.summary, entry.group, ...entry.tags].join(' ').toLowerCase()
  return q.split(/\s+/).every((word) => hay.includes(word))
}
