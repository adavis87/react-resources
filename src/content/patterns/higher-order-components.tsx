import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

export const higherOrderComponents: Entry = {
  slug: 'higher-order-components',
  title: 'Higher-order components',
  group: 'Component APIs',
  level: 'advanced',
  summary:
    'A function that takes a component and returns a new one with extra props or behaviour. Mostly superseded by hooks, but you will meet it in libraries and older code — and memo() is one.',
  tags: ['hoc', 'higher-order component', 'withX', 'legacy', 'memo'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            A higher-order component (HOC) is a plain function: <code>withAuth(Page)</code> returns a component that
            checks a session, then renders <code>Page</code> with a <code>user</code> prop. It's function composition
            applied to components. The convention is a <code>with</code> prefix and returning a new component rather
            than mutating the input.
          </p>
          <p>
            Hooks made most HOCs redundant: <code>const user = useAuth()</code> inside the component says the same thing
            without a wrapper, without prop-name collisions, and with types that don't need gymnastics. Still, the
            shape persists — <code>React.memo</code>, <code>connect</code> from react-redux, <code>withRouter</code>,
            and Next.js's older data helpers are all HOCs.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>
              <strong>Cross-cutting wrapping</strong> that must happen <em>around</em> a component — an error boundary,
              a Suspense fallback, a provider — where a hook inside the component is too late.
            </li>
            <li>
              <strong>Gating render</strong>: "don't render this at all unless X". A hook would need the component to
              render and then return null itself.
            </li>
            <li>Adapting a library that expects a HOC. Otherwise, reach for a hook or a wrapper component.</li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="withErrorBoundary.tsx"
          highlight={[8, 17]}
          code={`
import type { ComponentType } from 'react'

export function withErrorBoundary<P extends object>(
  Wrapped: ComponentType<P>,
  fallback: ReactNode,
) {
  // Return a NEW component; never mutate Wrapped
  function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Wrapped {...props} />
      </ErrorBoundary>
    )
  }
  // Keep devtools readable: "WithErrorBoundary(Chart)" instead of "Anonymous"
  const name = Wrapped.displayName ?? Wrapped.name ?? 'Component'
  WithErrorBoundary.displayName = \`WithErrorBoundary(\${name})\`
  return WithErrorBoundary
}

const SafeChart = withErrorBoundary(Chart, <p>Chart failed to load.</p>)

// The same idea as a hook — usually the better choice
function Dashboard() {
  const user = useAuth()          // instead of withAuth(Dashboard)
  if (!user) return <SignIn />
  return <Chart user={user} />
}
`}
        />
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            <strong>Never apply a HOC inside render.</strong> <code>{'const Enhanced = withX(Inner)'}</code> in a
            component body creates a new type each render, remounting the subtree every time. Apply at module scope.
          </li>
          <li>
            <strong>Refs.</strong> A <code>ref</code> on the enhanced component points at the wrapper. In React 19{' '}
            <code>ref</code> is a normal prop for function components, so spreading <code>{'{...props}'}</code>
            forwards it; in React 18 you need <code>forwardRef</code> in the wrapper.
          </li>
          <li>
            Static members (<code>Page.getLayout</code>) are lost unless copied — the classic{' '}
            <code>hoist-non-react-statics</code> problem.
          </li>
          <li>Stacking HOCs hides where props came from. Prefer hooks for anything that isn't a wrapper.</li>
        </ul>
      </Callout>
    </>
  ),
}
