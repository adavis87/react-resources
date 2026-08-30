import { useReducer, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

type State = { status: 'idle' | 'running' | 'paused'; seconds: number }
type Action = { type: 'start' } | { type: 'pause' } | { type: 'reset' } | { type: 'tick' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return state.status === 'running' ? state : { ...state, status: 'running' }
    case 'pause':
      return state.status === 'running' ? { ...state, status: 'paused' } : state
    case 'reset':
      return { status: 'idle', seconds: 0 }
    case 'tick':
      return state.status === 'running' ? { ...state, seconds: state.seconds + 1 } : state
  }
}

function ReducerDemo() {
  const [state, dispatch] = useReducer(reducer, { status: 'idle', seconds: 0 })
  return (
    <>
      <div className="row">
        <span className="pill">{state.status}</span>
        <span className="mono">{state.seconds}s</span>
        <button onClick={() => dispatch({ type: 'start' })}>Start</button>
        <button onClick={() => dispatch({ type: 'tick' })} disabled={state.status !== 'running'}>Tick</button>
        <button onClick={() => dispatch({ type: 'pause' })}>Pause</button>
        <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
      </div>
      <p className="mono">Invalid transitions (tick while paused) are rejected inside the reducer, not the UI.</p>
    </>
  )
}

// --- useWizard: a multi-step flow as a reducer ------------------------------
type Step = 'account' | 'company' | 'plan' | 'review'
type WizardData = Partial<{ email: string; kind: 'personal' | 'business'; company: string; plan: string }>
type WizardState = {
  step: Step
  data: WizardData
  visited: Step[]
  status: 'editing' | 'submitting' | 'done' | 'error'
}
type WizardAction =
  | { type: 'next'; payload: WizardData }
  | { type: 'back' }
  | { type: 'goTo'; step: Step }
  | { type: 'submitStarted' }
  | { type: 'submitFinished'; ok: boolean }
  | { type: 'reset' }

const wizardInitial: WizardState = { step: 'account', data: {}, visited: ['account'], status: 'editing' }

// The step order depends on the answers so far — one pure function owns that rule
function stepsFor(data: WizardData): Step[] {
  return data.kind === 'business' ? ['account', 'company', 'plan', 'review'] : ['account', 'plan', 'review']
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  if (state.status === 'submitting' && action.type !== 'submitFinished') return state // locked while in flight
  switch (action.type) {
    case 'next': {
      const data = { ...state.data, ...action.payload }
      const order = stepsFor(data)
      const i = order.indexOf(state.step)
      const step = order[Math.min(i + 1, order.length - 1)]
      return { ...state, data, step, visited: [...new Set([...state.visited, step])], status: 'editing' }
    }
    case 'back': {
      const order = stepsFor(state.data)
      const i = order.indexOf(state.step)
      return i === 0 ? state : { ...state, step: order[i - 1] }
    }
    case 'goTo':
      return state.visited.includes(action.step) ? { ...state, step: action.step } : state
    case 'submitStarted':
      return { ...state, status: 'submitting' }
    case 'submitFinished':
      return { ...state, status: action.ok ? 'done' : 'error' }
    case 'reset':
      return wizardInitial
  }
}

function useWizard(onSubmit: (data: WizardData) => Promise<void>) {
  const [state, dispatch] = useReducer(wizardReducer, wizardInitial)
  const order = stepsFor(state.data)
  return {
    ...state,
    steps: order,
    isFirst: order[0] === state.step,
    isLast: order[order.length - 1] === state.step,
    canGoTo: (s: Step) => state.visited.includes(s),
    next: (payload: WizardData) => dispatch({ type: 'next', payload }),
    back: () => dispatch({ type: 'back' }),
    goTo: (step: Step) => dispatch({ type: 'goTo', step }),
    reset: () => dispatch({ type: 'reset' }),
    submit: async () => {
      dispatch({ type: 'submitStarted' })
      try {
        await onSubmit(state.data)
        dispatch({ type: 'submitFinished', ok: true })
      } catch {
        dispatch({ type: 'submitFinished', ok: false })
      }
    },
  }
}

let submitAttempts = 0
function fakeCreateAccount(): Promise<void> {
  submitAttempts += 1
  return new Promise((resolve, reject) => setTimeout(() => (submitAttempts % 2 === 0 ? reject() : resolve()), 900))
}

