import { Form, useNavigation } from "@remix-run/react"
import React from "react"
import { LoadingIcon } from "~/components/icons"
import { parseCsvObjToDriveFileMove, readCsvFileToObj } from "~/lib/csv"

export default function CsvUndoFileInput() {
  // const taskType = "move"
  const dialogEl = React.useRef<HTMLDialogElement>(null)
  const { state, formData } = useNavigation()
  // const [file, setFile] = React.useState<File | null>(null)
  const [driveFilesString, setDriveFilesString] = React.useState("")

  const isUndo =
    state === "submitting" && formData?.get("intent") === "undo-csv"

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // setFile(e.target.files?.[0] || null)

    const file = e.target.files?.[0]
    if (!file || file.size === 0) return
    const data = await readCsvFileToObj(file)
    const df = parseCsvObjToDriveFileMove(data)
    const dString = JSON.stringify(df)
    setDriveFilesString(dString)

    if (dialogEl.current) dialogEl.current.showModal()
  }

  function handleInputClick(e: React.MouseEvent<HTMLInputElement>) {
    e.currentTarget.files = null
  }

  return (
    <>
      <div className="p-4 text-white rounded-lg bg-slate-500">
        <Form
          data-name="Form"
          className="space-y-4"
          encType="multipart/form-data"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* <!-- FILE INPUT --> */}
          <div className="w-full">
            <label className="label" htmlFor="jsonInput">
              <h2 className="font-semibold text-white label-text">
                🖌️ 元に戻すCSVファイルを選択
              </h2>
            </label>

            <input
              onClick={handleInputClick}
              onChange={handleChange}
              name="jsonInput"
              type="file"
              accept=".csv, application/json"
              placeholder="CSVファイルを選択"
              className="w-full border-2 file-input file-input-bordered file-input-success text-sfblue-300"
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
              name="driveFilesString"
              value={driveFilesString}
            />

            <button
              type="submit"
              name="intent"
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
