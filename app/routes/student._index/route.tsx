import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import React from "react"
import GakunenButtons from "~/components/ui/buttons/gakunen-buttons"
import HrButtons from "~/components/ui/buttons/hr-buttons"
import { requireUserRole } from "~/lib/require-roles.server"
import { redirectToSignin } from "~/lib/responses"
import { destroyUserSession, getUserFromSession } from "~/lib/session.server"
import { logger } from "~/logger"
import { useGakunen } from "../student/route"

/**
 * loader function
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: student._index ${request.url}`)
  const user = await getUserFromSession(request)

  if (!user || !user.credential) throw redirectToSignin(request)

  // const { user } = await authenticate(request)
  await requireUserRole(request, user)
  if (!user || !user.credential) {
    return destroyUserSession(request, `/?authstate=unauthenticated`)
  }

  return json(
    {
      role: user?.role,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": `max-age=${60 * 10}`,
      },
    },
  )
}

export const headers: HeadersFunction = ({ loaderHeaders, parentHeaders }) => {
  const loaderCache = loaderHeaders.get("Cache-Control")

  if (loaderCache) {
    return {
      ...parentHeaders,
      "Cache-Control": loaderHeaders.get("Cache-Control") || "",
    }
  }
  return { ...parentHeaders }
}

export default function StudentPage() {
  const { role } = useLoaderData<typeof loader>()
  const { gakunen, setGakunen, hr, setHr, drawerRef } = useGakunen()

  React.useEffect(() => {
    if (hr !== "ALL" && drawerRef?.current) {
      drawerRef.current.checked = true
    }
  }, [hr, drawerRef])

  return (
    <div
      data-name="/student._index"
      className="flex h-full flex-col items-center justify-center"
    >
      <div className=" mb-4 flex border-b-4 border-sfred-400 text-4xl font-semibold decoration-sfred-400 underline-offset-4">
        <h2>生徒を検索</h2>
      </div>
      <div
        id="__border-wrapper"
        className="rounded-2xl border-2 border-sfgreen-400 bg-slate-100 p-4 shadow-lg"
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
        </div>
      </div>
    </div>
  )
}
