import React from "react"
import toast from "react-hot-toast"

import type { ActionType } from "~/type.d"

export function useToast(
  executeText: string,
  undoText: string,
  actionData?: ActionType,
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
          toast.success(executeText)
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
    executeText,
    undoText,
  ])
}
