import { type LoaderFunctionArgs, json, redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { NavLinkButton } from "~/components/buttons/button"
import { DriveLogoIcon, LogoIcon, LogoTextIcon } from "~/components/icons"
import { getSession } from "~/lib/session.server"
// import type { loader as rootLoader } from "~/root"
import { getUserById } from "~/lib/user.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const userSession = await getSession(request)

  if (userSession && userSession.userId) {
    const { user } = await getUserById(userSession.userId)

    if (!user) {
      return redirect("/auth/signin")
    }

    return json(
      {
        userId: userSession.userId,
        accessToken: userSession.accessToken,
        email: user?.email,
        role: user?.role,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    )
  }

  return redirect("/auth/signin")
}

export default function Dashboard() {
  const { userId, email, role } = useLoaderData<typeof loader>()

  return (
    <section className="mx-auto flex h-full w-screen flex-col items-center justify-center gap-8">
      <div className="flex items-center">
        <LogoIcon className="w-16 sm:w-24" />
        <LogoTextIcon className="w-40 sm:w-48" />
      </div>
      <RedirectButtons userId={userId} email={email} role={role} />
    </section>
  )
}

function RedirectButtons({
  userId,
  email,
  role,
}: {
  userId?: number | null | undefined
  email?: string | null
  role?: string | null
}) {
  return (
    <>
      <div className="relative flex w-screen items-center justify-center gap-4 ">
        {!userId || !email ? (
          <div className="mt-8 flex flex-col gap-4">
            <NavLinkButton to="/auth/signin" size="md">
              <LogoIcon className="h-7 w-4" />
              <span id="signin" className="ml-2 sm:ml-4 sm:inline">
                SCHOOL HUB サインイン
              </span>
            </NavLinkButton>
          </div>
        ) : (
          <>
            <div className="mx-auto mt-8 flex w-10/12 max-w-xl flex-col justify-center gap-4">
              <h3 className="text-xl ">Hello, </h3>
              <h2 className="text-2xl font-bold text-sfblue-300">{email}</h2>

              {/* Buttons */}
              <div className="flex w-full flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 ">
                  <NavLinkButton className="" to={`/student`} size="md">
                    <DriveLogoIcon className="h-4 w-4" />
                    生徒へ
                  </NavLinkButton>
                  <NavLinkButton className="" to={`/files`} size="md">
                    <DriveLogoIcon className="h-4 w-4" />
                    ファイルへ
                  </NavLinkButton>
                </div>
                {role && ["ADMIN", "SUPER"].includes(role) ? (
                  <>
                    <div className="mt-4 ">
                      <h2 className="text-xl font-bold underline decoration-sfred-300 decoration-2 underline-offset-2">
                        ADMIN メニュー
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <NavLinkButton
                        to={`/admin/rename`}
                        size="md"
                        variant="secondary"
                      >
                        <span className="ml-2 sm:ml-4 sm:inline">
                          🐣 名前変更へ
                        </span>
                      </NavLinkButton>
                      <NavLinkButton
                        to={`/admin/move`}
                        size="md"
                        variant="secondary"
                      >
                        <span className="ml-2 sm:ml-4 sm:inline">
                          🚙 移動へ
                        </span>
                      </NavLinkButton>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
