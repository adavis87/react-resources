import type { Entry } from '../types'
import { accessibleOverlays } from './accessible-overlays'
import { composition } from './composition'
import { compoundComponents } from './compound-components'
import { conditionalRendering } from './conditional-rendering'
import { containerPresentational } from './container-presentational'
import { contextForPropDrilling } from './context-for-prop-drilling'
import { controlProps } from './control-props'
import { controlledInputs } from './controlled-inputs'
import { dataFetchingHook } from './data-fetching-hook'
import { derivedState } from './derived-state'
import { errorBoundaryWithRetry } from './error-boundary-with-retry'
import { externalStore } from './external-store'
import { formActions } from './form-actions'
import { higherOrderComponents } from './higher-order-components'
import { liftingStateUp } from './lifting-state-up'
import { optimisticUpdates } from './optimistic-updates'
import { polymorphicComponents } from './polymorphic-components'
import { providerComposition } from './provider-composition'
import { renderIsolation } from './render-isolation'
import { renderProps } from './render-props'
import { resetWithKey } from './reset-with-key'
import { stableKeys } from './stable-keys'
import { stateReducer } from './state-reducer'
import { suspenseDataFetching } from './suspense-data-fetching'
import { virtualization } from './virtualization'

/** Beginner → intermediate → advanced. */
export const patterns: Entry[] = [
  // Everyday patterns
  conditionalRendering,
  stableKeys,
  liftingStateUp,
  controlledInputs,
  composition,
  // Structure & data
  derivedState,
  resetWithKey,
  dataFetchingHook,
  contextForPropDrilling,
  containerPresentational,
  // Component APIs (advanced)
  compoundComponents,
  renderProps,
  higherOrderComponents,
  stateReducer,
  controlProps,
  providerComposition,
  polymorphicComponents,
  // Rendering & data (advanced)
  renderIsolation,
  virtualization,
  suspenseDataFetching,
  optimisticUpdates,
  errorBoundaryWithRetry,
  accessibleOverlays,
  formActions,
  externalStore,
]
