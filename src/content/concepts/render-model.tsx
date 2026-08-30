import { useRef, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function Child({ label }: { label: string }) {
  const renders = useRef(0)
  renders.current += 1
  return (
    <li key={renders.current} className="highlight-render">
      <span>{label}</span>
      <span className="mono">rendered {renders.current}×</span>
    </li>
  )
}

function RenderDemo() {
  const [n, setN] = useState(0)
  const [other, setOther] = useState(0)
  return (
    <>
      <div className="row">
        <button onClick={() => setN((v) => v + 1)}>Set parent state ({n})</button>
        <button onClick={() => setOther((v) => v + 1)}>Set unrelated state ({other})</button>
        <button onClick={() => setN((v) => v)}>Set same value (no render)</button>
      </div>
      <ul className="list">
        <Child label="Child A — no props" />
        <Child label="Child B — no props" />
      </ul>
      <p className="mono">Children re-render whenever the parent does, even without props. Same-value sets bail out.</p>
    </>
  )
}

export const renderModel: Entry = {
  slug: 'render-model',
  title: 'The render model',
  group: 'Foundations',
  summary:
    'A render is React calling your components to get a new description, diffing it, and committing the minimal DOM changes. Understanding when and why it happens explains most React behaviour.',
  tags: ['rendering', 'reconciliation', 'commit', 'purity', 'strict mode', 're-render'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            React works in two phases. In the <strong>render phase</strong> it calls your component functions and
            builds a tree of elements, then compares it to the previous tree (reconciliation). In the{' '}
            <strong>commit phase</strong> it applies the resulting DOM mutations, then runs layout effects and, after
            paint, regular effects. "Re-render" means "React called your function again", not "the DOM changed".
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <h4>What triggers a render</h4>
          <ul>
            <li>The initial mount.</li>
            <li>A state setter called with a different value (checked with <code>Object.is</code>).</li>
            <li>
              A parent re-rendering. By default every child re-renders with its parent, whether or not its props changed.{' '}
              <code>memo</code> opts a component out when props are shallow-equal.
            </li>
            <li>A context value changing, for every consumer of that context.</li>
          </ul>
          <h4>Why components must be pure</h4>
          <p>
            React may call your function more than once for a single update (Strict Mode does this deliberately in
            development), may start rendering and throw the work away (concurrent rendering), and may render in a
            different order than you expect. A component that only reads props, state and context, and returns
            elements, is safe under all of these. Side effects belong in event handlers or effects.
          </p>
          <h4>Fibers</h4>
          <p>
            Internally each element in the tree corresponds to a <em>fiber</em>: the unit that holds state, hooks and
            effects for that position. Position plus type is the identity — change either and React unmounts and remounts.
          </p>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Order of operations for one click"
          code={`
function Counter() {
  const [n, setN] = useState(0)
  console.log('render', n)                 // 1. render phase (may run twice in dev)

  useLayoutEffect(() => {
    console.log('layout effect', n)        // 3. after DOM mutation, before paint
  })

  useEffect(() => {
    console.log('effect', n)               // 4. after paint
    return () => console.log('cleanup', n) // runs before the next effect, and on unmount
  })

  return <button onClick={() => setN(n + 1)}>{n}</button>
  // 2. commit: React sets button.textContent
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Which children render?">
          <RenderDemo />
        </Demo>
      </Section>

      <Callout kind="react19">
        <p>
          The <strong>React Compiler</strong> (stable in 2025, opt-in via a Babel/SWC plugin) automatically memoises
          components and values that obey the rules of React. It does not change the model above; it removes the need to
          hand-write most <code>memo</code>, <code>useMemo</code> and <code>useCallback</code> calls.
        </p>
      </Callout>

      <Callout kind="gotcha">
        <ul>
          <li>
            Strict Mode double-invokes render functions and mounts effects twice in development to surface impurity.
            Code that behaves differently the second time has a bug.
          </li>
          <li>Rendering is not expensive by default. Optimise when profiling shows a problem, not pre-emptively.</li>
          <li>
            <code>console.log</code> inside render fires during the render phase, which may be discarded — it is not
            proof the DOM updated.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
