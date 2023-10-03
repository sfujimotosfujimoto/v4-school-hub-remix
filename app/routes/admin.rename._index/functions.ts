import type { drive_v3 } from "googleapis"
import { CHUNK_SIZE } from "~/lib/config"
import { arrayIntoChunks } from "~/lib/utils"
import { logger } from "~/logger"

import type { DriveFile } from "~/types"

export async function renameDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
): Promise<drive_v3.Schema$File[]> {
  logger.debug(`✅ in renameDriveFiles: ${driveFiles.length} files total`)
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

async function _renameDriveFiles(
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

export async function undoRenameDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
): Promise<drive_v3.Schema$File[]> {
  const driveFilesChunks = arrayIntoChunks(driveFiles, CHUNK_SIZE)

  const promises = driveFilesChunks.map((dfs) =>
    _undoRenameDriveFiles(drive, dfs),
  )

  const files = await Promise.all([...promises])
  const newFiles = files.filter((d): d is drive_v3.Schema$File[] => d !== null)
  return newFiles.flat()
}

export async function _undoRenameDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
) {
  const files: drive_v3.Schema$File[] = []
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
    logger.debug(`undoRenameDriveFiles: ${d.meta.file.formerName}, idx:${i}`)
  }

  logger.debug(
    `undoRenameDriveFiles -- finished: ${files.length} files renamed`,
  )
  return files
}
