import type { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { json, useLoaderData, useNavigation } from "@remix-run/react"
import AllCheckButtons from "~/components/ui/buttons/all-check-buttons"
import BackButton from "~/components/ui/buttons/back-button"
import NendoPills from "~/components/ui/pills/nendo-pills"
import TagPills from "~/components/ui/pills/tag-pills"
import StudentCards from "~/components/ui/student-card/student-cards"
import { errorResponses } from "~/lib/error-responses"
import { getDrive, getDriveFiles } from "~/lib/google/drive.server"
import {
  getSheets,
  getStudentByFolderId,
  getStudents,
} from "~/lib/google/sheets.server"
import { redirectToSignin } from "~/lib/responses"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { setSelected } from "~/lib/utils.server"
import { filterSegments, parseTags } from "~/lib/utils/utils"
import { convertDriveFiles } from "~/lib/utils/utils-loader"
import { logger } from "~/logger"
import type { DriveFile, Student } from "~/types"
import AllPill from "./all-pill"
import ExtensionPills from "./extensions-pills"
import FileCount from "./file-count"
import SegmentPills from "./segment-pills"

const CACHE_MAX_AGE = 60 * 10 // 10 minutes

/**
 * Loader
 * get
 * - rows: DriveFileData[]
 * - student: StudentData
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: student.$studentFolderId ${request.url}`)

  const { studentFolderId } = params
  if (!studentFolderId) {
    throw errorResponses.badRequest(`GoogleフォルダIDが設定されていません。`)
  }

  const { user, credential } = await getUserFromSessionOrRedirect(request)

  const accessToken = credential.accessToken

  const url = new URL(request.url)
  const nendoString = url.searchParams.get("nendo")
  const tagString = url.searchParams.get("tags")
  const segmentsString = url.searchParams.get("segments")
  const extensionsString = url.searchParams.get("extensions")

  try {
    const drive = await getDrive(accessToken)
    if (!drive) throw redirectToSignin(request)

    // get sheets
    const sheets = await getSheets(accessToken)
    if (!sheets) throw redirectToSignin(request)

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
    if (students.length === 0) {
      throw errorResponses.google()
    }

    // get StudentData from folder id
    const student = getStudentByFolderId(studentFolderId, students)
    if (!student) {
      throw errorResponses.google()
    }

    const { nendos, segments, extensions, tags } =
      getNendosSegmentsExtensionsTags(driveFiles, student)

    const headers = new Headers()

    headers.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`) // 10 minutes

    return json(
      {
        studentFolderId,
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

/**
 * StudentFolderIndexPage Component
 */
export default function StudentFolderIdIndexPage() {
  const navigation = useNavigation()
  const isNavigating = navigation.state !== "idle"

  const {
    studentFolderId,
    url,
    nendos,
    tags,
    extensions,
    segments,
    // student,
    driveFiles,
    role,
  } = useLoaderData<SerializeFrom<typeof loader>>()

  const dfd = convertDriveFiles(driveFiles)

  // JSX -------------------------
  return (
    <section className="flex h-full flex-col space-y-4">
      <div className="flex flex-none items-center justify-between">
        <BackButton />
        <FileCount driveFiles={dfd} />
      </div>

      <div className="flex flex-none flex-wrap gap-1">
        <AllPill url={url} studentFolderId={studentFolderId} />
        {nendos.length > 0 && (
          <div className="divider divider-horizontal mx-0"></div>
        )}
        <AllCheckButtons role={role} driveFiles={dfd} />
        <NendoPills url={url} nendos={nendos} />
        {tags.length > 0 && (
          <div className="divider divider-horizontal mx-0"></div>
        )}
        <TagPills url={url} tags={tags} />
        {extensions.length > 0 && (
          <div className="divider divider-horizontal mx-0"></div>
        )}
        <ExtensionPills url={url} extensions={extensions} />
        {segments.length > 0 && (
          <div className="divider divider-horizontal mx-0"></div>
        )}
        <SegmentPills url={url} segments={segments} />
      </div>

      {/* STUDENTCARDS */}
      <div className="mb-12 mt-4 overflow-x-auto px-2">
        <StudentCards
          role={role}
          driveFiles={dfd}
          isNavigating={isNavigating}
        />
      </div>
    </section>
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

// @note student.$studentFolderId._index/route.tsx: This is needed because appProperties is sometimes string and sometimes object
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
