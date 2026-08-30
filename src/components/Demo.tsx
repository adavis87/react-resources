import type { ReactNode } from 'react'

export function Demo({ title = 'Live demo', children }: { title?: string; children: ReactNode }) {
  return (
    <div className="demo">
      <div className="demo__bar">{title}</div>
      <div className="demo__body">{children}</div>
    </div>
  )
}
