import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import React from "react"
import { z } from "zod"
import { CheckIcon } from "~/components/icons"
import StudentCards from "~/components/ui/student-card/student-cards"
import TaskCards from "~/components/ui/tasks/task-cards"
import { useDriveFilesContext } from "~/context/drive-files-context"
import {
  getDrive,
  getDriveFiles,
  queryMultipleStudentsAndFilename,
} from "~/lib/google/drive.server"
import { getSheets, getStudents } from "~/lib/google/sheets.server"
import { requireAdminRole, requireUserRole } from "~/lib/require-roles.server"
import { redirectToSignin } from "~/lib/responses"
import {
  getUserFromSession,
  getUserFromSessionOrRedirect,
} from "~/lib/session.server"
import { parseAppProperties, parseTags } from "~/lib/utils"
import { convertDriveFiles } from "~/lib/utils-loader"
import { setSelected } from "~/lib/utils.server"
import { logger } from "~/logger"
import type { DriveFile } from "~/types"
import { deleteExecuteAction } from "../../lib/actions/delete-execute"
import { deleteUndoAction } from "../../lib/actions/delete-undo"
import { propertyExecuteAction } from "../../lib/actions/property-execute"
import { renameExecuteAction } from "../../lib/actions/rename-execute"
import AllCheckButtons from "../student.$studentFolderId._index/components/all-check-buttons"
import BaseNameButton from "../student.$studentFolderId._index/components/base-name-button"
import NendoPills from "../student.$studentFolderId._index/components/nendo-pills"
import PropertyButton from "../student.$studentFolderId._index/components/property-button"
import TagPills from "../student.$studentFolderId._index/components/tag-pills"
import DeleteButton from "./components/delete-button"
import { errorResponses } from "~/lib/error-responses"

/**
 * loader function
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  logger.debug(`🍿 loader: files.$gakunen.$hr._index ${request.url}`)
  const { user, credential } = await getUserFromSessionOrRedirect(request)
  await requireUserRole(request, user)

  const accessToken = credential.accessToken

  // get sheets
  const sheets = await getSheets(accessToken)
  if (!sheets) throw redirect(`/?authstate=unauthenticated`)

  const { gakunen, hr } = params

  const url = new URL(request.url)
  const q = url.searchParams.getAll("q")

  if (!gakunen || !hr || !q || q.length === 0) {
    return {
      driveFiles: [],
      role: user.role,
      tags: [],
      nendos: [],
      url: request.url,
    }
  }

  // get StudentData from sheet
  let students = await getStudents(sheets)
  if (students.length === 0) {
    throw errorResponses.google()
  }

  students = students.filter((s) => s.gakunen === gakunen && s.hr === hr)

  // create querystring from gakunen/hr/query
  const searchQuery = queryMultipleStudentsAndFilename(students, gakunen, hr, q)

  const drive = await getDrive(credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized")

  // get Files from Drive
  let driveFiles = await getDriveFiles(drive, searchQuery)

  if (!driveFiles)
    return {
      driveFiles: [],
      role: user.role,
      tags: [],
      nendos: [],
      url: request.url,
    }
  driveFiles = driveFiles ? setSelected(driveFiles, true) : []

  const tags: Set<string> = new Set(
    driveFiles
      ?.map((df) => {
        if (!df.appProperties) return null
        let appProps = parseAppProperties(df.appProperties)
        if (appProps.tags) return parseTags(appProps.tags) || null
        return null
      })
      .filter((g): g is string[] => g !== null)
      .flat(),
  )
  const nendos: Set<string> = new Set(
    driveFiles
      ?.map((df) => {
        if (!df.appProperties) return null
        let appProps = parseAppProperties(df.appProperties)
        if (appProps.nendo) return appProps.nendo.trim() || null
        return null
      })
      .filter((g): g is string => g !== null)
      .flat(),
  )

  return {
    driveFiles: driveFiles || [],
    role: user.role,
    tags: Array.from(tags) || [],
    nendos: Array.from(nendos) || [],
    url: request.url,
  }
}

/**
 * Action
 * /admin/move
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: files.$gakunen.$hr._index ${request.url}`)
  const user = await getUserFromSession(request)
  if (!user || !user.credential) throw redirectToSignin(request)
  await requireAdminRole(request, user)

  // Zod Data Type
  const FormDataScheme = z.object({
    _action: z.string(),
  })

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
 * Page
 */
