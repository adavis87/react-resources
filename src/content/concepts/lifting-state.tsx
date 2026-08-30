import { useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

const items = [
  { id: 1, name: 'Fiber', price: 12 },
  { id: 2, name: 'Hooks', price: 8 },
  { id: 3, name: 'Suspense', price: 20 },
  { id: 4, name: 'Actions', price: 15 },
]

function LiftDemo() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  // Derived during render: no extra state, no effect
  const visible = items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
  const total = items.filter((i) => selected.includes(i.id)).reduce((s, i) => s + i.price, 0)
  return (
    <>
      <div className="row">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter" aria-label="Filter" />
        <span className="pill">{selected.length} selected · total {total}</span>
      </div>
      <ul className="list">
        {visible.map((i) => (
          <li key={i.id}>
            <input
              type="checkbox"
              checked={selected.includes(i.id)}
              onChange={(e) => setSelected((s) => (e.target.checked ? [...s, i.id] : s.filter((x) => x !== i.id)))}
              aria-label={i.name}
            />
            {i.name} <span className="mono">{i.price}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

export const liftingState: Entry = {
  slug: 'lifting-state-and-derived-state',
  title: 'Lifting state and derived state',
  group: 'Data flow',
  summary:
    'Put state in the closest ancestor that all readers share, and compute everything you can from it during render. Most redundant state is a bug waiting to happen.',
  tags: ['lifting state', 'derived state', 'single source of truth', 'data flow'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Data in React flows one way: down through props. When two components need the same state, it cannot live in
            either — it moves up to their nearest common parent, which passes the value down and a callback to change
            it. That is "lifting state up".
          </p>
          <p>
            Derived state is the companion rule: anything computable from existing state or props should be computed,
            not stored. A filtered list, a total, a validity flag, "is this item selected" — all are expressions in
            render, not separate <code>useState</code> calls.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              Ask for each piece of state: who reads it? Place it at the lowest component that contains all readers.
              Higher than necessary causes extra re-renders; lower than necessary forces duplication.
            </li>
            <li>
              Duplicated state must be kept in sync, usually with an effect, and effects run a render late — so the UI
              shows a stale frame. Derived values are always consistent because they are recomputed with the same
              inputs.
            </li>
            <li>
              If the derivation is expensive, wrap it in <code>useMemo</code>. Do not move it into state.
            </li>
            <li>
              Store the minimal representation: selected <em>ids</em>, not selected objects; the query string, not the
              filtered results.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Before and after"
          highlight={[4, 5, 6, 14]}
          code={`
// Before: two sources of truth, kept in sync by an effect (one render late)
function Before({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(items)
  useEffect(() => {
    setVisible(items.filter((i) => i.name.includes(query)))
  }, [items, query])
  // ...
}

// After: one source of truth; visible is derived
function After({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('')
  const visible = items.filter((i) => i.name.includes(query))
  // ...
}

// Lifted: Parent owns "which tab", both children read it
function Parent() {
  const [tab, setTab] = useState<'code' | 'preview'>('code')
  return (
    <>
      <TabBar value={tab} onChange={setTab} />
      <TabPanel value={tab} />
    </>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Filter and selection derived from three pieces of state">
          <LiftDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            "Mirroring" a prop into state (<code>useState(props.value)</code>) freezes the initial value. If you need it
            to track the prop, read the prop directly; if you need an editable copy, name it so (<code>draft</code>) and
            reset with <code>key</code>.
          </li>
          <li>
            Lifting everything to the top of the app is the opposite mistake — it makes the root re-render on every
            keystroke. Keep state as low as it can go.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
