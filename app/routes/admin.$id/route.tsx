import type { Role } from "@prisma/client"
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { requireAdminRole } from "~/lib/require-roles.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { deleteUserById, getUserById, updateUserById } from "~/lib/user.server"
import { logger } from "~/logger"
import type { User } from "~/types"
import { UserSchema } from "~/types/schemas"
import AdminForm from "./components/admin-form"

/**
 * Loader
 */
export async function loader({ request, params }: LoaderFunctionArgs): Promise<{
  targetUser: User
  id: string
}> {
  logger.debug(`🍿 loader: admin.$id ${request.url}`)
  const { user } = await getUserFromSessionOrRedirect(request)
  await requireAdminRole(request, user)

  const { id } = params

  const targetUser = await getUserById(Number(id))
  if (!targetUser || !id) throw redirect(`/?authstate=unauthenticated`)

  const outputUser = {
    ...targetUser,
    credential: null,
  }

  return { targetUser: outputUser, id }
}

//-------------------------------------------

/**
 * Action
 */
export async function action({ request, params }: ActionFunctionArgs) {
  logger.debug(`🍺 action: admin.$id ${request.url}`)
  const { user } = await getUserFromSessionOrRedirect(request)
  await requireAdminRole(request, user)

  if (!user) throw redirect("/?authstate=unauthenticated")

  const formData = await request.formData()

  const { id } = params

  let { _action, activated, role } = Object.fromEntries(formData)

  switch (_action) {
    /**
     * UPDATE ACTION
     */
    case "update": {
      // Find User from id
      const user = await getUserById(Number(id))
      // Validate form
      if (!user) throw redirect("/?authstate=unauthenticated", 302)

      const updatedData = {
        activated: activated === "true" ? true : false,
        role: role ? (role as Role) : user.role,
      }

      // Update Data
      const updated = await updateUserById(Number(id), updatedData)
      if (!updated) throw redirect("/?authstate=update-failed")

      // Redirect user to same page with udpated data
      return redirect(`/admin`)
      // throw redirect(`/admin/${user.id}`)
    }

    /**
     * DELETE ACTION
     */
    case "delete": {
      // Find User from id
      const user = await getUserById(Number(id))
      // Validate form
      if (!user) throw redirect("/?authstate=unauthenticated")

      const deleted = await deleteUserById(Number(id))

      if (!deleted) throw new Error(`Could not delete user with id ${id}`)

      return redirect(`/admin`)
    }

    default:
      break
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  let username = null
  if (data?.targetUser?.last && data?.targetUser?.first) {
    username = `${data.targetUser.last}${data.targetUser.first}`
  }
  return [{ title: `${username ? username : "ユーザー"} | SCHOOL HUB TEACHER` }]
}

/**
 * Page
 */
export default function AdminIdPage() {
  let { targetUser } = useLoaderData<typeof loader>()

  const result = UserSchema.safeParse(targetUser)

  let user: User | null = null
  if (result.success) {
    user = result.data
  }

  // const user = rawUserToUser(targetUser)

  return (
    <section
      data-name="admin.$id.tsx"
      className="grid h-full w-full grid-cols-1 place-content-center p-8"
    >
      <article className="mx-auto h-full w-full max-w-sm rounded-md border-4 border-sfgreen-200 bg-slate-50 p-8 shadow-md">
        <div className="grid grid-cols-1 place-content-center">
          {user && <AdminForm user={user} />}
        </div>
      </article>
    </section>
  )
}
