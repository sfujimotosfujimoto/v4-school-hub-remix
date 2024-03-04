import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Form, useNavigation } from "@remix-run/react"
import clsx from "clsx"
import { Button } from "~/components/buttons/button"
import { LogoIcon } from "~/components/icons"
import DriveLogoIcon from "~/components/icons/drive-logo-icon"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import { SCOPES } from "~/config"
import { initializeClient, refreshToken } from "~/lib/google/google.server"
import { createUserSession, getUserFromSession } from "~/lib/session.server"
import { updateUserCredential } from "~/lib/user.server"
import { toLocaleString } from "~/lib/utils/utils"
import { logger } from "~/logger"

/**
 * Loader
 * GET requests to this route will refresh the access token and update the user session if the refresh token is available
 * After the update, the user will be redirected to the dashboard
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: auth.signin ${request.url}`)
  const { user, refreshUser } = await getUserFromSession(request)

  // if user is already signed in, redirect to dashboard
  if (user) {
    logger.debug(`✅ auth.signin: user found in session`)
    return redirect("/dashboard")
  }

  // if no refresh user found, return null
  if (!refreshUser?.credential?.refreshToken) {
    logger.debug("🐝 auth.signin: no refresh token found in DB user")
    return null
  }

  // refresh token calling google
  const refreshTokenString = refreshUser?.credential?.refreshToken
  if (!refreshTokenString) {
    logger.debug(`✅ auth.signin: no refresh token found in DB user`)
    return null
  }
  logger.debug(`✅ auth.signin: refreshTokenString: ${refreshTokenString}`)

  // get new access token using refresh token
  const token = await refreshToken(refreshTokenString)

  // update user credential with new token in DB
  const newAccessToken = token.credentials.access_token
  const newExpiryDate = token.credentials.expiry_date

  if (!newAccessToken || !newExpiryDate) {
    return null
  }

  logger.debug(`✅ auth.signin: new accessToken: ${newAccessToken}`)
  const updatedUser = await updateUserCredential(
    refreshUser.id,
    newAccessToken,
    newExpiryDate,
  )

  if (!updatedUser) {
    return null
  }

  logger.debug(
    `✅ auth.signin: updatedUser: ${toLocaleString(updatedUser?.credential?.expiry || "")}`,
  )
  // get redirect from search params
  const redirectUrl = new URL(request.url).searchParams.get("redirect")
  if (redirectUrl) {
    return createUserSession(refreshUser.id, newAccessToken, redirectUrl)
  }

  // Update session with new access_token
  return createUserSession(refreshUser.id, newAccessToken, "/dashboard")
}

/**
 * Action for signin
 * POST requests to this route will redirect the user to the Google OAuth2 URL
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: auth.signin ${request.url}`)

  // create OAuth2 client with id and secret
  const oauth2Client = initializeClient()

  // get authorization URL from created client
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "online",
    scope: SCOPES,
    include_granted_scopes: false,
    prompt: "select_account",
  })

  return redirect(authUrl, { status: 302 })
}

/**
 * Auth Signin Page
 */
export default function AuthSigninPage() {
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
          <DriveLogoIcon className="w-24 h-24" />
        </div>

        <div className="max-w-xl p-4 rounded-lg shadow-lg bg-base-100">
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
      <div className="relative flex items-center justify-center w-full gap-8 ">
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
