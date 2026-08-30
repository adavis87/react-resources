import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo implementation ---------------------------------------------------
interface State {
  message: string
  ok: boolean
  submissions: number
}

async function subscribe(prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get('email') ?? '').trim()
  await new Promise((r) => setTimeout(r, 900))
  if (!email.includes('@')) return { ...prev, ok: false, message: 'Enter a valid email address.' }
  return { ok: true, message: `Subscribed ${email}.`, submissions: prev.submissions + 1 }
}

function SubmitButton() {
  const { pending } = useFormStatus() // reads the enclosing <form>'s status
  return (
    <button type="submit" className="primary" disabled={pending}>
      {pending ? 'Submitting…' : 'Subscribe'}
    </button>
  )
}

function FormActionDemo() {
  const [state, action, pending] = useActionState(subscribe, { message: '', ok: true, submissions: 0 })
  return (
    <form action={action} className="stack">
      <div className="row">
        <input name="email" type="text" placeholder="you@example.com" aria-label="Email" disabled={pending} />
        <SubmitButton />
        <span className="mono">{state.submissions} sent</span>
      </div>
      {state.message && (
        <p className={state.ok ? 'mono' : 'error-box'} role="status">
          {state.message}
        </p>
      )}
    </form>
  )
}

export const formActions: Entry = {
  slug: 'form-actions',
  title: 'Form actions',
  group: 'Rendering & data',
  level: 'advanced',
  summary:
    'Pass an async function to <form action>; React handles submission, pending state, resets and progressive enhancement. useActionState and useFormStatus expose the result and the in-flight status.',
  tags: ['form action', 'useActionState', 'useFormStatus', 'server actions', 'use server', 'react 19'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            In React 19 a form's <code>action</code> prop accepts a function. On submit React calls it with the{' '}
            <code>FormData</code>, wraps the call in a transition (so <code>useOptimistic</code> works inside it), and
            resets uncontrolled fields when it resolves. You no longer write <code>onSubmit</code>,{' '}
            <code>preventDefault</code>, and a <code>loading</code> flag.
          </p>
          <ul>
            <li>
              <code>useActionState(fn, initial)</code> wraps an action so it also returns the previous state and a{' '}
              <code>pending</code> flag — the idiomatic home for validation messages.
            </li>
            <li>
              <code>useFormStatus()</code> (from <code>react-dom</code>) lets a child of the form — a submit button —
              read whether the form is pending, without prop-drilling.
            </li>
            <li>
              In a framework with React Server Components, a function marked <code>'use server'</code> can be the
              action: the form posts to the server and the function runs there, with the form still working before
              JavaScript loads.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>Any form that submits to an API: sign-in, search, settings, comments.</li>
            <li>
              Mutations in Next.js / React Router framework mode, where server actions replace hand-written fetch
              endpoints.
            </li>
            <li>
              Still use controlled inputs and <code>onChange</code> for live validation or dependent fields; the two
              approaches compose.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="SubscribeForm.tsx"
          highlight={[5, 12, 13, 22, 23]}
          code={`
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

type State = { error?: string; email?: string }

async function subscribe(prev: State, formData: FormData): Promise<State> {
  const email = formData.get('email') as string
  if (!email.includes('@')) return { error: 'Enter a valid email.' }
  await api.subscribe(email)
  return { email }
}

function SubmitButton() {
  const { pending } = useFormStatus()       // must be rendered INSIDE the <form>
  return <button type="submit" disabled={pending}>{pending ? 'Sending…' : 'Subscribe'}</button>
}

export function SubscribeForm() {
  const [state, action, pending] = useActionState(subscribe, {})
  return (
    <form action={action}>
      <input name="email" type="email" required disabled={pending} />
      <SubmitButton />
      {state.error && <p role="alert">{state.error}</p>}
      {state.email && <p>Welcome, {state.email}.</p>}
    </form>
  )
}

// Server action (Next.js / RSC): same form, function runs on the server
// actions.ts
'use server'
export async function subscribe(prev: State, formData: FormData) { /* db write */ }
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="useActionState + useFormStatus">
          <FormActionDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            <code>useFormStatus</code> reads the nearest parent <code>&lt;form&gt;</code>. Calling it in the same
            component that renders the form returns <code>pending: false</code> forever — put it in a child.
          </li>
          <li>
            Uncontrolled fields reset after a successful action. To keep values (e.g. after a validation error), return
            them in the state and use <code>defaultValue</code>.
          </li>
          <li>
            Actions receive the previous state first when wrapped in <code>useActionState</code>, but only the{' '}
            <code>FormData</code> when passed straight to <code>action</code>. Match the signature.
          </li>
          <li>
            React 18 has none of this; <code>useActionState</code> was briefly called <code>useFormState</code> in the
            canary.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
