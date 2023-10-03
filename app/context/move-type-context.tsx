import type { DriveFile, MoveDataType, MoveType } from "~/types"
import React from "react"
import { z } from "zod"

const MAX_AGE = 1000 * 60 * 60 * 24 // 1 hour

// Set DriveFileData Zod Model
const DriveFileDataZ = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  link: z.string(),
  iconLink: z.string(),
  hasThumbnail: z.boolean(),
  thumbnailLink: z.string().optional(),
  createdTime: z.string().optional(),
  modifiedTime: z.string().optional(),
  webContentLink: z.string().optional(),
  parents: z.array(z.string()).optional(),
  studentFolder: z
    .object({
      folderLink: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  last: z
    .object({
      folderLink: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
})

const MoveDataTypeZ = z.object({
  active: z.boolean(),
  time: z.number(),
  driveFileData: z.array(DriveFileDataZ),
})

// Set MoveType Zod Model
const MoveTypeZ = z.object({
  id: z.string(),
  data: MoveDataTypeZ,
})

type MoveTypeContextType = {
  undoMoveType: MoveType | null
  setUndoMoveType: React.Dispatch<React.SetStateAction<MoveType | null>>
  getItem: (key: string) => MoveType | null
  setItem: (driveFileData: DriveFile[]) => void
  checkTime: () => MoveType[] | undefined
  getItemByTime: (time: number) => MoveType | null
  getAllItems: () => MoveType[] | undefined
}

const initValue: MoveTypeContextType = {
  undoMoveType: null,
  setUndoMoveType: () => {},
  getItem: (key: string) => null,
  setItem: (driveFileData: DriveFile[]) => {},
  checkTime: () => undefined,
  getItemByTime: (time: number) => null,
  getAllItems: () => undefined,
}

// Export context
export const MoveTypeContext =
  React.createContext<MoveTypeContextType>(initValue)

type ProviderProps = {
  children: React.ReactNode
}

// Provider
export const MoveTypeProvider: React.FC<ProviderProps> = ({ children }) => {
  const [undoMoveType, setUndoMoveType] = React.useState<MoveType | null>(null)

  function getItem(key: string): MoveType | null {
    const itemString = localStorage.getItem(key)

    if (!itemString) return null

    const item: MoveDataType = JSON.parse(itemString)

    const moveType: MoveType = MoveTypeZ.parse({
      id: key,
      data: item,
    })

    const parsed = MoveTypeZ.safeParse(moveType)
    if (!parsed.success) return null
    return parsed.data
  }

  function setItem(driveFileData: DriveFile[]) {
    checkTime()

    const time = Date.now()

    const key = `moveType-${time}`

    const moveType = MoveTypeZ.parse({
      id: key,
      data: {
        active: true,
        time,
        driveFileData,
      },
    })

    localStorage.setItem(key, JSON.stringify(moveType.data))
  }

  // Checks timed out localStorage values
  const checkTime = React.useCallback(() => {
    const regex = /^moveType-(\d*)$/

    const moveTypes: MoveType[] = []

    // loops through localStorage
    for (let i = 0; i < localStorage.length; i++) {
      // get key of localStorage
      const key = localStorage.key(i)

      // if key matches `moveData-...`
      if (key && regex.test(key)) {
        const moveType = getItem(key)

        if (!moveType) continue

        const time = new Date(moveType.data.time || 0).getTime()
        const delta = MAX_AGE // 1 hour

        // if 1 hour has passed remove Item and continue
        if (time < Date.now() - delta) {
          localStorage.removeItem(key)
          continue
        }

        // add value to `items`
        const value = getItem(key)
        if (value) moveTypes.push(value)
      }
    }
    return moveTypes
  }, [])

  // Get all items with specific Data type and sorts them in desc order
  const getAllItems = React.useCallback(() => {
    const moveTypes = checkTime()

    if (!moveTypes) return

    const sortedItems = moveTypes.sort((a, b) => {
      const timeA = new Date(a.data.time || 0).getTime()
      const timeB = new Date(b.data.time || 0).getTime()

      return timeB - timeA
    })
    return sortedItems
  }, [checkTime])

  function getItemByTime(time: number): MoveType | null {
    const undoMoveData = getItem(`moveType-${time}`)

    if (!undoMoveData) return null
    return undoMoveData
  }

  const value = {
    undoMoveType,
    setUndoMoveType,
    getItem,
    setItem,
    checkTime,
    getItemByTime,
    getAllItems,
  }

  return (
    <MoveTypeContext.Provider value={value}>
      {children}
    </MoveTypeContext.Provider>
  )
}
