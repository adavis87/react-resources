import { useState } from 'react'
import { applyTheme, readTheme, type ThemeChoice } from '../lib/theme'

const choices: ThemeChoice[] = ['light', 'system', 'dark']

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readTheme())

  function pick(next: ThemeChoice) {
    setChoice(next)
    applyTheme(next)
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      {choices.map((c) => (
        <button key={c} type="button" aria-pressed={choice === c} onClick={() => pick(c)}>
          {c}
        </button>
      ))}
    </div>
  )
}
