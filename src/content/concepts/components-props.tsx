import type { ReactNode } from 'react'
import { useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function Card({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="box stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>{title}</strong>
        {actions}
      </div>
      <div>{children}</div>
    </div>
  )
}

function PropsDemo() {
  const [count, setCount] = useState(0)
  return (
    <Card title="Composed card" actions={<button onClick={() => setCount((c) => c + 1)}>Ping</button>}>
      The button lives in the <code>actions</code> slot; this text is <code>children</code>. Pinged{' '}
      <span className="pill">{count}</span> times — state lives in the parent, the card only renders what it is given.
    </Card>
  )
}

export const componentsProps: Entry = {
  slug: 'components-and-props',
  title: 'Components and props',
  group: 'Foundations',
  summary:
    'A component is a function from props to UI. Props flow down, are read-only, and are how components compose.',
  tags: ['components', 'props', 'children', 'composition', 'defaults'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            A component is a plain function that takes one argument — the <strong>props</strong> object — and returns
            elements. React calls it whenever it needs to know what that part of the tree looks like. Props are the
            component's inputs: parent decides, child renders. A child never mutates its props; if it needs to change
            something, it asks the parent to via a callback prop.
          </p>
          <p>
            <code>children</code> is just a prop with syntactic sugar: whatever you nest between the tags arrives as{' '}
            <code>props.children</code>. This is the primary mechanism for composition — a layout component does not
            need to know what it wraps.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              When a parent renders <code>&lt;Avatar size={'{40}'} /&gt;</code>, React creates an element whose type is
              the <code>Avatar</code> function and whose props are <code>{'{ size: 40 }'}</code>. During render, React
              calls <code>Avatar(props)</code>.
            </li>
            <li>
              Props are compared by identity between renders. A new object or function literal passed as a prop is a
              different prop, even if it looks the same — this matters for <code>memo</code> and effect dependencies.
            </li>
            <li>
              Destructure props with defaults in the parameter list. React 19 removed <code>defaultProps</code> for
              function components.
            </li>
            <li>
              Any value can be a prop, including elements and functions. Passing elements as props creates named
              "slots"; passing functions creates callbacks or render props.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Card.tsx"
          code={`
import type { ReactNode } from 'react'

interface CardProps {
  title: string
  /** Optional slot rendered top-right */
  actions?: ReactNode
  /** Whatever is nested between <Card> tags */
  children: ReactNode
  tone?: 'neutral' | 'danger'
}

export function Card({ title, actions, children, tone = 'neutral' }: CardProps) {
  return (
    <section className={\`card card--\${tone}\`}>
      <header>
        <h2>{title}</h2>
        {actions}
      </header>
      <div className="card__body">{children}</div>
    </section>
  )
}

// Usage — the parent owns the state; Card just renders what it is handed.
function Inbox() {
  const [archived, setArchived] = useState(false)
  return (
    <Card title="Weekly digest" actions={<button onClick={() => setArchived(true)}>Archive</button>}>
      {archived ? <p>Archived.</p> : <p>Three unread threads.</p>}
    </Card>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo>
          <PropsDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Never define a component inside another component's body. It is recreated every render, so React unmounts
            and remounts it, losing state and focus.
          </li>
          <li>
            Spreading unknown props onto a DOM element (<code>{'<div {...props}>'}</code>) leaks non-DOM attributes and
            triggers warnings. Pick what you forward.
          </li>
          <li>
            Props are read-only. Mutating them "works" until it silently doesn't; copy instead.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
