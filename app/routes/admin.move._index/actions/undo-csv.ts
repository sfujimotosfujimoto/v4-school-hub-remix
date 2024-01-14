import { json } from "@remix-run/node"
import toast from "react-hot-toast"
import { z } from "zod"
import { getDrive, mapFilesToDriveFiles } from "~/lib/google/drive.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { logger } from "~/logger"
import type { ActionTypeGoogle, DriveFile } from "~/types"
import { DriveFileMovesSchema } from "~/types/schemas"
import { undoMoveDataExecute } from "./undo"
import { errorResponses } from "~/lib/error-responses"

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
  logger.debug(`✅ formData: ${JSON.stringify(formData, null, 2)}`)
  // get user
  const { credential } = await getUserFromSessionOrRedirect(request)

  const drive = await getDrive(credential.accessToken)
  if (!drive) {
    throw errorResponses.google()
  }

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`✅ result.error ${result.error.errors.join(",")}`)
    throw json<ActionTypeGoogle>(
      {
        _action: "undo-csv",
        ok: false,
        type: "move",
        error: `データ処理に問題が発生しました。ERROR#:MOVEUNDOCSV-001`,
      },
      { status: 400 },
    )
  }

  let { driveFilesString } = result.data

  const raw = JSON.parse(driveFilesString || "[]")

  const result2 = DriveFileMovesSchema.safeParse(raw)
  if (!result2.success) {
    logger.debug(
      `✅ result.error ${result2.error.errors.map((e) => `${e.path}\n`)}`,
    )
    return json<ActionTypeGoogle>({
      ok: false,
      _action: "undo-csv",
      type: "move",
      error: `データ処理に問題が発生しました。ERROR#:RENAMEUNDO002`,
    })
  }

  const driveFiles = result2.data as unknown as DriveFile[]

  // const undoFunc = getUndoFunction("move")
  // const res = await undoFunc(request, driveFiles)
  const res = await undoMoveDataExecute(request, driveFiles)

  if (res.error) {
    toast.error(res.error)
    return json<ActionTypeGoogle>({
      ok: false,
      _action: "undo-csv",
      type: "move",
      error: res.error,
    })
  }

  // 23/10/27/(Fri) 12:03:09  ----------------------
  const dfs = mapFilesToDriveFiles(res.data?.files || [])

  return json<ActionTypeGoogle>({
    ok: true,
    _action: "undo-csv",
    type: "move",
    data: {
      driveFiles: dfs,
    },
  })
}
