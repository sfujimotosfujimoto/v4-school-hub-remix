import type { DriveFile } from "~/type.d"
import { useDriveFilesContext } from "~/context/drive-files-context"

export default function Segments({
  baseDriveFiles,
  extensions,
  segments,
}: {
  baseDriveFiles: DriveFile[]
  extensions: string[]
  segments: string[]
}) {
  const { driveFilesDispatch } = useDriveFilesContext()

  return (
    <div className="mt-4">
      <div className={`flex flex-wrap gap-2`}>
        <span
          onClick={() =>
            driveFilesDispatch({
              type: "SET",
              payload: { driveFiles: baseDriveFiles },
            })
          }
          key="ALL"
          className={`btn btn-xs border-none bg-sfred-200 shadow-md duration-200 hover:-translate-y-[1px] hover:bg-sfred-300`}
        >
          ALL
        </span>
        {extensions &&
          extensions.sort().map((ext, idx) => (
            <span
              onClick={() => {
                driveFilesDispatch({
                  type: "UPDATE_META_SELECTED",
                  payload: { selected: true },
                })
                driveFilesDispatch({
                  type: "FILTER_BY_EXTENSION",
                  payload: { extension: ext, driveFiles: baseDriveFiles },
                })
              }}
              key={idx}
              className={`btn btn-xs border-none bg-sky-300 shadow-md duration-200 hover:-translate-y-[1px] hover:bg-sky-400`}
            >
              {ext}
            </span>
          ))}
        {segments &&
          segments.sort().map((segment, idx) => (
            <span
              onClick={() =>
                driveFilesDispatch({
                  type: "FILTER_BY_SEGMENT",
                  payload: { segment, driveFiles: baseDriveFiles },
                })
              }
              key={idx}
              className={`btn btn-warning btn-xs border-none shadow-md duration-200 hover:-translate-y-[1px] hover:bg-sfyellow-200`}
            >
              {segment}
            </span>
          ))}
      </div>
    </div>
  )
}
