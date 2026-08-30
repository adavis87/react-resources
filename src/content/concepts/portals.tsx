import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function Toast({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const id = setTimeout(onClose, 2500)
    return () => clearTimeout(id)
  }, [onClose])
  return createPortal(
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 50,
        padding: '10px 14px',
        background: 'var(--ink)',
        color: 'var(--paper)',
        borderRadius: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
      }}
    >
      Rendered into document.body via a portal
    </div>,
    document.body,
  )
}

function PortalDemo() {
  const [open, setOpen] = useState(false)
  const [clicks, setClicks] = useState(0)
  const close = useRef(() => setOpen(false)).current
  return (
    <div
      className="box"
      style={{ overflow: 'hidden', height: 60 }}
      onClick={() => setClicks((c) => c + 1)}
    >
      <div className="row">
        <button onClick={() => setOpen(true)}>Show toast</button>
        <span className="mono">this box has overflow:hidden · bubbled clicks: {clicks}</span>
      </div>
      {open && <Toast onClose={close} />}
    </div>
  )
}

export const portals: Entry = {
  slug: 'portals',
  title: 'Portals',
  group: 'Concurrent React',
  summary:
    'A portal renders children into a different DOM node while keeping them in the same React tree — events bubble and context flows as if nothing moved.',
  tags: ['createPortal', 'modals', 'tooltips', 'z-index', 'overflow'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            <code>createPortal(children, domNode)</code> mounts <code>children</code> under <code>domNode</code> —
            typically <code>document.body</code> — instead of under the parent's DOM element. Modals, tooltips, toasts
            and dropdown menus use portals to escape ancestors with <code>overflow: hidden</code>, transforms, or
            stacking contexts that would clip or mis-layer them.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              Only the DOM placement changes. In React's tree the portal content is still a child of the component that
              rendered it, so context, state and error boundaries all work normally.
            </li>
            <li>
              Synthetic events bubble through the React tree, not the DOM tree: a click inside a portal reaches{' '}
              <code>onClick</code> handlers on the React ancestors, even though the DOM ancestor is{' '}
              <code>body</code>.
            </li>
            <li>
              The target node must exist when the portal renders. Rendering into <code>document.body</code> is always
              safe; a dedicated <code>#modal-root</code> in <code>index.html</code> keeps stacking order predictable.
            </li>
            <li>
              Accessibility still needs work: focus management, <code>aria-modal</code>, Escape handling and making the
              rest of the page <code>inert</code> are not automatic. Native <code>&lt;dialog&gt;</code> handles much of
              it.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Modal.tsx"
          highlight={[14, 21]}
          code={`
import { createPortal } from 'react-dom'

export function Modal({ open, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()      // native focus trap + Escape + ::backdrop
    if (!open && dialog.open) dialog.close()
  }, [open])

  if (!open) return null
  return createPortal(
    <dialog ref={ref} onClose={onClose} className="modal">
      {children}
      <button onClick={onClose}>Close</button>
    </dialog>,
    document.body,
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Escaping overflow: hidden, events still bubble">
          <PortalDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Because events bubble through React ancestors, a click inside a modal will trigger a parent's{' '}
            <code>onClick</code>. Stop propagation in the modal if that parent closes it.
          </li>
          <li>
            CSS inheritance follows the DOM: a portal into <code>body</code> does not inherit the parent's font or
            colour rules. Use design tokens on <code>:root</code>.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
