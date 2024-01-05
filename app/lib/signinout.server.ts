import * as jose from "jose"
import { z } from "zod"
import { logger } from "~/logger"

import { redirect } from "@remix-run/node"

import { prisma } from "./db.server"
import { getClientFromCode, getUserInfo } from "./google/google.server"
import { checkValidSeigEmail } from "./utils"

import { redirectToSignin } from "./responses"
import { updateUser } from "./user.server"
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
  request,
  code,
}: {
  request: Request
  code: string
}) {
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
  let refreshTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day

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
    throw redirectToSignin(request, { authstate: "no-access-token" })
  }

  const person = await getUserInfo(access_token)

  if (!person) {
    throw redirectToSignin(request, { authstate: "unauthorized" })
  }

  if (!checkValidSeigEmail(person.email)) {
    throw redirectToSignin(request, { authstate: `not-seig-account` })
  }

  let userPrisma = await prisma.user.upsert({
    where: {
      email: person.email,
    },
    update: {},
    create: {
      first: person.first,
      last: person.last,
      email: person.email,
      picture: person.picture,
      role: "USER",
    },
  })

  await prisma.$transaction([
    prisma.stats.upsert({
      where: {
        userId: userPrisma.id,
      },
      update: {},
      create: {
        userId: userPrisma.id,
      },
    }),
    prisma.credential.upsert({
      where: {
        userId: userPrisma.id,
      },
      update: {
        accessToken: access_token,
        scope: scope,
        tokenType: token_type,
        expiry: new Date(expiry_date),
        refreshToken: refresh_token,
        refreshTokenExpiry: refreshTokenExpiry,
      },
      create: {
        accessToken: access_token,
        scope: scope,
        tokenType: token_type,
        expiry: new Date(expiry_date),
        userId: userPrisma.id,
        refreshToken: refresh_token,
        refreshTokenExpiry: refreshTokenExpiry,
      },
    }),
  ])

  // if user passes email check, set user.activated to true

  const updatedUser = await updateUser(userPrisma.id)

  if (!updatedUser) {
    throw redirectToSignin(request, { authstate: `not-seig-account` })
  }

  return {
    userId: userPrisma.id,
    accessToken: access_token,
  }
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