function WizardDemo() {
  const w = useWizard(fakeCreateAccount)
  const [email, setEmail] = useState(w.data.email ?? '')
  const [kind, setKind] = useState<'personal' | 'business'>(w.data.kind ?? 'personal')
  const [company, setCompany] = useState(w.data.company ?? '')
  const [plan, setPlan] = useState(w.data.plan ?? 'starter')
  const busy = w.status === 'submitting'

  return (
    <div className="stack">
      <div className="tabbar" role="tablist" aria-label="Steps">
        {w.steps.map((s) => (
          <button key={s} role="tab" aria-selected={w.step === s} disabled={!w.canGoTo(s) || busy} onClick={() => w.goTo(s)}>
            {s}
          </button>
        ))}
      </div>

      {w.status === 'done' ? (
        <div className="box stack">
          <strong>Account created.</strong>
          <span className="mono">{JSON.stringify(w.data)}</span>
          <div className="row">
            <button onClick={w.reset}>Start over</button>
          </div>
        </div>
      ) : (
        <div className="box stack">
          {w.step === 'account' && (
            <>
              <div className="row">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" aria-label="Email" />
                <select value={kind} onChange={(e) => setKind(e.target.value as 'personal' | 'business')} aria-label="Account kind">
                  <option value="personal">personal</option>
                  <option value="business">business</option>
                </select>
              </div>
              <p className="mono">choosing "business" inserts a company step</p>
            </>
          )}
          {w.step === 'company' && (
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="company name" aria-label="Company" />
          )}
          {w.step === 'plan' && (
            <select value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Plan">
              <option value="starter">starter</option>
              <option value="team">team</option>
              <option value="enterprise">enterprise</option>
            </select>
          )}
          {w.step === 'review' && <span className="mono">{JSON.stringify({ ...w.data })}</span>}

          <div className="row">
            <button onClick={w.back} disabled={w.isFirst || busy}>Back</button>
            {w.isLast ? (
              <button className="primary" onClick={w.submit} disabled={busy}>
                {busy ? 'Submitting…' : 'Submit'}
              </button>
            ) : (
              <button
                className="primary"
                disabled={(w.step === 'account' && !email.includes('@')) || (w.step === 'company' && !company.trim())}
                onClick={() =>
                  w.next(
                    w.step === 'account' ? { email, kind } : w.step === 'company' ? { company } : { plan },
                  )
                }
              >
                Next
              </button>
            )}
            {w.status === 'error' && <span className="error-box">Server rejected it — try again (every other attempt fails).</span>}
          </div>
        </div>
      )}
      <p className="mono">
        status = {w.status} · step {w.steps.indexOf(w.step) + 1} of {w.steps.length} · visited: {w.visited.join(' → ')}
      </p>
    </div>
  )
}

