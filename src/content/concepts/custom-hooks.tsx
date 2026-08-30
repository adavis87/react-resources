import { useEffect, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

function useLocalStorage(key: string, initial: string) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  }, [key, value])
  return [value, setValue] as const
}

function HooksDemo() {
  const wide = useMediaQuery('(min-width: 900px)')
  const dark = useMediaQuery('(prefers-color-scheme: dark)')
  const [note, setNote] = useLocalStorage('rfm-demo-note', '')
  return (
    <>
      <div className="row">
        <span className="pill">viewport ≥ 900px: {String(wide)}</span>
        <span className="pill">OS prefers dark: {String(dark)}</span>
      </div>
      <div className="row">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Persisted to localStorage" aria-label="Note" />
        <span className="mono">reload the page — it survives</span>
      </div>
    </>
  )
}

export const customHooks: Entry = {
  slug: 'custom-hooks',
  title: 'Custom hooks and the rules of hooks',
  group: 'Hooks',
  summary:
    'A custom hook is a function that calls other hooks. It shares logic, not state — each call gets its own. The rules of hooks exist because hooks are matched by call order.',
  tags: ['custom hooks', 'rules of hooks', 'reuse', 'useMediaQuery', 'useLocalStorage'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Any function whose name starts with <code>use</code> and that calls hooks inside is a custom hook. React
            does nothing special with it; the naming convention lets the linter check the rules and lets readers know
            the function has React state or effects attached. Extracting a hook is the standard way to reuse stateful
            behaviour between components.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              Hooks inside a custom hook attach to whichever component is currently rendering. Two components using{' '}
              <code>useLocalStorage</code> have two independent states.
            </li>
            <li>
              Custom hooks compose: a hook can call another custom hook.
            </li>
            <li>
              Return whatever shape is convenient: a value, a tuple, an object. Tuples read well for "value + setter"
              pairs.
            </li>
          </ul>
          <h4>The rules</h4>
          <ol>
            <li>
              <strong>Only call hooks at the top level</strong> of a component or custom hook — never inside loops,
              conditions, nested functions, or after an early return. React identifies each hook by its position in the
              call sequence.
            </li>
            <li>
              <strong>Only call hooks from React functions</strong> — components or other hooks — so React has a
              current fiber to attach state to.
            </li>
          </ol>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="useDebouncedValue and useOnlineStatus"
          code={`
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function useOnlineStatus(): boolean {
  // useSyncExternalStore is the right primitive for browser APIs (see its entry)
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb)
      window.addEventListener('offline', cb)
      return () => {
        window.removeEventListener('online', cb)
        window.removeEventListener('offline', cb)
      }
    },
    () => navigator.onLine,
    () => true, // server snapshot
  )
}

function Search() {
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q)
  const online = useOnlineStatus()
  const results = useResults(debouncedQ, { enabled: online })
  // ...
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo>
          <HooksDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            A hook that returns a new object or function each render forces re-renders in memoised consumers. Return
            stable references (<code>useCallback</code>, or state setters, which are already stable).
          </li>
          <li>
            Don't prefix a plain helper with <code>use</code>. If it calls no hooks, it isn't one.
          </li>
          <li>
            Custom hooks that wrap fetching are easy to write and hard to get right (races, caching, dedup). For
            production, use a query library or framework data loading.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
