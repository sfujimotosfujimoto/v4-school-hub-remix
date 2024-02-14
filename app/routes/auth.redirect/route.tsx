import type { LoaderFunctionArgs } from "@remix-run/node"
import { redirectToSignin } from "~/lib/responses"
import { createUserSession } from "~/lib/session.server"
import { signin } from "~/lib/signinout.server"
import { logger } from "~/logger"

//update timeout
export const config = {
  maxDuration: 60,
}

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

  logger.debug(`💥 start: signin()`)
  let start1 = performance.now()

  const { userId } = await signin({ request, code })

  let end1 = performance.now()
  logger.debug(`🔥   end: signin() time: ${(end1 - start1).toFixed(2)} ms`)

  return createUserSession(userId, "/")
}
