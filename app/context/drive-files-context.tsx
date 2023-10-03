import React from "react"

import type { DriveFile } from "~/types"

/**
 * TYPES
 */
type SetAction = {
  type: "SET"
  payload: {
    driveFiles: DriveFile[]
  }
}

type UpdateMetaSelectedAction = {
  type: "UPDATE_META_SELECTED"
  payload: {
    selected: boolean
  }
}

type SetAndUpdateMetaSelectedAction = {
  type: "SET_AND_UPDATE_META_SELECTED"
  payload: {
    driveFiles: DriveFile[]
    selected: boolean
  }
}

type FilterBySegmentAction = {
  type: "FILTER_BY_SEGMENT"
  payload: {
    segment: string
    driveFiles: DriveFile[]
  }
}
type FilterBySegmentAction2 = {
  type: "FILTER_BY_SEGMENT2"
  payload: {
    segment: string
  }
}

type FilterByExtensionAction = {
  type: "FILTER_BY_EXTENSION"
  payload: {
    extension: string
    driveFiles: DriveFile[]
  }
}

type FilterByNendoAction = {
  type: "FILTER_BY_NENDO"
  payload: {
    nendo: string
    driveFiles: DriveFile[]
  }
}
type FilterByNendoAction2 = {
  type: "FILTER_BY_NENDO2"
  payload: {
    nendo: string
  }
}

type FilterByTagAction = {
  type: "FILTER_BY_TAG"
  payload: {
    tag: string
    driveFiles: DriveFile[]
  }
}

type SetCheckAction = {
  type: "SET_CHECK"
  payload: {
    id: string
    checked: boolean
  }
}

export type Action =
  | SetAction
  | UpdateMetaSelectedAction
  | SetAndUpdateMetaSelectedAction
  | FilterBySegmentAction
  | FilterBySegmentAction2
  | FilterByExtensionAction
  | FilterByNendoAction
  | FilterByNendoAction2
  | FilterByTagAction
  | SetCheckAction

/**
 * REDUCER
 */
function driveFilesReducer(dfs: DriveFile[], action: Action): DriveFile[] {
  switch (action.type) {
    case "SET": {
      return action.payload.driveFiles
    }
    case "UPDATE_META_SELECTED": {
      const selected = action.payload.selected
      return dfs.map((df) => {
        return _setSelected(df, selected)
      })
    }
    case "SET_AND_UPDATE_META_SELECTED": {
      const driveFiles = action.payload.driveFiles as DriveFile[]
      const selected = action.payload.selected
      return driveFiles.map((df) => {
        return _setSelected(df, selected)
      })
    }
    case "FILTER_BY_SEGMENT": {
      const baseDriveFiles = action.payload.driveFiles as DriveFile[]
      return baseDriveFiles.filter((df) => {
        const currentSegments = df.name.split(/[-_.]/)
        return currentSegments.includes(action.payload.segment)
      })
    }
    case "FILTER_BY_SEGMENT2": {
      return dfs.filter((df) => {
        const currentSegments = df.name.split(/[-_.]/)
        return currentSegments.includes(action.payload.segment)
      })
    }
    case "FILTER_BY_EXTENSION": {
      const baseDriveFiles = action.payload.driveFiles as DriveFile[]
      const filtered = baseDriveFiles.filter((df) => {
        const currentExt = df.mimeType.split(/[/.]/).at(-1)
        return currentExt === action.payload.extension
      })
      if (!filtered || !action.payload.extension) {
        return dfs
      } else {
        return filtered
      }
    }
    case "FILTER_BY_NENDO": {
      const nendo = action.payload.nendo
      const baseDriveFiles = action.payload.driveFiles as DriveFile[]
      const filtered = baseDriveFiles
        .filter((df) => df.appProperties?.nendo === nendo)
        .map((df) => {
          return _setSelected(df, true)
        })
      if (!filtered || !nendo) {
        return dfs
      } else {
        return filtered
      }
    }
    case "FILTER_BY_NENDO2": {
      const nendo = action.payload.nendo
      const filtered = dfs.filter((df) => df.appProperties?.nendo === nendo)
      if (!filtered || !nendo) {
        return dfs
      } else {
        return filtered
      }
    }
    case "FILTER_BY_TAG": {
      const tag = action.payload.tag
      const baseDriveFiles = action.payload.driveFiles as DriveFile[]

      const filtered = baseDriveFiles
        .filter((df) => {
          const tags = df.appProperties?.tags?.split(",")
          return tags?.includes(tag)
        })
        .map((df) => _setSelected(df, true))
      if (!filtered || !tag) {
        return dfs
      } else {
        return filtered
      }
    }
    case "SET_CHECK": {
      const id = action.payload.id
      const checked = action.payload.checked
      const foundId = dfs.findIndex((df) => df.id === id)
      if (foundId < 0) {
        return dfs
      } else {
        // draft[foundId].meta?.selected == checked
        const found = dfs[foundId]
        dfs[foundId] = {
          ...found,
          meta: {
            ...found.meta,
            selected: checked,
          },
        }
        return dfs
      }
    }
    default:
      return dfs
  }
}

/**
 * CONTEXT
 */
const DriveFilesContext = React.createContext<DriveFile[]>([])
const DriveFilesDispatchContext = React.createContext<React.Dispatch<Action>>(
  () => {},
)

/**
 * PROVIDER
 */
function DriveFilesProvider({ children }: { children: React.ReactNode }) {
  const initialState: DriveFile[] = []
  const [driveFiles, dispatch] = React.useReducer(
    driveFilesReducer,
    initialState,
  )

  return (
    <DriveFilesContext.Provider value={driveFiles}>
      <DriveFilesDispatchContext.Provider value={dispatch}>
        {children}
      </DriveFilesDispatchContext.Provider>
    </DriveFilesContext.Provider>
  )
}

export default DriveFilesProvider

/**
 * HOOKS
 */
export function useDriveFilesContext() {
  const driveFiles = React.useContext(DriveFilesContext)

  const driveFilesDispatch = React.useContext(DriveFilesDispatchContext)

  if (driveFiles === undefined || driveFilesDispatch === undefined) {
    throw new Error("useDriveFiles must be used within a DriveFilesProvider")
  }
  return { driveFiles, driveFilesDispatch }
}

/**
 * functions
 */

export function setSelected(driveFiles: DriveFile[], selected: boolean) {
  return driveFiles.map((df) => {
    return _setSelected(df, selected)
  })
}

function _setSelected(df: DriveFile, selected: boolean) {
  return {
    ...df,
    meta: {
      ...df.meta,
      selected,
    },
  }
}
