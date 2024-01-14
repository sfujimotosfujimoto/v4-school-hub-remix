import React from "react"
import toast from "react-hot-toast"

import type { ActionTypeGoogle } from "~/types"

export function useToast(
  executeText: string,
  undoText: string,
  actionData?: ActionTypeGoogle,
) {
  React.useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData?.error)
    }
    if (actionData?.ok) {
      switch (actionData?.type) {
        case "search": {
          toast.success(`ファイルを検索しました。`)
          break
        }
        case "execute": {
          // toast.success(executeText)

          if (actionData?.data && "driveFiles" in actionData.data) {
            if (actionData.data.driveFiles.length > 0) {
              const successLength = actionData.data.driveFiles.length
              toast.success(`${successLength}件のファイルを移動しました。`)
            } else {
              toast.error(`ファイルの移動に失敗しました。`)
            }
          }
          if (actionData?.data && "errorFiles" in actionData.data) {
            actionData.data.errorFiles?.forEach((f) => {
              toast.error(`${f.name}の移動に失敗しました。`)
            })
          }
          break
        }
        case "undo": {
          toast.success(undoText)
          break
        }
      }
    }
  }, [
    actionData?.error,
    actionData?.ok,
    actionData?.type,
    actionData?.data,
    executeText,
    undoText,
  ])
}
