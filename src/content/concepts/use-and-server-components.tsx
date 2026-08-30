import { Suspense, use, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// Module-level cache so the promise is stable across renders
const cache = new Map<number, Promise<string>>()
function loadQuote(id: number) {
  let p = cache.get(id)
  if (!p) {
    p = new Promise<string>((r) => setTimeout(() => r(['Rendering is a description.', 'Effects synchronise.', 'Keys are identity.'][id % 3]), 900))
    cache.set(id, p)
  }
  return p
}

function Quote({ id }: { id: number }) {
  const text = use(loadQuote(id)) // suspends until resolved
  return <div className="box">“{text}”</div>
}

function UseDemo() {
  const [id, setId] = useState(0)
  return (
    <>
      <div className="row">
        <button onClick={() => setId((i) => i + 1)}>Next quote (#{id + 1})</button>
        <span className="mono">use() reads a cached promise; Suspense shows the fallback</span>
      </div>
      <Suspense fallback={<div className="box mono">Loading quote…</div>}>
        <Quote id={id} />
      </Suspense>
    </>
  )
}

export const useAndServerComponents: Entry = {
  slug: 'use-and-server-components',
  title: 'use() and Server Components',
  group: 'Concurrent React',
  summary:
    'use() reads a promise or context during render and integrates with Suspense. Server Components run only on the server, sending rendered output — not JavaScript — to the client.',
  tags: ['use', 'React Server Components', 'RSC', 'server actions', 'use client', 'streaming'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            <code>use(resource)</code> is a React 19 API that, unlike other hooks, can be called inside conditions and
            loops. Given a promise, it suspends the component until the promise settles and returns the value (or
            throws the rejection to the nearest error boundary). Given a context, it behaves like{' '}
            <code>useContext</code>.
          </p>
          <p>
            <strong>React Server Components</strong> (RSC) are components that execute on the server — at build time
            or per request — and never ship to the browser. They can read databases and files directly, await data
            with plain <code>async/await</code>, and render Client Components where interactivity is needed. Frameworks
            such as Next.js App Router implement the model.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              <code>use(promise)</code> requires a <em>stable</em> promise: one created in a Server Component and
              passed as a prop, or cached by a library. Creating it in render restarts the fetch every time.
            </li>
            <li>
              Server Components are the default in an RSC framework. <code>'use client'</code> at the top of a file
              marks the boundary where client-side JavaScript begins; everything imported below it is bundled for the
              browser.
            </li>
            <li>
              Server Components cannot use state, effects or browser APIs. They can pass serialisable props (and
              promises, and other Server Component output as <code>children</code>) to Client Components.
            </li>
            <li>
              <strong>Server Actions</strong> (<code>'use server'</code>) are functions that run on the server and can
              be passed to <code>&lt;form action&gt;</code> or called from client code as RPC.
            </li>
            <li>
              Output streams: the server sends HTML plus an RSC payload; Suspense boundaries let parts of the page
              arrive as their data resolves.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Server Component streaming a promise to a Client Component"
          highlight={[3, 12, 17]}
          code={`
// app/page.tsx — Server Component (no directive needed)
export default async function Page() {
  const user = await db.users.find(currentUserId())     // direct data access
  const commentsPromise = db.comments.forUser(user.id)  // don't await: stream it

  return (
    <Profile user={user}>
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments commentsPromise={commentsPromise} />
      </Suspense>
    </Profile>
  )
}

// components/Comments.tsx — Client Component
'use client'
import { use } from 'react'

export function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise)     // suspends until the server resolves it
  return <ul>{comments.map((c) => <li key={c.id}>{c.body}</li>)}</ul>
}

// actions.ts — Server Action
'use server'
export async function addComment(formData: FormData) {
  await db.comments.insert({ body: formData.get('body') })
  revalidatePath('/')
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="use(promise) in a client-only app">
          <UseDemo />
        </Demo>
      </Section>

      <Callout kind="note">
        <ul>
          <li>
            RSC is a framework feature. A plain Vite app like this site has no server, so everything here is a Client
            Component; <code>use()</code> with a cached promise still works.
          </li>
          <li>
            Mental model: Server Components are for <em>data and layout</em>, Client Components are for{' '}
            <em>interaction</em>. Push <code>'use client'</code> as low in the tree as possible.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
