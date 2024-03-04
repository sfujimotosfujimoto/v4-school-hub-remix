import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { NavLink, useLoaderData } from "@remix-run/react"
import { LogoIcon } from "~/components/icons"
import GakunenButtons from "~/components/ui/buttons/gakunen-buttons"
import HrButtons from "~/components/ui/buttons/hr-buttons"
import { requireUserRole } from "~/lib/require-roles.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { logger } from "~/logger"
import { useGakunen } from "../student/route"

/**
 * loader function
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: files._index ${request.url}`)
  const { user } = await getUserFromSessionOrRedirect(request)
  await requireUserRole(request, user)

  return json({
    role: user?.role,
  })
}

export default function FilesPage() {
  const { gakunen, setGakunen, hr, setHr } = useGakunen()
  const { role } = useLoaderData<typeof loader>()
  return (
    <div
      data-name="files._index"
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="flex mb-4 text-4xl font-semibold border-b-4 border-sfred-400 decoration-sfred-400 underline-offset-4">
        <h2>ファイルを検索</h2>
      </div>
      <div
        id="__border-wrapper"
        className="p-4 border-2 shadow-lg rounded-2xl border-sfgreen-400 bg-slate-100"
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
            <LogoIcon className="w-4 h-7" />
            <span className="ml-2 sm:ml-4 sm:inline">GO</span>
          </NavLink>
        </div>
      </div>
    </div>
  )
}
