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
import invariant from "tiny-invariant"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import DriveFilesProvider from "~/context/drive-files-context"
import NendoTagsProvider from "~/context/nendos-tags-context"
import { getDrive, getDriveFiles } from "~/lib/google/drive.server"
import {
  getSheets,
  getStudentByFolderId,
  getStudents,
} from "~/lib/google/sheets.server"
import { requireUserRole } from "~/lib/require-roles.server"
import { redirectToSignin } from "~/lib/responses"
import { getUserFromSession } from "~/lib/session.server"
import { filterSegments, parseTags } from "~/lib/utils"
import { setSelected } from "~/lib/utils.server"
import { logger } from "~/logger"
import type { DriveFile, Student } from "~/type.d"
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
  invariant(studentFolderId, "studentFolder in params is required")

  const url = new URL(request.url)
  const nendoString = url.searchParams.get("nendo")
  const tagString = url.searchParams.get("tags")
  const segmentsString = url.searchParams.get("segments")
  const extensionsString = url.searchParams.get("extensions")

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

    // Filter by nendo, tags, segments, extensions
    driveFiles = getFilteredDriveFiles(
      driveFiles || [],
      nendoString,
      tagString,
      segmentsString,
      extensionsString,
    )

    // get StudentData[] from spreadsheet
    const students = await getStudents(sheets)

    // get StudentData from folder id
    const student = getStudentByFolderId(studentFolderId, students)
    if (!student) throw redirectToSignin(request)

    const { nendos, segments, extensions, tags } =
      getNendosSegmentsExtensionsTags(driveFiles, student)

    const headers = new Headers()

    headers.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`) // 10 minutes

    return json(
      {
        nendoString,
        tagString,
        url: request.url,
        nendos,
        segments,
        extensions,
        tags,
        driveFiles,
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

function getFilteredDriveFiles(
  driveFiles: DriveFile[],
  nendoString: string | null,
  tagString: string | null,
  segmentsString: string | null,
  extensionsString: string | null,
) {
  // filter by nendo
  if (nendoString) {
    driveFiles =
      driveFiles?.filter((df) => {
        const props = JSON.parse(df.appProperties || "[]")
        if (props.nendo === nendoString) return true
        return false
      }) || []
  }

  // filter by tag
  if (tagString) {
    driveFiles =
      driveFiles?.filter((df) => {
        const props = JSON.parse(df.appProperties || "[]")
        if (props.tags) {
          const tagsArr = parseTags(props.tags)
          return tagsArr.includes(tagString || "")
        }
        return false
      }) || []
  }

  // filter by extensions
  if (extensionsString) {
    driveFiles =
      driveFiles?.filter((df) => {
        const ext = df.mimeType.split(/[/.]/).at(-1) || ""
        return ext === extensionsString
      }) || []
  }

  // filter by segments
  if (segmentsString) {
    driveFiles =
      driveFiles?.filter((df) => {
        const segments = df.name.split(/[-_.]/)
        return segments.includes(segmentsString)
      }) || []
  }

  return (
    driveFiles.sort(
      (a, b) =>
        new Date(b.modifiedTime || 0).getTime() -
        new Date(a.modifiedTime || 0).getTime(),
    ) || []
  )
}

function getNendosSegmentsExtensionsTags(
  driveFiles: DriveFile[],
  student: Omit<Student, "users">,
) {
  let segments: string[] = Array.from(
    new Set(driveFiles?.map((d) => d.name.split(/[-_.]/)).flat()),
  )

  segments = filterSegments(segments, student)

  const extensions: string[] =
    Array.from(new Set(driveFiles?.map((d) => d.mimeType))).map(
      (ext) => ext.split(/[/.]/).at(-1) || "",
    ) || []

  const tags: string[] = Array.from(
    new Set(
      driveFiles
        ?.map((df) => {
          if (!df.appProperties) return null
          let appProps = parseAppProperties(df.appProperties)
          if (appProps.tags) return parseTags(appProps.tags) || null
          return null
        })
        .filter((g): g is string[] => g !== null)
        .flat(),
    ),
  ).sort()

  const nendos: string[] = Array.from(
    new Set(
      driveFiles
        ?.map((df) => {
          if (!df.appProperties) return null
          let appProps = parseAppProperties(df.appProperties)
          if (appProps.nendo) return appProps.nendo.trim() || null
          return null
        })
        .filter((g): g is string => g !== null)
        .flat(),
    ),
  )
    .sort((a, b) => Number(b) - Number(a))
    .filter((n): n is string => n !== null)

  return {
    nendos,
    segments,
    extensions,
    tags,
  }
}

// TODO: This is needed because appProperties is sometimes string and sometimes object
// I was storing it as an json object in db but found out that it is
// better to store as string for future proofing
function parseAppProperties(appProperties: string | object) {
  if (!appProperties) return null
  let appProps: any = {}
  if (typeof appProperties === "string") {
    appProps = JSON.parse(appProperties || "[]")
  } else if (typeof appProperties === "object") {
    appProps = appProperties
  }
  return appProps
}

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
