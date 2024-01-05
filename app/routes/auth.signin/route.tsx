import { initializeClient } from "~/lib/google/google.server"

import { redirect } from "@remix-run/node"
// import { Link } from "@remix-run/react"

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { logger } from "~/logger"
import {
  getRefreshUserFromSession,
  getUserFromSession,
  updateSession,
} from "~/lib/session.server"
import { redirectToSignin } from "~/lib/responses"
import type { User } from "~/type.d"
import { Form, useNavigation } from "@remix-run/react"
import clsx from "clsx"
import { LogoIcon } from "~/components/icons"
import DriveLogoIcon from "~/components/icons/drive-logo-icon"
import { Button } from "~/components/buttons/button"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"

/**
 * Root loader
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: auth.signin ${request.url}`)
  const user = await getUserFromSession(request)

  // if user is expired, check for refresh token
  if (!user) {
    // get refresh token expiry
    logger.debug("🐝 before getRefreshUserFromSession: in if (user)")
    const refreshUser = await getRefreshUserFromSession(request)
    if (!refreshUser) {
      return null
    }

    const redirectUrl = new URL(request.url).searchParams.get("redirect")

    const jsn = await fetchRefresh(refreshUser)

    logger.info(
      `👑 auth.signin: expiry: ${new Date(
        jsn.data.user.credential.expiry,
      ).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
    )
    if (!jsn.ok) {
      throw redirectToSignin(request, {
        authstate: "unauthorized-refresherror",
      })
      // throw redirect("/auth/signin?authstate=unauthorized-refresherror")
    }

    // update the session with the new values
    const headers = await updateSession("userId", jsn.data.user.id)

    // redirect to the same URL if the request was a GET (loader)
    if (request.method === "GET") {
      logger.debug(
        `👑 auth.signin: request GET redirect: userId: ${jsn.data.user.id}`,
      )
      throw redirect(redirectUrl ? redirectUrl : request.url, { headers })
    }
  }

  // get redirect from search params
  const redirectUrl = new URL(request.url).searchParams.get("redirect")
  if (redirectUrl) {
    throw redirect(redirectUrl)
  }

  throw redirect(`/student`)
}

async function fetchRefresh(user: User) {
  logger.debug("🍺 fetchRefresh: ")

  const jsn = await fetch(`${process.env.BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      {
        user,
        email: user.email,
        accessToken: user.credential?.accessToken,
        refreshToken: user.credential?.refreshToken,
      },
      // (key, value) => (typeof value === "bigint" ? Number(value) : value),
    ),
  })
    .then((res) => {
      logger.debug("🍺 fetchRefresh: fetch res")
      return res.json()
    })
    .catch((err) => {
      console.error(`🍺 fetchRefresh: fetch error`, err.message, err)
      return { error: "error in fetch" }
    })

  return jsn
}

const scopes = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
]

/**
 * Action for signin
 * @param {ActionArgs}
 * @returns
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: auth.signin ${request.url}`)

  // create OAuth2 client with id and secret
  const oauth2Client = initializeClient()

  // get authorization URL from created client
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    include_granted_scopes: true,
    // TODO: check what this means
    prompt: "consent select_account",
  })

  return redirect(authUrl, { status: 302 })
}

export default function AuthSigninPage() {
  console.log("✅ auth.signin/route.tsx ~ 	😀 ")
  const navigation = useNavigation()
  const isNavigating = navigation.state !== "idle"
  return (
    <>
      <section
        className={clsx(
          `mx-auto flex h-full w-screen max-w-7xl flex-col items-center justify-center gap-8 text-sfblue-300`,
          { "opacity-40": isNavigating },
        )}
      >
        <div className="flex items-center">
          <LogoIcon className=" w-16 sm:w-24" />
          <DriveLogoIcon className="h-24 w-24" />
        </div>

        <div className="max-w-xl rounded-lg bg-base-100 p-4 shadow-lg">
          <span
            className={clsx(
              `font-bold underline decoration-sfred-200 decoration-4 underline-offset-4`,
            )}
          >
            Google アカウント
          </span>
          でサインインしてください。
        </div>

        <GoogleSigninButton disabled={isNavigating} />
      </section>
    </>
  )
}

function GoogleSigninButton({ disabled }: { disabled: boolean }) {
  return (
    <>
      <div className="relative flex w-full items-center justify-center gap-8 ">
        <Form method="post" action="/auth/signin">
          <Button type="submit" variant="info" size="md" disabled={disabled}>
            <DriveLogoIcon className="h-7" />
            <span id="google-signin">Google サインイン</span>
          </Button>
        </Form>
      </div>
    </>
  )
}

/**
 * Error Boundary
 */
export function ErrorBoundary() {
  let message = `問題が起きました。`

  return <ErrorBoundaryDocument toHome={true} message={message} />
}
