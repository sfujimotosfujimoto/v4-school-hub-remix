import { logger } from "~/logger"
import type { DriveFile } from "~/types"

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
  logger.debug(
    `🍇 isExpired: ${expire < Date.now()}, expire ${new Date(
      expire,
    ).toLocaleString()}, now ${new Date(Date.now()).toLocaleString()}`,
  )

  const now = Date.now()

  // check for expired!!
  if (expire < now) {
    return true
  } else {
    return false
  }
}
