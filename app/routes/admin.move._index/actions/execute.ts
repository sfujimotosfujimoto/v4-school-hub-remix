import { json } from "@remix-run/node"
import { type drive_v3 } from "googleapis"
import { GaxiosError } from "gaxios"
import { z } from "zod"
import { CHUNK_SIZE, QUERY_FILE_FIELDS } from "~/lib/config"
import { errorResponses } from "~/lib/error-responses"
import { getDrive, mapFilesToDriveFiles } from "~/lib/google/drive.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { arrayIntoChunks, getIdFromUrl, parseAppProperties } from "~/lib/utils"
import { convertDriveFiles } from "~/lib/utils-loader"
import { logger } from "~/logger"
import type { ActionResponse, ActionTypeGoogle, DriveFile } from "~/types"
import { flatFiles, parseDateToString } from "~/lib/utils.server"

// Zod Data Type
const FormDataScheme = z.object({
  intent: z.string(),
  driveFilesString: z.string().optional(),
  sourceFolderId: z.string().optional(),
})

export async function executeAction(request: Request, formData: FormData) {
  logger.debug(`🍎 move: executeAction()`)
  const { credential } = await getUserFromSessionOrRedirect(request)

  const drive = await getDrive(credential.accessToken)
  if (!drive) {
    throw errorResponses.google()
  }

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`🍎 result.error ${result.error.errors.join(",")}`)
    throw json<ActionTypeGoogle>(
      {
        ok: false,
        intent: "execute",
        type: "move",
        error: `データ処理に問題が発生しました。ERROR#:MOVEEXECUTE-001`,
      },
      { status: 400 },
    )
  }

  let { driveFilesString } = result.data

  const raw = JSON.parse(driveFilesString || "[]")
  const driveFiles = convertDriveFiles(raw)

  // const driveFiles = DriveFilesSchema.parse(raw) as DriveFile[]
  if (!driveFiles || driveFiles.length === 0)
    return json<ActionTypeGoogle>({
      intent: "execute",
      ok: false,
      type: "move",
      error: "ファイルがありません",
    })

  try {
    const drive = await getDrive(credential.accessToken)
    if (!drive) {
      throw errorResponses.google()
    }

    // make a copy of the array because renameDriveFiles mutates the array
    const dfz = [...driveFiles]
    const res = await moveDriveFiles(drive, dfz)

    // from the successFiles, get the files that were actually moved
    // from the original array of files
    // because the original data has "meta" data in them
    // and we need the data for undo task data
    let successFiles: DriveFile[] = []
    res.successFiles.forEach((sf) => {
      const found = driveFiles.find((df) => {
        return df.id === sf.id
      })
      if (found) {
        successFiles.push(found)
      }
    })

    console.log("✅ move successFiles", successFiles.length)

    return json<ActionTypeGoogle>({
      ok: true,
      intent: "execute",
      type: "move",
      data: {
        driveFiles: successFiles,
        errorFiles: mapFilesToDriveFiles(res.errorFiles),
      },
    })
  } catch (error: unknown) {
    logger.error(`🍎 move: executeAction() error: ${error}`)
    if (error instanceof Error) {
      logger.error(`🍎 move: executeAction() error.message: ${error.message}`)
    }
    return json<ActionTypeGoogle>({
      ok: false,
      intent: "execute",
      type: "move",
      error: "問題が発生しました。",
    })
  }
}

export async function moveDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
): Promise<ActionResponse> {
  logger.debug(`✅ moveDriveFiles: ${driveFiles.length} files total`)
  const driveFilesChunks = arrayIntoChunks<DriveFile>(driveFiles, CHUNK_SIZE)

  const promises = driveFilesChunks.map((dfs, idx) => {
    return _moveDriveFilesG(drive, dfs, idx)
  })

  // return promises.flat()

  const files = await Promise.all([...promises])
  const newFiles = files.filter((d): d is ActionResponse => d !== null)

  const successFiles = flatFiles(newFiles, "successFiles")
  const errorFiles = flatFiles(newFiles, "errorFiles")
  logger.debug(`Finished moving: ${successFiles.length} files`)
  logger.debug(`Errored moving: ${errorFiles.length} files`)

  return { successFiles, errorFiles }
}

