import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useActionData, useNavigation } from "@remix-run/react"
import React from "react"
import { z } from "zod"
import RenameCsvForm from "~/routes/admin.rename-csv._index/rename-csv-form"
import SourceFolderHeader from "~/routes/admin.rename-csv._index/source-folder-header"
import RenameCards from "~/routes/admin.rename._index/rename-cards"
import { useLoadingModal } from "~/components/ui/loading-modal"
import TaskCards from "~/components/ui/tasks/task-cards"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useRawToDriveFilesContext } from "~/hooks/useRawToDriveFilesContext"
import { useToast } from "~/hooks/useToast"
import { useRenameCsvPageContext } from "~/lib/admin/rename-csv/_index/context/rename-csv-page-context"
import { executeAction } from "~/lib/admin/rename/_index/actions/execute"
import { searchRenameAction } from "~/lib/admin/rename/_index/actions/search"
import { undoAction } from "~/lib/admin/rename/_index/actions/undo"
import { requireAdminRole } from "~/lib/require-roles.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { logger } from "~/logger"
import type { ActionTypeGoogle } from "~/types"

export const config = {
  maxDuration: 60,
}

export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: admin.rename-csv._index ${request.url}`)
  const { user } = await getUserFromSessionOrRedirect(request)
  await requireAdminRole(request, user)

  return null
}

// Zod Data Type
const FormDataScheme = z.object({
  intent: z.string(),
})

/**
 * Action
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: admin.rename-csv._index ${request.url}`)
  const { user } = await getUserFromSessionOrRedirect(request)
  await requireAdminRole(request, user)

  const formData = await request.formData()
  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return json({ ok: false, error: result.error.message }, { status: 400 })
  }

  let { intent } = result.data

  switch (intent) {
    /*
       SEARCH ACTION
     */
    case "search": {
      formData.append("gakunen", "")
      formData.append("segment", "")

      return await searchRenameAction(request, formData)
    }

    /**
     * EXECUTE ACTION
     */

    case "execute": {
      return await executeAction(request, formData)
    }

    /**
     * UNDO CSV ACTION
     */
    case "undo": {
      return await undoAction(request, formData)
    }

    default:
      break
  }
}
/**
 * RenameCsv Page
 */
export default function RenameCsvPage() {
  const { driveFiles, driveFilesDispatch } = useDriveFilesContext()
  const actionData = useActionData<ActionTypeGoogle>()
  const { renameCsvPageDispatch } = useRenameCsvPageContext()
  const { state, formData } = useNavigation()
  const isExecuting =
    state === "submitting" &&
    ["execute", "search", "undo"].includes(String(formData?.get("intent")))
  useRawToDriveFilesContext(driveFilesDispatch, actionData)
  // validate raw driveFiles and set to driveFilesContext

  React.useEffect(() => {
    if (!actionData?.data || !("driveFiles" in actionData.data)) return

    if (!actionData?.data?.sourceFolder) return

    renameCsvPageDispatch({
      type: "SET",
      payload: {
        sourceFolder: actionData?.data?.sourceFolder,
      },
    })
  }, [actionData?.data, renameCsvPageDispatch])

  useToast(actionData)

  useLoadingModal(isExecuting)

  return (
    <>
      <article
        data-name="admin.rename-csv._index"
        className="w-full h-full max-w-lg gap-4 p-8 mx-auto border-4 rounded-md shadow-lg border-sfgreen-400 bg-slate-50"
      >
        {/* FORM */}
        <RenameCsvForm />

        {/* Rename CONFIRM FORM BLOCK */}

        <SourceFolderHeader />
      </article>

      {/* <!-- RenameCsv CARDS --> */}
      {driveFiles && <RenameCards driveFiles={driveFiles} size={"small"} />}

      {/* <!-- ACTION CARD BLOCK --> */}
      <article className="w-full max-w-5xl p-12 mx-auto">
        <h2 className="text-2xl font-bold underline decoration-sfred-200 underline-offset-4">
          💽 履歴データ
        </h2>

        {/* <!-- TASK CARDS --> */}
        <TaskCards taskType="rename" />
      </article>
    </>
  )
}
