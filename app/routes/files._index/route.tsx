import { LogoIcon } from "~/components/icons"
import GakunenButtons from "~/components/ui/buttons/gakunen-buttons"
import HrButtons from "~/components/ui/buttons/hr-buttons"

import { NavLink, useLoaderData } from "@remix-run/react"

import { useGakunen } from "../student/route"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { logger } from "~/logger"
import { authenticate } from "~/lib/authenticate.server"
import { requireUserRole } from "~/lib/require-roles.server"
import { destroyUserSession } from "~/lib/session.server"

/**
 * loader function
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: files._index ${request.url}`)
  const { user } = await authenticate(request)
  await requireUserRole(user)

  if (!user || !user.credential) {
    return destroyUserSession(request, `/?authstate=unauthenticated`)
  }

  return json(
    {
      role: user?.role,
    },
    // {
    //   status: 200,
    //   headers: {
    //     "Cache-Control": `max-age=${60 * 10}`,
    //   },
    // },
  )
}

export default function FilesPage() {
  const { gakunen, setGakunen, hr, setHr } = useGakunen()
  const { role } = useLoaderData<typeof loader>()
  return (
    <div
      data-name="files._index"
      className="flex h-full flex-col items-center justify-center"
    >
      <div
        id="__border-wrapper"
        className="m-4 rounded-2xl border-2 border-sfgreen-400 p-4 shadow-lg"
      >
        <div
          id="__flex-wrapper"
          className="flex flex-col items-center justify-center gap-4"
        >
          <h1 className="text-base font-medium underline decoration-sfred-300 decoration-2 underline-offset-8 sm:text-xl">
            学年を選ぶ
          </h1>
          <GakunenButtons setGakunen={setGakunen} gakunen={gakunen} />
          <h1 className="text-base font-medium underline decoration-sfred-300 decoration-2 underline-offset-8 sm:text-xl">
            クラスを選ぶ
          </h1>
          <HrButtons setHr={setHr} hr={hr} role={role} />

          <NavLink
            to={`/files/${gakunen}/${hr}`}
            className={`btn btn-success w-36 shadow-lg  ${
              gakunen === "ALL" || hr === "ALL" ? "btn-disabled" : null
            }`}
          >
            <LogoIcon className="h-7 w-4" />
            <span className=" ml-2 sm:ml-4 sm:inline">GO</span>
          </NavLink>
        </div>
      </div>
    </div>
  )
}
