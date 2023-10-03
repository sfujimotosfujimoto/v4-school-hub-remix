import { logger } from "~/logger"

import { authenticate } from "./authenticate.server"

export async function requireUserRole(request: Request) {
  logger.debug("✅ requireUserRole start")
  const { user, error, userJWT } = await authenticate(request)

  if (error) {
    console.error(`error: ${error}`)
    return { error: "unknown-error" }
  }

  if (!user?.credential) {
    return { error: "no-login" }
  }

  if (user && !user.activated) {
    return { error: "not-activated" }
  }

  if (user && !["SUPER", "ADMIN", "MODERATOR", "USER"].includes(user.role)) {
    return { error: "unauthorized" }
  }
  logger.debug("✅ requireUserRole: returning user", user)
  return { user, userJWT }
}

export async function requireModeratorRole(request: Request) {
  const { user, error, userJWT } = await authenticate(request)

  if (error) {
    console.error(`error: ${error}`)
    return { error: "unknown-error" }
  }

  if (!user?.credential) {
    return { error: "no-login" }
  }

  if (user && !user.activated) {
    return { error: "not-activated" }
  }

  if (user && !["SUPER", "ADMIN", "MODERATOR"].includes(user.role)) {
    return { error: "unauthorized" }
  }
  return { user, userJWT }
}

export async function requireAdminRole(request: Request) {
  const { user, error, userJWT } = await authenticate(request)

  if (error) {
    console.error(`error: ${error}`)
    return { error: "unknown-error" }
  }

  if (!user?.credential) {
    return { error: "no-login" }
  }

  if (user && !user.activated) {
    return { error: "not-activated" }
  }

  if (user && !["SUPER", "ADMIN"].includes(user.role)) {
    return { error: "unauthorized" }
  }
  return { user, userJWT }
}

export async function requireSuperRole(request: Request) {
  const { user, error, userJWT } = await authenticate(request)

  if (error) {
    console.error(`error: ${error}`)
    return { error: "unknown-error" }
  }

  if (!user?.credential) {
    return { error: "no-login" }
  }

  if (user && !user.activated) {
    return { error: "not-activated" }
  }

  if (user && !["SUPER"].includes(user.role)) {
    return { error: "unauthorized" }
  }
  return { user, userJWT }
}
