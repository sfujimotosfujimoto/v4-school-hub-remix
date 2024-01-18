import { json, redirect } from "@remix-run/node"
import { z } from "zod"
import { errorResponses } from "~/lib/error-responses"
import {
  getDrive,
  getDriveFiles,
  getFileById,
  queryFolderId,
} from "~/lib/google/drive.server"
import { getSheets, getStudents } from "~/lib/google/sheets.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { getGakusekiFromString, getIdFromUrl, getSchoolYear } from "~/lib/utils"
import { logger } from "~/logger"
import type { ActionTypeGoogle, DriveFile, Student } from "~/types"

// Zod Data Type
const FormDataScheme = z.object({
  sourceFolderId: z.string().optional(),
  tagsString: z.string().optional(),
})
export async function searchAction(request: Request, formData: FormData) {
  logger.debug("🍎 move: searchAction()")
  const { credential } = await getUserFromSessionOrRedirect(request)

  const accessToken = credential.accessToken

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return json<ActionTypeGoogle>(
      {
        intent: "search",
        ok: false,
        type: "move",
        error: `データ処理に問題が発生しました。ERROR#:MOVE-001`,
      },
      { status: 400 },
    )
  }

  let { sourceFolderId, tagsString } = result.data

  // get id from if `sourceFolderId` is url
  const sourceId = getIdFromUrl(sourceFolderId || "")
  if (!sourceId)
    return json<ActionTypeGoogle>(
      {
        intent: "search",
        ok: false,
        type: "move",
        error: "フォルダIDが取得できません",
      },
      { status: 400 },
    )

  // create query for Google Drive Search
  const query = queryFolderId(sourceId)
  if (!query)
    return json<ActionTypeGoogle>(
      {
        intent: "search",
        ok: false,
        type: "move",
        error: "クエリが取得できません",
      },
      { status: 400 },
    )

  // get drive
  const drive = await getDrive(accessToken)
  if (!drive) {
    return redirect("/?authstate=unauthorized-016")
  }

  // get sheets
  const sheets = await getSheets(accessToken)
  if (!sheets)
    return json<ActionTypeGoogle>(
      {
        intent: "search",
        ok: false,
        type: "move",
        error: "名簿シートにアクセスできません。",
      },
      { status: 400 },
    )

  // get google folder meta data
  const sourceFolder = await getFileById(drive, sourceId)
  let driveFiles = await getDriveFiles(drive, query)
  if (!driveFiles)
    return json<ActionTypeGoogle>(
      {
        ok: false,
        intent: "search",
        type: "move",
        error: "Google Driveにファイルがありません。",
      },
      { status: 400 },
    )

  const students = await getStudents(sheets)
  if (students.length === 0) {
    throw errorResponses.google()
  }

  driveFiles = addDestinationToDriveFiles(driveFiles, students)

  const nendo = String(getSchoolYear(Date.now()))
  if (tagsString) {
    driveFiles = addTagsToDriveFiles(driveFiles, nendo, tagsString)
  }

  if (!driveFiles)
    return json<ActionTypeGoogle>(
      {
        intent: "search",
        ok: false,
        type: "move",
        error: "Google Driveにファイルがありません。",
      },
      { status: 400 },
    )

  return json<ActionTypeGoogle>({
    intent: "search",
    ok: true,
    type: "move",
    data: {
      sourceFolder,
      driveFiles,
    },
  })
}

/**
 * add destination to DriveFiles
 */
function addDestinationToDriveFiles(
  driveFiles: DriveFile[],
  students: Student[],
) {
  const outputDriveFiles: DriveFile[] = []
  for (const d of driveFiles) {
    const gakuseki = getGakusekiFromString(d.name)

    const student = students.find((sd) => sd.gakuseki === gakuseki)
    if (!student) continue

    const name = `b${student.gakuseki}_${student.last}_${student.first}_SEIGフォルダ`
    const folderId = getIdFromUrl(student?.folderLink || "")

    // set meta data to DriveFiles
    if (student) {
      // set meta.studentFolder and meta.destination
      const outputDriveFile = {
        ...d,
        meta: {
          ...d.meta,
          studentFolder: {
            folderLink: student.folderLink || undefined,
            folderId,
            name,
          },
          destination: {
            folderId: getIdFromUrl(student.folderLink || ""),
            name,
          },
          last: {
            folderId: d.parents?.at(0),
          },
        },
      }
      outputDriveFiles.push(outputDriveFile)
    }
  }

  return outputDriveFiles
}

function addTagsToDriveFiles(
  driveFiles: DriveFile[],
  nendo: string,
  tagString: string,
) {
  const outputDriveFiles: DriveFile[] = []
  for (const d of driveFiles) {
    const outputDriveFile = {
      ...d,
      meta: {
        ...d.meta,
        file: {
          ...d.meta?.file,
          nendo,
          tags: tagString,
        },
      },
    }
    outputDriveFiles.push(outputDriveFile)
  }
  return outputDriveFiles
}
