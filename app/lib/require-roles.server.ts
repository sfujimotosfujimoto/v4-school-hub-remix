import { logger } from "~/logger"

import { redirect } from "@remix-run/node"
import type { User } from "~/types"

export async function requireUserRole(user: User) {
  logger.debug("👑 requireUserRole start")

  if (user && !["SUPER", "ADMIN", "MODERATOR", "USER"].includes(user.role)) {
    throw redirect("/?authstate=unauthorized")
  }
}

export async function requireModeratorRole(user: User) {
  logger.debug("👑 requireModeratorRole start")

  if (user && !["SUPER", "ADMIN", "MODERATOR"].includes(user.role)) {
    throw redirect("/?authstate=unauthorized")
  }
}

export async function requireAdminRole(user: User) {
  logger.debug("👑 requireAdminRole start")

  if (user && !["SUPER", "ADMIN"].includes(user.role)) {
    throw redirect("/?authstate=unauthorized")
  }
}

export async function requireSuperRole(user: User) {
  logger.debug("👑 requireSuperRole start")

  if (user && !["SUPER"].includes(user.role)) {
    throw redirect("/?authstate=unauthorized")
  }
}

// export async function requireAdminRole(request: Request) {
//   const { user, error, userJWT } = await authenticate(request)

//   const id = "ar-01"

//   if (error) {
//     console.error(`error: ${error}`)
//     return { error: `unknown-error-${id}` }
//   }

//   if (!user?.credential) {
//     return { error: `no-login-${id}` }
//   }

//   if (user && !user.activated) {
//     return { error: `not-activated-${id}` }
//   }

//   if (user && !["SUPER", "ADMIN"].includes(user.role)) {
//     return { error: `unauthorized-${id}` }
//   }
//   return { user, userJWT }
// }

// export async function requireUserRole(request: Request) {
//   logger.debug("✅ requireUserRole start")
//   const { user, error, userJWT } = await authenticate(request)

//   const id = "ur-01"
//   if (error) {
//     console.error(`error: ${error}`)
//     return { error: `unknown-error-${id}` }
//   }

//   if (!user?.credential) {
//     return { error: `no-login-${id}` }
//   }

//   if (user && !user.activated) {
//     return { error: `not-activated-${id}` }
//   }

//   if (user && !["SUPER", "ADMIN", "MODERATOR", "USER"].includes(user.role)) {
//     return { error: `unauthorized-${id}` }
//   }
//   logger.debug("✅ requireUserRole: returning user", user)
//   return { user, userJWT }
// }
