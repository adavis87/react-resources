import { useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo implementation ---------------------------------------------------
function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal
  function set(next: T) {
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }
  return [current, set]
}

function Rating({ value, defaultValue = 0, onChange }: { value?: number; defaultValue?: number; onChange?: (n: number) => void }) {
  const [rating, setRating] = useControllableState(value, defaultValue, onChange)
  return (
    <div className="row" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} role="radio" aria-checked={rating === n} className={rating >= n ? 'primary' : ''} onClick={() => setRating(n)}>
          {n}
        </button>
      ))}
    </div>
  )
}

function ControlPropsDemo() {
  const [controlled, setControlled] = useState(3)
  return (
    <div className="stack">
      <div className="box stack">
        <span className="mono">Uncontrolled — owns its state; parent only hears about changes</span>
        <Rating defaultValue={2} />
      </div>
      <div className="box stack">
        <span className="mono">Controlled — parent owns it and can clamp: value = {controlled}</span>
        <Rating value={controlled} onChange={(n) => setControlled(Math.min(n, 4))} />
        <span className="mono">(parent refuses 5 stars)</span>
      </div>
    </div>
  )
}

export const controlProps: Entry = {
  slug: 'control-props',
  title: 'Control props',
  group: 'Component APIs',
  level: 'advanced',
  summary:
    'A component that works uncontrolled by default but hands ownership of its state to the parent when a value prop is passed — exactly how <input> behaves.',
  tags: ['controlled', 'uncontrolled', 'control props', 'defaultValue', 'useControllableState'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Native inputs support two modes: <code>defaultValue</code> (the input keeps its own state) and{' '}
            <code>value</code> + <code>onChange</code> (the parent keeps it). The control props pattern gives your own
            components the same choice. If <code>value</code> is <code>undefined</code>, the component uses internal
            state; otherwise it renders whatever the parent passes and only <em>reports</em> changes.
          </p>
          <p>
            The result is a component that is easy to use in the simple case and fully controllable in the hard case —
            syncing to a URL, validating, or clamping — without two implementations.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>Design-system inputs: toggles, sliders, ratings, tag pickers, date pickers.</li>
            <li>Disclosure widgets (<code>open</code> / <code>defaultOpen</code>) such as dialogs, accordions, popovers.</li>
            <li>Any component where "sometimes the parent needs to override" would otherwise become a bag of props.</li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="useControllableState.ts"
          highlight={[9, 10, 13]}
          code={`
export function useControllableState<T>(
  value: T | undefined,        // controlled value, or undefined
  defaultValue: T,             // initial value when uncontrolled
  onChange?: (next: T) => void,
): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue)

  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  function set(next: T) {
    if (!isControlled) setInternal(next)  // only own the state when uncontrolled
    onChange?.(next)                       // always report
  }
  return [current, set]
}

// A Switch that supports both modes
interface SwitchProps { checked?: boolean; defaultChecked?: boolean; onChange?: (c: boolean) => void }
export function Switch({ checked, defaultChecked = false, onChange }: SwitchProps) {
  const [on, setOn] = useControllableState(checked, defaultChecked, onChange)
  return <button role="switch" aria-checked={on} onClick={() => setOn(!on)} />
}

<Switch defaultChecked />                                   // uncontrolled
<Switch checked={enabled} onChange={setEnabled} />           // controlled
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="One Rating component, two modes">
          <ControlPropsDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Switching between controlled and uncontrolled during a component's life is a bug — React warns for inputs;
            do the same in development for your own component.
          </li>
          <li>
            The check is <code>value !== undefined</code>, not truthiness. <code>value={'{0}'}</code>,{' '}
            <code>value=""</code> and <code>value={'{false}'}</code> are all controlled.
          </li>
          <li>
            In controlled mode the component must render the prop even if the parent ignores <code>onChange</code>.
            That "stuck" behaviour is correct — it's how inputs work too.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
