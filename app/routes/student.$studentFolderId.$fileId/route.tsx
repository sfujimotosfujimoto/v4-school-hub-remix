import { redirect } from "@remix-run/node"
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { useLoaderData, useParams, useRouteLoaderData } from "@remix-run/react"
import type { Role } from "@prisma/client"

import invariant from "tiny-invariant"

import type { DriveFile, Permission } from "~/types"

// components
import BackButton from "~/components/ui/buttons/back-button"
import StudentCard from "~/components/ui/student-card/student-card"
import PermissionTags from "./components/permission-tags"
import ToFolderButton from "./components/to-folder-button"

// functions
import { execPermissions, getDrive } from "~/lib/google/drive.server"
import { requireUserRole } from "~/lib/require-roles.server"
import { destroyUserSession, getUserFromSession } from "~/lib/session.server"
// import { authenticate } from "~/lib/authenticate.server"
import { logger } from "~/logger"

/**
 * StudentFolderFileIdPage
 */
export default function StudentFolderIdFileIdPage() {
  const { permissions } = useLoaderData<{ permissions: Permission[] }>()

  const { fileId } = useParams()
  const { driveFiles, role } = useRouteLoaderData(
    "routes/student.$studentFolderId",
  ) as { driveFiles: DriveFile[]; role: Role }

  const driveFile = driveFiles?.find((r) => r.id === fileId)

  // JSX -------------------------
  return (
    <>
      <div className="flex items-center gap-4">
        <BackButton />
        {driveFile && driveFile.parents && (
          <ToFolderButton parentId={driveFile.parents[0]} />
        )}
      </div>

      {/* Student file card */}
      <div className="mt-4">
        {driveFile && (
          <a
            id="_StudentCard"
            target="_blank"
            rel="noopener noreferrer"
            href={`${driveFile.link}`}
          >
            <StudentCard
              role={role}
              driveFile={driveFile}
              thumbnailSize={"big"}
            />
          </a>
        )}
      </div>

      {/* Permissiong Tags List */}
      <div className="mt-4">
        <PermissionTags permissions={permissions} />
      </div>
    </>
  )
}

/**
 * Loader Function
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: student.$studentFolderId.$fileId  ${request.url}`)
  const user = await getUserFromSession(request)
  if (!user || !user.credential) {
    return destroyUserSession(request, `/?authstate=unauthenticated`)
  }
  await requireUserRole(user)

  const fileId = params.fileId

  invariant(fileId, "fileId in params is required")

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized-28")

  // call drive
  const permissions = await execPermissions(drive, fileId)

  return {
    permissions,
  }
}

/**
 * Meta Function
 */
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: `SCHOOL HUB`,
    },
  ]
}
