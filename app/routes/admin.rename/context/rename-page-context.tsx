import React from "react"

import { useImmerReducer } from "use-immer"

// types
import type { drive_v3 } from "googleapis"

/**
 * TYPES
 */
type SetAction = {
  type: "SET"
  payload: {
    sourceFolder: drive_v3.Schema$File
  }
}

export type Action = SetAction

type RenamePageType = {
  sourceFolder: drive_v3.Schema$File | null
}

const initialState: {
  sourceFolder: drive_v3.Schema$File | null
} = { sourceFolder: null }

/**
 * REDUCER
 */
function renameReducer(draft: RenamePageType, action: Action): RenamePageType {
  switch (action.type) {
    case "SET": {
      draft.sourceFolder = action.payload.sourceFolder
    }

    default:
      return draft
  }
}

/**
 * CONTEXT
 */
const RenamePageContext = React.createContext<RenamePageType>(initialState)
const RenamePageDispatchContext = React.createContext<React.Dispatch<Action>>(
  () => {},
)

/**
 * PROVIDER
 */
function RenamePageProvider({ children }: { children: React.ReactNode }) {
  const initialState: {
    sourceFolder: drive_v3.Schema$File | null
  } = { sourceFolder: null }

  const [renameState, dispatch] = useImmerReducer(renameReducer, initialState)

  return (
    <RenamePageContext.Provider value={renameState}>
      <RenamePageDispatchContext.Provider value={dispatch}>
        {children}
      </RenamePageDispatchContext.Provider>
    </RenamePageContext.Provider>
  )
}

export default RenamePageProvider

/**
 * HOOKS
 */
export function useRenamePageContext() {
  const renamePage = React.useContext(RenamePageContext)
  const renamePageDispatch = React.useContext(RenamePageDispatchContext)

  if (renamePage === undefined || renamePageDispatch === undefined) {
    throw new Error("Must be used within a Provider")
  }
  return { renamePage, renamePageDispatch }
}
