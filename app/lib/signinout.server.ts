import * as jose from "jose"
import { z } from "zod"
import { logger } from "~/logger"
import { redirect } from "@remix-run/node"
import { prisma } from "./db.server"
import { getClientFromCode, getUserInfo } from "./google/google.server"
import { checkValidSeigEmail, toLocaleString } from "./utils/utils"

import { updateUser } from "./user.server"
import { errorResponses } from "./error-responses"
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

  logger.debug(`💥 start: getClientFromCode`)
  let start1 = performance.now()

  const { tokens } = await getClientFromCode(code)

  let end1 = performance.now()
  logger.debug(
    `🔥   end: getClientFromCode time: ${(end1 - start1).toFixed(2)} ms`,
  )

  // verify token with zod
  const result = TokenSchema.safeParse(tokens)

  if (!result.success) {
    console.error(result.error.errors)
    throw redirect(`/?authstate=unauthorized-001`)
  }

  let { access_token, expiry_date, scope, token_type, refresh_token } =
    result.data

  // TODO: !!DEBUG!!: setting expiryDateDummy to 10 seconds
  // const expiryDummy = new Date().getTime() + 1000 * 15
  // expiry_date = expiryDummy

  // let refreshTokenExpiryDummy = Date.now() + 1000 * 30 // 30 seconds
  // let refreshTokenExpiry = refreshTokenExpiryDummy
  let refreshTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) // 14 days

  if (!access_token) {
    throw errorResponses.unauthorized()
    // throw redirectToSignin(request, { authstate: "no-access-token" })
  }

  logger.debug(`💥 start: getUserInfo`)
  let start2 = performance.now()

  const person = await getUserInfo(access_token)

  let end2 = performance.now()
  logger.debug(`🔥   end: getUserInfo time: ${(end2 - start2).toFixed(2)} ms`)

  if (!person) {
    throw errorResponses.unauthorized()
    // throw redirectToSignin(request, { authstate: "unauthorized" })
  }

  logger.info(
    `🍓 signin: new expiry_date ${person.last} ${person.first} - ${toLocaleString(expiry_date)}`,
  )

  logger.info(
    `🍓 signin: new refreshTokenExpiry ${person.last} ${person.first} - ${toLocaleString(refreshTokenExpiry)}`,
  )

  if (!checkValidSeigEmail(person.email)) {
    throw errorResponses.account()
    // throw redirectToSignin(request, { authstate: `not-seig-account` })
  }

  logger.debug(`💥 start: upsert`)
  let start3 = performance.now()

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

  let end3 = performance.now()
  logger.debug(`🔥   end: upsert time: ${(end3 - start3).toFixed(2)} ms`)

  // if user passes email check, set user.activated to true

  updateUser(userPrisma.id)
  // const updatedUser = await updateUser(userPrisma.id)

  // if (!updatedUser) {
  //   throw errorResponses.account()
  //   // throw redirectToSignin(request, { authstate: `not-seig-account` })
  // }

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
