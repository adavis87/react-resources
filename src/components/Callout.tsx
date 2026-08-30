import type { ReactNode } from 'react'

type Kind = 'gotcha' | 'react19' | 'note' | 'warn'

const labels: Record<Kind, string> = {
  gotcha: 'Gotchas',
  react19: 'React 19',
  note: 'Note',
  warn: 'Careful',
}

const classes: Record<Kind, string> = {
  gotcha: 'callout--warn',
  react19: '',
  note: 'callout--note',
  warn: 'callout--warn',
}

export function Callout({ kind = 'note', label, children }: { kind?: Kind; label?: string; children: ReactNode }) {
  return (
    <aside className={`callout ${classes[kind]}`}>
      <span className="callout__label">{label ?? labels[kind]}</span>
      <div className="callout__body">{children}</div>
    </aside>
  )
}
