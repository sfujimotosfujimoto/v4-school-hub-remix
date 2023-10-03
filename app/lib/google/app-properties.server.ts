import type { drive_v3 } from "googleapis"
import type { DriveFile } from "~/types"
import { logger } from "~/logger"

import { CHUNK_SIZE, QUERY_FILE_FIELDS } from "../config"
import { arrayIntoChunks } from "../utils"

// export async function updateMultipleAppProperties(
//   accessToken: string,
//   driveFiles: DriveFile[],
// ) {
//   logger.debug("✅ in updateMultipleAppProperties()")

//   const driveFilesChunks = arrayIntoChunks<DriveFile>(driveFiles, CHUNK_SIZE)
//   const promises = driveFilesChunks.map((dfs, idx) =>
//     _updateMultipleAppProperties(accessToken, dfs, idx),
//   )
//   const files = await Promise.all([...promises])
//   const newFiles = files.filter((d): d is drive_v3.Schema$File[] => d !== null)
//   return newFiles.flat()
// }

// async function _updateMultipleAppProperties(
//   accessToken: string,
//   driveFiles: DriveFile[],
//   idx: number,
// ) {
//   logger.debug("✅ in _updateMultipleAppProperties()")

//   const files: drive_v3.Schema$File[] = []
//   for (let i = 0; i < driveFiles.length; i++) {
//     const d = driveFiles[i]
//     if (!d.meta?.file?.nendo || !d.meta?.file?.tags) continue

//     const appProperties = {
//       nendo: d.meta?.file.nendo,
//       tags: d.meta?.file.tags,
//       time: String(Date.now()),
//     }

//     const resp = await updateAppProperties(accessToken, d.id, appProperties)

//     logger.debug(`appProperties: updating ${i} of chunk: ${idx}`)

//     files.push(resp)
//   }
//   logger.debug(
//     `updateAppProperties -- finished: ${files.length} files moved of chunk: ${idx}`,
//   )
//   return files
// }

// export async function updateAppProperties(
//   accessToken: string,
//   fileId: string,
//   appProperties: { [key: string]: string | null },
// ): Promise<drive_v3.Schema$File> {
//   try {
//     return await fetch(
//       `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${QUERY_FILE_FIELDS}`,
//       {
//         method: "PATCH",
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           appProperties: {
//             ...appProperties,
//           },
//         }),
//       },
//     ).then((response) => response.json())
//   } catch (err) {
//     console.error(err)
//     throw err
//   }
// }
