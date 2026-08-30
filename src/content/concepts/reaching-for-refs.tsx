import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo 1: stale closure vs latest-value ref vs useEffectEvent ------------
function StaleDemo() {
  const [message, setMessage] = useState('hello')
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const messageRef = useRef(message)
  messageRef.current = message // always the latest, written during render is fine for a mirror
  const onTick = useEffectEvent((source: string) => {
    setLog((l) => [`${source}: "${message}"`, ...l].slice(0, 6))
  })

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      // 1. closure — captured "message" from the render that started the interval
      setLog((l) => [`closure: "${message}"`, ...l].slice(0, 6))
      // 2. ref — reads whatever is current now
      setLog((l) => [`ref: "${messageRef.current}"`, ...l].slice(0, 6))
      // 3. effect event — same idea, official API
      onTick('useEffectEvent')
    }, 1500)
    return () => clearInterval(id)
    // message deliberately omitted: the point is to NOT restart the interval on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  return (
    <div className="stack">
      <div className="row">
        <input value={message} onChange={(e) => setMessage(e.target.value)} aria-label="Message" />
        <button onClick={() => setRunning((r) => !r)}>{running ? 'Stop interval' : 'Start interval'}</button>
        <button onClick={() => setLog([])}>Clear</button>
      </div>
      <div className="log">{log.length ? log.join('\n') : 'start the interval, then edit the text…'}</div>
      <p className="mono">The closure keeps reporting the text from when you pressed Start. The ref and the effect event see edits.</p>
    </div>
  )
}