export default function FilesGakunenHrQueryPage() {
  const [isBig, setIsBig] = React.useState(true)

  // React.useEffect(() => {
  //   if (isBig) {
  //     setIsBig(true)
  //   } else {
  //     setIsBig(false)
  //   }
  // }, [isBig])
  // get driveFiles from loader
  let {
    driveFiles: _driveFiles,
    role,
    tags,
    nendos,
    url,
  } = useLoaderData<typeof loader>()

  // get driveFiles from context
  const { driveFilesDispatch, driveFiles } = useDriveFilesContext()

  const dfz: DriveFile[] = React.useMemo(() => {
    if (!_driveFiles) return []
    const dfz = convertDriveFiles(_driveFiles)
    return dfz
  }, [_driveFiles])

  React.useEffect(() => {
    // convert driveFiles to DriveFile[]
    // set driveFiles to context
    driveFilesDispatch({ type: "SET", payload: { driveFiles: dfz } })
  }, [dfz, driveFilesDispatch])

  if (driveFiles.length === 0) {
    return (
      <p>
        <span className="btn btn-xs m-1 bg-slate-400">ファイル名</span>
        を選択してください。
      </p>
    )
  }

  return (
    <div
      data-name="files.$gakunen.$hr._index"
      className="mb-12 mt-4 overflow-x-auto"
    >
      <div className="flex items-center gap-4">
        {/* PROPERTY BUTTON */}
        {role && ["ADMIN", "SUPER"].includes(role) && (
          <>
            <PropertyButton driveFiles={driveFiles} tags={tags} />
            <BaseNameButton driveFiles={driveFiles} />
            <DeleteButton driveFiles={driveFiles} />
          </>
        )}

        {/* ALLCHECK BUTTONS  {#if _driveFiles && $driveFiles && role}*/}
        <AllCheckButtons role={role} driveFiles={driveFiles} />

        {/* SMALL OR BIG  {#if $driveFiles && $driveFiles.length > 0} */}
        {driveFiles && driveFiles.length > 0 && (
          <div className="flex items-center justify-center gap-2">
            <label htmlFor="" className="">
              size
            </label>
            <input
              type="checkbox"
              className="toggle toggle-success"
              checked={isBig}
              onChange={() => setIsBig(!isBig)}
            />
          </div>
        )}
      </div>

      {/* TAGS & NENDOS */}
      <div className="mt-2 flex flex-none flex-wrap gap-1">
        <NendoPills url={url} nendos={nendos} />
        {tags.length > 0 && (
          <div className="divider divider-horizontal mx-0"></div>
        )}
        <TagPills url={url} tags={tags} />
      </div>

      {driveFiles && role && (
        <>
          {" "}
          <div
            data-name="file count"
            className="absolute right-0 top-0 ml-1 flex gap-1"
          >
            <span className="text-md  rounded-md bg-slate-300 p-1">
              {driveFiles.length} files
            </span>
            <span className="text-md justify-content ml-2 flex items-center gap-1 rounded-md bg-slate-300 px-2 py-1">
              <CheckIcon className="h-3 w-3 font-bold" />
              {
                driveFiles?.filter((df) => df.meta?.selected === true).length
              }{" "}
            </span>
          </div>
          <StudentCards
            role={role}
            driveFiles={driveFiles}
            size={isBig ? "big" : "small"}
          />
          {/* <!-- ACTION CARD BLOCK --> */}
          {["ADMIN", "SUPER"].includes(role) && (
            <article className="mx-auto w-full max-w-5xl p-12">
              <h2 className="text-2xl font-bold underline decoration-sfred-200 underline-offset-4">
                💽 履歴データ
              </h2>

              {/* <!-- TASK CARDS --> */}
              <TaskCards taskType="delete" />
            </article>
          )}
        </>
      )}
    </div>
  )
}
