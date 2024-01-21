import { json } from "@remix-run/node"
import type { drive_v3 } from "googleapis"
import { z } from "zod"
import { errorResponses } from "~/lib/error-responses"
import {
  execPermissions,
  getDrive,
  getDriveFilesWithStudentFolder,
  getFileById,
  queryFolderId,
} from "~/lib/google/drive.server"
import {
  getSheets,
  getStudentByGakunenHrHrNo,
  getStudents,
} from "~/lib/google/sheets.server"
import { requireAdminRole } from "~/lib/require-roles.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { getIdFromUrl, getStudentEmail } from "~/lib/utils/utils"
import { getExtensions, getHrAndHrNoFromString } from "~/lib/utils/utils.search"
import { logger } from "~/logger"
import type { ActionTypeGoogle, DriveFile, Gakunen, Hr, Student } from "~/types"

// Zod Data Type_
const FormDataScheme = z.object({
  intent: z.string(),
  sourceFolderId: z.string(),
  gakunen: z.string(),
  segment: z.string(),
  includeSuffix: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  // includeGakunenHrHrNo: z.boolean().optional(),
  includeGakunenHrHrNo: z
    .string()
    .optional()
    .transform((v) => {
      return v === "on"
    }),
  gakunenHrHrNoStart: z
    .string()
    .optional()
    .transform((v) => {
      return v === "on"
    }),
})

/**
 * Rename searchAction
 */
export async function searchRenameAction(request: Request, formData: FormData) {
  logger.debug(`🍎 rename: searchAction()`)
  const { user, credential } = await getUserFromSessionOrRedirect(request)
  await requireAdminRole(request, user)

  const accessToken = credential.accessToken

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return json<ActionTypeGoogle>(
      {
        ok: false,
        intent: "search",
        type: "rename",
        error: `データ処理に問題が発生しました。ERROR#:RENAME001`,
      },
      { status: 400 },
    )
  }

  let {
    sourceFolderId,
    gakunen,
    segment,
    includeSuffix,
    includeGakunenHrHrNo,
    gakunenHrHrNoStart,
  } = result.data

  // get drive
  const drive = await getDrive(accessToken)
  if (!drive) {
    throw errorResponses.google()
  }

  // get sheets
  const sheets = await getSheets(accessToken)
  if (!sheets) {
    throw errorResponses.google()
  }

  // get id from if `sourceFolderId` is url
  const sourceId = getIdFromUrl(sourceFolderId || "")
  if (!sourceId)
    return json<ActionTypeGoogle>(
      {
        ok: false,
        intent: "search",
        type: "rename",
        error: "フォルダIDが取得できません",
      },
      { status: 400 },
    )

  const query = queryFolderId(sourceId)
  if (!query)
    return json<ActionTypeGoogle>(
      {
        ok: false,
        intent: "search",
        type: "rename",
        error: "クエリが取得できません。",
      },
      { status: 400 },
    )

  // get google folder meta data
  const sourceFolder = await getFileById(drive, sourceId)

  // get DriveFile with query
  const driveFiles = await getDriveFilesWithStudentFolder(drive, sheets, query)

  if (!driveFiles)
    return json<ActionTypeGoogle>(
      {
        ok: false,
        intent: "search",
        type: "rename",
        error: "Google Driveにファイルがありません。",
      },
      { status: 400 },
    )

  // add student permission to driveFiles meta
  // also add studentEmail to meta.file
  if (driveFiles) await addPermissionToDriveFiles(drive, driveFiles)

  const students = await getStudents(sheets)
  if (students.length === 0) {
    throw errorResponses.google()
  }
  // logger.debug(`🍎 6. action: students: ${students.length}`)

  // 1. add segemented name to meta
  // 2. if hr and hrNo, or lastname firstname in segments get it

  if (!driveFiles || !students || driveFiles.length === 0)
    return json({ ok: false, error: "データが見つかりませんでした" })

  const newDriveFiles = await findStudentDataFromSegments(
    driveFiles,
    students,
    gakunen as Gakunen,
    segment,
    includeSuffix,
    includeGakunenHrHrNo,
    gakunenHrHrNoStart,
  )

  const data = {
    sourceFolder,
    driveFiles: newDriveFiles,
  }
  logger.debug(
    `🍎 7. action: data.driveFiles.length: ${data.driveFiles.length}`,
  )

  return json<ActionTypeGoogle>({
    ok: true,
    intent: "search",
    type: "rename",
    data,
  })
}

