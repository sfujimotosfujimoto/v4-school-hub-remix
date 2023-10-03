import type { DriveFile, MoveType, State } from "~/types"

import React from "react"
import { SpinnerIcon } from "~/components/icons"
import { MoveTypeContext } from "~/context/move-type-context"

import { Form } from "@remix-run/react"

import type { drive_v3 } from "googleapis"

export default function AdminConfirmForm({
  driveFileData,
  sourceFolder,
  undoMoveDataTime,
  state,
}: {
  driveFileData: DriveFile[] | null
  sourceFolder: drive_v3.Schema$File | null
  undoMoveDataTime: string | null
  state: State
}) {
  const { getAllItems, setItem } = React.useContext(MoveTypeContext)

  const [, setMoveTypes] = React.useState<MoveType[] | null>(null)

  React.useEffect(() => {
    const tmp = getAllItems()
    if (tmp) setMoveTypes(tmp)
  }, [getAllItems])

  function onSubmit() {
    if (driveFileData) {
      // clear old driveFileData
      setItem(driveFileData)
    }
  }

  return (
    <>
      <h1
        data-name="Form H1"
        className="mb-8 text-center text-3xl font-semibold"
      >
        {sourceFolder ? "ファイルを移動しますか？" : "元に戻しますか？"}
      </h1>

      <Form
        onSubmit={onSubmit}
        data-name="Form"
        method="POST"
        className="h-full space-y-4"
      >
        <div className="flex flex-col gap-2 sm:gap-4">
          {sourceFolder && (
            <>
              <div className="w-full">
                <label className="label" htmlFor="sourceFolderId">
                  <span className="label-text text-base">移動元フォルダID</span>
                </label>
                <input
                  name="sourceFolderId"
                  type="string"
                  placeholder="移動元フォルダID"
                  className="input input-primary w-full !cursor-default select-none"
                  onChange={(e) => sourceFolder.id || e.target.value}
                  value={sourceFolder.id || ""}
                />
              </div>
              <div className="mt-2 flex cursor-default items-center justify-start p-1">
                <p>フォルダ名：</p>
                <p className="rounded-md bg-sky-300 px-2 py-1 text-sm">
                  {sourceFolder.name}
                </p>
              </div>
              <div className="w-full">
                <button
                  name="_action"
                  value="move"
                  className={`btn btn-block shadow-md ${
                    state === "loading" ? "btn-disabled" : "btn-warning"
                  }`}
                >
                  {state === "loading" && (
                    <SpinnerIcon className="h-5 w-5 animate-spin" />
                  )}
                  実行
                </button>
              </div>
            </>
          )}

          {undoMoveDataTime && (
            <>
              <input
                type="hidden"
                name="moveData"
                value={JSON.stringify(driveFileData)}
              />

              <div className="w-full">
                <button
                  name="_action"
                  value="undo"
                  className={`btn btn-warning btn-block shadow-md`}
                >
                  元に戻す
                </button>
              </div>
            </>
          )}
        </div>
      </Form>
    </>
  )
}
