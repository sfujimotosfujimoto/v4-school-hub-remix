import { json, redirect } from "@remix-run/node"
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
import { useLoaderData, useParams, useRouteLoaderData } from "@remix-run/react"
import type { Role } from "@prisma/client"

import invariant from "tiny-invariant"

import type { DriveFile } from "~/types"

// components
import BackButton from "~/components/ui/buttons/back-button"
import StudentCard from "~/components/ui/student-card/student-card"
import PermissionTags from "./components/permission-tags"
import ToFolderButton from "./components/to-folder-button"

// functions
import {
  execPermissions,
  getDrive,
  getFileById,
} from "~/lib/google/drive.server"
import { requireAdminRole, requireUserRole } from "~/lib/require-roles.server"
import { destroyUserSession, getUserFromSession } from "~/lib/session.server"
// import { authenticate } from "~/lib/authenticate.server"
import { logger } from "~/logger"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import PropertyButton from "../student.$studentFolderId._index/components/property-button"
import BaseNameButton from "../student.$studentFolderId._index/components/base-name-button"
import DeleteButton from "../files.$gakunen.$hr._index/components/delete-button"
import { parseTags } from "~/lib/utils"
import { authenticate } from "~/lib/authenticate.server"
import { propertyExecuteAction } from "~/lib/actions/property-execute"
import { renameExecuteAction } from "~/lib/actions/rename-execute"
import { deleteExecuteAction } from "~/lib/actions/delete-execute"
import { deleteUndoAction } from "~/lib/actions/delete-undo"
import { z } from "zod"

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

  const driveFile = await getFileById(drive, fileId)
  // const driveFiles = await getDriveFiles(drive, `id='${fileId}'`)

  const tags: string[] = parseTags(driveFile?.appProperties?.tags || "")

  // call drive
  const permissions = await execPermissions(drive, fileId)

  return {
    permissions,
    tags,
  }
}

// Zod Data Type
const FormDataScheme = z.object({
  _action: z.string(),
})

/**
 * Action
 * /student/$studentFolderId/$fileId
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: student.$studentFolderId.$fileId ${request.url}`)
  const { user } = await authenticate(request)
  await requireAdminRole(user)

  if (!user || !user.credential)
    throw redirect("/?authstate=unauthenticated-move-001")

  const formData = await request.formData()
  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return json(
      { ok: false, type: "property", error: result.error.message },
      { status: 400 },
    )
  }

  let { _action } = result.data

  switch (_action) {
    /**
     * EXECUTE ACTION
     */

    case "property-execute": {
      logger.debug(`✅ action: property-execute`)

      return await propertyExecuteAction(request, formData)
    }
    case "rename-execute": {
      logger.debug(`✅ action: rename-execute`)

      return await renameExecuteAction(request, formData)
    }

    case "delete-execute": {
      logger.debug(`✅ action: delete-execute`)
      return await deleteExecuteAction(request, formData)
      // logger.debug(`✅ action: "delete": ${fileIdsString}`)
      // return json({ ok: true })
      // return json({ ok: true, data: { fileIds } })
    }

    case "undo": {
      logger.debug(`✅ action: delete undo`)
      return await deleteUndoAction(request, formData)
    }

    default:
      break
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

/**
 * StudentFolderFileIdPage
 */
export default function StudentFolderIdFileIdPage() {
  const { permissions, tags } = useLoaderData<typeof loader>()
  console.log("✅ student.$studentFolderId.$fileId/route.tsx ~ 	😀 tags", tags)

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
        {/* PROPERTY BUTTON */}
        {role && ["ADMIN", "SUPER"].includes(role) && (
          <>
            <PropertyButton
              driveFiles={driveFile ? [driveFile] : []}
              tags={tags}
            />
            <BaseNameButton driveFiles={driveFile ? [driveFile] : []} />
            <DeleteButton driveFiles={driveFiles} />
          </>
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
 * Error Boundary
 */
export function ErrorBoundary() {
  const { studentFolderId, fileId } = useParams()
  let message = `フォルダID（${studentFolderId}）からファイル（${fileId}）のファイルを取得できませんでした。`
  return <ErrorBoundaryDocument message={message} />
}
