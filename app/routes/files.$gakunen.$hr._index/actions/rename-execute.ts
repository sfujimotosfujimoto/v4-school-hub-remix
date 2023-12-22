import { z } from "zod"
import { getDrive, getFileById } from "~/lib/google/drive.server"
import { getUserFromSession } from "~/lib/session.server"

import { json, redirect } from "@remix-run/node"
import type { ActionType, DriveFile } from "~/types"
import { logger } from "~/logger"
import { arrayIntoChunks } from "~/lib/utils"
import { CHUNK_SIZE } from "~/lib/config"
import { renameDriveFiles } from "~/routes/admin.rename._index/actions/execute"
import { mapFilesToDriveFiles } from "_backup/drive.server"

// Zod Data Type
const FormDataScheme = z.object({
  _action: z.string(),
  baseNameString: z.string().optional(),
  fileIdsString: z.string().optional(),
})

export async function renameExecuteAction(
  request: Request,
  formData: FormData,
) {
  logger.debug(`🍎 action: renameExecuteAction()`)

  const user = await getUserFromSession(request)
  if (!user || !user.credential)
    throw redirect("/?authstate=unauthenticated", 302)

  // if no user or credential redirect
  if (!user || !user.credential) throw redirect(`/authstate=unauthorized-012`)

  const accessToken = user.credential.accessToken
  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-013")

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    logger.debug(`🍎 result.error ${result.error.errors.join(",")}`)
    throw json<ActionType>(
      {
        ok: false,
        type: "rename-execute",
        error: `データ処理に問題が発生しました。ERROR#:RENAMEEXECUTE-001`,
      },
      { status: 400 },
    )
  }

  let { baseNameString, fileIdsString } = result.data
  const baseName = baseNameString || ""

  const fileIds = JSON.parse(fileIdsString || "[]")
  const fileIdsChunks = arrayIntoChunks<string>(fileIds, CHUNK_SIZE)
  logger.debug(`✅ action: fileIdsChunks: ${fileIdsChunks.length} `)

  const promises = fileIdsChunks.map((fileIds, idx) =>
    // _updateAppProperties(accessToken, fileIds, tags, nendoString, idx),
    _renameDriveFiles(accessToken, fileIds, baseName, idx),
  )

  logger.debug(`✅ action: promises: ${promises.length} `)

  const resArr = await Promise.all([...promises])
  const res = resArr.filter((d) => d).flat()

  console.log("✅ res.length: ", res.length)

  return json({ ok: true, data: { res } })
}

async function _renameDriveFiles(
  accessToken: string,
  fileIds: string[],
  baseName: string,
  idx: number,
) {
  logger.debug(`✅ action: _renameDriveFiles() `)

  const drive = await getDrive(accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-013")

  const driveFiles: DriveFile[] = []

  console.log("✅ actions/rename-execute.ts ~ 	😀 before for loop")
  for (let i = 0; i < fileIds.length; i++) {
    const fileId = fileIds[i]
    console.log(
      "✅ actions/rename-execute.ts ~ 	😀 inside for loop: fileId",
      fileId,
    )
    const file = await getFileById(drive, fileId)
    if (!file) {
      logger.debug(`🍎 file not found: ${fileId}`)
      continue
    }
    const df = mapFilesToDriveFiles([file]).at(0)
    if (!df) {
      logger.debug(`🍎 df not found: ${fileId}`)
      continue
    }

    const newDf = await updateDriveFileMetaName(df, baseName)
    console.log("✅ actions/rename-execute.ts ~ 	😀 newDf", newDf)

    if (!newDf) continue
    driveFiles.push(newDf)
    logger.debug(`renameDriveFiles -- update idx:${i} of chunk: ${idx}`)
  }
  console.log("✅ actions/rename-execute.ts ~ 	😀 after for loop")
  const files = await renameDriveFiles(drive, driveFiles)

  console.log(
    "✅ actions/rename-execute.ts ~ 	😀 new files",
    files.map((f) => f.name),
  )

  logger.debug(
    `renameDriveFiles -- finished ${files.length} files of chunk: ${idx}`,
  )
  return files
}

async function updateDriveFileMetaName(
  df: DriveFile,
  baseName: string,
): Promise<DriveFile | undefined> {
  // set formerName before changing name
  df.meta = {
    ...df.meta,
    file: {
      ...df.meta?.file,
      formerName: df.name,
    },
  }

  // get file extension
  const extensions = [
    "pdf",
    "jpg",
    "jpeg",
    "png",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "m4a",
  ]
  // get ex. "pdf", "document"
  const ext =
    extensions
      .map((ext) => {
        const match = df.name.match(new RegExp(`\\.${ext}$`))
        if (match) return match.at(-1)
        else return null
      })
      .filter((a) => a)[0] ?? null

  // get name without extension
  const nameNoExt = ext ? df.name.replace(ext, "") : df.name

  // get segments from name
  const segments: string[] = Array.from(new Set(nameNoExt.split(/[_.]/)))
  df.meta = {
    ...df.meta,
    file: {
      ...df.meta?.file,
      segments,
    },
  }

  // join segments without last segment
  const segmentsNoLast = segments.slice(0, -1)

  // get joined segments
  const joinedSegments = segmentsNoLast.join("_")

  let newName = `${joinedSegments}_${baseName}`

  if (ext) {
    newName = newName + ext
  }

  df.meta = {
    ...df.meta,
    file: {
      ...df.meta?.file,
      name: newName,
    },
  }

  return df
}

// function renameDriveFile(
//   drive: drive_v3.Drive,
//   driveFiles: DriveFile[],
// ): Promise<drive_v3.Schema$File[]> {
//   for (let i = 0; i < driveFiles.length; i++) {

//     const df = driveFiles[i]

//     const file = await drive.files.update({
//       fileId: fileId,
//       fields: QUERY_FILE_FIELDS,
//       requestBody: {
//         name: d.meta.file?.name,
//       },
//     })

//     files.push(file.data)
//     return files
//   }
// }
