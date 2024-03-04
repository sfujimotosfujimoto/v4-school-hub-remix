import React from "react"
import toast from "react-hot-toast"
import { Form, useNavigation } from "@remix-run/react"

import { useDriveFilesContext } from "~/context/drive-files-context"
import { parseCsvObjToDriveFileRename, readCsvFileToObj } from "~/lib/csv"

// fileInputText: 🖌️ 変更するCSVファイルを選択
// buttonText: 変更する
// dialogText: これらのファイル名を変更しますか？
// bgColor: bg-slate-200

export default function CsvFileInput({
  fileInputText,
  fileInputTextColor = "text-base",
  buttonText,
  dialogText,
  bgColor,
  actionValue,
}: {
  fileInputText: string
  fileInputTextColor?: string
  buttonText: string
  dialogText: string
  bgColor: string
  actionValue: "execute" | "undo"
}) {
  const { state, formData } = useNavigation()
  const isExecuting =
    state === "submitting" && formData?.get("intent") === "execute"
  const { driveFiles, driveFilesDispatch } = useDriveFilesContext()

  const [file, setFile] = React.useState<File | null>(null)

  React.useEffect(() => {
    if (!file) return
    async function setCsv(file: File) {
      const data = await readCsvFileToObj(file)
      const dfs = parseCsvObjToDriveFileRename(data)
      driveFilesDispatch({
        type: "SET",
        payload: {
          driveFiles: dfs,
        },
      })
    }
    const data = async () => {
      await setCsv(file)
    }

    data().catch((e) => {
      console.error(e)
      toast.error(e)
    })
  }, [file, driveFilesDispatch])

  const dialogEl1 = React.useRef<HTMLDialogElement>(null)
  React.useEffect(() => {
    if (!isExecuting) {
      dialogEl1.current?.close()
    }
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (dialogEl1.current !== null) dialogEl1.current.close()
  }

  return (
    <div className={`rounded-lg  p-4 ${bgColor}`}>
      <form
        data-name="Form"
        className="space-y-4"
        encType="multipart/form-data"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* <!-- FILE INPUT --> */}
        <div className={`w-full ${fileInputTextColor}`}>
          <label className="label" htmlFor="jsonInput">
            <h2 className={`label-text font-semibold text-inherit`}>
              {fileInputText}
            </h2>
          </label>

          <input
            onChange={(e) => {
              setFile(null)
              setFile((prev) => e.target.files?.[0] || null)
            }}
            name="jsonInput"
            type="file"
            accept=".csv, application/json"
            placeholder="CSVファイルを選択"
            className={`file-input file-input-bordered file-input-success w-full border-2 text-sfblue-300`}
          />
          <small>ex. SCHOOL-HUB_RENAME_1689827123771.csv</small>

          <div className="w-full mt-2">
            <button
              onClick={() => {
                if (dialogEl1.current !== null) dialogEl1.current.showModal()
              }}
              className={`btn btn-primary btn-block  shadow-md ${
                file ? "" : "btn-disabled"
              }`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </form>
      <dialog id="my_modal" className="modal" ref={dialogEl1}>
        <Form className="modal-box" method="POST" onSubmit={handleSubmit}>
          <p className="py-4">{dialogText}</p>

          <input
            type="hidden"
            name="driveFilesString"
            value={JSON.stringify(driveFiles)}
          />

          <button
            type="submit"
            name="intent"
            value={actionValue}
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
