import { useReducer } from 'react'
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

export const useReducerEntry: Entry = {
  slug: 'use-reducer',
  title: 'useReducer',
  group: 'Hooks',
  summary:
    'A reducer centralises how state changes: components describe what happened, the reducer decides the next state. Use it when transitions have rules.',
  tags: ['useReducer', 'reducer', 'dispatch', 'actions', 'state machine'],
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

      <Callout kind="note">
        <p>
          <code>useReducer</code> and <code>useState</code> are equivalent in power; <code>useState</code> is implemented
          with a reducer internally. Choose by readability: if your setters have grown <code>if</code> branches, it is
          time for a reducer.
        </p>
      </Callout>
    </>
  ),
}
