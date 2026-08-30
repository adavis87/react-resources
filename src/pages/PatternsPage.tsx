import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EntryArticle } from '../components/Entry'
import { Layout } from '../components/Layout'
import { levelLabel } from '../components/LevelChip'
import { patterns } from '../content/patterns'
import type { Level } from '../content/types'
import { matches } from '../lib/search'
import { useActiveSlug } from '../lib/useActiveSlug'
import { useScrollToSlug } from '../lib/useScrollToSlug'

const levels: Level[] = ['beginner', 'intermediate', 'advanced']

export function PatternsPage() {
  const { slug } = useParams()
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<Level | 'all'>('all')

  const visible = useMemo(
    () => patterns.filter((p) => matches(p, query) && (level === 'all' || p.level === level)),
    [query, level],
  )
  const visibleSlugs = useMemo(() => new Set(visible.map((v) => v.slug)), [visible])

  useScrollToSlug(slug, true)
  const activeSlug = useActiveSlug(visible.map((v) => v.slug), slug)

  return (
    <Layout entries={patterns} base="/patterns" query={query} onQuery={setQuery} visibleSlugs={visibleSlugs} activeSlug={activeSlug}>
      <header className="page-head">
        <span className="eyebrow">Part two</span>
        <h1>Common patterns</h1>
        <p className="lede">
          Recurring shapes that React code settles into. The first tier covers the patterns you reach for daily;
          the advanced tier covers component APIs and rendering strategies you'll meet in libraries and larger
          codebases. Everything here builds on the <Link to="/concepts">core concepts</Link>.
        </p>
        <div className="level-filter" role="group" aria-label="Filter by level">
          <button type="button" aria-pressed={level === 'all'} onClick={() => setLevel('all')}>
            All
          </button>
          {levels.map((l) => (
            <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)}>
              {levelLabel[l]}
            </button>
          ))}
        </div>
      </header>
      <div className="entries">
        {visible.length === 0 && <p className="empty">No patterns match that filter.</p>}
        {visible.map((p) => (
          <EntryArticle key={p.slug} entry={p} base="/patterns" />
        ))}
      </div>
    </Layout>
  )
}
