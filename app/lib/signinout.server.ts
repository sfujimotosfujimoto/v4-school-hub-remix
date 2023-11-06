import * as jose from "jose"
import { z } from "zod"
import { logger } from "~/logger"

import { redirect } from "@remix-run/node"

import { prisma } from "./db.server"
import { getClientFromCode, getUserInfo } from "./google/google.server"
import { createUserSession } from "./session.server"
import { checkValidSeigEmail } from "./utils"

import type { TypedResponse } from "@remix-run/node"
const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET) throw Error("session secret is not set")

const TokenSchema = z.object({
  token_type: z.string(),
  access_token: z.string(),
  scope: z.string(),
  expiry_date: z.number(),
  refresh_token: z.string().optional(),
  id_token: z.string(),
})

/**
 * signin
 */
export async function signin({
  code,
}: {
  code: string
}): Promise<TypedResponse<never>> {
  logger.debug("🍓 signin")
  const { tokens } = await getClientFromCode(code)

  // verify token with zod
  const result = TokenSchema.safeParse(tokens)

  if (!result.success) {
    console.error(result.error.errors)
    throw redirect(`/?authstate=unauthorized-001`)
  }

  let { access_token, expiry_date, scope, token_type, refresh_token } =
    result.data

  // TODO: !!DEBUG!!: setting expiryDateDummy to 10 seconds
  const expiryDummy = new Date().getTime() + 1000 * 15
  expiry_date = expiryDummy

  // let refreshTokenExpiryDummy = Date.now() + 1000 * 30 // 30 seconds
  // let refreshTokenExpiry = refreshTokenExpiryDummy
  let refreshTokenExpiry = Date.now() + 1000 * 60 * 60 * 24 * 14 // 14 days

  logger.info(
    `🍓 signin: new expiry_date ${new Date(expiry_date || 0).toLocaleString(
      "ja-JP",
      { timeZone: "Asia/Tokyo" },
    )}`,
  )

  logger.info(
    `🍓 signin: new refreshTokenExpiry ${new Date(
      refreshTokenExpiry || 0,
    ).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
  )

  if (!access_token) {
    throw redirect(`/?authstate=unauthorized-002`)
  }

  const person = await getUserInfo(access_token)

  if (!person) {
    throw redirect(`/?authstate=unauthenticated`)
  }

  if (!checkValidSeigEmail(person.email)) {
    throw redirect(`/?authstate=not-seig-account`)
  }

  let userPrisma = await prisma.user.findUnique({
    where: {
      email: person.email,
    },
  })
  // if no user, create in prisma db
  if (!userPrisma) {
    userPrisma = await prisma.user.create({
      data: {
        first: person.first,
        last: person.last,
        email: person.email,
        picture: person.picture,
        role: "USER",
      },
    })
  }

  // check if user has stats in prisma db
  let stats = await prisma.stats.findUnique({
    where: {
      userId: userPrisma.id,
    },
  })

  // if no stats, create in prisma db
  if (!stats) {
    stats = await prisma.stats.create({
      data: {
        userId: userPrisma.id,
      },
    })
  }

  let cred = await prisma.credential.findUnique({
    where: {
      userId: userPrisma.id,
    },
  })

  if (!cred) {
    // add credentials to cockroach db
    cred = await prisma.credential.create({
      data: {
        accessToken: access_token,
        scope: scope,
        tokenType: token_type,
        expiry: expiry_date,
        userId: userPrisma.id,
        refreshToken: refresh_token,
        refreshTokenExpiry: refreshTokenExpiry,
      },
    })
  } else {
    cred = await prisma.credential.update({
      where: {
        userId: userPrisma.id,
      },
      data: {
        accessToken: access_token,
        scope: scope,
        tokenType: token_type,
        expiry: expiry_date,
        refreshToken: refresh_token,
        refreshTokenExpiry: refreshTokenExpiry,
      },
    })
  }

  // if user passes email check, set user.activated to true
  const updatedUser = await prisma.user.update({
    where: {
      id: userPrisma.id,
    },
    data: {
      activated: true,
      stats: {
        update: {
          count: {
            increment: 1,
          },
          lastVisited: new Date(),
        },
      },
    },
  })

  if (!updatedUser) {
    redirect(`/?authstate=not-seig-account`)
  }

  const userJWT = await updateUserJWT(
    userPrisma.email,
    expiry_date,
    refreshTokenExpiry,
  )
  return createUserSession(userJWT, "/student")
}

// used in authenticate
export async function updateUserJWT(
  email: string,
  expiry: number,
  refreshTokenExpiry: number,
): Promise<string> {
  logger.debug(`🍓 signin: updateUserJWT: email ${email}`)
  const secret = process.env.SESSION_SECRET
  const secretEncoded = new TextEncoder().encode(secret)
  const userJWT = await new jose.SignJWT({ email, rexp: refreshTokenExpiry })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiry)
    .sign(secretEncoded)
  return userJWT
}
