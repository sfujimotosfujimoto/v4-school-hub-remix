import type { LoaderFunctionArgs } from "@remix-run/node"

// components
import { DriveLogo, LogoIcon, LogoTextIcon } from "~/components/icons"
import LoginButton from "./components/login-button"
// functions
import { logger } from "~/logger"
import { getUserFromSession } from "~/lib/session.server"

export default function Index() {
  return (
    <section className="mx-auto flex h-full w-screen max-w-7xl flex-col items-center justify-center gap-8">
      <div className="flex items-center">
        <LogoIcon className="h-12 w-12 sm:h-32 sm:w-32" />
        <LogoTextIcon className="h-12 w-32 sm:h-32 sm:w-72" />
      </div>
      <div className="max-w-xl rounded-lg bg-base-100 p-4 shadow-lg">
        <WhatIsSchoolHub />
        <Explanation />
      </div>
      <LoginButton />
    </section>
  )
}

function WhatIsSchoolHub() {
  return (
    <h2 className="text-xl font-semibold">
      ✨ What is{" "}
      <span className="text-bold inline-block rounded-md bg-sfred-50 p-[2px] px-1 text-sftext-900">
        <LogoIcon className="inline h-4 w-4" />
        SCHOOL HUB
      </span>
      ?
    </h2>
  )
}

function Explanation() {
  return (
    <p className="text-normal mt-2 ">
      <span className="text-bold rounded-md px-1 text-sftext-900 underline decoration-sfred-200 decoration-2">
        <LogoIcon className="inline h-3 w-3" />
        SCHOOL HUB
      </span>
      とは生徒の
      <span className="underline decoration-sfred-200 decoration-2">
        <DriveLogo className="inline h-3 w-3" />
        Google Drive
      </span>{" "}
      と連携するアプリです。
    </p>
  )
}

/**
 * Loader
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`✅ loader: _index ${request.url}`)

  // check if there is __session cookie
  const user = await getUserFromSession(request)
  if (!user) return { role: undefined, picture: undefined }

  return { role: user.role, picture: user.picture }
}

// export const headers: HeadersFunction = ({ loaderHeaders }) => {
//   return {
//     "Cache-Control": `max-age=${60 * 10}`,
//   }
// }
