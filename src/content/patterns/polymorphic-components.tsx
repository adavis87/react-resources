import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

export const polymorphicComponents: Entry = {
  slug: 'polymorphic-components',
  title: 'Polymorphic components',
  group: 'Component APIs',
  level: 'advanced',
  summary:
    'An `as` prop lets one styled component render as any element or component while its props stay correctly typed for that element.',
  tags: ['as prop', 'polymorphic', 'typescript', 'ComponentPropsWithoutRef', 'design system'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            A <code>Button</code> that sometimes needs to be a link, a <code>Text</code> that is a <code>p</code> here
            and a <code>label</code> there, a <code>Box</code> that is any container: instead of duplicating styles per
            element, accept an <code>as</code> prop and render that. The interesting part is the TypeScript: the
            remaining props should be those of whatever <code>as</code> resolves to, so <code>{'<Box as="a" href>'}</code>{' '}
            type-checks and <code>{'<Box as="div" href>'}</code> does not.
          </p>
        </Prose>
      </Section>

      <Section title="When to use it">
        <Prose>
          <ul>
            <li>Design-system primitives (Box, Stack, Text, Button) that must keep semantics flexible.</li>
            <li>Buttons that are links, headings whose level depends on context, list items that are routes.</li>
            <li>
              Avoid for app-level components; a plain <code>ButtonLink</code> is easier to read than a generic.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Box.tsx"
          highlight={[3, 4, 5, 6, 7, 8, 10]}
          code={`
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type BoxProps<T extends ElementType> = {
  as?: T
  padding?: number
  children?: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'padding' | 'children'>
//  ^ everything the underlying element accepts, minus what we define ourselves

export function Box<T extends ElementType = 'div'>({ as, padding = 0, style, ...rest }: BoxProps<T>) {
  const Component = as ?? 'div'
  return <Component style={{ padding, ...style }} {...rest} />
}

<Box as="a" href="/docs" padding={8}>Docs</Box>        // ok: href is an <a> prop
<Box as="section" aria-label="Sidebar" />              // ok
<Box href="/docs" />                                   // error: div has no href
<Box as={Link} to="/settings" />                       // works with components too

// React 19: ref is a normal prop, so it flows through ...rest.
// In React 18 you would wrap in forwardRef and type the ref with ComponentPropsWithRef<T>['ref'].
`}
        />
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            The generic component must be a function declaration or a typed arrow — wrapping it in{' '}
            <code>memo</code> or <code>forwardRef</code> erases the generic and every <code>as</code> becomes{' '}
            <code>any</code>-ish. React 19 removes the <code>forwardRef</code> half of that problem.
          </li>
          <li>
            Type instantiation is expensive; a deeply polymorphic component in a hot file slows down the editor. Keep
            the prop union small.
          </li>
          <li>
            Rendering <code>{'<Box as="button">'}</code> does not add button behaviour to a styled div — the element
            changes, your CSS resets (e.g. button fonts) must handle it.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
