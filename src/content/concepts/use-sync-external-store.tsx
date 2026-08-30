import { useSyncExternalStore } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function subscribeToResize(cb: () => void) {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}
function useViewportWidth() {
  return useSyncExternalStore(subscribeToResize, () => window.innerWidth, () => 0)
}

function subscribeToOnline(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}
function useOnline() {
  return useSyncExternalStore(subscribeToOnline, () => navigator.onLine, () => true)
}

function StoreDemo() {
  const width = useViewportWidth()
  const online = useOnline()
  return (
    <div className="row">
      <span className="pill">viewport width: {width}px</span>
      <span className="pill">online: {String(online)}</span>
      <span className="mono">resize the window or toggle your network</span>
    </div>
  )
}

export const useSyncExternalStoreEntry: Entry = {
  slug: 'use-sync-external-store',
  title: 'useSyncExternalStore',
  group: 'Concurrent React',
  summary:
    'The correct way to read data that lives outside React — browser APIs, a global store, a WebSocket — without tearing under concurrent rendering.',
  tags: ['useSyncExternalStore', 'external store', 'subscribe', 'snapshot', 'tearing', 'browser APIs'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            <code>useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)</code> subscribes a component to an
            external source and re-renders it when the source changes. It returns the current snapshot. It exists
            because a <code>useEffect</code> + <code>useState</code> subscription can show different components
            different values during one concurrent render ("tearing"); this hook guarantees consistency.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              <code>subscribe(callback)</code> registers the callback with the store and returns an unsubscribe
              function. React calls it once (when stable) and calls the callback whenever the store notifies.
            </li>
            <li>
              <code>getSnapshot()</code> must return an immutable value that is the same reference until the store
              changes. Returning a new object every call causes an infinite loop.
            </li>
            <li>
              <code>getServerSnapshot()</code> supplies the value used during server rendering and hydration.
            </li>
            <li>
              Updates from external stores are always synchronous (not transitions), so they cannot be interrupted.
            </li>
            <li>
              Libraries such as Zustand, Redux, Jotai and TanStack Query use this hook internally. Reach for it
              directly to wrap browser APIs (<code>matchMedia</code>, <code>navigator.onLine</code>,{' '}
              <code>localStorage</code>, history) or a small hand-written store.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="A tiny store and a selector hook"
          highlight={[12, 13, 14, 21]}
          code={`
type Listener = () => void

function createStore<T>(initial: T) {
  let state = initial
  const listeners = new Set<Listener>()
  return {
    getState: () => state,
    setState(patch: Partial<T>) {
      state = { ...state, ...patch }             // new reference on every change
      listeners.forEach((l) => l())
    },
    subscribe(l: Listener) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

export const settings = createStore({ theme: 'light', fontSize: 16 })

export function useSettings<S>(selector: (s: Settings) => S): S {
  return useSyncExternalStore(settings.subscribe, () => selector(settings.getState()))
}

function FontSizeControl() {
  const size = useSettings((s) => s.fontSize)   // re-renders only when the selected primitive changes
  return <input type="range" value={size} onChange={(e) => settings.setState({ fontSize: +e.target.value })} />
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Two browser APIs wrapped as stores">
          <StoreDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Selectors that return new objects (<code>s =&gt; ({'{ a: s.a }'})</code>) break the snapshot contract. Select
            primitives, or memoise the selector result.
          </li>
          <li>
            Define <code>subscribe</code> outside the component or with <code>useCallback</code>; a new function each
            render resubscribes every time.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
