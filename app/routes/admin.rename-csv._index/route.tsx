import React from "react"
import { json, redirect } from "@remix-run/node"
import { useActionData } from "@remix-run/react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { z } from "zod"

import type { ActionType } from "~/types"

// components
import RenameCards from "../admin.rename._index/components/rename-cards"
import RenameCsvForm from "./components/rename-csv-form"
import SourceFolderHeader from "./components/source-folder-header"
import TaskCards from "~/components/ui/tasks/task-cards"

// functions
import { requireAdminRole } from "~/lib/requireRoles.server"
import { executeAction } from "../admin.rename._index/actions/execute"
import { searchRenameAction } from "../admin.rename._index/actions/search"
import { undoAction } from "../admin.rename._index/actions/undo"

// context
import { useRenameCsvPageContext } from "./context/rename-csv-page-context"
import { useDriveFilesContext } from "~/context/drive-files-context"

// hooks
import { useRawToDriveFilesContext } from "~/hooks/useRawToDriveFilesContext"
import { useToast } from "~/hooks/useToast"

/**
 * RenameCsv Page
 */
export default function RenameCsvPage() {
  const { driveFiles, driveFilesDispatch } = useDriveFilesContext()
  const actionData = useActionData<ActionType>()
  const { renameCsvPageDispatch } = useRenameCsvPageContext()

  useRawToDriveFilesContext(driveFilesDispatch, actionData)

  React.useEffect(() => {
    if (!actionData?.data || !("driveFiles" in actionData.data)) return

    renameCsvPageDispatch({
      type: "SET",
      payload: {
        sourceFolder: actionData?.data?.sourceFolder,
      },
    })
  }, [actionData?.data, renameCsvPageDispatch])

  useToast(
    `ファイル名を変更しました。`,
    `ファイル名を元に戻しました。`,
    actionData,
  )

  return (
    <>
      <article
        data-name="admin.rename-csv._index"
        className="mx-auto h-full w-full max-w-lg gap-4 rounded-md border-4 border-sfgreen-400 bg-slate-50 p-8 shadow-lg"
      >
        {/* FORM */}
        <RenameCsvForm />

        {/* Rename CONFIRM FORM BLOCK */}

        <SourceFolderHeader />
      </article>

      {/* <!-- RenameCsv CARDS --> */}
      {driveFiles && <RenameCards driveFiles={driveFiles} size={"small"} />}

      {/* <!-- ACTION CARD BLOCK --> */}
      <article className="mx-auto w-full max-w-5xl p-12">
        <h2 className="text-2xl font-bold underline decoration-sfred-200 underline-offset-4">
          💽 履歴データ
        </h2>

        {/* <!-- TASK CARDS --> */}
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
    return json({ ok: false, error: result.error.message }, { status: 400 })
  }

  let { _action } = result.data

  switch (_action) {
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
