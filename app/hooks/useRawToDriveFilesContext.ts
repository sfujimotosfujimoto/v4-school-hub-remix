import React from "react"
import toast from "react-hot-toast"

import type { Action } from "~/context/drive-files-context"
import { convertDriveFiles } from "~/lib/utils-loader"
import type { ActionTypeGoogle } from "~/types"

/**
 * useRawToDriveFilesContext
 * validate rawDriveFiles using zod and set to driveFiles in Context
 */
export function useRawToDriveFilesContext(
  driveFilesDispatch: React.Dispatch<Action>,
  actionData?: ActionTypeGoogle | undefined,
) {
  React.useEffect(() => {
    // if no data, do nothing
    if (!actionData?.data || !("driveFiles" in actionData.data)) return

    // set to rawDriveFiles
    const rawDriveFiles = actionData?.data?.driveFiles ?? []

    // validate rawDriveFiles using zod
    // const result = DriveFilesSchema.safeParse(rawDriveFiles)
    // if (!result.success) {
    //   toast.error(`データの読み込みに失敗しました。`)
    //   return
    // }
    // // set to _driveFiles
    // const _driveFiles = result.data as unknown as DriveFile[]

    const dfd = convertDriveFiles(rawDriveFiles)

    if (!dfd) {
      toast.error(`データの読み込みに失敗しました。`)
      return
    }
    // set to driveFiles in Context
    driveFilesDispatch({
      type: "SET_AND_UPDATE_META_SELECTED",
      payload: {
        driveFiles: dfd,
        selected: true,
      },
    })
  }, [actionData?.data, driveFilesDispatch])
}
