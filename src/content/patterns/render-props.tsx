import { useState, type ReactNode } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function Toggle({ children }: { children: (api: { on: boolean; toggle: () => void }) => ReactNode }) {
  const [on, setOn] = useState(false)
  return <>{children({ on, toggle: () => setOn((v) => !v) })}</>
}

function RenderPropsDemo() {
  return (
    <div className="stack">
      <Toggle>
        {({ on, toggle }) => (
          <div className="row">
            <button onClick={toggle}>{on ? 'Turn off' : 'Turn on'}</button>
            <span className="pill">{on ? 'ON' : 'OFF'}</span>
          </div>
        )}
      </Toggle>
      <Toggle>
        {({ on, toggle }) => (
          <label className="row">
            <input type="checkbox" checked={on} onChange={toggle} />
            Same behaviour, completely different markup
          </label>
        )}
      </Toggle>
    </div>
  )
}

export const renderProps: Entry = {
  slug: 'render-props',
  title: 'Render props',
  group: 'Component APIs',
  level: 'advanced',
  summary:
    'A component that takes a function and calls it with data, leaving the caller to decide what to render. Hooks replaced most uses, but the pattern still wins when rendering must happen mid-tree.',
  tags: ['render props', 'function as child', 'inversion of control', 'virtualisation'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            A render prop is a prop whose value is a function returning elements. The component owns some behaviour —
            tracking the mouse, measuring a box, managing a toggle — and hands the results to that function instead of
            rendering anything itself. When the function is passed as <code>children</code> it is called
            "function as child".
          </p>
          <p>
            Before hooks this was the main way to share stateful logic. Today a custom hook is usually simpler: same
            logic, no extra nesting. The render prop survives where a hook cannot reach.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>
              <strong>The behaviour needs a place in the tree.</strong> A virtualised list must render each row inside
              its scrolling container; the consumer supplies <code>{'renderRow={(item, style) => ...}'}</code>.
            </li>
            <li>
              <strong>Per-item rendering</strong> in generic components: tables, selects, autocompletes that don't know
              what an item looks like.
            </li>
            <li>
              <strong>Bridging class components or third-party wrappers</strong> that can't call hooks.
            </li>
          </ul>
          <p>If none of these apply, write a hook.</p>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="VirtualList.tsx"
          highlight={[5, 22]}
          code={`
interface VirtualListProps<T> {
  items: T[]
  rowHeight: number
  height: number
  renderRow: (item: T, style: CSSProperties) => ReactNode   // the render prop
}

export function VirtualList<T>({ items, rowHeight, height, renderRow }: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const start = Math.floor(scrollTop / rowHeight)
  const end = Math.min(items.length, start + Math.ceil(height / rowHeight) + 1)

  return (
    <div style={{ height, overflow: 'auto' }} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ height: items.length * rowHeight, position: 'relative' }}>
        {items.slice(start, end).map((item, i) => {
          const index = start + i
          const style: CSSProperties = {
            position: 'absolute', top: index * rowHeight, height: rowHeight, left: 0, right: 0,
          }
          // The list positions rows; the caller decides what a row is
          return <Fragment key={index}>{renderRow(item, style)}</Fragment>
        })}
      </div>
    </div>
  )
}

// Usage
<VirtualList items={users} rowHeight={32} height={400}
  renderRow={(user, style) => <div style={style}>{user.name}</div>} />
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="One Toggle, two renderings">
          <RenderPropsDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            The function is new on every render of the parent, so a memoised child receiving it still re-renders. Use{' '}
            <code>useCallback</code> at the call site if the child is expensive.
          </li>
          <li>
            Nesting several render-prop components produces the "callback pyramid" that motivated hooks. Two levels is
            the practical limit.
          </li>
          <li>Hooks can't be called inside the render function conditionally — it is still part of render.</li>
        </ul>
      </Callout>
    </>
  ),
}
