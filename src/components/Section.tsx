import type { ReactNode } from 'react'

/** A titled block inside an entry: "What it is", "How it works", "Example"... */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

/** Running text with consistent spacing. */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="prose">{children}</div>
}
