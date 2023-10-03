import React from "react"
import { LoadingIcon } from "~/components/icons"
import { parseCsvObjToDriveFileMove, readCsvFileToObj } from "~/lib/csv"

import { Form, useNavigation } from "@remix-run/react"

export default function CsvUndoFileInput() {
  // const taskType = "move"
  const dialogEl = React.useRef<HTMLDialogElement>(null)
  const { state, formData } = useNavigation()
  // const [file, setFile] = React.useState<File | null>(null)
  const [driveFileMovesString, setDriveFileMovesString] = React.useState("")

  const isUndo =
    state === "submitting" && formData?.get("_action") === "undo-csv"

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // setFile(e.target.files?.[0] || null)

    const file = e.target.files?.[0]
    if (!file || file.size === 0) return
    const data = await readCsvFileToObj(file)
    const df = parseCsvObjToDriveFileMove(data)
    const dString = JSON.stringify(df)
    setDriveFileMovesString(dString)

    if (dialogEl.current) dialogEl.current.showModal()
  }

  return (
    <>
      <div className="rounded-lg bg-slate-500 p-4 text-white">
        <Form
          data-name="Form"
          className="space-y-4"
          encType="multipart/form-data"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* <!-- FILE INPUT --> */}
          <div className="w-full">
            <label className="label" htmlFor="jsonInput">
              <h2 className="label-text font-semibold text-white">
                🖌️ 元に戻すCSVファイルを選択
              </h2>
            </label>

            <input
              onChange={handleChange}
              name="jsonInput"
              type="file"
              accept=".csv, application/json"
              placeholder="CSVファイルを選択"
              className="file-input file-input-bordered file-input-success w-full border-2 text-sfblue-300"
            />
            <small>ex. SCHOOL-HUB_MOVE_1689827123771.csv</small>
          </div>
        </Form>
        <dialog id="my_modal" className="modal" ref={dialogEl}>
          <Form method="POST" className="modal-box">
            <p slot="dialog-message" className="py-4 text-sfblue-300">
              元に戻しますか？
            </p>

            <input
              type="hidden"
              name="driveFileMovesString"
              value={driveFileMovesString}
            />

            <button
              name="_action"
              value="undo-csv"
              className={`btn btn-warning btn-sm w-24 ${
                isUndo ? "btn-disabled !bg-slate-300" : "btn-primary"
              }`}
              onClick={() => {
                if (dialogEl.current) dialogEl.current.close()
              }}
            >
              {isUndo ? <LoadingIcon size={4} /> : "実行"}
            </button>
          </Form>
          <form method="dialog" className="modal-backdrop">
            <button>閉じる</button>
          </form>
        </dialog>
      </div>
    </>
  )
}
