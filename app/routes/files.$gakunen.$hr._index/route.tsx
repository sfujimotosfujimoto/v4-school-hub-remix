import { json, redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"

import type { DriveFile } from "~/types"

// components
import StudentCards from "~/components/ui/student-card/student-cards"
// functions
import {
  getDrive,
  getDriveFiles,
  queryMultipleStudentsAndFilename,
} from "~/lib/google/drive.server"
import { getSheets, getStudents } from "~/lib/google/sheets.server"
import { requireAdminRole, requireUserRole } from "~/lib/require-roles.server"
import { setSelected } from "~/lib/utils.server"
import type { Role } from "@prisma/client"
import { authenticate } from "~/lib/authenticate.server"
import { logger } from "~/logger"
// TODO: move to a component folder and share
import TagButtons from "../student.$studentFolderId._index/components/tag-buttons"
import NendoButtons from "../student.$studentFolderId._index/components/nendo-buttons"
import AllCheckButtons from "../student.$studentFolderId._index/components/all-check-buttons"
import React from "react"
import PropertyButton from "../student.$studentFolderId._index/components/property-button"
import BaseNameButton from "../student.$studentFolderId._index/components/base-name-button"
import { parseTags } from "~/lib/utils"
import { z } from "zod"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { CheckIcon } from "~/components/icons"
import DeleteButton from "./components/delete-button"
import { propertyExecuteAction } from "../../lib/actions/property-execute"
import { renameExecuteAction } from "../../lib/actions/rename-execute"
import { deleteExecuteAction } from "../../lib/actions/delete-execute"
import TaskCards from "~/components/ui/tasks/task-cards"
import { deleteUndoAction } from "../../lib/actions/delete-undo"

/**
 * loader function
 */
export async function loader({ request, params }: LoaderFunctionArgs): Promise<{
  driveFiles: DriveFile[]
  role: Role
  tags: string[]
  nendos: string[]
}> {
  logger.debug(`🍿 loader: files.$gakunen.$hr._index ${request.url}`)
  const { user } = await authenticate(request)
  await requireUserRole(user)
  if (!user || !user.credential) throw redirect("/?authstate=unauthenticated")

  if (!user?.credential) throw redirect("/?authstate-025")
  const accessToken = user.credential.accessToken

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
    }
  }

  // get StudentData from sheet
  let students = await getStudents(sheets)
  if (!students || students.length === 0)
    throw redirect(`/?authstate=no-student-data`)

  students = students.filter((s) => s.gakunen === gakunen && s.hr === hr)

  // create querystring from gakunen/hr/query
  const searchQuery = queryMultipleStudentsAndFilename(students, gakunen, hr, q)

  const drive = await getDrive(user.credential.accessToken)
  if (!drive) throw redirect("/?authstate=unauthorized")

  // get Files from Drive
  let driveFiles = await getDriveFiles(drive, searchQuery)

  if (!driveFiles)
    return {
      driveFiles: [],
      role: user.role,
      tags: [],
      nendos: [],
    }
  driveFiles = driveFiles ? setSelected(driveFiles, true) : []

  const tags: Set<string> = new Set(
    driveFiles
      ?.map((df) => {
        if (df.appProperties?.tags)
          return parseTags(df.appProperties.tags) || null
        return null
      })
      .filter((g): g is string[] => g !== null)
      .flat(),
  )
  const nendos: Set<string> = new Set(
    driveFiles
      ?.map((df) => {
        if (df.appProperties?.nendo)
          return df.appProperties.nendo.trim() || null
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
  }
}

// Zod Data Type
const FormDataScheme = z.object({
  _action: z.string(),
})

/**
 * Action
 * /admin/move
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.debug(`🍺 action: files.$gakunen.$hr._index ${request.url}`)
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
 * Page
 */
export default function FilesGakunenHrQueryPage() {
  const [isBig, setIsBig] = React.useState(true)
  let { driveFiles, role, tags, nendos } = useLoaderData<typeof loader>()

  const { driveFiles: _driveFiles } = useDriveFilesContext()

  let baseDriveFiles = React.useMemo(() => {
    if (!driveFiles) return []
    return driveFiles
  }, [driveFiles])

  if (driveFiles.length === 0) {
    return (
      <p>
        <span className="btn btn-warning btn-xs m-1">ファイル名</span>
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
            <PropertyButton driveFiles={_driveFiles} tags={tags} />
            <BaseNameButton driveFiles={_driveFiles} />
            <DeleteButton driveFiles={_driveFiles} />
          </>
        )}

        {/* ALLCHECK BUTTONS  {#if _driveFiles && $driveFiles && role}*/}
        <AllCheckButtons role={role} baseDriveFiles={baseDriveFiles} />

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
      <div className="mt-2 flex flex-col gap-2">
        <TagButtons
          baseDriveFiles={baseDriveFiles}
          tags={tags}
          color={"bg-slate-400"}
        />
        <NendoButtons
          baseDriveFiles={baseDriveFiles}
          nendos={nendos}
          color={"bg-slate-400"}
          showAll={true}
        />
      </div>

      {_driveFiles && role && (
        <>
          {" "}
          <div
            data-name="file count"
            className="absolute right-0 top-0 ml-1 flex gap-1"
          >
            <span className="text-md  rounded-md bg-slate-300 p-1">
              {_driveFiles.length} files
            </span>
            <span className="text-md justify-content ml-2 flex items-center gap-1 rounded-md bg-slate-300 px-2 py-1">
              <CheckIcon className="h-3 w-3 font-bold" />
              {
                _driveFiles?.filter((df) => df.meta?.selected === true).length
              }{" "}
            </span>
          </div>
          <StudentCards
            role={role}
            driveFiles={_driveFiles}
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