// --- demo 2: callback ref + ResizeObserver to measure, ref map for a list ---
function MeasureDemo() {
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [text, setText] = useState('Resize me by typing more text into this box.')
  const [items] = useState(() => Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`))
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map())
  const [focused, setFocused] = useState<string | null>(null)

  // Callback ref: runs when the node attaches; returns cleanup (React 19) for detach
  const measure = useCallback((node: HTMLTextAreaElement | null) => {
    if (!node) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  function scrollTo(id: string) {
    itemRefs.current.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    setFocused(id)
  }

  return (
    <div className="stack">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <textarea ref={measure} value={text} onChange={(e) => setText(e.target.value)} rows={3} style={{ width: 260, resize: 'both' }} aria-label="Measured box" />
        <span className="pill">
          {size.w} × {size.h}px
        </span>
      </div>
      <div className="row">
        <button onClick={() => scrollTo('Item 12')}>Scroll to item 12</button>
        <button onClick={() => scrollTo('Item 1')}>Scroll to item 1</button>
      </div>
      <ul className="list" style={{ maxHeight: 120, overflowY: 'auto' }}>
        {items.map((id) => (
          <li
            key={id}
            ref={(node) => {
              if (node) itemRefs.current.set(id, node)
              else itemRefs.current.delete(id)
            }}
            style={{ background: focused === id ? 'var(--accent-soft)' : undefined }}
          >
            {id}
          </li>
        ))}
      </ul>
    </div>
  )
}

// --- demo 3: useLayoutEffect to position a tooltip without flicker ---------
function TooltipDemo() {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, top: 0 })

  useLayoutEffect(() => {
    if (!open || !btnRef.current || !tipRef.current) return
    const b = btnRef.current.getBoundingClientRect()
    const t = tipRef.current.getBoundingClientRect()
    // Measured after DOM mutation, applied before paint — no visible jump
    setPos({ left: b.width / 2 - t.width / 2, top: -t.height - 8 })
  }, [open])

  return (
    <div className="row" style={{ paddingTop: 44 }}>
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <button ref={btnRef} onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide tooltip' : 'Show tooltip'}
        </button>
        {open && (
          <div
            ref={tipRef}
            role="tooltip"
            style={{
              position: 'absolute',
              left: pos.left,
              top: pos.top,
              whiteSpace: 'nowrap',
              background: 'var(--ink)',
              color: 'var(--paper)',
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 12.5,
              fontFamily: 'var(--font-mono)',
            }}
          >
            centred by measuring both boxes
          </div>
        )}
      </span>
      <span className="mono">positioned in useLayoutEffect, so it never renders in the wrong place first</span>
    </div>
  )
}

export const reachingForRefs: Entry = {
  slug: 'when-to-reach-for-a-ref',
  title: 'When to reach for a ref',
  group: 'Hooks',
  summary:
    'The one question that decides it: does the screen need to change when this value changes? If not, it is a ref. Here are the situations where that answer is "no", and the hooks that pair with refs.',
  tags: ['useRef', 'refs', 'stale closure', 'useEffectEvent', 'useLayoutEffect', 'useImperativeHandle', 'callback ref', 'ResizeObserver', 'previous value'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Every value in a component is one of three things: a <strong>prop</strong> (owned by the parent),{' '}
            <strong>state</strong> (owned here, drives rendering), or a <strong>ref</strong> (owned here, does not
            drive rendering). People reach for state by default and end up with either extra renders or a value that
            is always one render stale. The test is simple:
          </p>
          <ul>
            <li>
              If changing the value should change what is on screen → <code>useState</code>.
            </li>
            <li>
              If changing the value should change nothing on screen, but you need it next time something happens →{' '}
              <code>useRef</code>.
            </li>
            <li>
              If you can compute it from props or state during render → neither. Just compute it.
            </li>
          </ul>
          <p>
            A ref is a mutable box that survives renders and is invisible to React's rendering. Reading or writing{' '}
            <code>.current</code> in an event handler or effect is always safe; doing it during render is not, with one
            deliberate exception described below.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <h4>The situations, and what they look like in code</h4>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Situation</th>
                  <th>Tell-tale sign</th>
                  <th>Reach for</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Focus, scroll, select, measure, or play a DOM element</td>
                  <td>You are about to call <code>document.querySelector</code></td>
                  <td>
                    <code>useRef</code> + <code>ref</code> attribute, act in a handler or effect
                  </td>
                </tr>
                <tr>
                  <td>Hold a timer id, observer, socket, map instance, chart instance</td>
                  <td>You create it in an effect and need it in the cleanup or a handler</td>
                  <td>
                    <code>useRef</code> as an instance holder
                  </td>
                </tr>
                <tr>
                  <td>A long-lived callback (interval, listener, socket handler) keeps seeing old state</td>
                  <td>"It always logs the value from when I started it"</td>
                  <td>
                    <code>useEffectEvent</code> (official) or a "latest value" ref
                  </td>
                </tr>
                <tr>
                  <td>Compare with the previous value of a prop or state</td>
                  <td>"Did this change since last render?"</td>
                  <td>
                    Store the previous value in state during render, or a ref written in an effect
                  </td>
                </tr>
                <tr>
                  <td>Count or flag something without showing it</td>
                  <td>Render counters, "has the user interacted", first-run guards</td>
                  <td>
                    <code>useRef</code>; never put it in state
                  </td>
                </tr>
                <tr>
                  <td>Measure an element and position something before paint</td>
                  <td>A tooltip or popover flashes in the wrong spot for one frame</td>
                  <td>
                    <code>useRef</code> + <code>useLayoutEffect</code>
                  </td>
                </tr>
                <tr>
                  <td>React to an element's size changing</td>
                  <td>Responsive container queries, auto-growing inputs</td>
                  <td>
                    Callback ref + <code>ResizeObserver</code> (cleanup returned, React 19)
                  </td>
                </tr>
                <tr>
                  <td>Refs for a dynamic list of elements</td>
                  <td>Scroll to item N, focus the row you just added</td>
                  <td>
                    One <code>useRef(new Map())</code>, filled by callback refs
                  </td>
                </tr>
                <tr>
                  <td>Expose a small API from a child (focus(), reset(), open())</td>
                  <td>The parent needs to trigger something, not read something</td>
                  <td>
                    <code>useImperativeHandle</code> on the <code>ref</code> prop
                  </td>
                </tr>
                <tr>
                  <td>Pass a ref through to an inner element</td>
                  <td>Wrapping an input in a design-system component</td>
                  <td>
                    React 19: accept <code>ref</code> as a prop; React 18: <code>forwardRef</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4>The stale-closure problem, precisely</h4>
          <p>
            A function created during render closes over that render's props and state. If it lives longer than the
            render — inside <code>setInterval</code>, an event listener, a socket callback — it keeps seeing those
            values forever, no matter how many renders happen afterwards. You have three ways out:
          </p>
          <ol>
            <li>
              <strong>Add the value to the dependency array</strong>, so the effect re-runs and re-creates the callback.
              Correct, but it restarts the subscription on every change — bad for an interval or a connection.
            </li>
            <li>
              <strong>Mirror the value into a ref</strong> (<code>latest.current = value</code> every render) and read{' '}
              <code>latest.current</code> inside the callback. Writing a ref during render is normally forbidden;
              mirroring the current value is the one case where it is harmless, because it is idempotent and only used
              outside render.
            </li>
            <li>
              <strong><code>useEffectEvent</code></strong> (React 19.2): declare the callback with it, and it always
              sees the latest values without being a dependency. This is the sanctioned version of the ref trick, and
              the one to prefer when the callback is called from an effect.
            </li>
          </ol>

          <h4>useLayoutEffect and refs</h4>
          <p>
            Refs are populated during commit, before layout effects run. So <code>useLayoutEffect</code> is the first
            moment <code>ref.current</code> is guaranteed to exist and have layout — which is why measuring belongs
            there when the result affects what the user sees on the very next frame. If the measurement only feeds
            analytics or a later calculation, <code>useEffect</code> is fine and cheaper.
          </p>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Four ref patterns you will actually use"
          highlight={[5, 6, 14, 24, 25, 35]}
          code={`
// 1. Latest-value ref: an interval that never restarts but never goes stale
function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback)
  // mirror on every render — idempotent, never read during render
  saved.current = callback
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => saved.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

// 2. The same idea with the official API
function useIntervalEvent(callback: () => void, delay: number | null) {
  const tick = useEffectEvent(callback)   // always sees current props/state; not a dependency
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(tick, delay)
    return () => clearInterval(id)
  }, [delay])
}

