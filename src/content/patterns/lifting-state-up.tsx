import { useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function TempInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="row">
      <span style={{ minWidth: 80 }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" />
    </label>
  )
}

function LiftDemo() {
  // Source of truth lives here, in the parent. Both children read and write it.
  const [celsius, setCelsius] = useState('20')
  const c = parseFloat(celsius)
  const fahrenheit = Number.isNaN(c) ? '' : ((c * 9) / 5 + 32).toFixed(1)

  return (
    <div className="stack">
      <TempInput label="Celsius" value={celsius} onChange={setCelsius} />
      <TempInput
        label="Fahrenheit"
        value={fahrenheit}
        onChange={(f) => {
          const n = parseFloat(f)
          setCelsius(Number.isNaN(n) ? '' : (((n - 32) * 5) / 9).toFixed(1))
        }}
      />
      <p className="mono">{Number.isNaN(c) ? 'enter a number' : c >= 100 ? 'water boils' : c <= 0 ? 'water freezes' : 'liquid'}</p>
    </div>
  )
}

export const liftingStateUp: Entry = {
  slug: 'lifting-state-up',
  title: 'Lifting state up',
  group: 'Everyday patterns',
  level: 'beginner',
  summary:
    'When two components need the same state, move it to their nearest common parent and pass it down as props with a callback to change it.',
  tags: ['state', 'props', 'callbacks', 'shared state', 'single source of truth'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            State belongs to one component. If a sibling needs to read or change it, the state moves <em>up</em> to the
            closest ancestor both share; that ancestor passes the value down as a prop and a setter (or a narrower
            callback) alongside it. The children become controlled by the parent, and there is exactly one source of
            truth.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>Two inputs must stay in sync (unit conversion, search box and results list).</li>
            <li>A parent needs to know something a child would otherwise keep private (a selected tab, a form's validity).</li>
            <li>
              Not when the state is truly local (an input's focus, a dropdown's open flag) — lifting that just adds
              props.
            </li>
            <li>
              Not when the common ancestor is far away and many layers would only forward props — that is the cue for
              context or a store.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Accordion.tsx"
          highlight={[3, 9, 10]}
          code={`
function Accordion({ sections }: { sections: Section[] }) {
  // Lifted: only one panel may be open, so the parent must own the choice
  const [openId, setOpenId] = useState<string | null>(null)

  return sections.map((s) => (
    <Panel
      key={s.id}
      title={s.title}
      isOpen={openId === s.id}
      onToggle={() => setOpenId((cur) => (cur === s.id ? null : s.id))}
    >
      {s.body}
    </Panel>
  ))
}

// Panel no longer has its own open state — it is fully controlled
function Panel({ title, isOpen, onToggle, children }: PanelProps) {
  return (
    <section>
      <button onClick={onToggle} aria-expanded={isOpen}>{title}</button>
      {isOpen && <div>{children}</div>}
    </section>
  )
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Two inputs, one state">
          <LiftDemo />
        </Demo>
      </Section>

      <Callout kind="note">
        <p>
          Pass the narrowest callback that works. <code>onToggle</code> is easier to reason about than handing every
          child the raw <code>setOpenId</code>; the child cannot put the parent into a state the parent didn't intend.
        </p>
      </Callout>
    </>
  ),
}
