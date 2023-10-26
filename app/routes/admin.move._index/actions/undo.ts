import { z } from "zod"
import { getUndoFunction } from "~/context/tasks-context/tasks-context"
import { getDrive } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { logger } from "~/logger"
import { DriveFilesSchema } from "~/schemas"

import { json, redirect } from "@remix-run/node"

import type { ActionType, DriveFile } from "~/types"

const FormDataScheme = z.object({
  driveFilesString: z.string().optional(),
})

export async function undoAction(request: Request, formData: FormData) {
  logger.debug("🍎 move: undoAction()")
  // get user
  const user = await getUserFromSession(request)
  if (!user || !user.credential)
    throw redirect("/?authstate=unauthenticated", 302)

  // if no user or credential redirect
  if (!user || !user.credential) throw redirect(`/authstate=unauthorized-019`)

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-020")

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`✅ result.error ${result.error.errors.join(",")}`)
    throw json<ActionType>(
      {
        ok: false,
        type: "undo",
        error: `データ処理に問題が発生しました。ERROR#:RENAMEUNDO001`,
      },
      { status: 400 },
    )
  }

  let { driveFilesString } = result.data

  const raw = JSON.parse(driveFilesString || "[]")

  const result2 = DriveFilesSchema.safeParse(raw)
  if (!result2.success) {
    logger.debug(`✅ result.error ${result2.error.errors.map((e) => e.path)}`)
    return json<ActionType>({
      ok: false,
      type: "undo",
      error: `データ処理に問題が発生しました。ERROR#:RENAMEUNDO002`,
    })
  }

  const driveFiles = result2.data as unknown as DriveFile[]

  if (!driveFiles)
    return json<ActionType>({
      ok: false,
      type: "undo",
      error: "ファイルがありません",
    })

  const undoFunc = getUndoFunction("move")
  const res = await undoFunc(request, driveFiles)

  if (res.error) {
    return json<ActionType>({ ok: false, type: "undo", error: res.error })
  }

  return json<ActionType>({ ok: true, type: "undo" })
}
