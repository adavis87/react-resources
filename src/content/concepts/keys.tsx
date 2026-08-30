import { useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function Row({ label }: { label: string }) {
  const [text, setText] = useState('')
  return (
    <li>
      <span style={{ minWidth: 70 }}>{label}</span>
      <input placeholder="type here…" value={text} onChange={(e) => setText(e.target.value)} aria-label={`Note for ${label}`} />
    </li>
  )
}

function KeysDemo() {
  const [items, setItems] = useState(['Alpha', 'Bravo', 'Charlie'])
  const [useIndex, setUseIndex] = useState(true)
  return (
    <>
      <div className="row">
        <button onClick={() => setItems((l) => [`New ${l.length + 1}`, ...l])}>Prepend item</button>
        <button onClick={() => setItems((l) => l.slice(1))} disabled={items.length === 0}>Remove first</button>
        <label className="row">
          <input type="checkbox" checked={useIndex} onChange={(e) => setUseIndex(e.target.checked)} />
          key = index
        </label>
      </div>
      <ul className="list">
        {items.map((item, i) => (
          <Row key={useIndex ? i : item} label={item} />
        ))}
      </ul>
      <p className="mono">Type in a box, then prepend. With index keys the text stays at the position; with stable keys it follows the item.</p>
    </>
  )
}

export const keys: Entry = {
  slug: 'keys-and-reconciliation',
  title: 'Keys and reconciliation',
  group: 'Foundations',
  summary:
    'Keys tell React which element is which across renders. Get them right and lists update cheaply; get them wrong and state leaks between rows.',
  tags: ['keys', 'reconciliation', 'diffing', 'lists', 'reset state'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Reconciliation is the algorithm React uses to turn "old tree, new tree" into DOM operations. It is
            deliberately simple: compare elements at the same position; if the type matches, update in place; if not,
            tear down and rebuild. For arrays of children, <code>key</code> replaces position as the identity, so items
            can move without being recreated.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              <strong>Same type, same position → update.</strong> React keeps the fiber (and its state, refs and DOM
              node) and patches changed props.
            </li>
            <li>
              <strong>Different type → replace.</strong> Switching <code>&lt;div&gt;</code> to <code>&lt;span&gt;</code>,
              or <code>&lt;A /&gt;</code> to <code>&lt;B /&gt;</code>, unmounts the old subtree entirely.
            </li>
            <li>
              <strong>Keys pin identity inside a list.</strong> React matches old and new children by key, so inserting at
              the front moves existing nodes instead of rewriting every row.
            </li>
            <li>
              <strong>A changed key forces a remount.</strong> This is a feature: give a component{' '}
              <code>key={'{userId}'}</code> and it resets all internal state when the user changes.
            </li>
            <li>Keys only need to be unique among siblings, not globally.</li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Stable keys, and key as a reset switch"
          highlight={[6, 17]}
          code={`
// Use a stable id from your data, never the array index for dynamic lists
function MessageList({ messages }: { messages: Message[] }) {
  return (
    <ul>
      {messages.map((m) => (
        <li key={m.id}>
          <MessageRow message={m} />
        </li>
      ))}
    </ul>
  )
}

// Resetting a subtree: a new key means a fresh component with fresh state
function ProfilePage({ userId }: { userId: string }) {
  return (
    <ProfileForm key={userId} userId={userId} />
    // when userId changes, every useState inside ProfileForm starts over
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Index keys vs stable keys">
          <KeysDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            <code>Math.random()</code> or <code>Date.now()</code> as a key creates a new identity each render — every row
            remounts on every update.
          </li>
          <li>
            Keys are not passed to the component as a prop. If you need the value, pass it separately.
          </li>
          <li>
            Conditionally rendering <code>{'{a ? <X /> : <Y />}'}</code> at the same position is a type change, so state
            resets — usually what you want. <code>{'{a ? <X id="1" /> : <X id="2" />}'}</code> keeps state between the
            two, which may not be.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