export const useReducerEntry: Entry = {
  slug: 'use-reducer',
  title: 'useReducer',
  group: 'Hooks',
  summary:
    'A reducer centralises how state changes: components describe what happened, the reducer decides the next state. Use it when transitions have rules.',
  tags: ['useReducer', 'reducer', 'dispatch', 'actions', 'state machine', 'useWizard', 'multi-step'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            <code>useReducer(reducer, initial)</code> is <code>useState</code> with the update logic extracted into a
            pure function <code>(state, action) =&gt; newState</code>. Components call <code>dispatch(action)</code>;
            React runs the reducer and re-renders if the result differs. The same reducer that powers the component
            can be unit-tested without React.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              <code>dispatch</code> is stable across renders — safe to pass down or list as a dependency.
            </li>
            <li>
              Reducers must be pure: no fetches, no timers, no mutation. Return the same reference to bail out of a
              render.
            </li>
            <li>
              Discriminated-union action types give exhaustive switches in TypeScript; a missing case is a compile
              error.
            </li>
            <li>
              Reach for it when the next state depends on several pieces of the current state, when there are many
              ways to update, or when transitions are only valid from certain states.
            </li>
            <li>
              Pair with context to give a subtree a small store: one provider exposes <code>state</code>, another
              exposes <code>dispatch</code>.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="cart.ts — a reducer with a discriminated union"
          code={`
type Item = { id: string; qty: number; price: number }
type State = { items: Item[]; coupon: string | null }
type Action =
  | { type: 'added'; item: Item }
  | { type: 'removed'; id: string }
  | { type: 'quantityChanged'; id: string; qty: number }
  | { type: 'couponApplied'; code: string }

export function cartReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'added': {
      const exists = state.items.some((i) => i.id === action.item.id)
      return exists
        ? { ...state, items: state.items.map((i) => i.id === action.item.id ? { ...i, qty: i.qty + action.item.qty } : i) }
        : { ...state, items: [...state.items, action.item] }
    }
    case 'removed':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'quantityChanged':
      if (action.qty < 1) return state          // invalid: bail out, same reference
      return { ...state, items: state.items.map((i) => i.id === action.id ? { ...i, qty: action.qty } : i) }
    case 'couponApplied':
      return { ...state, coupon: action.code }
  }
}

function Cart() {
  const [state, dispatch] = useReducer(cartReducer, { items: [], coupon: null })
  return <button onClick={() => dispatch({ type: 'removed', id: 'sku-1' })}>Remove</button>
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="A small state machine">
          <ReducerDemo />
        </Demo>
      </Section>

      <Section title="A real one: useWizard">
        <Prose>
          <p>
            Reducers are rare in everyday component code because most state is a flag or a field, and the bigger
            state moved into form, query and store libraries. Where they still earn their place is a{' '}
            <strong>flow with rules</strong>: a multi-step signup, an upload lifecycle, a connection state. The shape
            below — named states, one pure transition function, a hook that exposes verbs — is what every one of those
            looks like.
          </p>
          <ul>
            <li>
              <strong>"Next" changes three fields atomically</strong> (<code>data</code>, <code>step</code>,{' '}
              <code>visited</code>), and the new step <em>depends on</em> the new data because the step order is
              conditional. With separate <code>useState</code>s you would compute it from stale data or fix it up in an
              effect one render late.
            </li>
            <li>
              <strong>Guards live in one place.</strong> "Locked while submitting" and "can't jump forward" are two
              lines in the reducer instead of checks in every button.
            </li>
            <li>
              <strong>Testable without React:</strong>{' '}
              <code>expect(reducer(s, {'{ type: \'next\', payload: { kind: \'business\' } }'}).step).toBe('company')</code>.
            </li>
            <li>
              <strong>Consumers never see it.</strong> They get <code>next</code>, <code>back</code>,{' '}
              <code>submit</code> — which is why reducers are used more than they appear to be.
            </li>
          </ul>
        </Prose>
        <CodeBlock
          title="useWizard.ts"
          highlight={[19, 20, 21, 27, 28, 29, 30]}
          code={`
type Step = 'account' | 'company' | 'plan' | 'review'
type Data = Partial<{ email: string; kind: 'personal' | 'business'; company: string; plan: string }>

type State = { step: Step; data: Data; visited: Step[]; status: 'editing' | 'submitting' | 'done' | 'error' }
type Action =
  | { type: 'next'; payload: Data }
  | { type: 'back' }
  | { type: 'goTo'; step: Step }
  | { type: 'submitStarted' }
  | { type: 'submitFinished'; ok: boolean }
  | { type: 'reset' }

// Conditional step order: one pure function owns the rule
function stepsFor(data: Data): Step[] {
  return data.kind === 'business' ? ['account', 'company', 'plan', 'review'] : ['account', 'plan', 'review']
}

function reducer(state: State, action: Action): State {
  if (state.status === 'submitting' && action.type !== 'submitFinished') return state   // locked

  switch (action.type) {
    case 'next': {
      const data = { ...state.data, ...action.payload }        // merge this step's answers
      const order = stepsFor(data)                             // order may change because of them
      const i = order.indexOf(state.step)
      const step = order[Math.min(i + 1, order.length - 1)]
      return { ...state, data, step, visited: [...new Set([...state.visited, step])] }
    }
    case 'back': {
      const order = stepsFor(state.data)
      const i = order.indexOf(state.step)
      return i === 0 ? state : { ...state, step: order[i - 1] }
    }
    case 'goTo':
      return state.visited.includes(action.step) ? { ...state, step: action.step } : state
    case 'submitStarted':  return { ...state, status: 'submitting' }
    case 'submitFinished': return { ...state, status: action.ok ? 'done' : 'error' }
    case 'reset':          return initial
  }
}

const initial: State = { step: 'account', data: {}, visited: ['account'], status: 'editing' }

export function useWizard(onSubmit: (data: Data) => Promise<void>) {
  const [state, dispatch] = useReducer(reducer, initial)
  const order = stepsFor(state.data)
  return {
    ...state,
    steps: order,
    isFirst: order[0] === state.step,
    isLast: order[order.length - 1] === state.step,
    canGoTo: (s: Step) => state.visited.includes(s),
    next: (payload: Data) => dispatch({ type: 'next', payload }),
    back: () => dispatch({ type: 'back' }),
    goTo: (step: Step) => dispatch({ type: 'goTo', step }),
    reset: () => dispatch({ type: 'reset' }),
    submit: async () => {
      dispatch({ type: 'submitStarted' })
      try { await onSubmit(state.data); dispatch({ type: 'submitFinished', ok: true }) }
      catch { dispatch({ type: 'submitFinished', ok: false }) }
    },
  }
}
`}
        />
        <CodeBlock
          title="The consumer never sees a reducer"
          code={`
function Signup() {
  const w = useWizard(createAccount)
  return (
    <>
      <ProgressRail steps={w.steps} current={w.step} canJump={w.canGoTo} onJump={w.goTo} />
      {w.step === 'account' && <AccountStep initial={w.data} onNext={w.next} />}
      {w.step === 'company' && <CompanyStep initial={w.data} onNext={w.next} onBack={w.back} />}
      {w.step === 'plan'    && <PlanStep    initial={w.data} onNext={w.next} onBack={w.back} />}
      {w.step === 'review'  && <ReviewStep  data={w.data} onBack={w.back} onSubmit={w.submit} busy={w.status === 'submitting'} />}
    </>
  )
}
`}
        />
        <Demo title="useWizard — pick “business” to see the step order change">
          <WizardDemo />
        </Demo>
      </Section>

      <Callout kind="note">
        <ul>
          <li>
            <code>useReducer</code> and <code>useState</code> are equivalent in power. <code>useState</code> literally
            runs through the same update machinery with a built-in reducer (<code>basicStateReducer</code>: "if the
            action is a function, call it with the state; otherwise it is the new state"). The one behavioural
            difference is that <code>useState</code>'s setter can bail out eagerly when the new value is identical.
          </li>
          <li>
            Expect to use <code>useState</code> most of the time. Reach for a reducer when a status field decides
            which transitions are legal, when several fields must change together, when you need undo/redo, or when
            the same state is updated from many handlers — and then wrap it in a hook so consumers see verbs, not
            actions.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
