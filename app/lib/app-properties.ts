// import type { drive_v3 } from "googleapis"
// const CHUNK_SIZE = 5

import { QUERY_FILE_FIELDS } from "./config"

// export async function updateMultipleAppProperties(
//   accessToken: string,
//   driveFiles: DriveFile[],
// ) {
//   // console.log("🚀 drive/appProperties.ts ~ 	😀 in updateMultipleAppProperties()")

//   const driveFilesChunks = arrayIntoChunks<DriveFile>(driveFiles, CHUNK_SIZE)
//   const promises = driveFilesChunks.map((dfs, idx) =>
//     _updateMultipleAppProperties(accessToken, dfs, idx),
//   )
//   const files = await Promise.all([...promises])
//   const newFiles = files.filter((d): d is drive_v3.Schema$File[] => d !== null)
//   return newFiles.flat()
// }

// export async function _updateMultipleAppProperties(
//   accessToken: string,
//   driveFiles: DriveFile[],
//   idx: number,
// ): Promise<drive_v3.Schema$File[]> {
//   // console.log("🚀 drive/appProperties.ts ~ 	😀 in updateMultipleAppProperties()")

//   const dfs = [...driveFiles]

//   // const files: drive_v3.Schema$File[] = []
//   const files: Promise<drive_v3.Schema$File>[] = []

//   for (let i = 0; i < dfs.length; i++) {
//     const d = dfs[i]
//     if (!d.meta?.file?.nendo || !d.meta?.file?.tags) continue

//     const appProperties = {
//       nendo: d.meta?.file.nendo,
//       tags: d.meta?.file.tags,
//       time: String(Date.now()),
//     }

//     const resp = updateAppProperties(accessToken, d.id, appProperties)

//     // console.log(`appProperties: updating ${i} of chunk: ${idx}`)

//     files.push(resp)
//   }

//   logger.debug(
//     `updateAppProperties -- finished: ${files.length} files moved of chunk: ${idx}`,
//   )
//   return Promise.all(files)
// }

export async function updateAppProperties(
  accessToken: string,
  fileId: string,
  appProperties: { [key: string]: string | null },
) {
  try {
    return fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${QUERY_FILE_FIELDS}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appProperties: {
            ...appProperties,
          },
        }),
      },
    ).then((response) => response.json())
  } catch (err) {
    console.error(err)
    throw err
  }
}

// export async function updateMultipleAppProperties2(
//   accessToken: string,
//   driveFiles: DriveFile[],
// ) {
//   // console.log("🚀 drive/appProperties.ts ~ 	😀 in updateMultipleAppProperties()")
//   const CHUNK_SIZE = 50

//   const driveFilesArray = arrayIntoChunks(driveFiles, CHUNK_SIZE)

//   // const data = []
//   const promises = []
//   for (const dfs of driveFilesArray) {
//     try {
//       let count = 0
//       for (const df of dfs) {
//         if (!df.meta?.file?.nendo || !df.meta?.file?.tags) continue

//         const appProperties = {
//           nendo: df.meta?.file.nendo,
//           tags: df.meta?.file.tags,
//           time: String(Date.now()),
//         }

//         // const d = updateAppProperties(accessToken, df.id, appProperties)
//         const p = updateAppProperties2(accessToken, df.id, appProperties)

//         // data.push(d)
//         promises.push(p)
//       }
//       if (count > 0) await sleep(1000 * 100)
//       count++
//       // console.log(`updateMultipleAppAproperties(): ${dfs.length} files updated`)
//     } catch (err) {
//       console.error(err)
//       throw err
//     }
//   }

//   let data
//   try {
//     const responses = await Promise.all(promises)
//     data = await Promise.all(responses.map((response) => response.json()))
//   } catch (err) {
//     console.error("in updateMultipleAppProperties", err)
//   }

//   return data
// }

// export async function updateAppProperties2(
//   accessToken: string,
//   fileId: string,
//   appProperties: { [key: string]: string | null },
// ) {
//   try {
//     return fetch(
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
//     )
//   } catch (err) {
//     console.error(err)
//     throw err
//   }
// }
