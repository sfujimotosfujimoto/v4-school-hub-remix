import toast from "react-hot-toast"
import { z } from "zod"
import { getDrive, mapFilesToDriveFiles } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { logger } from "~/logger"
import { DriveFilesSchema } from "~/schemas"

import { json, redirect } from "@remix-run/node"

import type { ActionType, DriveFile } from "~/types"
import { undoMoveDataExecute } from "./undo"

const FormDataScheme = z.object({
  driveFilesString: z.string().optional(),
})

/**
 * Undo CSV Action
 */
export async function undoCsvAction(
  request: Request,
  formData: FormData,
  // dataString?: string
) {
  logger.debug("🍎 move: undoCsvAction()")
  // get user
  const user = await getUserFromSession(request)
  if (!user || !user.credential)
    throw redirect("/?authstate=unauthenticated", 302)

  // if no user or credential redirect
  if (!user || !user.credential) throw redirect(`/authstate=unauthorized-17`)

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-018")

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`✅ result.error ${result.error.errors.join(",")}`)
    throw json<ActionType>(
      {
        ok: false,
        type: "undo-csv",
        error: `データ処理に問題が発生しました。ERROR#:MOVEUNDOCSV-001`,
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
  // const undoFunc = getUndoFunction("move")
  // const res = await undoFunc(request, driveFiles)
  const res = await undoMoveDataExecute(request, driveFiles)

  if (res.error) {
    toast.error(res.error)
    return json<ActionType>({ ok: false, type: "undo-csv", error: res.error })
  }

  // 23/10/27/(Fri) 12:03:09  ----------------------
  const dfs = mapFilesToDriveFiles(res.data?.files || [])

  return json<ActionType>({
    ok: true,
    type: "undo-csv",
    data: {
      driveFiles: dfs,
    },
  })
}
