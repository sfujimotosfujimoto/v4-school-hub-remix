import { CheckIcon, DriveLogo, RenewIcon, TimeIcon } from "~/components/icons"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { createURLFromId, dateFormat } from "~/lib/utils"

import type { DriveFile } from "~/types"

export default function MoveCards({
  driveFiles,
  size,
}: {
  size: "big" | "small"
  driveFiles: DriveFile[]
}) {
  // const { driveFiles } = useDriveFilesContext()

  return (
    <div className="relative">
      {/* <!-- NUMBER OF FILES --> */}
      {driveFiles?.length > 0 && (
        <div
          data-name="file count"
          className="absolute right-0 top-0 ml-1 flex gap-1"
        >
          <span className="text-md rounded-md bg-slate-300 px-2 py-1">
            {driveFiles?.length} files
          </span>

          <span className="text-md justify-content ml-2 flex items-center gap-1 rounded-md bg-slate-300 px-2 py-1">
            <CheckIcon className="h-3 w-3 font-bold" />
            {driveFiles?.filter((df) => df.meta?.selected === true).length}{" "}
          </span>
        </div>
      )}

      <article className="mx-auto max-w-5xl p-12">
        <div
          data-name="MoveCards.tsx"
          className="grid grid-cols-1 gap-4 pt-4 outline-sfgreen-200 md:grid-cols-2 xl:grid-cols-3"
        >
          {driveFiles &&
            driveFiles.map((d) => {
              if (d.parents && d.parents?.length > 0) {
                return <MoveCard key={d.id} driveFile={d} size={size} />
              } else {
                return null
              }
            })}
        </div>
      </article>
    </div>
  )
}

function MoveCard({
  driveFile,
  size = "big",
}: {
  driveFile: DriveFile
  size?: "big" | "small"
}) {
  const { driveFilesDispatch } = useDriveFilesContext()
  const selected = driveFile.meta?.selected

  return (
    <div className="relative">
      <article className="mx-auto max-w-5xl p-1">
        <div
          data-name="MoveCard"
          className={`card  shadow-lg transition-all duration-300 lg:card-side ${
            selected ? "bg-sfgreen-200" : "bg-slate-300"
          }`}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {
              console.log(
                "✅ components/move-cards.tsx ~ 	😀 input.check",
                selected,
              )
              driveFilesDispatch({
                type: "SET_CHECK",
                payload: { id: driveFile.id, checked: !selected },
              })
            }}
            className="checkbox-info checkbox checkbox-lg absolute -right-4 -top-4 border-none bg-slate-300 shadow-lg"
          />
          <div
            className={`card-body  ${
              size === "small" ? "p-4 sm:p-6" : "p-6 sm:p-10"
            }`}
          >
            <h2 className={`card-title ${size === "small" ? "text-sm" : ""}`}>
              {driveFile.name}
            </h2>

            <div className="flex items-center justify-center gap-2">
              <img
                src={driveFile.iconLink}
                alt="icon"
                width={5}
                height={5}
                className={` ${size === "small" ? "h-3 w-3" : "h-5 w-5"}`}
              />
              <p className={`${size === "small" ? "text-xs" : "text-sm"}`}>
                {driveFile.mimeType}
              </p>
            </div>

            {size === "big" && (
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <TimeIcon className="h-3 w-4" />
                  <span>{dateFormat(driveFile.createdTime || "") || ""}</span>
                </div>
                <div className="flex items-center gap-1">
                  <RenewIcon className="h-3 w-3" />
                  <span>{dateFormat(driveFile.modifiedTime || "") || ""}</span>
                </div>
              </div>
            )}

            {driveFile.meta?.studentFolder &&
              driveFile.meta?.destination &&
              size === "small" && (
                <div className="flex items-center gap-2 text-sm">
                  <div>
                    <h3 className="font-bold">TO:</h3>
                  </div>
                  <div className="rounded-md bg-sky-500 px-2 py-1 text-white">
                    <a
                      href={`https://drive.google.com/drive/u/1/folders/${driveFile.meta.studentFolder.folderId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <h3 className="text-xs">
                        {driveFile.meta.destination.name}
                      </h3>
                    </a>
                  </div>
                </div>
              )}
            <a
              href={createURLFromId(driveFile.parents?.at(0) || "")}
              target="_blank"
              className="btn btn-neutral btn-sm mt-1 w-24"
              rel="noreferrer"
            >
              <DriveLogo className="h-3 w-3" />
            </a>
          </div>
        </div>
      </article>
    </div>
  )
}
