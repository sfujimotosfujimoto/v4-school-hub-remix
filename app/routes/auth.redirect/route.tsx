import { type LoaderFunctionArgs } from "@remix-run/node"
import { z } from "zod"
import { DEV_EXPIRY, DEV_REFERSH_EXPIRY, REFRESH_EXPIRY } from "~/config"
import { prisma } from "~/lib/db.server"
import { errorResponses } from "~/lib/error-responses"
import { getClientFromCode, getUserInfo } from "~/lib/google/google.server"
import { createUserSession } from "~/lib/session.server"
import { updateUser } from "~/lib/user.server"
import { checkValidSeigEmail, toLocaleString } from "~/lib/utils/utils"
import { logger } from "~/logger"

//update timeout
export const config = {
  maxDuration: 60,
}

const TokenSchema = z.object({
  token_type: z.string(),
  access_token: z.string(),
  scope: z.string(),
  expiry_date: z.number(),
  refresh_token: z.string().optional(),
  id_token: z.string(),
})

/**
 * Loader function
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: auth.redirect ${request.url}`)
  // get code from url query
  const parsedUrl = new URL(request.url)
  const code = parsedUrl.searchParams.get("code")

  // if no "code" , do not touch and resolve
  if (!code) throw Error("no code")

  logger.debug(`💥 start: signin()`)
  let start1 = performance.now()

  const { tokens } = await getClientFromCode(code)

  // verify token with zod
  const result = TokenSchema.safeParse(tokens)

  if (!result.success) {
    console.error(result.error.errors)
    throw Error("could not parse token")
  }

  const { access_token, scope, token_type, refresh_token } = result.data
  if (!access_token) {
    throw errorResponses.unauthorized()
  }

  let { expiry_date } = result.data

  // TODO: !!DEBUG!!: setting expiryDateDummy to 10 seconds
  if (process.env.NODE_ENV === "development") {
    expiry_date = Date.now() + DEV_EXPIRY
  }

  let refreshTokenExpiry = new Date(Date.now() + REFRESH_EXPIRY) // 14 days

  if (process.env.NODE_ENV === "development") {
    refreshTokenExpiry = new Date(Date.now() + DEV_REFERSH_EXPIRY)
  }

  logger.debug(`💥 start: getUserInfo`)
  let start2 = performance.now()

  // const  = await getSession(request)
  const person = await getUserInfo(access_token)

  let end2 = performance.now()
  logger.debug(`🔥   end: getUserInfo time: ${(end2 - start2).toFixed(2)} ms`)

  if (!person) {
    throw errorResponses.unauthorized()
  }

  logger.info(
    `🍓 signin: new expiry_date ${person.last} ${person.first} - ${toLocaleString(expiry_date)}`,
  )

  logger.info(
    `🍓 signin: new refreshTokenExpiry ${person.last} ${person.first} - ${toLocaleString(refreshTokenExpiry)}`,
  )

  if (!checkValidSeigEmail(person.email)) {
    throw errorResponses.account()
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

  const statsUpsert = prisma.stats.upsert({
    where: {
      userId: userPrisma.id,
    },
    update: {},
    create: {
      userId: userPrisma.id,
    },
  })

  const credentialUpsert = prisma.credential.upsert({
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
  })

  prisma.$transaction([statsUpsert])
  await prisma.$transaction([credentialUpsert])

  let end3 = performance.now()
  logger.debug(`🔥   end: upsert time: ${(end3 - start3).toFixed(2)} ms`)

  updateUser(userPrisma.id)

  let end1 = performance.now()
  logger.debug(`🔥   end: signin() time: ${(end1 - start1).toFixed(2)} ms`)

  return createUserSession(userPrisma.id, access_token, "/")
}
