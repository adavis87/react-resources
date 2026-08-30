import type { Level } from '../content/types'

export const levelLabel: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function LevelChip({ level }: { level: Level }) {
  return <span className={`chip chip--${level}`}>{levelLabel[level]}</span>
}
