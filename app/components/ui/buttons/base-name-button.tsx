import { Form, useNavigation } from "@remix-run/react"
import React from "react"
import { AddIcon } from "~/components/icons"
import { getBaseNameFromFileName } from "~/lib/utils/utils"
import type { DriveFile } from "~/types"

export default function BaseNameButton({
  driveFiles,
}: {
  driveFiles: DriveFile[]
}) {
  const { state, formData } = useNavigation()
  const dialogEl = React.useRef<HTMLDialogElement>(null)

  // const { driveFiles: _driveFiles } = useDriveFilesContext()

  const currentBaseName = getBaseNameFromFileName(driveFiles[0]?.name ?? "")

  const [baseNameString, setBaseNameString] = React.useState("")

  const isExecuting =
    state === "submitting" && formData?.get("intent") === "rename"

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
          <AddIcon className="mr-2 h-6 w-6" />
          <span className="text-xs">ベース名を変更</span>
        </div>
      </button>

      <dialog id="my_modal_1" className="modal" ref={dialogEl}>
        <Form method="POST" className="modal-box" onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold">
            これらのファイルのベース名を変更しますか？
          </h2>

          {/* BASE NAME INPUT LABEL */}
          <label
            className="label my-2 text-sfblue-300"
            htmlFor="baseNameString"
          >
            <div className="text-base font-normal">
              <span>🗂️ チェックの入っているファイルのベース名を変更</span>
              <p className="text-xs">
                チェックの入っているファイルの変更するベース名を入力してください。
              </p>
              <p className="text-xs">
                現在、入っているベース名は上書きされます。
              </p>
              <p className="text-xs">現在、入っているタグは上書きされます。</p>
              <p className="text-xs font-bold">
                {currentBaseName && (
                  <>
                    現在のベース名：{" "}
                    <span className="rounded-md bg-slate-300 px-2 py-1 text-sm shadow-sm">
                      {currentBaseName}{" "}
                    </span>
                  </>
                )}
              </p>
            </div>
          </label>

          {/* BASE NAME  INPUT  */}
          <input
            value={baseNameString}
            name="baseNameString"
            type="string"
            placeholder="ベース名"
            className="input input-bordered input-primary w-full border-2"
            onChange={(e) => setBaseNameString(e.currentTarget.value)}
          />

          <input
            type="hidden"
            name="fileIdsString"
            value={JSON.stringify(driveFiles.map((df) => df.id))}
          />

          <button
            type="submit"
            name="intent"
            value="rename"
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
