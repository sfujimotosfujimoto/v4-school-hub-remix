import { redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import type { LoaderFunctionArgs } from "@remix-run/node"

import type { DriveFile } from "~/types"

// components
import StudentCards from "~/components/ui/student-card/student-cards"
// functions
import {
  getDrive,
  getDriveFiles,
  queryMultipleStudentsAndFilename,
} from "~/lib/google/drive.server"
import { getSheets, getStudents } from "~/lib/google/sheets.server"
import { requireUserRole2 } from "~/lib/require-roles.server"
import { setSelected } from "~/lib/utils.server"
import type { Role } from "@prisma/client"
import { authenticate2 } from "~/lib/authenticate.server"
import { logger } from "~/logger"

/**
 * loader function
 */
export default function FilesGakunenHrQueryPage() {
  let { driveFiles, role } = useLoaderData<typeof loader>()

  if (driveFiles.length === 0) {
    return (
      <p>
        <span className="btn btn-warning btn-xs m-1">ファイル名</span>
        を選択してください。
      </p>
    )
  }

  return (
    <div
      data-name="files.$gakunen.$hr._index"
      className="mb-12 overflow-x-auto"
    >
      <div
        data-name="file count"
        className="absolute right-0 top-16 ml-1 inline-block"
      >
        <span className="text-md  rounded-md bg-slate-300 p-1">
          {driveFiles.length} files
        </span>
      </div>
      {driveFiles && role && (
        <StudentCards role={role} driveFiles={driveFiles} />
      )}
    </div>
  )
}

/**
 * loader function
 */
export async function loader({ request, params }: LoaderFunctionArgs): Promise<{
  driveFiles: DriveFile[]
  role: Role
}> {
  logger.debug(`✅ loader: files.$gakunen.$hu._index ${request.url}`)
  const { user } = await authenticate2(request)
  await requireUserRole2(user)
  if (!user || !user.credential) throw redirect("/?authstate=unauthenticated")

  if (!user?.credential) throw redirect("/?authstate-025")
  const accessToken = user.credential.accessToken

  // get sheets
  const sheets = await getSheets(accessToken)
  if (!sheets) throw redirect(`/?authstate=unauthenticated`)

  const { gakunen, hr } = params

  const url = new URL(request.url)
  const q = url.searchParams.getAll("q")

  if (!gakunen || !hr || !q || q.length === 0)
    return { driveFiles: [], role: user.role }

  // get StudentData from sheet
  const studentData = await getStudents(sheets)
  if (!studentData || studentData.length === 0)
    throw redirect(`/?authstate=no-student-data`)

  // create querystring from gakunen/hr/query
  const searchQuery = queryMultipleStudentsAndFilename(
    studentData,
    gakunen,
    hr,
    q,
  )

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized")

  // get Files from Drive
  let driveFiles = await getDriveFiles(drive, searchQuery)

  if (!driveFiles) return { driveFiles: [], role: user.role }
  driveFiles = driveFiles ? setSelected(driveFiles, true) : []

  return {
    driveFiles: driveFiles || [],
    role: user.role,
  }
}
