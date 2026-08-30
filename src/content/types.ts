import type { ReactNode } from 'react'

export type Level = 'beginner' | 'intermediate' | 'advanced'

export interface Entry {
  /** URL slug, e.g. "use-effect" */
  slug: string
  title: string
  /** Sidebar grouping label, e.g. "Foundations" */
  group: string
  /** Only used on the Patterns page */
  level?: Level
  summary: string
  tags: string[]
  body: ReactNode
}
