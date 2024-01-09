import { json } from "@remix-run/node"
import type { drive_v3 } from "googleapis"
import { z } from "zod"
import { CHUNK_SIZE, QUERY_FILE_FIELDS } from "~/lib/config"
import { getDrive, mapFilesToDriveFiles } from "~/lib/google/drive.server"
import { requireAdminRole } from "~/lib/require-roles.server"
import { redirectToSignin } from "~/lib/responses"
import { getUserFromSession } from "~/lib/session.server"
import { arrayIntoChunks } from "~/lib/utils"
import { convertDriveFiles } from "~/lib/utils-loader"
import { logger } from "~/logger"
import type { ActionTypeGoogle, DriveFile } from "~/types"

const FormDataScheme = z.object({
  driveFilesString: z.string().optional(),
})

export async function undoAction(request: Request, formData: FormData) {
  logger.debug(`🍎 rename: undoAction()`)
  // get user
  const user = await getUserFromSession(request)
  if (!user || !user.credential) throw redirectToSignin(request)
  await requireAdminRole(request, user)

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirectToSignin(request)

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

  // for (const df of driveFiles) {
  //   df.parents = [""]
  //   df.appProperties = {}
  // }

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

  // logger.debug(`✅ driveFiles: ${JSON.stringify(driveFiles, null, 2)}`)

  if (!driveFiles)
    return json<ActionTypeGoogle>({
      ok: false,
      type: "error",
      error: "ファイルがありません",
    })

  logger.debug(`✅ in undoAction: driveFiles.length ${driveFiles.length}`)

  // 23/10/27/(Fri) 18:51:49  ----------------------
  const res = await undoRenameDataExecute(request, driveFiles)

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

/**
 * UNDO RENAME
 */
export async function undoRenameDataExecute(
  request: Request,
  driveFiles: DriveFile[],
) {
  logger.debug(`✅ in undoRenameDataExecute: ${driveFiles.length}`)

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
    const files = await undoRenameDriveFiles(drive, driveFiles)
    return { data: { files } }
  } catch (error: unknown) {
    if (error instanceof Error) return { error: error.message }
    else return { error: "エラーが発生しました。" }
  }
}

export async function undoRenameDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
): Promise<drive_v3.Schema$File[]> {
  const driveFilesChunks = arrayIntoChunks<DriveFile>(driveFiles, CHUNK_SIZE)

  const promises = driveFilesChunks.map((dfs, idx) =>
    _undoRenameDriveFiles(drive, dfs, idx),
  )

  const files = await Promise.all([...promises])
  const newFiles = files
    .filter((d): d is drive_v3.Schema$File[] => d !== null)
    .flat()
  logger.debug(
    `🦁 undoRenameDriveFiles -- ${newFiles.length} files renamed in total.`,
  )
  return newFiles
}

/**
 */
export async function _undoRenameDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
  idx: number,
) {
  const files: drive_v3.Schema$File[] = []
  const errors: string[] = []
  for (let i = 0; i < driveFiles.length; i++) {
    const d = driveFiles[i]

    if (!d.meta?.file?.name || !d.id) return

    if (d.meta.file?.name) {
      const file = await drive.files.update({
        fileId: d.id,
        fields: QUERY_FILE_FIELDS,
        requestBody: {
          name: d.meta.file?.formerName,
        },
      })
      files.push(file.data)
    }
  }

  logger.debug(
    `🐯 undoRenameDriveFiles -- chunk: ${idx}, finished: ${files.length} files moved`,
  )
  if (errors.length > 0) {
    console.error(`👾 undoRenameDriveFiles -- errors: \n${errors.join("\n")}`)
  }

  return files
}
