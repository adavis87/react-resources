import { useOptimistic, useState, useTransition } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo implementation ---------------------------------------------------
let attempts = 0
function saveLike(next: number): Promise<number> {
  attempts += 1
  return new Promise((resolve, reject) =>
    setTimeout(() => (attempts % 3 === 0 ? reject(new Error('Server rejected the like')) : resolve(next)), 900),
  )
}

function OptimisticDemo() {
  const [likes, setLikes] = useState(12)
  const [optimistic, addOptimistic] = useOptimistic(likes, (current, delta: number) => current + delta)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function like() {
    setError(null)
    startTransition(async () => {
      addOptimistic(1) // shown immediately
      try {
        const confirmed = await saveLike(likes + 1)
        setLikes(confirmed) // real state catches up; optimistic value is discarded
      } catch (e) {
        setError((e as Error).message + ' — count rolled back') // optimistic value reverts automatically
      }
    })
  }

  return (
    <div className="stack">
      <div className="row">
        <button className="primary" onClick={like} disabled={pending}>
          {pending ? 'Saving…' : 'Like'}
        </button>
        <span className="pill">{optimistic} likes</span>
        <span className="mono">confirmed: {likes}</span>
      </div>
      {error && <p className="error-box">{error}</p>}
      <p className="mono">Every third request fails.</p>
    </div>
  )
}

export const optimisticUpdates: Entry = {
  slug: 'optimistic-updates',
  title: 'Optimistic updates',
  group: 'Rendering & data',
  level: 'advanced',
  summary:
    'Show the result of an action before the server confirms it, and fall back automatically if it fails. useOptimistic makes the temporary state explicit and self-reverting.',
  tags: ['useOptimistic', 'transitions', 'actions', 'latency', 'rollback', 'react 19'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            <code>useOptimistic(state, updateFn)</code> returns a view of <code>state</code> that you can patch during
            an async action. While the action is pending, the component renders the patched value; when it finishes —
            success or failure — React discards the patch and renders whatever <code>state</code> is now. On success you
            will have updated <code>state</code> with the confirmed value; on failure you did nothing, so the UI simply
            snaps back.
          </p>
          <p>
            Rollback is not code you write; it is the absence of a state update. That is what makes this safer than
            hand-rolled "set, then reset on catch" logic.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>Likes, follows, toggles, reordering — high-frequency, low-stakes actions that almost always succeed.</li>
            <li>Adding an item to a list where waiting 500 ms for the server feels broken.</li>
            <li>Not for payments, deletions, or anything where showing a false success is worse than a spinner.</li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="LikeButton.tsx"
          highlight={[6, 7, 12, 13, 15]}
          code={`
import { useOptimistic, useState, useTransition } from 'react'

function LikeButton({ postId, initial }: { postId: string; initial: number }) {
  const [likes, setLikes] = useState(initial)
  // Derived, temporary state: real likes + pending deltas
  const [optimisticLikes, addOptimistic] = useOptimistic(likes, (current, delta: number) => current + delta)
  const [pending, startTransition] = useTransition()

  function like() {
    startTransition(async () => {
      addOptimistic(1)                              // 1. instant UI
      const confirmed = await api.like(postId)      // 2. server round trip
      setLikes(confirmed)                           // 3. commit the real value
      // If api.like throws, step 3 never runs and optimisticLikes reverts to likes
    })
  }

  return (
    <button onClick={like} disabled={pending}>
      ♥ {optimisticLikes}
    </button>
  )
}

// With a form action the transition is implicit:
<form action={async () => { addOptimistic(1); setLikes(await api.like(postId)) }}>
  <button type="submit">♥ {optimisticLikes}</button>
</form>
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Like button with a flaky server">
          <OptimisticDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            <code>addOptimistic</code> must be called inside a transition or a form action; outside one, React warns
            and the value is dropped immediately.
          </li>
          <li>
            Surface failures. The UI reverts silently, so log or toast the error or users will think the click did
            nothing.
          </li>
          <li>
            Multiple pending actions stack: two quick likes apply two deltas, and each resolves independently. Make the
            update function commutative.
          </li>
          <li>Requires React 19. On 18, libraries like TanStack Query provide the equivalent with manual rollback.</li>
        </ul>
      </Callout>
    </>
  ),
}
