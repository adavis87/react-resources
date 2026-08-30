import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

interface Form {
  name: string
  plan: 'free' | 'team'
  newsletter: boolean
}

function ControlledDemo() {
  const [form, setForm] = useState<Form>({ name: '', plan: 'free', newsletter: true })
  const [submitted, setSubmitted] = useState<Form | null>(null)

  function update(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, type, value } = e.target
    const next = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm((f) => ({ ...f, [name]: next }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(form)
  }

  return (
    <form onSubmit={submit} className="stack">
      <div className="row">
        <input name="name" value={form.name} onChange={update} placeholder="Name" aria-label="Name" />
        <select name="plan" value={form.plan} onChange={update} aria-label="Plan">
          <option value="free">Free</option>
          <option value="team">Team</option>
        </select>
        <label className="row">
          <input type="checkbox" name="newsletter" checked={form.newsletter} onChange={update} />
          Newsletter
        </label>
        <button type="submit" className="primary" disabled={!form.name.trim()}>
          Save
        </button>
      </div>
      <div className="log">{JSON.stringify(submitted ?? form, null, 2)}</div>
    </form>
  )
}

export const controlledInputs: Entry = {
  slug: 'controlled-inputs',
  title: 'Controlled inputs',
  group: 'Everyday patterns',
  level: 'beginner',
  summary:
    'A controlled input renders whatever React state says and reports every change back. One handler can drive a whole form if fields are named.',
  tags: ['forms', 'controlled', 'uncontrolled', 'onChange', 'useActionState'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            An input is <strong>controlled</strong> when its <code>value</code> (or <code>checked</code>) comes from
            state and an <code>onChange</code> handler writes every keystroke back. React state is the source of truth,
            so validation, formatting and derived UI happen on the way through. An <strong>uncontrolled</strong> input
            keeps its own DOM value; you read it with a ref or from <code>FormData</code> on submit.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>
              <strong>Controlled:</strong> live validation, disabled submit buttons, dependent fields, masks, character
              counts — anything that reacts <em>while</em> the user types.
            </li>
            <li>
              <strong>Uncontrolled:</strong> simple forms you only read on submit, file inputs (always uncontrolled), and
              large forms where a re-render per keystroke is measurable.
            </li>
            <li>
              Name every field. One <code>onChange</code> handler can then update a single state object by{' '}
              <code>e.target.name</code>, instead of one <code>useState</code> per field.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="SignupForm.tsx"
          highlight={[8, 9, 10, 11]}
          code={`
interface Form { email: string; plan: 'free' | 'team'; terms: boolean }

function SignupForm() {
  const [form, setForm] = useState<Form>({ email: '', plan: 'free', terms: false })
  const valid = form.email.includes('@') && form.terms

  // One handler for text, select and checkbox — keyed by the field's name
  function update(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, type, value } = e.target
    const next = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm((f) => ({ ...f, [name]: next }))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); signup(form) }}>
      <input name="email" type="email" value={form.email} onChange={update} />
      <select name="plan" value={form.plan} onChange={update}>
        <option value="free">Free</option>
        <option value="team">Team</option>
      </select>
      <label>
        <input name="terms" type="checkbox" checked={form.terms} onChange={update} /> I agree
      </label>
      <button disabled={!valid}>Create account</button>
    </form>
  )
}
`}
        />
        <CodeBlock
          title="Uncontrolled: read on submit"
          code={`
function Feedback() {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    send({ message: String(data.get('message')), rating: Number(data.get('rating')) })
  }
  return (
    <form onSubmit={submit}>
      <textarea name="message" defaultValue="" />
      <input name="rating" type="range" defaultValue={3} min={1} max={5} />
      <button>Send</button>
    </form>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="One handler, three field types">
          <ControlledDemo />
        </Demo>
      </Section>

      <Callout kind="react19">
        <p>
          React 19 adds <strong>form actions</strong>: pass a function to <code>{'<form action={fn}>'}</code> and it
          receives the <code>FormData</code>, with <code>useActionState</code> and <code>useFormStatus</code> tracking
          pending and error state. That path is uncontrolled by design and covers most submit-only forms without any{' '}
          <code>onChange</code> plumbing.
        </p>
      </Callout>

      <Callout kind="gotcha">
        <ul>
          <li>
            Passing <code>value</code> without <code>onChange</code> makes the input read-only and logs a warning. Use{' '}
            <code>defaultValue</code> if you meant uncontrolled.
          </li>
          <li>
            Switching between <code>value={'{undefined}'}</code> and a string flips an input from uncontrolled to
            controlled mid-life. Initialise state to <code>''</code>, never <code>undefined</code>.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
