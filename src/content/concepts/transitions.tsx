import { useDeferredValue, useMemo, useState, useTransition } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

const words = Array.from({ length: 4000 }, (_, i) => `entry-${i.toString(36)}-${(i * 7919) % 1000}`)

function SlowList({ query }: { query: string }) {
  // Deliberately slow filter to make the difference visible
  const results = useMemo(() => {
    const start = performance.now()
    while (performance.now() - start < 120) {
      /* burn ~120ms */
    }
    return words.filter((w) => w.includes(query)).slice(0, 8)
  }, [query])
  return (
    <ul className="list">
      {results.map((w) => (
        <li key={w} className="mono">
          {w}
        </li>
      ))}
    </ul>
  )
}

function TransitionDemo() {
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [useTransitionMode, setMode] = useState(true)
  const deferred = useDeferredValue(text)
  return (
    <>
      <div className="row">
        <input
          value={text}
          onChange={(e) => {
            const v = e.target.value
            setText(v)
            if (useTransitionMode) startTransition(() => setQuery(v))
            else setQuery(v)
          }}
          placeholder="type quickly…"
          aria-label="Query"
        />
        <label className="row">
          <input type="checkbox" checked={useTransitionMode} onChange={(e) => setMode(e.target.checked)} />
          wrap in startTransition
        </label>
        {isPending && <span className="pill">updating…</span>}
      </div>
      <p className="mono">
        input = "{text}" · list query = "{query}" · deferred = "{deferred}"
      </p>
      <SlowList query={query} />
    </>
  )
}

export const transitions: Entry = {
  slug: 'transitions-and-concurrent-rendering',
  title: 'Transitions and concurrent rendering',
  group: 'Concurrent React',
  summary:
    'Concurrent rendering lets React pause, interrupt, and prioritise work. Transitions mark updates as non-urgent so typing and clicking stay responsive while heavy screens catch up.',
  tags: ['useTransition', 'startTransition', 'useDeferredValue', 'concurrent', 'useOptimistic', 'priority'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Since React 18, rendering is interruptible. React can begin rendering an update, stop to handle a more
            urgent one (a keystroke), and resume or throw away the earlier work. <strong>Transitions</strong> are how
            you tell React which updates are non-urgent: wrap them in <code>startTransition</code> and React will keep
            the old UI visible and interactive while the new one is prepared in the background.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              <code>const [isPending, startTransition] = useTransition()</code>. State updates inside the callback are
              low priority; <code>isPending</code> is true until they commit.
            </li>
            <li>
              <code>useDeferredValue(value)</code> gives you a version of a value that "lags behind" during heavy
              renders — the same effect without owning the setter, useful when the value comes from props.
            </li>
            <li>
              Urgent updates (the input's own value) render first; the transition render happens after, and is
              abandoned if a newer transition arrives. No more stale intermediate lists.
            </li>
            <li>
              If a transition suspends, React keeps showing the current screen instead of a fallback — this is what makes
              Suspense-based navigation feel smooth.
            </li>
            <li>
              <strong>React 19:</strong> transitions can be async. <code>startTransition(async () =&gt; ...)</code> keeps{' '}
              <code>isPending</code> true across the await, which is how form actions and <code>useOptimistic</code>{' '}
              track in-flight work.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Keep the input responsive while a heavy list re-filters"
          highlight={[8, 9, 10]}
          code={`
function Search({ items }: { items: Item[] }) {
  const [text, setText] = useState('')       // urgent: the field itself
  const [query, setQuery] = useState('')     // non-urgent: what drives the heavy list
  const [isPending, startTransition] = useTransition()

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    setText(e.target.value)
    startTransition(() => {
      setQuery(e.target.value)               // may be interrupted by the next keystroke
    })
  }

  return (
    <>
      <input value={text} onChange={onChange} />
      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        <HeavyResults query={query} />
      </div>
    </>
  )
}

// Alternative when you don't own the setter
function Results({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query)
  const stale = deferredQuery !== query
  return <HeavyResults query={deferredQuery} dimmed={stale} />
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Type fast with the checkbox on, then off">
          <TransitionDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Transitions don't make slow code fast; they change scheduling. The list still takes 120ms to render — it
            just no longer blocks the input.
          </li>
          <li>
            You cannot wrap a controlled input's own update in a transition; the field would lag behind the keystrokes.
          </li>
          <li>
            <code>startTransition</code> updates are batched together and interruptible; don't use them for things that
            must happen exactly once (like sending a request) — use a handler or an action.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
