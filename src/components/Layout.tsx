import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import type { Entry } from '../content/types'
import { Sidebar } from './Sidebar'

interface Props {
  entries: Entry[]
  base: string
  query: string
  onQuery: (q: string) => void
  visibleSlugs: Set<string>
  children: ReactNode
}

export function Layout({ entries, base, query, onQuery, visibleSlugs, children }: Props) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="shell">
      <Sidebar
        entries={entries}
        base={base}
        query={query}
        onQuery={onQuery}
        visibleSlugs={visibleSlugs}
        open={open}
        onClose={() => setOpen(false)}
      />
      <div className="main">
        <div className="mobile-bar">
          <span className="masthead__title">React Field Manual</span>
          <button type="button" onClick={() => setOpen(true)} aria-expanded={open}>
            Menu
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
