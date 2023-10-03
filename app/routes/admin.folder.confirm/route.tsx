import React from "react"
import { z } from "zod"
import StudentCards from "~/components/ui/student-card/student-cards"
import { MoveTypeContext } from "~/context/move-type-context"
import {
  createBaseQuery,
  getDrive,
  getDriveFilesWithStudentFolder,
  getFolder,
  moveDriveFiles,
  undoMoveDriveFiles,
} from "~/lib/google/drive.server"
import { getSheets } from "~/lib/google/sheets.server"
import { requireAdminRole } from "~/lib/requireRoles.server"
import { getUserFromSession } from "~/lib/session.server"
import { dateFormat } from "~/lib/utils"

import { redirect } from "@remix-run/node"
import { useLoaderData, useNavigation } from "@remix-run/react"

import AdminConfirmForm from "./components/admin-confirm-form"

import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node"
import type { MoveType, State } from "~/types"
export default function AdminFolderConfirmPage() {
  let { driveFileData, sourceFolder, undoMoveDataTime, role } =
    useLoaderData<typeof loader>()

  // const _user = rawUserToUser(user)
  const navState = useNavigation() // idle, loading, submitting
  const { getItemByTime } = React.useContext(MoveTypeContext)

  let state: State = ["submitting", "loading"].includes(navState.state)
    ? "loading"
    : "idle"

  const [moveType, setMoveType] = React.useState<MoveType | null>(null)

  React.useEffect(() => {
    const tmp = getItemByTime(Number(undoMoveDataTime))
    setMoveType(tmp)
  }, [undoMoveDataTime, getItemByTime])

  return (
    <>
      <article className="mx-auto h-full w-full max-w-lg rounded-md border-4 border-sfgreen-200 bg-slate-50 p-8">
        <div className="grid grid-cols-1 place-content-center">
          <AdminConfirmForm
            sourceFolder={sourceFolder}
            undoMoveDataTime={undoMoveDataTime}
            driveFileData={
              driveFileData || moveType?.data.driveFileData || null
            }
            state={state}
          />
        </div>
      </article>

      <article className="mx-auto max-w-5xl p-12">
        {sourceFolder && driveFileData && (
          <>
            <h2 className="text-2xl font-bold underline decoration-sfred-200 underline-offset-4">
              移動をするファイル：
            </h2>
            <StudentCards
              role={role}
              driveFiles={driveFileData}
              size={"small"}
            />
          </>
        )}

        {moveType && (
          <>
            <h2 className="text-2xl font-bold underline decoration-sfred-200 underline-offset-4">
              元に戻す時点：
              {dateFormat(new Date(moveType.data.time).toLocaleString())}
            </h2>
            {moveType.data.driveFileData && (
              <StudentCards
                role={role}
                driveFiles={moveType.data.driveFileData}
                size={"small"}
              />
            )}
          </>
        )}
      </article>
    </>
  )
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { user, error } = await requireAdminRole(request)
  if (!user || !user.credential || error)
    throw redirect("/?authstate=unauthenticated")

  const url = new URL(request.url)

  const sourceId = url.searchParams.get("sourceId")
  const undoMoveDataTime = url.searchParams.get("undoMoveDataTime")

  if (!sourceId && !undoMoveDataTime)
    throw redirect(`/?authstate=unauthenticated`)

  if (sourceId) {
    // create query for Google Drive Search
    const query = createBaseQuery(sourceId)
    if (!query) throw redirect(`/?authstate=unauthenticated`)

    // get google folder meta data
    const sourceFolder = await getFolder(user.credential.accessToken, sourceId)

    const drive = await getDrive(user.credential.accessToken)
    if (!drive) throw redirect("/?authstate=unauthorized-006")
    const sheets = await getSheets(user.credential.accessToken)
    if (!sheets) throw redirect(`/?authstate=unauthenticated`)

    // get DriveFileData with query
    const driveFileData = await getDriveFilesWithStudentFolder(
      drive,
      sheets,
      query,
    )
    return {
      sourceFolder,
      driveFileData,
      undoMoveDataTime: null,
      role: user.role,
    }
  } else if (undoMoveDataTime) {
    return {
      sourceFolder: null,
      driveFileData: null,
      undoMoveDataTime,
      role: user.role,
    }
  }
}

// Zod Data Type
const FormD = z.object({
  sourceFolderId: z.string().optional(),
  jsonInput: z.any().optional(),
  undoMoveData: z.string().optional(),
})

/**
 * Action
 */
export async function action({ request }: ActionFunctionArgs) {
  await requireAdminRole(request)
  const formData = await request.formData()

  let { _action, sourceFolderId, moveData } = Object.fromEntries(formData)

  switch (_action) {
    /**
     * Move ACTION
     */
    case "move": {
      // Find User
      const user = await getUserFromSession(request)
      if (!user || !user.credential)
        throw redirect("/?authstate=unauthenticated")

      const drive = await getDrive(user.credential.accessToken)
      if (!drive) throw redirect("/?authstate=unauthorized-007")

      // parse data in form
      const parsedData = FormD.parse({
        sourceFolderId,
      })

      const query = createBaseQuery(parsedData.sourceFolderId || "")
      if (!query) throw new Error(`Could not create query`)

      const sheets = await getSheets(user.credential.accessToken)
      if (!sheets) throw redirect(`/?authstate=unauthenticated`)

      // get driveFileData
      const driveFileData = await getDriveFilesWithStudentFolder(
        drive,
        sheets,
        query,
      )
      if (!driveFileData) throw new Error(`Could not find drive file data`)

      await moveDriveFiles(drive, driveFileData)

      // Redirect user to same page with udpated data
      throw redirect(`/admin/folder/?state=success`)
    }

    /**
     * UNDO ACTION
     */
    case "undo": {
      // Find User from id
      const user = await getUserFromSession(request)
      // Validate form
      if (!user || !user.credential)
        throw redirect("/?authstate=unauthenticated")

      const drive = await getDrive(user.credential.accessToken)
      if (!drive) throw redirect("/?authstate=unauthorized-008")

      const parsedData = FormD.parse({
        undoMoveData: moveData,
      })
      const undoMoveData = parsedData.undoMoveData

      if (undoMoveData) {
        const jsonData = JSON.parse(undoMoveData)
        await undoMoveDriveFiles(drive, jsonData)

        throw redirect(`/admin/folder`)
      }
    }

    default:
      break
  }
}

export const meta: MetaFunction = () => {
  return [{ title: `移動確認 | SCHOOL HUB` }]
}
