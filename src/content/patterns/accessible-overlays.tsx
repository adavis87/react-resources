import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo implementation ---------------------------------------------------
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const node = panel.current!
    const first = node.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab') return
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener?.focus() // restore focus to whatever opened the dialog
    }
  }, [onClose])

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 50 }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="demo"
        style={{ width: 'min(360px, 90vw)', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <strong id="demo-dialog-title">{title}</strong>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function OverlayDemo() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  return (
    <div className="stack">
      <div className="row">
        <button onClick={() => setOpen(true)}>Open dialog</button>
        {name && <span className="pill">saved: {name}</span>}
      </div>
      <p className="mono">Tab cycles inside the dialog; Escape or the backdrop closes it; focus returns to the button.</p>
      {open && (
        <Dialog title="Rename item" onClose={() => setOpen(false)}>
          <input placeholder="New name" value={name} onChange={(e) => setName(e.target.value)} aria-label="New name" />
          <div className="row">
            <button className="primary" onClick={() => setOpen(false)}>
              Save
            </button>
            <button onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export const accessibleOverlays: Entry = {
  slug: 'accessible-overlays',
  title: 'Accessible overlays',
  group: 'Rendering & data',
  level: 'advanced',
  summary:
    'Dialogs, drawers and popovers rendered through a portal, with focus trapped inside, Escape to dismiss, the page behind made inert, and focus restored on close.',
  tags: ['portal', 'dialog', 'focus trap', 'aria-modal', 'inert', 'accessibility'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            An overlay must escape its parent's <code>overflow</code> and stacking context, so it renders through{' '}
            <code>createPortal</code> into <code>document.body</code>. React events still bubble through the React
            tree, so the dialog can keep using context and handlers from where it was declared. What the portal does
            not give you is accessibility — that is a checklist:
          </p>
          <ul>
            <li>
              <strong>Focus moves in</strong> when it opens (first field or the panel itself) and{' '}
              <strong>returns</strong> to the opener when it closes.
            </li>
            <li>
              <strong>Tab is trapped</strong> inside; <strong>Escape</strong> closes.
            </li>
            <li>
              <code>role="dialog"</code>, <code>aria-modal="true"</code>, <code>aria-labelledby</code>; the rest of the
              page gets <code>inert</code> so screen readers can't wander behind the overlay.
            </li>
            <li>Background scroll is locked; clicking the backdrop dismisses (for non-destructive dialogs).</li>
          </ul>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>
              <strong>First choice: native <code>&lt;dialog&gt;</code></strong> with <code>showModal()</code>. The
              browser handles the focus trap, Escape, inertness and top-layer stacking. Wrap it in a small component
              that syncs an <code>open</code> prop to <code>showModal()</code> / <code>close()</code>.
            </li>
            <li>
              The hand-rolled version below when you need non-modal popovers, custom animation control, or must support
              a browser without <code>&lt;dialog&gt;</code>.
            </li>
            <li>
              For anything shipped to users, prefer a tested primitive (Radix, React Aria, Headless UI) over your own
              trap.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Modal.tsx"
          highlight={[9, 10, 22, 23, 24, 30]}
          code={`
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, children }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const app = document.getElementById('root')!
    app.inert = true                                         // page behind is unreachable
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') trapTab(e, panel.current!)        // wrap focus at the edges
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      app.inert = false
      opener?.focus()                                        // restore focus
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="backdrop" onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="modal-title"
           onClick={(e) => e.stopPropagation()}>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  )
}

// The pragmatic alternative: let the browser do it
function NativeDialog({ open, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { open ? ref.current?.showModal() : ref.current?.close() }, [open])
  return <dialog ref={ref} onClose={onClose}>{children}</dialog>
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Portal dialog with focus management">
          <OverlayDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            The portal must render <em>outside</em> the element you mark <code>inert</code>, or the dialog itself
            becomes unreachable. Render into <code>document.body</code>, not into the app root.
          </li>
          <li>
            Click-outside via a backdrop <code>onClick</code> needs <code>stopPropagation</code> on the panel — or
            compare <code>e.target === e.currentTarget</code>.
          </li>
          <li>
            Render the dialog conditionally (<code>{'{open && <Dialog />}'}</code>) so the effect's cleanup restores
            focus exactly once, on unmount.
          </li>
          <li>
            Stacked overlays each need their own trap and must restore focus in reverse order. This is where a library
            earns its keep.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
