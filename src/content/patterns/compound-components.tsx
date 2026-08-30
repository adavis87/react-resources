import { createContext, use, useId, useState, type ReactNode } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

// --- demo implementation ---------------------------------------------------
interface TabsCtx {
  active: string
  setActive: (id: string) => void
  baseId: string
}
const TabsContext = createContext<TabsCtx | null>(null)

function useTabs(component: string) {
  const ctx = use(TabsContext)
  if (!ctx) throw new Error(`<${component}> must be rendered inside <Tabs>`)
  return ctx
}

function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultValue)
  const baseId = useId()
  return <TabsContext value={{ active, setActive, baseId }}>{children}</TabsContext>
}

function TabList({ children }: { children: ReactNode }) {
  return (
    <div className="tabbar" role="tablist">
      {children}
    </div>
  )
}

function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { active, setActive, baseId } = useTabs('Tab')
  const selected = active === value
  return (
    <button
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => setActive(value)}
    >
      {children}
    </button>
  )
}

function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { active, baseId } = useTabs('TabPanel')
  if (active !== value) return null
  return (
    <div role="tabpanel" id={`${baseId}-panel-${value}`} aria-labelledby={`${baseId}-tab-${value}`} className="box">
      {children}
    </div>
  )
}

Tabs.List = TabList
Tabs.Tab = Tab
Tabs.Panel = TabPanel

function CompoundDemo() {
  return (
    <Tabs defaultValue="render">
      <Tabs.List>
        <Tabs.Tab value="render">Render</Tabs.Tab>
        <Tabs.Tab value="commit">Commit</Tabs.Tab>
        <Tabs.Tab value="effects">Effects</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="render">React calls your components and builds a new element tree.</Tabs.Panel>
      <Tabs.Panel value="commit">React applies the diff to the DOM, then runs layout effects.</Tabs.Panel>
      <Tabs.Panel value="effects">After paint, <code>useEffect</code> callbacks run.</Tabs.Panel>
    </Tabs>
  )
}

export const compoundComponents: Entry = {
  slug: 'compound-components',
  title: 'Compound components',
  group: 'Component APIs',
  level: 'advanced',
  summary:
    'A family of components that share implicit state through context, so consumers arrange the pieces freely instead of configuring one component with a giant props object.',
  tags: ['compound components', 'context', 'tabs', 'component api', 'composition'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            Think of <code>&lt;select&gt;</code> and <code>&lt;option&gt;</code>: neither is useful alone, and they
            communicate without you wiring them together. Compound components reproduce that in React. A parent (
            <code>Tabs</code>) owns the state and publishes it through a context; children (<code>Tabs.Tab</code>,{' '}
            <code>Tabs.Panel</code>) read it. The consumer decides layout, order and what goes in between.
          </p>
          <p>
            The alternative — <code>{'<Tabs items={[{ label, content }]} />'}</code> — works until someone needs an
            icon in one tab, a badge in another, or a panel that is lazy. Compound components move that flexibility to
            JSX where it belongs.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>Widgets with several cooperating parts: tabs, accordions, menus, comboboxes, steppers.</li>
            <li>When consumers need to control markup between the parts, not just their content.</li>
            <li>Library components that must fit many layouts without a props explosion.</li>
          </ul>
          <p>
            Attach the parts as static properties (<code>Tabs.Tab = Tab</code>) or export them separately — the static
            form documents the relationship at the call site.
          </p>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Tabs.tsx"
          highlight={[12, 21, 30]}
          code={`
import { createContext, use, useId, useState, type ReactNode } from 'react'

interface TabsCtx { active: string; setActive: (v: string) => void; baseId: string }
const TabsContext = createContext<TabsCtx | null>(null)

function useTabs(name: string) {
  const ctx = use(TabsContext)
  if (!ctx) throw new Error(\`<\${name}> must be inside <Tabs>\`)
  return ctx
}

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultValue)
  const baseId = useId() // stable ids for aria-controls / aria-labelledby
  // React 19: a context object is its own provider
  return <TabsContext value={{ active, setActive, baseId }}>{children}</TabsContext>
}

function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { active, setActive, baseId } = useTabs('Tab')
  const selected = active === value
  return (
    <button role="tab" id={\`\${baseId}-tab-\${value}\`} aria-selected={selected}
      aria-controls={\`\${baseId}-panel-\${value}\`} onClick={() => setActive(value)}>
      {children}
    </button>
  )
}

function Panel({ value, children }: { value: string; children: ReactNode }) {
  const { active, baseId } = useTabs('Panel')
  if (active !== value) return null
  return <div role="tabpanel" id={\`\${baseId}-panel-\${value}\`}>{children}</div>
}

Tabs.List = ({ children }: { children: ReactNode }) => <div role="tablist">{children}</div>
Tabs.Tab = Tab
Tabs.Panel = Panel

// Consumer controls arrangement entirely
<Tabs defaultValue="a">
  <Tabs.List>
    <Tabs.Tab value="a">Overview</Tabs.Tab>
    <Tabs.Tab value="b">Settings <Badge>3</Badge></Tabs.Tab>
  </Tabs.List>
  <hr />
  <Tabs.Panel value="a">…</Tabs.Panel>
  <Tabs.Panel value="b">…</Tabs.Panel>
</Tabs>
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo title="Context-driven Tabs">
          <CompoundDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            Throw a clear error when a part is rendered outside its parent — a silent <code>null</code> context turns
            into a confusing crash three components away.
          </li>
          <li>
            The context value is a new object each render of <code>Tabs</code>, so every part re-renders with it. Fine
            for a tab strip; for large trees, memoise the value or split state and setters into two contexts.
          </li>
          <li>
            Don't rely on <code>React.Children.map</code> to find parts by type. It breaks as soon as a consumer wraps a
            tab in a <code>div</code> or a fragment; context has no such limit.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
