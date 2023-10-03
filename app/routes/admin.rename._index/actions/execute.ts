import { z } from "zod"
import { getDrive } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { logger } from "~/logger"
import { DriveFilesRenameSchema } from "~/schemas"

import { json, redirect } from "@remix-run/node"

import { renameDriveFiles } from "../functions"

import type { DriveFile } from "~/types"
import type { ActionType } from "../route"
// Zod Data Type
const FormDataScheme = z.object({
  _action: z.string(),
  driveFilesString: z.string().optional(),
})

/**
 * executeAction
 */
export async function executeAction(request: Request, formData: FormData) {
  logger.debug(`✅ in executeAction()`)
  const user = await getUserFromSession(request)
  if (!user || !user.credential)
    throw redirect("/?authstate=unauthenticated-rename-001", 302)

  // if no user or credential redirect
  if (!user || !user.credential) throw redirect(`/authstate=unauthorized-012`)

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-rename-013")

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`✅ result.error ${result.error.errors}`)
    throw json<ActionType>(
      {
        ok: false,
        type: "error",
        error: `データ処理に問題が発生しました。ERROR#:RENAMEEXECUTE001`,
      },
      { status: 400 },
    )
  }

  let { driveFilesString } = result.data

  const raw = JSON.parse(driveFilesString || "[]")

  const driveFiles = DriveFilesRenameSchema.parse(raw) as DriveFile[]
  if (!driveFiles || driveFiles.length === 0)
    return json<ActionType>({
      ok: false,
      type: "error",
      error: "ファイルがありません",
    })

  try {
    const drive = await getDrive(user.credential.accessToken)
    if (!drive) throw redirect("/?authstate=unauthorized-rename-014")
    const files = await renameDriveFiles(drive, driveFiles)
    return json<ActionType>({ ok: true, type: "execute", data: { files } })
  } catch (error: unknown) {
    if (error instanceof Error) return { error: error.message }
    else
      return json<ActionType>({
        ok: false,
        type: "error",
        error: "エラーが発生しました。",
      })
  }
}
