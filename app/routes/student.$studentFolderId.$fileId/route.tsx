import type { Role } from "@prisma/client"
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import {
  useActionData,
  useLoaderData,
  useParams,
  useRevalidator,
  useRouteLoaderData,
} from "@remix-run/react"
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
import PermissionTags from "./permission-tags"
import ToFolderButton from "./to-folder-button"
import DeleteButton from "./delete-button"
import { CACHE_MAX_AGE } from "~/config"

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
export async function action({ request, params }: ActionFunctionArgs) {
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

      try {
        await propertyExecuteAction(request, formData)

        return redirect(
          `/student/${params.studentFolderId}?${Math.floor(Math.random() * 100000000000)}`,
          {
            headers: {
              "Cache-Control": "no-cache, max-age=0",
            },
          },
        )
      } catch (error) {
        throw errorResponses.server()
      }
    }
    case "rename": {
      logger.debug(`✅ action: rename`)

      return await renameExecuteAction(request, formData)
    }

    case "delete": {
      logger.debug(`✅ action: delete`)
      const res = await deleteExecuteAction(request, formData)

      console.log(
        "✅ student.$studentFolderId.$fileId/route.tsx ~ 	🌈 res ✅ ",
        res,
      )

      return redirect(`/student/${params.studentFolderId}?intent=delete`, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      })
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

  const { role } = useRouteLoaderData("routes/student.$studentFolderId") as {
    role: Role
  }
  const data = useActionData<typeof action>()
  const revalidator = useRevalidator()

  if (data?.ok === true && revalidator.state === "idle") {
    revalidator.revalidate()
  }

  const df = convertDriveFiles([driveFile])[0]

  // JSX -------------------------
  return (
    <>
      <div className="flex items-center gap-4">
        <BackButton replace={true} />
        {df && df.parents && <ToFolderButton parentId={df.parents[0]} />}
        {/* PROPERTY BUTTON */}
        {role && ["ADMIN", "SUPER"].includes(role) && (
          <>
            <PropertyButton driveFiles={df ? [df] : []} tags={tags} />
            <BaseNameButton driveFiles={df ? [df] : []} />
            <DeleteButton driveFile={df} />
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
