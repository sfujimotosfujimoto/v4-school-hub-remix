import { json } from "@remix-run/node"
import type { drive_v3 } from "googleapis"
import { z } from "zod"
import { errors } from "~/lib/errors"
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
import { redirectToSignin } from "~/lib/responses"
import { getUserFromSession } from "~/lib/session.server"
import { getIdFromUrl, getStudentEmail } from "~/lib/utils"
import { logger } from "~/logger"
import type { ActionTypeGoogle, DriveFile, Gakunen, Hr, Student } from "~/types"

// Zod Data Type
const FormDataScheme = z.object({
  _action: z.string(),
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

export async function searchRenameAction(request: Request, formData: FormData) {
  logger.debug(`🍎 rename: searchAction()`)
  const user = await getUserFromSession(request)
  if (!user || !user.credential) throw redirectToSignin(request)
  await requireAdminRole(request, user)

  const accessToken = user.credential.accessToken

  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return json<ActionTypeGoogle>(
      {
        ok: false,
        type: "error",
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
    throw errors.google()
  }

  // get sheets
  const sheets = await getSheets(accessToken)
  if (!sheets) {
    throw errors.google()
  }

  // get id from if `sourceFolderId` is url
  const sourceId = getIdFromUrl(sourceFolderId || "")
  if (!sourceId)
    return json<ActionTypeGoogle>(
      { ok: false, type: "error", error: "フォルダIDが取得できません" },
      { status: 400 },
    )

  const query = queryFolderId(sourceId)
  if (!query)
    return json<ActionTypeGoogle>(
      {
        ok: false,
        type: "error",
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
        type: "error",
        error: "Google Driveにファイルがありません。",
      },
      { status: 400 },
    )

  // add student permission to driveFiles meta
  // also add studentEmail to meta.file
  if (driveFiles) await addPermissionToDriveFiles(drive, driveFiles)

  const students = await getStudents(sheets)
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
    type: "search",
    data,
  })
}

// add student permission to driveFiles meta
// then add studentEmail to meta.file
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

export async function findStudentDataFromSegments(
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

// then create new name and add to meta.file
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
  const segments = Array.from(new Set(nameNoExt.split(/[-_.]/)))
  df.meta = {
    ...df.meta,
    file: {
      ...df.meta?.file,
      segments,
    },
  }

  // get joined segments
  const joinedSegments = segments.join("")
  // logger.debug(
  //   `✅ _findStudentDataFromSegments: joinedSegments ${joinedSegments}`,
  // )
  // logger.debug(`✅ df.meta: ${JSON.stringify(df.meta, null, 2)}}`)

  // look up if studentEmail is set in meta.file
  // is so, find students from studentEmail
  if (df.meta.file?.studentEmail) {
    logger.debug(`✅ _findStudentDataFromSegments: in studentEmail`)
    const student = students.find((sd) => {
      return sd.email === df.meta?.file?.studentEmail
    })

    if (student) {
      df.meta = {
        ...df.meta,
        student,
        file: {
          ...df.meta?.file,
          name: createNewName(
            student,
            segments,
            ext,
            segment,
            includeSuffix,
            includeGakunenHrHrNo,
            gakunenHrHrNoStart,
          ),
        },
      }
      return df
    } else {
      errors.server(
        `メールアドレス ${df.meta.file?.studentEmail} の生徒が名簿から見つかりません。`,
      )
    }
  }

  // get student by gakuseki
  const gakusekiString = segments.find((s) => s.match(/([0-9]{7})|(b[0-9]{7})/))
  const gMatches = gakusekiString?.match(/[0-9]{7}|b([0-9]{7})/)
  const gakuseki = gMatches?.at(1) ?? gMatches?.at(0)

  // logger.debug(
  //   `✅ _findStudentDataFromSegments: gakusekiString ${gakusekiString}`,
  // )
  // logger.debug(`✅ _findStudentDataFromSegments: gMatches ${gMatches}`)
  // logger.debug(`✅ _findStudentDataFromSegments: gakuseki ${gakuseki}`)

  if (gakuseki) {
    const student = students.find((sd) => String(sd.gakuseki) === gakuseki)

    // logger.debug(
    //   `✅ _findStudentDataFromSegments: student ${student?.email}, students ${students.length}`,
    // )

    if (student) {
      df.meta = {
        ...df.meta,
        student,
        file: {
          ...df.meta?.file,
          name: createNewName(
            student,
            segments,
            ext,
            segment,
            includeSuffix,
            includeGakunenHrHrNo,
            gakunenHrHrNoStart,
          ),
        },
      }

      return df
    }
  }

  // logger.debug(
  //   `✅ _findStudentDataFromSegments: {joinedSegments}
  //   ✨ ${JSON.stringify({ joinedSegments }, null, 2)}`,
  // )

  // look up student by Hr, HrNo, and Gakunen
  if (gakunen !== `ALL`) {
    const rx = /(?<hr>[A-F])組(?<hrNo>[0-9]{1,2})番/g

    const rxRes = rx.exec(joinedSegments)?.groups as {
      hr: Hr
      hrNo: string
    }

    if (rxRes?.hr && rxRes?.hrNo) {
      const student = getStudentByGakunenHrHrNo(
        gakunen,
        rxRes.hr,
        Number(rxRes.hrNo),
        students,
      )

      if (student) {
        df.meta = {
          ...df.meta,
          student,
          file: {
            ...df.meta?.file,
            name: createNewName(
              student,
              segments,
              ext,
              segment,
              includeSuffix,
              includeGakunenHrHrNo,
              gakunenHrHrNoStart,
            ),
          },
        }
        return df
      }
    }
  }

  // loop through students to find match
  for (let i = 0; i < students.length; i++) {
    const student = students[i]

    // regex for searching student last and first name
    const reg = new RegExp(`${student.last}${student.first}`)

    if (
      (segments.includes(student.last) && segments.includes(student.first)) ||
      segments.includes(`${student.last}${student.first}`) ||
      joinedSegments.match(reg)
    ) {
      df.meta = {
        ...df.meta,
        student,
        file: {
          ...df.meta?.file,
          name: createNewName(
            student,
            segments,
            ext,
            segment,
            includeSuffix,
            includeGakunenHrHrNo,
            gakunenHrHrNoStart,
          ),
        },
      }
      return df
    }
  }
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
