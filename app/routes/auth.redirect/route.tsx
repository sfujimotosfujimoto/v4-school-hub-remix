import { signin } from "~/lib/signinout.server"

import { redirect } from "@remix-run/node"

import type { LoaderFunctionArgs } from "@remix-run/node"
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
  if (!code) throw redirect("/?authstate=unauthorized-023")

  return signin({ code })
}