/**
 * addPermissionToDriveFiles
 * add student permission to driveFiles meta
 * then add studentEmail to meta.file
 */
async function addPermissionToDriveFiles(
  drive: drive_v3.Drive,
  driveFiles: DriveFile[],
) {
  logger.debug("✅ addPermissionToDriveFiles: start")
  driveFiles.forEach(async (d) => {
    const permissions = await execPermissions(drive, d.id)

    const studentPermission = permissions.find((p) =>
      getStudentEmail(p.emailAddress),
    )
    d.meta = {
      ...d.meta,
      file: {
        ...d.meta?.file,
        studentEmail: studentPermission?.emailAddress,
      },
      permissions,
    }
  })
}

/**
 * findStudentDataFromSegments
 */
async function findStudentDataFromSegments(
  driveFiles: DriveFile[],
  students: Student[],
  gakunen: Gakunen,
  segment: string | null,
  includeSuffix: boolean,
  includeGakunenHrHrNo: boolean,
  gakunenHrHrNoStart: boolean,
): Promise<DriveFile[]> {
  logger.debug(
    `✅ findStudentDataFromSegments: gakunen: ${gakunen}, segment: ${segment}, driveFiles: ${driveFiles.length}`,
  )
  // 1. add segemented name to meta
  // 2. if hr and hrNo, or lastname firstname in segments get it

  const newDriveFiles: DriveFile[] = []
  for await (const d of driveFiles) {
    const a = await _findStudentDataFromSegments(
      d,
      students,
      gakunen,
      segment,
      includeSuffix,
      includeGakunenHrHrNo,
      gakunenHrHrNoStart,
    )
    if (a) newDriveFiles.push(a)
  }

  return newDriveFiles
}

/**
 * _findStudentDataFromSegments
 * then create new name and add to meta.file
 */
async function _findStudentDataFromSegments(
  df: DriveFile,
  students: Student[],
  gakunen: Gakunen = "ALL",
  segment: string | null = null,
  includeSuffix = true,
  includeGakunenHrHrNo = true,
  gakunenHrHrNoStart = false,
): Promise<DriveFile | undefined> {
  // set formerName before changing name
  df.meta = {
    ...df.meta,
    file: {
      ...df.meta?.file,
      formerName: df.name,
    },
  }

  // get file extension, segments, and joinedSegments and add segments to df
  const { ext, segments, joinedSegments } = getExtensions(df)
  logger.debug(
    `✅ _findStudentDataFromSegments: joinedSegments ${joinedSegments}`,
  )
  // logger.debug(`✅ df.meta: ${JSON.stringify(df.meta, null, 2)}}`)

  /**
   * 1. StudentEmail
   * look up if studentEmail is set in meta.file
   */
  if (df.meta.file?.studentEmail) {
    return getDriveFileIfStudentEmailExists(
      df,
      students,
      ext,
      segments,
      segment,
      includeSuffix,
      includeGakunenHrHrNo,
      gakunenHrHrNoStart,
    )
  }

  /**
   * 2. Gakuseki
   * get student by gakuseki
   */
  const gakuseki = getGakusekiFromString(segments)
  if (gakuseki) {
    return getDriveFileIfGakusekiExists(
      gakuseki,
      df,
      students,
      ext,
      segments,
      segment,
      includeSuffix,
      includeGakunenHrHrNo,
      gakunenHrHrNoStart,
    )
  }

  const { hr, hrNo } = getHrAndHrNoFromString(joinedSegments)

  // console.log("✅ hr, hrNo, gakunen", hr, hrNo, gakunen)

  /**
   * 3. Get by Hr and HrNo
   * look up student by Hr, HrNo, and Gakunen
   */
  if (gakunen !== "ALL" && hr && hrNo) {
    return getDriveFileIfHrHrNoExists(
      gakunen,
      hr,
      hrNo,
      df,
      students,
      ext,
      segments,
      segment,
      includeSuffix,
      includeGakunenHrHrNo,
      gakunenHrHrNoStart,
    )
  }

  return getDriveFileIfLastFirstExists(
    joinedSegments,
    df,
    students,
    ext,
    segments,
    segment,
    includeSuffix,
    includeGakunenHrHrNo,
    gakunenHrHrNoStart,
  )
}

