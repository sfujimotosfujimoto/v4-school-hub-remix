import { logger } from "~/logger"
import { User } from "~/types"

import { prisma } from "./db.server"
import { getRefreshedToken } from "./google/google.server"
import { returnUser } from "./returnUser"
import { getUserJWTFromSession, parseVerifyUserJWT } from "./session.server"
import { getUserByEmail } from "./user.server"
import { isExpired } from "./utils.server"

/**
 * authenticate
 * 1. get session from cookies
 * 2. parse end verify userJWT (checks if expired)
 * 3. get user from session
 * 4-1. if rexp expired, return error
 * 4-2. if exp expired, try to refresh token
 * 4-2-1. fetch endpoint to refresh token
 * 4-2-2. updated payload
 * 5. return user
 *
 */
export async function authenticate(
  request: Request,
): Promise<{ user?: User; error?: string; userJWT?: string }> {
  logger.debug(`✅ authenticate: start`)
  // 1. get session from cookies
  const userJWT = await getUserJWTFromSession(request)

  if (!userJWT) {
    return { error: "Could not get userJWT from session" }
  }

  // 2. parse end verify userJWT (checks if expired)
  let payload = await parseVerifyUserJWT(userJWT)

  if (!payload) {
    return { error: "Could not parse userJWT" }
  }

  // 3. get user from session
  const user = await getUserByEmail(payload.email)
  if (!user) {
    return { error: "Could not find user" }
  }

  logger.debug(`✅ authenticate: expExpired`)
  const expExpired = isExpired(payload.exp)
  logger.debug(`✅ authenticate: rexpExpired`)
  const rexpExpired = isExpired(payload.rexp)

  // 4-1. if rexp expired, return error
  if (rexpExpired) {
    logger.debug("✅ authenticate: rexpExpired")
    return { error: "rexp is expired" }
  } else if (expExpired) {
    // 4-2. if exp expired, try to refresh token
    logger.debug("✅ authenticate: expired")

    // 4-2-1. fetch endpoint to refresh token
    const jsn = await fetch(`${process.env.BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user,
        email: payload.email,
        accessToken: user.credential?.accessToken,
        refreshToken: user.credential?.refreshToken,
      }),
    })
      .then((res) => {
        logger.debug("✅ authenticate: fetch res")
        return res.json()
      })
      .catch((err) => {
        console.error(`❌ authenticate: fetch error`, err.message)
        return { error: "error in fetch" }
      })

    logger.debug(
      `✅ authenticate: expiry: ${new Date(
        Number(jsn.data.user.credential.expiry || 0),
      ).toLocaleString()}`,
    )
    if (!jsn.ok) {
      return { error: "Could not get response" }
    }

    const newUser = returnUser(jsn.data.user)

    // 4-2-2. updated payload
    return { user: newUser, userJWT: jsn.data.userJWT }
  } else {
    logger.debug("✅ authenticate: not expired")
    return { user, userJWT }
  }
}

/**
 *
 */
export async function updateRefreshedAccessToken(
  user: User,
): Promise<User | null> {
  logger.debug("✅ updateRefreshedAccessToken")

  // get refreshToken and when it was created
  const refreshToken = user.credential?.refreshToken
  // get accessToken
  const accessToken = user.credential?.accessToken

  logger.debug("✅ updateRefreshAccessToken: accessToken", accessToken)

  if (!refreshToken || !accessToken) return null

  const isRefreshTokenOk = checkRefreshTokenExpiry(user)
  if (!isRefreshTokenOk) return null

  let { access_token: newAccessToken, expiry_date } = await getRefreshedToken(
    accessToken,
    refreshToken,
  )

  // TODO: !!DELETE expiry date: delete after testing
  // const expiryDateDummy = Date.now() + 1000 * 20 // 20 seconds
  // expiry_date = expiryDateDummy

  logger.debug(
    `---- updateRefreshAccessToken:expiry_date ${new Date(
      expiry_date || 0,
    ).toLocaleString()}
  `,
  )
  if (!newAccessToken || !expiry_date) return null

  const updatedUser = await prisma.user.update({
    where: {
      email: user.email,
    },
    data: {
      credential: {
        update: {
          accessToken: newAccessToken,
          expiry: Number(expiry_date),
        },
      },
    },
    select: {
      ...selectUser,
    },
  })

  if (!updatedUser) {
    return null
  }

  // returns redirect
  // await updateUserSession(email, expiry_date, request.url)

  return returnUser(updatedUser)
}

function checkRefreshTokenExpiry(user: User) {
  const expiry = user.credential?.refreshTokenExpiry || 0
  const now = Date.now()

  if (expiry < now) {
    return false
  }
  return true
}

const selectUser = {
  id: true,
  first: true,
  last: true,
  picture: true,
  email: true,
  activated: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  credential: {
    select: {
      accessToken: true,
      expiry: true,
      refreshToken: true,
      createdAt: true,
      refreshTokenExpiry: true,
    },
  },
  stats: {
    select: {
      count: true,
      lastVisited: true,
    },
  },
}
