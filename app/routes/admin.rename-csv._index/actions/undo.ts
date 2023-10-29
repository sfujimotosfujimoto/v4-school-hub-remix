import toast from "react-hot-toast"
import { z } from "zod"
import { getUndoFunction } from "~/context/tasks-context"
import { getDrive } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { logger } from "~/logger"
import { DriveFilesSchema } from "~/schemas"

import { json, redirect } from "@remix-run/node"

import type { ActionType, DriveFile } from "~/types"

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

  const driveFiles = DriveFilesSchema.parse(raw) as DriveFile[]
  if (!driveFiles)
    return json<ActionType>({
      ok: false,
      type: "undo",
      error: "ファイルがありません",
    })

  const undoFunc = getUndoFunction("rename")
  const res = await undoFunc(request, driveFiles)

  if (res.error) {
    toast.error(res.error)
    return json<ActionType>({ ok: false, type: "undo", error: res.error })
  }

  toast.success("元に戻しました")
  return redirect(`/admin/rename`)
}
