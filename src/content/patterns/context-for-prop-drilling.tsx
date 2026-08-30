import { createContext, useContext, useState, type ReactNode } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

type Density = 'compact' | 'comfortable'
const DensityContext = createContext<Density>('comfortable')
const SetDensityContext = createContext<(d: Density) => void>(() => {})

function Toolbar() {
  const density = useContext(DensityContext)
  const setDensity = useContext(SetDensityContext)
  return (
    <div className="row">
      <span className="mono">Toolbar (level 1)</span>
      <button onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}>Toggle density</button>
    </div>
  )
}

function Table() {
  return (
    <div className="box stack">
      <span className="mono">Table (level 2) — reads nothing, forwards nothing</span>
      <Rows />
    </div>
  )
}

function Rows() {
  const density = useContext(DensityContext)
  const pad = density === 'compact' ? '2px 8px' : '10px 12px'
  return (
    <ul className="list">
      {['Row one', 'Row two', 'Row three'].map((r) => (
        <li key={r} style={{ padding: pad }}>
          {r} <span className="pill">{density}</span>
        </li>
      ))}
    </ul>
  )
}

function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensity] = useState<Density>('comfortable')
  return (
    <DensityContext value={density}>
      <SetDensityContext value={setDensity}>{children}</SetDensityContext>
    </DensityContext>
  )
}

function ContextDemo() {
  return (
    <DensityProvider>
      <div className="stack">
        <Toolbar />
        <Table />
      </div>
    </DensityProvider>
  )
}

export const contextForPropDrilling: Entry = {
  slug: 'context-for-prop-drilling',
  title: 'Context instead of prop drilling',
  group: 'Structure & data',
  level: 'intermediate',
  summary:
    'Passing a prop through five components that never read it is drilling. Context lets a distant descendant read a value directly — for the handful of values that are truly ambient.',
  tags: ['context', 'prop drilling', 'useContext', 'provider', 'dispatch'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Prop drilling is forwarding a prop through intermediate components solely so a deep child can use it. It is
            explicit and often fine. It becomes a problem when the intermediates are generic (a layout, a list) and
            should not know about the value at all, or when a change of signature forces edits in six files. Context
            provides a value at one point in the tree and lets any descendant read it with <code>useContext</code>.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>
              <strong>Drill</strong> when the path is two or three levels and every hop plausibly cares about the value.
              Props are easier to trace.
            </li>
            <li>
              <strong>Use context</strong> for ambient values: current user, theme, locale, the nearest form or dialog,
              a router. These rarely change and many components read them.
            </li>
            <li>
              <strong>Split value and updater</strong> into two contexts. Components that only dispatch (a toolbar button)
              then don't re-render when the value changes.
            </li>
            <li>
              For frequently changing app state with many readers, a store (Zustand, Redux, Jotai) or{' '}
              <code>useSyncExternalStore</code> avoids re-rendering every consumer on every change.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="auth-context.tsx"
          highlight={[4, 5, 13, 14, 15]}
          code={`
import { createContext, useContext, useState, type ReactNode } from 'react'

// Two contexts: readers of the user don't re-render when only actions are needed
const UserContext = createContext<User | null>(null)
const AuthActionsContext = createContext<{ signIn: (u: User) => void; signOut: () => void } | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const actions = useMemo(() => ({ signIn: setUser, signOut: () => setUser(null) }), [])

  // React 19: the context object is its own provider — no .Provider needed
  return (
    <UserContext value={user}>
      <AuthActionsContext value={actions}>{children}</AuthActionsContext>
    </UserContext>
  )
}

// Hooks hide the context objects and give a clear error when misused
export function useUser() {
  return useContext(UserContext)
}
export function useAuthActions() {
  const ctx = useContext(AuthActionsContext)
  if (!ctx) throw new Error('useAuthActions must be used inside <AuthProvider>')
  return ctx
}

// Any depth below AuthProvider, with no props in between
function SignOutButton() {
  const { signOut } = useAuthActions()
  return <button onClick={signOut}>Sign out</button>
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Value read three levels down">
          <ContextDemo />
        </Demo>
      </Section>

      <Callout kind="react19">
        <p>
          In React 19 you render <code>{'<MyContext value={...}>'}</code> directly; <code>MyContext.Provider</code> still
          works but is deprecated. <code>use(MyContext)</code> can replace <code>useContext</code> and, unlike hooks, may
          be called inside conditions.
        </p>
      </Callout>

      <Callout kind="gotcha">
        <ul>
          <li>
            A provider whose <code>value</code> is an inline object re-renders every consumer on every render of the
            provider. Memoise the object or split the contexts.
          </li>
          <li>
            Context is not a performance tool. Every consumer re-renders when the value changes, with no way to subscribe
            to a slice.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
