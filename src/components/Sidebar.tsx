import { NavLink } from 'react-router-dom'
import type { Entry } from '../content/types'
import { ThemeToggle } from './ThemeToggle'

interface Props {
  entries: Entry[]
  base: string
  query: string
  onQuery: (q: string) => void
  visibleSlugs: Set<string>
  open: boolean
  onClose: () => void
}

export function Sidebar({ entries, base, query, onQuery, visibleSlugs, open, onClose }: Props) {
  const visibleCount = visibleSlugs.size
  const groups = entries.reduce<Map<string, Entry[]>>((acc, e) => {
    const list = acc.get(e.group) ?? []
    list.push(e)
    acc.set(e.group, list)
    return acc
  }, new Map())

  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`} aria-label="Site navigation">
      <div className="masthead">
        <div className="masthead__mark">
          <span className="masthead__glyph" aria-hidden="true">
            R
          </span>
          <div>
            <div className="masthead__title">React Field Manual</div>
            <div className="masthead__sub">Concepts &amp; patterns</div>
          </div>
        </div>
        <nav className="tabs" aria-label="Sections">
          <NavLink to="/concepts" className={({ isActive }) => (isActive ? 'is-active' : '')} onClick={onClose}>
            Concepts
          </NavLink>
          <NavLink to="/patterns" className={({ isActive }) => (isActive ? 'is-active' : '')} onClick={onClose}>
            Patterns
          </NavLink>
        </nav>
      </div>

      <div className="search">
        <label className="search__field">
          <span className="sr-only">Filter entries</span>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5 14 14" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Filter by name or tag"
            autoComplete="off"
          />
          {query && (
            <button type="button" className="search__clear" aria-label="Clear filter" onClick={() => onQuery('')}>
              ×
            </button>
          )}
        </label>
        <div className="search__hint">
          {visibleCount} of {entries.length} shown
        </div>
      </div>

      <nav className="nav" aria-label="Entries">
        {visibleCount === 0 && <div className="nav__empty">Nothing matches that filter.</div>}
        {[...groups.entries()].map(([group, list]) => {
          const visible = list.filter((e) => visibleSlugs.has(e.slug))
          if (visible.length === 0) return null
          const advanced = visible.every((e) => e.level === 'advanced')
          return (
            <div className="nav__group" key={group}>
              <div className={`nav__label${advanced ? ' nav__label--advanced' : ''}`}>{group}</div>
              <ul>
                {visible.map((e) => (
                  <li key={e.slug}>
                    <NavLink
                      to={`${base}/${e.slug}`}
                      className={({ isActive }) =>
                        [isActive ? 'is-active' : '', e.level === 'advanced' ? 'is-advanced' : ''].join(' ').trim()
                      }
                      onClick={onClose}
                    >
                      {e.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="sidebar__foot">
        <ThemeToggle />
        <span className="sidebar__version">React 19</span>
      </div>
    </aside>
  )
}
