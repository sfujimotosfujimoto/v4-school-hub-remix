import { z } from "zod"
import { getDrive, mapFilesToDriveFiles } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { logger } from "~/logger"
import { DriveFilesSchema } from "~/schemas"

import { json, redirect } from "@remix-run/node"

import type { ActionType, DriveFile, User } from "~/types"
import { CHUNK_SIZE } from "~/lib/config"
import { arrayIntoChunks } from "~/lib/utils"
import type { drive_v3 } from "googleapis"

const FormDataScheme = z.object({
  driveFilesString: z.string().optional(),
})

export async function deleteUndoAction(request: Request, formData: FormData) {
  logger.debug("🍎 delte: deleteUndoAction()")

  // get user
  const user = await getUserFromSession(request)
  if (!user || !user.credential)
    throw redirect("/?authstate=unauthenticated", 302)

  // if no user or credential redirect
  if (!user || !user.credential) throw redirect(`/authstate=unauthorized-031`)

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-030")

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`✅ result.error ${result.error.errors.join(",")}`)
    throw json<ActionType>(
      {
        ok: false,
        type: "undo",
        error: `データ処理に問題が発生しました。ERROR#:DELETEUNDO001`,
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
      error: `データ処理に問題が発生しました。ERROR#:DELETEUNDO002`,
    })
  }

  const driveFiles = result2.data as unknown as DriveFile[]

  if (!driveFiles || driveFiles.length === 0)
    return json<ActionType>({
      ok: false,
      type: "undo",
      error: "ファイルがありません",
    })

  // 23/10/27/(Fri) 18:51:35  ----------------------
  // const undoFunc = getUndoFunction("move")
  // const res = await undoFunc(request, driveFiles)
  const res = await undoDeleteExecute(user, driveFiles)

  // 23/10/27/(Fri) 12:03:09  ----------------------
  const dfs = mapFilesToDriveFiles(res.data?.files || [])

  if (res.error) {
    return json<ActionType>({ ok: false, type: "undo", error: res.error })
  }

  return json<ActionType>({
    ok: true,
    type: "undo",
    data: {
      driveFiles: dfs,
    },
  })
}

export async function undoDeleteExecute(user: User, driveFiles: DriveFile[]) {
  logger.debug(`✅ undoDeleteExecute -- ${driveFiles.length} files`)

  if (!user || !user.credential) {
    return { error: "エラーが発生しました。" }
  }
  const accessToken = user.credential.accessToken
  const drive = await getDrive(accessToken)
  if (!drive) {
    return { error: "エラーが発生しました。" }
  }
  try {
    const files = await undoDeleteDriveFiles(drive, driveFiles)
    return { data: { files } }
  } catch (error: unknown) {
    if (error instanceof Error) return { error: error.message }
    else return { error: "エラーが発生しました。" }
  }
}

export async function undoDeleteDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
): Promise<drive_v3.Schema$File[]> {
  const driveFilesChunks = arrayIntoChunks<DriveFile>(driveFiles, CHUNK_SIZE)

  logger.debug(`✅ undoDeleteDriveFiles -- ${driveFilesChunks.length} chunks`)
  const promises = driveFilesChunks.map((dfs, idx) =>
    _undoDeleteDriveFiles(drive, dfs, idx),
  )

  const files = await Promise.all([...promises])
  const newFiles = files
    .filter((d): d is drive_v3.Schema$File[] => d !== null)
    .flat()
  logger.debug(
    `🦁 undoDeleteDriveFiles -- ${newFiles.length} files deleted in total.`,
  )
  return newFiles
}

/**

 */
export async function _undoDeleteDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
  idx: number,
) {
  logger.debug(
    `✅ _undoDeleteDriveFiles -- chunk: ${idx}, driveFiles: ${driveFiles.length}`,
  )
  const files: drive_v3.Schema$File[] = []
  const errors: string[] = []
  for (let i = 0; i < driveFiles.length; i++) {
    const d = driveFiles[i]

    if (!d.id) {
      errors.push(`undoDeleteDriveFiles: ${d.id}, idx:${i}`)
      continue
    }

    try {
      const file = await drive.files.update({
        fileId: d.id,
        requestBody: {
          trashed: false,
        },
      })
      files.push(file.data)
    } catch (error) {}
  }

  logger.debug(
    `🐯 undoDeleteDriveFiles -- chunk: ${idx}, finished: ${files.length} files deleted`,
  )
  if (errors.length > 0) {
    console.error(`👾 undoDeleteDriveFiles -- errors: \n${errors.join("\n")}`)
  }

  return files
}