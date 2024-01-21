import type { DriveFile } from "~/types"

export default function FileCount({
  driveFiles,
}: {
  driveFiles?: DriveFile[] | null
}) {
  return (
    <>
      {driveFiles && (
        <div data-name="file count" className="ml-1 inline-block">
          <span className="text-md rounded-md bg-slate-300 px-2 py-1">
            {driveFiles.length} files
          </span>
        </div>
      )}
    </>
  )
}
