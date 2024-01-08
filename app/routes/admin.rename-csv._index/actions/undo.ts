import { json, redirect } from "@remix-run/node"
import toast from "react-hot-toast"
import { z } from "zod"
import { getDrive } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { convertDriveFiles } from "~/lib/utils-loader"
import { logger } from "~/logger"
import { undoRenameDataExecute } from "~/routes/admin.rename._index/actions/undo"
import type { ActionTypeGoogle } from "~/type.d"

const FormDataScheme = z.object({
  driveFilesSerialized: z.string().optional(),
})

export async function undoAction(request: Request, formData: FormData) {
  logger.debug("🍎 rename-csv: undoAction()")
  // get user
  const user = await getUserFromSession(request)
  if (!user || !user.credential)
    throw redirect("/?authstate=unauthenticated", 302)

  // if no user or credential redirect
  if (!user || !user.credential)
    throw redirect(`/authstate=unauthorized-renameundo-019`)

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-renameundo-020")

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
      type: "undo",
      error: "ファイルがありません",
    })

  // 23/11/05/(Sun) 23:29:33  ----------------------
  const res = await undoRenameDataExecute(request, driveFiles)

  if (res.error) {
    toast.error(res.error)
    return json<ActionTypeGoogle>({ ok: false, type: "undo", error: res.error })
  }

  toast.success("元に戻しました")
  return redirect(`/admin/rename`)
}
