import type { Role } from "@prisma/client"
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/node"
import { json } from "@remix-run/node"
import { useLoaderData, useParams, useRouteLoaderData } from "@remix-run/react"
import { z } from "zod"
import BackButton from "~/components/ui/buttons/back-button"
import BaseNameButton from "~/components/ui/buttons/base-name-button"
import PropertyButton from "~/components/ui/buttons/property-button"
import StudentCard from "~/components/ui/student-card/student-card"
import ErrorBoundaryDocument from "~/components/util/error-boundary-document"
import { deleteExecuteAction } from "~/lib/.server/actions/delete-execute"
import { deleteUndoAction } from "~/lib/.server/actions/delete-undo"
import { propertyExecuteAction } from "~/lib/.server/actions/property-execute"
import { renameExecuteAction } from "~/lib/.server/actions/rename-execute"
import { errorResponses } from "~/lib/error-responses"
import {
  execPermissions,
  getDrive,
  getFileById,
} from "~/lib/google/drive.server"
import { requireAdminRole, requireUserRole } from "~/lib/require-roles.server"
import { getUserFromSessionOrRedirect } from "~/lib/session.server"
import { parseTags } from "~/lib/utils/utils"
import { convertDriveFiles } from "~/lib/utils/utils-loader"
import { logger } from "~/logger"
import DeleteButton from "~/routes/files.$gakunen.$hr._index/components/delete-button"
import PermissionTags from "./components/permission-tags"
import ToFolderButton from "./components/to-folder-button"

const CACHE_MAX_AGE = 60 * 10 // 10 minutes

/**
 * Loader Function
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: student.$studentFolderId.$fileId  ${request.url}`)
  const { user, credential } = await getUserFromSessionOrRedirect(request)
  await requireUserRole(request, user)

  const { fileId } = params
  if (!fileId) {
    throw errorResponses.badRequest(`GoogleファイルIDが設定されていません。`)
  }

  const drive = await getDrive(credential.accessToken)
  if (!drive) {
    throw errorResponses.google()
  }

  const driveFile = await getFileById(drive, fileId)

  const tags: string[] = parseTags(driveFile?.appProperties?.tags || "")

  // call drive
  const permissions = await execPermissions(drive, fileId)

  const headers = new Headers()
  headers.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`) // 10 minutes

  return json(
    {
      driveFile,
      permissions,
      tags,
    },
    {
      headers,
    },
  )
}

// Zod Data Type
const FormDataScheme = z.object({
  intent: z.string(),
})

/**
 * Action
 * /student/$studentFolderId/$fileId
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: student.$studentFolderId.$fileId ${request.url}`)
  const { user } = await getUserFromSessionOrRedirect(request)
  await requireAdminRole(request, user)

  const formData = await request.formData()
  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return json(
      { ok: false, type: "property", error: result.error.message },
      { status: 400 },
    )
  }

  let { intent } = result.data

  switch (intent) {
    /**
     * EXECUTE ACTION
     */
    case "property": {
      logger.debug(`✅ action: property`)

      return await propertyExecuteAction(request, formData)
    }
    case "rename": {
      logger.debug(`✅ action: rename`)

      return await renameExecuteAction(request, formData)
    }

    case "delete": {
      logger.debug(`✅ action: delete`)
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
  // console.log("✅ student.$studentFolderId.$fileId/route.tsx")

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
