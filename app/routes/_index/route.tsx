// components
import { LogoIcon, LogoTextIcon, DriveLogoIcon } from "~/components/icons"
// import { type LoaderFunctionArgs, json } from "@remix-run/node"
// import { logger } from "~/logger"
// import { getUserFromSession } from "~/lib/session.server"
import { NavLinkButton } from "~/components/buttons/button"
import { useRouteLoaderData } from "@remix-run/react"

import type { loader as rootLoader } from "~/root"

/**
 * Root loader
 */
// export async function loader({ request }: LoaderFunctionArgs) {
//   logger.debug(`🍿 loader: _index ${request.url}`)
//   const user = await getUserFromSession(request)

//   return json({
//     role: user?.role || null,
//     picture: user?.picture || null,
//     email: user?.email || null,
//   })
// }

export default function Index() {
  // const data = useRouteLoaderData<typeof rootLoader>("root")
  // const { email } = useLoaderData<typeof loader>()
  const data = useRouteLoaderData<typeof rootLoader>("root")

  if (!data) {
    throw Error("no data")
  }
  const { email } = data
  return (
    <section className="mx-auto flex h-full w-screen max-w-7xl flex-col items-center justify-center gap-8">
      <div className="flex items-center">
        <LogoIcon className="w-16 sm:w-24" />
        <LogoTextIcon className="w-40 sm:w-48" />
      </div>
      <div className="max-w-xl rounded-lg bg-slate-50 p-4">
        <WhatIsSchoolHub />
        <Explanation />
      </div>
      <LoginButton email={email} />
    </section>
  )
}

function WhatIsSchoolHub() {
  return (
    <h2 className="text-xl font-semibold">
      ✨ What is{" "}
      <span className="text-bold inline-block rounded-md bg-sfred-50 p-[2px] px-1 text-sfblue-300">
        <LogoIcon className="inline h-4 w-4" />
        SCHOOL HUB TEACHER
      </span>
      ?
    </h2>
  )
}

function Explanation() {
  return (
    <p className="text-normal mt-2 ">
      <span className="text-bold rounded-md px-1 text-sfblue-300 underline decoration-sfred-200 decoration-2">
        <LogoIcon className="inline h-3 w-3" />
        SCHOOL HUB TEACHER
      </span>
      とは生徒の
      <span className="underline decoration-sfred-200 decoration-2">
        <DriveLogoIcon className="inline h-3 w-3" />
        Google Drive
      </span>{" "}
      と連携するアプリです。
    </p>
  )
}

function LoginButton({ email }: { email?: string | null }) {
  return (
    <>
      <div className="relative flex w-full items-center justify-center gap-8 ">
        {!email ? (
          <NavLinkButton to="/auth/signin" size="md">
            <LogoIcon className="h-7 w-4" />
            <span id="signin" className="ml-2 sm:ml-4 sm:inline">
              SCHOOL HUB サインイン
            </span>
          </NavLinkButton>
        ) : (
          <>
            <div className="mt-8 flex flex-col gap-4">
              <h3 className="text-xl ">Hello, </h3>
              <h2 className="text-2xl font-bold text-sfblue-400">{email}</h2>
              <NavLinkButton className="mt-4" to={`/student`} size="md">
                <LogoIcon className="h-7 w-4" />
                <DriveLogoIcon className="h-4 w-4" />
                ダッシュボードへ
              </NavLinkButton>
            </div>
          </>
        )}
      </div>
    </>
  )
}
