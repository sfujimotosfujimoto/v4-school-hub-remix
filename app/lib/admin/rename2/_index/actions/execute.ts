import { json } from "@remix-run/node"
import { GaxiosError } from "gaxios"
import type { drive_v3 } from "googleapis"
import { z } from "zod"
// import { CHUNK_SIZE } from "~/config"
import { errorResponses } from "~/lib/error-responses"
import { getDrive } from "~/lib/google/drive.server"
import { requireAdminRole } from "~/lib/require-roles.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { parseDateToString } from "~/lib/utils.server"
import { parseAppProperties } from "~/lib/utils/utils"
import { convertDriveFiles } from "~/lib/utils/utils-loader"
import { logger } from "~/logger"
import type { ActionTypeGoogle, DriveFile, User } from "~/types"

const WEB_HOOK_URL = "https://spotty-streets-smash.loca.l"

// Zod Data Type
const FormDataScheme = z.object({
  intent: z.string(),
  driveFilesString: z.string().optional(),
})

/**
 * Rename executeAction
 */
export async function executeAction2(request: Request, formData: FormData) {
  logger.debug(`🍎 rename: executeAction2()`)
  const { user, credential } = await getUserFromSessionOrRedirect(request)
  await requireAdminRole(request, user)

  const drive = await getDrive(credential.accessToken)

  if (!drive) {
    throw errorResponses.google()
  }

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`✅ result.error ${result.error.errors}`)
    throw json<ActionTypeGoogle>(
      {
        ok: false,
        intent: "execute",
        type: "rename",
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
      intent: "execute",
      type: "rename",
      error: "ファイルがありません",
    })

  try {
    const drive = await getDrive(credential.accessToken)
    if (!drive) {
      throw errorResponses.google()
    }

    // make a copy of the array because renameDriveFiles mutates the array
    const dfz = [...driveFiles]
    renameDriveFiles(drive, dfz, user)

    // from the successFiles, get the files that were actually moved
    // from the original array of files
    // because the original data has "meta" data in them
    // and we need the data for undo task data
    let successFiles: DriveFile[] = []

    return json<ActionTypeGoogle>({
      ok: true,
      intent: "execute",
      type: "rename",
      data: {
        driveFiles: successFiles,
        errorFiles: [],
        // errorFiles: mapFilesToDriveFiles(res.errorFiles),
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error) return { error: error.message }
    else
      return json<ActionTypeGoogle>({
        ok: false,
        intent: "execute",
        type: "rename",
        error: "エラーが発生しました。",
      })
  }
}

export async function renameDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
  user: User,
) {
  logger.debug(`✅ renameDriveFiles: ${driveFiles.length} files total`)
  logger.debug(`✅ renameDriveFiles: ${driveFiles[0].name}`)

  const channelIds: string[] = []
  for (let i = 0; i < driveFiles.length; i++) {
    const d = {
      ...driveFiles[i],
      appProperties: parseAppProperties(driveFiles[i].appProperties || "[]"),
      createdTime: parseDateToString(driveFiles[i]?.createdTime),
      modifiedTime: parseDateToString(driveFiles[i]?.modifiedTime),
    }

    try {
      if (!d.meta?.file?.name || !d.id) {
        continue
      }

      if (d.meta.file?.name) {
        drive.files.update({
          fileId: d.id,
          requestBody: {
            name: d.meta.file?.name,
          },
        })

        const channelId = `file-move-sub-${d.id}`
        channelIds.push(channelId)
        await fetch(`https://www.googleapis.com/drive/v3/files/${d.id}/watch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + user.credential?.accessToken,
          },
          body: JSON.stringify({
            id: channelId,
            type: "web_hook",
            address: `${WEB_HOOK_URL}/webhook`,
            kind: "api#channel",
            token: `fileId=${d.id}`,
            // @todo actions/execute.ts: !! TIME !!
            expiration: Date.now() + 1000 * 60 * 3, // 1 minutes
          }),
        })
          .then((res) => res.json())
          .catch((err) => console.log(err))
      }
    } catch (error) {
      console.error("renameDriveFiles ~ error", error)
      continue
    }
  }
}
// const driveFilesChunks = arrayIntoChunks<DriveFile>(driveFiles, CHUNK_SIZE)

// const promises = driveFilesChunks.map((dfs, idx) => {
//   return _renameDriveFiles(drive, dfs, idx)
// })

// const files = await Promise.all([...promises])
// const newFiles = files.filter((d): d is ActionResponse => d !== null)

// const successFiles = flatFiles(newFiles, "successFiles")
// const errorFiles = flatFiles(newFiles, "errorFiles")
// logger.debug(`Finished renaming: ${successFiles.length} files`)
// logger.debug(`Errored renaming: ${errorFiles.length} files`)

// return { successFiles, errorFiles }

export async function _renameDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
  idx: number,
) {
  // @note Before, you didn't have to make a copy of the array
  // Why do you have to create a copy now?
  const dfs = [...driveFiles]
  const successFiles: drive_v3.Schema$File[] = []
  const errorFiles: drive_v3.Schema$File[] = []
  const errors: string[] = []

  for (let i = 0; i < dfs.length; i++) {
    const d = {
      ...dfs[i],
      appProperties: parseAppProperties(dfs[i].appProperties || "[]"),
      createdTime: parseDateToString(dfs[i]?.createdTime),
      modifiedTime: parseDateToString(dfs[i]?.modifiedTime),
    }

    try {
      if (!d.meta?.file?.name || !d.id) {
        errors.push(`error: ${d.id}: ${d.name}`)
        errorFiles.push(d)
        continue
      }

      if (d.meta.file?.name) {
        const file = await drive.files.update({
          fileId: d.id,
          requestBody: {
            name: d.meta.file?.name,
          },
        })
        successFiles.push(file.data)
        logger.debug(
          `renameDriveFiles: ${d.meta.file.name}, idx:${i} of chunk: ${idx}`,
        )
      } else {
        errors.push(`error: ${d.id}: ${d.meta?.file?.name}`)
        errorFiles.push(d)
        continue
      }
    } catch (error) {
      if (error instanceof GaxiosError) {
        if (error.response?.data.error.code === 403) {
          errors.push(
            `${d.id}: ${d.name}: ファイルの名前を変更する権限がありません。`,
          )
          errorFiles.push(d)
          break
        } else {
          errors.push(
            `${d.id}: ${d.name}: Google Drive APIエラーが発生しました。`,
          )
          errorFiles.push(d)
          break
        }
      } else if (error instanceof Error) {
        errors.push(`${d.id}: ${d.name}: ${error.message}`)
      }
    }
  }
  logger.debug(
    `renameDriveFiles -- finished: ${successFiles.length} files renamed of chunk: ${idx}`,
  )

  if (errors.length > 0) {
    logger.debug(
      `renameDriveFiles -- chunk ${idx} errors: \n${errors.join("\n")}`,
    )
  }
  return {
    successFiles,
    errorFiles,
  }
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
