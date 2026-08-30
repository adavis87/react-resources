import { useSyncExternalStore } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo implementation ---------------------------------------------------
interface CartState {
  items: number
  currency: 'USD' | 'EUR'
}

function createStore<T>(initial: T) {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set: (patch: Partial<T>) => {
      state = { ...state, ...patch } // new object → new snapshot
      listeners.forEach((l) => l())
    },
  }
}

const cartStore = createStore<CartState>({ items: 0, currency: 'USD' })

function useCart<S>(selector: (s: CartState) => S): S {
  return useSyncExternalStore(cartStore.subscribe, () => selector(cartStore.getSnapshot()))
}

function CartBadge() {
  const items = useCart((s) => s.items) // only re-renders when items changes
  return <span className="pill">cart: {items}</span>
}

function CurrencyPicker() {
  const currency = useCart((s) => s.currency)
  return (
    <select value={currency} onChange={(e) => cartStore.set({ currency: e.target.value as CartState['currency'] })} aria-label="Currency">
      <option>USD</option>
      <option>EUR</option>
    </select>
  )
}

function StoreDemo() {
  return (
    <div className="stack">
      <div className="row">
        <button onClick={() => cartStore.set({ items: cartStore.getSnapshot().items + 1 })}>Add to cart</button>
        <button onClick={() => cartStore.set({ items: 0 })}>Empty</button>
        <CartBadge />
        <CurrencyPicker />
      </div>
      <p className="mono">Both components read one module-level store; no provider, no prop passing.</p>
    </div>
  )
}

export const externalStore: Entry = {
  slug: 'external-store',
  title: 'External store',
  group: 'Rendering & data',
  level: 'advanced',
  summary:
    'Keep shared, frequently changing state in a plain object outside React and subscribe components to slices of it with useSyncExternalStore — the primitive under Zustand, Redux and Jotai.',
  tags: ['useSyncExternalStore', 'store', 'selectors', 'tearing', 'zustand', 'redux'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            <code>useSyncExternalStore(subscribe, getSnapshot)</code> connects a component to state React does not own.
            React calls <code>getSnapshot</code> during render, calls <code>subscribe</code> once to be told about
            changes, and re-renders when the snapshot's identity changes. Crucially it keeps every component on the same
            version of the store within one render — no "tearing", where two components show different values during a
            concurrent render.
          </p>
          <p>
            Add a selector and you have the core of Zustand: components subscribe to a slice and re-render only when
            that slice changes, with no provider and no context re-render cascade.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>State updated many times a second (cursor position, websocket ticks, audio state) that would flood context.</li>
            <li>State that must be read or written outside React: analytics, non-React widgets, keyboard shortcuts.</li>
            <li>Browser APIs: <code>matchMedia</code>, <code>navigator.onLine</code>, <code>localStorage</code>, history.</li>
            <li>
              For app state with middleware, devtools and persistence, use Zustand or Redux Toolkit rather than growing
              this by hand. For server data, use TanStack Query.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="store.ts"
          highlight={[9, 10, 11, 12, 20, 21]}
          code={`
import { useSyncExternalStore } from 'react'

export function createStore<T>(initial: T) {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(patch: Partial<T>) {
      state = { ...state, ...patch }        // immutable: a new snapshot identity per change
      listeners.forEach((l) => l())
    },
    subscribe(l: () => void) {
      listeners.add(l)
      return () => listeners.delete(l)      // must return an unsubscribe function
    },
  }
}

export const store = createStore({ count: 0, user: null as User | null })

export function useStore<S>(selector: (s: typeof store extends { get: () => infer T } ? T : never) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()))
}

// Components subscribe to slices
function Counter() {
  const count = useStore((s) => s.count)
  return <button onClick={() => store.set({ count: count + 1 })}>{count}</button>
}

// Browser API example: server snapshot avoids hydration mismatches
function useOnline() {
  return useSyncExternalStore(
    (cb) => { window.addEventListener('online', cb); window.addEventListener('offline', cb)
              return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb) } },
    () => navigator.onLine,
    () => true,                             // getServerSnapshot
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Two components, one module-level store">
          <StoreDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            <code>getSnapshot</code> must return the <em>same reference</em> when nothing changed. Returning a fresh
            object (<code>{'() => ({ ...state })'}</code>) or a fresh array from a selector triggers an infinite render
            loop. Select primitives or memoise.
          </li>
          <li>
            <code>subscribe</code> should be a stable function; defining it inline resubscribes on every render.
          </li>
          <li>
            Updates from an external store are always synchronous — they cannot be marked as transitions. Keep the
            store for state that must be consistent, and React state for UI that benefits from deprioritising.
          </li>
          <li>Provide <code>getServerSnapshot</code> when rendering on the server, or hydration throws.</li>
        </ul>
      </Callout>
    </>
  ),
}
