import { Link } from 'react-router-dom'
import type { Entry as EntryType } from '../content/types'
import { LevelChip } from './LevelChip'

export function EntryArticle({ entry, base }: { entry: EntryType; base: string }) {
  return (
    <article className="entry" id={entry.slug} aria-labelledby={`${entry.slug}-title`}>
      <header className="entry__head">
        <div className="entry__meta">
          <span className="eyebrow">{entry.group}</span>
          {entry.level && <LevelChip level={entry.level} />}
        </div>
        <h2 id={`${entry.slug}-title`}>
          <Link to={`${base}/${entry.slug}`}>{entry.title}</Link>
        </h2>
        <p className="entry__summary">{entry.summary}</p>
        <div className="entry__tags" aria-label="Tags">
          {entry.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </header>
      {entry.body}
    </article>
  )
}
