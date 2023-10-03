import React from "react"
import toast from "react-hot-toast"
import { DriveFilesSchema } from "~/schemas"

import type { Action } from "~/context/drive-files-context"
import type { ActionType, DriveFile } from "~/types"

export function useRawToDriveFilesContext(
  driveFilesDispatch: React.Dispatch<Action>,
  actionData?: ActionType,
) {
  React.useEffect(() => {
    if (!actionData?.data || !("driveFiles" in actionData.data)) return
    const rawDriveFiles = actionData?.data?.driveFiles ?? []

    const result = DriveFilesSchema.safeParse(rawDriveFiles)
    if (!result.success) {
      toast.error(`データの読み込みに失敗しました。`)
      return
    }

    const _driveFiles = result.data as unknown as DriveFile[]

    driveFilesDispatch({
      type: "SET_AND_UPDATE_META_SELECTED",
      payload: {
        driveFiles: _driveFiles,
        selected: true,
      },
    })
  }, [actionData?.data, driveFilesDispatch])
}
