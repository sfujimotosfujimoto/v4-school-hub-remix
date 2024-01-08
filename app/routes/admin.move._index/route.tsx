import type { Role } from "@prisma/client"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useActionData, useLoaderData } from "@remix-run/react"
import { z } from "zod"
import TaskCards from "~/components/ui/tasks/task-cards"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useRawToDriveFilesContext } from "~/hooks/useRawToDriveFilesContext"
import { useToast } from "~/hooks/useToast"
import { requireAdminRole } from "~/lib/require-roles.server"
import { logger } from "~/logger"
import type { ActionTypeGoogle } from "~/type.d"
import { executeAction } from "./actions/execute"
import { searchAction } from "./actions/search"
import { undoAction } from "./actions/undo"
import { undoCsvAction } from "./actions/undo-csv"
import MoveCards from "./components/move-cards"
import MoveConfirmForm from "./components/move-confirm-form"
import MoveForm from "./components/move-form"
import { getUserFromSession } from "~/lib/session.server"
import { redirectToSignin } from "~/lib/responses"

export const config = {
  // TODO: set maxDuration for production
  maxDuration: 120,
}

/**
 * Loader Function
 * /admin/move
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: admin.move._index ${request.url}`)
  const user = await getUserFromSession(request)
  if (!user || !user.credential) throw redirectToSignin(request)
  await requireAdminRole(request, user)

  return {
    role: user.role,
  }
}

// Zod Data Type
const FormDataScheme = z.object({
  _action: z.string(),
})

/**
 * Action
 * /admin/move
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: admin.move._index ${request.url}`)
  const user = await getUserFromSession(request)
  if (!user || !user.credential) throw redirectToSignin(request)
  await requireAdminRole(request, user)

  const formData = await request.formData()
  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return json<ActionTypeGoogle>(
      { ok: false, type: "move", error: result.error.message },
      { status: 400 },
    )
  }

  let { _action } = result.data

  switch (_action) {
    /*
       SEARCH ACTION
     */
    case "search": {
      return await searchAction(request, formData)
    }

    /**
     * EXECUTE ACTION
     */

    case "execute": {
      logger.debug('✅ action: "execute"')

      return executeAction(request, formData)
    }

    /**
     * UNDO CSV ACTION
     */
    case "undo-csv": {
      logger.debug('✅ action: "undo-csv"')
      // get user
      return await undoCsvAction(request, formData)
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
 * Move Page
 */
export default function MovePage() {
  const { driveFiles, driveFilesDispatch } = useDriveFilesContext()
  const { role } = useLoaderData<{ role: Role }>()

  const actionData = useActionData<ActionTypeGoogle>()

  console.log("✅ admin.move._index/route.tsx ~ 	🌈 actionData ✅ ", actionData)
  // validate raw driveFiles and set to driveFilesContext
  useRawToDriveFilesContext(driveFilesDispatch, actionData)

  useToast(`ファイルを移動しました。`, `ファイルを元に戻しました。`, actionData)

  return (
    <>
      <article
        data-name="admin.move._index"
        className="mx-auto h-full w-full max-w-lg gap-4 rounded-md border-4 border-sfgreen-500 bg-slate-50 p-8 shadow-lg"
      >
        {/* MOVE FORM */}
        <MoveForm />

        {/* MOVE CONFIRM FORM  */}
        <MoveConfirmForm role={role} />
      </article>

      {/* <!-- MOVE CARDS --> */}
      <MoveCards driveFiles={driveFiles} size={"small"} />

      {/* <!-- TASK CARD BLOCK --> */}
      <article className="mx-auto w-full max-w-5xl p-12">
        <h2 className="text-2xl font-bold underline decoration-sfred-200 underline-offset-4">
          💽 履歴データ
        </h2>

        <TaskCards taskType="move" />
      </article>
    </>
  )
}

/**
 * Error Boundary
 */
export function ErrorBoundary() {
  let message = `フォルダからファイルを取得できませんでした。`
  return <ErrorBoundaryDocument message={message} />
}
