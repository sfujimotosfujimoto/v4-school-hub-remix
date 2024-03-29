import type {
  HeadersFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
import { json } from "@remix-run/node"
import { Outlet, useLoaderData, useOutletContext } from "@remix-run/react"
import React from "react"
import { MenuIcon } from "~/components/icons"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import { errorResponses } from "~/lib/error-responses"
import { getSheets, getStudents } from "~/lib/google/sheets.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { filterStudentDataByGakunen } from "~/lib/utils/utils"
import { logger } from "~/logger"
import type { Gakunen, Hr } from "~/types"
import Sidebar from "./sidebar"

/**
 * loader function
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: student ${request.url}`)

  const { credential } = await getUserFromSessionOrRedirect(request)

  const accessToken = credential.accessToken

  // get sheets
  const sheets = await getSheets(accessToken)
  if (!sheets) {
    throw errorResponses.google()
  }

  // get StudentData[]
  const students = await getStudents(sheets)
  return json(
    {
      students,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": `max-age=${60 * 10}`,
      },
    },
  )
}

/**
 * Student Layout
 */
export default function StudentLayout() {
  const { students } = useLoaderData<typeof loader>()

  // filtered StudentData[]
  const [filteredStudents, setFilteredStudents] = React.useState(students)
  // gakunen state
  const [gakunen, setGakunen] = React.useState<Gakunen>("ALL")
  // hr state
  const [hr, setHr] = React.useState<Hr>("ALL")

  // check for change in filteredStudentData
  React.useEffect(() => {
    const tmp = filterStudentDataByGakunen(gakunen, hr, students)
    setFilteredStudents(tmp)
  }, [gakunen, students, hr])

  // used to check click state in hidden checkbox of Sidebar

  const drawerRef = React.useRef<HTMLInputElement>(null)

  return (
    <>
      <section data-name="/student" className="h-full mx-auto">
        <div className="h-full mx-auto drawer">
          <input
            onChange={() => {
              // console.lo.debug("clicked")
              drawerRef.current?.click()
            }}
            id="my-drawer"
            name="my-drawer"
            type="checkbox"
            className="drawer-toggle"
            ref={drawerRef}
          />

          {/* <!-- Right Content --> */}
          <div
            data-name="__rightside-content"
            className="relative flex flex-col items-center justify-start h-full drawer-content"
          >
            <Outlet context={{ setGakunen, gakunen, hr, setHr, drawerRef }} />

            {/* <!-- Sidebar Layout --> */}
            <label
              data-name="__hamburger-wrapper"
              htmlFor="my-drawer"
              className="fixed z-10 w-10 h-10 font-bold border-none rounded-full shadow-lg btn drawer-button btn-xs bottom-10 left-4 bg-sky-400 bg-opacity-70 text-sfblue-300 hover:bg-sky-600 hover:bg-opacity-60 sm:bottom-16 sm:left-6 sm:h-12 sm:w-12 md:h-14 md:w-14"
            >
              <MenuIcon className="w-6 h-6 sm:h-10 sm:w-10" />
            </label>
          </div>

          {/* <!-- SideBar --> */}
          <Sidebar studentData={filteredStudents} drawerRef={drawerRef} />
        </div>
      </section>
    </>
  )
}

// type for Outlet Context
type ContextType = {
  gakunen: Gakunen
  setGakunen: React.Dispatch<React.SetStateAction<Gakunen>>
  hr: Hr
  setHr: React.Dispatch<React.SetStateAction<Hr>>
  drawerRef: React.RefObject<HTMLInputElement>
}

export function useGakunen() {
  return useOutletContext<ContextType>()
}

export const meta: MetaFunction = () => {
  return [
    {
      title: `クラス | SCHOOL HUB TEACHER`,
    },
  ]
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    ...loaderHeaders,
  }
}

/**
 * Error Boundary
 */
export function ErrorBoundary() {
  let message = `問題が発生しました。`
  return <ErrorBoundaryDocument message={message} />
}
