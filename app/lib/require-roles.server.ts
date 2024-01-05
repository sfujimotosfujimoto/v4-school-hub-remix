import { logger } from "~/logger"

import type { User } from "~/type.d"
import { redirectToSignin } from "./responses"

export async function requireUserRole(request: Request, user: User) {
  logger.debug("👑 requireUserRole start")

  if (user && !["SUPER", "ADMIN", "MODERATOR", "USER"].includes(user.role)) {
    throw redirectToSignin(request)
    // throw redirect("/auth/signin?authstate=unauthorized")
  }
}

export async function requireModeratorRole(request: Request, user: User) {
  logger.debug("👑 requireModeratorRole start")

  if (user && !["SUPER", "ADMIN", "MODERATOR"].includes(user.role)) {
    throw redirectToSignin(request)
  }
}

export async function requireAdminRole(request: Request, user: User) {
  logger.debug("👑 requireAdminRole start")

  if (user && !["SUPER", "ADMIN"].includes(user.role)) {
    throw redirectToSignin(request)
  }
}

export async function requireSuperRole(request: Request, user: User) {
  logger.debug("👑 requireSuperRole start")

  if (user && !["SUPER"].includes(user.role)) {
    throw redirectToSignin(request)
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
