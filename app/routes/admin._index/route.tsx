import { type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { requireAdminRole } from "~/lib/require-roles.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { getUsers } from "~/lib/user.server"
import { logger } from "~/logger"
import type { User } from "~/types"
import Tables from "./tables"
import { UsersSchema } from "~/types/schemas"

// const userSchema = z.array(
//   z.object({
//     id: z.string(),
//     email: z.string(),
//     activated: z.boolean(),
//     last: z.string(),
//     first: z.string(),
//     stats: z
//       .object({
//         count: z.number(),
//         lastVisited: z.string(),
//       })
//       .optional(),
//   }),
// )

/**
 * Loader
 */
// activtated,last, first, stats.count, stats.lastVisited
export async function loader({ request }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: admin._index ${request.url}`)
  const { user } = await getUserFromSessionOrRedirect(request)
  await requireAdminRole(request, user)

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
  return [{ title: "ADMIN | SCHOOL HUB TEACHER" }]
}

// type PartialUsers = z.infer<typeof userSchema>

/**
 * Page
 */
export default function AdminPage() {
  const { users: rawUsers } = useLoaderData<typeof loader>()

  const result = UsersSchema.safeParse(rawUsers)

  let users: User[] | null = null

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
