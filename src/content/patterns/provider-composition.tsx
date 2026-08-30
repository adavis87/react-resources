import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

export const providerComposition: Entry = {
  slug: 'provider-composition',
  title: 'Provider composition',
  group: 'Component APIs',
  level: 'advanced',
  summary:
    'Flatten the pyramid of context providers at the app root, and split contexts so that a change in one value does not re-render every consumer of the others.',
  tags: ['context', 'providers', 'composeProviders', 're-renders', 'app root'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Apps accumulate providers — theme, auth, router, query client, feature flags, i18n — and the root ends up
            ten levels deep. Two techniques keep this manageable. First, a tiny <code>composeProviders</code> helper
            turns a list into one component. Second, and more important for performance, each context should carry one
            concern, and values that change at different rates go in different contexts.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>More than three or four providers at the root, or the same stack repeated in tests and Storybook.</li>
            <li>
              A context holding both a frequently changing value and its setter, where components that only need the
              setter re-render on every change.
            </li>
            <li>
              Not a fix for using context as a global store — for high-frequency state, see <em>External store</em>.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="providers.tsx"
          highlight={[4, 5, 6, 7, 8, 21, 22]}
          code={`
import type { ComponentType, ReactNode } from 'react'

type Provider = ComponentType<{ children: ReactNode }>

export function composeProviders(...providers: Provider[]): Provider {
  return function Composed({ children }) {
    // Rightmost provider is innermost, like function composition
    return providers.reduceRight((acc, P) => <P>{acc}</P>, children)
  }
}

// Providers that need props get bound first
const Query: Provider = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

export const AppProviders = composeProviders(Query, AuthProvider, ThemeProvider, FlagsProvider)

// Splitting state and dispatch so setters don't re-render on every change
const CountContext = createContext(0)
const CountDispatchContext = createContext<Dispatch<Action>>(() => {})

function CountProvider({ children }: { children: ReactNode }) {
  const [count, dispatch] = useReducer(reducer, 0)
  return (
    <CountContext value={count}>
      <CountDispatchContext value={dispatch}>{children}</CountDispatchContext>
    </CountContext>
  )
}
// A button that only dispatches subscribes to a value that never changes:
const dispatch = use(CountDispatchContext)
`}
        />
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            A provider whose value is an inline object <code>{'value={{ user, setUser }}'}</code> re-renders every
            consumer on every render of the provider, even when nothing changed. Memoise the object or split it.
          </li>
          <li>
            Order still matters after composition — a provider that calls <code>useAuth()</code> must be inside{' '}
            <code>AuthProvider</code>. Keep the list ordered outermost-first and comment the dependencies.
          </li>
          <li>
            React 19 lets you render <code>{'<Ctx value={…}>'}</code> directly; <code>Ctx.Provider</code> still works
            but is deprecated.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
