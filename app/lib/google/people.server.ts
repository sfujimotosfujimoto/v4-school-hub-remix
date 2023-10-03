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
