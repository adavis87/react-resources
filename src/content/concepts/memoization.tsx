import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

const Expensive = memo(function Expensive({ onSelect, label }: { onSelect: () => void; label: string }) {
  const renders = useRef(0)
  renders.current += 1
  return (
    <li>
      <span>{label}</span>
      <span className="mono">rendered {renders.current}×</span>
      <button onClick={onSelect}>select</button>
    </li>
  )
})

function MemoDemo() {
  const [tick, setTick] = useState(0)
  const [selected, setSelected] = useState('')
  const stable = useCallback(() => setSelected('stable'), [])
  const unstable = () => setSelected('unstable')
  const total = useMemo(() => Array.from({ length: 5000 }, (_, i) => i).reduce((a, b) => a + b, 0), [])
  return (
    <>
      <div className="row">
        <button onClick={() => setTick((t) => t + 1)}>Re-render parent ({tick})</button>
        <span className="pill">selected: {selected || '—'}</span>
        <span className="mono">useMemo total: {total}</span>
      </div>
      <ul className="list">
        <Expensive label="memo + useCallback" onSelect={stable} />
        <Expensive label="memo + inline function" onSelect={unstable} />
      </ul>
    </>
  )
}

export const memoization: Entry = {
  slug: 'memoization',
  title: 'Memoization: memo, useMemo, useCallback',
  group: 'Hooks',
  summary:
    'Memoization caches a result keyed on its inputs so React can skip work. It only helps when the inputs are referentially stable — which is the whole trick.',
  tags: ['memo', 'useMemo', 'useCallback', 'performance', 'referential equality', 'React Compiler'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <ul>
            <li>
              <code>memo(Component)</code> skips re-rendering when the new props are shallow-equal to the previous
              props.
            </li>
            <li>
              <code>useMemo(fn, deps)</code> returns the cached result of <code>fn</code> until a dependency changes.
            </li>
            <li>
              <code>useCallback(fn, deps)</code> is <code>useMemo(() =&gt; fn, deps)</code>: a stable function reference.
            </li>
          </ul>
          <p>
            They exist because React compares by identity. A component wrapped in <code>memo</code> that receives an
            inline <code>onClick</code> arrow re-renders every time anyway, because the arrow is a new function each
            render. <code>useCallback</code> makes the reference stable, which makes <code>memo</code> effective.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              The cache is per component instance and holds only the last value. Changing deps discards it.
            </li>
            <li>
              Dependencies follow the same rules as effects: every reactive value used inside must be listed.
            </li>
            <li>
              Memoization has a cost (storing values, comparing deps). It pays off for expensive calculations, for
              props flowing into <code>memo</code> children, and for values used as effect or context dependencies.
            </li>
            <li>
              It is an optimisation, not a guarantee: React may discard cached values (e.g. for offscreen trees). Code
              must stay correct without it.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Stable props into a memoised child"
          highlight={[7, 10, 19]}
          code={`
function ProductList({ products, query }: { products: Product[]; query: string }) {
  const [cart, setCart] = useState<string[]>([])

  // Expensive filter recomputes only when products or query change
  const visible = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  )

  // Stable handler: doesn't depend on cart thanks to the functional update
  const addToCart = useCallback((id: string) => {
    setCart((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  return (
    <ul>
      {visible.map((p) => (
        // Row only re-renders when its product or addToCart changes
        <Row key={p.id} product={p} onAdd={addToCart} />
      ))}
    </ul>
  )
}

const Row = memo(function Row({ product, onAdd }: { product: Product; onAdd: (id: string) => void }) {
  return <li onClick={() => onAdd(product.id)}>{product.name}</li>
})
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="memo only works with stable props">
          <MemoDemo />
        </Demo>
      </Section>

      <Callout kind="react19">
        <p>
          With the <strong>React Compiler</strong> enabled, components and hooks are memoised automatically at build
          time, and hand-written <code>useMemo</code> / <code>useCallback</code> become mostly unnecessary. The compiler
          requires code to follow the rules of React; it skips components that don't.
        </p>
      </Callout>

      <Callout kind="gotcha">
        <ul>
          <li>
            Wrapping everything in <code>useCallback</code> without a <code>memo</code> child or dependency consumer
            does nothing except add overhead.
          </li>
          <li>
            <code>memo</code> is defeated by a single unstable prop — including <code>children</code>, which is a new
            element object every render.
          </li>
          <li>
            Passing <code>style={'{{ ... }}'}</code> or <code>options={'{{ ... }}'}</code> inline creates a new object
            each time. Hoist constants out of the component.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
