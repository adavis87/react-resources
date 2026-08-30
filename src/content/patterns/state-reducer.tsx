import { useReducer } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo implementation ---------------------------------------------------
type ToggleState = { on: boolean; clicks: number }
type ToggleAction = { type: 'toggle' } | { type: 'reset' }

function defaultReducer(state: ToggleState, action: ToggleAction): ToggleState {
  switch (action.type) {
    case 'toggle':
      return { on: !state.on, clicks: state.clicks + 1 }
    case 'reset':
      return { on: false, clicks: 0 }
  }
}

function useToggle({ reducer = defaultReducer }: { reducer?: typeof defaultReducer } = {}) {
  const [state, dispatch] = useReducer(reducer, { on: false, clicks: 0 })
  return { ...state, toggle: () => dispatch({ type: 'toggle' }), reset: () => dispatch({ type: 'reset' }) }
}

const LIMIT = 4

function limitedReducer(state: ToggleState, action: ToggleAction): ToggleState {
  const next = defaultReducer(state, action)
  // Intercept: after LIMIT toggles, refuse further toggles but keep counting attempts
  if (action.type === 'toggle' && state.clicks >= LIMIT) return { ...state, clicks: state.clicks + 1 }
  return next
}

function StateReducerDemo() {
  const { on, clicks, toggle, reset } = useToggle({ reducer: limitedReducer })
  const blocked = clicks >= LIMIT
  return (
    <div className="stack">
      <div className="row">
        <button onClick={toggle}>{on ? 'Turn off' : 'Turn on'}</button>
        <span className="pill">{on ? 'ON' : 'OFF'}</span>
        <span className="mono">
          {clicks} click{clicks === 1 ? '' : 's'}
        </span>
        <button onClick={reset}>Reset</button>
      </div>
      {blocked && <p className="error-box">Toggle locked after {LIMIT} clicks — the consumer's reducer refused the change.</p>}
    </div>
  )
}

export const stateReducer: Entry = {
  slug: 'state-reducer',
  title: 'State reducer',
  group: 'Component APIs',
  level: 'advanced',
  summary:
    'Let the consumer of a hook or component intercept every state transition by supplying their own reducer, instead of adding a prop for each special case.',
  tags: ['state reducer', 'useReducer', 'inversion of control', 'hooks api'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            A hook that manages state with <code>useReducer</code> can accept a <code>reducer</code> option. The hook
            still dispatches its own actions — <code>toggle</code>, <code>open</code>, <code>selectItem</code> — but the
            consumer's reducer gets the final say on what the next state is. They can call the default reducer and then
            tweak the result, or ignore it entirely for one action type.
          </p>
          <p>
            The pattern comes from Kent C. Dodds's Downshift library, where it lets users customise combobox behaviour
            (keep the menu open after selection, for instance) without the library growing a prop for every whim.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>Reusable hooks or components whose state machine consumers keep asking to bend in small ways.</li>
            <li>When each new "special case" prop would only be used by one caller.</li>
            <li>Not for app code with a single consumer — just edit the reducer.</li>
          </ul>
          <p>
            Export the action types and the default reducer so consumers can compose rather than reimplement.
          </p>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="useToggle.ts"
          highlight={[14, 23, 24, 25]}
          code={`
type State = { on: boolean }
type Action = { type: 'toggle' } | { type: 'set'; on: boolean }

export function toggleReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'toggle': return { on: !state.on }
    case 'set':    return { on: action.on }
  }
}

interface Options { reducer?: (state: State, action: Action) => State }

export function useToggle({ reducer = toggleReducer }: Options = {}) {
  const [state, dispatch] = useReducer(reducer, { on: false })
  return {
    on: state.on,
    toggle: () => dispatch({ type: 'toggle' }),
    setOn: (on: boolean) => dispatch({ type: 'set', on }),
  }
}

// Consumer: "never allow turning off while saving"
const { on, toggle } = useToggle({
  reducer(state, action) {
    const next = toggleReducer(state, action)          // start from the default
    if (isSaving && !next.on) return state             // veto this transition
    return next
  },
})
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Consumer reducer locks the toggle after four clicks">
          <StateReducerDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            The consumer's reducer must be pure like any reducer. If it captures changing values (like{' '}
            <code>isSaving</code> above), it is a new function each render — fine for <code>useReducer</code>, which
            reads the latest reducer on dispatch, but don't memoise it away.
          </li>
          <li>
            Document every action type; the reducer is now public API and renaming an action is a breaking change.
          </li>
          <li>
            If most consumers only need to <em>observe</em> changes, an <code>onChange</code> callback is simpler than a
            reducer.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
