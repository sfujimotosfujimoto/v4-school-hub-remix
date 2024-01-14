import { Form, useNavigation } from "@remix-run/react"
import React from "react"
import { AddIcon } from "~/components/icons"
import { getSchoolYear } from "~/lib/utils"
import type { DriveFile } from "~/types"

export default function PropertyButton({
  driveFiles,
  tags,
}: {
  driveFiles: DriveFile[]
  tags?: string[]
}) {
  const { state, formData } = useNavigation()
  const dialogEl = React.useRef<HTMLDialogElement>(null)

  // const { driveFiles: _driveFiles } = useDriveFilesContext()

  const [tagString, setTagString] = React.useState("")

  let currentNendo = getSchoolYear(Date.now())

  const isExecuting =
    state === "submitting" && formData?.get("_action") === "property"

  // TODO: Add loading modal

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
          <span className="text-xs">プロパティを追加</span>
        </div>
      </button>

      <dialog id="my_modal_1" className="modal" ref={dialogEl}>
        <Form method="POST" className="modal-box" onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold">
            これらのファイルにタグを追加しますか？
          </h2>

          {/* TAGS INPUT LABEL */}
          <label className="label my-2 text-sfblue-300" htmlFor="tagsString">
            <div className="text-base font-normal">
              <span>🗂️ チェックの入っているファイルに追加するタグ</span>
              <p className="text-xs">
                チェックの入っているファイルに追加するタグを入力してください。
              </p>
              <p className="text-xs">現在、入っているタグは上書きされます。</p>
              <p className="text-xs font-bold">
                {tags && <span>現在：[ {Array.from(tags).join(", ")}] </span>}
              </p>
            </div>
          </label>

          {/* TAGS INPUT  */}
          <input
            value={tagString}
            name="tagsString"
            type="string"
            placeholder="プロパティ名"
            className="input input-bordered input-primary w-full border-2"
            onChange={(e) => setTagString(e.currentTarget.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {tagString.trim() &&
              tagString
                .trim()
                .split(/,|、/g)
                .filter((t) => t.trim())
                .map((t) => (
                  <span
                    key={t}
                    className="rounded-lg bg-slate-300 px-2 py-1 text-sm shadow-sm"
                  >
                    {t.trim()}
                  </span>
                ))}
          </div>

          {/* NENDO SELECT LABEL */}
          <label className="label mt-2 text-sfblue-300" htmlFor="nendoString">
            <div>
              <span>🗂️ 年度を選択</span>
            </div>
          </label>
          {/* NENDO SELECT */}
          <select
            name="nendoString"
            className="input input-bordered input-primary w-full border-2"
            // onChange={(e) => setNendo(() => Number(e.currentTarget.value))}
          >
            <option value={currentNendo}>{currentNendo}</option>
            <option value={currentNendo - 1}>{currentNendo - 1}</option>
            <option value={currentNendo - 2}>{currentNendo - 2}</option>
            <option value={currentNendo - 3}>{currentNendo - 3}</option>
            <option value={currentNendo - 4}>{currentNendo - 4}</option>
            <option value={currentNendo - 5}>{currentNendo - 5}</option>
          </select>

          <input
            type="hidden"
            name="fileIdsString"
            value={JSON.stringify(
              driveFiles.filter((df) => df.meta?.selected).map((df) => df.id),
            )}
          />

          <button
            type="submit"
            name="_action"
            value="property"
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
