import { json, redirect } from "@remix-run/node"
import toast from "react-hot-toast"
import { z } from "zod"
import { errorResponses } from "~/lib/error-responses"
import { getDrive } from "~/lib/google/drive.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { convertDriveFiles } from "~/lib/utils-loader"
import { logger } from "~/logger"
import { undoRenameDataExecute } from "~/routes/admin.rename._index/actions/undo"
import type { ActionTypeGoogle } from "~/types"

const FormDataScheme = z.object({
  driveFilesSerialized: z.string().optional(),
})

export async function undoAction(request: Request, formData: FormData) {
  logger.debug("🍎 rename-csv: undoAction()")
  // get user
  const { credential } = await getUserFromSessionOrRedirect(request)

  const drive = await getDrive(credential.accessToken)
  if (!drive) {
    throw errorResponses.google()
  }

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`✅ result.error ${result.error.errors}`)
    throw json({ error: result.error.errors }, { status: 400 })
  }

  let { driveFilesSerialized } = result.data

  const raw = JSON.parse(driveFilesSerialized || "[]")
  const driveFiles = convertDriveFiles(raw)

  // const driveFiles = DriveFilesSchema.parse(raw) as DriveFile[]
  if (!driveFiles)
    return json<ActionTypeGoogle>({
      ok: false,
      intent: "undo-csv",
      type: "rename",
      error: "ファイルがありません",
    })

  // 23/11/05/(Sun) 23:29:33  ----------------------
  const res = await undoRenameDataExecute(request, driveFiles)

  if (res.error) {
    toast.error(res.error)
    return json<ActionTypeGoogle>({
      ok: false,
      intent: "undo-csv",
      type: "rename",
      error: res.error,
    })
  }

  toast.success("元に戻しました")
  return redirect(`/admin/rename`)
}
