import { Suspense, lazy, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// Simulate a lazily loaded chunk that takes a moment to arrive
const LazyPanel = lazy(
  () =>
    new Promise<{ default: () => React.JSX.Element }>((resolve) =>
      setTimeout(() => resolve({ default: () => <div className="box">Heavy panel loaded from a separate chunk.</div> }), 1200),
    ),
)

function SuspenseDemo() {
  const [show, setShow] = useState(false)
  return (
    <>
      <div className="row">
        <button onClick={() => setShow((s) => !s)}>{show ? 'Hide panel' : 'Load panel (lazy)'}</button>
        <span className="mono">first load shows the fallback; later loads are instant</span>
      </div>
      {show && (
        <Suspense fallback={<div className="box mono">Loading chunk…</div>}>
          <LazyPanel />
        </Suspense>
      )}
    </>
  )
}

export const suspense: Entry = {
  slug: 'suspense-and-code-splitting',
  title: 'Suspense, lazy, and code splitting',
  group: 'Data flow',
  summary:
    'Suspense lets a component say "I am not ready yet" by suspending, and lets a boundary above it decide what to show meanwhile. lazy() uses it to split bundles.',
  tags: ['Suspense', 'lazy', 'code splitting', 'fallback', 'loading states', 'streaming'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            <code>&lt;Suspense fallback={'{...}'}&gt;</code> is a boundary for "not yet". When anything inside it
            suspends — a <code>lazy</code> component whose code is still downloading, or a component calling{' '}
            <code>use(promise)</code> on a pending promise — React shows the fallback for the whole boundary, then swaps
            in the real content once everything inside is ready.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              Suspending means throwing a promise (you never do this by hand; <code>lazy</code>, <code>use</code> and
              data libraries do). React catches it, renders the nearest fallback, and retries when the promise settles.
            </li>
            <li>
              <code>lazy(() =&gt; import('./Chart'))</code> returns a component that suspends until the dynamic import
              resolves. Bundlers turn the import into a separate chunk.
            </li>
            <li>
              Boundaries nest. A boundary near the top shows one big spinner; several small ones let independent parts
              of the page reveal separately. Content inside one boundary appears together ("all-or-nothing").
            </li>
            <li>
              Suspense preserves state: the suspended subtree is hidden, not unmounted, so revealing is cheap.
            </li>
            <li>
              With SSR, Suspense boundaries stream: the server sends the fallback HTML first, then the real HTML as it
              becomes ready.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Route-level code splitting with nested boundaries"
          highlight={[2, 3, 11, 14]}
          code={`
// Each becomes its own chunk, downloaded on first render
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))

function App() {
  return (
    <Layout>
      {/* One boundary for the page: shows a skeleton until the chunk arrives */}
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
      {/* An independent boundary: the sidebar can resolve on its own */}
      <Suspense fallback={<SidebarSkeleton />}>
        <ActivityFeed />
      </Suspense>
    </Layout>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo>
          <SuspenseDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Suspense is not a try/catch for loading states in effects. A component that fetches in{' '}
            <code>useEffect</code> and stores state never suspends.
          </li>
          <li>
            Creating the promise inside render (<code>use(fetch(...))</code>) creates a new one every render and
            suspends forever. Cache promises outside the component or in a library.
          </li>
          <li>
            Wrap a state update in <code>startTransition</code> to avoid showing an already-revealed boundary's
            fallback again on navigation.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
