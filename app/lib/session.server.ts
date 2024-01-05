import { logger } from "~/logger"

import { createCookieSessionStorage, json, redirect } from "@remix-run/node"

import { SESSION_MAX_AGE } from "./config"

import type { TypedResponse } from "@remix-run/node"
import type { User } from "~/type.d"
import { getRefreshUserById, getUserById } from "./user.server"
const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET) throw Error("session secret is not set")

// creates SessionStorage Instance -------------------------
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
})

// Sets session called "userJWT"  -------------------------
// used in [`signin.server.ts`]
export async function createUserSession(userId: number, redirectPath: string) {
  const session = await sessionStorage.getSession()
  session.set("userId", userId)
  return redirect(redirectPath, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  })
}

// Destroys the user session -------------------------
// used in [`auth.signout.tsx`]
export async function destroyUserSession(
  request: Request,
  redirectPath: string,
): Promise<TypedResponse<never>> {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"))

  return redirect(redirectPath, {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  })
}

// Gets UserBase from Session -------------------------
// used in [`root.tsx`, `user.server.ts`]
export async function getUserFromSession(
  request: Request,
): Promise<User | null> {
  logger.debug(
    `👑 getUserFromSession: request ${request.url}, ${request.method}`,
  )

  const session = await sessionStorage.getSession(request.headers.get("Cookie"))

  const userId = Number(session.get("userId") || 0)

  const user = await getUserById(userId)
  if (!user) {
    return null
  }

  logger.debug(
    `👑 getUserFromSession: exp ${new Date(
      user.credential?.expiry || 0,
    ).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} -- request.url ${
      request.url
    }`,
  )

  return user
}

export async function getRefreshUserFromSession(
  request: Request,
): Promise<User | null> {
  logger.debug(
    `👑 getRefreshUserFromSession: request ${request.url}, ${request.method}`,
  )
  const session = await sessionStorage.getSession(request.headers.get("Cookie"))

  const userId = Number(session.get("userId") || 0)
  // const userJWT = await getUserJWTFromSession(request)

  // if (!userJWT) return null

  // const payload = await parseVerifyUserJWT(userJWT)

  // if (!payload) return null

  // get UserBase from Prisma
  const user = await getRefreshUserById(userId)
  // if no user, create in prisma db
  if (!user) {
    return null
  }

  logger.debug(
    `👑 getRefreshUserFromSession: rexp ${new Date(
      Number(user?.credential?.refreshTokenExpiry) || "",
    ).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} -- requrest.url ${
      request.url
    }`,
  )

  return user
}

export async function updateSession(
  key: string,
  value: string,
  headers = new Headers(),
) {
  logger.debug("✅ updateSession")
  try {
    // update the session with the new values
    const session = await sessionStorage.getSession()
    session.set(key, value)
    // commit the session and append the Set-Cookie header
    headers.append("Set-Cookie", await sessionStorage.commitSession(session))
    return headers
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error("Error updating session")
  }
}

export async function setSession(userJWT: string, returnObj: any) {
  const session = await sessionStorage.getSession()
  session.set("userJWT", userJWT)

  return json(
    {
      ...returnObj,
    },
    {
      status: 200,
      headers: {
        // "Cache-Control": `max-age=${60 * 10}`,
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    },
  )
}

//-------------------------------------------
// LOCAL FUNCTIONS
//-------------------------------------------
// Gets session in Request Headers -------------------------
// then gets "userJWT"
export async function getUserJWTFromSession(
  request: Request,
): Promise<string | null> {
  logger.debug("👑 getUserJWTFromSession")

  const session = await sessionStorage.getSession(request.headers.get("Cookie"))
  // logger.debug(`👑 session:  ${session.get("userJWT")}`)

  const userJWT = session.get("userJWT") as string | null | undefined

  // logger.debug(`👑 getUserJWTFromSession: userJWT: ${userJWT?.slice(0, 20)}...`)

  if (!userJWT) {
    return null
  }

  return userJWT
}

// export async function parseVerifyUserJWT(
//   userJWT: string,
// ): Promise<Payload | null> {
//   // decode the JWT and get payload<email,exp>
//   const secret = new TextEncoder().encode(process.env.SESSION_SECRET)
//   const { payload } = await jose.jwtVerify(userJWT, secret)
//   // const payload = jose.decodeJwt(userJWT) as { email: string; exp: number }
//   if (payload.email === undefined || payload.exp === undefined) return null

//   const typedPayload = payload as Payload
//   return typedPayload
// }

// // Gets payload<email, exp> from "userJWT"
// async function verifyUserJWT(userJWT: string): Promise<Payload | null> {
//   const typedPayload = await parseVerifyUserJWT(userJWT)
//   if (!typedPayload) return null
//   // check if expired
//   if (isExpired(typedPayload.exp)) {
//     return null
//   }

//   return typedPayload
// }
