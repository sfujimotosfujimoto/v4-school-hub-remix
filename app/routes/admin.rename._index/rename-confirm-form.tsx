import { Form, useActionData, useNavigation } from "@remix-run/react"
import React from "react"
import { LoadingIcon } from "~/components/icons"
import { useLoadingModal } from "~/components/ui/loading-modal"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useTasksContext } from "~/context/tasks-context"
import { convertDriveFiles } from "~/lib/utils/utils-loader"
import { useRenamePageContext } from "~/lib/admin/rename/context/rename-page-context"
import type { ActionTypeGoogle } from "~/types"
// import type { ActionTypeGoogle } from "~/types"

export default function RenameConfirmForm() {
  const dialogEl = React.useRef<HTMLDialogElement>(null)
  const { state, formData } = useNavigation()

  const { tasksDispatch } = useTasksContext()
  const { driveFiles } = useDriveFilesContext()

  const { renamePage } = useRenamePageContext()
  const { sourceFolder } = renamePage

  const isExecuting =
    state === "submitting" && formData?.get("intent") === "execute"
  const actionData = useActionData<ActionTypeGoogle>()

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
          taskType: "rename",
        },
      })
    }
  }, [actionData, tasksDispatch, isExecuting])

  useLoadingModal(isExecuting)

  if (!sourceFolder) return null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (dialogEl.current !== null) dialogEl.current.close()
  }

  return (
    <div className="mt-4 grid grid-cols-1 place-content-center">
      <h2 data-name="Form H1" className="mb-4 text-lg">
        🐣 名前を変更しますか？
      </h2>

      <div
        onClick={() => {
          if (dialogEl.current !== null) dialogEl.current.showModal()
        }}
        data-name="Form"
        className="h-full space-y-4"
      >
        {sourceFolder && <Button text="変更" loading={isExecuting} />}
      </div>

      <dialog id="my_modal_2" className="modal" ref={dialogEl}>
        <Form method="POST" className="modal-box" onSubmit={handleSubmit}>
          <p className="py-4">これらのファイル名を変更しますか</p>

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
      {loading && <LoadingIcon size={4} />}
      {text}
    </button>
  )
}
