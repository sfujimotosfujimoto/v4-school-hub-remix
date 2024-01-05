import { useLoaderData } from "@remix-run/react"
import {
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node"

import type { User } from "~/type.d"

// components
import Tables from "./components/tables"
// functions
import { getUsers } from "~/lib/user.server"
import { z } from "zod"
import { logger } from "~/logger"
import { authenticate } from "~/lib/authenticate.server"
import { requireAdminRole } from "~/lib/require-roles.server"
// context
// hooks

const userSchema = z.array(
  z.object({
    id: z.string(),
    email: z.string(),
    activated: z.boolean(),
    last: z.string(),
    first: z.string(),
    stats: z
      .object({
        count: z.number(),
        lastVisited: z.string(),
      })
      .optional(),
  }),
)

export type PartialUsers = z.infer<typeof userSchema>

/**
 * Page
 */
export default function AdminPage() {
  const { users: rawUsers } = useLoaderData<typeof loader>()

  const result = userSchema.safeParse(rawUsers)

  let users: PartialUsers | null = null

  if (result.success) {
    users = result.data
  }

  if (!rawUsers || rawUsers.length === 0) {
    return <h1>NO USERS</h1>
  }

  return (
    <section
      data-name="admin._index"
      className="mx-auto w-full max-w-5xl overflow-x-auto p-4"
    >
      <div className="mx-auto max-h-[calc(100dvh-200px)] w-full overflow-x-auto">
        {!users && <h1>NO DATA</h1>}
        {users && <Tables users={users} />}
      </div>
    </section>
  )
}

/**
 * Loader
 */
// activtated,last, first, stats.count, stats.lastVisited
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: admin._index ${request.url}`)
  const { user } = await authenticate(request)
  await requireAdminRole(user)

  if (!user || !user.credential) {
    throw redirect("/?authstate=unauthenticated")
  }

  const users = await getUsers()

  if (!users) return { users: null }
  const filtered: Partial<User>[] = users?.map((u) => {
    return {
      activated: u.activated,
      last: u.last,
      first: u.first,
      stats: {
        count: u.stats?.count || 0,
        lastVisited: u.stats?.lastVisited || new Date(),
      },
    }
  })

  return { users: filtered }
}

export const meta: MetaFunction = () => {
  return [{ title: "ADMIN | SCHOOL HUB" }]
}

/*

    <section
      data-name="admin._index.tsx"
      className="h-full p-8 mx-auto overflow-x-auto"
    >
      <div className="w-full h-full mx-auto overflow-x-hidden">
        <div className="mb-4">
          <h1 className="text-5xl">Admin</h1>
        </div>

        <div className="overflow-x-auto">
          {users && <AdminCards users={parsedUsers} />}
        </div>
      </div>
    </section>
*/
