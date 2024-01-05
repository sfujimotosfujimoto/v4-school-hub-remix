import type {
  HeadersFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import {
  Outlet,
  useLoaderData,
  useParams,
  useRouteError,
} from "@remix-run/react"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import DriveFilesProvider from "~/context/drive-files-context"
import NendoTagsProvider from "~/context/nendos-tags-context"
import { getDrive } from "~/lib/google/drive.server"
import {
  getSheets,
  getStudentByFolderId,
  getStudents,
} from "~/lib/google/sheets.server"
import { requireUserRole } from "~/lib/require-roles.server"
import { redirectToSignin } from "~/lib/responses"
import { getUserFromSession } from "~/lib/session.server"
import { logger } from "~/logger"
import StudentHeader from "./components/student-header"

const CACHE_MAX_AGE = 60 * 10 // 10 minutes

/**
 * Loader
 * get
 * - rows: DriveFileData[]
 * - student: StudentData
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: student.$studentFolderId ${request.url}`)
  const user = await getUserFromSession(request)
  if (!user || !user.credential) throw redirectToSignin(request)
  await requireUserRole(request, user)

  const accessToken = user.credential.accessToken

  // get studentFolderId from params
  const studentFolderId = params.studentFolderId
  if (!studentFolderId) throw redirectToSignin(request)

  try {
    const drive = await getDrive(user.credential.accessToken)
    if (!drive) throw redirect("/?authstate=unauthorized-026")

    // get sheets
    const sheets = await getSheets(accessToken)
    if (!sheets) throw redirect(`/?authstate=unauthenticated`)

    // get StudentData[] from spreadsheet
    const students = await getStudents(sheets)

    // get StudentData from folder id
    const student = getStudentByFolderId(studentFolderId, students)
    if (!student) throw redirectToSignin(request)

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
  } catch (error) {
    console.error(error)
    throw redirectToSignin(request)
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
