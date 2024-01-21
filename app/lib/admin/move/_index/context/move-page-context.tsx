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

type MovePageType = {
  sourceFolder: drive_v3.Schema$File | null
}

const initialState: {
  sourceFolder: drive_v3.Schema$File | null
} = { sourceFolder: null }

/**
 * REDUCER
 */
function moveReducer(data: MovePageType, action: Action): MovePageType {
  switch (action.type) {
    case "SET": {
      const newData = {
        ...data,
        sourceFolder: action.payload.sourceFolder,
      }
      return newData
    }

    default:
      return data
  }
}

/**
 * CONTEXT
 */
const MovePageContext = React.createContext<MovePageType>(initialState)
const MovePageDispatchContext = React.createContext<React.Dispatch<Action>>(
  () => {},
)

/**
 * PROVIDER
 */
function MovePageProvider({ children }: { children: React.ReactNode }) {
  const initialState: {
    sourceFolder: drive_v3.Schema$File | null
  } = { sourceFolder: null }

  const [moveState, dispatch] = React.useReducer(moveReducer, initialState)

  return (
    <MovePageContext.Provider value={moveState}>
      <MovePageDispatchContext.Provider value={dispatch}>
        {children}
      </MovePageDispatchContext.Provider>
    </MovePageContext.Provider>
  )
}

export default MovePageProvider

/**
 * HOOKS
 */
export function useMovePageContext() {
  const movePage = React.useContext(MovePageContext)
  const movePageDispatch = React.useContext(MovePageDispatchContext)

  if (movePage === undefined || movePageDispatch === undefined) {
    throw new Error("Must be used within a Provider")
  }
  return { movePage: movePage, movePageDispatch: movePageDispatch }
}
