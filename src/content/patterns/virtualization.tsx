import { useRef, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo implementation ---------------------------------------------------
const TOTAL = 50_000
const ROW = 36
const OVERSCAN = 5
const rows = Array.from({ length: TOTAL }, (_, i) => ({
  id: i,
  label: `Row ${i.toLocaleString()}`,
  tag: ['render', 'commit', 'effect', 'layout'][i % 4],
}))

function VirtualDemo() {
  const [scrollTop, setScrollTop] = useState(0)
  const [enabled, setEnabled] = useState(true)
  const viewportRef = useRef<HTMLDivElement>(null)
  const height = 240

  const start = enabled ? Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN) : 0
  const end = enabled ? Math.min(TOTAL, Math.ceil((scrollTop + height) / ROW) + OVERSCAN) : Math.min(TOTAL, 300)
  const visible = rows.slice(start, end)

  return (
    <div className="stack">
      <div className="row">
        <span className="pill">{TOTAL.toLocaleString()} rows</span>
        <span className="pill">{visible.length} in the DOM</span>
        <label className="row">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          virtualize
        </label>
        <button onClick={() => viewportRef.current?.scrollTo({ top: TOTAL * ROW })}>Jump to end</button>
      </div>
      <div
        ref={viewportRef}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        style={{ height, overflowY: 'auto', border: '1px solid var(--rule-strong)', borderRadius: 4, background: 'var(--paper)' }}
        role="list"
        aria-label="Virtualized rows"
      >
        <div style={{ height: (enabled ? TOTAL : end) * ROW, position: 'relative' }}>
          {visible.map((r, i) => (
            <div
              key={r.id}
              role="listitem"
              style={{
                position: 'absolute',
                top: (start + i) * ROW,
                height: ROW,
                left: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0 12px',
                borderBottom: '1px solid var(--rule)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>{r.label}</span>
              <span className="mono">{r.tag}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mono">
        Unchecked renders only the first 300 rows (rendering all 50,000 would freeze the tab). Checked renders the window
        plus {OVERSCAN} rows of overscan either side.
      </p>
    </div>
  )
}

export const virtualization: Entry = {
  slug: 'virtualization',
  title: 'Virtualization for large lists',
  group: 'Rendering & data',
  level: 'advanced',
  summary:
    'Render only the rows that fit in the viewport, positioned inside a container sized as if every row existed. The DOM stays small no matter how long the list is.',
  tags: ['virtualization', 'windowing', 'large lists', 'performance', 'react-virtual', 'react-window', 'scroll'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            A list with ten thousand rows is ten thousand DOM nodes, ten thousand component instances, and a layout
            pass proportional to all of them on every change — even though the user can only see thirty. Virtualization
            (or windowing) keeps the DOM proportional to the <em>viewport</em>: a scroll container holds a spacer element
            with the total height, and the component renders only the rows whose positions intersect the visible range,
            absolutely positioned where they would have been.
          </p>
          <p>
            The scrollbar is honest because the spacer has the full height. As the user scrolls, the window of rendered
            rows slides; React reconciles by key, so rows entering the window mount and rows leaving unmount.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>
              Lists, tables, logs and feeds with more than a few hundred rows, or where each row is expensive to render.
            </li>
            <li>
              Grids and spreadsheets: the same idea in two dimensions, windowing rows and columns.
            </li>
            <li>
              <strong>Not</strong> for short lists — the bookkeeping costs more than it saves, and native find-in-page,
              print, and screen-reader traversal all work better with real DOM.
            </li>
            <li>
              Try pagination or "load more" first if the data arrives from a server anyway; virtualization solves DOM
              size, not network size.
            </li>
          </ul>
          <h4>The pieces</h4>
          <ol>
            <li>
              A scroll container of fixed height (<code>overflow: auto</code>) whose <code>scrollTop</code> you track.
            </li>
            <li>
              The <strong>range</strong>: <code>start = floor(scrollTop / rowHeight)</code>,{' '}
              <code>end = ceil((scrollTop + viewportHeight) / rowHeight)</code>, widened by a few rows of{' '}
              <strong>overscan</strong> so fast scrolling doesn't flash blank space.
            </li>
            <li>
              A spacer sized <code>total × rowHeight</code>, with each rendered row positioned at{' '}
              <code>index × rowHeight</code> (or one <code>translateY</code> on a wrapper for the whole window).
            </li>
            <li>
              For <strong>variable heights</strong>: measure rows as they mount (<code>ResizeObserver</code>), cache
              the measurements, estimate unmeasured rows, and compute offsets from the running total.
            </li>
          </ol>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="A minimal fixed-height virtualizer"
          highlight={[9, 10, 11, 17, 21]}
          code={`
function VirtualList<T>({ items, rowHeight, height, renderRow }: {
  items: T[]; rowHeight: number; height: number; renderRow: (item: T, index: number) => ReactNode
}) {
  const [scrollTop, setScrollTop] = useState(0)
  const overscan = 5

  // Which indices intersect the viewport, plus a little either side
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const end = Math.min(items.length, Math.ceil((scrollTop + height) / rowHeight) + overscan)
  const window = items.slice(start, end)

  return (
    <div style={{ height, overflowY: 'auto' }} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      {/* Spacer: gives the scrollbar the true length */}
      <div style={{ height: items.length * rowHeight, position: 'relative' }}>
        {window.map((item, i) => (
          <div
            key={start + i}
            style={{ position: 'absolute', top: (start + i) * rowHeight, height: rowHeight, left: 0, right: 0 }}
          >
            {renderRow(item, start + i)}
          </div>
        ))}
      </div>
    </div>
  )
}
`}
        />
        <CodeBlock
          title="In practice: @tanstack/react-virtual handles measurement, overscan and scroll-to-index"
          code={`
import { useVirtualizer } from '@tanstack/react-virtual'

function Feed({ posts }: { posts: Post[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,     // initial guess; rows are measured after mount
    overscan: 8,
  })

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            ref={virtualizer.measureElement}       // reports the real height back
            data-index={row.index}
            style={{ position: 'absolute', top: 0, transform: \`translateY(\${row.start}px)\`, width: '100%' }}
          >
            <PostCard post={posts[row.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="50,000 rows, ~14 in the DOM">
          <VirtualDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Key rows by data id, not by window index, when rows hold state (expanded, selected, an input). With index
            keys, scrolling one row reassigns every row's state to its neighbour.
          </li>
          <li>
            Variable heights are where hand-rolled virtualizers break: a wrong estimate makes the scrollbar jump as rows
            measure. Use a library (<code>@tanstack/react-virtual</code>, <code>react-window</code>,{' '}
            <code>react-virtuoso</code>) unless every row is genuinely the same height.
          </li>
          <li>
            Only rendered rows exist for Ctrl-F, screen readers and "select all". Provide <code>aria-rowcount</code> /{' '}
            <code>aria-rowindex</code> on tables, and a real search box.
          </li>
          <li>
            Track scroll with state, not a ref — the range must trigger a render. If scrolling feels laggy, the row
            itself is too expensive; memoise it.
          </li>
          <li>
            For medium lists (a few hundred rows) CSS <code>content-visibility: auto</code> on each row skips
            layout and paint for offscreen rows with no JavaScript at all.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
