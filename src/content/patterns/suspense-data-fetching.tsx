import { Suspense, use, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo implementation ---------------------------------------------------
// Promises must be stable across renders; cache them by key at module level.
const cache = new Map<string, Promise<{ name: string; loadedAt: string }>>()

function fetchProfile(key: string) {
  let p = cache.get(key)
  if (!p) {
    p = new Promise((resolve) =>
      setTimeout(() => resolve({ name: 'Grace Hopper', loadedAt: new Date().toLocaleTimeString() }), 1500),
    )
    cache.set(key, p)
  }
  return p
}

function Profile({ cacheKey }: { cacheKey: string }) {
  const profile = use(fetchProfile(cacheKey))
  return (
    <div className="box">
      <strong>{profile.name}</strong> <span className="mono">loaded at {profile.loadedAt}</span>
    </div>
  )
}

function SuspenseDemo() {
  const [version, setVersion] = useState(0)
  return (
    <div className="stack">
      <div className="row">
        <button onClick={() => setVersion((v) => v + 1)}>Reload (new promise)</button>
        <span className="mono">request #{version + 1}</span>
      </div>
      <Suspense fallback={<div className="box mono">Loading profile…</div>}>
        <Profile cacheKey={`profile-${version}`} />
      </Suspense>
    </div>
  )
}

export const suspenseDataFetching: Entry = {
  slug: 'suspense-data-fetching',
  title: 'Suspense data fetching',
  group: 'Rendering & data',
  level: 'advanced',
  summary:
    'Read a promise with use() and let a Suspense boundary above render the fallback. Loading state becomes tree structure instead of if-statements in every component.',
  tags: ['suspense', 'use', 'data fetching', 'fallback', 'streaming', 'react 19'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            <code>use(promise)</code> suspends the component until the promise settles: React pauses rendering that
            subtree, shows the nearest <code>&lt;Suspense fallback&gt;</code>, and retries the render when the data
            arrives. Errors from a rejected promise propagate to the nearest error boundary. The component itself reads
            data as though it were synchronous — no <code>loading</code> flag, no <code>useEffect</code>.
          </p>
          <p>
            The catch is that React re-runs the component on retry, so the promise must be the <em>same</em> promise —
            created once and cached, not recreated in render.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>
              With a framework or library that hands you cached promises: React Server Components, Next.js, TanStack
              Query's <code>useSuspenseQuery</code>, Relay.
            </li>
            <li>To coordinate several loading states into one fallback, or nest boundaries for progressive reveal.</li>
            <li>
              In a plain client app, only with a cache layer of your own. Ad-hoc promises in render re-fetch forever.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Profile.tsx"
          highlight={[4, 5, 6, 12, 25, 26, 27]}
          code={`
import { Suspense, use } from 'react'

// A minimal cache: one promise per key, reused across renders
const cache = new Map<string, Promise<User>>()
function getUser(id: string) {
  if (!cache.has(id)) cache.set(id, fetch(\`/api/users/\${id}\`).then((r) => r.json()))
  return cache.get(id)!
}

function Profile({ id }: { id: string }) {
  // Suspends until resolved; throws to the error boundary if rejected
  const user = use(getUser(id))
  return <h1>{user.name}</h1>
}

function Posts({ id }: { id: string }) {
  const posts = use(getPosts(id))
  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>
}

function Page({ id }: { id: string }) {
  return (
    <ErrorBoundary fallback={<p>Could not load profile.</p>}>
      <Suspense fallback={<Skeleton />}>
        <Profile id={id} />
        {/* Nested boundary: the header shows as soon as it's ready; posts stream in after */}
        <Suspense fallback={<p>Loading posts…</p>}>
          <Posts id={id} />
        </Suspense>
      </Suspense>
    </ErrorBoundary>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="use() with a cached promise">
          <SuspenseDemo />
        </Demo>
      </Section>

      <Callout kind="react19">
        <ul>
          <li>
            <code>use</code> is new in React 19. Unlike other hooks it may be called inside conditions and loops, and
            it also reads context. In React 18 the same effect required throwing the promise manually or a library.
          </li>
          <li>
            On the server, Suspense boundaries stream: the shell HTML arrives immediately and each boundary's content
            is injected as it resolves, without client JavaScript.
          </li>
          <li>
            Wrap navigations that trigger suspense in <code>startTransition</code> to keep the old UI visible instead of
            flashing the fallback.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
