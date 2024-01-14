import React from "react"
import toast from "react-hot-toast"

import type { ActionTypeGoogle } from "~/types"

export function useToast(actionData?: ActionTypeGoogle) {
  React.useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData?.error)
    }
    if (actionData?.ok) {
      let executeText = ""
      let errorText1 = ""
      let errorText2 = ""

      if (actionData?.data && "_action" in actionData.data) {
        const action = actionData.data._action
        switch (action) {
          case "rename": {
            executeText = "のファイルの名前を変更しました。"
            errorText1 = "のファイルの名前を変更に失敗しました。"
            errorText2 = "名前を変更に失敗しました。"
            break
          }
          case "rename-csv": {
            executeText = "のファイルの名前を変更しました。"
            errorText1 = "のファイルの名前を変更に失敗しました。"
            errorText2 = "名前を変更に失敗しました。"
            break
          }
          case "move": {
            executeText = "のファイルを移動しました。"
            errorText1 = "のファイル移動に失敗しました。"
            break
          }
        }
      }

      switch (actionData?._action) {
        case "search": {
          if (actionData?.data && "driveFiles" in actionData.data) {
            if (actionData.data.driveFiles.length > 0) {
              const successLength = actionData.data.driveFiles.length
              toast.success(`${successLength}件のファイルが見つかりました。`)
            } else {
              toast.error(`ファイルの検索に失敗しました。`)
            }
          } else {
            toast.success(`ファイルを検索しました。`)
          }
          break
        }
        case "execute": {
          // toast.success(executeText)

          if (actionData?.data && "driveFiles" in actionData.data) {
            if (actionData.data.driveFiles.length > 0) {
              const successLength = actionData.data.driveFiles.length
              toast.success(`${successLength}件${executeText}`)
            } else {
              toast.error(`${errorText1}`)
            }
          }
          if (actionData?.data && "errorFiles" in actionData.data) {
            actionData.data.errorFiles?.forEach((f) => {
              toast.error(`${f.name}: ${errorText2}`)
            })
          }
          break
        }
        case "undo": {
          if (actionData?.data && "driveFiles" in actionData.data) {
            if (actionData.data.driveFiles.length > 0) {
              const successLength = actionData.data.driveFiles.length
              toast.success(`${successLength}件のファイルを元に戻しました。`)
            } else {
              toast.error(`${errorText1}`)
            }
          } else {
            toast.success(`ファイルを元に戻しました。`)
          }
          break
        }
      }
    }
  }, [actionData?.error, actionData?.ok, actionData?._action, actionData?.data])
}
