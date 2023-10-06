import { google } from "googleapis"

import type { Auth } from "googleapis"

export async function getClientFromCode(code: string): Promise<{
  client: Auth.OAuth2Client
  tokens: Auth.Credentials
}> {
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
  const client = initializeClient()
  client.setCredentials({ access_token: accessToken })

  return client
}

export function initializeClient(): Auth.OAuth2Client {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_API_CLIENT_ID,
    process.env.GOOGLE_API_CLIENT_SECRET,
    process.env.GOOGLE_API_REDIRECT_URI,
  )
  return client
}
