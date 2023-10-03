import React from "react"
import { LoadingIcon } from "~/components/icons"
import { useLoadingModal } from "~/components/ui/loading-modal/loading-modal"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useTasksContext } from "~/context/tasks-context"
import { useMovePageContext } from "~/routes/admin.move._index/context/move-page-context"

import { Form, useNavigation } from "@remix-run/react"

export default function MoveConfirmForm() {
  const dialogEl = React.useRef<HTMLDialogElement>(null)
  const { state, formData } = useNavigation()

  const { tasksDispatch } = useTasksContext()
  const { driveFiles } = useDriveFilesContext()

  const { movePage } = useMovePageContext()
  const { sourceFolder } = movePage

  const isExecuting =
    state === "submitting" && formData?.get("_action") === "execute"

  useLoadingModal(isExecuting)

  if (!sourceFolder) return null
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    tasksDispatch({
      type: "SET",
      payload: {
        driveFiles: driveFiles,
        taskType: "move",
      },
    })
    // logger.debug("✅ dialogEl.current", dialogEl.current)
    if (dialogEl.current !== null) dialogEl.current.close()
  }

  return (
    <div className="mt-4 grid grid-cols-1 place-content-center">
      <h2 data-name="Form H1" className="mb-4 text-lg">
        🚙 ファイルを移動しますか？
      </h2>

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
            value={JSON.stringify(driveFiles)}
          />

          <button
            type="submit"
            name="_action"
            value="execute"
            className={`btn btn-sm w-32 ${
              isExecuting
                ? "btn-disabled animate-bounce !bg-slate-300"
                : "btn-warning"
            }`}
          >
            {isExecuting ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-transparent "></span>
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
