import { useEffect, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

interface Stat {
  label: string
  value: number
}

// Presentational: props in, markup out. No hooks that touch the outside world.
function StatsView({ stats, loading, onRefresh }: { stats: Stat[]; loading: boolean; onRefresh: () => void }) {
  return (
    <div className="stack">
      <div className="row">
        <button onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <ul className="list">
        {stats.map((s) => (
          <li key={s.label} style={{ justifyContent: 'space-between' }}>
            <span>{s.label}</span>
            <span className="mono">{s.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// The "container" is now a hook: it knows how to get data, nothing about how it looks.
function useStats() {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    const t = setTimeout(() => {
      if (ignore) return
      setStats([
        { label: 'Sessions', value: 1200 + Math.round(Math.random() * 400) },
        { label: 'Sign-ups', value: 30 + Math.round(Math.random() * 20) },
        { label: 'Errors', value: Math.round(Math.random() * 5) },
      ])
      setLoading(false)
    }, 600)
    return () => {
      ignore = true
      clearTimeout(t)
    }
  }, [tick])

  return { stats, loading, refresh: () => setTick((n) => n + 1) }
}

function StatsPanel() {
  const { stats, loading, refresh } = useStats()
  return <StatsView stats={stats} loading={loading} onRefresh={refresh} />
}

export const containerPresentational: Entry = {
  slug: 'container-presentational',
  title: 'Container and presentational',
  group: 'Structure & data',
  level: 'intermediate',
  summary:
    'Separate how a component gets its data from how it renders it. Hooks made the "container" a function, but the split — logic in a hook, look in a pure component — still pays off.',
  tags: ['separation of concerns', 'custom hooks', 'presentational', 'testing', 'storybook'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            The original pattern paired a <em>container</em> component (fetches, subscribes, holds state) with a{' '}
            <em>presentational</em> component (receives props, renders markup). Hooks replaced the container class with a
            custom hook: <code>useStats()</code> returns the data and callbacks; <code>StatsView</code> turns them into
            elements. The boundary is the same — the wiring is just lighter.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>
              The view is worth rendering in isolation: in Storybook, in a unit test with fixed props, or in a second
              place with different data.
            </li>
            <li>
              The data logic is worth reusing: the same hook feeds a card and a full page.
            </li>
            <li>
              Not for every component. A small component that owns a toggle does not need a hook and a view; split when
              you feel the pull, not pre-emptively.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Split into a hook and a view"
          highlight={[2, 15, 26]}
          code={`
// useOrders.ts — how the data is obtained. No JSX.
export function useOrders(customerId: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  useEffect(() => {
    const c = new AbortController()
    fetchOrders(customerId, c.signal).then((o) => { setOrders(o); setStatus('ok') }).catch(() => setStatus('error'))
    return () => c.abort()
  }, [customerId])
  const cancel = (id: string) => setOrders((os) => os.filter((o) => o.id !== id))
  return { orders, status, cancel }
}

// OrdersView.tsx — how it looks. Pure: same props, same output. Trivial to test.
export function OrdersView({ orders, status, onCancel }: OrdersViewProps) {
  if (status === 'loading') return <Spinner />
  if (status === 'error') return <p>Could not load orders.</p>
  return (
    <ul>
      {orders.map((o) => <OrderRow key={o.id} order={o} onCancel={() => onCancel(o.id)} />)}
    </ul>
  )
}

// OrdersPanel.tsx — the two-line glue that used to be a "container"
export function OrdersPanel({ customerId }: { customerId: string }) {
  const { orders, status, cancel } = useOrders(customerId)
  return <OrdersView orders={orders} status={status} onCancel={cancel} />
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Hook feeds a pure view">
          <StatsPanel />
        </Demo>
      </Section>

      <Callout kind="note">
        <p>
          The test for a presentational component is "could I render it with hard-coded props and get exactly what I
          expect?" If it reaches for a router, a store or the network, it has grown a container inside it — pull that
          into a hook.
        </p>
      </Callout>
    </>
  ),
}
