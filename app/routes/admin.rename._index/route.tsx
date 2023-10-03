import { z } from "zod"
import { json, redirect } from "@remix-run/node"
import { useActionData } from "@remix-run/react"

import { logger } from "~/logger"

// types
import type { drive_v3 } from "googleapis"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import type { DriveFile } from "~/types"

// components
import RenameCards from "./components/rename-cards"
import RenameConfirmForm from "./components/rename-confirm-form"
import RenameForm from "./components/rename-form"
import TaskCards from "~/components/ui/tasks/task-cards"

// functions
import { executeAction } from "./actions/execute"
import { searchRenameAction } from "./actions/search"
import { undoAction } from "./actions/undo"
import { requireAdminRole } from "~/lib/requireRoles.server"

// context
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useRawToDriveFilesContext } from "~/hooks/useRawToDriveFilesContext"

// hooks
import { useToast } from "~/hooks/useToast"

/**
 * Rename Page
 */
export default function RenamePage() {
  const { driveFiles, driveFilesDispatch } = useDriveFilesContext()
  const actionData = useActionData<ActionType>()

  useRawToDriveFilesContext(driveFilesDispatch, actionData)

  useToast(
    `ファイル名を変更しました。`,
    `ファイル名を元に戻しました。`,
    actionData,
  )

  return (
    <>
      <article
        data-name="admin.rename._index"
        className="mx-auto h-full w-full max-w-lg gap-4 rounded-md border-4 border-sfgreen-400 bg-slate-50 p-8 shadow-lg"
      >
        {/* FORM */}
        <RenameForm />

        {/* CONFIRM FORM  */}
        <RenameConfirmForm />
      </article>

      {/* <!-- CARDS --> */}
      {driveFiles && <RenameCards driveFiles={driveFiles} size={"small"} />}

      {/* <!-- TASK CARD BLOCK --> */}
      <article className="mx-auto w-full max-w-5xl p-12">
        <h2 className="text-2xl font-bold underline decoration-sfred-200 underline-offset-4">
          💽 履歴データ
        </h2>

        <TaskCards taskType="rename" />
      </article>
    </>
  )
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { user, error } = await requireAdminRole(request)
  if (!user || !user.credential || error)
    throw redirect("/?authstate=unauthenticated-rename-001")
  // const { folderId } = params

  return null
}

export type ActionType = {
  ok: boolean
  type: string
  error?: string
  data?:
    | {
        sourceFolder: drive_v3.Schema$File
        driveFiles: DriveFile[]
      }
    | {
        files: drive_v3.Schema$File[]
      }
}

// Zod Data Type
const FormDataScheme = z.object({
  _action: z.string(),
})

/**
 * Action
 */
export async function action({ request }: ActionFunctionArgs) {
  const { user, error } = await requireAdminRole(request)
  if (!user || !user.credential || error)
    throw redirect("/?authstate=unauthenticated")

  const formData = await request.formData()
  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return json<ActionType>(
      { ok: false, type: "rename", error: result.error.message },
      { status: 400 },
    )
  }

  let { _action } = result.data

  switch (_action) {
    /*
       SEARCH ACTION
     */
    case "search": {
      return await searchRenameAction(request, formData)
    }

    // /**
    //  * EXECUTE ACTION
    //  */

    case "execute": {
      logger.debug('✅ action: "execute"')
      return await executeAction(request, formData)
    }

    /**
     * UNDO ACTION
     */
    case "undo": {
      logger.debug('✅ action: "undo"')
      return await undoAction(request, formData)
    }

    default:
      break
  }
}
