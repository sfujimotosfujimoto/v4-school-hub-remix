import { json, redirect } from "@remix-run/node"
import { Outlet, useLoaderData } from "@remix-run/react"
import type {
  HeadersFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
import invariant from "tiny-invariant"

// components
import StudentHeader from "./components/student-header"

// functions
import { getDrive, getDriveFiles } from "~/lib/google/drive.server"
import {
  getSheets,
  getStudentByFolderId,
  getStudents,
} from "~/lib/google/sheets.server"
import { requireUserRole2 } from "~/lib/require-roles.server"
import { destroyUserSession } from "~/lib/session.server"
import { filterSegments, parseTags } from "~/lib/utils"
import { setSelected } from "~/lib/utils.server"

// context
import DriveFilesProvider from "~/context/drive-files-context"
import NendoTagsProvider from "~/context/nendos-tags-context"
import { authenticate2 } from "~/lib/authenticate.server"
import { logger } from "~/logger"

/**
 * StudentFolderIdLayout
 */
export default function StudentFolderIdLayout() {
  const { student } = useLoaderData<typeof loader>()

  // JSX -------------------------
  return (
    <DriveFilesProvider>
      <NendoTagsProvider>
        <div
          data-name="student.$studentFolderId"
          className="container mx-auto h-full p-4 sm:p-8"
        >
          <div className="mb-4 space-y-4">
            {student && <StudentHeader student={student} />}
          </div>
          <Outlet />
        </div>
      </NendoTagsProvider>
    </DriveFilesProvider>
  )
}

/**
 * Loader
 * get
 * - rows: DriveFileData[]
 * - student: StudentData
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  logger.debug(`✅ loader: student.$studentFolderId ${request.url}`)
  const { user } = await authenticate2(request)
  await requireUserRole2(user)

  if (!user || !user.credential) {
    return destroyUserSession(request, `/?authstate=unauthenticated`)
  }
  const accessToken = user.credential.accessToken

  // get studentFolderId from params
  const studentFolderId = params.studentFolderId
  invariant(studentFolderId, "studentFolder in params is required")

  try {
    const drive = await getDrive(user.credential.accessToken)
    if (!drive) throw redirect("/?authstate=unauthorized-026")

    // get sheets
    const sheets = await getSheets(accessToken)
    if (!sheets) throw redirect(`/?authstate=unauthenticated`)

    // call drive and get DriveFileData[] of student
    let driveFiles = await getDriveFiles(
      drive,
      `trashed=false and '${studentFolderId}' in parents`,
    )

    driveFiles = driveFiles ? setSelected(driveFiles, true) : []

    // get StudentData[] from spreadsheet
    const students = await getStudents(sheets)

    // get StudentData from folder id
    const student = getStudentByFolderId(studentFolderId, students)

    let segments = Array.from(
      new Set(driveFiles?.map((d) => d.name.split(/[-_.]/)).flat()),
    )

    segments = filterSegments(segments, student)

    // get ex. "pdf", "document"
    const extensions =
      Array.from(new Set(driveFiles?.map((d) => d.mimeType))).map(
        (ext) => ext.split(/[/.]/).at(-1) || "",
      ) || []

    const tags: Set<string> = new Set(
      driveFiles
        ?.map((df) => {
          if (df.appProperties?.tags)
            return parseTags(df.appProperties.tags) || null
          return null
        })
        .filter((g): g is string[] => g !== null)
        .flat(),
    )
    const nendos: Set<string> = new Set(
      driveFiles
        ?.map((df) => {
          if (df.appProperties?.nendo)
            return df.appProperties.nendo.trim() || null
          return null
        })
        .filter((g): g is string => g !== null)
        .flat(),
    )

    return json(
      {
        extensions,
        segments,
        driveFiles,
        student,
        tags: Array.from(tags),
        nendos: Array.from(nendos),
        role: user.role,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": `max-age=${60 * 10}`,
        },
      },
    )
  } catch (error) {
    console.error(error)
    throw redirect("/?authstate=unauthorized-027")
  }
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    ...loaderHeaders,
  }
}

/**
 * Meta Function
 */
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.student) return []
  const title =
    `${data?.student.gakunen}${data?.student.hr}${data?.student.hrNo}${data?.student.last}${data?.student.first}` ||
    ""

  return [
    {
      title: `${title} | SCHOOL HUB`,
    },
  ]
}
