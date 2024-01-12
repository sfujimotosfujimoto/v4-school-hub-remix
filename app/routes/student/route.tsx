import type {
  HeadersFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { Outlet, useLoaderData, useOutletContext } from "@remix-run/react"
import React from "react"

// components
import { MenuIcon } from "~/components/icons"
import Sidebar from "./components/sidebar"
// functions
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import { getSheets, getStudents } from "~/lib/google/sheets.server"
import { redirectToSignin } from "~/lib/responses"
import { getUserFromSession } from "~/lib/session.server"
import { filterStudentDataByGakunen } from "~/lib/utils"
import { logger } from "~/logger"
import type { Gakunen, Hr } from "~/types"

/**
 * loader function
 */

export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: student ${request.url}`)

  const user = await getUserFromSession(request)

  if (!user || !user.credential) {
    throw redirectToSignin(request)
  }
  const accessToken = user.credential.accessToken

  // get sheets
  const sheets = await getSheets(accessToken)
  if (!sheets) {
    throw redirect("/?authstate=unauthenticated")
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
      <section data-name="/student" className="mx-auto h-full">
        <div className="drawer mx-auto h-full">
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
            className="drawer-content relative flex h-full flex-col items-center justify-start"
          >
            <Outlet context={{ setGakunen, gakunen, hr, setHr, drawerRef }} />

            {/* <!-- Sidebar Layout --> */}
            <label
              data-name="__hamburger-wrapper"
              htmlFor="my-drawer"
              className="btn drawer-button btn-xs fixed bottom-10 left-4 z-10 h-10 w-10 rounded-full border-none bg-sky-400 bg-opacity-70 font-bold text-sfblue-300 shadow-lg hover:bg-sky-600 hover:bg-opacity-60 sm:bottom-16 sm:left-6 sm:h-12 sm:w-12 md:h-14 md:w-14"
            >
              <MenuIcon className="h-6 w-6 sm:h-10 sm:w-10" />
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
