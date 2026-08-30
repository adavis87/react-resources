import { useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function StateDemo() {
  const [count, setCount] = useState(0)
  const [log, setLog] = useState<string[]>([])

  function stale() {
    // Three calls read the same closed-over value
    setCount(count + 1)
    setCount(count + 1)
    setCount(count + 1)
    setLog((l) => [`setCount(count + 1) ×3 → +1 (stale closure)`, ...l].slice(0, 5))
  }
  function functional() {
    setCount((c) => c + 1)
    setCount((c) => c + 1)
    setCount((c) => c + 1)
    setLog((l) => [`setCount(c => c + 1) ×3 → +3 (queued updaters)`, ...l].slice(0, 5))
  }

  return (
    <>
      <div className="row">
        <span className="pill">count = {count}</span>
        <button onClick={stale}>+1 +1 +1 (stale)</button>
        <button onClick={functional}>+1 +1 +1 (functional)</button>
        <button onClick={() => { setCount(0); setLog([]) }}>Reset</button>
      </div>
      {log.length > 0 && <div className="log">{log.join('\n')}</div>}
    </>
  )
}

export const state: Entry = {
  slug: 'state',
  title: 'State with useState',
  group: 'Foundations',
  summary:
    'State is memory that survives re-renders. Setting it schedules a render; React batches updates and treats state as immutable.',
  tags: ['useState', 'state', 'immutability', 'batching', 'functional updates'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Local variables reset on every call of a component function. <code>useState</code> asks React to hold a
            value <em>between</em> calls and to re-render the component when that value changes. It returns the current
            value and a setter; calling the setter is the only way to change it.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              React keeps state in a list attached to the component instance (the fiber), indexed by call order. That is
              why hooks must be called unconditionally and in the same order every render.
            </li>
            <li>
              <strong>State is a snapshot.</strong> Each render sees the state from when that render began. Calling{' '}
              <code>setCount(count + 1)</code> three times in one handler queues three updates that all say "set to
              the same number". Pass a function — <code>setCount(c =&gt; c + 1)</code> — to queue updaters that run in
              sequence against the latest value.
            </li>
            <li>
              <strong>Updates are batched.</strong> All setter calls in an event handler (and, since React 18, in
              promises, timeouts and native events too) produce one re-render.
            </li>
            <li>
              <strong>State is treated as immutable.</strong> React compares with <code>Object.is</code>. Mutating an
              object or array in place and setting it again is a no-op because the reference is unchanged. Always create
              a new object: spread, <code>map</code>, <code>filter</code>, or <code>toSorted</code>.
            </li>
            <li>
              Pass a function to <code>useState(() =&gt; expensive())</code> to compute the initial value once instead of
              on every render.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Todos.tsx"
          highlight={[9, 10, 16]}
          code={`
type Todo = { id: number; text: string; done: boolean }

function Todos() {
  // Lazy initialiser: runs once, not on every render
  const [todos, setTodos] = useState<Todo[]>(() => loadFromStorage())
  const [draft, setDraft] = useState('')

  function add() {
    // New array, new object — never push() into state
    setTodos((prev) => [...prev, { id: Date.now(), text: draft, done: false }])
    setDraft('')
  }

  function toggle(id: number) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    )
  }

  return (
    <>
      <input value={draft} onChange={(e) => setDraft(e.target.value)} />
      <button onClick={add} disabled={!draft.trim()}>Add</button>
      <ul>
        {todos.map((t) => (
          <li key={t.id} onClick={() => toggle(t.id)}>
            {t.done ? <s>{t.text}</s> : t.text}
          </li>
        ))}
      </ul>
    </>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Stale closure vs functional update">
          <StateDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Reading state right after calling the setter gives the <em>old</em> value — the new one arrives on the next
            render.
          </li>
          <li>
            Don't store things you can compute from other state or props. Derive them during render instead (see{' '}
            <em>Lifting state and derived state</em>).
          </li>
          <li>
            Don't initialise state from a prop unless you mean "initial only". It will not follow later prop changes.
          </li>
          <li>
            Storing large objects is fine; storing functions requires the updater form (
            <code>setFn(() =&gt; fn)</code>) or React will call the function thinking it is an updater.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
