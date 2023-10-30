import { google } from "googleapis"
import invariant from "tiny-invariant"

import { getFolderId } from "../utils"
import { getClient } from "./google.server"

import type { sheets_v4 } from "googleapis"
import type { Gakunen, Hr, Student } from "~/types"
import { logger } from "~/logger"

/**
 * # getSheets()
 * - gets Drive instance
 */
export async function getSheets(
  accessToken: string,
): Promise<sheets_v4.Sheets | null> {
  logger.debug(`✅ getSheets:`)
  const client = await getClient(accessToken)

  if (client) {
    const sheets = google.sheets({
      version: "v4",
      auth: client,
    })
    return sheets
  }
  return null
}

export async function getStudents(
  sheets: sheets_v4.Sheets,
  gakunen: Gakunen = "ALL",
  hr: Hr = "ALL",
) {
  logger.debug(`✅ getStudents:`)
  const meiboSheetId = process.env.GOOGLE_API_MEIBO_SHEET_URI
  invariant(meiboSheetId, "No meibo sheet id")

  try {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: meiboSheetId,
      range: "MEIBO!A2:J916",
      valueRenderOption: "UNFORMATTED_VALUE",
    })

    const data = resp.data.values

    if (!data || data.length === 0) {
      throw new Error(`Could not get data"`)
    }

    let students: Student[] = data.map((d) => {
      return {
        gakuseki: (d[0] || 0) as number,
        gakunen: d[1] as string,
        hr: d[2] as string,
        hrNo: Number(d[3]) as number,
        last: d[4] as string,
        first: d[5] as string,
        sei: d[6] as string,
        mei: d[7] as string,
        email: d[8] as string,
        folderLink: (d[9] || null) as string | null,
      }
    })

    // filter gakunen
    if (gakunen !== "ALL") {
      students = students.filter((d) => d.gakunen === gakunen)
    }

    // filter hr
    if (hr !== "ALL") {
      students = students.filter((d) => d.hr === hr)
    }

    return students
  } catch (err) {
    throw Error(`Something went wrong getting data from spreadsheet. ${err}`)
  }
}

export function getStudentByFolderId(
  folderId: string,
  studentData: Student[],
): Student | null {
  logger.debug(`✅ getStudentByFolderId:`)
  const studentD = studentData.find(
    (d) => d.folderLink && folderId === getFolderId(d.folderLink),
  )

  if (studentD) return studentD

  return null
}

export async function getStudentDataWithAccessToken(
  sheets: sheets_v4.Sheets,
): Promise<Student[]> {
  logger.debug(`✅ getStudentDataWithAccessToken:`)
  const meiboSheetId = process.env.GOOGLE_API_MEIBO_SHEET_URI
  invariant(meiboSheetId, "No meibo sheet id")

  try {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: meiboSheetId,
      range: "MEIBO!A2:J916",
      valueRenderOption: "UNFORMATTED_VALUE",
    })

    const data = resp.data.values

    if (!data || data.length === 0) {
      throw new Error(`Could not get data"`)
    }

    const studentData: Student[] = data.map((d) => {
      return {
        gakuseki: (d[0] || 0) as number,
        gakunen: d[1] as string,
        hr: d[2] as string,
        hrNo: Number(d[3]) as number,
        last: d[4] as string,
        first: d[5] as string,
        sei: d[6] as string,
        mei: d[7] as string,
        email: d[8] as string,
        folderLink: (d[9] || null) as string | null,
      }
    })
    return studentData
  } catch (err) {
    throw Error(`Something went wrong getting data from spreadsheet. ${err}`)
  }
}

export function getStudentByGakunenHrHrNo(
  gakunen: Gakunen,
  hr: Hr,
  hrNo: number,
  students: Student[],
): Student | null {
  logger.debug(`✅ getStudentByGakunenHrHrNo:`)
  const studentD = students.find(
    (sd) => sd.gakunen === gakunen && sd.hr === hr && sd.hrNo === hrNo,
  )

  if (studentD) return studentD

  return null
}
