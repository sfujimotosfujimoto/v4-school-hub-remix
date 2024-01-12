import type { LoaderFunctionArgs } from "@remix-run/node"
import { redirectToSignin } from "~/lib/responses"
import { createUserSession } from "~/lib/session.server"
import { signin } from "~/lib/signinout.server"
import { logger } from "~/logger"

/**
 * Loader function
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: auth.redirect ${request.url}`)
  // get code from url query
  const parsedUrl = new URL(request.url)
  const code = parsedUrl.searchParams.get("code")

  // if no "code" , do not touch and resolve
  if (!code) throw redirectToSignin(request)

  const { userId } = await signin({ request, code })

  return createUserSession(userId, "/student")
}
