import { memo, useRef, useState, type ReactNode } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo implementation ---------------------------------------------------
function Counter({ label }: { label: string }) {
  const renders = useRef(0)
  renders.current += 1
  return (
    <li>
      <span>{label}</span>
      <span className="pill">rendered {renders.current}×</span>
    </li>
  )
}
const MemoCounter = memo(Counter)

// State lives here; `children` was created by the parent, so it is the same element each time
function Ticker({ children }: { children: ReactNode }) {
  const [n, setN] = useState(0)
  return (
    <div className="box stack">
      <div className="row">
        <button onClick={() => setN((v) => v + 1)}>Tick ({n})</button>
        <span className="mono">state lives in this box</span>
      </div>
      <ul className="list">{children}</ul>
    </div>
  )
}

function RenderIsolationDemo() {
  const [n, setN] = useState(0)
  return (
    <div className="stack">
      <div className="row">
        <button onClick={() => setN((v) => v + 1)}>Re-render parent ({n})</button>
      </div>
      <ul className="list">
        <Counter label="Plain child of parent" />
        <MemoCounter label="memo() child of parent" />
      </ul>
      <Ticker>
        <Counter label="Passed as children into Ticker" />
      </Ticker>
      <p className="mono">Tick updates Ticker's state without re-rendering its children. Re-render parent renders everything except the memo child.</p>
    </div>
  )
}

export const renderIsolation: Entry = {
  slug: 'render-isolation',
  title: 'Render isolation',
  group: 'Rendering & data',
  level: 'advanced',
  summary:
    'Keep fast-changing state from re-rendering expensive subtrees by moving state down, passing subtrees as children, and placing memo() at the right boundary.',
  tags: ['performance', 're-render', 'children as props', 'memo', 'state colocation'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            A state update re-renders the component that owns it and everything below. Three structural moves limit
            the blast radius, in order of preference:
          </p>
          <ul>
            <li>
              <strong>Move state down.</strong> If only the search box needs the query, the query shouldn't live in the
              page component.
            </li>
            <li>
              <strong>Pass subtrees as <code>children</code>.</strong> Elements created by a parent are the same object
              on the state-owner's re-render, so React skips them without any <code>memo</code>.
            </li>
            <li>
              <strong>Add a <code>memo</code> boundary</strong> where props are stable and rendering is genuinely
              expensive.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>Typing lag, or a profiler flame chart showing a large tree re-rendering on every keystroke.</li>
            <li>Layout components with a small interactive part (a resizable sidebar) wrapping a large static one.</li>
            <li>
              If the React Compiler is on, it handles most <code>memo</code> cases; the first two moves still apply.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Before and after"
          highlight={[14, 15, 16, 22]}
          code={`
// Before: every keystroke re-renders <ExpensiveTable /> because Page owns the query
function Page() {
  const [query, setQuery] = useState('')
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ExpensiveTable />
    </>
  )
}

// After: the state moves into a wrapper, and the expensive tree arrives as children.
// Page creates the <ExpensiveTable /> element once per Page render; SearchLayout's own
// re-renders reuse that identical element, so React bails out of it.
function SearchLayout({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {children}
    </>
  )
}

function Page() {
  return (
    <SearchLayout>
      <ExpensiveTable />
    </SearchLayout>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Who re-renders?">
          <RenderIsolationDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            <code>memo</code> is defeated by any unstable prop: inline objects, arrays, arrow functions, or{' '}
            <code>children</code> written as JSX inside the parent. Check props in the profiler before blaming React.
          </li>
          <li>
            Context changes bypass <code>memo</code> — every consumer re-renders. Split contexts (see{' '}
            <em>Provider composition</em>).
          </li>
          <li>Measure first. Re-rendering a hundred small components is usually cheaper than the memo bookkeeping.</li>
        </ul>
      </Callout>
    </>
  ),
}
