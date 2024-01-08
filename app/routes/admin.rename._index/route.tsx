import { z } from "zod"
import { json } from "@remix-run/node"
import { useActionData } from "@remix-run/react"

import { logger } from "~/logger"

//update
// types
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import type { ActionTypeGoogle } from "~/type.d"

// components
import RenameCards from "./components/rename-cards"
import RenameConfirmForm from "./components/rename-confirm-form"
import RenameForm from "./components/rename-form"
import TaskCards from "~/components/ui/tasks/task-cards"

// functions
import { executeAction } from "./actions/execute"
import { searchRenameAction } from "./actions/search"
import { undoAction } from "./actions/undo"
import { requireAdminRole } from "~/lib/require-roles.server"

// context
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useRawToDriveFilesContext } from "~/hooks/useRawToDriveFilesContext"

// hooks
import { useToast } from "~/hooks/useToast"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import { redirectToSignin } from "~/lib/responses"
import { getUserFromSession } from "~/lib/session.server"

export const config = {
  maxDuration: 60,
}

/**
 * Loader Function
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: admin.rename._index ${request.url}`)
  const user = await getUserFromSession(request)
  if (!user || !user.credential) throw redirectToSignin(request)

  return null
}

// export type RenameActionType = {
//   ok: boolean
//   type: string
//   error?: string
//   data?:
//     | {
//         sourceFolder?: drive_v3.Schema$File
//         driveFiles: { [key: string]: any }[]
//       }
//     | {
//         files: drive_v3.Schema$File[]
//       }
// }

/**
 * Action Function
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: admin.rename._index ${request.url}`)

  const user = await getUserFromSession(request)
  if (!user || !user.credential) throw redirectToSignin(request)
  await requireAdminRole(request, user)

  // Zod Data Type
  const FormDataScheme = z.object({
    _action: z.string(),
  })
  const formData = await request.formData()
  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return json<ActionTypeGoogle>(
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

    /**
     * EXECUTE ACTION
     */
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

/**
 * Rename Page
 */
export default function RenamePage() {
  const { driveFiles, driveFilesDispatch } = useDriveFilesContext()
  const actionData = useActionData<ActionTypeGoogle>()

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
        className="mx-auto h-full w-full max-w-lg gap-4 rounded-md border-4 border-sfgreen-500 bg-slate-50 p-8 shadow-lg"
      >
        {/* FORM */}
        <RenameForm />

        {/* CONFIRM FORM  */}
        <RenameConfirmForm />
      </article>

      {/* <!-- CARDS --> */}
      <RenameCards driveFiles={driveFiles} size={"small"} />

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

/**
 * Error Boundary
 */
export function ErrorBoundary() {
  return (
    <ErrorBoundaryDocument message="フォルダからファイルを取得できませんでした。" />
  )
}