function getDriveFileIfStudentEmailExists(
  df: DriveFile,
  students: Student[],
  ext: string | null,
  segments: string[],
  segment: string | null,
  includeSuffix: boolean,
  includeGakunenHrHrNo: boolean,
  gakunenHrHrNoStart: boolean,
) {
  logger.debug(`✅ in getStudentIfStudentEmailExists: ${segments}`)
  // look up if studentEmail is set in meta.file
  // is so, find students from studentEmail
  const student = students.find((sd) => {
    return sd.email === df.meta?.file?.studentEmail
  })

  if (student) {
    const newName = createNewName(
      student,
      segments,
      ext,
      segment,
      includeSuffix,
      includeGakunenHrHrNo,
      gakunenHrHrNoStart,
    )
    df = addNewNameToMeta(df, newName, student)

    return df
  } else {
    errorResponses.server(
      `メールアドレス ${df.meta?.file?.studentEmail} の生徒が名簿から見つかりません。`,
    )
  }
}

function getGakusekiFromString(segments: string[]) {
  // get student by gakuseki
  const gakusekiString = segments.find((s) => s.match(/([0-9]{7})|(b[0-9]{7})/))
  const gMatches = gakusekiString?.match(/[0-9]{7}|b([0-9]{7})/)
  const gakuseki = gMatches?.at(1) ?? gMatches?.at(0)
  return gakuseki
}

function getDriveFileIfGakusekiExists(
  gakuseki: string,
  df: DriveFile,
  students: Student[],
  ext: string | null,
  segments: string[],
  segment: string | null,
  includeSuffix: boolean,
  includeGakunenHrHrNo: boolean,
  gakunenHrHrNoStart: boolean,
) {
  logger.debug(`✅ in getDriveFileIfGakusekiExists: ${segments}`)

  // Check for gakuseki in segments
  if (gakuseki) {
    const student = students.find((sd) => String(sd.gakuseki) === gakuseki)

    if (student) {
      const newName = createNewName(
        student,
        segments,
        ext,
        segment,
        includeSuffix,
        includeGakunenHrHrNo,
        gakunenHrHrNoStart,
      )
      df = addNewNameToMeta(df, newName, student)

      return df
    }
  }
}

function getDriveFileIfHrHrNoExists(
  gakunen: Gakunen,
  hr: Hr | null,
  hrNo: number | null,
  df: DriveFile,
  students: Student[],
  ext: string | null,
  segments: string[],
  segment: string | null,
  includeSuffix: boolean,
  includeGakunenHrHrNo: boolean,
  gakunenHrHrNoStart: boolean,
) {
  logger.debug(`✅ in getDriveFileIfHrHrNoExists: ${segments}`)

  if (hr && hrNo) {
    const student = getStudentByGakunenHrHrNo(gakunen, hr, hrNo, students)

    if (student) {
      const newName = createNewName(
        student,
        segments,
        ext,
        segment,
        includeSuffix,
        includeGakunenHrHrNo,
        gakunenHrHrNoStart,
      )
      df = addNewNameToMeta(df, newName, student)
      return df
    }
  }
}

