import { useActionState, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

async function fakeSubscribe(_prev: { ok: boolean; message: string }, formData: FormData) {
  await new Promise((r) => setTimeout(r, 700))
  const email = String(formData.get('email') ?? '')
  if (!email.includes('@')) return { ok: false, message: 'Enter a valid email address.' }
  return { ok: true, message: `Subscribed ${email}.` }
}

function FormsDemo() {
  const [value, setValue] = useState('')
  const [state, action, pending] = useActionState(fakeSubscribe, { ok: true, message: '' })
  return (
    <div className="stack">
      <div className="row">
        <input value={value} onChange={(e) => setValue(e.target.value.toUpperCase())} placeholder="Controlled: forced uppercase" aria-label="Controlled input" />
        <span className="mono">{value.length} chars</span>
      </div>
      <form action={action} className="row">
        <input name="email" type="email" placeholder="you@example.com" aria-label="Email" />
        <button type="submit" className="primary" disabled={pending}>
          {pending ? 'Subscribing…' : 'Subscribe (form action)'}
        </button>
        {state.message && <span className={state.ok ? 'pill' : 'error-box'}>{state.message}</span>}
      </form>
    </div>
  )
}

export const eventsForms: Entry = {
  slug: 'events-and-forms',
  title: 'Events and forms',
  group: 'Foundations',
  summary:
    'React events are synthetic wrappers delivered through delegation. Forms are either controlled by state or read at submit time — React 19 adds actions for the latter.',
  tags: ['events', 'onChange', 'forms', 'controlled', 'uncontrolled', 'useActionState', 'form actions'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Handlers are passed as props: <code>onClick={'{fn}'}</code>, not <code>onclick="fn()"</code>. React
            attaches one native listener per event type at the root and dispatches a <strong>SyntheticEvent</strong>{' '}
            — a cross-browser wrapper with the same interface as the native event — to the handlers in your tree.
          </p>
          <p>
            For inputs there are two designs. A <strong>controlled</strong> input's value is React state; every
            keystroke goes through <code>onChange</code> and the UI is the single source of truth. An{' '}
            <strong>uncontrolled</strong> input keeps its own DOM value; you read it with a ref or from{' '}
            <code>FormData</code> on submit.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              Pass the function, don't call it: <code>onClick={'{handle}'}</code> or{' '}
              <code>onClick={'{() => handle(id)}'}</code>. <code>onClick={'{handle()}'}</code> runs during render.
            </li>
            <li>
              <code>onChange</code> in React fires on every input event (like native <code>input</code>), not only on
              blur.
            </li>
            <li>
              Events bubble through React's tree. <code>e.stopPropagation()</code> stops React handlers;{' '}
              <code>e.preventDefault()</code> stops browser defaults such as form navigation.
            </li>
            <li>
              A controlled input needs both <code>value</code> and <code>onChange</code>. Providing <code>value</code>{' '}
              alone freezes the field; use <code>defaultValue</code> for an uncontrolled start value.
            </li>
            <li>
              <strong>React 19 form actions:</strong> pass a function to <code>&lt;form action&gt;</code>. React calls
              it with the <code>FormData</code>, resets the form on success, and tracks pending state through{' '}
              <code>useActionState</code> and <code>useFormStatus</code>.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Controlled input and a React 19 form action"
          highlight={[12, 20]}
          code={`
function Search({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSearch(q) }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} />
      <button type="submit" disabled={!q.trim()}>Search</button>
    </form>
  )
}

async function subscribe(prev: State, formData: FormData): Promise<State> {
  const email = formData.get('email') as string
  const res = await fetch('/api/subscribe', { method: 'POST', body: formData })
  return res.ok ? { ok: true, message: \`Subscribed \${email}\` } : { ok: false, message: 'Try again' }
}

function Newsletter() {
  // state: last returned value; action: pass to <form>; pending: true while running
  const [state, action, pending] = useActionState(subscribe, { ok: true, message: '' })
  return (
    <form action={action}>
      <input name="email" type="email" required />
      <button disabled={pending}>{pending ? 'Sending…' : 'Subscribe'}</button>
      {state.message && <p role="status">{state.message}</p>}
    </form>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo>
          <FormsDemo />
        </Demo>
      </Section>

      <Callout kind="react19">
        <ul>
          <li>
            <code>useActionState</code> replaces the experimental <code>useFormState</code>. <code>useFormStatus</code>{' '}
            (from <code>react-dom</code>) reads the pending state of the nearest parent form from inside a child button.
          </li>
          <li>
            Async transitions: a form action runs inside a transition, so the UI stays responsive and <code>pending</code>{' '}
            is tracked automatically.
          </li>
        </ul>
      </Callout>

      <Callout kind="gotcha">
        <ul>
          <li>
            Switching an input from uncontrolled to controlled (value goes from <code>undefined</code> to a string) logs
            a warning. Initialise state to <code>''</code>.
          </li>
          <li>
            Reading <code>e.target.value</code> inside an async callback is fine in React 17+ (event pooling is gone).
          </li>
        </ul>
      </Callout>
    </>
  ),
}
