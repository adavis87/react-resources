import { useState, type ReactNode } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function Panel({ heading, aside, children }: { heading: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="box stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>{heading}</strong>
        {aside}
      </div>
      {children}
    </div>
  )
}

// Specialisation by wrapping — no inheritance needed
function WarningPanel({ children }: { children: ReactNode }) {
  return (
    <Panel heading="Heads up" aside={<span className="pill">warning</span>}>
      {children}
    </Panel>
  )
}

function CompositionDemo() {
  const [dismissed, setDismissed] = useState(false)
  return (
    <div className="stack">
      <Panel heading="Generic panel" aside={<button onClick={() => setDismissed((d) => !d)}>{dismissed ? 'Show' : 'Dismiss'}</button>}>
        The heading, the aside and this body were all handed in by the parent.
      </Panel>
      {!dismissed && <WarningPanel>A specialised panel that fixes the heading and aside, and only accepts a body.</WarningPanel>}
    </div>
  )
}

export const composition: Entry = {
  slug: 'composition-over-inheritance',
  title: 'Composition over inheritance',
  group: 'Everyday patterns',
  level: 'beginner',
  summary:
    'React components never extend each other. Build variety by nesting (children), by passing elements into named slots, and by wrapping a general component in a specific one.',
  tags: ['composition', 'children', 'slots', 'specialisation', 'wrapper'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Instead of a base class with overridable methods, React gives you three composition tools: nest content with{' '}
            <code>children</code>; accept elements through any prop to create named slots; and wrap a generic component
            in a more specific one that pins down some of its props. Every pattern later in this manual — compound
            components, render props, providers — is one of these three in disguise.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>
              <strong>children:</strong> layouts, cards, modals — anything that frames arbitrary content.
            </li>
            <li>
              <strong>Slot props</strong> (<code>header</code>, <code>footer</code>, <code>icon</code>): when there is
              more than one place content can go, and it is elements rather than data.
            </li>
            <li>
              <strong>Specialisation:</strong> <code>DangerButton</code> is <code>Button</code> with{' '}
              <code>tone="danger"</code> fixed. Wrap, don't fork.
            </li>
            <li>
              Reach for slots instead of boolean flags when a component grows <code>showIcon</code>,{' '}
              <code>iconPosition</code>, <code>iconSize</code>… a single <code>icon</code> slot replaces all three.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Dialog.tsx"
          highlight={[5, 6, 7, 21]}
          code={`
import type { ReactNode } from 'react'

interface DialogProps {
  title: ReactNode
  footer?: ReactNode       // named slot
  children: ReactNode      // main content
  onClose: () => void
}

export function Dialog({ title, footer, children, onClose }: DialogProps) {
  return (
    <div role="dialog" aria-modal="true">
      <header><h2>{title}</h2><button onClick={onClose} aria-label="Close">×</button></header>
      <div>{children}</div>
      {footer && <footer>{footer}</footer>}
    </div>
  )
}

// Specialisation: a confirm dialog is a Dialog with a fixed footer
export function ConfirmDialog({ onConfirm, onClose, children }: ConfirmProps) {
  return (
    <Dialog
      title="Are you sure?"
      onClose={onClose}
      footer={<><button onClick={onClose}>Cancel</button><button onClick={onConfirm}>Confirm</button></>}
    >
      {children}
    </Dialog>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Slots and specialisation">
          <CompositionDemo />
        </Demo>
      </Section>

      <Callout kind="note">
        <p>
          Composition also isolates re-renders: content passed as <code>children</code> is created by the parent, so
          when the wrapper re-renders its own state, the children elements are the same references and React skips them.
          See <em>Re-render isolation</em> in the advanced tier.
        </p>
      </Callout>
    </>
  ),
}
