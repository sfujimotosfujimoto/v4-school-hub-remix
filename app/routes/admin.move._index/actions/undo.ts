import { z } from "zod"
import { getDrive, mapFilesToDriveFiles } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { logger } from "~/logger"
// import { DriveFilesSchema } from "~/schemas"

import { json, redirect } from "@remix-run/node"

import type { ActionTypeGoogle, DriveFile } from "~/type.d"
import { CHUNK_SIZE, QUERY_FILE_FIELDS } from "~/lib/config"
import { arrayIntoChunks, getIdFromUrl } from "~/lib/utils"
import type { drive_v3 } from "googleapis"
import { convertDriveFiles } from "~/lib/utils-loader"

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
    throw json<ActionTypeGoogle>(
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
  const driveFiles = convertDriveFiles(raw)

  // const result2 = DriveFilesSchema.safeParse(raw)
  // if (!result2.success) {
  //   logger.debug(`✅ result.error ${result2.error.errors.map((e) => e.path)}`)
  //   return json<ActionTypeGoogle>({
  //     ok: false,
  //     type: "undo",
  //     error: `データ処理に問題が発生しました。ERROR#:RENAMEUNDO002`,
  //   })
  // }

  // const driveFiles = result2.data as unknown as DriveFile[]

  if (!driveFiles || driveFiles.length === 0)
    return json<ActionTypeGoogle>({
      ok: false,
      type: "undo",
      error: "ファイルがありません",
    })

  // 23/10/27/(Fri) 18:51:35  ----------------------
  // const undoFunc = getUndoFunction("move")
  // const res = await undoFunc(request, driveFiles)
  const res = await undoMoveDataExecute(request, driveFiles)

  // 23/10/27/(Fri) 12:03:09  ----------------------
  const dfs = mapFilesToDriveFiles(res.data?.files || [])

  if (res.error) {
    return json<ActionTypeGoogle>({ ok: false, type: "undo", error: res.error })
  }

  return json<ActionTypeGoogle>({
    ok: true,
    type: "undo",
    data: {
      driveFiles: dfs,
    },
  })
}

export async function undoMoveDataExecute(
  request: Request,
  driveFiles: DriveFile[],
) {
  logger.debug("✅ undoMoveDataExecute")
  logger.debug(`✅ undoMoveDataExecute -- ${driveFiles.length} files`)

  const user = await getUserFromSession(request)
  if (!user || !user.credential) {
    return { error: "エラーが発生しました。" }
  }
  const accessToken = user.credential.accessToken
  const drive = await getDrive(accessToken)
  if (!drive) {
    return { error: "エラーが発生しました。" }
  }
  try {
    const files = await undoMoveDriveFiles(drive, driveFiles)
    return { data: { files } }
  } catch (error: unknown) {
    if (error instanceof Error) return { error: error.message }
    else return { error: "エラーが発生しました。" }
  }
}

export async function undoMoveDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
): Promise<drive_v3.Schema$File[]> {
  const driveFilesChunks = arrayIntoChunks<DriveFile>(driveFiles, CHUNK_SIZE)

  const promises = driveFilesChunks.map((dfs, idx) =>
    _undoMoveDriveFiles(drive, dfs, idx),
  )

  const files = await Promise.all([...promises])
  const newFiles = files
    .filter((d): d is drive_v3.Schema$File[] => d !== null)
    .flat()
  logger.debug(
    `🦁 undoMoveDriveFiles -- ${newFiles.length} files moved in total.`,
  )
  return newFiles
}

/**

 */
export async function _undoMoveDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
  idx: number,
) {
  const files: drive_v3.Schema$File[] = []
  const errors: string[] = []
  for (let i = 0; i < driveFiles.length; i++) {
    const d = driveFiles[i]

    if (!d.meta?.last?.folderId || !d.id) {
      errors.push(`undoMoveDriveFiles: ${d.id}, idx:${i} -- meta is null`)
      continue
    }

    const folderId = getIdFromUrl(d.meta.last.folderId)
    if (!folderId) {
      errors.push(`undoMoveDriveFiles: ${d.id}, idx:${i} -- folderId is null`)
      continue
    }

    // 23/10/27/(Fri) 12:03:27  ----------------------
    // added `fields` to get the new state of the file
    // in order to get driveFiles for after undoing the move
    const file = await drive.files.update({
      fileId: d.id,
      addParents: folderId,
      fields: QUERY_FILE_FIELDS,
    })
    files.push(file.data)
  }

  logger.debug(
    `🐯 undoMoveDriveFiles -- chunk: ${idx}, finished: ${files.length} files moved`,
  )
  if (errors.length > 0) {
    console.error(`👾 undoMoveDriveFiles -- errors: \n${errors.join("\n")}`)
  }

  return files
}
