import React from "react"
import { TimeIcon } from "~/components/icons"
import { convertDriveFileToCsv } from "~/lib/csv"
import { dateFormat } from "~/lib/utils"

import { Form, useNavigation } from "@remix-run/react"

import { useLoadingModal } from "../loading-modal"

import type { Task } from "~/type.d"

/**
 * TaskCard
 */
export default function TaskCard({ task }: { task: Task }) {
  const dialogEl = React.useRef<HTMLDialogElement>(null)

  const { state } = useNavigation()

  const isSubmitting = state === "submitting"

  useLoadingModal(isSubmitting)

  const [blob, setBlob] = React.useState<Blob | null>(null)
  const [csv, setCsv] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (task.driveFiles && task.driveFiles.length > 0) {
      const csvData = convertDriveFileToCsv(task.driveFiles, task.type)
      if (csvData) {
        setCsv(csvData)
      }
      if (csv) {
        const blobData = new Blob([csv], {
          type: "text/csv",
        })
        if (blobData) setBlob(blobData)
      }
    }
  }, [csv, task.driveFiles, task.type])

  return (
    <>
      <article data-name="TaskCard" slot="content" className="relative">
        <div
          className={`card bg-slate-500 text-white shadow-lg transition-all duration-500 lg:card-side hover:-translate-y-1  hover:bg-slate-600 ${
            isSubmitting && "bg-slate-400"
          }`}
          onClick={(e) => {
            e.stopPropagation()
            if (dialogEl.current !== null) dialogEl.current.showModal()
          }}
          role="button"
          tabIndex={0}
        >
          <div className={`card-body p-2  sm:p-4`}>
            <h2 className={`card-title text-sm`}>
              <span>{task.type.toUpperCase()}</span>
              <slot name="card-title" />
              <slot name="sub-name" />
            </h2>

            <div className="flex items-center gap-2 text-sm">
              <TimeIcon className="h-3 w-4" />
              <span>
                {dateFormat(
                  new Date(task.time).toLocaleString("ja-JP", {
                    timeZone: "Asia/Tokyo",
                  }),
                ) || ""}
              </span>
              <span>
                {task.driveFiles ? task.driveFiles.length : 0}{" "}
                {task.driveFiles && task.driveFiles.length === 1
                  ? "file"
                  : "files"}
              </span>
            </div>
          </div>
        </div>
        {task && blob && (
          <div className="absolute -right-1 -top-1 rounded-md bg-sky-500 px-2 py-1 font-medium text-white shadow-md transition-all hover:-translate-y-[2px] hover:bg-sky-600">
            <a
              onClick={(e) => e.stopPropagation()}
              href={URL.createObjectURL(blob)}
              download={`SCHOOL-HUB_${task.type.toUpperCase()}_${
                task.time
              }.csv`}
            >
              Download
            </a>
          </div>
        )}
      </article>
      <dialog id="my_modal_2" className="modal" ref={dialogEl}>
        <Form method="POST" className="modal-box">
          <input
            type="hidden"
            name="driveFilesString"
            value={JSON.stringify(task.driveFiles)}
          />
          <p slot="dialog-message" className="py-4">
            ファイルを元に戻しますか？
          </p>

          <button
            name="_action"
            value="undo"
            className="btn btn-warning btn-sm w-32"
            onClick={() => {
              if (dialogEl.current) dialogEl.current.close()
            }}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm "></span>
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
