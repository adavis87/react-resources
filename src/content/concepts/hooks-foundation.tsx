import { useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo: a toy React that stores hooks in an array indexed by call order --
type Cell = { value: unknown }

function makeToyReact(onRender: (cells: Cell[]) => void) {
  const cells: Cell[] = []
  let cursor = 0
  let render: () => void = () => {}

  function useToyState<T>(initial: T): [T, (next: T) => void] {
    const index = cursor++
    if (!cells[index]) cells[index] = { value: initial }
    const cell = cells[index]
    const set = (next: T) => {
      cell.value = next
      render()
    }
    return [cell.value as T, set]
  }

  function mount(component: () => string) {
    render = () => {
      cursor = 0 // every render walks the list from the start
      component()
      onRender(cells.map((c) => ({ ...c })))
    }
    render()
  }

  return { useToyState, mount }
}

function ToyDemo() {
  const [skipFirst, setSkipFirst] = useState(false)
  const [snapshot, setSnapshot] = useState<{ cells: Cell[]; out: string } | null>(null)
  const [toy, setToy] = useState<ReturnType<typeof makeToyReact> | null>(null)

  function build(skip: boolean) {
    let out = ''
    const t = makeToyReact((cells) => setSnapshot({ cells, out }))
    t.mount(function Counter() {
      // Hook 1 — conditionally skipped when the box is checked
      let name = 'Ada'
      if (!skip) [name] = t.useToyState('Ada')
      // Hook 2
      const [count] = t.useToyState(0)
      out = `name=${String(name)} count=${String(count)}`
      return out
    })
    setToy(t)
  }

  function increment() {
    if (!toy) return
    // Simulate "setCount(count + 1)" by writing cell 1 (where count lives when both hooks run)
    let out = ''
    const t = toy
    // re-run the component through the toy renderer with the updated cell
    t.mount(function Counter() {
      let name = 'Ada'
      if (!skipFirst) [name] = t.useToyState('Ada')
      const [count, setCount] = t.useToyState(0)
      out = `name=${String(name)} count=${String(count)}`
      if (typeof count === 'number' && count < 1) setCount(count + 1)
      return out
    })
  }

  return (
    <div className="stack">
      <div className="row">
        <button onClick={() => build(skipFirst)}>Mount toy component</button>
        <button onClick={increment} disabled={!toy}>Set count = 1</button>
        <label className="row">
          <input
            type="checkbox"
            checked={skipFirst}
            onChange={(e) => {
              setSkipFirst(e.target.checked)
              setToy(null)
              setSnapshot(null)
            }}
          />
          skip the first hook (breaks the rule)
        </label>
      </div>
      <div className="log">
        {snapshot
          ? `cells: ${JSON.stringify(snapshot.cells.map((c) => c.value))}\nrender output: ${snapshot.out}`
          : 'mount to see the hook list…'}
      </div>
      <p className="mono">
        With the box checked, "count" reads cell 0 — the slot that used to hold the name — so the values line up with
        the wrong hooks. Real React throws instead of silently corrupting.
      </p>
    </div>
  )
}

export const hooksFoundation: Entry = {
  slug: 'how-hooks-work',
  title: 'How hooks work',
  group: 'Hooks',
  summary:
    'A hook is a call that reads and writes a slot in a per-component list, matched by position. Everything about hooks — the rules, the dependency arrays, custom hooks — follows from that.',
  tags: ['hooks', 'rules of hooks', 'call order', 'fiber', 'useState', 'useEffect', 'useRef', 'cheat sheet'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Function components have no instance to hang data on — they are called, return elements, and are gone.
            Hooks are how React attaches persistent data to a <em>position in the tree</em> instead. Each component's
            fiber holds a linked list of hook slots; every <code>useX</code> call during render takes the next slot.
            On the first render the slot is created with an initial value; on later renders the same call, in the same
            position, finds the same slot.
          </p>
          <p>
            That is the entire trick. <code>useState</code> is a slot holding a value and an update queue.{' '}
            <code>useRef</code> is a slot holding <code>{'{ current }'}</code>. <code>useEffect</code> is a slot holding
            a function, its last dependency array, and its cleanup. <code>useMemo</code> is a slot holding a value and
            the deps that produced it.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              <strong>Position is identity.</strong> React does not know your hooks' names. It knows "the third hook
              called by this component". If a render calls hooks in a different order — because one was inside an{' '}
              <code>if</code>, a loop, or after an early <code>return</code> — every hook after it reads the wrong slot.
              That is why the rules of hooks exist and why the linter enforces them.
            </li>
            <li>
              <strong>Custom hooks are just functions.</strong> A custom hook's <code>useState</code> calls land in the
              slots of whichever component called it. Two components calling <code>useToggle</code> get two independent
              slots; there is no sharing, only reuse of logic.
            </li>
            <li>
              <strong>Dependency arrays are the "did it change" check.</strong> Effects, memos and callbacks store their
              previous deps in the slot and compare each element with <code>Object.is</code>. Same references → skip.
              New reference → re-run. This is why an inline object as a dependency re-runs every time.
            </li>
            <li>
              <strong>Setters are stable and schedule renders.</strong> <code>setState</code> and <code>dispatch</code>{' '}
              push an update onto the slot's queue and ask React to re-render that fiber. The render reads the queue,
              computes the new value, and only then does the component function see it — never mid-render.
            </li>
            <li>
              <strong>Refs are the escape hatch.</strong> A ref slot is a plain mutable object React never looks at
              again. Writing <code>ref.current</code> does not schedule anything, which is exactly what makes it useful
              for values that must persist but must not trigger renders.
            </li>
          </ul>

          <h4>Which hook, for which job</h4>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>I need to…</th>
                  <th>Reach for</th>
                  <th>Because</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Remember a value the UI shows, and update it</td>
                  <td>
                    <code>useState</code>
                  </td>
                  <td>Changing it must re-render.</td>
                </tr>
                <tr>
                  <td>Update state with rules, or several fields together</td>
                  <td>
                    <code>useReducer</code>
                  </td>
                  <td>Transitions live in one testable function.</td>
                </tr>
                <tr>
                  <td>Remember a value the UI does <em>not</em> show</td>
                  <td>
                    <code>useRef</code>
                  </td>
                  <td>Timer ids, instances, "latest" values — no render needed.</td>
                </tr>
                <tr>
                  <td>Touch a DOM node (focus, measure, scroll)</td>
                  <td>
                    <code>useRef</code> + <code>ref</code> attribute
                  </td>
                  <td>React fills it in during commit.</td>
                </tr>
                <tr>
                  <td>Sync with something outside React (timer, socket, listener)</td>
                  <td>
                    <code>useEffect</code>
                  </td>
                  <td>Runs after commit; cleanup undoes it.</td>
                </tr>
                <tr>
                  <td>Measure layout before the browser paints</td>
                  <td>
                    <code>useLayoutEffect</code>
                  </td>
                  <td>Synchronous after DOM mutation; avoids flicker.</td>
                </tr>
                <tr>
                  <td>Read the latest props/state from inside an effect without re-subscribing</td>
                  <td>
                    <code>useEffectEvent</code>
                  </td>
                  <td>Non-reactive callback that always sees current values.</td>
                </tr>
                <tr>
                  <td>Read a value provided by an ancestor</td>
                  <td>
                    <code>useContext</code> / <code>use</code>
                  </td>
                  <td>No prop threading.</td>
                </tr>
                <tr>
                  <td>Skip an expensive calculation</td>
                  <td>
                    <code>useMemo</code>
                  </td>
                  <td>Cached until deps change.</td>
                </tr>
                <tr>
                  <td>Keep a function reference stable for a memoised child</td>
                  <td>
                    <code>useCallback</code>
                  </td>
                  <td>Same identity → <code>memo</code> can skip.</td>
                </tr>
                <tr>
                  <td>Keep typing smooth while a heavy screen updates</td>
                  <td>
                    <code>useTransition</code> / <code>useDeferredValue</code>
                  </td>
                  <td>Marks the heavy update as interruptible.</td>
                </tr>
                <tr>
                  <td>Subscribe to a store or browser API safely</td>
                  <td>
                    <code>useSyncExternalStore</code>
                  </td>
                  <td>Consistent snapshots under concurrent rendering.</td>
                </tr>
                <tr>
                  <td>Show the result instantly while a request is in flight</td>
                  <td>
                    <code>useOptimistic</code>
                  </td>
                  <td>Temporary state that reverts on failure.</td>
                </tr>
                <tr>
                  <td>Track a form submission's pending/result state</td>
                  <td>
                    <code>useActionState</code>, <code>useFormStatus</code>
                  </td>
                  <td>Built for <code>&lt;form action&gt;</code>.</td>
                </tr>
                <tr>
                  <td>Generate ids that match between server and client</td>
                  <td>
                    <code>useId</code>
                  </td>
                  <td>Stable across hydration; use for <code>htmlFor</code>/<code>aria-*</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="useState in 20 lines — the model, not the real implementation"
          highlight={[2, 3, 7, 8, 19]}
          code={`
// One list of slots per component, one cursor that resets each render
let slots: any[] = []
let cursor = 0

function useState<T>(initial: T): [T, (next: T) => void] {
  // Take the next slot; create it on the first render only
  const i = cursor++
  if (slots[i] === undefined) slots[i] = initial

  const setState = (next: T) => {
    slots[i] = next
    scheduleRender()          // React: enqueue update, re-render this fiber
  }
  return [slots[i], setState]
}

function render(Component: () => void) {
  cursor = 0                  // walk the same list from the top, in the same order
  Component()
}

// Why the rules exist: if Component calls useState inside an \`if\`,
// the cursor drifts and every later hook reads its neighbour's slot.
`}
        />
        <CodeBlock
          title="The same component, four hooks, four slots"
          code={`
function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('')            // slot 0: value + update queue
  const inputRef = useRef<HTMLInputElement>(null)   // slot 1: { current }
  const debounced = useDebouncedValue(query, 300)   // slot 2 & 3: its own useState + useEffect

  useEffect(() => {                                 // slot 4: effect fn, deps, cleanup
    if (debounced) onSearch(debounced)
  }, [debounced, onSearch])

  return <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} />
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="A toy hook list — and what happens when call order changes">
          <ToyDemo />
        </Demo>
      </Section>

      <Callout kind="note">
        <ul>
          <li>
            Real React stores hooks as a linked list on the fiber and keeps separate "current" and "work-in-progress"
            copies so a render can be discarded. The array-and-cursor model above is accurate for everything that
            matters to you as a user.
          </li>
          <li>
            The <strong>React Compiler</strong> relies on this positional model too: it can only memoise components
            whose hook calls are unconditional, which is another reason to keep the rules.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
