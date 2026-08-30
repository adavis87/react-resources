import { Component, useState, type ErrorInfo, type ReactNode } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo implementation ---------------------------------------------------
interface BoundaryProps {
  fallback: (error: Error, retry: () => void) => ReactNode
  resetKeys?: unknown[]
  children: ReactNode
}
interface BoundaryState {
  error: Error | null
}

class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Report to your error service here
    void error
    void info
  }

  componentDidUpdate(prev: BoundaryProps) {
    const changed = (this.props.resetKeys ?? []).some((k, i) => !Object.is(k, prev.resetKeys?.[i]))
    if (this.state.error && changed) this.setState({ error: null })
  }

  retry = () => this.setState({ error: null })

  render() {
    if (this.state.error) return this.props.fallback(this.state.error, this.retry)
    return this.props.children
  }
}

function Widget({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Widget failed to render')
  return <div className="box">Widget rendered fine.</div>
}

function BoundaryDemo() {
  const [broken, setBroken] = useState(false)
  return (
    <div className="stack">
      <div className="row">
        <button onClick={() => setBroken(true)} disabled={broken}>
          Break the widget
        </button>
        <span className="mono">Retry fixes it (the parent flips the prop back)</span>
      </div>
      <ErrorBoundary
        fallback={(error, retry) => (
          <div className="stack">
            <p className="error-box">{error.message}</p>
            <div className="row">
              <button
                onClick={() => {
                  setBroken(false)
                  retry()
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
      >
        <Widget shouldThrow={broken} />
      </ErrorBoundary>
    </div>
  )
}

export const errorBoundaryWithRetry: Entry = {
  slug: 'error-boundary-with-retry',
  title: 'Error boundary with retry',
  group: 'Rendering & data',
  level: 'advanced',
  summary:
    'Catch render errors in a subtree, show a fallback that offers a way out, and reset the boundary when the user retries or the inputs change.',
  tags: ['error boundary', 'retry', 'resetKeys', 'getDerivedStateFromError', 'resilience'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            An error boundary is the one place React still requires a class: a component that implements{' '}
            <code>getDerivedStateFromError</code> to switch to a fallback UI when anything below it throws during
            render. A bare boundary leaves the user stuck with the fallback forever. The retry pattern adds a way to
            clear the error — a button, or <code>resetKeys</code> that reset the boundary automatically when the props
            that caused the failure change (a new route, a new record id).
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>Around each independent region of a page so one failing widget doesn't blank the whole app.</li>
            <li>
              Directly around a <code>Suspense</code> boundary, since <code>use()</code> throws rejected promises to the
              nearest boundary.
            </li>
            <li>
              In production, use <code>react-error-boundary</code> — it implements exactly this API (
              <code>fallbackRender</code>, <code>resetKeys</code>, <code>onReset</code>) and is well tested.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="ErrorBoundary.tsx"
          highlight={[10, 11, 12, 19, 20, 21, 22]}
          code={`
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  fallback: (error: Error, retry: () => void) => ReactNode
  resetKeys?: unknown[]
  children: ReactNode
}

export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }              // render phase: switch to fallback
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, info.componentStack)   // commit phase: side effects allowed
  }

  componentDidUpdate(prev: Props) {
    const keysChanged = (this.props.resetKeys ?? []).some((k, i) => !Object.is(k, prev.resetKeys?.[i]))
    if (this.state.error && keysChanged) this.setState({ error: null })
  }

  retry = () => this.setState({ error: null })

  render() {
    return this.state.error ? this.props.fallback(this.state.error, this.retry) : this.props.children
  }
}

// Usage: retry button plus auto-reset when the user navigates to another id
<ErrorBoundary resetKeys={[userId]}
  fallback={(err, retry) => <><p>{err.message}</p><button onClick={retry}>Try again</button></>}>
  <Suspense fallback={<Spinner />}>
    <Profile id={userId} />
  </Suspense>
</ErrorBoundary>
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Break, then recover">
          <BoundaryDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Boundaries catch errors thrown during render, lifecycle methods and constructors — not in event handlers,
            async code, or the boundary itself. Use <code>try/catch</code> in handlers, or set state to rethrow.
          </li>
          <li>
            Retry only helps if the cause can change. If the child throws for the same props, it fails again — pair
            the retry with invalidating the cache or refetching.
          </li>
          <li>
            In React 19, errors caught by boundaries no longer double-log in development, and <code>createRoot</code>{' '}
            accepts <code>onCaughtError</code> / <code>onUncaughtError</code> for global reporting.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
