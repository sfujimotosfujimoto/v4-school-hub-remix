import { Form, useActionData, useNavigation } from "@remix-run/react"
import React from "react"
import SubmitButton from "~/components/ui/buttons/submit-button"
import { useLoadingModal } from "~/components/ui/loading-modal"
import { useTasksContext } from "~/context/tasks-context"
import { useMovePageContext } from "~/routes/admin.move._index/context/move-page-context"
import type { ActionTypeGoogle } from "~/types"
import CsvUndoFileInput from "./csv-undo-file-input"

/**
 * MoveForm
 */
export default function MoveForm() {
  const { state, formData } = useNavigation()
  const actionData = useActionData<ActionTypeGoogle>()
  const { movePageDispatch } = useMovePageContext()
  const { tasksDispatch } = useTasksContext()

  const isSearching =
    state === "submitting" && formData?.get("_action") === "search"

  useLoadingModal(isSearching)

  const load = React.useRef(false)
  React.useEffect(() => {
    if (!actionData?.data || !("sourceFolder" in actionData.data)) return
    if (!actionData?.data?.sourceFolder) return

    movePageDispatch({
      type: "SET",
      payload: { sourceFolder: actionData?.data?.sourceFolder },
    })
  }, [actionData?.data, movePageDispatch])

  const [tags, setTags] = React.useState<string>("")

  React.useEffect(() => {
    if (!load.current) {
      tasksDispatch({
        type: "LOCAL_STORAGE",
        payload: {},
      })
      load.current = true
    }
  }, [tasksDispatch])

  return (
    <div className="grid grid-cols-1 place-content-center">
      <h1
        data-name="MoveForm.tsx h1"
        className="text-center text-3xl font-semibold underline decoration-sfred-200 underline-offset-4"
      >
        🚙 生徒フォルダに移動
      </h1>

      {/* <!-- FORM ERROR HANDLING --> */}
      <Form
        data-name="MoveForm"
        method="POST"
        className="h-full space-y-4"
        encType="multipart/form-data"
      >
        <div className="flex flex-col gap-2 text-sfblue-300 sm:gap-4">
          {/* <!-- FROM FOLDER ID --> */}
          <div className="w-full">
            <label className="label text-sfblue-300" htmlFor="sourceFolderId">
              <div>
                <span className="font-semibold">🗂️ 移動元フォルダID</span>
                <p className="text-xs">
                  「移動元フォルダID」にあるファイルを生徒フォルダに移動をする
                </p>
                <p className="text-xs">
                  ファイル名にある学籍番号を元に移動をする
                </p>
              </div>
            </label>

            <input
              name="sourceFolderId"
              type="string"
              placeholder="移動元フォルダID"
              className="input input-bordered input-primary w-full border-2"
              required
              maxLength={300}
            />

            {/* <!-- TAGS --> */}
            <label className="label my-2 text-sfblue-300" htmlFor="tags">
              <div className="text-base font-normal">
                <span className="font-semibold">
                  ✅ チェックの入っているファイルに追加するタグ
                </span>
                <p className="text-xs">
                  現在、入っているタグは上書きされます。複数のタグを追加する場合は半角カンマ
                  <span className="mx-1 inline-block rounded-lg bg-slate-300 px-3 text-[16px] font-bold">
                    ,
                  </span>
                  でタグを区切ってください。現在、入っているタグは上書きされます。
                </p>
              </div>
            </label>

            <input
              value={tags}
              name="tagsString"
              type="string"
              placeholder="プロパティ名"
              className="input input-bordered input-primary w-full border-2"
              onChange={(e) => setTags(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.trim() &&
                tags
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
          </div>

          {/* <!-- SEARCH BUTTON --> */}
          <SubmitButton
            actionValue="search"
            loading={isSearching}
            text="検索"
          />
        </div>
      </Form>

      <div className="divider"></div>

      <CsvUndoFileInput />
    </div>
  )
}
