import { z } from "zod"
import { getDrive, moveDriveFiles } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { logger } from "~/logger"
import { DriveFilesSchema } from "~/schemas"

import { json, redirect } from "@remix-run/node"

import type { ActionType, DriveFile } from "~/types"
// Zod Data Type
const FormDataScheme = z.object({
  _action: z.string(),
  driveFilesString: z.string().optional(),
})

export async function executeAction(request: Request, formData: FormData) {
  const user = await getUserFromSession(request)
  if (!user || !user.credential)
    throw redirect("/?authstate=unauthenticated", 302)

  // if no user or credential redirect
  if (!user || !user.credential) throw redirect(`/authstate=unauthorized-012`)

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-013")

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`✅ result.error ${result.error.errors.join(",")}`)
    throw json<ActionType>(
      {
        ok: false,
        type: "execute",
        error: `データ処理に問題が発生しました。ERROR#:MOVEEXECUTE-001`,
      },
      { status: 400 },
    )
  }

  let { driveFilesString } = result.data

  const raw = JSON.parse(driveFilesString || "[]")

  const driveFiles = DriveFilesSchema.parse(raw) as DriveFile[]
  if (!driveFiles || driveFiles.length === 0)
    return json<ActionType>({
      ok: false,
      type: "execute",
      error: "ファイルがありません",
    })

  try {
    const drive = await getDrive(user.credential.accessToken)
    if (!drive) throw redirect("/?authstate=unauthorized-014")
    await moveDriveFiles(drive, driveFiles)

    return json<ActionType>({ ok: true, type: "execute" })
  } catch (error: unknown) {
    if (error instanceof Error) return { error: error.message }
    else return { error: "エラーが発生しました。" }
  }
}
