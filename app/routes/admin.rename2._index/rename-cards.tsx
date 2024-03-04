import { RenewIcon, TimeIcon } from "~/components/icons"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { dateFormat } from "~/lib/utils/utils"
import type { DriveFile } from "~/types"

export default function RenameCards({
  driveFiles,
  size,
}: {
  size: "small" | "big"
  driveFiles: DriveFile[]
}) {
  return (
    <div className="relative">
      {/* <!-- NUMBER OF FILES --> */}
      {driveFiles?.length > 0 && (
        <div
          data-name="file count"
          className="absolute top-0 right-0 flex gap-1 ml-1"
        >
          <span className="px-2 py-1 rounded-md text-md bg-slate-300">
            {driveFiles?.length} files
          </span>

          <span className="flex items-center gap-1 px-2 py-1 ml-2 rounded-md text-md justify-content bg-slate-300">
            {driveFiles?.filter((df) => df.meta?.selected === true).length}{" "}
            selected
          </span>
        </div>
      )}
      <article className="max-w-5xl p-12 mx-auto">
        <div
          data-name="ReanmeCards.tsx"
          className="grid grid-cols-1 gap-4 pt-4 outline-sfgreen-400 md:grid-cols-2 xl:grid-cols-3"
        >
          {driveFiles &&
            driveFiles.map((d) => {
              if (d.parents && d.parents?.length > 0) {
                return <RenameCard key={d.id} driveFile={d} size={size} />
              } else {
                return null
              }
            })}
        </div>
      </article>
    </div>
  )
}

function RenameCard({
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
      <article className="max-w-5xl p-1 mx-auto">
        <div
          data-name="RenameCard"
          className={`card  shadow-lg transition-all duration-300 lg:card-side ${
            selected ? "bg-sfgreen-400" : "bg-slate-300"
          }`}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() =>
              driveFilesDispatch({
                type: "SET_CHECK",
                payload: { id: driveFile.id, checked: !selected },
              })
            }
            className="absolute border-none shadow-lg checkbox-info checkbox checkbox-lg -right-4 -top-4 bg-slate-300"
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
                  <TimeIcon className="w-4 h-3" />
                  <span>
                    {dateFormat(
                      driveFile.createdTime
                        ? driveFile.createdTime.toISOString()
                        : "",
                    ) || ""}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <RenewIcon className="w-3 h-3" />
                  <span>
                    {dateFormat(
                      driveFile.modifiedTime
                        ? driveFile.modifiedTime.toISOString()
                        : "",
                    ) || ""}
                  </span>
                </div>
              </div>
            )}

            {driveFile.meta?.file && size === "small" && (
              <div className="flex items-center gap-2 text-sm">
                <div>
                  <h3 className="font-bold">NEW NAME:</h3>
                </div>
                <div className="px-2 py-1 text-white rounded-md bg-sky-500">
                  <a
                    href={driveFile.meta.studentFolder?.folderLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <h3 className="text-xs">{driveFile.meta.file.name}</h3>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
