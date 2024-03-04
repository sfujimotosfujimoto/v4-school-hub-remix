import { type LoaderFunctionArgs, json, redirect } from "@remix-run/node"
import { NavLinkButton } from "~/components/buttons/button"
import { DriveLogoIcon, LogoIcon, LogoTextIcon } from "~/components/icons"
import { getSession } from "~/lib/session.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const userSession = await getSession(request)

  if (userSession && userSession.userId) {
    return redirect("/dashboard")
  }

  return json({
    userId: null,
    accessToken: null,
  })
}

export default function Index() {
  // const data = useRouteLoaderData<typeof rootLoader>("root")

  return (
    <section className="flex flex-col items-center justify-center w-screen h-full gap-8 mx-auto max-w-7xl">
      <div className="flex items-center">
        <LogoIcon className="w-16 sm:w-24" />
        <LogoTextIcon className="w-40 sm:w-48" />
      </div>
      <div className="max-w-xl p-4 rounded-lg bg-slate-50">
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
        <LogoIcon className="inline w-4 h-4" />
        SCHOOL HUB TEACHER
      </span>
      ?
    </h2>
  )
}

function Explanation() {
  return (
    <p className="mt-2 text-normal ">
      <span className="px-1 underline rounded-md text-bold text-sfblue-300 decoration-sfred-200 decoration-2">
        <LogoIcon className="inline w-3 h-3" />
        SCHOOL HUB TEACHER
      </span>
      とは生徒の
      <span className="underline decoration-sfred-200 decoration-2">
        <DriveLogoIcon className="inline w-3 h-3" />
        Google Drive
      </span>{" "}
      と連携するアプリです。
    </p>
  )
}

function LoginButton() {
  return (
    <>
      <div className="relative flex items-center justify-center w-full gap-8 ">
        <NavLinkButton to="/auth/signin" size="md">
          <LogoIcon className="w-4 h-7" />
          <span id="signin" className="ml-2 sm:ml-4 sm:inline">
            SCHOOL HUB サインイン
          </span>
        </NavLinkButton>
      </div>
    </>
  )
}

// function LoginButton({ userId }: { userId?: number | null | undefined }) {
//   return (
//     <>
//       <div className="relative flex items-center justify-center w-full gap-8 ">
//         {!userId ? (
//           <NavLinkButton to="/auth/signin" size="md">
//             <LogoIcon className="w-4 h-7" />
//             <span id="signin" className="ml-2 sm:ml-4 sm:inline">
//               SCHOOL HUB サインイン
//             </span>
//           </NavLinkButton>
//         ) : (
//           <>
//             <div className="flex flex-col gap-4 mt-8">
//               <NavLinkButton className="mt-4" to={`/dashboard`} size="md">
//                 <DriveLogoIcon className="w-4 h-4" />
//                 ダッシュボードへ
//               </NavLinkButton>
//             </div>
//           </>
//         )}
//       </div>
//     </>
//   )
// }
