import { useRef, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function RefDemo() {
  const inputRef = useRef<HTMLInputElement>(null)
  const clicks = useRef(0)
  const [renders, setRenders] = useState(0)
  return (
    <>
      <div className="row">
        <input ref={inputRef} placeholder="Focus me via ref" aria-label="Ref target" />
        <button onClick={() => inputRef.current?.focus()}>Focus input</button>
        <button
          onClick={() => {
            clicks.current += 1
          }}
        >
          Increment ref (no render)
        </button>
        <button onClick={() => setRenders((r) => r + 1)}>Force render</button>
      </div>
      <p className="mono">
        ref clicks = {clicks.current} · renders = {renders} — the ref count only shows up after a render.
      </p>
    </>
  )
}

export const useRefEntry: Entry = {
  slug: 'use-ref',
  title: 'useRef and DOM access',
  group: 'Hooks',
  summary:
    'A ref is a box whose .current you can mutate without triggering a render. Use it for DOM nodes and for values that must persist but are not part of the UI.',
  tags: ['useRef', 'refs', 'DOM', 'forwardRef', 'useImperativeHandle', 'mutable'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            <code>useRef(initial)</code> returns the same object on every render, with a single mutable property,{' '}
            <code>current</code>. Changing it does not re-render. Two jobs: holding a reference to a DOM element (via the{' '}
            <code>ref</code> attribute) and remembering values across renders that should not cause renders — timer ids,
            previous values, "has this run" flags.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              For <code>&lt;input ref={'{r}'} /&gt;</code>, React sets <code>r.current</code> to the DOM node during
              commit and back to <code>null</code> on unmount. It is <code>null</code> during render.
            </li>
            <li>
              A <strong>callback ref</strong> (<code>ref={'{(node) => ...}'}</code>) runs when the node attaches. React
              19 lets it return a cleanup function, which runs on detach.
            </li>
            <li>
              <strong>React 19: <code>ref</code> is a regular prop</strong> on function components. You no longer need{' '}
              <code>forwardRef</code>; read it from props and pass it down.
            </li>
            <li>
              <code>useImperativeHandle(ref, () =&gt; api)</code> lets a component expose a curated object (e.g.{' '}
              <code>{'{ focus, scrollTo }'}</code>) instead of a raw DOM node.
            </li>
            <li>
              Reading or writing <code>ref.current</code> during render makes the component impure. Do it in handlers
              and effects.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="DOM ref, value ref, and ref-as-prop (React 19)"
          highlight={[19, 20]}
          code={`
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0)
  const timer = useRef<number | null>(null)     // mutable value, not UI

  function start() {
    if (timer.current !== null) return
    const startedAt = Date.now()
    timer.current = window.setInterval(() => setElapsed(Date.now() - startedAt), 50)
  }
  function stop() {
    if (timer.current !== null) clearInterval(timer.current)
    timer.current = null
  }
  return <button onClick={elapsed ? stop : start}>{(elapsed / 1000).toFixed(2)}s</button>
}

// React 19: ref arrives as a prop. In React 18 this needed forwardRef.
function TextField({ ref, label, ...rest }: { ref?: Ref<HTMLInputElement>; label: string } & InputProps) {
  return <label>{label}<input ref={ref} {...rest} /></label>
}

function Form() {
  const first = useRef<HTMLInputElement>(null)
  useEffect(() => { first.current?.focus() }, [])
  return <TextField ref={first} label="Name" />
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo>
          <RefDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Don't use a ref to avoid re-renders for values that are shown on screen — the UI will go stale.
          </li>
          <li>
            A ref on a custom component in React 18 is silently dropped unless the component uses{' '}
            <code>forwardRef</code>.
          </li>
          <li>
            <code>useRef</code> is not for "previous props" in render. If you need the previous value, store it in state
            during render or in an effect, deliberately.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
