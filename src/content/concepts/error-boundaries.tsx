import { Component, useState, type ErrorInfo, type ReactNode } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

class Boundary extends Component<{ children: ReactNode; onReset: () => void }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // report to your error service here
  }
  render() {
    if (this.state.error) {
      return (
        <div className="error-box">
          <div className="row">
            <span>Something broke: {this.state.error.message}</span>
            <button
              onClick={() => {
                this.setState({ error: null })
                this.props.onReset()
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
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
    <>
      <div className="row">
        <button onClick={() => setBroken(true)} disabled={broken}>Break the widget</button>
        <span className="mono">the rest of the demo keeps working</span>
      </div>
      <Boundary onReset={() => setBroken(false)}>
        <Widget shouldThrow={broken} />
      </Boundary>
    </>
  )
}

export const errorBoundaries: Entry = {
  slug: 'error-boundaries',
  title: 'Error boundaries',
  group: 'Data flow',
  summary:
    'An error boundary catches render errors in its subtree and shows a fallback instead of unmounting the whole app. It is the one place class components are still required.',
  tags: ['error boundary', 'getDerivedStateFromError', 'componentDidCatch', 'fallback', 'resilience'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            When a component throws during render, React unwinds to the nearest error boundary — a class component
            defining <code>static getDerivedStateFromError</code> and/or <code>componentDidCatch</code>. The boundary
            renders fallback UI for that subtree; siblings outside it are unaffected. Without any boundary, React
            unmounts the entire root.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <ul>
            <li>
              Boundaries catch errors thrown in render, in lifecycle methods, and in constructors of anything below them.
            </li>
            <li>
              They do <strong>not</strong> catch errors in event handlers, in async code (<code>setTimeout</code>,
              promises), in server-side rendering, or in the boundary itself. Use <code>try/catch</code> in handlers, or
              set state to rethrow during render.
            </li>
            <li>
              To recover, reset the boundary's state (a "try again" button) or give it a <code>key</code> that changes
              when the underlying data changes.
            </li>
            <li>
              Place them at meaningful seams: route level, panel/widget level, and around third-party components.
              Granular boundaries keep failures local.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="ErrorBoundary.tsx"
          highlight={[8, 12]}
          code={`
interface Props { fallback: (error: Error, reset: () => void) => ReactNode; children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  // Called during render: return the next state
  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  // Called during commit: side effects like logging go here
  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    return this.state.error ? this.props.fallback(this.state.error, this.reset) : this.props.children
  }
}

// Usage
<ErrorBoundary fallback={(err, reset) => <Panel title="Chart unavailable"><button onClick={reset}>Retry</button></Panel>}>
  <RevenueChart />
</ErrorBoundary>
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo>
          <BoundaryDemo />
        </Demo>
      </Section>

      <Callout kind="react19">
        <ul>
          <li>
            Root-level hooks: <code>createRoot(el, {'{ onCaughtError, onUncaughtError, onRecoverableError }'})</code>{' '}
            centralise reporting without a boundary in every subtree.
          </li>
          <li>
            The <code>react-error-boundary</code> package provides a maintained boundary with <code>resetKeys</code>,{' '}
            <code>onReset</code>, and a <code>useErrorBoundary</code> hook for surfacing async errors to the nearest
            boundary.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
