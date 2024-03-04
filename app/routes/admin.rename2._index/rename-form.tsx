import { Form, useActionData, useNavigation } from "@remix-run/react"
import React from "react"
import SubmitButton from "~/components/ui/buttons/submit-button"
import { useLoadingModal } from "~/components/ui/loading-modal"
import { useTasksContext } from "~/context/tasks-context"
import { useRenamePageContext } from "~/lib/admin/rename/context/rename-page-context"
import type { ActionTypeGoogle } from "~/types"

export default function RenameForm() {
  const { state, formData } = useNavigation()
  const actionData = useActionData<ActionTypeGoogle>()
  const { renamePageDispatch } = useRenamePageContext()
  const { tasksDispatch } = useTasksContext()

  const isSearching =
    state === "submitting" && formData?.get("intent") === "search"

  useLoadingModal(isSearching)

  // useEffect for setting sourceFolder to renamePage context
  React.useEffect(() => {
    if (!actionData?.data || !("sourceFolder" in actionData.data)) return

    if (!actionData.data.sourceFolder) return

    renamePageDispatch({
      type: "SET",
      payload: { sourceFolder: actionData?.data?.sourceFolder },
    })
  }, [actionData?.data, renamePageDispatch])

  // useEffect for getting tasks from localStorage
  const load = React.useRef(false)
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
        data-name="RenameForm.tsx h1"
        className="text-3xl font-semibold text-center underline decoration-sfred-200 underline-offset-4"
      >
        🐣 名前を変更
      </h1>

      <Form data-name="RenameForm" method="POST" className="h-full space-y-4">
        <div className="flex flex-col gap-2 text-sfblue-300 sm:gap-4">
          {/* SOURCEFOLDERID INPUT GROUP */}
          <div className="w-full">
            {/* SOURCEFOLDERID LABEL */}
            <label className="label text-sfblue-300" htmlFor="sourceFolderId">
              <div>
                <span className="font-semibold">🗂️ 変更元フォルダID</span>
                <p className="text-xs">
                  「変更元フォルダID」にあるファイルを生徒フォルダの名前を変更する
                </p>
                <p className="text-xs">
                  ファイルの名前、共有アカウントで名前変更を判断
                </p>
              </div>
            </label>

            {/* SOURCEFOLDERID INPUT */}
            <input
              name="sourceFolderId"
              type="string"
              placeholder="変更元フォルダID"
              className="w-full border-2 input input-bordered input-primary"
              required
              maxLength={300}
            />

            {/* <!-- GAKUNEN --> */}
            <label className="mt-2 label text-sfblue-300" htmlFor="gakunen">
              <div>
                <span className="font-semibold">📚 学年を選択</span>
                <p className="text-xs">
                  クラス番号で名前変更を判断する場合に学年を選択
                </p>
              </div>
            </label>
            <select
              name="gakunen"
              className="w-full border-2 group select input-bordered input-primary "
              required
            >
              <option
                disabled
                value={undefined}
                className="text-blue-500 bg-red-400 "
              >
                --- 学年を選択 ---
              </option>
              <option value="ALL">学籍番号で判断</option>
              <option value="J1">中学1年</option>
              <option value="J2">中学2年</option>
              <option value="J3">中学3年</option>
              <option value="H1">高校1年</option>
              <option value="H2">高校2年</option>
              <option value="H3">高校3年</option>
            </select>

            {/* <!-- SEGMENT --> */}
            <label className="mt-2 label text-sfblue-300" htmlFor="segment">
              <div>
                <span className="font-semibold">📄 ファイルベース名</span>
                <p className="text-xs">
                  各ファイルの名前のベースとなる文字列を入力してください
                </p>
              </div>
            </label>
            <input
              name="segment"
              type="string"
              placeholder="ファイルベース名"
              className="w-full border-2 input input-bordered input-primary"
            />

            {/* <!-- INCLUDESUFFIX? --> */}
            <label
              className="mt-2 label text-sfblue-300"
              htmlFor="includeSuffix"
            >
              <div>
                <span className="font-semibold">
                  💽 元のファイル名を残しますか？
                </span>
                <p className="text-xs">
                  元のファイル名を残す場合はチェックを入れてください
                </p>
              </div>
            </label>
            <input
              type="checkbox"
              className="toggle toggle-success"
              name="includeSuffix"
            />

            {/* <!-- INCLUDEGAKUNENHRHRNO? --> */}
            <label
              className="mt-2 label text-sfblue-300"
              htmlFor="includeGakunenHrHrNo"
            >
              <div>
                <span className="font-semibold">
                  🏫 学年、クラス、番号を入れますか？
                </span>
                <p className="text-xs">
                  学年、クラス、番号を入れる場合はチェックを入れてください
                </p>
              </div>
            </label>
            <input
              type="checkbox"
              className="toggle toggle-success"
              name="includeGakunenHrHrNo"
              defaultChecked={true}
            />

            {/* <!-- gakunenHrHrNoStart --> */}
            <label
              className="mt-2 label text-sfblue-300"
              htmlFor="gakunenHrHrNoStart"
            >
              <div>
                <span className="font-semibold">
                  🏫 学年、クラス、番号からファイル名をはじめますか？
                </span>
                <p className="text-xs">ex. J3_A40_9999999_聖学院太郎.pdf</p>
              </div>
            </label>
            <input
              type="checkbox"
              className="toggle toggle-success"
              name="gakunenHrHrNoStart"
              defaultChecked={true}
            />
          </div>

          {/* <!-- SEARCH BUTTON --> */}
          <SubmitButton
            actionValue="search"
            loading={isSearching}
            text="検索"
          />
        </div>
      </Form>
    </div>
  )
}
