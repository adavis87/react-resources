import { useMemo, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

const people = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Edsger Dijkstra', 'Barbara Liskov', 'Donald Knuth']

function DerivedDemo() {
  const [query, setQuery] = useState('')
  const [sortDesc, setSortDesc] = useState(false)

  // No effect, no second state: everything below is computed from the two inputs
  const visible = useMemo(() => {
    const q = query.toLowerCase()
    const list = people.filter((p) => p.toLowerCase().includes(q))
    return sortDesc ? list.toSorted().reverse() : list.toSorted()
  }, [query, sortDesc])

  return (
    <>
      <div className="row">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter" aria-label="Filter" />
        <button onClick={() => setSortDesc((d) => !d)}>Sort {sortDesc ? 'Z→A' : 'A→Z'}</button>
        <span className="pill">
          {visible.length} of {people.length}
        </span>
      </div>
      <ul className="list">
        {visible.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </>
  )
}

export const derivedState: Entry = {
  slug: 'derived-state',
  title: 'Derived state, not synced state',
  group: 'Structure & data',
  level: 'intermediate',
  summary:
    'If a value can be computed from props or other state, compute it during render. Storing it separately and keeping it in sync with an effect is slower and buggier.',
  tags: ['derived state', 'useMemo', 'useEffect', 'redundant state', 'single source of truth'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            State should hold only what cannot be derived. A filtered list, a total, a full name, a "form is valid"
            flag — these are functions of existing state and belong in a plain <code>const</code> inside render. The
            anti-pattern is a second <code>useState</code> plus a <code>useEffect</code> that copies one into the other:
            it renders twice, can be momentarily out of date, and doubles the places a bug can hide.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>
              Any time you catch yourself writing <code>useEffect(() =&gt; setB(f(a)), [a])</code>. Replace with{' '}
              <code>const b = f(a)</code>.
            </li>
            <li>
              Wrap the computation in <code>useMemo</code> only when it is measurably expensive (sorting thousands of
              rows) or when the result's identity matters to a memoised child. Filtering fifty items does not need it.
            </li>
            <li>
              If a value must be derived <em>and</em> user-editable (a draft that starts from a prop), that is real state;
              reset it with a <code>key</code> when the source changes rather than syncing it.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Before and after"
          highlight={[14, 15, 16]}
          code={`
// ✗ Synced state: two renders per keystroke, and 'total' lags by one render
function Cart({ items }: { items: Item[] }) {
  const [total, setTotal] = useState(0)
  useEffect(() => {
    setTotal(items.reduce((sum, i) => sum + i.price * i.qty, 0))
  }, [items])
  return <p>Total: {total}</p>
}

// ✓ Derived during render: always correct, one render
function Cart({ items }: { items: Item[] }) {
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const hasFreeShipping = total > 50
  const label = hasFreeShipping ? 'Free shipping' : \`\${(50 - total).toFixed(2)} to free shipping\`
  return <p>Total: {total} — {label}</p>
}

// ✓ Memoise only when the work is heavy
const sorted = useMemo(() => bigList.toSorted(byDate), [bigList])
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Filter + sort with zero effects">
          <DerivedDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Deriving an object or array in render creates a new reference each time. That is fine unless you pass it to a{' '}
            <code>memo</code> child or an effect dependency — then <code>useMemo</code> it.
          </li>
          <li>
            "Derived from props into state" (<code>useState(props.x)</code>) freezes the initial value. If you need it to
            follow the prop, don't copy it at all.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
