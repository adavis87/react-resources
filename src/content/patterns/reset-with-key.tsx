import { useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

const contacts = [
  { id: 'a1', name: 'Ada', note: 'Prefers email.' },
  { id: 'b2', name: 'Grace', note: 'Call after 3pm.' },
  { id: 'c3', name: 'Alan', note: '' },
]

function NoteEditor({ contact }: { contact: (typeof contacts)[number] }) {
  // Initial value only — this is deliberately not synced to the prop
  const [draft, setDraft] = useState(contact.note)
  return (
    <div className="box stack">
      <strong>{contact.name}</strong>
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} aria-label={`Note for ${contact.name}`} />
      <span className="mono">{draft === contact.note ? 'unchanged' : 'edited'}</span>
    </div>
  )
}

function ResetDemo() {
  const [selected, setSelected] = useState(contacts[0])
  const [useKey, setUseKey] = useState(true)
  return (
    <>
      <div className="row">
        {contacts.map((c) => (
          <button key={c.id} onClick={() => setSelected(c)} aria-pressed={c.id === selected.id}>
            {c.name}
          </button>
        ))}
        <label className="row">
          <input type="checkbox" checked={useKey} onChange={(e) => setUseKey(e.target.checked)} /> key=id
        </label>
      </div>
      {useKey ? <NoteEditor key={selected.id} contact={selected} /> : <NoteEditor contact={selected} />}
      <p className="mono">Edit a note, then switch contact. Without the key, the draft carries over to the wrong person.</p>
    </>
  )
}

export const resetWithKey: Entry = {
  slug: 'reset-with-key',
  title: 'Reset state with key',
  group: 'Structure & data',
  level: 'intermediate',
  summary:
    'To start a component over when its subject changes, give it a key tied to that subject. React remounts it with fresh state — no effect, no manual clearing.',
  tags: ['key', 'reset', 'remount', 'forms', 'identity'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            A component keeps its state as long as it stays at the same position with the same type <em>and key</em>.
            Changing the key tells React "this is a different instance": the old one unmounts, a new one mounts, and
            every <code>useState</code> inside starts from its initialiser. It is the cleanest way to reset an edit form
            when the record being edited changes.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>An editor whose draft state should not leak from one record to the next.</li>
            <li>A wizard or multi-step flow that must restart when the user logs out or switches accounts.</li>
            <li>Any component where the alternative is an effect that manually sets several states back to defaults.</li>
            <li>
              Not when you want to <em>preserve</em> work across the switch — then keep a map of drafts keyed by id
              instead.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="ContactPage.tsx"
          highlight={[5]}
          code={`
function ContactPage({ contactId }: { contactId: string }) {
  const contact = useContact(contactId)
  if (!contact) return <Spinner />
  // A different contact gets a brand-new form with fresh draft state
  return <ContactForm key={contact.id} contact={contact} />
}

function ContactForm({ contact }: { contact: Contact }) {
  const [name, setName] = useState(contact.name)      // initialiser runs once per mount
  const [email, setEmail] = useState(contact.email)
  // no useEffect(() => { setName(contact.name); setEmail(contact.email) }, [contact])
  return (
    <form onSubmit={() => save(contact.id, { name, email })}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button>Save</button>
    </form>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Switch records with and without a key">
          <ResetDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            A remount also re-runs effects, re-creates refs and loses focus and scroll. That is the point, but be
            deliberate about where the key sits — put it on the smallest subtree that needs resetting.
          </li>
          <li>
            The key must change only when you mean it to. Deriving it from an object reference that changes every
            render resets on every render.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
