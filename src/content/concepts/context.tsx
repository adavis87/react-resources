import { createContext, useContext, useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

type Density = 'comfortable' | 'compact'
const DensityContext = createContext<Density>('comfortable')

function Row({ label }: { label: string }) {
  const density = useContext(DensityContext)
  return (
    <li style={{ padding: density === 'compact' ? '2px 10px' : '10px' }}>
      <span>{label}</span>
      <span className="mono">{density}</span>
    </li>
  )
}
function Table() {
  return (
    <ul className="list">
      <Row label="Deep child A" />
      <Row label="Deep child B" />
    </ul>
  )
}
function Panel() {
  return <Table />
}

function ContextDemo() {
  const [density, setDensity] = useState<Density>('comfortable')
  return (
    <DensityContext value={density}>
      <div className="row">
        <button onClick={() => setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))}>Toggle density</button>
        <span className="mono">Panel → Table → Row reads it without props</span>
      </div>
      <Panel />
    </DensityContext>
  )
}

export const context: Entry = {
  slug: 'context',
  title: 'Context',
  group: 'Hooks',
  summary:
    'Context lets a subtree read a value from an ancestor without passing it through every level. It is dependency injection for React trees, not a state manager.',
  tags: ['createContext', 'useContext', 'provider', 'prop drilling', 'theme'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            <code>createContext(defaultValue)</code> creates a channel. A provider higher in the tree sets the value;
            any descendant calls <code>useContext</code> (or, in React 19, <code>use</code>) to read the nearest provider's
            value. When the value changes, every consumer re-renders.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              React walks up from the consumer to the nearest matching provider. No provider means the default value —
              handy for tests, dangerous if you forget to wrap the app.
            </li>
            <li>
              Consumers re-render when the provider's <code>value</code> changes by identity. An inline object literal is
              new on every render of the provider, so memoise it or split state from setters.
            </li>
            <li>
              Context does not bypass <code>memo</code>: a memoised component still re-renders when the context it
              reads changes.
            </li>
            <li>
              <strong>React 19:</strong> render the context object itself as the provider —{' '}
              <code>&lt;ThemeContext value=...&gt;</code> instead of <code>&lt;ThemeContext.Provider&gt;</code>.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="A typed context with a custom hook"
          highlight={[12, 22]}
          code={`
type Session = { user: User | null; signOut: () => void }

const SessionContext = createContext<Session | null>(null)

// Wrap the hook so consumers get a clear error instead of null checks everywhere
export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within <SessionProvider>')
  return ctx
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const signOut = useCallback(() => setUser(null), [])
  // Stable value: only changes when user changes
  const value = useMemo(() => ({ user, signOut }), [user, signOut])
  return <SessionContext value={value}>{children}</SessionContext>
}

function AccountMenu() {
  const { user, signOut } = useSession()
  return user ? <button onClick={signOut}>Sign out {user.name}</button> : <SignIn />
}
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo>
          <ContextDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Frequently changing values (mouse position, form drafts) in one big context re-render everything that reads
            it. Split contexts by update frequency, or use an external store with selectors.
          </li>
          <li>
            Context is for data that is genuinely ambient — theme, locale, current user, a router. Passing three props
            through two levels is not a problem that needs context.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
