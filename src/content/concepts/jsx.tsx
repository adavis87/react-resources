import { useState } from 'react'
import { Callout } from '../../components/Callout'
import { CodeBlock } from '../../components/CodeBlock'
import { Demo } from '../../components/Demo'
import { Prose, Section } from '../../components/Section'
import type { Entry } from '../types'

function JsxDemo() {
  const [name, setName] = useState('Ada')
  const [show, setShow] = useState(true)
  const items = ['Render', 'Commit', 'Effects']
  return (
    <>
      <div className="row">
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <button onClick={() => setShow((s) => !s)}>{show ? 'Hide list' : 'Show list'}</button>
      </div>
      <div className="box">
        <p>
          Hello, <strong>{name || 'stranger'}</strong>. {name.length > 0 && <span className="pill">{name.length} chars</span>}
        </p>
        {show ? (
          <ul className="list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mono">list hidden</p>
        )}
      </div>
    </>
  )
}

export const jsx: Entry = {
  slug: 'jsx',
  title: 'JSX and elements',
  group: 'Foundations',
  summary: 'JSX is a syntax for describing UI as a tree of plain objects. React never sees HTML — it sees elements.',
  tags: ['jsx', 'elements', 'createElement', 'fragments', 'conditionals', 'lists'],
  body: (
    <>
      <Section title="What it is">
        <Prose>
          <p>
            JSX looks like HTML inside JavaScript, but it compiles to function calls that return{' '}
            <strong>React elements</strong>: small, immutable objects describing what should appear on screen. An element
            is a description, not a DOM node. React compares descriptions across renders and updates the real DOM to match.
          </p>
          <p>
            Because JSX is just expressions, anything JavaScript can do — ternaries, <code>&&</code>, <code>map</code>,
            function calls — works inside the curly braces. There are no template directives to learn.
          </p>
        </Prose>
      </Section>

      <Section title="How it works">
        <Prose>
          <p>
            A compiler (Vite, Next, Babel) rewrites every tag into a call. With the modern automatic runtime,{' '}
            <code>&lt;h1 className="x"&gt;Hi&lt;/h1&gt;</code> becomes{' '}
            <code>jsx('h1', {'{'} className: 'x', children: 'Hi' {'}'})</code>. Lowercase tags become DOM element types
            (strings); capitalised tags become references to your component functions. That is why components must start
            with a capital letter.
          </p>
          <ul>
            <li>
              <strong>Attributes are props.</strong> They use JavaScript names: <code>className</code>,{' '}
              <code>htmlFor</code>, <code>onClick</code>. Style takes an object, not a string.
            </li>
            <li>
              <strong>Braces embed expressions</strong>, not statements. Use ternaries or early returns instead of{' '}
              <code>if</code> inside JSX.
            </li>
            <li>
              <strong>Lists come from arrays.</strong> <code>items.map(...)</code> returns an array of elements; each needs
              a stable <code>key</code> so React can track identity between renders.
            </li>
            <li>
              <strong>Fragments</strong> (<code>&lt;&gt;...&lt;/&gt;</code>) group children without adding a DOM node.
            </li>
            <li>
              <strong>Falsy values.</strong> <code>null</code>, <code>undefined</code>, <code>false</code> render nothing;{' '}
              <code>0</code> and <code>''</code> render as text, which is the classic <code>count && ...</code> bug.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section title="Example">
        <CodeBlock
          title="Greeting.tsx"
          code={`
function Greeting({ name, items }: { name: string; items: string[] }) {
  const trimmed = name.trim()

  return (
    <>
      <h1 className="title">Hello, {trimmed || 'stranger'}</h1>

      {/* Conditional: ternary for either/or, && for "maybe" */}
      {trimmed ? <p>{trimmed.length} characters</p> : null}
      {items.length > 0 && <p>{items.length} items</p>}

      {/* Lists: map to elements, key each one */}
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {/* Style is an object; attributes use JS names */}
      <button style={{ padding: 8 }} onClick={() => alert(trimmed)} aria-label="Say hello">
        Say hello
      </button>
    </>
  )
}
`}
        />
        <CodeBlock
          title="What the compiler produces (simplified)"
          language="js"
          code={`
import { jsx, jsxs } from 'react/jsx-runtime'

// <h1 className="title">Hello, {name}</h1>
jsxs('h1', { className: 'title', children: ['Hello, ', name] })

// <Greeting name="Ada" />   -> the function itself is the type
jsx(Greeting, { name: 'Ada' })
`}
        />
      </Section>

      <Section title="Live demo">
        <Demo>
          <JsxDemo />
        </Demo>
      </Section>

      <Callout kind="gotcha">
        <ul>
          <li>
            <code>{'{count && <Badge />}'}</code> renders a literal <code>0</code> when count is zero. Use{' '}
            <code>{'count > 0 && ...'}</code> or a ternary.
          </li>
          <li>
            Array index as <code>key</code> is only safe for static lists. Reordering or deleting with index keys mixes
            up state between rows.
          </li>
          <li>
            A component must return a single root: wrap siblings in a fragment, not a stray <code>div</code>.
          </li>
          <li>
            Comments inside JSX need braces: <code>{'{/* like this */}'}</code>.
          </li>
        </ul>
      </Callout>
    </>
  ),
}
