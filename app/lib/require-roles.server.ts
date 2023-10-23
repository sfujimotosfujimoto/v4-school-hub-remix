import { logger } from "~/logger"

import { authenticate } from "./authenticate.server"
import { redirect } from "@remix-run/node"
import type { User } from "~/types"

export async function requireUserRole(request: Request) {
  logger.debug("✅ requireUserRole start")
  const { user, error, userJWT } = await authenticate(request)

  const id = "ur-01"
  if (error) {
    console.error(`error: ${error}`)
    return { error: `unknown-error-${id}` }
  }

  if (!user?.credential) {
    return { error: `no-login-${id}` }
  }

  if (user && !user.activated) {
    return { error: `not-activated-${id}` }
  }

  if (user && !["SUPER", "ADMIN", "MODERATOR", "USER"].includes(user.role)) {
    return { error: `unauthorized-${id}` }
  }
  logger.debug("✅ requireUserRole: returning user", user)
  return { user, userJWT }
}
export async function requireUserRole2(user: User) {
  logger.debug("✅ requireUserRole2 start")

  if (user && !["SUPER", "ADMIN", "MODERATOR", "USER"].includes(user.role)) {
    throw redirect("/?authstate=unauthorized")
  }
}

export async function requireModeratorRole(request: Request) {
  const id = "mr-01"
  const { user, error, userJWT } = await authenticate(request)

  if (error) {
    console.error(`error: ${error}`)
    return { error: `unknown-error-${id}` }
  }

  if (!user?.credential) {
    return { error: `no-login-${id}` }
  }

  if (user && !user.activated) {
    return { error: `not-activated-${id}` }
  }

  if (user && !["SUPER", "ADMIN", "MODERATOR"].includes(user.role)) {
    return { error: `unauthorized-${id}` }
  }
  return { user, userJWT }
}

export async function requireAdminRole(request: Request) {
  const { user, error, userJWT } = await authenticate(request)

  const id = "ar-01"

  if (error) {
    console.error(`error: ${error}`)
    return { error: `unknown-error-${id}` }
  }

  if (!user?.credential) {
    return { error: `no-login-${id}` }
  }

  if (user && !user.activated) {
    return { error: `not-activated-${id}` }
  }

  if (user && !["SUPER", "ADMIN"].includes(user.role)) {
    return { error: `unauthorized-${id}` }
  }
  return { user, userJWT }
}
export async function requireAdminRole2(user: User) {
  logger.debug("✅ requireAdminRole2 start")

  if (user && !["SUPER", "ADMIN"].includes(user.role)) {
    throw redirect("/?authstate=unauthorized")
  }
}

export async function requireSuperRole(request: Request) {
  const { user, error, userJWT } = await authenticate(request)
  const id = "sr-01"

  if (error) {
    console.error(`error: ${error}`)
    return { error: `unknown-error-${id}` }
  }

  if (!user?.credential) {
    return { error: `no-login-${id}` }
  }

  if (user && !user.activated) {
    return { error: `not-activated-${id}` }
  }

  if (user && !["SUPER"].includes(user.role)) {
    return { error: `unauthorized-${id}` }
  }
  return { user, userJWT }
}
