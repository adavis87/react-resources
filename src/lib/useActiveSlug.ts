import { useEffect, useState } from 'react'

/**
 * Scroll-spy: returns the slug of the entry currently "in view" — the last
 * entry whose top edge has passed a line a little below the top of the viewport.
 * An explicit navigation (route slug) wins immediately; scrolling takes over afterwards.
 */
export function useActiveSlug(slugs: string[], routeSlug?: string): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = slugs.join('|')

  useEffect(() => {
    if (slugs.length === 0) {
      setActive(null)
      return
    }
    let frame = 0

    function measure() {
      frame = 0
      const line = window.scrollY + Math.min(160, window.innerHeight * 0.25)
      let current: string | null = slugs[0]
      for (const slug of slugs) {
        const el = document.getElementById(slug)
        if (!el) continue
        const top = el.getBoundingClientRect().top + window.scrollY
        if (top <= line) current = slug
        else break
      }
      // At the very bottom, the last entry is the one being read even if its top is far above
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = slugs[slugs.length - 1]
      }
      setActive(current)
    }

    function onScroll() {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    if (routeSlug && slugs.includes(routeSlug)) setActive(routeSlug)
    else measure()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, routeSlug])

  return active
}
