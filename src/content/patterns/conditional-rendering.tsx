import { useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

type Status = 'idle' | 'loading' | 'success' | 'error'

const statusView: Record<Status, string> = {
  idle: 'Nothing requested yet.',
  loading: 'Fetching…',
  success: 'Loaded 12 records.',
  error: 'Request failed. Try again.',
}

function ConditionalDemo() {
  const [status, setStatus] = useState<Status>('idle')
  const [unread, setUnread] = useState(0)
  return (
    <>
      <div className="row">
        {(['idle', 'loading', 'success', 'error'] as Status[]).map((s) => (
          <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s}>
            {s}
          </button>
        ))}
      </div>
      <div className="box stack">
        <p>
          Lookup map: <strong>{statusView[status]}</strong>
        </p>
        <p>
          Ternary: {status === 'error' ? <span className="error-box">Something broke</span> : <span className="pill">ok</span>}
        </p>
        <p>
          Guarded &&: unread = {unread} → {unread > 0 && <span className="pill">{unread} new</span>}
          {unread === 0 && <span className="mono">(renders nothing)</span>}
        </p>
        <div className="row">
          <button onClick={() => setUnread((u) => u + 1)}>+ unread</button>
          <button onClick={() => setUnread(0)}>clear</button>
        </div>
      </div>
    </>
  )
}

export const conditionalRendering: Entry = {
  slug: 'conditional-rendering',
  title: 'Conditional rendering',
  group: 'Everyday patterns',
  level: 'beginner',
  summary:
    'Five ways to show or hide UI, and the one that reads best for each shape of condition — either/or, maybe, many states, or bail out.',
  tags: ['conditional', 'ternary', '&&', 'early return', 'lookup map'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            JSX has no <code>if</code> directive; conditions are ordinary JavaScript. That gives you several tools, and
            choosing the right one is mostly about readability: match the shape of the condition to the shape of the
            code.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Shape</th>
                  <th>Tool</th>
                  <th>Reads as</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Either A or B</td>
                  <td>
                    <code>cond ? &lt;A /&gt; : &lt;B /&gt;</code>
                  </td>
                  <td>one of two views</td>
                </tr>
                <tr>
                  <td>Maybe A</td>
                  <td>
                    <code>cond &amp;&amp; &lt;A /&gt;</code>
                  </td>
                  <td>optional extra</td>
                </tr>
                <tr>
                  <td>Nothing at all</td>
                  <td>
                    <code>if (!ready) return null</code>
                  </td>
                  <td>guard clause at the top</td>
                </tr>
                <tr>
                  <td>One of many</td>
                  <td>object lookup keyed by status</td>
                  <td>a table, not a ladder</td>
                </tr>
                <tr>
                  <td>Complex branches</td>
                  <td>assign to a variable before the return</td>
                  <td>plain <code>if/else</code> above the JSX</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="OrderStatus.tsx"
          highlight={[3, 4, 5, 6, 12]}
          code={`
type Status = 'pending' | 'shipped' | 'delivered' | 'cancelled'

const badge: Record<Status, React.ReactNode> = {
  pending: <Badge tone="neutral">Pending</Badge>,
  shipped: <Badge tone="info">On its way</Badge>,
  delivered: <Badge tone="success">Delivered</Badge>,
  cancelled: <Badge tone="danger">Cancelled</Badge>,
}

function OrderStatus({ order }: { order?: Order }) {
  // Guard clause: bail out early, keep the main path flat
  if (!order) return null

  return (
    <div>
      {badge[order.status]}
      {/* "maybe": only when there is something to show */}
      {order.items.length > 0 && <ItemCount n={order.items.length} />}
      {/* either/or */}
      {order.trackingUrl ? <a href={order.trackingUrl}>Track</a> : <span>No tracking yet</span>}
    </div>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo>
          <ConditionalDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            <code>{'{items.length && <List />}'}</code> renders <code>0</code> when the array is empty. Compare
            explicitly: <code>{'items.length > 0 && ...'}</code>.
          </li>
          <li>
            Nested ternaries read badly past two levels. Move the logic above the <code>return</code> or into a lookup
            map.
          </li>
          <li>
            Rendering <code>{'{cond ? <Form /> : <Form compact />}'}</code> keeps one <code>Form</code> instance with its
            state; if you want a reset, add a <code>key</code>.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
