import { Highlight, type PrismTheme } from 'prism-react-renderer'
import { useState } from 'react'

// Colors come from CSS tokens so the block follows the page theme.
const theme: PrismTheme = {
  plain: { color: 'var(--code-ink)' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: 'var(--code-comment)', fontStyle: 'italic' } },
    { types: ['keyword', 'builtin', 'important'], style: { color: 'var(--code-keyword)' } },
    { types: ['string', 'char', 'template-string', 'inserted'], style: { color: 'var(--code-string)' } },
    { types: ['tag'], style: { color: 'var(--code-tag)' } },
    { types: ['attr-name'], style: { color: 'var(--code-attr)' } },
    { types: ['function', 'function-variable', 'class-name', 'maybe-class-name'], style: { color: 'var(--code-function)' } },
    { types: ['number', 'boolean', 'constant'], style: { color: 'var(--code-number)' } },
    { types: ['punctuation', 'operator', 'script-punctuation', 'plain-text'], style: { color: 'var(--code-punct)' } },
    { types: ['attr-value'], style: { color: 'var(--code-string)' } },
  ],
}

interface Props {
  code: string
  title?: string
  language?: 'tsx' | 'jsx' | 'ts' | 'js' | 'bash' | 'json'
  /** 1-based line numbers to emphasise */
  highlight?: number[]
}

export function CodeBlock({ code, title, language = 'tsx', highlight = [] }: Props) {
  const [copied, setCopied] = useState(false)
  const src = code.replace(/^\n/, '').replace(/\n\s*$/, '')

  async function copy() {
    try {
      await navigator.clipboard.writeText(src)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="code">
      <div className="code__bar">
        <span className="code__title">{title ?? language}</span>
        <button type="button" className="code__copy" onClick={copy} aria-live="polite">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <Highlight code={src} language={language} theme={theme}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre>
            <code>
              {tokens.map((line, i) => {
                const lp = getLineProps({ line })
                const hl = highlight.includes(i + 1)
                return (
                  <span key={i} {...lp} className={`line${hl ? ' line--hl' : ''}`}>
                    {line.map((token, k) => {
                      const tp = getTokenProps({ token })
                      return <span key={k} {...tp} />
                    })}
                  </span>
                )
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  )
}
