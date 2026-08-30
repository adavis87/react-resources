import { useEffect, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// Simulated network: slow for "b", fast for the others, so a race is easy to provoke
function fakeFetch(id: string, signal: AbortSignal): Promise<string> {
  const delay = id === 'b' ? 1800 : 500
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(`Record ${id.toUpperCase()} · loaded after ${delay}ms`), delay)
    signal.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

function useRecord(id: string, cancel: boolean) {
  const [state, setState] = useState<{ status: 'loading' | 'ok' | 'error'; data?: string; error?: string }>({
    status: 'loading',
  })
  const [events, setEvents] = useState<string[]>([])

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    setEvents((e) => [`→ request ${id}`, ...e].slice(0, 6))

    fakeFetch(id, controller.signal)
      .then((data) => {
        setState({ status: 'ok', data })
        setEvents((e) => [`✓ resolved ${id}`, ...e].slice(0, 6))
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') {
          setEvents((e) => [`✗ aborted ${id}`, ...e].slice(0, 6))
          return
        }
        setState({ status: 'error', error: err.message })
      })

    return () => {
      if (cancel) controller.abort()
    }
  }, [id, cancel])

  return { ...state, events }
}

function FetchDemo() {
  const [id, setId] = useState('a')
  const [cancel, setCancel] = useState(true)
  const { status, data, events } = useRecord(id, cancel)
  return (
    <>
      <div className="row">
        {['a', 'b', 'c'].map((x) => (
          <button key={x} onClick={() => setId(x)} aria-pressed={id === x}>
            Load {x.toUpperCase()}
          </button>
        ))}
        <label className="row">
          <input type="checkbox" checked={cancel} onChange={(e) => setCancel(e.target.checked)} /> abort on change
        </label>
      </div>
      <div className="box">{status === 'loading' ? <span className="mono">loading {id}…</span> : <span>{data}</span>}</div>
      <div className="log">{events.join('\n')}</div>
      <p className="mono">Click B then quickly A. With abort off, slow B can overwrite A's result — the race you are guarding against.</p>
    </>
  )
}

export const dataFetchingHook: Entry = {
  slug: 'data-fetching-hook',
  title: 'A data-fetching hook',
  group: 'Structure & data',
  level: 'intermediate',
  summary:
    'Wrap fetch in a custom hook that tracks loading, error and data, and cancels stale requests so a slow response can never overwrite a newer one.',
  tags: ['fetch', 'useEffect', 'AbortController', 'race condition', 'custom hook', 'loading state'],
  body: (
    <>
      <Section title="What it is">
          <Prose>
          <p>
            Fetching in an effect has three parts that are easy to get wrong: modelling the three states (loading, error,
            data) as one value so they cannot disagree; cancelling the request when the inputs change or the component
            unmounts; and ignoring responses that arrive after a newer request started. A custom hook packages all three
            so call sites stay one line.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>Small apps or one-off components where adding a data library is not worth it.</li>
            <li>As a learning step — the hook below is what libraries do, minus caching and deduplication.</li>
            <li>
              In production, prefer a framework loader, TanStack Query or SWR, or React 19's <code>use()</code> with
              Suspense. They add caching, retries, and request deduplication that a hand-written hook will not.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="useFetch.ts"
          highlight={[13, 14, 22, 23, 24]}
          code={`
type State<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ok'; data: T }

export function useFetch<T>(url: string) {
  const [state, setState] = useState<State<T>>({ status: 'loading' })

  useEffect(() => {
    // One controller per request; aborting it cancels the network call
    const controller = new AbortController()
    setState({ status: 'loading' })

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(\`HTTP \${r.status}\`)
        return r.json() as Promise<T>
      })
      .then((data) => setState({ status: 'ok', data }))
      .catch((error: Error) => {
        // An aborted request is not an error — a newer one replaced it
        if (error.name === 'AbortError') return
        setState({ status: 'error', error })
      })

    return () => controller.abort()   // url changed or component unmounted
  }, [url])

  return state
}

// Call site
function User({ id }: { id: string }) {
  const user = useFetch<User>(\`/api/users/\${id}\`)
  if (user.status === 'loading') return <Spinner />
  if (user.status === 'error') return <ErrorMessage error={user.error} />
  return <Profile user={user.data} />
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Abort vs race">
          <FetchDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            If the API you call cannot be aborted, use an <code>ignore</code> flag instead: set{' '}
            <code>let ignore = false</code> in the effect, flip it in cleanup, and skip <code>setState</code> when it is
            true.
          </li>
          <li>
            Strict Mode mounts effects twice in development, so you will see one aborted request per mount. That is
            expected and proves the cleanup works.
          </li>
          <li>
            Putting an object (<code>options</code>) in the dependency array re-fetches every render. Depend on
            primitives, or memoise the object.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
