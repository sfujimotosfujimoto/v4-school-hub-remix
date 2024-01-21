import type { drive_v3 } from "googleapis"
import React from "react"

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

type RenameCsvPageType = {
  sourceFolder: drive_v3.Schema$File | null
}

const initialState: {
  sourceFolder: drive_v3.Schema$File | null
} = { sourceFolder: null }

/**
 * REDUCER
 */
function renameCsvReducer(
  draft: RenameCsvPageType,
  action: Action,
): RenameCsvPageType {
  switch (action.type) {
    case "SET": {
      draft.sourceFolder = action.payload.sourceFolder
      return {
        ...draft,
        sourceFolder: action.payload.sourceFolder,
      }
    }

    default:
      return draft
  }
}

/**
 * CONTEXT
 */
const RenameCsvPageContext =
  React.createContext<RenameCsvPageType>(initialState)
const RenameCsvPageDispatchContext = React.createContext<
  React.Dispatch<Action>
>(() => {})

/**
 * PROVIDER
 */
function RenameCsvPageProvider({ children }: { children: React.ReactNode }) {
  const initialState: {
    sourceFolder: drive_v3.Schema$File | null
  } = { sourceFolder: null }

  const [renameState, dispatch] = React.useReducer(
    renameCsvReducer,
    initialState,
  )

  return (
    <RenameCsvPageContext.Provider value={renameState}>
      <RenameCsvPageDispatchContext.Provider value={dispatch}>
        {children}
      </RenameCsvPageDispatchContext.Provider>
    </RenameCsvPageContext.Provider>
  )
}

export default RenameCsvPageProvider

/**
 * HOOKS
 */
export function useRenameCsvPageContext() {
  const renameCsvPage = React.useContext(RenameCsvPageContext)
  const renameCsvPageDispatch = React.useContext(RenameCsvPageDispatchContext)

  if (renameCsvPage === undefined || renameCsvPageDispatch === undefined) {
    throw new Error("Must be used within a Provider")
  }
  return {
    renameCsvPage,
    renameCsvPageDispatch,
  }
}