// 3. Previous value, without an effect (React docs' recommended shape)
function Price({ value }: { value: number }) {
  const [prev, setPrev] = useState(value)
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)
  if (value !== prev) {                    // adjusting state during render: allowed, re-renders immediately
    setPrev(value)
    setDirection(value > prev ? 'up' : 'down')
  }
  return <span className={direction ?? ''}>{value}</span>
}

// 4. Imperative handle: expose an API, not a DOM node (React 19: ref is a prop)
function VideoPlayer({ ref, src }: { ref?: Ref<{ play(): void; seek(s: number): void }>; src: string }) {
  const el = useRef<HTMLVideoElement>(null)
  useImperativeHandle(ref, () => ({
    play: () => el.current?.play(),
    seek: (s) => { if (el.current) el.current.currentTime = s },
  }), [])
  return <video ref={el} src={src} />
}
`}
        />
        <CodeBlock
          title="Instance holders and ref maps"
          highlight={[3, 8, 20]}
          code={`
function Map({ center }: { center: LatLng }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<mapbox.Map | null>(null)       // third-party instance, not state

  useEffect(() => {
    if (!container.current) return
    map.current = new mapbox.Map({ container: container.current, center })
    return () => { map.current?.remove(); map.current = null }
  }, [])                                             // create once

  useEffect(() => { map.current?.setCenter(center) }, [center])   // update in place

  return <div ref={container} style={{ height: 400 }} />
}

function Rows({ rows }: { rows: Row[] }) {
  const nodes = useRef(new Map<string, HTMLTableRowElement>())
  // callback refs fill the map on attach and clear it on detach
  const focusRow = (id: string) => nodes.current.get(id)?.focus()
  return rows.map((r) => (
    <tr key={r.id} tabIndex={-1} ref={(n) => { n ? nodes.current.set(r.id, n) : nodes.current.delete(r.id) }}>
      …
    </tr>
  ))
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Stale closure vs latest ref vs useEffectEvent">
          <StaleDemo />
        </Demo>
        <Demo title="Callback ref + ResizeObserver, and a ref map for scrolling">
          <MeasureDemo />
        </Demo>
        <Demo title="useLayoutEffect: measure, then position, before paint">
          <TooltipDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            If you find yourself reading <code>ref.current</code> in JSX, the value belongs in state — the screen will
            not update when it changes.
          </li>
          <li>
            A ref set in a child's callback ref is available in the parent's effects, not during the parent's render.
            Never branch on <code>ref.current</code> in render.
          </li>
          <li>
            <code>useEffectEvent</code> functions may only be called from inside effects (or other effect events), not
            from handlers or render, and must not be passed to other components.
          </li>
          <li>
            Don't reach for <code>useLayoutEffect</code> by default: it blocks paint. Use it only when a measurement
            must land before the user sees the frame.
          </li>
          <li>
            Adjusting state during render (pattern 3 above) is allowed only for the component's <em>own</em> state and
            must be guarded by a condition, or it loops.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
