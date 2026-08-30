# React Field Manual

A reference site for the React concepts worth knowing cold, and the patterns that React code keeps settling into. Every entry explains what the idea is, how React actually implements it, shows a worked example, and — where it helps — includes a live demo you can poke at.

**Live site:** https://adavis87.github.io/react-resources/

## What's inside

**Core concepts** (ordered as a learning path): JSX and elements · Components and props · State with `useState` · The render model · Keys and reconciliation · Events and forms · `useEffect` and the lifecycle · `useRef` · Context · `useReducer` · Memoization · Custom hooks and the rules of hooks · Lifting state and derived state · Error boundaries · Suspense and code splitting · Transitions and concurrent rendering · `use()` and Server Components · Portals · `useSyncExternalStore`

**Common patterns**, in two tiers:

- *Beginner / Intermediate* — conditional rendering, stable keys, lifting state up, controlled inputs, composition over inheritance, derived state, reset with `key`, a data-fetching hook, context for prop drilling, container/presentational.
- *Advanced* — compound components, render props, higher-order components, the state reducer pattern, control props, provider composition, polymorphic components, render isolation, virtualization, Suspense data fetching, optimistic updates, error boundaries with retry, accessible overlays, form actions, external stores.

Content targets **React 19** and calls out what changed from 18 where it matters.

## Running locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # single-file build in dist/
npm run preview   # serve the build
```

## Adding an entry

Each concept or pattern is one file in `src/content/concepts/` or `src/content/patterns/` exporting an `Entry` (see `src/content/types.ts`). Add it to the matching `index.ts` in the order you want it to appear in the sidebar. Entries use the shared `Section`, `CodeBlock`, `Demo` and `Callout` components.

## Stack

Vite · React 19 · TypeScript · react-router (hash routing, so deep links work on GitHub Pages) · prism-react-renderer. The build inlines everything into a single `index.html` so it can be hosted anywhere, including as a static artifact.
