import { useEffect, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function Ticker({ interval, onLog }: { interval: number; onLog: (s: string) => void }) {
  const [ticks, setTicks] = useState(0)
  useEffect(() => {
    onLog(`subscribe (every ${interval}ms)`)
    const id = setInterval(() => setTicks((t) => t + 1), interval)
    return () => {
      clearInterval(id)
      onLog(`cleanup (${interval}ms)`)
    }
    // onLog is stable in the parent (see below), so interval is the only dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval])
  return <span className="pill">ticks: {ticks}</span>
}

function EffectDemo() {
  const [interval, setIntervalMs] = useState(1000)
  const [mounted, setMounted] = useState(true)
  const [log, setLog] = useState<string[]>([])
  const [onLog] = useState(() => (s: string) => setLog((l) => [s, ...l].slice(0, 6)))
  return (
    <>
      <div className="row">
        <button onClick={() => setMounted((m) => !m)}>{mounted ? 'Unmount' : 'Mount'}</button>
        <select value={interval} onChange={(e) => setIntervalMs(Number(e.target.value))} aria-label="Interval">
          <option value={250}>250 ms</option>
          <option value={1000}>1000 ms</option>
          <option value={2000}>2000 ms</option>
        </select>
        {mounted && <Ticker interval={interval} onLog={onLog} />}
      </div>
      <div className="log">{log.length ? log.join('\n') : 'effect log…'}</div>
    </>
  )
}

export const useEffectEntry: Entry = {
  slug: 'use-effect',
  title: 'useEffect and the lifecycle',
  group: 'Hooks',
  summary:
    'Effects synchronise a component with something outside React — a subscription, a timer, the DOM — and clean up after themselves. They are not a lifecycle method.',
  tags: ['useEffect', 'lifecycle', 'cleanup', 'dependencies', 'useLayoutEffect', 'subscriptions'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            An effect is code that runs <em>after</em> React has committed to the DOM, and a matching cleanup that
            runs before the effect runs again or when the component unmounts. Think "synchronise with an external system
            while these values hold", not "on mount / on update".
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              After commit, React runs every effect whose dependency array contains a value that changed (compared with{' '}
              <code>Object.is</code>). Before running it, React calls the previous cleanup for that effect.
            </li>
            <li>
              <code>[]</code> means "no reactive values" — runs after mount, cleans up on unmount. No array means
              "after every render". Listing dependencies is not an optimisation; it is a correctness contract with the
              linter.
            </li>
            <li>
              <code>useLayoutEffect</code> is the same API but fires synchronously after DOM mutation and before paint.
              Use it only for measuring or positioning things that would otherwise flicker.
            </li>
            <li>
              In Strict Mode, React mounts, unmounts and remounts each component once in development. An effect with a
              correct cleanup is unaffected; one without will show duplicate subscriptions.
            </li>
          </ul>
          <h4>When you don't need an effect</h4>
          <ul>
            <li>Transforming data for rendering — compute it during render.</li>
            <li>Responding to a user action — do it in the event handler.</li>
            <li>Resetting state when a prop changes — use a <code>key</code>, or compute from the prop.</li>
            <li>Fetching data — prefer a framework loader, a query library, or <code>use()</code> with Suspense.</li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Subscribe, and always unsubscribe"
          highlight={[5, 10]}
          code={`
function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const conn = connect(roomId)              // start syncing with roomId
    conn.on('message', (m) => setMessages((prev) => [...prev, m]))

    return () => {
      conn.disconnect()                       // stop syncing before the next roomId, or on unmount
    }
  }, [roomId])                                // re-run only when roomId changes

  return <MessageList messages={messages} />
}

// Fetching with a stale-response guard (if you must fetch in an effect)
useEffect(() => {
  let ignore = false
  fetchUser(id).then((u) => { if (!ignore) setUser(u) })
  return () => { ignore = true }
}, [id])
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Cleanup runs before re-subscribe and on unmount">
          <EffectDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Objects and functions created during render are new on every render. Putting them in the dependency array
            makes the effect run every time; move them inside the effect, or wrap in <code>useMemo</code> /{' '}
            <code>useCallback</code>.
          </li>
          <li>
            Setting state inside an effect that depends on that state causes an infinite loop.
          </li>
          <li>
            Effects are not the place to derive state. If you find yourself writing{' '}
            <code>useEffect(() =&gt; setB(f(a)), [a])</code>, replace it with <code>const b = f(a)</code>.
          </li>
          <li>
            The effect function must return either a cleanup function or nothing. Making it <code>async</code> returns a
            promise, which React ignores with a warning.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
