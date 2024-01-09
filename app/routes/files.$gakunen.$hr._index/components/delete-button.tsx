import { Form, useNavigation } from "@remix-run/react"
import React from "react"
import { TrashIcon } from "~/components/icons"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useTasksContext } from "~/context/tasks-context"
import type { DriveFile } from "~/types"

export default function DeleteButton({
  driveFiles,
}: {
  driveFiles: DriveFile[]
}) {
  const { state, formData } = useNavigation()
  const dialogEl = React.useRef<HTMLDialogElement>(null)
  const { tasksDispatch } = useTasksContext()
  const { driveFiles: _driveFiles } = useDriveFilesContext()

  const isExecuting =
    state === "submitting" && formData?.get("_action") === "delete-execute"

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    console.log("✅ components/delete-button.tsx ~ 	😀 tasksDispatch delete")
    tasksDispatch({
      type: "SET",
      payload: {
        driveFiles: _driveFiles.filter((df) => df.meta?.selected),
        taskType: "delete",
      },
    })
    if (dialogEl.current !== null) dialogEl.current.close()
  }

  return (
    <>
      <button
        onClick={() => {
          if (dialogEl.current !== null) dialogEl.current.showModal()
        }}
        className={`h-full rounded-lg bg-sfgreen-400 px-2 py-[0.05rem] shadow-md transition-all duration-500  hover:-translate-y-[1px] hover:bg-sfgreen-300`}
      >
        <div className="flex items-center justify-center font-bold">
          <TrashIcon className="mr-2 h-6 w-6" />
          <span className="text-xs">ゴミ箱へ</span>
        </div>
      </button>

      <dialog id="my_modal_1" className="modal" ref={dialogEl}>
        <Form method="POST" className="modal-box" onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold">
            これらのファイルをゴミ箱へ移動しますか？
          </h2>

          {/* Hidden fileIdsString */}
          <input
            type="hidden"
            name="fileIdsString"
            value={JSON.stringify(
              _driveFiles.filter((df) => df.meta?.selected).map((df) => df.id),
            )}
          />

          <button
            type="submit"
            name="_action"
            value="delete-execute"
            className={`btn btn-sm mt-4 w-32 hover:bg-sfyellow-200 ${
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
    </>
  )
}
