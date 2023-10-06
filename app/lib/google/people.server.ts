import { google } from "googleapis"

import { getClient } from "./google.server"

import type { admin_directory_v1, people_v1 } from "googleapis"
import type { Person } from "~/types"

/**
 * getPeople
 *
 * @param {string} accessToken
 * @return {*}  {(Promise<people_v1.People | null>)}
 */
async function getPeople(
  accessToken: string,
): Promise<people_v1.People | null> {
  const client = await getClient(accessToken)

  if (!client) return null

  const people = google.people({
    version: "v1",
    auth: client,
  })

  if (!people) return null
  else return people
}

/**
 * getAdmin
 *
 * @export
 * @param {string} accessToken
 * @return {*}  {(Promise<admin_directory_v1.Admin | null>)}
 */
export async function getAdmin(
  accessToken: string,
): Promise<admin_directory_v1.Admin | null> {
  const client = await getClient(accessToken)

  if (!client) return null

  const admin = google.admin({
    version: "directory_v1",
    auth: client,
  })

  if (!admin) return null
  else return admin
}

export async function getUserInfo(accessToken: string) {
  const url = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`

  const resp = await fetch(url)
    .then((r) => r.json())
    .catch((e) => {})

  const person: Person = {
    email: resp.email,
    first: resp.given_name,
    last: resp.family_name,
    picture: resp.picture,
  }

  return person
}

/*
{
  sub: '106691296406499736818',
  name: '藤本俊',
  given_name: '俊',
  family_name: '藤本',
  picture: 'https://lh3.googleusercontent.com/a/ACg8ocL3BjvoSTEovM4HD1J6YIEZwEpSnyXY2xcuf1nL2GuiY2E=s96-c',
  email: 's-fujimoto@seig-boys.jp',
  email_verified: true,
  locale: 'ja',
  hd: 'seig-boys.jp'
}
*/

/**
 * getPersonFromPeople
 *
 * @export
 * @param {string} accessToken
 * @return {*}  {(Promise<Person | null>)}
 */
export async function getPersonFromPeople(
  accessToken: string,
): Promise<Person | null> {
  const people = await getPeople(accessToken)

  if (!people) return null

  const resp = await people.people.get({
    resourceName: "people/me",
    personFields: "emailAddresses,names,photos,coverPhotos,metadata",
  })

  const first = resp.data.names?.at(0)?.givenName
  const last = resp.data.names?.at(0)?.familyName
  const picture = resp.data.photos?.at(0)?.url || ""

  const email = resp.data.emailAddresses?.at(0)?.value

  if (!email || !first || !last) return null

  return { email, first, last, picture }
}
