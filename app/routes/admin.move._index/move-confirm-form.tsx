import type { Role } from "@prisma/client"
import { Form, useActionData, useNavigation } from "@remix-run/react"
import React from "react"
import toast from "react-hot-toast"
import { LoadingIcon } from "~/components/icons"
import { useLoadingModal } from "~/components/ui/loading-modal"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useTasksContext } from "~/context/tasks-context"
import { arrayIntoChunks } from "~/lib/utils/utils"
import { convertDriveFiles } from "~/lib/utils/utils-loader"
import { useMovePageContext } from "~/lib/admin/move/_index/context/move-page-context"
import type { ActionTypeGoogle } from "~/types"

export default function MoveConfirmForm({ role }: { role: Role }) {
  const dialogEl = React.useRef<HTMLDialogElement>(null)
  const { state, formData } = useNavigation()

  const { tasksDispatch } = useTasksContext()
  const { driveFiles } = useDriveFilesContext()

  const { movePage } = useMovePageContext()
  const { sourceFolder } = movePage

  const isExecuting =
    state === "submitting" && formData?.get("intent") === "execute"
  const actionData = useActionData<ActionTypeGoogle>()

  // call useEffect when actionData is updated
  // and when there is driveFiles in actionData
  React.useEffect(() => {
    if (
      !isExecuting &&
      actionData &&
      ["execute"].includes(actionData.intent) &&
      actionData.ok &&
      actionData.data &&
      "driveFiles" in actionData.data
    ) {
      let dfz = convertDriveFiles(actionData.data.driveFiles)

      tasksDispatch({
        type: "SET",
        payload: {
          driveFiles: dfz,
          taskType: "move",
        },
      })
    }
  }, [actionData, tasksDispatch, isExecuting])

  useLoadingModal(isExecuting)

  if (!sourceFolder) return null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (dialogEl.current !== null) dialogEl.current.close()
  }

  async function handleClick(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault()

    const dfs = driveFiles.filter((df) => df.meta?.selected === true)
    tasksDispatch({
      type: "SET",
      payload: {
        driveFiles: dfs,
        taskType: "move",
      },
    })

    const chunks = arrayIntoChunks(dfs, 10)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const res = await fetch("/api/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totalChunks: chunks.length,
          currentChunk: i + 1,
          driveFiles: chunk.length,
          sourceFolder,
        }),
      })
        .then((res) => res.json())
        .catch((error) => console.error(error))
      toast.success(
        `${((res.data.currentChunk / res.data.totalChunks) * 100).toFixed(0)}%`,
      )
    }
  }

  return (
    <div className="grid grid-cols-1 mt-4 place-content-center">
      <h2 data-name="Form H1" className="mb-4 text-lg">
        🚙 ファイルを移動しますか？
      </h2>
      {role === "SUPER" && (
        <button className="btn" onClick={handleClick}>
          PRACTICE
        </button>
      )}

      <div
        onClick={() => {
          if (dialogEl.current !== null) dialogEl.current.showModal()
        }}
        data-name="Form"
        className="h-full space-y-4"
      >
        {sourceFolder && <Button text="移動" loading={isExecuting} />}
      </div>

      <dialog id="my_modal_2" className="modal" ref={dialogEl}>
        <Form method="POST" className="modal-box" onSubmit={handleSubmit}>
          <p className="py-4">これらのファイルを移動しますか？</p>

          <input
            type="hidden"
            name="driveFilesString"
            value={JSON.stringify(driveFiles.filter((df) => df.meta?.selected))}
          />

          <button
            type="submit"
            name="intent"
            value="execute"
            className={`btn btn-sm w-32 ${
              isExecuting
                ? "btn-disabled animate-bounce !bg-slate-300"
                : "btn-warning"
            }`}
          >
            {isExecuting ? (
              <span className="inline-block w-4 h-4 border-2 rounded-full animate-spin border-slate-600 border-t-transparent "></span>
            ) : (
              "実行"
            )}
          </button>
        </Form>
        <form method="dialog" className="modal-backdrop">
          <button>閉じる</button>
        </form>
      </dialog>
    </div>
  )
}

function Button({ loading, text }: { loading: boolean; text: string }) {
  return (
    <button
      className={`btn btn-block shadow-md ${
        loading ? "btn-disabled animate-pulse !bg-slate-300" : "btn-primary"
      }`}
    >
      {loading && (
        // <span className="loading loading-spinner loading-xs" />
        <LoadingIcon size={4} />
      )}
      {text}
    </button>
  )
}
