import { z } from "zod"
import { getDrive } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"
import { DriveFilesSchema } from "~/schemas"

import { json, redirect } from "@remix-run/node"
import type { drive_v3 } from "googleapis"
import type { ActionType, DriveFile } from "~/types"
import { logger } from "~/logger"
import { arrayIntoChunks, getIdFromUrl } from "~/lib/utils"
import { CHUNK_SIZE, QUERY_FILE_FIELDS } from "~/lib/config"

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
    throw json<ActionType>(
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

  const driveFiles = DriveFilesSchema.parse(raw) as DriveFile[]
  if (!driveFiles || driveFiles.length === 0)
    return json<ActionType>({
      ok: false,
      type: "execute",
      error: "ファイルがありません",
    })

  try {
    const drive = await getDrive(user.credential.accessToken)
    if (!drive) throw redirect("/?authstate=unauthorized-014")
    await moveDriveFiles(drive, driveFiles)
    // 23/10/27/(Fri) 12:03:09  ----------------------
    // const dfs = mapFilesToDriveFiles(files || [])

    // TODO: 231027 Trying to read from the source folder to get the new state of google drive folder
    // NOTE: Couldn't get the new state becuase there is a delay in the google drive api
    // NOTE: I chose to return an empty array for now

    // // create query for Google Drive Search
    // const sourceId = getIdFromUrl(sourceFolderId || "")
    // if (!sourceId) {
    //   return json<ActionType>({ ok: true, type: "execute" })
    // }

    // const query = queryFolderId(sourceId)
    // if (!query) {
    //   return json<ActionType>({ ok: true, type: "execute" })
    // }
    // const newDriveFiles = await getDriveFiles(drive, query)

    return json<ActionType>({
      ok: true,
      type: "execute",
      data: {
        driveFiles: [],
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error) return { error: error.message }
    else return { error: "エラーが発生しました。" }
  }
}

/**
 * moveDriveFiles moves the given files based on their gakuseki
 * which is in the name of the file.
 */
export async function moveDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
) {
  logger.debug(`✅ moveDriveFiles: ${driveFiles.length} files total`)
  const driveFilesChunks = arrayIntoChunks<DriveFile>(driveFiles, CHUNK_SIZE)

  const promises = driveFilesChunks.map((dfs, idx) => {
    return _moveDriveFiles(drive, dfs, idx)
  })

  const files = await Promise.all([...promises])
  const newFiles = files.filter((d): d is drive_v3.Schema$File[] => d !== null)
  const newFilesFlat = newFiles.flat()
  logger.debug(`Finished moving: ${newFilesFlat.length} files`)
  return newFilesFlat
}

async function _moveDriveFiles(
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
    //---------------------------------------------------------

    if (!d.meta?.studentFolder?.folderLink || !d.id) {
      errors.push(`error: ${d.id}: ${d.name}`)
      continue
    }

    // get folderId from folderLink
    const folderId = getIdFromUrl(d.meta.studentFolder.folderLink)
    if (!folderId) {
      errors.push(`error: ${d.id}: ${d.name}`)
      continue
    }

    try {
      const file = await drive.files.update({
        fileId: d.id,
        addParents: folderId,
        fields: QUERY_FILE_FIELDS,
      })
      // TODO: {responseType: "stream"} implement
      // }, {responseType: "stream"})

      files.push(file.data)
      logger.debug(
        `moveDriveFiles: ${d.meta.file?.name}, idx:${i} of chunk: ${idx}`,
      )
    } catch (error) {
      errors.push(`error: ${d.id}: ${d.name}`)
      continue
    }
  }
  logger.debug(
    `moveDriveFiles -- finished: ${files.length} files moved of chunk: ${idx}`,
  )

  if (errors.length > 0) {
    logger.debug(
      `renameDriveFiles -- chunk ${idx} errors: \n${errors.join("\n")}`,
    )
  }
  return files
}
