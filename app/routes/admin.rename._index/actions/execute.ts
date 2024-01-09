import { z } from "zod"
import { getDrive } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { logger } from "~/logger"
// import { DriveFilesRenameSchema } from "~/schemas"

import { json, redirect } from "@remix-run/node"

import type { ActionTypeGoogle, DriveFile } from "~/types"
import type { drive_v3 } from "googleapis"
import { arrayIntoChunks } from "~/lib/utils"
import { CHUNK_SIZE } from "~/lib/config"
import { convertDriveFiles } from "~/lib/utils-loader"
import { redirectToSignin } from "~/lib/responses"
import { requireAdminRole } from "~/lib/require-roles.server"

// Zod Data Type
const FormDataScheme = z.object({
  _action: z.string(),
  driveFilesString: z.string().optional(),
})

/**
 * Rename executeAction
 */
export async function executeAction(request: Request, formData: FormData) {
  logger.debug(`🍎 rename: executeAction()`)
  const user = await getUserFromSession(request)
  if (!user || !user.credential) throw redirectToSignin(request)
  await requireAdminRole(request, user)

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirectToSignin(request)

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`✅ result.error ${result.error.errors}`)
    throw json<ActionTypeGoogle>(
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
  const driveFiles = convertDriveFiles(raw)

  // const driveFiles = DriveFilesRenameSchema.parse(raw) as DriveFile[]
  if (!driveFiles || driveFiles.length === 0)
    return json<ActionTypeGoogle>({
      ok: false,
      type: "error",
      error: "ファイルがありません",
    })

  try {
    const drive = await getDrive(user.credential.accessToken)
    if (!drive) throw redirect("/?authstate=unauthorized-rename-014")
    const files = await renameDriveFiles(drive, driveFiles)
    return json<ActionTypeGoogle>({
      ok: true,
      type: "execute",
      data: { files },
    })
  } catch (error: unknown) {
    if (error instanceof Error) return { error: error.message }
    else
      return json<ActionTypeGoogle>({
        ok: false,
        type: "error",
        error: "エラーが発生しました。",
      })
  }
}

export async function renameDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
): Promise<drive_v3.Schema$File[]> {
  logger.debug(`✅ renameDriveFiles: ${driveFiles.length} files total`)
  const driveFilesChunks = arrayIntoChunks<DriveFile>(driveFiles, CHUNK_SIZE)

  const promises = driveFilesChunks.map((dfs, idx) => {
    return _renameDriveFiles(drive, dfs, idx)
  })

  const files = await Promise.all([...promises])
  const newFiles = files.filter((d): d is drive_v3.Schema$File[] => d !== null)
  const newFilesFlat = newFiles.flat()
  logger.debug(`Finished renaming: ${newFilesFlat.length} files`)
  return newFilesFlat
}

export async function _renameDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
  idx: number,
) {
  // @note Before, you didn't have to make a copy of the array
  // Why do you have to create a copy now?
  const dfs = [...driveFiles]

  const files: drive_v3.Schema$File[] = []
  const errors: string[] = []

  for (let i = 0; i < dfs.length; i++) {
    const d = dfs[i]

    if (!d.meta?.file?.name || !d.id) {
      errors.push(`error: ${d.id}: ${d.name}`)
      continue
    }

    if (d.meta.file?.name) {
      const file = await drive.files.update({
        fileId: d.id,
        requestBody: {
          name: d.meta.file?.name,
        },
      })
      files.push(file.data)
      logger.debug(
        `renameDriveFiles: ${d.meta.file.name}, idx:${i} of chunk: ${idx}`,
      )
    } else {
      errors.push(`error: ${d.id}: ${d.meta?.file?.name}`)
      continue
    }
  }
  logger.debug(
    `renameDriveFiles -- finished: ${files.length} files renamed of chunk: ${idx}`,
  )

  if (errors.length > 0) {
    logger.debug(
      `renameDriveFiles -- chunk ${idx} errors: \n${errors.join("\n")}`,
    )
  }
  return files
}

//---------------------------------------------------------

// export async function undoRenameDriveFiles(
//   drive: drive_v3.Drive,
//   driveFiles: DriveFile[],
// ): Promise<drive_v3.Schema$File[]> {
//   const driveFilesChunks = arrayIntoChunks(driveFiles, CHUNK_SIZE)

//   const promises = driveFilesChunks.map((dfs) =>
//     _undoRenameDriveFiles(drive, dfs),
//   )

//   const files = await Promise.all([...promises])
//   const newFiles = files.filter((d): d is drive_v3.Schema$File[] => d !== null)
//   return newFiles.flat()
// }

// export async function _undoRenameDriveFiles(
//   drive: drive_v3.Drive,
//   driveFiles: DriveFile[],
// ) {
//   const files: drive_v3.Schema$File[] = []
//   for (let i = 0; i < driveFiles.length; i++) {
//     const d = driveFiles[i]

//     if (!d.meta?.file?.name || !d.id) return

//     if (d.meta.file?.name) {
//       const file = await drive.files.update({
//         fileId: d.id,
//         requestBody: {
//           name: d.meta.file?.formerName,
//         },
//       })
//       files.push(file.data)
//     }
//     logger.debug(`undoRenameDriveFiles: ${d.meta.file.formerName}, idx:${i}`)
//   }

//   logger.debug(
//     `undoRenameDriveFiles -- finished: ${files.length} files renamed`,
//   )
//   return files
// }
