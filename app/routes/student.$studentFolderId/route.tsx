import type {
  HeadersFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
import { json } from "@remix-run/node"
import {
  Outlet,
  useLoaderData,
  useParams,
  useRouteError,
} from "@remix-run/react"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import DriveFilesProvider from "~/context/drive-files-context"
import NendoTagsProvider from "~/context/nendos-tags-context"
import { errorResponses } from "~/lib/error-responses"
import { getDrive } from "~/lib/google/drive.server"
import {
  getSheets,
  getStudentByFolderId,
  getStudents,
} from "~/lib/google/sheets.server"
import { requireUserRole } from "~/lib/require-roles.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { logger } from "~/logger"
import StudentHeader from "./student-header"

const CACHE_MAX_AGE = 60 * 10 // 10 minutes

/**
 * Loader
 * get
 * - rows: DriveFileData[]
 * - student: StudentData
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: student.$studentFolderId ${request.url}`)
  const { user, credential } = await getUserFromSessionOrRedirect(request)
  await requireUserRole(request, user)

  const accessToken = credential.accessToken

  // get studentFolderId from params
  const studentFolderId = params.studentFolderId

  if (!studentFolderId) {
    throw errorResponses.badRequest(`フォルダIDが設定されていません。`)
  }

  const drive = await getDrive(credential.accessToken)
  if (!drive) {
    throw errorResponses.google()
  }

  // get sheets
  const sheets = await getSheets(accessToken)
  if (!sheets) {
    throw errorResponses.google()
  }

  // get StudentData[] from spreadsheet
  const students = await getStudents(sheets)
  if (students.length === 0) {
    throw errorResponses.google()
  }

  // get StudentData from folder id
  const student = getStudentByFolderId(studentFolderId, students)
  if (!student) {
    throw errorResponses.google()
  }

  const headers = new Headers()

  headers.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`) // 10 minutes

  return json(
    {
      student,
      role: user.role,
    },
    {
      headers,
    },
  )
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
      title: `${title} | SCHOOL HUB TEACHER`,
    },
  ]
}

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

// TODO: This is needed because appProperties is sometimes string and sometimes object
// I was storing it as an json object in db but found out that it is
// better to store as string for future proofing
// function parseAppProperties(appProperties: string | object) {
//   if (!appProperties) return null
//   let appProps: any = {}
//   if (typeof appProperties === "string") {
//     appProps = JSON.parse(appProperties || "[]")
//   } else if (typeof appProperties === "object") {
//     appProps = appProperties
//   }
//   return appProps
// }

/**
 * Error Boundary
 */
export function ErrorBoundary() {
  const { studentFolderId } = useParams()
  const error = useRouteError()
  console.error(error)
  let message = `フォルダID（${studentFolderId}）からフォルダを取得できませんでした。`
  return <ErrorBoundaryDocument message={message} />
}
