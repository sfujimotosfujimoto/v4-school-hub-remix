import type { drive_v3 } from "googleapis"
import { CHUNK_SIZE } from "~/lib/config"
import { getDrive } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { arrayIntoChunks, getIdFromUrl } from "~/lib/utils"
import { logger } from "~/logger"

import type { DriveFile } from "~/types"

export async function undoMoveDataExecute(
  request: Request,
  driveFiles: DriveFile[],
) {
  logger.debug("✅ in undoMoveDataExecute")

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

    const file = await drive.files.update({
      fileId: d.id,
      addParents: folderId,
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
