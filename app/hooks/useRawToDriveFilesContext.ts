import React from "react"
import toast from "react-hot-toast"
import { DriveFilesSchema } from "~/schemas"

import type { Action } from "~/context/drive-files-context"
import type { ActionType, DriveFile } from "~/type.d"

/**
 * useRawToDriveFilesContext
 * validate rawDriveFiles using zod and set to driveFiles in Context
 */
export function useRawToDriveFilesContext(
  driveFilesDispatch: React.Dispatch<Action>,
  actionData?: ActionType,
) {
  React.useEffect(() => {
    // if no data, do nothing
    if (!actionData?.data || !("driveFiles" in actionData.data)) return

    // set to rawDriveFiles
    const rawDriveFiles = actionData?.data?.driveFiles ?? []

    // validate rawDriveFiles using zod
    const result = DriveFilesSchema.safeParse(rawDriveFiles)
    if (!result.success) {
      toast.error(`データの読み込みに失敗しました。`)
      return
    }

    // set to _driveFiles
    const _driveFiles = result.data as unknown as DriveFile[]

    // set to driveFiles in Context
    driveFilesDispatch({
      type: "SET_AND_UPDATE_META_SELECTED",
      payload: {
        driveFiles: _driveFiles,
        selected: true,
      },
    })
  }, [actionData?.data, driveFilesDispatch])
}
