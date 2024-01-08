import type { LoaderFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Outlet, useLoaderData, useParams } from "@remix-run/react"
import React from "react"
import { NavLinkButton } from "~/components/buttons/button"
import { LogoIcon } from "~/components/icons"
import BackButton from "~/components/ui/buttons/back-button"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import DriveFilesProvider from "~/context/drive-files-context"
import NendoTagsProvider from "~/context/nendos-tags-context"
import {
  getDrive,
  getDriveFiles,
  querySampledStudent,
} from "~/lib/google/drive.server"
import { getSheets, getStudents } from "~/lib/google/sheets.server"
import { getUserFromSession } from "~/lib/session.server"
import { filterStudentNameSegments } from "~/lib/utils"
import { setSelected } from "~/lib/utils.server"
import { logger } from "~/logger"

/**
 * loader function
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: files.$gakunen.$hr ${request.url}`)
  const user = await getUserFromSession(request)

  // if search params are empty, return empty segments
  let { searchParams } = new URL(request.url)
  let q = searchParams.get("query")
  // const q = new URL(request.url).searchParams.get("q")
  if (q) {
    return { segments: [] }
  }

  if (!user || !user.credential) throw redirect("/?authstate=unauthenticated")

  const accessToken = user.credential.accessToken

  // get sheets
  const sheets = await getSheets(accessToken)
  if (!sheets) throw redirect(`/?authstate=unauthenticated`)

  const { gakunen, hr } = params

  if (!gakunen || !hr) return { segments: [] }
  if (gakunen === "ALL" || hr === "ALL") return { segments: [] }

  let students = await getStudents(sheets)
  if (!students || students.length === 0)
    throw redirect(`/?authstate=no-student-data`)

  students = students.filter((s) => s.gakunen === gakunen && s.hr === hr)

  // get sampled students from gakunen/hr (about 10)
  const query = querySampledStudent(students, gakunen, hr)

  logger.debug(`🍿 loader: files.$gakunen.$hr query ${query}`)

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-024")

  // get all files from Drive
  let driveFiles = await getDriveFiles(drive, query)
  driveFiles = driveFiles ? setSelected(driveFiles, true) : []

  if (!driveFiles) return { segments: [] }

  // create segments from StudentData
  const segments = filterStudentNameSegments(driveFiles, students)

  return {
    segments,
  }
}

/**
 * Layout for files.$gakunen.$hr
 */
export default function FilesGakunenHrLayout() {
  const { segments } = useLoaderData<typeof loader>()
  const { gakunen, hr, query } = useParams()

  const [checkedSegments, setCheckedSegments] = React.useState<string[]>([])

  const [searchParams, setSearchParams] = React.useState("")

  React.useEffect(() => {
    const checkedArr = checkedSegments.map((s) => ["q", s])
    const checkedParams = new URLSearchParams(checkedArr)
    setSearchParams(checkedParams.toString())
  }, [checkedSegments])

  // HTML
  return (
    <div data-name="files.$gakunen.$hr_(Layout)" className="relative">
      <div
        data-name="GakunenHeader"
        className="mb-4 flex items-center border-b-4 border-sfred-400 text-4xl font-semibold decoration-sfred-400 underline-offset-4"
      >
        <h1>{gakunen === "ALL" ? "" : gakunen}</h1>
        <h1>{hr === "ALL" ? "" : hr}</h1>
        <h1 className=" pl-4 text-2xl font-normal">
          {query ? `- ${query}` : null}
        </h1>
      </div>

      <div className="mb-4 flex items-center gap-4">
        {/* Back Button */}
        <BackButton isLink={true} to={`/files`} />
        {/* GO button */}
        <NavLinkButton
          to={`/files/${gakunen}/${hr}?${encodeURI(searchParams)}`}
          className={` ${
            gakunen === "ALL" || hr === "ALL" ? "btn-disabled" : null
          }`}
          size="sm"
        >
          <LogoIcon className="h-7 w-4" />
          <span className=" ml-2 sm:ml-4 sm:inline">GO</span>
        </NavLinkButton>
      </div>

      {/* Segments */}
      {segments && segments.length > 0 && (
        <div data-name="segments">
          <Segments
            checkedSegments={checkedSegments}
            setCheckedSegments={setCheckedSegments}
            segments={segments}
          />
        </div>
      )}
      <DriveFilesProvider>
        <NendoTagsProvider>
          <Outlet />
        </NendoTagsProvider>
      </DriveFilesProvider>
    </div>
  )
}

function Segments({
  segments,
  checkedSegments,
  setCheckedSegments,
}: {
  segments: string[]
  checkedSegments: string[]
  setCheckedSegments: React.Dispatch<React.SetStateAction<string[]>>
}) {
  // When "CLEAR" is clicked, finds all input elements and
  // changes "checked" to false to synchronize with "checkedSegments" state
  function handleAll(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
    setCheckedSegments([])
    const inputsEls: HTMLInputElement[] = Array.from(
      document.getElementsByClassName("segmentInput"),
    ) as HTMLInputElement[]
    inputsEls
      .filter((el) => checkedSegments.includes(el.value))
      .map((el) => (el.checked = false))
  }
  return (
    <>
      <span
        onClick={handleAll}
        key="ALL"
        className={`btn btn-error btn-xs m-1`}
      >
        CLEAR
      </span>
      {segments &&
        Array.from(segments.values())
          .sort()
          .map((segment, idx) => (
            <div key={idx} className="inline-block">
              <input
                type="checkbox"
                name="segment"
                id={segment}
                className="segmentInput peer hidden"
                value={segment}
                onChange={(e) => {
                  if (e.target.checked) {
                    setCheckedSegments([segment, ...checkedSegments])
                  }
                  if (!e.target.checked) {
                    const filteredOutSegs = checkedSegments.filter(
                      (seg) => seg !== e.target.value,
                    )
                    setCheckedSegments([...filteredOutSegs])
                  }
                }}
              />

              <label
                htmlFor={segment}
                className="btn btn-warning btn-xs m-1 cursor-pointer select-none border-none peer-checked:bg-sfred-300"
              >
                {segment}
              </label>
            </div>
          ))}
    </>
  )
}

/**
 * Error Boundary
 */
export function ErrorBoundary() {
  const { gakunen, hr } = useParams()
  let message = `学年（${gakunen}）からクラス（${hr}）のファイルを取得できませんでした。`
  return <ErrorBoundaryDocument message={message} />
}
