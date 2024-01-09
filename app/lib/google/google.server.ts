import { google } from "googleapis"

import type { Auth } from "googleapis"
import { logger } from "~/logger"
import type { PersonGoogle } from "~/types"

export async function getClientFromCode(code: string): Promise<{
  client: Auth.OAuth2Client
  tokens: Auth.Credentials
}> {
  logger.debug(`✅ getClientFromCode`)
  // creates oauth2Client from client_id and client_secret
  const client = initializeClient()

  // get token from OAuth client
  const { tokens } = await client.getToken(code)

  // set credentials with refresh_token
  client.setCredentials(tokens)

  return {
    client,
    tokens,
  }
}

export async function getRefreshedToken(
  accessToken: string,
  refreshToken: string,
): Promise<Auth.Credentials> {
  logger.debug(`✅ getRefreshedToken`)
  const client = initializeClient()
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  const { credentials } = await client.refreshAccessToken()

  return credentials
}

/*********************************************************
 * Create OAuth client from given tokens in cookie
 */
export async function getClient(
  accessToken: string,
): Promise<Auth.OAuth2Client> {
  logger.debug(`✅ getClient`)
  const client = initializeClient()
  client.setCredentials({ access_token: accessToken })

  return client
}

export function initializeClient(): Auth.OAuth2Client {
  logger.debug(`✅ initializeClient`)
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_API_CLIENT_ID,
    process.env.GOOGLE_API_CLIENT_SECRET,
    process.env.GOOGLE_API_REDIRECT_URI,
  )
  return client
}

export async function getUserInfo(accessToken: string) {
  logger.debug(`✅ getUserInfo`)
  const url = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`

  const resp = await fetch(url)
    .then((r) => r.json())
    .catch((e) => {})

  const person: PersonGoogle = {
    email: resp.email,
    first: resp.given_name,
    last: resp.family_name,
    picture: resp.picture,
  }

  return person
}
