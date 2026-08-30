import { useEffect } from 'react'

/** Scroll the entry matching the route slug into view when the route changes. */
export function useScrollToSlug(slug: string | undefined, ready: boolean) {
  useEffect(() => {
    if (!ready) return
    if (!slug) {
      window.scrollTo({ top: 0 })
      return
    }
    const el = document.getElementById(slug)
    if (el) el.scrollIntoView({ block: 'start' })
  }, [slug, ready])
}
