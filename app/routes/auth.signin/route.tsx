import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { Form, useNavigation } from "@remix-run/react"
import clsx from "clsx"
import { Button } from "~/components/buttons/button"
import { LogoIcon } from "~/components/icons"
import DriveLogoIcon from "~/components/icons/drive-logo-icon"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import { initializeClient } from "~/lib/google/google.server"
import { getUserFromSession } from "~/lib/session.server"
import { logger } from "~/logger"

/**
 * Loader
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: auth.signin ${request.url}`)
  const { user } = await getUserFromSession(request)

  // get redirect from search params
  const redirectUrl = new URL(request.url).searchParams.get("redirect")
  if (redirectUrl) {
    throw redirect(redirectUrl)
  }

  return json({ user })
}

const scopes = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
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
    access_type: "online",
    scope: scopes,
    include_granted_scopes: false,
    prompt: "select_account",
  })

  return redirect(authUrl, { status: 302 })
}

export default function AuthSigninPage() {
  // console.log("✅ auth.signin/route.tsx ~ 	😀 ")
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
          <LogoIcon className="w-16 sm:w-24" />
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
