import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useActionData } from "@remix-run/react"
import { z } from "zod"
import RenameCards from "~/routes/admin.rename._index/rename-cards"
import RenameConfirmForm from "~/routes/admin.rename._index/rename-confirm-form"
import RenameForm from "~/routes/admin.rename._index/rename-form"
import TaskCards from "~/components/ui/tasks/task-cards"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useRawToDriveFilesContext } from "~/hooks/useRawToDriveFilesContext"
import { useToast } from "~/hooks/useToast"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { logger } from "~/logger"
import type { ActionTypeGoogle } from "~/types"
import { undoAction2 } from "~/lib/admin/rename2/_index/actions/undo"
import { executeAction2 } from "~/lib/admin/rename2/_index/actions/execute"
import { searchRenameAction2 } from "~/lib/admin/rename2/_index/actions/search"

export const config = {
  maxDuration: 60,
}

/**
 * Loader Function
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: admin.rename2._index ${request.url}`)
  await getUserFromSessionOrRedirect(request)

  return null
}

/**
 * Action Function
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: admin.rename2._index ${request.url}`)

  // Zod Data Type
  const FormDataScheme = z.object({
    intent: z.string(),
  })
  const formData = await request.formData()
  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return json<ActionTypeGoogle>(
      {
        intent: "execute",
        ok: false,
        type: "rename",
        error: result.error.message,
      },
      { status: 400 },
    )
  }

  let { intent } = result.data

  switch (intent) {
    /*
       SEARCH ACTION
     */
    case "search": {
      return await searchRenameAction2(request, formData)
    }

    /**
     * EXECUTE ACTION
     */
    case "execute": {
      logger.debug('✅ action: "execute"')
      return executeAction2(request, formData)
    }

    /**
     * UNDO ACTION
     */
    case "undo": {
      logger.debug('✅ action: "undo"')
      return await undoAction2(request, formData)
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

  useToast(actionData)

  return (
    <>
      <article
        data-name="admin.rename._index"
        className="mx-auto h-full w-full max-w-lg gap-4 rounded-md border-4 border-sfgreen-500 bg-slate-50 p-8 shadow-lg"
      >
        RENAME2
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
