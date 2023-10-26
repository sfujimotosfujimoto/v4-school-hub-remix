import { destroyUserSession } from "~/lib/session.server"
import { logger } from "~/logger"

import { json } from "@remix-run/node"

import type { ActionFunctionArgs } from "@remix-run/node"

/**
 * Action for signout
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: auth.signout ${request.url}`)
  if (request.method !== "POST") {
    throw json({ message: "Invalid request method" }, { status: 400 })
  }
  return await destroyUserSession(request, "/")
}
