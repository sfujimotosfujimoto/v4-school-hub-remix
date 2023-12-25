// import type { LoaderFunctionArgs } from "@remix-run/node"

// components
import { DriveLogo, LogoIcon, LogoTextIcon } from "~/components/icons"
import LoginButton from "./components/login-button"
// functions
// import { logger } from "~/logger"
// import { getUserFromSession } from "~/lib/session.server"

// {
//   role: user?.role || null,
//   picture: user?.picture || null,
// }

export default function Index() {
  return (
    <section className="mx-auto flex h-full w-screen max-w-7xl flex-col items-center justify-center gap-8">
      <div className="flex items-center">
        <LogoIcon className="h-28 w-28 sm:h-32 sm:w-32" />
        <LogoTextIcon className="h-28 w-auto sm:h-32" />
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
        <DriveLogo className="inline h-3 w-3" />
        Google Drive
      </span>{" "}
      と連携するアプリです。
    </p>
  )
}
