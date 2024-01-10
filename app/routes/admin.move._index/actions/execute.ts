import { json, redirect } from "@remix-run/node"
import type { drive_v3 } from "googleapis"
import { z } from "zod"
import { CHUNK_SIZE, QUERY_FILE_FIELDS } from "~/lib/config"
import { getDrive, mapFilesToDriveFiles } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { arrayIntoChunks, getIdFromUrl } from "~/lib/utils"
import { convertDriveFiles } from "~/lib/utils-loader"
import { logger } from "~/logger"
import type { ActionTypeGoogle, DriveFile } from "~/types"

// Zod Data Type
const FormDataScheme = z.object({
  _action: z.string(),
  driveFilesString: z.string().optional(),
  sourceFolderId: z.string().optional(),
})

export async function executeAction(request: Request, formData: FormData) {
  logger.debug(`🍎 move: executeAction()`)
  const user = await getUserFromSession(request)
  if (!user || !user.credential)
    throw redirect("/?authstate=unauthenticated", 302)

  // if no user or credential redirect
  if (!user || !user.credential) throw redirect(`/authstate=unauthorized-012`)

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-013")

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`🍎 result.error ${result.error.errors.join(",")}`)
    throw json<ActionTypeGoogle>(
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
  const driveFiles = convertDriveFiles(raw)

  // const driveFiles = DriveFilesSchema.parse(raw) as DriveFile[]
  if (!driveFiles || driveFiles.length === 0)
    return json<ActionTypeGoogle>({
      ok: false,
      type: "execute",
      error: "ファイルがありません",
    })

  try {
    const drive = await getDrive(user.credential.accessToken)
    if (!drive) throw redirect("/?authstate=unauthorized-014")

    const files = await moveDriveFiles(drive, driveFiles)

    // // TODO: checking defer
    // return defer({
    //   ok: true,
    //   type: "execute",
    //   data: {
    //     driveFiles: mapFilesToDriveFiles(files),
    //   },
    // })

    return json<ActionTypeGoogle>({
      ok: true,
      type: "execute",
      data: {
        driveFiles: mapFilesToDriveFiles(files),
      },
    })
  } catch (error: unknown) {
    logger.error(`🍎 move: executeAction() error: ${error}`)
    if (error instanceof Error) {
      logger.error(`🍎 move: executeAction() error.message: ${error.message}`)
    }
    return json<ActionTypeGoogle>({
      ok: false,
      type: "execute",
      error: "問題が発生しました。",
    })
  }
}

export async function moveDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
) {
  logger.debug(`✅ moveDriveFiles: ${driveFiles.length} files total`)
  const driveFilesChunks = arrayIntoChunks<DriveFile>(driveFiles, CHUNK_SIZE)

  const promises = driveFilesChunks.map((dfs, idx) => {
    return _moveDriveFilesG(drive, dfs, idx)
  })

  // return promises.flat()

  const files = await Promise.all([...promises])
  const newFiles = files.filter((d): d is drive_v3.Schema$File[] => d !== null)
  const newFilesFlat = newFiles.flat()
  logger.debug(`Finished moving: ${newFilesFlat.length} files`)

  return newFilesFlat
}

async function _moveDriveFilesG(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
  idx: number,
) {
  const dfs = [...driveFiles]
  const files: drive_v3.Schema$File[] = []
  const errors: string[] = []
  const maxRetries = 5 // Maximum number of retries
  let retryCount = 0

  for (let i = 0; i < dfs.length; i++) {
    const d = dfs[i]

    if (!d.meta?.studentFolder?.folderLink || !d.id) {
      errors.push(`error: ${d.id}: ${d.name}`)
      continue
    }

    const folderId = getIdFromUrl(d.meta.studentFolder.folderLink)

    if (!folderId) {
      errors.push(`error: ${d.id}: ${d.name}`)
      continue
    }

    while (true) {
      try {
        // // if file is already in folder, skip
        // logger.debug(`✅ moveDriveFiles: start ${d.name}`)
        // if (d.parents?.at(0) === folderId) {
        //   logger.debug(`✅ moveDriveFiles: ${d.name} already in folder`)
        //   errors.push(`error: ${d.id}: ${d.name}`)
        //   break
        // } else if (d.parents?.at(0) && d.meta.file) {
        //   logger.debug(`✅ moveDriveFiles: ${d.name} updating file`)
        //   try {
        //     const file = await drive.files.update({
        //       fileId: d.id,
        //       removeParents: d.parents?.at(0),
        //       addParents: folderId,
        //       requestBody: {
        //         appProperties: {
        //           nendo: d.meta.file.nendo ?? "",
        //           tags: d.meta.file.tags ?? "",
        //           time: String(Date.now()),
        //         },
        //       },
        //       fields: QUERY_FILE_FIELDS,
        //       // TODO: {responseType: "stream"} implement
        //       // }, {responseType: "stream"})
        //     })
        //     files.push(file.data)
        //     // console.log(`moveDriveFiles: ${d.name}, idx:${j} of chunk: ${idx}`)
        //   } catch (error) {
        //     errors.push(`error: ${d.id}: ${d.name} message: ${error}`)

        //     if (error instanceof Error) {
        //       errors.push(`error: ${d.id}: ${d.name} message: ${error.message}`)
        //     }
        //     break
        //   }
        // } else {
        //   // create promise using `update`
        //   const file = await drive.files.update({
        //     fileId: d.id,
        //     addParents: folderId,
        //   })
        //   files.push(file.data)
        //   logger.debug(`moveDriveFiles: ${d.name}, idx:${i} of chunk: ${idx}`)
        //   break
        // }

        // //---------------------------------------------------------

        // if file is already in folder, skip
        if (d.parents?.at(0) === folderId) {
          errors.push(`error: ${d.id}: ${d.name}`)
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

          files.push(file.data)
          // logger.debug(`moveDriveFiles: ${d.name}, idx:${i} of chunk: ${idx}`)
          break // Operation succeeded, exit retry loop
        }
      } catch (error) {
        errors.push(`error: ${d.id}: ${d.name}`)

        if (retryCount >= maxRetries) {
          logger.error(
            `Exceeded max retries (${maxRetries}). Giving up on file ${d.id}: ${d.name}`,
          )
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
    `moveDriveFiles -- finished: ${files.length} files moved of chunk: ${idx}`,
  )

  if (errors.length > 0) {
    logger.info(`moveDriveFiles -- chunk ${idx} errors: \n${errors.join("\n")}`)
  } else {
    logger.info(`moveDriveFiles -- chunk ${idx} 🍭 NO ERRORS`)
  }

  return files
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