function getDriveFileIfLastFirstExists(
  joinedSegments: string,
  df: DriveFile,
  students: Student[],
  ext: string | null,
  segments: string[],
  segment: string | null,
  includeSuffix: boolean,
  includeGakunenHrHrNo: boolean,
  gakunenHrHrNoStart: boolean,
) {
  logger.debug(
    `✅ in getDriveFileIfLastFirstExists: ${segments},  ${students.length} students`,
  )

  // let hr = rxRes?.hr?.toUpperCase() as Hr
  // let hrNo = rxRes?.hrNo
  // loop through students to find match
  for (let i = 0; i < students.length; i++) {
    const student = students[i]

    // regex for searching student last and first name
    const reg = /`${student.last}`[\s-_]?`${student.first}`/

    console.log(
      "✅ includes",
      "last",
      student.last,
      "first",
      student.first,
      "joinedSegments",
      joinedSegments,
      "includes last",
      joinedSegments.includes(student.last),
      "includes first",
      joinedSegments.includes(student.first),
      "match reg",
      joinedSegments.match(reg),
    )

    // check if segments include student last and first name
    if (
      (joinedSegments.includes(student.last) &&
        joinedSegments.includes(student.first)) ||
      segments.includes(`${student.last}${student.first}`) ||
      joinedSegments.match(reg)
    ) {
      console.log("✅ found student", student.last, student.first)
      const newName = createNewName(
        student,
        segments,
        ext,
        segment,
        includeSuffix,
        includeGakunenHrHrNo,
        gakunenHrHrNoStart,
      )
      df = addNewNameToMeta(df, newName, student)
      return df
    }
  }

  df.meta = {
    ...df.meta,
    file: {
      ...df.meta?.file,
      name: "NO_NAME",
    },
  }
  return df
}

function addNewNameToMeta(df: DriveFile, newName: string, student: Student) {
  const tmp = { ...df }
  tmp.meta = {
    ...tmp.meta,
    student,
    file: {
      ...tmp.meta?.file,
      name: newName,
    },
  }
  return tmp
}

function createNewName(
  students: Student,
  segments: string[],
  extension: string | null,
  segment: string | null,
  includeSuffix = true,
  includeGakunenHrHrNo = true,
  gakunenHrHrNoStart = false,
) {
  const cleanedSegments: string[] = []
  segments.forEach((s) => {
    // match "A", "A40", "40"
    const reg1 = /(^[A-E]{1}[0-9]{1,2}$)|(^[A-E]$)|(^[0-9]{1,2}$)/
    // match "聖学院太郎", "太郎", "聖学院"
    const reg2 = `(${students.last})|(^${students.first})`

    // match gakuseki
    const reg3 = /[0-9]{7}/

    if (!s.match(reg1) && !s.match(reg2) && !s.match(reg3)) {
      cleanedSegments.push(s)
    }
  })

  let newName = `b${students.gakuseki}`

  const hrNoPadded = students.hrNo.toString().padStart(2, "0")

  // logger.debug(`✅ createNewName: gakunenHrHrNoStart ${gakunenHrHrNoStart}`)
  // logger.debug(`✅ createNewName: includeGakunenHrHrNo ${includeGakunenHrHrNo}`)

  if (gakunenHrHrNoStart) {
    newName = `${students.gakunen}_${students.hr}${hrNoPadded}_${newName}_${students.last}${students.first}`
    // logger.debug(
    //   `✅ createNewName: in gakunenHrHrNoStart 001 newName ${newName}`,
    // )
  } else if (includeGakunenHrHrNo) {
    newName = `${newName}_${students.gakunen}_${students.hr}${hrNoPadded}_${students.last}${students.first}`
    // logger.debug(
    //   `✅ createNewName: in gakunenHrHrNoStart 002 newName ${newName}`,
    // )
  } else {
    newName = `${newName}_${students.last}${students.first}`
    // logger.debug(
    //   `✅ createNewName: in gakunenHrHrNoStart 003 newName ${newName}`,
    // )
  }

  if (segment) {
    newName = `${newName}_${segment}`
  }

  const suffix = cleanedSegments.join("_")

  if (includeSuffix) {
    newName = `${newName}_${suffix}`
  }

  if (extension) return newName + extension
  else return newName
}
