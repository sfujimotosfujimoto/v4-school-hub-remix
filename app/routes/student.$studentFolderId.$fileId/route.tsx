import type { Role } from "@prisma/client"
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/node"
import { json } from "@remix-run/node"
import { useLoaderData, useParams, useRouteLoaderData } from "@remix-run/react"
import invariant from "tiny-invariant"
import { z } from "zod"
import BackButton from "~/components/ui/buttons/back-button"
import StudentCard from "~/components/ui/student-card/student-card"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import { deleteExecuteAction } from "~/lib/actions/delete-execute"
import { deleteUndoAction } from "~/lib/actions/delete-undo"
import { propertyExecuteAction } from "~/lib/actions/property-execute"
import { renameExecuteAction } from "~/lib/actions/rename-execute"
import {
  execPermissions,
  getDrive,
  getFileById,
} from "~/lib/google/drive.server"
import { requireAdminRole, requireUserRole } from "~/lib/require-roles.server"
import { getUserFromSession } from "~/lib/session.server"
import { parseTags } from "~/lib/utils"
import { logger } from "~/logger"
import DeleteButton from "../files.$gakunen.$hr._index/components/delete-button"
import BaseNameButton from "../student.$studentFolderId._index/components/base-name-button"
import PropertyButton from "../student.$studentFolderId._index/components/property-button"
import PermissionTags from "./components/permission-tags"
import ToFolderButton from "./components/to-folder-button"
import { redirectToSignin } from "~/lib/responses"
import { convertDriveFiles } from "~/lib/utils-loader"

/**
 * Loader Function
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: student.$studentFolderId.$fileId  ${request.url}`)
  const user = await getUserFromSession(request)
  if (!user || !user.credential) throw redirectToSignin(request)
  await requireUserRole(request, user)

  const { fileId } = params
  if (!fileId) throw redirectToSignin(request)

  invariant(fileId, "fileId in params is required")

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirectToSignin(request)

  const driveFile = await getFileById(drive, fileId)

  const tags: string[] = parseTags(driveFile?.appProperties?.tags || "")

  // call drive
  const permissions = await execPermissions(drive, fileId)

  return {
    driveFile,
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
  const user = await getUserFromSession(request)
  if (!user || !user.credential) throw redirectToSignin(request)
  await requireAdminRole(request, user)

  if (!user || !user.credential) throw redirectToSignin(request)

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
      title: `SCHOOL HUB TEACHER`,
    },
  ]
}

/**
 * StudentFolderFileIdPage
 */
export default function StudentFolderIdFileIdPage() {
  const { driveFile, permissions, tags } =
    useLoaderData<SerializeFrom<typeof loader>>()
  console.log("✅ student.$studentFolderId.$fileId/route.tsx")

  const { role } = useRouteLoaderData("routes/student.$studentFolderId") as {
    role: Role
  }

  const df = convertDriveFiles([driveFile])[0]

  // JSX -------------------------
  return (
    <>
      <div className="flex items-center gap-4">
        <BackButton />
        {df && df.parents && <ToFolderButton parentId={df.parents[0]} />}
        {/* PROPERTY BUTTON */}
        {role && ["ADMIN", "SUPER"].includes(role) && (
          <>
            <PropertyButton driveFiles={df ? [df] : []} tags={tags} />
            <BaseNameButton driveFiles={df ? [df] : []} />
            <DeleteButton driveFiles={[df]} />
          </>
        )}
      </div>

      {/* Student file card */}
      <div className="mt-4">
        {df && (
          <a
            id="_StudentCard"
            target="_blank"
            rel="noopener noreferrer"
            href={`${df.webViewLink}`}
          >
            <StudentCard role={role} driveFile={df} thumbnailSize={"big"} />
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
  let message = `フォルダID（${studentFolderId}）からファイル（${fileId}）を取得できませんでした。`
  return <ErrorBoundaryDocument message={message} />
}
