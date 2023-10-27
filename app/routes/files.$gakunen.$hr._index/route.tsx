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
import TagButtons from "../student.$studentFolderId._index/components/tag-buttons"
import NendoButtons from "../student.$studentFolderId._index/components/nendo-buttons"
import AllCheckButtons from "../student.$studentFolderId._index/components/all-check-buttons"
import React from "react"
import PropertyButton from "../student.$studentFolderId._index/components/property-button"
import { arrayIntoChunks, getSchoolYear, parseTags } from "~/lib/utils"
import { z } from "zod"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { CheckIcon } from "~/components/icons"
import { CHUNK_SIZE } from "~/lib/config"
import { updateAppProperties } from "~/lib/app-properties"

/**
 * loader function
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
          <PropertyButton driveFiles={_driveFiles} tags={tags} />
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
        </>
      )}
    </div>
  )
}

/**
 * loader function
 */
export async function loader({ request, params }: LoaderFunctionArgs): Promise<{
  driveFiles: DriveFile[]
  role: Role
  tags: string[]
  nendos: string[]
}> {
  logger.debug(`🍿 loader: files.$gakunen.$hu._index ${request.url}`)
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

  if (!gakunen || !hr || !q || q.length === 0)
    return {
      driveFiles: [],
      role: user.role,
      tags: [],
      nendos: [],
    }

  // get StudentData from sheet
  const studentData = await getStudents(sheets)
  if (!studentData || studentData.length === 0)
    throw redirect(`/?authstate=no-student-data`)

  // create querystring from gakunen/hr/query
  const searchQuery = queryMultipleStudentsAndFilename(
    studentData,
    gakunen,
    hr,
    q,
  )

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
  nendoString: z.string(),
  tagsString: z.string().optional(),
  fileIdsString: z.string().optional(),
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

  const accessToken = user.credential.accessToken
  const formData = await request.formData()
  const result = FormDataScheme.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return json({ ok: false, error: result.error.message }, { status: 400 })
  }

  let { _action, nendoString, tagsString, fileIdsString } = result.data

  const tags = tagsString ? tagsString : ""

  const fileIds = JSON.parse(fileIdsString || "[]")

  switch (_action) {
    /**
     * EXECUTE ACTION
     */

    case "execute": {
      logger.debug(
        `✅ action: "execute" ${nendoString}, ${tagsString}, ${fileIds}, ${fileIdsString}`,
      )

      const fileIdsChunks = arrayIntoChunks<string>(fileIds, CHUNK_SIZE)
      logger.debug(`✅ action: fileIdsChunks: ${fileIdsChunks.length} `)

      const promises = fileIdsChunks.map((fileIds, idx) =>
        _updateAppProperties(accessToken, fileIds, tags, nendoString, idx),
      )

      logger.debug(`✅ action: promises: ${promises.length} `)

      const resArr = await Promise.all([...promises])
      const res = resArr.filter((d) => d).flat()

      console.log("✅ res.length: ", res.length)

      return json({ ok: true, data: { res } })
    }

    default:
      break
  }
}

async function _updateAppProperties(
  accessToken: string,
  fileIds: string[],
  tagString: string,
  nendo: string,
  idx: number,
) {
  logger.debug(`✅ action: _updateAppProperties `)
  const res = []
  for (let i = 0; i < fileIds.length; i++) {
    const fileId = fileIds[i]
    const appProperties = {
      nendo: nendo || String(getSchoolYear(Date.now())),
      tags: tagString,
      time: String(Date.now()),
    }
    const r = await updateAppProperties(accessToken, fileId, appProperties)

    res.push(r)
    logger.debug(`updateAppProperties -- update idx:${i} of chunk: ${idx}`)
  }

  logger.debug(
    `updateAppProperties -- finished ${res.length} files of chunk: ${idx}`,
  )
  return res
}
