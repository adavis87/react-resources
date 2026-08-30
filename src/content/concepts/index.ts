import type { Entry } from '../types'
import { componentsProps } from './components-props'
import { context } from './context'
import { customHooks } from './custom-hooks'
import { errorBoundaries } from './error-boundaries'
import { eventsForms } from './events-forms'
import { jsx } from './jsx'
import { keys } from './keys'
import { liftingState } from './lifting-state'
import { memoization } from './memoization'
import { portals } from './portals'
import { renderModel } from './render-model'
import { state } from './state'
import { suspense } from './suspense'
import { transitions } from './transitions'
import { useAndServerComponents } from './use-and-server-components'
import { useEffectEntry } from './use-effect'
import { useReducerEntry } from './use-reducer'
import { useRefEntry } from './use-ref'
import { useSyncExternalStoreEntry } from './use-sync-external-store'

/** Ordered as a learning path. */
export const concepts: Entry[] = [
  jsx,
  componentsProps,
  state,
  renderModel,
  keys,
  eventsForms,
  useEffectEntry,
  useRefEntry,
  context,
  useReducerEntry,
  memoization,
  customHooks,
  liftingState,
  errorBoundaries,
  suspense,
  transitions,
  useAndServerComponents,
  portals,
  useSyncExternalStoreEntry,
]
