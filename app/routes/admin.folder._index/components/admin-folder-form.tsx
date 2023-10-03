import React from "react"
import { SpinnerIcon } from "~/components/icons"
import { MoveTypeContext } from "~/context/move-type-context"
import { dateFormat } from "~/lib/utils"

import { Form } from "@remix-run/react"

import type { State } from "~/types"

export default function AdminFolderForm({ state }: { state: State }) {
  const { undoMoveType } = React.useContext(MoveTypeContext)
  return (
    <>
      <h1 data-name="Form H1" className="text-center text-3xl font-semibold">
        フォルダに移動
      </h1>

      <Form
        data-name="Form"
        method="POST"
        className="h-full space-y-4"
        encType="multipart/form-data"
      >
        <div className="flex flex-col gap-2 text-sftext-900 sm:gap-4">
          <div className="w-full">
            <label className="label" htmlFor="sourceFolderId">
              <div>
                <span className="text-sftext-900">移動元フォルダID</span>
                <p className="text-xs">
                  🗂️「移動元フォルダID」にあるファイルを生徒フォルダに移動をする
                </p>
                <p className="text-xs">
                  📄ファイルの先頭にある学籍番号を元に移動をする
                </p>
              </div>
            </label>

            {/* sourceFolderId input */}
            <input
              name="sourceFolderId"
              type="string"
              placeholder="移動元フォルダID"
              className="input input-bordered input-primary w-full"
            />
          </div>

          <div className="flex flex-col gap-4 sm:gap-8">
            <div className="w-full">
              <button
                name="_action"
                value="search"
                className={`btn btn-block shadow-md ${
                  state === "loading" ? "btn-disabled" : "btn-primary"
                }`}
              >
                {state === "loading" && (
                  <SpinnerIcon className="h-5 w-5 animate-spin" />
                )}
                検索
              </button>
            </div>
          </div>
        </div>

        <div className="w-full">
          <label className="label" htmlFor="jsonInput">
            <span className="label-text text-sftext-900">
              元に戻すJSONファイルを選択
            </span>
          </label>

          {/* `jsonInput` input */}
          <input
            name="jsonInput"
            type="file"
            accept="application/json"
            placeholder="JSONファイルを選択"
            className="file-input file-input-bordered file-input-success w-full"
          />
          <small>ex. SCHOOL-HUB_ファイル移動_23_06_02 21_47.json</small>
        </div>

        {/* undoMoveDataTime input */}
        <input
          type="hidden"
          name="undoMoveDataTime"
          value={undoMoveType?.data.time || ""}
        />

        {undoMoveType && (
          <h2 className="rounded-md bg-slate-200 px-2 py-1 text-center text-base font-bold">
            元に戻す時点：
            {dateFormat(new Date(undoMoveType.data.time).toLocaleString())}
          </h2>
        )}

        {/* call undo action */}
        <div className="flex flex-col gap-4 sm:gap-8">
          <div className="w-full">
            <button
              name="_action"
              value="undo"
              className={` btn btn-block shadow-md ${
                state === "loading" ? "btn-disabled" : "btn-warning"
              }`}
            >
              {state === "loading" && (
                <SpinnerIcon className="h-5 w-5 animate-spin" />
              )}
              元に戻す
            </button>
          </div>
        </div>
      </Form>
    </>
  )
}
