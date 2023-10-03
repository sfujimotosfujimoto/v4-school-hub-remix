import { json } from "@remix-run/node"

import { getSheets, getStudents } from "./google/sheets.server"

import type { TypedResponse } from "@remix-run/node"
import type { Student } from "~/types"

export async function getStudentDataResponse(accessToken: string): Promise<
  TypedResponse<{
    studentData: Student[]
  }>
> {
  try {
    const sheets = await getSheets(accessToken)
    if (!sheets) throw Error("No sheets")

    const studentData = await getStudents(sheets)
    return json({ studentData })
  } catch (error) {
    throw new Response("Unauthorized google account", {
      status: 403,
      statusText: `You are not authorized to the spreadsheet.`,
    })
  }
}
