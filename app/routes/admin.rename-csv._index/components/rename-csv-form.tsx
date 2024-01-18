import { Form, useNavigation } from "@remix-run/react"
import React from "react"
import SubmitButton from "~/components/ui/buttons/submit-button"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { convertDriveFileToCsv } from "~/lib/csv"
import type { DriveFile } from "~/types"
import CsvFileInput from "./csv-file-input"

/**
 * RenameCsvForm
 */
export default function RenameCsvForm() {
  const { state, formData } = useNavigation()
  const { driveFiles } = useDriveFilesContext()

  const isSearching =
    state === "submitting" && formData?.get("intent") === "search"

  const [csv, setCsv] = React.useState("")
  const [blob, setBlob] = React.useState<Blob | null>(null)

  React.useEffect(() => {
    if (!driveFiles) return
    const csvString = convertDriveFileToCsv(driveFiles, "rename")
    if (csvString) setCsv(csvString)
    setBlob(new Blob([csv], { type: "text/csv" }))
  }, [driveFiles, setCsv, setBlob, csv])

  return (
    <div className="grid grid-cols-1 place-content-center">
      <h1
        data-name="RenameCsvForm.tsx h1"
        className="text-center text-3xl font-semibold underline decoration-sfred-200 underline-offset-4"
      >
        👨🏻‍💻 CSVファイルで名前を変更
      </h1>

      <Form
        data-name="RenameCsvForm.tsx form"
        method="POST"
        className="h-full space-y-4"
      >
        <div className="flex flex-col gap-2 text-sfblue-300 sm:gap-4">
          {/* SOURCEFOLDERID INPUT GROUP */}
          <div className="w-full">
            {/* SOURCEFOLDERID LABEL */}
            <label className="label text-sfblue-300" htmlFor="sourceFolderId">
              <div>
                <span className="font-semibold">🗂️ 変更元フォルダID</span>
                <p className="text-xs">
                  「変更元フォルダID」にあるファイルの名前を変更する
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
              className="input input-bordered input-primary w-full border-2 text-sfblue-300"
              required
              maxLength={300}
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

      {/* DOWNLOAD CSV */}
      <DownloadLink driveFiles={driveFiles} blob={blob} />

      <div className="divider"></div>

      <CsvFileInput
        fileInputText={`🖌️ 変更するCSVファイルを選択`}
        buttonText={`変更する`}
        dialogText={`これらのファイル名を変更しますか？`}
        bgColor={`bg-slate-200`}
        actionValue="execute"
      />

      <div className="divider"></div>
      <CsvFileInput
        fileInputText={`🌀 元に戻すCSVファイルを選択`}
        fileInputTextColor="text-white"
        buttonText={`元に戻す`}
        dialogText={`元に戻しますか？`}
        bgColor={`bg-slate-500`}
        actionValue="undo"
      />
    </div>
  )
}

function DownloadLink({
  driveFiles,
  blob,
}: {
  driveFiles?: DriveFile[]
  blob?: Blob | null
}) {
  if (!driveFiles || driveFiles.length === 0 || !blob) return null
  return (
    <div className="my-4 flex flex-col">
      <div className="mb-4">
        <h2
          data-name="Form H1"
          className="text-base font-semibold text-sfblue-300"
        >
          🗂️ 名前変更用CSVファイルをダウンロード
        </h2>
        <small>
          手動で名前を変更する場合は<span className="px-1 font-bold">name</span>
          列に変更する名前を入力
        </small>
      </div>
      <a
        className="btn btn-primary"
        onClick={(e) => e.stopPropagation()}
        href={URL.createObjectURL(blob)}
        download={`SCHOOL-HUB_RENAME_${Date.now()}.csv`}
      >
        Download
      </a>
    </div>
  )
}
