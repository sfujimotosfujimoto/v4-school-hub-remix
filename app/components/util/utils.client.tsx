import type { DriveFile } from "~/types"

/**
 * updateSelected
 */
export function updateSelected(driveFiles: DriveFile[], bool: boolean) {
  return driveFiles.map((df) => {
    return {
      ...df,
      meta: {
        ...df.meta,
        selected: bool,
      },
    }
  })
}
