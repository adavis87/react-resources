import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

export const stableKeys: Entry = {
  slug: 'stable-keys',
  title: 'Stable keys',
  group: 'Everyday patterns',
  level: 'beginner',
  summary:
    'Pick a key that identifies the item, not its position. When the data has no id, derive one deterministically — and use key on purpose when you want a reset.',
  tags: ['keys', 'lists', 'ids', 'reset'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            A key is the identity React uses to match list items between renders. A <em>stable</em> key is one that
            stays the same for the same item across renders, and differs for different items. Ids from a database are
            ideal. Array indexes are only stable while the list never reorders, inserts or removes from the middle.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>
              <strong>Data with ids:</strong> use the id. Always.
            </li>
            <li>
              <strong>Data without ids:</strong> derive a key from fields that together identify the item (email, ISO
              date + title). Generate ids once, when the item is created — not during render.
            </li>
            <li>
              <strong>Static lists that never change:</strong> index is acceptable, though a value-based key is rarely
              harder to write.
            </li>
            <li>
              <strong>Deliberate reset:</strong> put a <code>key</code> on a component whose state should start over when
              a value changes.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Keys in three situations"
          highlight={[5, 14, 25]}
          code={`
// 1. Ids from data
function Contacts({ contacts }: { contacts: Contact[] }) {
  return contacts.map((c) => (
    <ContactRow key={c.id} contact={c} />
  ))
}

// 2. No id: assign one when the item is created, not when it renders
function addTodo(text: string) {
  setTodos((prev) => [
    ...prev,
    // crypto.randomUUID() is available in every modern browser
    { id: crypto.randomUUID(), text, done: false },
  ])
}

// Composite key for read-only data with no id field
function Timeline({ events }: { events: Event[] }) {
  return events.map((e) => <EventRow key={\`\${e.date}-\${e.title}\`} event={e} />)
}

// 3. Key as a reset: a new conversation gets a fresh composer
function Chat({ conversationId }: { conversationId: string }) {
  return <Composer key={conversationId} conversationId={conversationId} />
}
`}
        />
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            <code>key={'{Math.random()}'}</code> or <code>key={'{Date.now()}'}</code> remounts every row on every render.
            State, focus and scroll position are lost.
          </li>
          <li>
            Index keys plus a controlled input per row is the classic bug: delete row 2 and row 3's text appears in row
            2's box.
          </li>
          <li>
            Keys are per sibling group. Two separate lists can reuse the same keys without conflict.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
