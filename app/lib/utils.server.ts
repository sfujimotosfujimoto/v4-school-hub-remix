import { logger } from "~/logger"
import type { ActionResponse, DriveFile } from "~/types"
import { toLocaleString } from "./utils"

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

// Check expiration
export function isExpired(expire: number): boolean {
  if (expire < 10_000_000_000 && expire > 0)
    throw Error(`expire is incorrect: ${expire}`)
  logger.info(
    `🍇 isExpired: ${expire < Date.now()}, expire ${toLocaleString(
      expire,
    )}, now ${toLocaleString(Date.now())}`,
  )

  const now = Date.now()

  // check for expired!!
  if (expire < now) {
    return true
  } else {
    return false
  }
}

export function flatFiles(
  arrOfFiles: ActionResponse[],
  key: "successFiles" | "errorFiles",
) {
  return arrOfFiles.map((d) => d[key]).flat()
}

export function parseDateToString(date: Date | null | undefined) {
  if (!date) return null
  return date.toISOString()
}
