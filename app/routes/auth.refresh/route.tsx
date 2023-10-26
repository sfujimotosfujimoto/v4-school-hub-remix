import { json } from "@remix-run/node"
import type { ActionFunctionArgs } from "@remix-run/node"
import { prisma } from "~/lib/db.server"

import { logger } from "~/logger"

// functions
import { getRefreshedToken } from "~/lib/google/google.server"
import { returnUser } from "~/lib/return-user"
import { parseVerifyUserJWT } from "~/lib/session.server"
import { updateUserJWT } from "~/lib/signinout.server"

/**
 * Loader function
 */
export async function loader({ request }: ActionFunctionArgs) {
  logger.debug(`🍿 loader: auth.refresh ${request.url}`)

  return json({ ok: true }, 200)
}

/**
 * Action for refresh token
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: auth.refresh ${request.url}`)

  if (request.method !== "POST") {
    return json({ ok: false, message: "method error" }, { status: 400 })
  }

  const { email, accessToken, refreshToken } = await request.json()

  if (!email || !accessToken || !refreshToken)
    return json(
      { ok: false, message: "no email or accessToken or refreshToken" },
      { status: 400 },
    )

  // 1. refresh token by caling google api
  let {
    access_token: newAccessToken,
    expiry_date,
    refresh_token: newRefreshToken,
  } = await getRefreshedToken(accessToken, refreshToken)
  if (!newAccessToken || !expiry_date)
    return json({ ok: false }, { status: 400 })

  // TODO: !!DELETE expiry date: delete after testing
  // const expiryDateDummy = Date.now() + 1000 * 20 // 20 seconds
  // expiry_date = expiryDateDummy

  logger.debug(
    `✅ in auth.refresh action: expiry ${new Date(
      Number(expiry_date),
    ).toLocaleString()}`,
  )

  // 2. update user.credential in db
  const updatedUser = await prisma.user.update({
    where: {
      email: email,
    },
    data: {
      credential: {
        update: {
          accessToken: newAccessToken,
          expiry: Number(expiry_date),
          refreshToken: newRefreshToken,
          refreshTokenExpiry: Number(Date.now() + 1000 * 60 * 60 * 24 * 14),
        },
      },
    },
    select: {
      ...selectUser,
    },
  })

  if (!updatedUser) {
    return json({ ok: false }, { status: 400 })
  }

  try {
    // 3. update userJWT in session
    const userJWT = await updateUserJWT(
      updatedUser.email,
      expiry_date,
      Number(updatedUser.credential?.refreshTokenExpiry) || 0,
    )
    const payload = await parseVerifyUserJWT(userJWT)
    if (!payload) {
      return json({ ok: false }, { status: 400 })
    }

    logger.debug(
      `✅ in auth.refresh action: new payload.exp ${new Date(
        Number(payload.exp),
      ).toLocaleString()}`,
    )

    // 4. update session
    // TODO: Does this have any meaning
    // const session = await sessionStorage.getSession()
    // session.set("userJWT", userJWT)
    // return json({ ok: true })

    // const val = session.get("userJWT")

    // const valJWT = await parseVerifyUserJWT(val)

    // logger.debug(
    //   `✅ in auth.refresh action: valJWT.exp ${new Date(
    //     Number(valJWT?.exp || 0),
    //   ).toLocaleString()}`,
    // )
    const newUser = returnUser(updatedUser)

    return json(
      {
        ok: true,
        data: {
          user: newUser,
          userJWT: userJWT,
        },
      },
      // {
      //   status: 200,
      //   headers: {
      //     "Set-Cookie": await sessionStorage.commitSession(session),
      //   },
      // },
    )
  } catch (error) {
    console.error(`❌  error in auth.refresh action:`, error)
    return json({ ok: false }, { status: 400 })
  }
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
