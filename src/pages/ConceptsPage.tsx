import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EntryArticle } from '../components/Entry'
import { Layout } from '../components/Layout'
import { concepts } from '../content/concepts'
import { matches } from '../lib/search'
import { useScrollToSlug } from '../lib/useScrollToSlug'

export function ConceptsPage() {
  const { slug } = useParams()
  const [query, setQuery] = useState('')
  const visible = useMemo(() => concepts.filter((c) => matches(c, query)), [query])
  const visibleSlugs = useMemo(() => new Set(visible.map((v) => v.slug)), [visible])

  useScrollToSlug(slug, true)

  return (
    <Layout entries={concepts} base="/concepts" query={query} onQuery={setQuery} visibleSlugs={visibleSlugs}>
      <header className="page-head">
        <span className="eyebrow">Part one</span>
        <h1>Core concepts</h1>
        <p className="lede">
          The mental models that everything else in React rests on — ordered as a learning path, from JSX to
          concurrent rendering. Each entry explains what the idea is, how React actually implements it, and
          shows working code. When you can explain these, move on to the <Link to="/patterns">patterns</Link>.
        </p>
      </header>
      <div className="entries">
        {visible.length === 0 && <p className="empty">No concepts match “{query}”. Try a broader term.</p>}
        {visible.map((c) => (
          <EntryArticle key={c.slug} entry={c} base="/concepts" />
        ))}
      </div>
    </Layout>
  )
}
