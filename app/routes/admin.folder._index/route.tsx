import React from "react"
import { redirect } from "@remix-run/node"
import { useActionData, useNavigation } from "@remix-run/react"
import { z } from "zod"

// components
import AdminFolderForm from "./components/admin-folder-form"
import MoveCards from "./components/move-cards"
import Toast from "~/components/util/Toast"

// context
import { MoveTypeContext } from "~/context/move-type-context"

// functions
import { getDrive, undoMoveDriveFiles } from "~/lib/google/drive.server"
import { requireAdminRole } from "~/lib/require-roles.server"
import { getUserFromSession } from "~/lib/session.server"
import { getIdFromUrl } from "~/lib/utils"

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import type { MoveDataType, MoveType, State, User } from "~/types"
import { authenticate } from "~/lib/authenticate.server"
import { logger } from "~/logger"

/**
 * AdminFolderPage
 */
export default function AdminFolderPage() {
  const { getAllItems } = React.useContext(MoveTypeContext)
  const navState = useNavigation() // idle, loading, submitting
  const [moveTypes, setMoveTypes] = React.useState<MoveType[] | null>(null)
  const actionData = useActionData<
    | {
        data?: {
          ok: boolean
        }
      }
    | undefined
  >()

  const [state, setState] = React.useState<State>("idle")

  React.useEffect(() => {
    if (["submitting", "loading"].includes(navState.state)) {
      setState("loading")
    } else if (!actionData?.data) {
      setState("idle")
    } else if (actionData.data.ok) {
      setState("success")
    } else if (!actionData.data.ok) {
      setState("error")
    } else {
      setState("idle")
    }
  }, [navState.state, actionData?.data])

  React.useEffect(() => {
    const tmp = getAllItems()
    if (tmp) setMoveTypes(tmp)
  }, [getAllItems])

  return (
    <>
      {/* ADMINFOLDERFORM */}
      <article className="mx-auto h-full w-full max-w-lg rounded-md border-4 border-sfgreen-200 bg-slate-50 p-8 shadow-lg">
        <div className="grid grid-cols-1 place-content-center">
          <AdminFolderForm state={state} />
        </div>
      </article>
      {/* END OF ADMINFOLDERFORM */}

      {/* TOAST */}
      <div className="absolute right-5">
        {state === "loading" && (
          <Toast text={"Loading"} alertType={"alert-primary"} />
        )}
        {state === "success" && (
          <Toast
            text={`Success! Moved {data?.moveData.length} files!`}
            alertType={"alert-primary"}
          />
        )}
      </div>
      {/* END OF TOAST */}

      {/* MOVE TYPES */}
      {moveTypes && moveTypes.length > 0 && (
        <article className="mx-auto w-full max-w-5xl p-12">
          <h2 className="text-2xl font-bold underline decoration-sfred-200 underline-offset-4">
            履歴データ
          </h2>
          <MoveCards moveTypes={moveTypes} />
        </article>
      )}
      {/* END OF MOVE TYPES */}
    </>
  )
}

/**
 * Loader
 */
export async function loader({ request }: LoaderFunctionArgs): Promise<{
  user: User
}> {
  logger.debug(`🍿 loader: admin.folder._index ${request.url}`)
  const { user } = await authenticate(request)
  await requireAdminRole(user)

  if (!user || !user.credential) throw redirect("/?authstate=unauthenticated")

  return {
    user,
  }
}

// Zod Data Type
const FormD = z.object({
  sourceFolderId: z.string().optional(),
  jsonInput: z.any().optional(),
  undoMoveDataTime: z.any().optional(),
})

/**
 * Action
 */
export async function action({ request, params }: ActionFunctionArgs) {
  logger.debug(`🍺 action: admin.folder._index ${request.url}`)
  const { user } = await authenticate(request)
  await requireAdminRole(user)

  const formData = await request.formData()

  let { _action, undoMoveDataTime, jsonInput, sourceFolderId } =
    Object.fromEntries(formData)

  switch (_action) {
    /*
       SEARCH ACTION
     */
    case "search": {
      const user = await getUserFromSession(request)
      if (!user) throw redirect("/?authstate=unauthenticated", 302)

      if (!user || !user.credential)
        throw redirect(`/?authstate=unauthorized-003`)
      // use Zod to parse  form data
      const parsedData = FormD.parse({
        sourceFolderId,
      })
      // get id from if `sourceFolderId` is url
      const sourceId = getIdFromUrl(parsedData.sourceFolderId || "")
      if (!sourceId) throw new Error(``)
      // pass `sourceId` to `/folder/confirm`
      throw redirect(`/admin/folder/confirm?sourceId=${sourceId}`)
    }

    /**
     * UNDO ACTION
     */
    case "undo": {
      // get user
      const user = await getUserFromSession(request)
      if (!user || !user.credential)
        throw redirect("/?authstate=unauthenticated", 302)

      // if no user or credential redirect
      if (!user || !user.credential)
        throw redirect(`/authstate=unauthorized-004`)

      const drive = await getDrive(user.credential.accessToken)
      if (!drive) throw redirect("/?authstate=unauthorized-005")

      // parse formData
      const parsedData = FormD.parse({
        jsonInput,
        undoMoveDataTime,
      })
      // check if Blob is sent in the form
      if (
        parsedData.jsonInput.size > 0 &&
        parsedData.jsonInput instanceof Blob
      ) {
        // create Buffer
        const d = new Uint8Array(await parsedData.jsonInput.arrayBuffer())

        // create TextDecoder
        const dec = new TextDecoder("utf-8")
        // decode buffer using TextDecoder and return MoveDataType
        const moveData = JSON.parse(dec.decode(d)) as MoveDataType

        // if no driveFileData is found, return ok = false
        if (!moveData.driveFileData) return { ok: false }

        // undo moveDriveFiles
        await undoMoveDriveFiles(drive, moveData.driveFileData)

        return { ok: true, moveData }
      }

      if (undoMoveDataTime) {
        return redirect(
          `/admin/folder/confirm?undoMoveDataTime=${undoMoveDataTime}`,
        )
      }
    }

    default:
      break
  }
}