async function _moveDriveFilesG(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
  idx: number,
): Promise<ActionResponse> {
  const dfs = [...driveFiles]
  const successFiles: drive_v3.Schema$File[] = []
  const errorFiles: drive_v3.Schema$File[] = []
  const errors: string[] = []
  const maxRetries = 5 // Maximum number of retries
  let retryCount = 0

  for (let i = 0; i < dfs.length; i++) {
    const d = {
      ...dfs[i],
      appProperties: parseAppProperties(dfs[i].appProperties || "[]"),
      createdTime: parseDateToString(dfs[i]?.createdTime),
      modifiedTime: parseDateToString(dfs[i]?.modifiedTime),
    }

    if (!d.meta?.studentFolder?.folderLink || !d.id) {
      errors.push(`error: ${d.id}: ${d.name}`)
      errorFiles.push(d)
      continue
    }

    const folderId = getIdFromUrl(d.meta.studentFolder.folderLink)

    if (!folderId) {
      errors.push(`error: ${d.id}: ${d.name}`)
      errorFiles.push(d)
      continue
    }

    while (true) {
      try {
        // if file is already in folder, skip
        if (d.parents?.at(0) === folderId) {
          errors.push(`error: ${d.id}: ${d.name}`)
          errorFiles.push(d)
          continue
        } else if (d.parents?.at(0) && d.meta.file) {
          const file = await drive.files.update({
            fileId: d.id,
            removeParents: d.parents?.at(0),
            addParents: folderId,
            fields: QUERY_FILE_FIELDS,
            requestBody: {
              appProperties: {
                nendo: d.meta.file.nendo ?? "",
                tags: d.meta.file.tags ?? "",
                time: String(Date.now()),
              },
            },
          })

          successFiles.push(file.data)
          // logger.debug(`moveDriveFiles: ${d.name}, idx:${i} of chunk: ${idx}`)
          break // Operation succeeded, exit retry loop
        }
      } catch (error) {
        // console.log("✅ moveDriveFiles: error", error, error instanceof Error)
        if (error instanceof GaxiosError) {
          if (error.response?.data.error.code === 403) {
            errors.push(
              `${d.id}: ${d.name}: ファイルの移動する権限がありません。`,
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

        if (retryCount >= maxRetries) {
          logger.error(
            `Exceeded max retries (${maxRetries}). Giving up on file ${d.id}: ${d.name}`,
          )
          errorFiles.push(d)
          break // Max retries reached, exit retry loop
        }

        const delayMs = Math.pow(2, retryCount) * 1000 // Exponential backoff
        retryCount++

        logger.debug(`Retrying file ${d.name}: in ${delayMs / 1000} seconds.`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    retryCount = 0 // Reset retry count for the next file
  }

  logger.info(
    `moveDriveFiles -- finished: ${successFiles.length} files moved of chunk: ${idx}`,
  )

  if (errors.length > 0) {
    logger.info(`moveDriveFiles -- chunk ${idx} errors: \n${errors.join("\n")}`)
  } else {
    logger.info(`moveDriveFiles -- chunk ${idx} 🍭 NO ERRORS`)
  }
  return {
    successFiles,
    errorFiles,
  }
}

// async function _moveDriveFiles(
//   drive: drive_v3.Drive,
//   driveFiles: DriveFile[],
//   idx: number,
// ) {
//   // @note Before, you didn't have to make a copy of the array
//   // Why do you have to create a copy now?
//   const dfs = [...driveFiles]

//   const files: drive_v3.Schema$File[] = []
//   const errors: string[] = []

//   for (let i = 0; i < dfs.length; i++) {
//     const d = dfs[i]
//     //---------------------------------------------------------

//     if (!d.meta?.studentFolder?.folderLink || !d.id) {
//       errors.push(`error: ${d.id}: ${d.name}`)
//       continue
//     }

//     // get folderId from folderLink
//     const folderId = getIdFromUrl(d.meta.studentFolder.folderLink)
//     if (!folderId) {
//       errors.push(`error: ${d.id}: ${d.name}`)
//       continue
//     }

//     //     //---------------------------------------------------------

//     // if file is already in folder, skip
//     if (d.parents?.at(0) === folderId) {
//       errors.push(`error: ${d.id}: ${d.name}`)
//       continue
//     } else if (d.parents?.at(0) && d.meta.file) {
//       try {
//         const file = await drive.files.update({
//           fileId: d.id,
//           removeParents: d.parents?.at(0),
//           addParents: folderId,
//           requestBody: {
//             appProperties: {
//               nendo: d.meta.file.nendo ?? "",
//               tags: d.meta.file.tags ?? "",
//               time: String(Date.now()),
//             },
//           },
//           fields: QUERY_FILE_FIELDS,
//           // TODO: {responseType: "stream"} implement
//           // }, {responseType: "stream"})
//         })
//         files.push(file.data)
//         // console.log(`moveDriveFiles: ${d.name}, idx:${j} of chunk: ${idx}`)
//       } catch (error) {
//         errors.push(`error: ${d.id}: ${d.name} message: ${error}`)

//         if (error instanceof Error) {
//           errors.push(`error: ${d.id}: ${d.name} message: ${error.message}`)
//         }
//         continue
//       }
//     } else {
//       // create promise using `update`
//       const file = await drive.files.update({
//         fileId: d.id,
//         addParents: folderId,
//       })
//       files.push(file.data)
//       logger.debug(`moveDriveFiles: ${d.name}, idx:${i} of chunk: ${idx}`)
//     }
//   }
//   logger.debug(
//     `moveDriveFiles -- finished: ${files.length} files moved of chunk: ${idx}`,
//   )

//   if (errors.length > 0) {
//     logger.debug(
//       `renameDriveFiles -- chunk ${idx} errors: \n${errors.join("\n")}`,
//     )
//   }
//   return files
// }

// export async function _moveDriveFilesG2(
//   drive: drive_v3.Drive,
//   driveFiles: DriveFile[],
//   idx: number,
// ) {
//   const dfs = [...driveFiles]
//   const files: drive_v3.Schema$File[] = []
//   const errors: string[] = []
//   const maxRetries = 5 // Maximum number of retries
//   let retryCount = 0

//   for (let i = 0; i < dfs.length; i++) {
//     const d = dfs[i]

//     if (!d.meta?.studentFolder?.folderLink || !d.id) {
//       errors.push(`error: ${d.id}: ${d.name}`)
//       continue
//     }

//     const folderId = getIdFromUrl(d.meta.studentFolder.folderLink)

//     if (!folderId) {
//       errors.push(`error: ${d.id}: ${d.name}`)
//       continue
//     }

//     while (true) {
//       try {
//         const file = await drive.files.update({
//           fileId: d.id,
//           addParents: folderId,
//           fields: QUERY_FILE_FIELDS,
//         })

//         files.push(file.data)
//         logger.debug(`moveDriveFiles: ${d.name}, idx:${i} of chunk: ${idx}`)
//         break // Operation succeeded, exit retry loop
//       } catch (error) {
//         errors.push(`error: ${d.id}: ${d.name}`)

//         if (retryCount >= maxRetries) {
//           logger.error(
//             `Exceeded max retries (${maxRetries}). Giving up on file ${d.id}: ${d.name}`,
//           )
//           break // Max retries reached, exit retry loop
//         }

//         const delayMs = Math.pow(2, retryCount) * 1000 // Exponential backoff
//         retryCount++

//         logger.debug(`Retrying file ${d.name}: in ${delayMs / 1000} seconds.`)
//         await new Promise((resolve) => setTimeout(resolve, delayMs))
//       }
//     }

//     retryCount = 0 // Reset retry count for the next file
//   }

//   logger.info(
//     `moveDriveFiles -- finished: ${files.length} files moved of chunk: ${idx}`,
//   )

//   if (errors.length > 0) {
//     logger.info(`moveDriveFiles -- chunk ${idx} errors: \n${errors.join("\n")}`)
//   } else {
//     logger.info(`moveDriveFiles -- chunk ${idx} 🍭 NO ERRORS`)
//   }

//   return files
// }
